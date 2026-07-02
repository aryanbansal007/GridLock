# import fastf1
# import json
# import os
# import pandas as pd
# import numpy as np

# # 1. Enable Caching (Highly recommended by FastF1 documentation to avoid slow API down times)
# os.makedirs('fastf1_cache', exist_ok=True)
# fastf1.Cache.enable_cache('fastf1_cache')

# print("Fetching authentic 2023 Abu Dhabi Grand Prix Telemetry...")
# # Load the 2023 Abu Dhabi GP Race Session
# session = fastf1.get_session(2023, 'Abu Dhabi', 'R')
# session.load(telemetry=True)

# drivers_list = session.drivers
# drivers_config = []
# telemetry_by_driver = {}

# print("Processing driver attributes and mapping lap telemetry...")
# # 2. Extract Driver Details & Laps
# for d_num in drivers_list:
#     driver_info = session.get_driver(d_num)
#     d_id = driver_info['Abbreviation']
#     team_color = f"#{driver_info['TeamColor']}" if driver_info['TeamColor'] else "#ffffff"
    
#     drivers_config.append({
#         "id": d_id,
#         "color": team_color,
#         "team": driver_info['TeamName']
#     })
    
#     # Pick the actual first lap driven by this driver
#     driver_laps = session.laps.pick_driver(d_id)
#     lap_one = driver_laps[driver_laps['LapNumber'] == 1]
    
#     if not lap_one.empty:
#         # Get raw timing/distance telemetry 
#         tel = lap_one.iloc[0].get_telemetry()
#         # Add relative distance (0.0 at start, 1.0 at finish line)
#         tel = tel.add_relative_distance()
        
#         # Store time string and relative progress
#         telemetry_by_driver[d_id] = tel[['Time', 'RelativeDistance']].copy()

# # 3. Synchronize Frames by Time
# # Telemetry signals come at different micro-intervals; we must align them onto a single timestamp axis
# all_times = []
# for d_id, df in telemetry_by_driver.items():
#     all_times.extend(df['Time'].dt.total_seconds().tolist())

# # Create a master timeline from the earliest to latest stamp of Lap 1 (sampled every 200ms)
# # Create a master timeline based on the maximum lap distance instead of time
# # This samples the track evenly every few meters, keeping speed mathematically accurate to the SVG path
# min_time = min(all_times)
# max_time = max(all_times)

# # 2. Create a high-resolution timeline (sampling every 100ms for ultra-smooth movement)
# master_time_timeline = np.arange(min_time, max_time, 0.1) 

# frames = []
# for step_idx, current_time in enumerate(master_time_timeline):
#     positions_at_frame = []
    
#     for d_config in drivers_config:
#         d_id = d_config["id"]
#         if d_id in telemetry_by_driver:
#             df = telemetry_by_driver[d_id]
#             df_seconds = df['Time'].dt.total_seconds()
            
#             # CORRECT MATH: Interpolating relative distance based on the uniform time steps
#             current_progress = np.interp(
#                 current_time, 
#                 df_seconds, 
#                 df['RelativeDistance'], 
#                 left=0.0, 
#                 right=1.0
#             )
#             positions_at_frame.append(round(current_progress, 5))
#         else:
#             positions_at_frame.append(0.0)
            
#     frames.append({
#         "timestamp": step_idx,
#         "positions": positions_at_frame
#     })

    
# # 4. Save structured JSON directly into your React App
# output_data = {
#     "drivers": drivers_config,
#     "frames": frames
# }

# output_path = 'data.json'
# with open(output_path, 'w') as f:
#     json.dump(output_data, f)

# print(f"✅ Telemetry compilation complete! Real data written successfully.")

# import fastf1
# import json
# import os
# import pandas as pd
# import numpy as np

# # Enable caching to process massive multi-lap telemetry streams efficiently
# os.makedirs('fastf1_cache', exist_ok=True)
# fastf1.Cache.enable_cache('fastf1_cache')

# print("🚀 Loading FULL RACE Telemetry (2023 Abu Dhabi Grand Prix)...")
# session = fastf1.get_session(2023, 'Abu Dhabi', 'R')
# session.load(telemetry=True)

# drivers_list = session.drivers
# drivers_config = []
# telemetry_by_driver = {}

