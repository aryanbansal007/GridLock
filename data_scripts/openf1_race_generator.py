"""
Grid-Lock: OpenF1 Telemetry Generator
=====================================
Drop-in replacement for full_race_generator.py's data source. Formula 1 put its
livetiming feed (what FastF1 reads) behind an F1TV login in October 2026; OpenF1
(https://openf1.org) serves the same raw material for free and without a login, so
this script rebuilds the exact same output files from it:

    {output-dir}/{year}/{gp}/{session}/drivers/<ABBR>.json, drivers/index.json,
    track.json, laps.json, conditions.json

The files are written by the existing writers in full_race_generator.py, so the
format cannot drift from what the frontend already reads. Only the loading differs:

  - OpenF1 has no Distance channel. FastF1's own Distance is just speed integrated
    over time, restarted each lap, so it is rebuilt here the same way.
  - OpenF1 samples position and car data at ~3.7 Hz on an uneven clock. Both are
    resampled onto the shared 300ms master timeline with the same rules as before
    (linear inside gaps of <= 2s, hold the last value across longer ones).
  - OpenF1 has no corner list, so `corners` is empty (it was already empty whenever
    FastF1 had no circuit info).
  - OpenF1 does not mark "accurate" laps. is_accurate here means: timed, not an
    in/out lap, not lap 1, and the track was green for the whole lap.

Race and Sprint sessions only. Qualifying needs Q1/Q2/Q3 windows that OpenF1 does not
expose in the same way.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime

import numpy as np
import requests

from full_race_generator import (
    status_at_time,
    weather_at_time,
    write_conditions_file,
    write_driver_files,
    write_laps_file,
    write_track_file,
)

API = "https://api.openf1.org/v1"
SESSION_NAMES = {"R": "Race", "S": "Sprint", "Q": "Qualifying", "SQ": "Sprint Qualifying",
                 "FP1": "Practice 1", "FP2": "Practice 2", "FP3": "Practice 3"}
MAX_GAP_SECONDS = 2.0
MIN_OUTLINE_POINTS = 200
# OpenF1's free tier is rate limited; stay well under it and back off when told to.
REQUEST_PAUSE_S = 0.4


class OpenF1:
    """Thin GET wrapper with an on-disk response cache so a rerun (or a later change
    to this script) doesn't refetch ~15MB per driver."""

    def __init__(self, cache_dir):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def get(self, endpoint, **params):
        key = hashlib.sha1(
            (endpoint + json.dumps(params, sort_keys=True)).encode()
        ).hexdigest()
        path = os.path.join(self.cache_dir, f"{endpoint}_{key[:16]}.json")
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)

        for attempt in range(8):
            time.sleep(REQUEST_PAUSE_S)
            r = requests.get(f"{API}/{endpoint}", params=params, timeout=120)
            if r.status_code == 200:
                data = r.json()
                with open(path, "w") as f:
                    json.dump(data, f)
                return data
            if r.status_code == 404:
                # OpenF1 answers "No results found" with a 404 rather than an empty list.
                return []
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(2 * (attempt + 1))
                continue
            r.raise_for_status()
        raise RuntimeError(f"OpenF1 {endpoint} kept failing (last status {r.status_code})")


def parse_ts(s):
    return datetime.fromisoformat(s).timestamp()


def find_session(api, year, gp, session_type, session_key):
    if session_key:
        found = api.get("sessions", session_key=session_key)
        if not found:
            raise SystemExit(f"No OpenF1 session with key {session_key}")
        return found[0]

    if session_type not in SESSION_NAMES:
        raise SystemExit(f"Unknown session {session_type!r}; use one of {sorted(SESSION_NAMES)}")

    wanted = gp.lower().strip()
    meetings = api.get("meetings", year=year)
    exact = [m for m in meetings if m["meeting_name"].lower() == wanted]
    loose = [
        m for m in meetings
        if wanted in m["meeting_official_name"].lower()
        or wanted.replace(" grand prix", "") in (
            m["country_name"].lower(), m["location"].lower(), m["circuit_short_name"].lower())
    ]
    matches = exact or loose
    if len(matches) != 1:
        names = ", ".join(f"{m['meeting_name']} ({m['location']})" for m in meetings)
        raise SystemExit(
            f"Could not pick one OpenF1 meeting for {gp!r} in {year} "
            f"({len(matches)} matches). Meetings: {names}. "
            f"Pass --session-key to choose explicitly."
        )
    sessions = api.get("sessions", meeting_key=matches[0]["meeting_key"],
                       session_name=SESSION_NAMES[session_type])
    if len(sessions) != 1:
        raise SystemExit(f"Expected one {SESSION_NAMES[session_type]} session, got {len(sessions)}")
    return sessions[0]


