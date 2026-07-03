# """
# Grid-Lock: Dynamic Track-Native Telemetry Generator
# ===================================================
# Now supports fully dynamic generation for any race using command-line arguments.
# Usage:
#   python full_race_generator.py --year 2024 --gp "Silverstone" --session R
# """

# import fastf1
# import numpy as np
# import pandas as pd
# import json
# import os
# import argparse

# # Default setup for caching
# CACHE_DIR = "fastf1_cache"

# def parse_arguments():
#     parser = argparse.ArgumentParser(description="Generate F1 telemetry JSON for GridLock.")
#     parser.add_argument("--year", type=int, required=True, help="Year of the race (e.g., 2023, 2024)")
#     parser.add_argument("--gp", type=str, required=True, help="Grand Prix name or location (e.g., 'Abu Dhabi', 'Silverstone')")
#     parser.add_argument("--session", type=str, default="R", help="Session type: R (Race), Q (Qualifying), SQ (Sprint Shootout), S (Sprint)")
#     parser.add_argument("--interval", type=int, default=300, help="Telemetry sampling interval in milliseconds")
#     return parser.parse_args()

# def load_session(year, gp, session_type):
#     os.makedirs(CACHE_DIR, exist_ok=True)
#     fastf1.Cache.enable_cache(CACHE_DIR)
#     print(f"Fetching data from FastF1 for {year} {gp} [Session: {session_type}]...")
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session

# def build_track_outline(session):
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     n_points = min(300, len(xs))
#     idx = np.linspace(0, len(xs) - 1, n_points).astype(int)
#     outline = [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]

#     return outline, (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))

# def build_driver_frame_series(session, master_timeline):
#     driver_series = {}
#     team_colors = {}

#     for drv in session.drivers:
#         info = session.get_driver(drv)
#         abbr = info["Abbreviation"]
#         team_colors[abbr] = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         all_t, all_x, all_y, all_lap = [], [], [], []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue
#             if tel.empty:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue
            
#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy())
#             all_y.append(tel["Y"].to_numpy())
#             all_lap.append(np.full(len(tel), lap["LapNumber"]))

#         if not all_t:
#             continue

#         t_concat = np.concatenate(all_t)
#         x_concat = np.concatenate(all_x)
#         y_concat = np.concatenate(all_y)
#         lap_concat = np.concatenate(all_lap)

#         order = np.argsort(t_concat)
#         t_concat = t_concat[order]
#         x_concat = x_concat[order]
#         y_concat = y_concat[order]
#         lap_concat = lap_concat[order]

#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat = t_concat[unique_idx]
#         x_concat = x_concat[unique_idx]
#         y_concat = y_concat[unique_idx]
#         lap_concat = lap_concat[unique_idx]

#         x_interp = np.interp(master_timeline, t_concat, x_concat, left=np.nan, right=np.nan)
#         y_interp = np.interp(master_timeline, t_concat, y_concat, left=np.nan, right=np.nan)
#         lap_interp = np.interp(master_timeline, t_concat, lap_concat, left=np.nan, right=np.nan)

#         driver_series[abbr] = {
#             "x": x_interp,
#             "y": y_interp,
#             "lap": lap_interp,
#         }

#     return driver_series, team_colors

# def main():
#     args = parse_arguments()
    
#     # Sanitize naming for filesystem compatibility
#     safe_gp_name = args.gp.lower().replace(" ", "_")
#     output_filename = f"{args.year}_{safe_gp_name}_{args.session.lower()}.json"
    
#     session = load_session(args.year, args.gp, args.session)

#     print("Building track outline from real position data...")
#     track_outline, bounds = build_track_outline(session)

#     print("Building master timeline...")
#     race_laps = session.laps
    
#     all_times = []
#     for _, lap in race_laps.iterrows():
#         try:
#             tel = lap.get_telemetry()
#             if not tel.empty:
#                 lap_start_seconds = lap["LapStartTime"].total_seconds()
#                 t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#                 all_times.extend(t_seconds)
#         except Exception:
#             continue
    
#     if not all_times:
#         raise ValueError("No telemetry data found in the session")
    
#     t_min = min(all_times)
#     t_max = max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.interval / 1000.0)

#     print(f"Master timeline: {len(master_timeline)} frames generated.")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap = series["x"][i], series["y"][i], series["lap"][i]
#             if np.isnan(x):
#                 continue
#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#             }
#         frames.append({"t": round(float(t), 2), "cars": frame_cars})