# print("🔄 Aggregating continuous telemetry across all laps...")
# for d_num in drivers_list:
#     driver_info = session.get_driver(d_num)
#     d_id = driver_info['Abbreviation']
#     team_color = f"#{driver_info['TeamColor']}" if driver_info['TeamColor'] else "#ffffff"
    
#     drivers_config.append({
#         "id": d_id,
#         "color": team_color,
#         "team": driver_info['TeamName']
#     })
    
#     # Get all laps driven by this driver during the full race
#     driver_laps = session.laps.pick_driver(d_id)
    
#     all_lap_telemetry = []
#     for _, lap in driver_laps.iterrows():
#         try:
#             # Load raw position/car data streams combined
#             tel = lap.get_telemetry()
#             if tel.empty:
#                 continue
            
#             # Use real absolute track progress profile
#             tel = tel.add_relative_distance()
            
#             # Combine current lap number to keep positional progress continuous
#             # Lap progress = (Current Lap Number - 1) + Relative Lap Distance Progress
#             lap_progress = (lap['LapNumber'] - 1) + tel['RelativeDistance']
            
#             df_slice = pd.DataFrame({
#                 'SessionTime': tel['SessionTime'].dt.total_seconds(),
#                 'AbsoluteProgress': lap_progress
#             })
#             all_lap_telemetry.append(df_slice)
#         except Exception:
#             continue
            
#     if all_lap_telemetry:
#         # Concatenate into one unified full-race profile matrix
#         telemetry_by_driver[d_id] = pd.concat(all_lap_telemetry, ignore_index=True).sort_values('SessionTime')

# print("⏱️ Aligning full race timeline...")
# # Find out when the green flag dropped and when the race concluded
# all_session_times = []
# for df in telemetry_by_driver.values():
#     all_session_times.extend(df['SessionTime'].tolist())

# start_time = min(all_session_times)
# end_time = max(all_session_times)

# # Sample the full race every 300ms (keeps file sizes balanced for a 1.5-hour race)
# master_timeline = np.arange(start_time, end_time, 0.3)

# frames = []
# total_laps = 58

# print(TL:=f"Converting {len(master_timeline)} telemetry ticks to JSON matrix...")
# for step_idx, current_time in enumerate(master_timeline):
#     positions_at_frame = []
    
#     for d_config in drivers_config:
#         d_id = d_config["id"]
#         if d_id in telemetry_by_driver:
#             df = telemetry_by_driver[d_id]
            
#             # Interpolate absolute continuous race progress based on SessionTime clock
#             abs_progress = np.interp(current_time, df['SessionTime'], df['AbsoluteProgress'], left=0.0, right=total_laps)
            
#             # Extrapolate circuit map placement (0.0 to 1.0) by separating the remainder from lap count
#             map_placement = abs_progress % 1.0
#             positions_at_frame.append(round(map_placement, 5))
#         else:
#             positions_at_frame.append(0.0)
            
#     # Print status updates periodically for peace of mind
#     if step_idx % 5000 == 0:
#         print(f" -> Processed {step_idx}/{len(master_timeline)} frames...")

#     frames.append({
#         "timestamp": step_idx,
#         "positions": positions_at_frame
#     })
# total_scheduled_laps = int(session.total_laps) if session.total_laps else 58
# print(f"📋 Dynamic Total Laps Found for this GP: {total_scheduled_laps}")

# output_data = {
#     "totalLaps": total_scheduled_laps,
#     "drivers": drivers_config,
#     "frames": frames
# }

# print("💾 Writing complete data to file...")
# with open('data.json', 'w') as f:
#     json.dump(output_data, f)

# print("✅ Success! Whole-race simulation dataset generated successfully.")

# import fastf1
# import json
# import os
# import pandas as pd
# import numpy as np

# # Enable caching to process massive multi-lap telemetry streams efficiently
# os.makedirs('fastf1_cache', exist_ok=True)
# fastf1.Cache.enable_cache('fastf1_cache')

# print("🚀 Loading FULL RACE Telemetry (2023 Abu Dhabi Grand Prix)...")
# session = fastf1.get_session(2023, 'Abu Dhabi', 'R')
# session.load(telemetry=True)

