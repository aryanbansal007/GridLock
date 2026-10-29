"""
Writes race_control.json (driver-specific stewards' notices) and race_control_log.json (every
message, for the full log on the race page) for sessions that are already
generated, without regenerating any telemetry. The generator writes the same file for new
sessions; this backfills the older ones.

    python openf1_race_control.py --year 2026 --data ../gridlock-data --cache-dir ~/of1cache

The replay clock differs by source: files made from OpenF1 count from the session start, the
older FastF1 ones from the feed start. Both begin the replay at the first car's lap 1, so the
offset is that lap's time in the OpenF1 clock subtracted from the file's own first timestamp.
"""
import argparse
import json
import os

from openf1_race_generator import OpenF1, build_race_control_feed, build_race_control_log, parse_ts

CODES = {"R": "Race", "Q": "Qualifying", "SQ": "Sprint Qualifying", "S": "Sprint"}
# Practice has no replay, so only its message log is written.
LOG_ONLY = {"FP1": "Practice 1", "FP2": "Practice 2", "FP3": "Practice 3"}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, default=2026)
    p.add_argument("--data", default="../gridlock-data")
    p.add_argument("--cache-dir", default="openf1_cache")
    args = p.parse_args()

    api = OpenF1(args.cache_dir)
    with open(os.path.join(args.data, "season", str(args.year), "calendar.json")) as f:
        races = [r for r in json.load(f)["races"] if r["status"] == "completed"]
    meetings = [m for m in sorted(api.get("meetings", year=args.year), key=lambda m: m["date_start"])
                if "Testing" not in m["meeting_name"]]
    # The 2026 calendar has two cancelled rounds OpenF1 still lists as meetings.
    meetings = [m for m in meetings if m["meeting_name"] not in ("Saudi Arabian Grand Prix",)
                and not (m["meeting_name"] == "Bahrain Grand Prix" and m["date_start"] < "2026-04-30")]
    sessions = api.get("sessions", year=args.year)

    for race, meeting in zip(races, meetings):
        folder = race["name"].lower().replace(" ", "_")
        for code, name in LOG_ONLY.items():
            found = [s for s in sessions if s["meeting_key"] == meeting["meeting_key"] and s["session_name"] == name]
            if not found:
                continue
            numbers = {d["driver_number"]: d["name_acronym"] for d in api.get("drivers", session_key=found[0]["session_key"])}
            raw = api.get("race_control", session_key=found[0]["session_key"])
            out_dir = os.path.join(args.data, str(args.year), folder, code)
            os.makedirs(out_dir, exist_ok=True)
            with open(os.path.join(out_dir, "race_control_log.json"), "w") as f:
                json.dump({"messages": build_race_control_log(raw, numbers)}, f)
            print(f"{folder}/{code}: {len(raw)} messages (log only)", flush=True)
        for code, name in CODES.items():
            out_dir = os.path.join(args.data, str(args.year), folder, code)
            cond = os.path.join(out_dir, "conditions.json")
            found = [s for s in sessions if s["meeting_key"] == meeting["meeting_key"] and s["session_name"] == name]
            if not os.path.exists(cond) or not found:
                continue
            s = found[0]
            key, t0 = s["session_key"], parse_ts(s["date_start"])
            laps1 = [l for l in api.get("laps", session_key=key, lap_number=1) if l.get("date_start")]
            if not laps1:
                print("skip (no lap 1)", folder, code)
                continue
            first_lap = min(parse_ts(l["date_start"]) for l in laps1) - t0
            with open(cond) as f:
                replay_start = json.load(f)["conditions"][0]["t"]
            offset = replay_start - first_lap
            numbers = {d["driver_number"]: d["name_acronym"] for d in api.get("drivers", session_key=key)}
            raw = api.get("race_control", session_key=key)
            feed = build_race_control_feed(raw, numbers, t0, offset)
            with open(os.path.join(out_dir, "race_control.json"), "w") as f:
                json.dump({"messages": feed}, f)
            with open(os.path.join(out_dir, "race_control_log.json"), "w") as f:
                json.dump({"messages": build_race_control_log(raw, numbers)}, f)
            print(f"{folder}/{code}: {len(feed)} notices (offset {offset:+.0f}s)", flush=True)


if __name__ == "__main__":
    main()
