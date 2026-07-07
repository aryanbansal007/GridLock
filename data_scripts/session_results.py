"""
Lightweight per-session results (NOT full telemetry) for the Race Detail page.

Unlike full_race_generator.py (which dumps thousands of frame-by-frame car
positions for the simulator), this only loads a session's results/laps
classification — fast (a few seconds), small JSON, safe to generate on demand.

Usage:
    python session_results.py --year 2024 --round 8 --session R
Outputs JSON to stdout: {year, round, session, event_name, results: [...]}
"""
import argparse
import json
import sys

import fastf1
import pandas as pd

RACE_LIKE = {"R", "S"}       # Race, Sprint — GridPosition + Points are meaningful
QUALI_LIKE = {"Q", "SQ"}     # Qualifying, Sprint Qualifying — Q1/Q2/Q3 + Position
PRACTICE_LIKE = {"FP1", "FP2", "FP3"}  # ranked by best lap time (Position isn't populated)


def fmt_timedelta(td):
    if td is None or pd.isna(td):
        return None
    total_seconds = td.total_seconds()
    m = int(total_seconds // 60)
    s = total_seconds - m * 60
    return f"{m}:{s:06.3f}" if m else f"{s:.3f}"


def safe_int(v):
    return int(v) if pd.notna(v) else None


def safe_float(v):
    return float(v) if pd.notna(v) else None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--round", type=int, required=True)
    p.add_argument("--session", type=str, required=True)
    p.add_argument("--cache-dir", type=str, default="fastf1_cache")
    args = p.parse_args()

    fastf1.Cache.enable_cache(args.cache_dir)

    try:
        session = fastf1.get_session(args.year, args.round, args.session)
        need_laps = args.session in PRACTICE_LIKE or args.session in RACE_LIKE
        session.load(telemetry=False, laps=need_laps, weather=False)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    fastest_lap = None
    if args.session in RACE_LIKE and not session.laps.empty:
        try:
            fl = session.laps.pick_fastest()
            if fl is not None and pd.notna(fl.get("LapTime")):
                fastest_lap = {
                    "abbreviation": fl.get("Driver"),
                    "lap_time": fmt_timedelta(fl.get("LapTime")),
                    "lap_number": safe_int(fl.get("LapNumber")),
                }
        except Exception:
            fastest_lap = None

    results = []

    if args.session in PRACTICE_LIKE:
        laps = session.laps
        best = laps.groupby("Driver")["LapTime"].min().dropna().sort_values()
        info = session.results.set_index("Abbreviation")
        for rank, (abbr, lap_time) in enumerate(best.items(), start=1):
            row = info.loc[abbr] if abbr in info.index else None
            results.append({
                "position": rank,
                "abbreviation": abbr,
                "driver": row["FullName"] if row is not None else abbr,
                "team": row["TeamName"] if row is not None else "",
                "team_color": row["TeamColor"] if row is not None else "808080",
                "best_lap": fmt_timedelta(lap_time),
            })
    else:
        for _, row in session.results.iterrows():
            entry = {
                "position": safe_int(row.get("Position")),
                "abbreviation": row.get("Abbreviation", ""),
                "driver": row.get("FullName", row.get("Abbreviation", "")),
                "team": row.get("TeamName", ""),
                "team_color": row.get("TeamColor", "808080"),
                "status": row.get("Status", "") or "",
            }
            if args.session in RACE_LIKE:
                entry["grid"] = safe_int(row.get("GridPosition"))
                entry["points"] = safe_float(row.get("Points")) or 0
            if args.session in QUALI_LIKE:
                entry["q1"] = fmt_timedelta(row.get("Q1"))
                entry["q2"] = fmt_timedelta(row.get("Q2"))
                entry["q3"] = fmt_timedelta(row.get("Q3"))
            results.append(entry)
        results.sort(key=lambda r: (r["position"] is None, r["position"]))

    out = {
        "year": args.year,
        "round": args.round,
        "session": args.session,
        "event_name": session.event["EventName"],
        "results": results,
        "fastest_lap": fastest_lap,
    }
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