# # Fetch dynamic lap count straight from FastF1 API metadata
# total_scheduled_laps = int(session.total_laps) if session.total_laps else 58
# print(f"📋 Dynamic Total Laps Found for this GP: {total_scheduled_laps}")

# drivers_list = session.drivers
# drivers_config = []
# telemetry_by_driver = {}

# print("🔄 Aggregating continuous telemetry across all laps...")
# for d_num in drivers_list:
#     driver_info = session.get_driver(d_num)
#     d_id = driver_info['Abbreviation']
#     team_color = f"#{driver_info['TeamColor']}" if driver_info['TeamColor'] else "#ffffff"
    
#     drivers_config.append({
#         "id": d_id,
#         "color": team_color,
#         "team": driver_info['TeamName']
#     })
    
#     # Get all laps driven by this driver during the full race
#     driver_laps = session.laps.pick_driver(d_id)
    
#     all_lap_telemetry = []
#     for _, lap in driver_laps.iterrows():
#         try:
#             # Load raw position/car data streams combined
#             tel = lap.get_telemetry()
#             if tel.empty:
#                 continue
            
#             # Use real absolute track progress profile
#             tel = tel.add_relative_distance()
            
#             # Combine current lap number to keep positional progress continuous
#             # Lap progress = (Current Lap Number - 1) + Relative Lap Distance Progress
#             lap_progress = (lap['LapNumber'] - 1) + tel['RelativeDistance']
            
#             df_slice = pd.DataFrame({
#                 'SessionTime': tel['SessionTime'].dt.total_seconds(),
#                 'AbsoluteProgress': lap_progress
#             })
#             all_lap_telemetry.append(df_slice)
#         except Exception:
#             continue
            
#     if all_lap_telemetry:
#         # Concatenate into one unified full-race profile matrix
#         telemetry_by_driver[d_id] = pd.concat(all_lap_telemetry, ignore_index=True).sort_values('SessionTime')

# print("⏱️ Aligning full race timeline...")
# # Find out when the green flag dropped and when the race concluded
# all_session_times = []
# for df in telemetry_by_driver.values():
#     all_session_times.extend(df['SessionTime'].tolist())

# start_time = min(all_session_times)
# end_time = max(all_session_times)

# # Sample the full race every 300ms (keeps file sizes balanced for a 1.5-hour race)
# master_timeline = np.arange(start_time, end_time, 0.3)

# frames = []

# print(f"Converting {len(master_timeline)} telemetry ticks to JSON matrix...")
# for step_idx, current_time in enumerate(master_timeline):
#     positions_at_frame = []
#     highest_lap_observed = 1
    
#     for d_config in drivers_config:
#         d_id = d_config["id"]
#         if d_id in telemetry_by_driver:
#             df = telemetry_by_driver[d_id]
            
#             # Interpolate absolute continuous race progress based on SessionTime clock
#             abs_progress = np.interp(current_time, df['SessionTime'], df['AbsoluteProgress'], left=0.0, right=total_scheduled_laps)
            
#             # Calculate what lap this specific driver is currently on (floor of progress + 1)
#             driver_current_lap = int(np.floor(abs_progress)) + 1
#             if driver_current_lap > highest_lap_observed:
#                 highest_lap_observed = driver_current_lap
            
#             # Extrapolate circuit map placement (0.0 to 1.0) by separating the remainder from lap count
#             map_placement = abs_progress % 1.0
#             positions_at_frame.append(round(map_placement, 5))
#         else:
#             positions_at_frame.append(0.0)
            
#     # Print status updates periodically for peace of mind
#     if step_idx % 5000 == 0:
#         print(f" -> Processed {step_idx}/{len(master_timeline)} frames...")

#     # Pack the positions AND the frame's lap into the payload frame
#     frames.append({
#         "timestamp": step_idx,
#         "currentLap": min(highest_lap_observed, total_scheduled_laps),
#         "positions": positions_at_frame
#     })

# output_data = {
#     "totalLaps": total_scheduled_laps,
#     "drivers": drivers_config,
#     "frames": frames
# }

# print("💾 Writing complete data to file...")
# with open('data.json', 'w') as f:
#     json.dump(output_data, f)