# FastF1's TrackStatus held "VSC ending" for ~10s before returning to green; OpenF1
# only announces "VSC ENDING", so the return to normal is inferred after this delay.
VSC_ENDING_S = 10.0


def build_track_status_timeline(race_control, t0):
    """Collapse race-control messages into the same clear/yellow/safety_car/red/vsc/
    vsc_ending states FastF1's TrackStatus produced. A mode (red, SC, VSC) wins over
    yellow, and any sector currently showing a yellow makes the whole track yellow.
    OpenF1 files the red flag as an "Other" message, not a Flag, so it is matched on
    its text."""
    events = []
    mode = "clear"
    yellow_sectors = set()
    ending_since = None

    def push(t):
        state = mode if mode != "clear" else ("yellow" if yellow_sectors else "clear")
        if not events or events[-1]["status"] != state:
            events.append({"t": t, "status": state})

    for m in sorted(race_control, key=lambda m: m["date"]):
        t = parse_ts(m["date"]) - t0
        if ending_since is not None and t >= ending_since + VSC_ENDING_S:
            mode = "clear"
            push(ending_since + VSC_ENDING_S)
            ending_since = None

        category = m.get("category")
        flag = (m.get("flag") or "").upper()
        scope = m.get("scope")
        message = (m.get("message") or "").upper()

        if category == "SafetyCar":
            if "VSC ENDING" in message or "VIRTUAL SAFETY CAR ENDING" in message:
                mode, ending_since = "vsc_ending", t
            elif "VSC DEPLOYED" in message or "VIRTUAL SAFETY CAR DEPLOYED" in message:
                mode, ending_since = "vsc", None
            elif "SAFETY CAR DEPLOYED" in message:
                mode, ending_since = "safety_car", None
        elif message.startswith("RED FLAG"):
            mode = "red"
        elif category == "Flag" and scope == "Track":
            if flag == "RED":
                mode = "red"
            elif mode == "red":
                # A red flag lasts until the race is restarted (SESSION STARTED below).
                # "TRACK CLEAR" and the green pit-exit light arrive mid-suspension, while
                # the cars are still stopped, and must not end it — FastF1's TrackStatus
                # did end it there, which reported a half-hour stoppage as ~2 minutes.
                pass
            elif flag in ("GREEN", "CLEAR"):
                mode = "clear"
                yellow_sectors.clear()
            elif flag in ("YELLOW", "DOUBLE YELLOW") and mode == "clear":
                yellow_sectors.add("track")
        elif category == "Flag" and scope == "Sector":
            sector = m.get("sector")
            if flag in ("YELLOW", "DOUBLE YELLOW"):
                yellow_sectors.add(sector)
            elif flag in ("GREEN", "CLEAR"):
                yellow_sectors.discard(sector)
        elif category == "SessionStatus" and message == "SESSION STARTED" and mode == "red":
            mode = "clear"
            yellow_sectors.clear()
        push(t)

    if ending_since is not None:
        mode = "clear"
        push(ending_since + VSC_ENDING_S)

    return events or [{"t": 0.0, "status": "clear"}]


QUALI_SESSIONS = ("Q", "SQ")
# Cars that go through Q1 and Q2 (22 on the grid: the slowest six drop in each).
QUALI_ADVANCE = (16, 10)
# A break between segments is never shorter than this; a restart after a red flag inside
# a segment is, and must not split it in two.
MIN_BREAK_S = 150.0
DELETED_RE = re.compile(r"CAR (\d+) \(\w+\) TIME (\d+):(\d+\.\d+) DELETED")