#     output = {
#         "meta": {
#             "year": args.year,
#             "gp": args.gp,
#             "session": args.session,
#             "sample_interval_ms": args.interval,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "team_colors": team_colors,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     # Ensure output directory exists if you save them under public/races/
#     script_dir = os.path.dirname(os.path.abspath(__file__))
    
#     # 2. Safely navigate up one level, then into frontend/public/races
#     target_dir = os.path.join(script_dir, "..", "frontend", "public", "races")

#     os.makedirs(target_dir, exist_ok=True)
#     target_path = os.path.join(target_dir, output_filename)
    
#     with open(target_path, "w") as f:
#         json.dump(output, f)

#     print(f"\nSuccessfully wrote telemetry to: {target_path}")

# if __name__ == "__main__":
#     main()

"""
Grid-Lock: Dynamic Track-Native Telemetry Generator
===================================================
Now supports fully dynamic generation for any race using command-line arguments.
Usage:
  python full_race_generator.py --year 2024 --gp "Silverstone" --session R
"""

import fastf1
import numpy as np
import pandas as pd
import json
import os
import argparse

# Default setup for caching
CACHE_DIR = "fastf1_cache"

def parse_arguments():
    parser = argparse.ArgumentParser(description="Generate F1 telemetry JSON for GridLock.")
    parser.add_argument("--year", type=int, required=True, help="Year of the race (e.g., 2023, 2024)")
    parser.add_argument("--gp", type=str, required=True, help="Grand Prix name or location (e.g., 'Abu Dhabi', 'Silverstone')")
    parser.add_argument("--session", type=str, default="R", help="Session type: R (Race), Q (Qualifying), SQ (Sprint Shootout), S (Sprint)")
    parser.add_argument("--interval", type=int, default=300, help="Telemetry sampling interval in milliseconds")
    return parser.parse_args()

def load_session(year, gp, session_type):
    os.makedirs(CACHE_DIR, exist_ok=True)
    fastf1.Cache.enable_cache(CACHE_DIR)
    print(f"Fetching data from FastF1 for {year} {gp} [Session: {session_type}]...")
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, laps=True, weather=False)
    return session

def build_track_outline(session):
    fastest_lap = session.laps.pick_fastest()
    pos = fastest_lap.get_pos_data()
    xs = pos["X"].to_numpy()
    ys = pos["Y"].to_numpy()

    # STEP 1 FIX: Bumped from 300 to 4000 points for smooth SVG curves
    n_points = min(4000, len(xs))
    idx = np.linspace(0, len(xs) - 1, n_points).astype(int)
    outline = [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]

    return outline, (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))

