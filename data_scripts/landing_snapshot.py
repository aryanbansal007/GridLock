"""
Extract the small, real data snapshot the public landing page renders its product
previews from (frontend/src/pages/landing/snapshot.json).

The landing page is the logged-out entry point, so it should not download megabytes of
per-driver telemetry just to draw a few illustrations. This script takes one historical
session that is already generated in gridlock-data and boils it down to a few dozen KB:
a rotated track outline, two drivers' fastest-lap traces on a shared distance axis, one
lap of real car positions for a short replay loop, tyre stints and lap times. Every
number comes from the generated session files; nothing is invented or smoothed beyond
resampling.

    python landing_snapshot.py --data ../gridlock-data --year 2026 --gp italian_grand_prix \
        --round 13 --rotation 95 --a ANT --b RUS --replay-lap 20 \
        --out ../frontend/src/pages/landing/snapshot.json
"""

import argparse
import json
import math
import os

import numpy as np

GRID_POINTS = 240       # samples along a lap for the comparison traces
OUTLINE_POINTS = 360    # track outline points after downsampling
REPLAY_STEP_S = 0.6     # replay frame spacing (source data is 0.3s)
REPLAY_CARS = 8
MINI_SECTORS = 24


def load(path):
    with open(path) as f:
        return json.load(f)