# print("✅ Success! Whole-race simulation dataset generated successfully.")

# """
# Grid-Lock: Track-Native Telemetry Generator
# =============================================
# Strategy shift from your current approach:
#   - OLD: Google-downloaded SVG + manual coordinate alignment to progress values
#   - NEW: Real X/Y position data from FastF1 IS the track shape. No SVG guessing.

# This script produces ONE data.json containing:
#   1. `track_outline`: the actual circuit path (from real car GPS data), which
#      your frontend uses to DRAW the track — you no longer download or hand-align an SVG.
#   2. `frames`: every car's real X/Y position sampled every 300ms across the
#      whole race, normalized into the same coordinate space as track_outline.

# Because both the track shape and the car positions come from the SAME
# coordinate system (FastF1's meters-based X/Y plane), there is no alignment
# math left to do. This is what eliminates the "slows down after corners" bug —
# that bug was a symptom of two mismatched coordinate spaces, not a bug in your
# interpolation logic itself.

# Run this once per session/circuit. The output format is identical for every
# GP, so your frontend needs zero per-circuit changes.
# """

# import fastf1
# import numpy as np
# import json
# import os

# # ----------------------------------------------------------------------
# # CONFIG — change these two lines per race, nothing else in the pipeline changes
# # ----------------------------------------------------------------------
# YEAR = 2023
# GP = "Abu Dhabi"
# SESSION_TYPE = "R"  # Race
# SAMPLE_INTERVAL_MS = 300
# CACHE_DIR = "fastf1_cache"
# OUTPUT_PATH = "data.json"


# def load_session():
#     os.makedirs(CACHE_DIR, exist_ok=True)
#     fastf1.Cache.enable_cache(CACHE_DIR)
#     session = fastf1.get_session(YEAR, GP, SESSION_TYPE)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def build_track_outline(session):
#     """
#     Build the actual circuit shape from real telemetry — this REPLACES your
#     downloaded SVG. We take one clean, representative lap (fastest lap of the
#     race) and extract its raw X/Y position channel.

#     This outline is in the same coordinate units (meters, roughly) as every
#     other car's position data, so nothing needs re-alignment later.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()  # columns: Time, X, Y, Z, Status

#     # Keep it lightweight for the frontend — a few hundred points is plenty
#     # to render a smooth SVG <path>, no need to send every raw sample.
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     # Downsample evenly to ~300 points for a clean path
#     n_points = min(300, len(xs))
#     idx = np.linspace(0, len(xs) - 1, n_points).astype(int)
#     outline = [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]

#     return outline, (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))


# def build_driver_frame_series(session, master_timeline):
#     """
#     For every driver, resample their real X/Y position (not progress-percentage,
#     actual coordinates) onto the shared master_timeline using linear
#     interpolation. This is the same 300ms interlocking idea you already had —
#     the fix is WHAT we're interpolating (real coordinates) instead of a
#     progress float that then had to be re-mapped onto SVG pixels.
#     """
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

#             t_seconds = tel["Time"].dt.total_seconds().to_numpy()
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

#         # Sort by time - laps can overlap slightly at boundaries
#         order = np.argsort(t_concat)
#         t_concat = t_concat[order]
#         x_concat = x_concat[order]
#         y_concat = y_concat[order]
#         lap_concat = lap_concat[order]

#         # Interpolate real X/Y onto the shared master timeline.
#         # This is safe because X/Y are continuous physical coordinates —
#         # unlike lap-progress %, they don't reset to 0 at the start/finish line,
#         # so there's no snapping artifact to cause the slowdown bug.
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
#     print(f"Loading {YEAR} {GP} {SESSION_TYPE} session...")
#     session = load_session()

#     print("Building track outline from real position data...")
#     track_outline, bounds = build_track_outline(session)

#     print("Building master timeline...")
#     race_laps = session.laps
#     t_min = race_laps["LapStartTime"].dt.total_seconds().min()
#     t_max = (race_laps["Time"].dt.total_seconds().max())
#     master_timeline = np.arange(t_min, t_max, SAMPLE_INTERVAL_MS / 1000.0)