def build_driver_frame_series(session, master_timeline):
    driver_series = {}
    team_colors = {}

    for drv in session.drivers:
        info = session.get_driver(drv)
        abbr = info["Abbreviation"]
        team_colors[abbr] = "#" + info.get("TeamColor", "808080")

        laps = session.laps.pick_driver(drv)
        if laps.empty:
            continue

        all_t, all_x, all_y, all_lap, all_comp = [], [], [], [], []

        for _, lap in laps.iterrows():
            try:
                tel = lap.get_telemetry()
            except Exception:
                continue
            if tel.empty:
                continue

            lap_start_time = lap["LapStartTime"]
            if lap_start_time is None or pd.isna(lap_start_time):
                continue
            
            lap_start_seconds = lap_start_time.total_seconds()
            t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
            
            # STEP 1 FIX: Extract tyre compound per lap
            compound = str(lap["Compound"]) if not pd.isna(lap["Compound"]) else "UNKNOWN"

            all_t.append(t_seconds)
            all_x.append(tel["X"].to_numpy())
            all_y.append(tel["Y"].to_numpy())
            all_lap.append(np.full(len(tel), lap["LapNumber"]))
            all_comp.extend([compound] * len(tel))

        if not all_t:
            continue

        t_concat = np.concatenate(all_t)
        x_concat = np.concatenate(all_x)
        y_concat = np.concatenate(all_y)
        lap_concat = np.concatenate(all_lap)
        comp_concat = np.array(all_comp)

        # Sort chronologically to ensure clean timeline mapping
        order = np.argsort(t_concat)
        t_concat, x_concat, y_concat, lap_concat, comp_concat = (
            t_concat[order], x_concat[order], y_concat[order], lap_concat[order], comp_concat[order]
        )

        # Remove duplicates
        _, unique_idx = np.unique(t_concat, return_index=True)
        unique_idx = np.sort(unique_idx)
        t_concat, x_concat, y_concat, lap_concat, comp_concat = (
            t_concat[unique_idx], x_concat[unique_idx], y_concat[unique_idx], lap_concat[unique_idx], comp_concat[unique_idx]
        )

        # STEP 1 FIX: Calculate exact cumulative distance driven using coordinate deltas
        dx = np.diff(x_concat, prepend=x_concat[0])
        dy = np.diff(y_concat, prepend=y_concat[0])
        cum_distance = np.cumsum(np.hypot(dx, dy))

        # STEP 1 FIX: Forward-fill instead of linear interpolation
        # np.searchsorted finds the index of the closest past real data point
        indices = np.searchsorted(t_concat, master_timeline, side='right') - 1
        valid = indices >= 0
        safe_indices = np.where(valid, indices, 0)

        # Apply forward-fill logic: if valid, take the last known value; if not, use NaN/empty
        x_ffill = np.where(valid, x_concat[safe_indices], np.nan)
        y_ffill = np.where(valid, y_concat[safe_indices], np.nan)
        lap_ffill = np.where(valid, lap_concat[safe_indices], np.nan)
        dist_ffill = np.where(valid, cum_distance[safe_indices], np.nan)
        comp_ffill = np.where(valid, comp_concat[safe_indices], "")

        driver_series[abbr] = {
            "x": x_ffill,
            "y": y_ffill,
            "lap": lap_ffill,
            "dist": dist_ffill,
            "compound": comp_ffill
        }

    return driver_series, team_colors

def main():
    args = parse_arguments()
    
    session = load_session(args.year, args.gp, args.session)

    print("Building track outline from real position data...")
    track_outline, bounds = build_track_outline(session)

    print("Building master timeline...")
    race_laps = session.laps
    
    all_times = []
    for _, lap in race_laps.iterrows():
        try:
            tel = lap.get_telemetry()
            if not tel.empty:
                lap_start_seconds = lap["LapStartTime"].total_seconds()
                t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
                all_times.extend(t_seconds)
        except Exception:
            continue
    
    if not all_times:
        raise ValueError("No telemetry data found in the session")
    
    t_min = min(all_times)
    t_max = max(all_times)
    master_timeline = np.arange(t_min, t_max, args.interval / 1000.0)

    print(f"Master timeline: {len(master_timeline)} frames generated.")

    print("Forward-filling driver positions onto shared timeline...")
    driver_series, team_colors = build_driver_frame_series(session, master_timeline)

    print("Assembling frames...")
    frames = []
    for i, t in enumerate(master_timeline):
        frame_cars = {}
        for abbr, series in driver_series.items():
            x, y = series["x"][i], series["y"][i]
            
            # If x is NaN, the car hasn't started or is entirely missing from this frame
            if np.isnan(x):
                continue
                
            frame_cars[abbr] = {
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "lap": int(series["lap"][i]) if not np.isnan(series["lap"][i]) else None,
                "dist": round(float(series["dist"][i]), 2),
                "compound": str(series["compound"][i])
            }
        frames.append({"t": round(float(t), 2), "cars": frame_cars})

    output = {
        "meta": {
            "year": args.year,
            "gp": args.gp,
            "session": args.session,
            "sample_interval_ms": args.interval,
            "bounds": {
                "x_min": bounds[0], "x_max": bounds[1],
                "y_min": bounds[2], "y_max": bounds[3],
            },
            "team_colors": team_colors,
        },
        "track_outline": track_outline,
        "frames": frames,
    }

    # STEP 1 FIX: Reroute save path to backend cache
    script_dir = os.path.dirname(os.path.abspath(__file__))
    safe_gp_name = args.gp.lower().replace(" ", "_")
    safe_session = args.session.lower()
    
    target_dir = os.path.join(script_dir, "..", "backend", "src", "cache", str(args.year), safe_gp_name, safe_session)
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, "data.json")
    
    with open(target_path, "w") as f:
        json.dump(output, f)

    print(f"\nSuccessfully wrote structured telemetry to: {target_path}")

if __name__ == "__main__":
    main()