def rotate(x, y, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    x, y = np.asarray(x, float), np.asarray(y, float)
    return x * c - y * s, x * s + y * c


def lap_slice(drv, lap):
    lapnums = np.array(drv["lap"])
    idx = np.flatnonzero(lapnums == lap)
    return idx[0], idx[-1] + 1


def resample_lap(drv, lap, grid):
    """One lap's channels resampled onto a shared in-lap distance grid (metres)."""
    a, b = lap_slice(drv, lap)
    dist = np.array(drv["dist"][a:b], float)
    order = np.argsort(dist, kind="stable")
    dist = dist[order]
    keep = np.concatenate([[True], np.diff(dist) > 0])
    dist = dist[keep]

    def ch(name, dtype=float):
        return np.array(drv[name][a:b], dtype=dtype)[order][keep]

    t = ch("t")
    out = {
        "t": np.interp(grid, dist, t - t[0]),
        "speed": np.interp(grid, dist, ch("speed")),
        "throttle": np.interp(grid, dist, np.clip(ch("throttle"), 0, 100)),
        # Discrete channels: nearest sample at or before each grid point.
        "brake": ch("brake", float)[np.clip(np.searchsorted(dist, grid, "right") - 1, 0, len(dist) - 1)],
        "gear": ch("gear")[np.clip(np.searchsorted(dist, grid, "right") - 1, 0, len(dist) - 1)],
        "x": np.interp(grid, dist, ch("x")),
        "y": np.interp(grid, dist, ch("y")),
    }
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--gp", required=True)
    p.add_argument("--round", type=int, required=True)
    p.add_argument("--rotation", type=float, default=0.0)
    p.add_argument("--a", required=True)
    p.add_argument("--b", required=True)
    p.add_argument("--replay-lap", type=int, required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args()

    base = os.path.join(args.data, str(args.year), args.gp, "R")
    track = load(os.path.join(base, "track.json"))
    laps = load(os.path.join(base, "laps.json"))
    conditions = load(os.path.join(base, "conditions.json"))["conditions"]
    results = load(os.path.join(args.data, "session_results", str(args.year), str(args.round), "R.json"))
    drivers = {k: load(os.path.join(base, "drivers", f"{k}.json")) for k in laps}

    # ── shared frame: rotate to the standard orientation, then fit a 1000-wide box ──
    ox = np.array([p_["x"] for p_ in track["track_outline"]])
    oy = np.array([p_["y"] for p_ in track["track_outline"]])
    rx, ry = rotate(ox, oy, args.rotation)
    x0, x1, y0, y1 = rx.min(), rx.max(), ry.min(), ry.max()
    scale = 1000.0 / max(x1 - x0, y1 - y0)
    width, height = (x1 - x0) * scale, (y1 - y0) * scale

    def to_view(x, y):
        x, y = rotate(x, y, args.rotation)
        # SVG y grows downward
        return np.round((x - x0) * scale, 1), np.round((y1 - y) * scale, 1)

    step = max(1, len(ox) // OUTLINE_POINTS)
    vx, vy = to_view(ox[::step], oy[::step])
    outline = [[float(a), float(b)] for a, b in zip(vx, vy)]

    # ── fastest-lap comparison on a shared distance axis ──
    a_lap = laps[args.a]["fastest_lap"]["lap_number"]
    b_lap = laps[args.b]["fastest_lap"]["lap_number"]
    lap_len = float(track["avg_lap_length"])
    grid = np.linspace(0, lap_len * 0.995, GRID_POINTS)
    A = resample_lap(drivers[args.a], a_lap, grid)
    B = resample_lap(drivers[args.b], b_lap, grid)
    delta = B["t"] - A["t"]  # positive = B behind A at that distance

    # Heavy braking zones from the data itself (where A's brake is on and speed bottoms out),
    # used as distance markers instead of corner numbers OpenF1 does not provide.
    brake_zones = []
    on = A["brake"] > 0
    i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            k = i + int(np.argmin(A["speed"][i:j + 3 if j + 3 < len(on) else len(on)]))
            if A["speed"][i] - A["speed"][k] > 45:
                brake_zones.append({"d": round(float(grid[k])), "v": int(A["speed"][k])})
            i = j
        else:
            i += 1

    # Driving-state segments for A's lap, same categories the Analysis strip uses.
    def state(k):
        if A["brake"][k] > 0:
            return "brake"
        if A["throttle"][k] >= 98:
            return "full"
        if A["throttle"][k] < 10:
            return "coast"
        return "partial"

    segs = []
    for k in range(len(grid)):
        s = state(k)
        if segs and segs[-1]["s"] == s:
            segs[-1]["to"] = round(float(grid[k]))
        else:
            segs.append({"s": s, "from": round(float(grid[k])), "to": round(float(grid[k]))})

    # Mini-sector dominance along A's own lap path.
    path_x, path_y = to_view(A["x"], A["y"])
    edges = np.linspace(0, len(grid) - 1, MINI_SECTORS + 1).astype(int)
    dominance = []
    for s0, s1 in zip(edges[:-1], edges[1:]):
        ta = A["t"][s1] - A["t"][s0]
        tb = B["t"][s1] - B["t"][s0]
        dominance.append({"from": int(s0), "to": int(s1), "faster": args.a if ta <= tb else args.b,
                          "gain": round(abs(ta - tb), 3)})

    # ── replay: one lap of real positions for the leading cars ──
    leader = results["results"][0]["abbreviation"]
    la, lb = lap_slice(drivers[leader], args.replay_lap)
    t_start = drivers[leader]["t"][la]
    t_end = drivers[leader]["t"][lb - 1]
    frames_t = np.arange(t_start, t_end, REPLAY_STEP_S)

    order_at_start = []
    for code, d in drivers.items():
        t = np.array(d["t"])
        if t[0] > t_start or t[-1] < t_end:
            continue
        cd = np.interp(t_start, t, d["cumulative_distance"])
        order_at_start.append((cd, code))
    order_at_start.sort(reverse=True)
    replay_codes = [c for _, c in order_at_start[:REPLAY_CARS]]

    replay = {"t0": round(float(t_start), 2), "step": REPLAY_STEP_S, "lap": args.replay_lap, "cars": []}
    for code in replay_codes:
        d = drivers[code]
        t = np.array(d["t"])
        xs, ys = to_view(np.interp(frames_t, t, d["x"]), np.interp(frames_t, t, d["y"]))
        cdist = np.interp(frames_t, t, d["cumulative_distance"])
        idx = int(np.searchsorted(t, t_start))
        replay["cars"].append({
            "code": code,
            "color": d["team_color"],
            "compound": d["compound"][idx],
            "xy": [v for pair in zip(xs.tolist(), ys.tolist()) for v in pair],
            "cd": np.round(cdist, 0).astype(int).tolist(),
        })

    k = min(range(len(conditions)), key=lambda i: abs(conditions[i]["t"] - t_start))
    weather = {key: conditions[k][key] for key in ("air_temp", "track_temp", "humidity", "wind_speed")}

    # ── strategy: stints and lap times for the top ten finishers ──
    strategy = []
    for r in results["results"][:10]:
        code = r["abbreviation"]
        stints = []
        for l in laps.get(code, {}).get("laps", []):
            if stints and stints[-1]["c"] == l["compound"] and stints[-1]["s"] == l["stint"]:
                stints[-1]["to"] = l["lap"]
            else:
                stints.append({"c": l["compound"], "s": l["stint"], "from": l["lap"], "to": l["lap"]})
        strategy.append({"code": code, "pos": r["position"], "grid": r.get("grid"),
                         "color": "#" + r["team_color"],
                         "stints": [{"c": s["c"], "from": s["from"], "to": s["to"]} for s in stints]})

    # Track status per lap of the race, from the leader's lap boundaries: the most severe
    # state seen during that lap (for the race timeline).
    severity = ["clear", "yellow", "vsc_ending", "vsc", "safety_car", "red"]
    ld = drivers[leader]
    lt, ll = np.array(ld["t"]), np.array(ld["lap"])
    ct = np.array([c["t"] for c in conditions])
    lap_status = []
    for n in range(1, int(track["total_laps"]) + 1):
        idx = np.flatnonzero(ll == n)
        if not len(idx):
            lap_status.append("clear")
            continue
        sel = (ct >= lt[idx[0]]) & (ct <= lt[idx[-1]])
        seen = {conditions[i]["flag"] for i in np.flatnonzero(sel)}
        lap_status.append(max(seen, key=severity.index) if seen else "clear")

    def lap_series(code):
        return [[l["lap"], l["lap_time_s"]] for l in laps[code]["laps"]]

    snap = {
        "session": {
            "year": args.year, "round": args.round, "name": results["event_name"],
            "session": "Race", "total_laps": track["total_laps"], "lap_length_m": round(lap_len),
            "winner": leader, "fastest_lap": results["fastest_lap"],
        },
        "view": {"w": round(float(width), 1), "h": round(float(height), 1)},
        "outline": outline,
        "compare": {
            "a": {"code": args.a, "lap": a_lap, "lap_time": laps[args.a]["fastest_lap"]["lap_time_s"],
                  "color": drivers[args.a]["team_color"], "name": drivers[args.a]["full_name"]},
            "b": {"code": args.b, "lap": b_lap, "lap_time": laps[args.b]["fastest_lap"]["lap_time_s"],
                  "color": drivers[args.b]["team_color"], "name": drivers[args.b]["full_name"]},
            "dist": np.round(grid).astype(int).tolist(),
            "speedA": np.round(A["speed"]).astype(int).tolist(),
            "speedB": np.round(B["speed"]).astype(int).tolist(),
            "throttleA": np.round(A["throttle"]).astype(int).tolist(),
            "throttleB": np.round(B["throttle"]).astype(int).tolist(),
            "brakeA": (A["brake"] > 0).astype(int).tolist(),
            "brakeB": (B["brake"] > 0).astype(int).tolist(),
            "gearA": A["gear"].astype(int).tolist(),
            "delta": np.round(delta, 3).tolist(),
            "brakeZones": brake_zones,
            "states": segs,
            "path": [v for pair in zip(path_x.tolist(), path_y.tolist()) for v in pair],
            "dominance": dominance,
        },
        "replay": replay,
        "weather": weather,
        "strategy": strategy,
        "lapTimes": {args.a: lap_series(args.a), args.b: lap_series(args.b)},
        "lapStatus": lap_status,
    }
    with open(args.out, "w") as f:
        json.dump(snap, f, separators=(",", ":"))
    print(f"wrote {args.out} ({os.path.getsize(args.out) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