def format_lap(sec):
    if not sec:
        return None
    minutes = int(sec // 60)
    return f"{minutes}:{sec - minutes * 60:06.3f}" if minutes else f"{sec:.3f}"


def build_quali_segments(race_control, t0):
    """[(start, end)] seconds from t0 for Q1/Q2/Q3: SESSION STARTED..SESSION FINISHED pairs,
    merging any restart that follows a stoppage closer than a real break."""
    events = sorted(
        (parse_ts(r["date"]) - t0, r["message"].strip().upper())
        for r in race_control if r.get("category") == "SessionStatus")
    spans, open_at = [], None
    for t, msg in events:
        if msg == "SESSION STARTED" and open_at is None:
            open_at = t
        elif msg == "SESSION FINISHED" and open_at is not None:
            spans.append([open_at, t])
            open_at = None
    merged = []
    for a, b in spans:
        if merged and a - merged[-1][1] < MIN_BREAK_S:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return merged


def deleted_laps(race_control):
    """{(driver_number, lap_time_ms)} for times the stewards deleted (track limits)."""
    out = set()
    for r in race_control:
        m = DELETED_RE.search(r.get("message", ""))
        if m:
            out.add((int(m.group(1)), round((int(m.group(2)) * 60 + float(m.group(3))) * 1000)))
    return out


def build_quali_file(session_name, spans, loaded, results, race_control, numbers_to_abbr, status_events):
    """quali.json: the segment windows plus every driver's timed laps, from which the
    simulator derives the running order at any moment (best time so far in the segment)."""
    deleted = deleted_laps(race_control)
    n_segments = len(spans)
    prefix = "SQ" if session_name == "SQ" else "Q"

    # A lap belongs to the segment it STARTED in (cars crossing the line after the clock
    # hits zero still set a time); the segment's visible window runs to the last of them.
    def segment_of(t):
        for i, (a, b) in enumerate(spans):
            if a - 60 <= t <= b:
                return i
        return None

    drivers = {}
    ends = [b for _, b in spans]
    fastest_official = min((d for r in results for d in (r.get("duration") or []) if d), default=None)
    slow_limit = fastest_official * 1.10 if fastest_official else float("inf")
    for abbr, v in loaded.items():
        laps = []
        for r in v["rows"]:
            if r["start"] is None or r["duration"] is None or r["out_lap"]:
                continue
            seg = segment_of(r["start"])
            if seg is None:
                continue
            samples = [status_at_time(status_events, t, [0])
                       for t in np.linspace(r["start"], r["start"] + r["duration"], 8)]
            if samples.count("red") + samples.count("safety_car") >= 3:
                continue
            laps.append({
                "segment": seg + 1,
                "start": round(r["start"], 2),
                "end": round(r["start"] + r["duration"], 2),
                "time": round(r["duration"], 3),
                "deleted": (v["number"], round(r["duration"] * 1000)) in deleted,
                "in_lap": bool(r["in_lap"]),
                "sectors": r["sectors"] if all(r["sectors"]) else None,
            })
            # Only a timed attempt can hold the segment open: an in-lap that wanders through the
            # garage during the break would otherwise swallow it.
            if r["duration"] <= slow_limit:
                ends[seg] = max(ends[seg], laps[-1]["end"])
        drivers[abbr] = {"laps": laps}

    official = {}
    for res in results:
        abbr = numbers_to_abbr.get(res["driver_number"])
        dur = (res.get("duration") or [])
        if abbr in drivers:
            official[abbr] = [d for d in dur] + [None] * (3 - len(dur))

    for abbr, d in drivers.items():
        times = official.get(abbr, [None, None, None])
        d["official"] = [round(t, 3) if t else None for t in times]
        # The last segment this driver set a time in (None = reached the final one).
        reached = max((i + 1 for i, t in enumerate(times) if t), default=0)
        d["out_in"] = reached if 0 < reached < n_segments else None
        # Laps that don't match the official time of a segment where they're the best are
        # still shown; only deleted ones are excluded from the order.
        res = next((x for x in results if numbers_to_abbr.get(x["driver_number"]) == abbr), None)
        d["position"] = res["position"] if res and isinstance(res["position"], int) else None
        # The final order decides who went through, not who set a time: a driver who
        # qualified for the last segment but didn't run is still in it.
        if d["position"] and n_segments == len(QUALI_ADVANCE) + 1:
            d["out_in"] = next((i + 1 for i, k in enumerate(QUALI_ADVANCE) if d["position"] > k), None)

    segments = []
    for i, (a, b) in enumerate(spans):
        segments.append({
            "name": f"{prefix}{i + 1}",
            "start": round(a, 2),
            "clock_end": round(b, 2),
            "end": round(min(ends[i], spans[i + 1][0] - 1) if i + 1 < n_segments else ends[i], 2),
        })
    # Where S1 and S2 end on the circuit: the position of the quickest complete lap's car at
    # its own sector split times (same coordinates as the track outline).
    marks = []
    best = None
    for abbr, v in loaded.items():
        for r in v["rows"]:
            if r["start"] is None or not r["duration"] or r["out_lap"]:
                continue
            sec = r.get("sectors")
            if sec and all(sec) and (best is None or r["duration"] < best[0]):
                best = (r["duration"], abbr, r["start"], sec)
    if best:
        _, abbr, start, sec = best
        tel = loaded[abbr]["tel"]
        for split in (start + sec[0], start + sec[0] + sec[1]):
            marks.append({"x": float(np.interp(split, tel["t_loc"], tel["x"])),
                          "y": float(np.interp(split, tel["t_loc"], tel["y"]))})
    return {"version": 2, "session": session_name, "segments": segments, "sector_marks": marks, "drivers": drivers}


def build_weather_timeline(weather, t0):
    events = [
        {
            "t": parse_ts(w["date"]) - t0,
            "air_temp": float(w.get("air_temperature") or 0.0),
            "track_temp": float(w.get("track_temperature") or 0.0),
            "humidity": float(w.get("humidity") or 0.0),
            "wind_speed": float(w.get("wind_speed") or 0.0),
        }
        for w in weather
    ]
    events.sort(key=lambda e: e["t"])
    return events


def build_results_map(results, numbers_to_abbr):
    """Finished / Lapped / Retired / Disqualified / Did not start, the labels the
    FastF1-era files used, derived from OpenF1's session_result."""
    lead_laps = max((r.get("number_of_laps") or 0 for r in results), default=0)
    out = {}
    for r in results:
        abbr = numbers_to_abbr.get(r["driver_number"])
        if not abbr:
            continue
        if r.get("dsq"):
            status = "Disqualified"
        elif r.get("dns"):
            status = "Did not start"
        elif r.get("dnf"):
            status = "Retired"
        elif (r.get("number_of_laps") or 0) < lead_laps:
            status = "Lapped"
        else:
            status = "Finished"
        out[abbr] = {"status": status, "final_position": r.get("position")}
    return out


def clean_name(d):
    first = (d.get("first_name") or "").strip().title()
    last = (d.get("last_name") or "").strip().title()
    return f"{first} {last}".strip() or d["name_acronym"]


def build_driver_laps(laps, stints, pits, positions, t0):
    """One driver's lap table, with a row for every lap number up to their last.
    OpenF1 occasionally omits a lap row entirely (seen: 2026 Dutch lap 44), so gaps
    are filled from the neighbouring laps instead of dropped."""
    by_num = {l["lap_number"]: l for l in laps}
    last_lap = max(by_num)
    rows = []
    prev_end = None
    for n in range(1, last_lap + 1):
        raw = by_num.get(n, {})
        start = parse_ts(raw["date_start"]) - t0 if raw.get("date_start") else prev_end
        duration = raw.get("lap_duration")
        rows.append({"n": n, "start": start, "duration": duration,
                     "out_lap": bool(raw.get("is_pit_out_lap")),
                     "sectors": [raw.get(f"duration_sector_{i}") for i in (1, 2, 3)]})
        prev_end = start + duration if (start is not None and duration) else None

    # A missing start is recovered from the following lap, which starts when this one ends.
    for i in range(len(rows) - 2, -1, -1):
        if rows[i]["start"] is None and rows[i + 1]["start"] is not None:
            rows[i]["start"] = rows[i + 1]["start"] - (rows[i]["duration"] or 0)
    for i, r in enumerate(rows):
        nxt = rows[i + 1]["start"] if i + 1 < len(rows) else None
        r["end"] = nxt if nxt is not None else (
            r["start"] + r["duration"] if r["start"] is not None and r["duration"] else None)
        if r["n"] not in by_num and r["duration"] is None \
                and r["start"] is not None and r["end"] is not None:
            r["duration"] = r["end"] - r["start"]

    # OpenF1 stamps a pit stop with the moment the car LEFT the pit lane, and lane_duration
    # is how long it was in there, so the window runs backwards from the stamp.
    pit_windows = [
        (parse_ts(p["date"]) - t0 - (p.get("lane_duration") or p.get("pit_duration") or 25.0),
         parse_ts(p["date"]) - t0)
        for p in pits
    ]
    pos_times = np.array([parse_ts(p["date"]) - t0 for p in positions])
    pos_vals = [p["position"] for p in positions]

    def stint_for(n):
        for s in stints:
            if s["lap_start"] <= n <= (s["lap_end"] or last_lap):
                return s
        return None

    for r in rows:
        s = stint_for(r["n"])
        r["stint"] = s["stint_number"] if s else None
        r["compound"] = (s["compound"] or "UNKNOWN").upper() if s else "UNKNOWN"
        r["tyre_life"] = (
            float(s["tyre_age_at_start"] + (r["n"] - s["lap_start"]) + 1) if s else None
        )
        r["in_lap"] = any(
            r["start"] is not None and r["end"] is not None and r["start"] <= w[0] <= r["end"]
            for w in pit_windows)
        if r["end"] is not None and len(pos_times):
            k = np.searchsorted(pos_times, r["end"], side="right") - 1
            r["position"] = int(pos_vals[k]) if k >= 0 else None
        else:
            r["position"] = None
    return rows, pit_windows


def integrate_distance(t, speed_kmh):
    """Cumulative distance in metres: speed integrated over time. Long sampling gaps
    are capped so a dropout doesn't add a phantom jump."""
    dt = np.minimum(np.diff(t), MAX_GAP_SECONDS)
    seg = (speed_kmh[:-1] + speed_kmh[1:]) / 2.0 / 3.6 * dt
    return np.concatenate([[0.0], np.cumsum(seg)])


def resample(t_src, v_src, grid, hold):
    """Same rule as the FastF1 generator: linear between samples closer than
    MAX_GAP_SECONDS, otherwise hold the previous value. `hold` forces step behaviour
    for discrete channels (gear, brake). Outside the source range -> NaN."""
    j = np.clip(np.searchsorted(t_src, grid, side="right") - 1, 0, len(t_src) - 1)
    out = v_src[j].astype(float)
    if not hold:
        j1 = np.minimum(j + 1, len(t_src) - 1)
        gap = t_src[j1] - t_src[j]
        ok = (gap > 0) & (gap <= MAX_GAP_SECONDS)
        frac = np.where(ok, (grid - t_src[j]) / np.where(gap > 0, gap, 1), 0.0)
        out = np.where(ok, v_src[j] + frac * (v_src[j1] - v_src[j]), out)
    out[(grid < t_src[0]) | (grid > t_src[-1])] = np.nan
    return out


def distinct_points(xs, ys):
    return len({(round(float(x), 1), round(float(y), 1)) for x, y in zip(xs, ys)})


def load_driver(api, session_key, number, t0):
    car = api.get("car_data", session_key=session_key, driver_number=number)
    loc = api.get("location", session_key=session_key, driver_number=number)
    if not car or not loc:
        return None
    car = sorted(car, key=lambda r: r["date"])
    loc = sorted(loc, key=lambda r: r["date"])
    t_car = np.array([parse_ts(r["date"]) - t0 for r in car])
    t_loc = np.array([parse_ts(r["date"]) - t0 for r in loc])
    # np.searchsorted needs strictly usable ascending times; drop repeated stamps.
    _, ci = np.unique(t_car, return_index=True)
    _, li = np.unique(t_loc, return_index=True)
    car = [car[i] for i in ci]
    loc = [loc[i] for i in li]
    return {
        "t_car": t_car[ci],
        "speed": np.array([r["speed"] or 0 for r in car], dtype=float),
        "gear": np.array([r["n_gear"] or 0 for r in car], dtype=float),
        "throttle": np.array([r["throttle"] or 0 for r in car], dtype=float),
        "brake": np.array([r["brake"] or 0 for r in car], dtype=float),
        "rpm": np.array([r["rpm"] or 0 for r in car], dtype=float),
        "t_loc": t_loc[li],
        "x": np.array([r["x"] for r in loc], dtype=float),
        "y": np.array([r["y"] for r in loc], dtype=float),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--gp", type=str, required=True,
                   help='Folder name and meeting match, e.g. "Dutch Grand Prix"')
    p.add_argument("--session", type=str, default="R")
    p.add_argument("--session-key", type=int, default=None,
                   help="OpenF1 session_key; skips the name lookup (needed when the "
                        "meeting name is ambiguous or differs from --gp)")
    p.add_argument("--sample-ms", type=int, default=300)
    p.add_argument("--cache-dir", type=str, default="openf1_cache")
    p.add_argument("--output-dir", type=str, default="../backend/src/cache",
                   help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/")
    args = p.parse_args()

    api = OpenF1(args.cache_dir)
    session = find_session(api, args.year, args.gp, args.session, args.session_key)
    key = session["session_key"]
    t0 = parse_ts(session["date_start"])
    print(f"OpenF1 session {key}: {session['location']} {session['session_name']} "
          f"({session['date_start'][:10]})")

    drivers = api.get("drivers", session_key=key)
    numbers_to_abbr = {d["driver_number"]: d["name_acronym"] for d in drivers}
    stints = api.get("stints", session_key=key)
    pits = api.get("pit", session_key=key)
    positions = api.get("position", session_key=key)
    results = api.get("session_result", session_key=key)
    weather = api.get("weather", session_key=key)
    race_control = api.get("race_control", session_key=key)

    results_map = build_results_map(results, numbers_to_abbr)
    # OpenF1 keeps a row for the unfinished lap a retiring car was on; the FastF1 tables
    # stopped at the last completed lap, so the lap tables do too (telemetry still runs on).
    completed = {r["driver_number"]: r.get("number_of_laps") or 0
                 for r in results if r.get("dnf")}
    total_laps = max((r.get("number_of_laps") or 0 for r in results), default=0) or None

    status_events = build_track_status_timeline(race_control, t0)
    weather_events = build_weather_timeline(weather, t0)

    print("Loading per-driver telemetry...")
    loaded = {}
    team_colors, driver_names, lap_tables = {}, {}, {}
    for d in drivers:
        abbr, num = d["name_acronym"], d["driver_number"]
        laps = api.get("laps", session_key=key, driver_number=num)
        if not laps:
            continue
        tel = load_driver(api, key, num, t0)
        if tel is None:
            continue
        rows, pit_windows = build_driver_laps(
            laps,
            [s for s in stints if s["driver_number"] == num],
            [x for x in pits if x["driver_number"] == num],
            [x for x in positions if x["driver_number"] == num],
            t0)
        starts = [r["start"] for r in rows]
        if starts[0] is None:
            continue

        # The driver's data window runs from the start of lap 1 to the end of their last
        # lap, or for a car that stopped mid-lap, to the last moment it was moving.
        last = rows[-1]
        if last["end"] is not None:
            t_end = last["end"]
        else:
            moving = tel["t_car"][(tel["speed"] > 0) & (tel["t_car"] >= last["start"])]
            t_end = float(moving[-1]) + 1.0 if len(moving) else last["start"]

        loaded[abbr] = {"number": num, "tel": tel, "rows": rows, "pit_windows": pit_windows,
                        "t_start": starts[0], "t_end": t_end}
        driver_names[abbr] = clean_name(d)
        team_colors[abbr] = "#" + (d.get("team_colour") or "808080")

    if not loaded:
        raise SystemExit("OpenF1 returned no usable driver telemetry for this session")

    t_min = min(v["t_start"] for v in loaded.values())
    t_max = max(v["t_end"] for v in loaded.values())
    if args.session in QUALI_SESSIONS:
        # Stop shortly after the last segment's chequered flag, not when the last car is
        # finally parked.
        spans_for_end = build_quali_segments(race_control, t0)
        if spans_for_end:
            t_max = min(t_max, spans_for_end[-1][1] + 180.0)
    master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
    print(f"Master timeline: {len(master_timeline)} frames "
          f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

    print("Resampling drivers onto shared timeline...")
    driver_series = {}
    outline_candidates = []
    for abbr, v in loaded.items():
        tel, rows = v["tel"], v["rows"]
        grid = master_timeline
        window = (grid >= v["t_start"]) & (grid <= v["t_end"])

        cum = integrate_distance(tel["t_car"], tel["speed"])
        lap_starts = np.array([r["start"] for r in rows])
        lap_idx = np.clip(np.searchsorted(lap_starts, grid, side="right") - 1, 0, len(rows) - 1)
        cum_now = np.interp(grid, tel["t_car"], cum)
        cum_at_start = np.interp(lap_starts[lap_idx], tel["t_car"], cum)

        def masked(a):
            a = np.array(a, dtype=float)
            a[~window] = np.nan
            return a

        x = masked(resample(tel["t_loc"], tel["x"], grid, hold=False))
        y = masked(resample(tel["t_loc"], tel["y"], grid, hold=False))

        pit = np.zeros(len(grid), dtype=bool)
        for a, b in v["pit_windows"]:
            pit |= (grid >= a) & (grid <= b)

        driver_series[abbr] = {
            "x": x, "y": y,
            "lap": masked([rows[i]["n"] for i in lap_idx]),
            "dist": masked(cum_now - cum_at_start),
            "compound": np.array([rows[i]["compound"] for i in lap_idx], dtype=object),
            "tyre_life": np.array([rows[i]["tyre_life"] or 0.0 for i in lap_idx]),
            "in_pit": pit,
            "speed": np.nan_to_num(resample(tel["t_car"], tel["speed"], grid, hold=False)),
            "gear": np.nan_to_num(resample(tel["t_car"], tel["gear"], grid, hold=True)),
            "throttle": np.nan_to_num(resample(tel["t_car"], tel["throttle"], grid, hold=False)),
            "brake": np.nan_to_num(resample(tel["t_car"], tel["brake"], grid, hold=True)),
            "rpm": np.nan_to_num(resample(tel["t_car"], tel["rpm"], grid, hold=False)),
            "drs": np.zeros(len(grid)),  # no DRS on the 2026 cars; OpenF1 reports null
        }

        for r in rows:
            if r["duration"] and r["start"] is not None and not r["out_lap"] and not r["in_lap"]:
                outline_candidates.append((r["duration"], abbr, r))

    print("Building track outline (4000-point arc-length resample)...")
    outline, bounds, avg_lap_length = build_track_outline(loaded, outline_candidates)

    print("Building per-driver lap tables...")
    quali_spans = build_quali_segments(race_control, t0) if args.session in QUALI_SESSIONS else []

    def segment_number(start):
        # Laps are tagged by the segment they started in (Q1/Q2/Q3 = 1/2/3).
        for i, (a, b) in enumerate(quali_spans):
            if start is not None and a - 60 <= start <= b:
                return i + 1
        return None

    for abbr, v in loaded.items():
        table = []
        for r in v["rows"]:
            if r["n"] > completed.get(v["number"], r["n"]):
                continue
            samples = (
                [status_at_time(status_events, t, [0])
                 for t in np.linspace(r["start"], r["start"] + r["duration"], 12)]
                if r["start"] is not None and r["duration"] else [])
            # A lap run under a red flag is minutes of standing around, not a lap time
            # (OpenF1 reports 1701s for one), and FastF1 also left laps behind the
            # safety car null. Judged over the lap's own running time, so the lap that
            # ends at the stoppage keeps its time.
            neutralised = samples.count("red") + samples.count("safety_car")
            timed = r["duration"] is not None and neutralised < 3
            clean = (
                timed and not r["out_lap"] and not r["in_lap"]
                and r["n"] > 1 and all(s == "clear" for s in samples)
            )
            table.append({
                "lap": r["n"],
                "lap_time_s": round(r["duration"], 3) if timed else None,
                "compound": r["compound"],
                "tyre_life": round(r["tyre_life"], 1) if r["tyre_life"] is not None else None,
                "stint": r["stint"],
                "is_accurate": bool(clean),
                "position": r["position"],
                "segment": segment_number(r["start"]),
            })
        timed = [l for l in table if l["lap_time_s"] is not None]
        fastest = None
        if timed:
            fl = min(timed, key=lambda l: l["lap_time_s"])
            fastest = {"lap_number": fl["lap"], "lap_time_s": fl["lap_time_s"]}
        lap_tables[abbr] = {"laps": table, "fastest_lap": fastest}

    frames = []
    status_cursor, weather_cursor = [0], [0]
    for t in master_timeline:
        frames.append({
            "t": round(float(t), 2),
            "flag": status_at_time(status_events, t, status_cursor),
            "weather": weather_at_time(weather_events, t, weather_cursor),
        })

    safe_gp = args.gp.lower().replace(" ", "_")
    out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
    os.makedirs(out_dir, exist_ok=True)

    print("Writing per-driver telemetry files...")
    n = write_driver_files(driver_series, team_colors, driver_names, results_map,
                           lap_tables, master_timeline, avg_lap_length, args.sample_ms, out_dir)
    print(f"Done. Wrote {n} per-driver files to {os.path.join(out_dir, 'drivers')}")

    write_track_file(outline, bounds, avg_lap_length, total_laps, args.session, [], out_dir)
    quali_times = {}
    if args.session in QUALI_SESSIONS:
        for res in results:
            abbr = numbers_to_abbr.get(res["driver_number"])
            dur = (res.get("duration") or []) + [None] * 3
            if abbr:
                quali_times[abbr] = {f"q{i + 1}": format_lap(dur[i]) for i in range(3)}
    write_laps_file(lap_tables, driver_names, team_colors, quali_times, out_dir)
    if args.session in QUALI_SESSIONS:
        spans = build_quali_segments(race_control, t0)
        if not spans:
            raise SystemExit("No SESSION STARTED/FINISHED pairs in race control: cannot split into segments")
        quali = build_quali_file(args.session, spans, loaded, results, race_control,
                                 numbers_to_abbr, status_events)
        with open(os.path.join(out_dir, "quali.json"), "w") as f:
            json.dump(quali, f)
        print("Segments:", [(g["name"], round(g["start"]), round(g["end"])) for g in quali["segments"]])
    write_conditions_file(frames, args.sample_ms, out_dir)
    print(f"Done. Wrote track.json, laps.json, conditions.json to {out_dir}")


def build_track_outline(loaded, candidates, n_points=4000):
    """Arc-length resample of one clean lap's positions. Candidates are tried fastest
    first (in/out laps are excluded because they include the pit lane); the first with
    enough DISTINCT samples wins, otherwise the best-resolved lap seen."""
    best = None
    for _, abbr, r in sorted(candidates, key=lambda c: c[0]):
        tel = loaded[abbr]["tel"]
        sel = (tel["t_loc"] >= r["start"]) & (tel["t_loc"] <= r["start"] + r["duration"])
        xs, ys = tel["x"][sel], tel["y"][sel]
        if len(xs) < 2:
            continue
        count = distinct_points(xs, ys)
        if best is None or count > best[0]:
            best = (count, xs, ys, abbr, r)
        if count >= MIN_OUTLINE_POINTS:
            break
    if best is None:
        raise RuntimeError("No lap carries usable position data to build a track outline from")
    _, xs, ys, abbr, r = best

    cum_dist = np.concatenate([[0], np.cumsum(np.hypot(np.diff(xs), np.diff(ys)))])
    target = np.linspace(0, float(cum_dist[-1]), n_points)
    xs_dense = np.interp(target, cum_dist, xs)
    ys_dense = np.interp(target, cum_dist, ys)
    outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
    bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))

    # Real-world lap length in metres from the same speed-integrated distance the
    # per-frame `dist` uses (position coordinates are on a different, ~10x scale).
    tel = loaded[abbr]["tel"]
    sel = (tel["t_car"] >= r["start"]) & (tel["t_car"] <= r["start"] + r["duration"])
    cum = integrate_distance(tel["t_car"][sel], tel["speed"][sel])
    avg_lap_length = float(cum[-1]) if len(cum) else float(cum_dist[-1])
    return outline, bounds, avg_lap_length


if __name__ == "__main__":
    sys.exit(main())