#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({SAMPLE_INTERVAL_MS}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap = series["x"][i], series["y"][i], series["lap"][i]
#             if np.isnan(x):
#                 continue  # driver not on track yet / already finished
#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#             }
#         frames.append({"t": round(float(t), 2), "cars": frame_cars})

#     output = {
#         "meta": {
#             "year": YEAR,
#             "gp": GP,
#             "session": SESSION_TYPE,
#             "sample_interval_ms": SAMPLE_INTERVAL_MS,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "team_colors": team_colors,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     with open(OUTPUT_PATH, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {OUTPUT_PATH}")
#     print("track_outline and every frame share the SAME coordinate space —")
#     print("your frontend can now draw the circuit AND plot cars using one scale/transform.")


# if __name__ == "__main__":
#     main()

# """
# Grid-Lock: Track-Native Telemetry Generator
# =============================================
# Strategy shift from your current approach:
#   - OLD: Google-downloaded SVG + manual coordinate alignment to progress values
#   - NEW: Real X/Y position data from FastF1 IS the track shape. No SVG guessing.

# This script produces ONE data.json containing:
#   1. `track_outline`: the actual circuit path (from real car GPS data), which
#      your frontend uses to DRAW the track — you no longer download or hand-align an SVG.
#   2. `frames`: every car's real X/Y position sampled every 300ms across the
#      whole race, normalized into the same coordinate space as track_outline.

# Because both the track shape and the car positions come from the SAME
# coordinate system (FastF1's meters-based X/Y plane), there is no alignment
# math left to do. This is what eliminates the "slows down after corners" bug —
# that bug was a symptom of two mismatched coordinate spaces, not a bug in your
# interpolation logic itself.

# Run this once per session/circuit. The output format is identical for every
# GP, so your frontend needs zero per-circuit changes.
# """

# import fastf1
# import numpy as np
# import pandas as pd
# import json
# import os

# # ----------------------------------------------------------------------
# # CONFIG — change these two lines per race, nothing else in the pipeline changes
# # ----------------------------------------------------------------------
# YEAR = 2023
# GP = "Abu Dhabi"
# SESSION_TYPE = "R"  # Race
# SAMPLE_INTERVAL_MS = 300
# CACHE_DIR = "fastf1_cache"
# OUTPUT_PATH = "data.json"


# def load_session():
#     os.makedirs(CACHE_DIR, exist_ok=True)
#     fastf1.Cache.enable_cache(CACHE_DIR)
#     session = fastf1.get_session(YEAR, GP, SESSION_TYPE)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def build_track_outline(session):
#     """
#     Build the actual circuit shape from real telemetry — this REPLACES your
#     downloaded SVG. We take one clean, representative lap (fastest lap of the
#     race) and extract its raw X/Y position channel.

#     This outline is in the same coordinate units (meters, roughly) as every
#     other car's position data, so nothing needs re-alignment later.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()  # columns: Time, X, Y, Z, Status

#     # Keep it lightweight for the frontend — a few hundred points is plenty
#     # to render a smooth SVG <path>, no need to send every raw sample.
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     # Downsample evenly to ~300 points for a clean path
#     n_points = min(300, len(xs))
#     idx = np.linspace(0, len(xs) - 1, n_points).astype(int)
#     outline = [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]

#     return outline, (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))


# def build_driver_frame_series(session, master_timeline):
#     """
#     For every driver, resample their real X/Y position (not progress-percentage,
#     actual coordinates) onto the shared master_timeline using linear
#     interpolation. This is the same 300ms interlocking idea you already had —
#     the fix is WHAT we're interpolating (real coordinates) instead of a
#     progress float that then had to be re-mapped onto SVG pixels.
#     """
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

#             # CRITICAL FIX: telemetry Time is relative to lap start.
#             # We need to convert to absolute session time by adding the LapStartTime.
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

#         # Sort by time - laps can overlap slightly at boundaries
#         order = np.argsort(t_concat)
#         t_concat = t_concat[order]
#         x_concat = x_concat[order]
#         y_concat = y_concat[order]
#         lap_concat = lap_concat[order]

#         # Remove duplicates: keep only the first occurrence of each time value
#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat = t_concat[unique_idx]
#         x_concat = x_concat[unique_idx]
#         y_concat = y_concat[unique_idx]
#         lap_concat = lap_concat[unique_idx]

