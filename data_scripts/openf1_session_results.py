"""
Per-session results from OpenF1, for the Race Detail page.

Replacement for session_results.py now that FastF1's livetiming source needs an F1TV
login. Prints the same JSON to stdout, so the same redirect works:

    python openf1_session_results.py --year 2026 --gp "Italian Grand Prix" --round 13 \
        > ../gridlock-data/session_results/2026/13/R.json

Race and Sprint only. `--round` is the number used in the output path/JSON (the
championship round FastF1 numbered the event by), which OpenF1 does not provide.
"""
import argparse
import json

from openf1_race_generator import OpenF1, build_results_map, clean_name, find_session, parse_ts


def starting_grid(api, key, race_start):
    """Grid order from the position feed: OpenF1's starting_grid endpoint is often empty,
    but the running order just before lap 1 is the grid."""
    grid = {}
    for p in sorted(api.get("position", session_key=key), key=lambda p: p["date"]):
        if parse_ts(p["date"]) > race_start:
            break
        grid[p["driver_number"]] = p["position"]
    return grid


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--gp", type=str, required=True)
    p.add_argument("--round", type=int, required=True)
    p.add_argument("--session", type=str, default="R")
    p.add_argument("--session-key", type=int, default=None)
    p.add_argument("--cache-dir", type=str, default="openf1_cache")
    args = p.parse_args()

    api = OpenF1(args.cache_dir)
    session = find_session(api, args.year, args.gp, args.session, args.session_key)
    key = session["session_key"]
    meeting = api.get("meetings", meeting_key=session["meeting_key"])[0]

    drivers = {d["driver_number"]: d for d in api.get("drivers", session_key=key)}
    numbers_to_abbr = {n: d["name_acronym"] for n, d in drivers.items()}
    raw = api.get("session_result", session_key=key)
    statuses = build_results_map(raw, numbers_to_abbr)

    # Classified position for every car: OpenF1 leaves it null for retirements, which
    # FastF1 ranked behind the finishers by laps completed.
    ranked = sorted(raw, key=lambda r: (r["position"] is None, r["position"] or 0,
                                        -(r.get("number_of_laps") or 0)))
    race_start = min(
        (parse_ts(l["date_start"]) for l in api.get("laps", session_key=key, lap_number=1)
         if l.get("date_start")),
        default=parse_ts(session["date_start"]),
    )
    grid = starting_grid(api, key, race_start)

    results = []
    for rank, r in enumerate(ranked, start=1):
        d = drivers.get(r["driver_number"])
        if not d:
            continue
        results.append({
            "position": r["position"] or rank,
            "abbreviation": d["name_acronym"],
            "driver": clean_name(d),
            "team": d.get("team_name") or "",
            "team_color": d.get("team_colour") or "808080",
            "status": statuses.get(d["name_acronym"], {}).get("status", ""),
            "grid": grid.get(r["driver_number"]),
            "points": float(r.get("points") or 0),
        })

    fastest = None
    for l in api.get("laps", session_key=key):
        if l.get("lap_duration") and (fastest is None or l["lap_duration"] < fastest[0]):
            fastest = (l["lap_duration"], l)
    fastest_lap = None
    if fastest:
        dur, lap = fastest
        minutes = int(dur // 60)
        seconds = dur - minutes * 60
        fastest_lap = {
            "abbreviation": numbers_to_abbr.get(lap["driver_number"]),
            "lap_time": f"{minutes}:{seconds:06.3f}" if minutes else f"{seconds:.3f}",
            "lap_number": lap["lap_number"],
        }

    print(json.dumps({
        "year": args.year,
        "round": args.round,
        "session": args.session,
        "event_name": meeting["meeting_name"],
        "results": results,
        "fastest_lap": fastest_lap,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