#         # Interpolate real X/Y onto the shared master timeline.
#         # This is safe because X/Y are continuous physical coordinates —
#         # unlike lap-progress %, they don't reset to 0 at the start/finish line,
#         # so there's no snapping artifact to cause the slowdown bug.
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
#     print(f"Loading {YEAR} {GP} {SESSION_TYPE} session...")
#     session = load_session()

#     print("Building track outline from real position data...")
#     track_outline, bounds = build_track_outline(session)

#     print("Building master timeline...")
#     race_laps = session.laps
    
#     # Find the actual time bounds from telemetry, not just lap metadata
#     # This ensures we're using the same time reference as the telemetry data
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
#     master_timeline = np.arange(t_min, t_max, SAMPLE_INTERVAL_MS / 1000.0)

#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({SAMPLE_INTERVAL_MS}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap = series["x"][i], series["y"][i], series["lap"][i]
#             if np.isnan(x):
#                 continue  # driver not on track yet / already finished
#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#             }
#         frames.append({"t": round(float(t), 2), "cars": frame_cars})

#     output = {
#         "meta": {
#             "year": YEAR,
#             "gp": GP,
#             "session": SESSION_TYPE,
#             "sample_interval_ms": SAMPLE_INTERVAL_MS,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "team_colors": team_colors,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     with open(OUTPUT_PATH, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {OUTPUT_PATH}")
#     print("track_outline and every frame share the SAME coordinate space —")
#     print("your frontend can now draw the circuit AND plot cars using one scale/transform.")


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

    n_points = min(300, len(xs))
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

        all_t, all_x, all_y, all_lap = [], [], [], []

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

            all_t.append(t_seconds)
            all_x.append(tel["X"].to_numpy())
            all_y.append(tel["Y"].to_numpy())
            all_lap.append(np.full(len(tel), lap["LapNumber"]))

        if not all_t:
            continue

        t_concat = np.concatenate(all_t)
        x_concat = np.concatenate(all_x)
        y_concat = np.concatenate(all_y)
        lap_concat = np.concatenate(all_lap)

        order = np.argsort(t_concat)
        t_concat = t_concat[order]
        x_concat = x_concat[order]
        y_concat = y_concat[order]
        lap_concat = lap_concat[order]

        _, unique_idx = np.unique(t_concat, return_index=True)
        unique_idx = np.sort(unique_idx)
        t_concat = t_concat[unique_idx]
        x_concat = x_concat[unique_idx]
        y_concat = y_concat[unique_idx]
        lap_concat = lap_concat[unique_idx]

        x_interp = np.interp(master_timeline, t_concat, x_concat, left=np.nan, right=np.nan)
        y_interp = np.interp(master_timeline, t_concat, y_concat, left=np.nan, right=np.nan)
        lap_interp = np.interp(master_timeline, t_concat, lap_concat, left=np.nan, right=np.nan)

        driver_series[abbr] = {
            "x": x_interp,
            "y": y_interp,
            "lap": lap_interp,
        }

    return driver_series, team_colors

def main():
    args = parse_arguments()
    
    # Sanitize naming for filesystem compatibility
    safe_gp_name = args.gp.lower().replace(" ", "_")
    output_filename = f"{args.year}_{safe_gp_name}_{args.session.lower()}.json"
    
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

    print("Interpolating driver positions onto shared timeline...")
    driver_series, team_colors = build_driver_frame_series(session, master_timeline)

    print("Assembling frames...")
    frames = []
    for i, t in enumerate(master_timeline):
        frame_cars = {}
        for abbr, series in driver_series.items():
            x, y, lap = series["x"][i], series["y"][i], series["lap"][i]
            if np.isnan(x):
                continue
            frame_cars[abbr] = {
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "lap": int(lap) if not np.isnan(lap) else None,
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

    # Ensure output directory exists if you save them under public/races/
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Safely navigate up one level, then into frontend/public/races
    target_dir = os.path.join(script_dir, "..", "frontend", "public", "races")

    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, output_filename)
    
    with open(target_path, "w") as f:
        json.dump(output, f)

    print(f"\nSuccessfully wrote telemetry to: {target_path}")

if __name__ == "__main__":
    main()