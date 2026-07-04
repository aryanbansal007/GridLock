# """
# Grid-Lock: Track-Native Telemetry Generator v2
# =================================================
# Fixes vs v1:
#   - Forward-fill through telemetry gaps (was: np.interp straight-lines
#     through gaps, which cuts through track geometry — the off-track bug)
#   - Uses FastF1's own `Distance` channel for in-lap progress instead of
#     reconstructing it from nearest-point lookups — this is what makes
#     the leaderboard gap/sync numbers actually correct
#   - Track outline resampled by arc length to 4000 points (was: raw 300
#     points, uneven spacing, jagged corners)
#   - Adds track_status per frame (yellow / red / safety car / clear)
#   - Adds official race Status (Finished/Retired/etc) from session.results
#   - Adds tyre compound + pit status per frame
# """

# import argparse
# import os
# import json

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year", type=int, required=True)
#     p.add_argument("--gp", type=str, required=True)
#     p.add_argument("--session", type=str, default="R")
#     p.add_argument("--sample-ms", type=int, default=300)
#     p.add_argument("--cache-dir", type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def build_track_outline(session, n_points=4000):
#     """
#     Dense, EVENLY-SPACED (by arc length) resample of the fastest lap's
#     position data. Raw telemetry points cluster on straights (car moving
#     fast = fewer samples per meter isn't true, but corner sampling is
#     still uneven), so we resample by distance-along-path rather than by
#     raw index. This is what makes tight corners render as smooth curves
#     instead of jagged polygons.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_length = float(cum_dist[-1])

#     target = np.linspace(0, total_length, n_points)
#     xs_dense = np.interp(target, cum_dist, xs)
#     ys_dense = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_length


# def build_track_status_timeline(session):
#     """
#     Real flag data from FastF1. Returns sorted change-points; we look up
#     "what flag was active at time t" by scanning for the last change
#     at-or-before t.
#     """
#     events = []
#     for _, row in session.track_status.iterrows():
#         t = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     """cursor_state is a 1-element list holding the current index, so
#     repeated calls with increasing t don't rescan from the start."""
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     """
#     Official finishing status per driver — Finished / Retired / DNF /
#     Accident / etc. This replaces guessing "is this driver still racing"
#     from gaps in the telemetry; FastF1 already knows the real answer.
#     """
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status": row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# def build_driver_frame_series(session, master_timeline):
#     driver_series = {}
#     team_colors = {}
#     driver_names = {}

#     MAX_GAP_SECONDS = 2.0  # beyond this, hold last position instead of interpolating

#     for drv in session.drivers:
#         info = session.get_driver(drv)
#         abbr = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr] = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         all_t, all_x, all_y, all_lap, all_dist = [], [], [], [], []
#         all_compound, all_tyre_life, all_in_pit = [], [], []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             # Skip laps with missing/corrupt telemetry entirely rather
#             # than let bad data poison the interpolation — this is the
#             # actual root cause of cars flying off track, on ANY circuit.
#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             in_pit = bool(pd.notna(lap.get("PitInTime")) or pd.notna(lap.get("PitOutTime")))
#             compound = lap.get("Compound") or "UNKNOWN"
#             tyre_life = lap.get("TyreLife")
#             tyre_life = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy())
#             all_y.append(tel["Y"].to_numpy())
#             all_dist.append(tel["Distance"].to_numpy())  # in-lap distance, FastF1-native
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(np.full(n, in_pit))

#         if not all_t:
#             continue

#         t_concat = np.concatenate(all_t)
#         x_concat = np.concatenate(all_x)
#         y_concat = np.concatenate(all_y)
#         dist_concat = np.concatenate(all_dist)
#         lap_concat = np.concatenate(all_lap)
#         compound_concat = np.concatenate(all_compound)
#         tyre_life_concat = np.concatenate(all_tyre_life)
#         in_pit_concat = np.concatenate(all_in_pit)

#         order = np.argsort(t_concat)
#         arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                   compound_concat, tyre_life_concat, in_pit_concat]
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [a[order] for a in arrays]

#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [
#                 a[unique_idx] for a in
#                 [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                  compound_concat, tyre_life_concat, in_pit_concat]
#             ]

#         x_out = np.full(len(master_timeline), np.nan)
#         y_out = np.full(len(master_timeline), np.nan)
#         lap_out = np.full(len(master_timeline), np.nan)
#         dist_out = np.full(len(master_timeline), np.nan)
#         compound_out = np.full(len(master_timeline), "UNKNOWN", dtype=object)
#         tyre_life_out = np.full(len(master_timeline), 0.0)
#         in_pit_out = np.full(len(master_timeline), False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_concat) and t_concat[j + 1] <= t:
#                 j += 1

#             if t < t_concat[0] or t > t_concat[-1]:
#                 continue  # driver not on track yet / already finished

#             gap_to_next = (t_concat[j + 1] - t_concat[j]) if j + 1 < len(t_concat) else 0

#             if 0 < gap_to_next <= MAX_GAP_SECONDS and j + 1 < len(t_concat):
#                 frac = (t - t_concat[j]) / gap_to_next
#                 x_out[i] = x_concat[j] + frac * (x_concat[j + 1] - x_concat[j])
#                 y_out[i] = y_concat[j] + frac * (y_concat[j + 1] - y_concat[j])
#                 dist_out[i] = dist_concat[j] + frac * (dist_concat[j + 1] - dist_concat[j])
#             else:
#                 # Real gap in telemetry (e.g. GPS dropout in a Monaco
#                 # tunnel) — hold last known position instead of drawing
#                 # a straight line through it.
#                 x_out[i] = x_concat[j]
#                 y_out[i] = y_concat[j]
#                 dist_out[i] = dist_concat[j]

#             lap_out[i] = lap_concat[j]
#             compound_out[i] = compound_concat[j]
#             tyre_life_out[i] = tyre_life_concat[j]
#             in_pit_out[i] = in_pit_concat[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
#             "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Building track outline (4000-point arc-length resample)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session)

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results (Finished/Retired/etc)...")
#     results_map = build_results_map(session)

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

#     t_min, t_max = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     status_cursor = [0]
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap, dist = series["x"][i], series["y"][i], series["lap"][i], series["dist"][i]
#             if np.isnan(x):
#                 continue

#             total_distance = (lap - 1) * avg_lap_length + dist if not np.isnan(lap) else dist

#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit": bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         frames.append({"t": round(float(t), 2), "cars": frame_cars, "flag": flag})

#     output = {
#         "meta": {
#             "year": args.year,
#             "gp": args.gp,
#             "session": args.session,
#             "sample_interval_ms": args.sample_ms,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length": avg_lap_length,
#             "team_colors": team_colors,
#             "driver_names": driver_names,
#             "results": results_map,
#             "total_laps": int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     safe_gp = args.gp.lower().replace(" ", "_")
#     out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {out_path}")


# if __name__ == "__main__":
#     main()

# """
# Grid-Lock: Track-Native Telemetry Generator v3
# =================================================
# Changes vs v2:
#   - Uses session.get_circuit_info() to extract:
#       * rotation angle  → written to meta.rotation (degrees)
#       * finish line x/y → written to meta.finish_line
#     These two additions fix track orientation for ALL circuits and let the
#     frontend draw the start/finish line without any per-circuit manual tuning.
#   - Everything else (forward-fill, 4000-pt outline, cumulative distance,
#     tyres, flags, results) is unchanged from v2.
# """

# import argparse
# import os
# import json
# import math

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year",       type=int, required=True)
#     p.add_argument("--gp",         type=str, required=True)
#     p.add_argument("--session",    type=str, default="R")
#     p.add_argument("--sample-ms",  type=int, default=300)
#     p.add_argument("--cache-dir",  type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def get_circuit_meta(session):
#     """
#     Pull rotation angle and finish-line position from FastF1's circuit info.

#     circuit_info.rotation is the angle (degrees) needed to rotate the raw
#     telemetry coordinate frame so it matches the real-world map orientation
#     you would see on Google Maps / F1 broadcast graphics.

#     The finish line is the point at distance=0 on the reference lap, which
#     is the first point of the fastest lap's position data.
#     """
#     try:
#         circuit_info = session.get_circuit_info()
#         rotation_deg = float(circuit_info.rotation)
#     except Exception as e:
#         print(f"  ⚠ Could not get circuit rotation: {e}. Defaulting to 0°.")
#         rotation_deg = 0.0

#     # Finish line = start of the fastest lap's telemetry
#     try:
#         fastest_lap = session.laps.pick_fastest()
#         pos = fastest_lap.get_pos_data()
#         finish_x = float(pos["X"].iloc[0])
#         finish_y = float(pos["Y"].iloc[0])
#     except Exception as e:
#         print(f"  ⚠ Could not get finish line position: {e}. Defaulting to (0, 0).")
#         finish_x, finish_y = 0.0, 0.0

#     return rotation_deg, finish_x, finish_y


# def rotate_points(xs, ys, angle_deg):
#     """
#     Rotate a set of (x, y) points by angle_deg around their centroid.
#     This is applied to BOTH the track outline and every car position so
#     they all stay in the same coordinate space after rotation.
#     """
#     if angle_deg == 0.0:
#         return xs, ys

#     angle_rad = math.radians(angle_deg)
#     cx = float(np.mean(xs))
#     cy = float(np.mean(ys))

#     cos_a = math.cos(angle_rad)
#     sin_a = math.sin(angle_rad)

#     xs_rot = cos_a * (xs - cx) - sin_a * (ys - cy) + cx
#     ys_rot = sin_a * (xs - cx) + cos_a * (ys - cy) + cy

#     return xs_rot, ys_rot


# def build_track_outline(session, rotation_deg, n_points=4000):
#     """
#     Dense, arc-length-resampled track outline — same as v2 but now also
#     rotated so the result matches real-world map orientation.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy(dtype=float)
#     ys = pos["Y"].to_numpy(dtype=float)

#     # Rotate raw coordinates to match map orientation
#     xs, ys = rotate_points(xs, ys, rotation_deg)

#     # Arc-length resample to n_points evenly spaced by distance
#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist    = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_len   = float(cum_dist[-1])
#     target      = np.linspace(0, total_len, n_points)
#     xs_dense    = np.interp(target, cum_dist, xs)
#     ys_dense    = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds  = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_len


# def build_track_status_timeline(session):
#     events = []
#     for _, row in session.track_status.iterrows():
#         t      = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status":         row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# def build_driver_frame_series(session, master_timeline, rotation_deg):
#     """
#     Same forward-fill logic as v2, but now rotates each car's x/y by the
#     same angle as the track outline so cars stay on the track visually.
#     """
#     driver_series = {}
#     team_colors   = {}
#     driver_names  = {}

#     MAX_GAP_SECONDS = 2.0

#     for drv in session.drivers:
#         info  = session.get_driver(drv)
#         abbr  = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr]  = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         all_t, all_x, all_y         = [], [], []
#         all_lap, all_dist           = [], []
#         all_compound, all_tyre_life = [], []
#         all_in_pit                  = []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             in_pit     = bool(pd.notna(lap.get("PitInTime")) or pd.notna(lap.get("PitOutTime")))
#             compound   = lap.get("Compound") or "UNKNOWN"
#             tyre_life  = lap.get("TyreLife")
#             tyre_life  = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy(dtype=float))
#             all_y.append(tel["Y"].to_numpy(dtype=float))
#             all_dist.append(tel["Distance"].to_numpy(dtype=float))
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(np.full(n, in_pit))

#         if not all_t:
#             continue

#         t_c   = np.concatenate(all_t)
#         x_c   = np.concatenate(all_x)
#         y_c   = np.concatenate(all_y)
#         d_c   = np.concatenate(all_dist)
#         lap_c = np.concatenate(all_lap)
#         cmp_c = np.concatenate(all_compound)
#         tl_c  = np.concatenate(all_tyre_life)
#         pit_c = np.concatenate(all_in_pit)

#         order = np.argsort(t_c)
#         t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c = (
#             a[order] for a in [t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c]
#         )

#         _, uidx = np.unique(t_c, return_index=True)
#         uidx = np.sort(uidx)
#         t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c = (
#             a[uidx] for a in [t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c]
#         )

#         # Rotate car positions to match track orientation
#         x_c, y_c = rotate_points(x_c, y_c, rotation_deg)

#         n_frames = len(master_timeline)
#         x_out   = np.full(n_frames, np.nan)
#         y_out   = np.full(n_frames, np.nan)
#         lap_out = np.full(n_frames, np.nan)
#         d_out   = np.full(n_frames, np.nan)
#         cmp_out = np.full(n_frames, "UNKNOWN", dtype=object)
#         tl_out  = np.full(n_frames, 0.0)
#         pit_out = np.full(n_frames, False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_c) and t_c[j + 1] <= t:
#                 j += 1

#             if t < t_c[0] or t > t_c[-1]:
#                 continue

#             gap = (t_c[j + 1] - t_c[j]) if j + 1 < len(t_c) else 0

#             if 0 < gap <= MAX_GAP_SECONDS and j + 1 < len(t_c):
#                 frac    = (t - t_c[j]) / gap
#                 x_out[i] = x_c[j] + frac * (x_c[j + 1] - x_c[j])
#                 y_out[i] = y_c[j] + frac * (y_c[j + 1] - y_c[j])
#                 d_out[i] = d_c[j] + frac * (d_c[j + 1] - d_c[j])
#             else:
#                 # Hold last known position — never interpolate through a gap
#                 x_out[i] = x_c[j]
#                 y_out[i] = y_c[j]
#                 d_out[i] = d_c[j]

#             lap_out[i] = lap_c[j]
#             cmp_out[i] = cmp_c[j]
#             tl_out[i]  = tl_c[j]
#             pit_out[i] = pit_c[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": d_out,
#             "compound": cmp_out, "tyre_life": tl_out, "in_pit": pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Reading circuit info (rotation + finish line)...")
#     rotation_deg, finish_x, finish_y = get_circuit_meta(session)
#     print(f"  Rotation: {rotation_deg:.1f}°")
#     print(f"  Finish line raw: ({finish_x:.1f}, {finish_y:.1f})")

#     print("Building track outline (4000-point arc-length resample, rotated)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session, rotation_deg)

#     # Rotate finish line coordinates to match the rotated track
#     fl_xs, fl_ys = rotate_points(
#         np.array([finish_x]), np.array([finish_y]), rotation_deg
#     )
#     finish_line = {"x": float(fl_xs[0]), "y": float(fl_ys[0])}
#     print(f"  Finish line rotated: ({finish_line['x']:.1f}, {finish_line['y']:.1f})")

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results...")
#     results_map = build_results_map(session)

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

#     t_min, t_max   = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"  {len(master_timeline)} frames, {(t_max - t_min):.0f}s total")

#     print("Interpolating driver positions (rotated, forward-filled)...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(
#         session, master_timeline, rotation_deg
#     )

#     print("Assembling frames...")
#     frames         = []
#     status_cursor  = [0]

#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y   = series["x"][i], series["y"][i]
#             lap    = series["lap"][i]
#             dist   = series["dist"][i]

#             if np.isnan(x):
#                 continue

#             total_distance = (
#                 (lap - 1) * avg_lap_length + dist
#                 if not np.isnan(lap) else dist
#             )

#             frame_cars[abbr] = {
#                 "x":        round(float(x), 2),
#                 "y":        round(float(y), 2),
#                 "lap":      int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit":   bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         frames.append({"t": round(float(t), 2), "cars": frame_cars, "flag": flag})

#     output = {
#         "meta": {
#             "year":               args.year,
#             "gp":                 args.gp,
#             "session":            args.session,
#             "sample_interval_ms": args.sample_ms,
#             "rotation":           rotation_deg,
#             "finish_line":        finish_line,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length":     avg_lap_length,
#             "team_colors":        team_colors,
#             "driver_names":       driver_names,
#             "results":            results_map,
#             "total_laps":         int(session.total_laps)
#                                   if hasattr(session, "total_laps") and session.total_laps
#                                   else None,
#         },
#         "track_outline": track_outline,
#         "frames":        frames,
#     }

#     safe_gp  = args.gp.lower().replace(" ", "_")
#     out_dir  = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"\n✅ Done. Wrote {len(frames)} frames → {out_path}")
#     print(f"   Track outline: {len(track_outline)} points")
#     print(f"   Rotation applied: {rotation_deg:.1f}°")
#     print(f"   Finish line: {finish_line}")


# if __name__ == "__main__":
#     main()

# """
# Grid-Lock: Track-Native Telemetry Generator v2
# =================================================
# Fixes vs v1:
#   - Forward-fill through telemetry gaps (was: np.interp straight-lines
#     through gaps, which cuts through track geometry — the off-track bug)
#   - Uses FastF1's own `Distance` channel for in-lap progress instead of
#     reconstructing it from nearest-point lookups — this is what makes
#     the leaderboard gap/sync numbers actually correct
#   - Track outline resampled by arc length to 4000 points (was: raw 300
#     points, uneven spacing, jagged corners)
#   - Adds track_status per frame (yellow / red / safety car / clear)
#   - Adds official race Status (Finished/Retired/etc) from session.results
#   - Adds tyre compound + pit status per frame
# """

# import argparse
# import os
# import json

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year", type=int, required=True)
#     p.add_argument("--gp", type=str, required=True)
#     p.add_argument("--session", type=str, default="R")
#     p.add_argument("--sample-ms", type=int, default=300)
#     p.add_argument("--cache-dir", type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def build_track_outline(session, n_points=4000):
#     """
#     Dense, EVENLY-SPACED (by arc length) resample of the fastest lap's
#     position data. Raw telemetry points cluster on straights (car moving
#     fast = fewer samples per meter isn't true, but corner sampling is
#     still uneven), so we resample by distance-along-path rather than by
#     raw index. This is what makes tight corners render as smooth curves
#     instead of jagged polygons.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_length = float(cum_dist[-1])

#     target = np.linspace(0, total_length, n_points)
#     xs_dense = np.interp(target, cum_dist, xs)
#     ys_dense = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_length


# def build_track_status_timeline(session):
#     """
#     Real flag data from FastF1. Returns sorted change-points; we look up
#     "what flag was active at time t" by scanning for the last change
#     at-or-before t.
#     """
#     events = []
#     for _, row in session.track_status.iterrows():
#         t = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     """cursor_state is a 1-element list holding the current index, so
#     repeated calls with increasing t don't rescan from the start."""
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     """
#     Official finishing status per driver — Finished / Retired / DNF /
#     Accident / etc. This replaces guessing "is this driver still racing"
#     from gaps in the telemetry; FastF1 already knows the real answer.
#     """
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status": row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# def build_driver_frame_series(session, master_timeline):
#     driver_series = {}
#     team_colors = {}
#     driver_names = {}

#     MAX_GAP_SECONDS = 2.0  # beyond this, hold last position instead of interpolating

#     for drv in session.drivers:
#         info = session.get_driver(drv)
#         abbr = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr] = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         all_t, all_x, all_y, all_lap, all_dist = [], [], [], [], []
#         all_compound, all_tyre_life, all_in_pit = [], [], []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             # Skip laps with missing/corrupt telemetry entirely rather
#             # than let bad data poison the interpolation — this is the
#             # actual root cause of cars flying off track, on ANY circuit.
#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             in_pit = bool(pd.notna(lap.get("PitInTime")) or pd.notna(lap.get("PitOutTime")))
#             compound = lap.get("Compound") or "UNKNOWN"
#             tyre_life = lap.get("TyreLife")
#             tyre_life = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy())
#             all_y.append(tel["Y"].to_numpy())
#             all_dist.append(tel["Distance"].to_numpy())  # in-lap distance, FastF1-native
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(np.full(n, in_pit))

#         if not all_t:
#             continue

#         t_concat = np.concatenate(all_t)
#         x_concat = np.concatenate(all_x)
#         y_concat = np.concatenate(all_y)
#         dist_concat = np.concatenate(all_dist)
#         lap_concat = np.concatenate(all_lap)
#         compound_concat = np.concatenate(all_compound)
#         tyre_life_concat = np.concatenate(all_tyre_life)
#         in_pit_concat = np.concatenate(all_in_pit)

#         order = np.argsort(t_concat)
#         arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                   compound_concat, tyre_life_concat, in_pit_concat]
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [a[order] for a in arrays]

#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [
#                 a[unique_idx] for a in
#                 [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                  compound_concat, tyre_life_concat, in_pit_concat]
#             ]

#         x_out = np.full(len(master_timeline), np.nan)
#         y_out = np.full(len(master_timeline), np.nan)
#         lap_out = np.full(len(master_timeline), np.nan)
#         dist_out = np.full(len(master_timeline), np.nan)
#         compound_out = np.full(len(master_timeline), "UNKNOWN", dtype=object)
#         tyre_life_out = np.full(len(master_timeline), 0.0)
#         in_pit_out = np.full(len(master_timeline), False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_concat) and t_concat[j + 1] <= t:
#                 j += 1

#             if t < t_concat[0] or t > t_concat[-1]:
#                 continue  # driver not on track yet / already finished

#             gap_to_next = (t_concat[j + 1] - t_concat[j]) if j + 1 < len(t_concat) else 0

#             if 0 < gap_to_next <= MAX_GAP_SECONDS and j + 1 < len(t_concat):
#                 frac = (t - t_concat[j]) / gap_to_next
#                 x_out[i] = x_concat[j] + frac * (x_concat[j + 1] - x_concat[j])
#                 y_out[i] = y_concat[j] + frac * (y_concat[j + 1] - y_concat[j])
#                 dist_out[i] = dist_concat[j] + frac * (dist_concat[j + 1] - dist_concat[j])
#             else:
#                 # Real gap in telemetry (e.g. GPS dropout in a Monaco
#                 # tunnel) — hold last known position instead of drawing
#                 # a straight line through it.
#                 x_out[i] = x_concat[j]
#                 y_out[i] = y_concat[j]
#                 dist_out[i] = dist_concat[j]

#             lap_out[i] = lap_concat[j]
#             compound_out[i] = compound_concat[j]
#             tyre_life_out[i] = tyre_life_concat[j]
#             in_pit_out[i] = in_pit_concat[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
#             "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Building track outline (4000-point arc-length resample)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session)

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results (Finished/Retired/etc)...")
#     results_map = build_results_map(session)

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

#     t_min, t_max = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     status_cursor = [0]
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap, dist = series["x"][i], series["y"][i], series["lap"][i], series["dist"][i]
#             if np.isnan(x):
#                 continue

#             total_distance = (lap - 1) * avg_lap_length + dist if not np.isnan(lap) else dist

#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit": bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         frames.append({"t": round(float(t), 2), "cars": frame_cars, "flag": flag})

#     output = {
#         "meta": {
#             "year": args.year,
#             "gp": args.gp,
#             "session": args.session,
#             "sample_interval_ms": args.sample_ms,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length": avg_lap_length,
#             "team_colors": team_colors,
#             "driver_names": driver_names,
#             "results": results_map,
#             "total_laps": int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     safe_gp = args.gp.lower().replace(" ", "_")
#     out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {out_path}")


# if __name__ == "__main__":
#     main()

# """
# Grid-Lock: Track-Native Telemetry Generator v3
# =================================================
# Changes vs v2:
#   - Uses session.get_circuit_info() to extract:
#       * rotation angle  → written to meta.rotation (degrees)
#       * finish line x/y → written to meta.finish_line
#     These two additions fix track orientation for ALL circuits and let the
#     frontend draw the start/finish line without any per-circuit manual tuning.
#   - Everything else (forward-fill, 4000-pt outline, cumulative distance,
#     tyres, flags, results) is unchanged from v2.
# """

# import argparse
# import os
# import json
# import math

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year",       type=int, required=True)
#     p.add_argument("--gp",         type=str, required=True)
#     p.add_argument("--session",    type=str, default="R")
#     p.add_argument("--sample-ms",  type=int, default=300)
#     p.add_argument("--cache-dir",  type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def get_circuit_meta(session):
#     """
#     Pull rotation angle and finish-line position from FastF1's circuit info.

#     circuit_info.rotation is the angle (degrees) needed to rotate the raw
#     telemetry coordinate frame so it matches the real-world map orientation
#     you would see on Google Maps / F1 broadcast graphics.

#     The finish line is the point at distance=0 on the reference lap, which
#     is the first point of the fastest lap's position data.
#     """
#     try:
#         circuit_info = session.get_circuit_info()
#         rotation_deg = float(circuit_info.rotation)
#     except Exception as e:
#         print(f"  ⚠ Could not get circuit rotation: {e}. Defaulting to 0°.")
#         rotation_deg = 0.0

#     # Finish line = start of the fastest lap's telemetry
#     try:
#         fastest_lap = session.laps.pick_fastest()
#         pos = fastest_lap.get_pos_data()
#         finish_x = float(pos["X"].iloc[0])
#         finish_y = float(pos["Y"].iloc[0])
#     except Exception as e:
#         print(f"  ⚠ Could not get finish line position: {e}. Defaulting to (0, 0).")
#         finish_x, finish_y = 0.0, 0.0

#     return rotation_deg, finish_x, finish_y


# def rotate_points(xs, ys, angle_deg):
#     """
#     Rotate a set of (x, y) points by angle_deg around their centroid.
#     This is applied to BOTH the track outline and every car position so
#     they all stay in the same coordinate space after rotation.
#     """
#     if angle_deg == 0.0:
#         return xs, ys

#     angle_rad = math.radians(angle_deg)
#     cx = float(np.mean(xs))
#     cy = float(np.mean(ys))

#     cos_a = math.cos(angle_rad)
#     sin_a = math.sin(angle_rad)

#     xs_rot = cos_a * (xs - cx) - sin_a * (ys - cy) + cx
#     ys_rot = sin_a * (xs - cx) + cos_a * (ys - cy) + cy

#     return xs_rot, ys_rot


# def build_track_outline(session, rotation_deg, n_points=4000):
#     """
#     Dense, arc-length-resampled track outline — same as v2 but now also
#     rotated so the result matches real-world map orientation.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy(dtype=float)
#     ys = pos["Y"].to_numpy(dtype=float)

#     # Rotate raw coordinates to match map orientation
#     xs, ys = rotate_points(xs, ys, rotation_deg)

#     # Arc-length resample to n_points evenly spaced by distance
#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist    = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_len   = float(cum_dist[-1])
#     target      = np.linspace(0, total_len, n_points)
#     xs_dense    = np.interp(target, cum_dist, xs)
#     ys_dense    = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds  = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_len


# def build_track_status_timeline(session):
#     events = []
#     for _, row in session.track_status.iterrows():
#         t      = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status":         row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# def build_driver_frame_series(session, master_timeline, rotation_deg):
#     """
#     Same forward-fill logic as v2, but now rotates each car's x/y by the
#     same angle as the track outline so cars stay on the track visually.
#     """
#     driver_series = {}
#     team_colors   = {}
#     driver_names  = {}

#     MAX_GAP_SECONDS = 2.0

#     for drv in session.drivers:
#         info  = session.get_driver(drv)
#         abbr  = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr]  = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         all_t, all_x, all_y         = [], [], []
#         all_lap, all_dist           = [], []
#         all_compound, all_tyre_life = [], []
#         all_in_pit                  = []

#         # ── Precise pit-lane time windows for this driver ────────────────────
#         # PitInTime (recorded on the in-lap) and PitOutTime (recorded on the
#         # following out-lap) are both session-relative Timedeltas — the same
#         # time base as telemetry `Time` once combined with LapStartTime.
#         #
#         # The old code set in_pit=True for EVERY sample on the in-lap AND the
#         # out-lap (`pd.notna(lap.get("PitInTime")) or pd.notna(lap.get("PitOutTime"))`
#         # applied to the whole lap). That's why the UI showed "PIT" far too
#         # early (from the moment the in-lap started, long before the car
#         # actually reached the pit entry) and kept showing it for the entire
#         # out-lap, well after the car was already back at racing speed on
#         # track — exactly the "doesn't show immediately" / "still shows PIT
#         # while racing" / "color doesn't come back after pit" bugs.
#         #
#         # Fix: build the real [pit_in, pit_out] window (a few seconds, not a
#         # full lap) and only flag samples that fall inside it.
#         laps_sorted = laps.sort_values("LapNumber").reset_index(drop=True)
#         pit_windows = []
#         for idx in range(len(laps_sorted)):
#             pit_in_time = laps_sorted.iloc[idx].get("PitInTime")
#             if pd.isna(pit_in_time):
#                 continue
#             pit_in_t = pit_in_time.total_seconds()

#             pit_out_t = None
#             if idx + 1 < len(laps_sorted):
#                 next_out_time = laps_sorted.iloc[idx + 1].get("PitOutTime")
#                 if pd.notna(next_out_time):
#                     pit_out_t = next_out_time.total_seconds()
#             if pit_out_t is None:
#                 # Missing pit-out (e.g. retired in the pits) — fall back to a
#                 # typical stationary-stop duration instead of never clearing.
#                 pit_out_t = pit_in_t + 25.0

#             pit_windows.append((pit_in_t, pit_out_t))

#         def in_pit_window(t_arr):
#             flags = np.zeros(len(t_arr), dtype=bool)
#             for start, end in pit_windows:
#                 flags |= (t_arr >= start) & (t_arr <= end)
#             return flags

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             in_pit_arr = in_pit_window(t_seconds)
#             compound   = lap.get("Compound") or "UNKNOWN"
#             tyre_life  = lap.get("TyreLife")
#             tyre_life  = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy(dtype=float))
#             all_y.append(tel["Y"].to_numpy(dtype=float))
#             all_dist.append(tel["Distance"].to_numpy(dtype=float))
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(in_pit_arr)

#         if not all_t:
#             continue

#         t_c   = np.concatenate(all_t)
#         x_c   = np.concatenate(all_x)
#         y_c   = np.concatenate(all_y)
#         d_c   = np.concatenate(all_dist)
#         lap_c = np.concatenate(all_lap)
#         cmp_c = np.concatenate(all_compound)
#         tl_c  = np.concatenate(all_tyre_life)
#         pit_c = np.concatenate(all_in_pit)

#         order = np.argsort(t_c)
#         t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c = (
#             a[order] for a in [t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c]
#         )

#         _, uidx = np.unique(t_c, return_index=True)
#         uidx = np.sort(uidx)
#         t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c = (
#             a[uidx] for a in [t_c, x_c, y_c, d_c, lap_c, cmp_c, tl_c, pit_c]
#         )

#         # Rotate car positions to match track orientation
#         x_c, y_c = rotate_points(x_c, y_c, rotation_deg)

#         n_frames = len(master_timeline)
#         x_out   = np.full(n_frames, np.nan)
#         y_out   = np.full(n_frames, np.nan)
#         lap_out = np.full(n_frames, np.nan)
#         d_out   = np.full(n_frames, np.nan)
#         cmp_out = np.full(n_frames, "UNKNOWN", dtype=object)
#         tl_out  = np.full(n_frames, 0.0)
#         pit_out = np.full(n_frames, False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_c) and t_c[j + 1] <= t:
#                 j += 1

#             if t < t_c[0] or t > t_c[-1]:
#                 continue

#             gap = (t_c[j + 1] - t_c[j]) if j + 1 < len(t_c) else 0

#             if 0 < gap <= MAX_GAP_SECONDS and j + 1 < len(t_c):
#                 frac    = (t - t_c[j]) / gap
#                 x_out[i] = x_c[j] + frac * (x_c[j + 1] - x_c[j])
#                 y_out[i] = y_c[j] + frac * (y_c[j + 1] - y_c[j])
#                 d_out[i] = d_c[j] + frac * (d_c[j + 1] - d_c[j])
#             else:
#                 # Hold last known position — never interpolate through a gap
#                 x_out[i] = x_c[j]
#                 y_out[i] = y_c[j]
#                 d_out[i] = d_c[j]

#             lap_out[i] = lap_c[j]
#             cmp_out[i] = cmp_c[j]
#             tl_out[i]  = tl_c[j]
#             pit_out[i] = pit_c[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": d_out,
#             "compound": cmp_out, "tyre_life": tl_out, "in_pit": pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Reading circuit info (rotation + finish line)...")
#     rotation_deg, finish_x, finish_y = get_circuit_meta(session)
#     print(f"  Rotation: {rotation_deg:.1f}°")
#     print(f"  Finish line raw: ({finish_x:.1f}, {finish_y:.1f})")

#     print("Building track outline (4000-point arc-length resample, rotated)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session, rotation_deg)

#     # Rotate finish line coordinates to match the rotated track
#     fl_xs, fl_ys = rotate_points(
#         np.array([finish_x]), np.array([finish_y]), rotation_deg
#     )
#     finish_line = {"x": float(fl_xs[0]), "y": float(fl_ys[0])}
#     print(f"  Finish line rotated: ({finish_line['x']:.1f}, {finish_line['y']:.1f})")

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results...")
#     results_map = build_results_map(session)

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

#     t_min, t_max   = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"  {len(master_timeline)} frames, {(t_max - t_min):.0f}s total")

#     print("Interpolating driver positions (rotated, forward-filled)...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(
#         session, master_timeline, rotation_deg
#     )

#     print("Assembling frames...")
#     frames         = []
#     status_cursor  = [0]

#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y   = series["x"][i], series["y"][i]
#             lap    = series["lap"][i]
#             dist   = series["dist"][i]

#             if np.isnan(x):
#                 continue

#             total_distance = (
#                 (lap - 1) * avg_lap_length + dist
#                 if not np.isnan(lap) else dist
#             )

#             frame_cars[abbr] = {
#                 "x":        round(float(x), 2),
#                 "y":        round(float(y), 2),
#                 "lap":      int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit":   bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         frames.append({"t": round(float(t), 2), "cars": frame_cars, "flag": flag})

#     output = {
#         "meta": {
#             "year":               args.year,
#             "gp":                 args.gp,
#             "session":            args.session,
#             "sample_interval_ms": args.sample_ms,
#             "rotation":           rotation_deg,
#             "finish_line":        finish_line,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length":     avg_lap_length,
#             "team_colors":        team_colors,
#             "driver_names":       driver_names,
#             "results":            results_map,
#             "total_laps":         int(session.total_laps)
#                                   if hasattr(session, "total_laps") and session.total_laps
#                                   else None,
#         },
#         "track_outline": track_outline,
#         "frames":        frames,
#     }

#     safe_gp  = args.gp.lower().replace(" ", "_")
#     out_dir  = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"\n✅ Done. Wrote {len(frames)} frames → {out_path}")
#     print(f"   Track outline: {len(track_outline)} points")
#     print(f"   Rotation applied: {rotation_deg:.1f}°")
#     print(f"   Finish line: {finish_line}")


# if __name__ == "__main__":
#     main()
# """
# Grid-Lock: Track-Native Telemetry Generator v2
# =================================================
# Fixes vs v1:
#   - Forward-fill through telemetry gaps (was: np.interp straight-lines
#     through gaps, which cuts through track geometry — the off-track bug)
#   - Uses FastF1's own `Distance` channel for in-lap progress instead of
#     reconstructing it from nearest-point lookups — this is what makes
#     the leaderboard gap/sync numbers actually correct
#   - Track outline resampled by arc length to 4000 points (was: raw 300
#     points, uneven spacing, jagged corners)
#   - Adds track_status per frame (yellow / red / safety car / clear)
#   - Adds official race Status (Finished/Retired/etc) from session.results
#   - Adds tyre compound + pit status per frame
# """

# import argparse
# import os
# import json

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year", type=int, required=True)
#     p.add_argument("--gp", type=str, required=True)
#     p.add_argument("--session", type=str, default="R")
#     p.add_argument("--sample-ms", type=int, default=300)
#     p.add_argument("--cache-dir", type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     session.load(telemetry=True, laps=True, weather=False)
#     return session


# def build_track_outline(session, n_points=4000):
#     """
#     Dense, EVENLY-SPACED (by arc length) resample of the fastest lap's
#     position data. Raw telemetry points cluster on straights (car moving
#     fast = fewer samples per meter isn't true, but corner sampling is
#     still uneven), so we resample by distance-along-path rather than by
#     raw index. This is what makes tight corners render as smooth curves
#     instead of jagged polygons.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_length = float(cum_dist[-1])

#     target = np.linspace(0, total_length, n_points)
#     xs_dense = np.interp(target, cum_dist, xs)
#     ys_dense = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_length


# def build_track_status_timeline(session):
#     """
#     Real flag data from FastF1. Returns sorted change-points; we look up
#     "what flag was active at time t" by scanning for the last change
#     at-or-before t.
#     """
#     events = []
#     for _, row in session.track_status.iterrows():
#         t = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     """cursor_state is a 1-element list holding the current index, so
#     repeated calls with increasing t don't rescan from the start."""
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     """
#     Official finishing status per driver — Finished / Retired / DNF /
#     Accident / etc. This replaces guessing "is this driver still racing"
#     from gaps in the telemetry; FastF1 already knows the real answer.
#     """
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status": row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# def build_driver_frame_series(session, master_timeline):
#     driver_series = {}
#     team_colors = {}
#     driver_names = {}

#     MAX_GAP_SECONDS = 2.0  # beyond this, hold last position instead of interpolating

#     for drv in session.drivers:
#         info = session.get_driver(drv)
#         abbr = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr] = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         # 🛠️ FIX: Build precise pit-lane time windows [start_t, end_t] for this specific driver
#         laps_sorted = laps.sort_values("LapNumber").reset_index(drop=True)
#         pit_windows = []
#         for idx in range(len(laps_sorted)):
#             pit_in_time = laps_sorted.iloc[idx].get("PitInTime")
#             if pd.isna(pit_in_time):
#                 continue
#             pit_in_t = pit_in_time.total_seconds()

#             pit_out_t = None
#             if idx + 1 < len(laps_sorted):
#                 next_out_time = laps_sorted.iloc[idx + 1].get("PitOutTime")
#                 if pd.notna(next_out_time):
#                     pit_out_t = next_out_time.total_seconds()
            
#             # If missing pit-out (e.g. retired in pits), default to an average 25s stop
#             if pit_out_t is None:
#                 pit_out_t = pit_in_t + 25.0

#             pit_windows.append((pit_in_t, pit_out_t))

#         def in_pit_window(t_arr):
#             flags = np.zeros(len(t_arr), dtype=bool)
#             for start, end in pit_windows:
#                 flags |= (t_arr >= start) & (t_arr <= end)
#             return flags

#         all_t, all_x, all_y, all_lap, all_dist = [], [], [], [], []
#         all_compound, all_tyre_life, all_in_pit = [], [], []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             # Skip laps with missing/corrupt telemetry entirely rather
#             # than let bad data poison the interpolation — this is the
#             # actual root cause of cars flying off track, on ANY circuit.
#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             # 🛠️ FIX: Only flag telemetry samples that actually fall inside the pit time window
#             in_pit_arr = in_pit_window(t_seconds)
            
#             compound = lap.get("Compound") or "UNKNOWN"
#             tyre_life = lap.get("TyreLife")
#             tyre_life = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy())
#             all_y.append(tel["Y"].to_numpy())
#             all_dist.append(tel["Distance"].to_numpy())  # in-lap distance, FastF1-native
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(in_pit_arr)

#         if not all_t:
#             continue

#         t_concat = np.concatenate(all_t)
#         x_concat = np.concatenate(all_x)
#         y_concat = np.concatenate(all_y)
#         dist_concat = np.concatenate(all_dist)
#         lap_concat = np.concatenate(all_lap)
#         compound_concat = np.concatenate(all_compound)
#         tyre_life_concat = np.concatenate(all_tyre_life)
#         in_pit_concat = np.concatenate(all_in_pit)

#         order = np.argsort(t_concat)
#         arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                   compound_concat, tyre_life_concat, in_pit_concat]
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [a[order] for a in arrays]

#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [
#                 a[unique_idx] for a in
#                 [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                  compound_concat, tyre_life_concat, in_pit_concat]
#             ]

#         x_out = np.full(len(master_timeline), np.nan)
#         y_out = np.full(len(master_timeline), np.nan)
#         lap_out = np.full(len(master_timeline), np.nan)
#         dist_out = np.full(len(master_timeline), np.nan)
#         compound_out = np.full(len(master_timeline), "UNKNOWN", dtype=object)
#         tyre_life_out = np.full(len(master_timeline), 0.0)
#         in_pit_out = np.full(len(master_timeline), False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_concat) and t_concat[j + 1] <= t:
#                 j += 1

#             if t < t_concat[0] or t > t_concat[-1]:
#                 continue  # driver not on track yet / already finished

#             gap_to_next = (t_concat[j + 1] - t_concat[j]) if j + 1 < len(t_concat) else 0

#             if 0 < gap_to_next <= MAX_GAP_SECONDS and j + 1 < len(t_concat):
#                 frac = (t - t_concat[j]) / gap_to_next
#                 x_out[i] = x_concat[j] + frac * (x_concat[j + 1] - x_concat[j])
#                 y_out[i] = y_concat[j] + frac * (y_concat[j + 1] - y_concat[j])
#                 dist_out[i] = dist_concat[j] + frac * (dist_concat[j + 1] - dist_concat[j])
#             else:
#                 # Real gap in telemetry (e.g. GPS dropout in a Monaco
#                 # tunnel) — hold last known position instead of drawing
#                 # a straight line through it.
#                 x_out[i] = x_concat[j]
#                 y_out[i] = y_concat[j]
#                 dist_out[i] = dist_concat[j]

#             lap_out[i] = lap_concat[j]
#             compound_out[i] = compound_concat[j]
#             tyre_life_out[i] = tyre_life_concat[j]
#             in_pit_out[i] = in_pit_concat[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
#             "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Building track outline (4000-point arc-length resample)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session)

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results (Finished/Retired/etc)...")
#     results_map = build_results_map(session)

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

#     t_min, t_max = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     status_cursor = [0]
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap, dist = series["x"][i], series["y"][i], series["lap"][i], series["dist"][i]
#             if np.isnan(x):
#                 continue

#             total_distance = (lap - 1) * avg_lap_length + dist if not np.isnan(lap) else dist

#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit": bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         frames.append({"t": round(float(t), 2), "cars": frame_cars, "flag": flag})

#     output = {
#         "meta": {
#             "year": args.year,
#             "gp": args.gp,
#             "session": args.session,
#             "sample_interval_ms": args.sample_ms,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length": avg_lap_length,
#             "team_colors": team_colors,
#             "driver_names": driver_names,
#             "results": results_map,
#             "total_laps": int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     safe_gp = args.gp.lower().replace(" ", "_")
#     out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {out_path}")


# if __name__ == "__main__":
#     main()

# """
# Grid-Lock: Track-Native Telemetry Generator v2
# =================================================
# Fixes vs v1:
#   - Forward-fill through telemetry gaps (was: np.interp straight-lines
#     through gaps, which cuts through track geometry — the off-track bug)
#   - Uses FastF1's own `Distance` channel for in-lap progress instead of
#     reconstructing it from nearest-point lookups — this is what makes
#     the leaderboard gap/sync numbers actually correct
#   - Track outline resampled by arc length to 4000 points (was: raw 300
#     points, uneven spacing, jagged corners)
#   - Adds track_status per frame (yellow / red / safety car / clear)
#   - Adds official race Status (Finished/Retired/etc) from session.results
#   - Adds tyre compound + pit status per frame
#   - Adds real-time synchronized weather conditions stream per frame
# """

# import argparse
# import os
# import json

# import fastf1
# import numpy as np
# import pandas as pd


# TRACK_STATUS_MAP = {
#     "1": "clear",
#     "2": "yellow",
#     "3": "unknown",
#     "4": "safety_car",
#     "5": "red",
#     "6": "vsc",
#     "7": "vsc_ending",
# }


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("--year", type=int, required=True)
#     p.add_argument("--gp", type=str, required=True)
#     p.add_argument("--session", type=str, default="R")
#     p.add_argument("--sample-ms", type=int, default=300)
#     p.add_argument("--cache-dir", type=str, default="fastf1_cache")
#     p.add_argument(
#         "--output-dir",
#         type=str,
#         default="../backend/src/cache",
#         help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/data.json",
#     )
#     return p.parse_args()


# def load_session(year, gp, session_type, cache_dir):
#     os.makedirs(cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(cache_dir)
#     session = fastf1.get_session(year, gp, session_type)
#     # 🛠️ WEATHER PATCH: Loaded weather metrics from the F1 API stream
#     session.load(telemetry=True, laps=True, weather=True)
#     return session


# def build_track_outline(session, n_points=4000):
#     """
#     Dense, EVENLY-SPACED (by arc length) resample of the fastest lap's
#     position data. Raw telemetry points cluster on straights (car moving
#     fast = fewer samples per meter isn't true, but corner sampling is
#     still uneven), so we resample by distance-along-path rather than by
#     raw index. This is what makes tight corners render as smooth curves
#     instead of jagged polygons.
#     """
#     fastest_lap = session.laps.pick_fastest()
#     pos = fastest_lap.get_pos_data()
#     xs = pos["X"].to_numpy()
#     ys = pos["Y"].to_numpy()

#     seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
#     cum_dist = np.concatenate([[0], np.cumsum(seg_lengths)])
#     total_length = float(cum_dist[-1])

#     target = np.linspace(0, total_length, n_points)
#     xs_dense = np.interp(target, cum_dist, xs)
#     ys_dense = np.interp(target, cum_dist, ys)

#     outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
#     bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
#     return outline, bounds, total_length


# def build_track_status_timeline(session):
#     """
#     Real flag data from FastF1. Returns sorted change-points; we look up
#     "what flag was active at time t" by scanning for the last change
#     at-or-before t.
#     """
#     events = []
#     for _, row in session.track_status.iterrows():
#         t = row["Time"].total_seconds()
#         status = str(row["Status"])
#         events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
#     events.sort(key=lambda e: e["t"])
#     return events


# def status_at_time(events, t, cursor_state):
#     """cursor_state is a 1-element list holding the current index, so
#     repeated calls with increasing t don't rescan from the start."""
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return events[idx]["status"] if events else "clear"


# def build_results_map(session):
#     """
#     Official finishing status per driver — Finished / Retired / DNF /
#     Accident / etc. This replaces guessing "is this driver still racing"
#     from gaps in the telemetry; FastF1 already knows the real answer.
#     """
#     results = {}
#     for _, row in session.results.iterrows():
#         abbr = row["Abbreviation"]
#         results[abbr] = {
#             "status": row.get("Status", "Unknown"),
#             "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
#         }
#     return results


# # 🛠️ WEATHER PATCH: Added helper to parse and map weather timeline frames
# def build_weather_timeline(session):
#     w_data = session.weather_data
#     if w_data.empty:
#         return []
    
#     events = []
#     for _, row in w_data.iterrows():
#         events.append({
#             "t": row["Time"].total_seconds(),
#             "air_temp": float(row["AirTemp"]) if pd.notna(row["AirTemp"]) else 0.0,
#             "track_temp": float(row["TrackTemp"]) if pd.notna(row["TrackTemp"]) else 0.0,
#             "humidity": float(row["Humidity"]) if pd.notna(row["Humidity"]) else 0.0,
#             "wind_speed": float(row["WindSpeed"]) if pd.notna(row["WindSpeed"]) else 0.0
#         })
#     events.sort(key=lambda e: e["t"])
#     return events


# # 🛠️ WEATHER PATCH: State-cursor lookup to map exact weather data matching active frame time t
# def weather_at_time(events, t, cursor_state):
#     if not events:
#         return {"air_temp": 0.0, "track_temp": 0.0, "humidity": 0.0, "wind_speed": 0.0}
#     idx = cursor_state[0]
#     while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
#         idx += 1
#     cursor_state[0] = idx
#     return {
#         "air_temp": events[idx]["air_temp"],
#         "track_temp": events[idx]["track_temp"],
#         "humidity": events[idx]["humidity"],
#         "wind_speed": events[idx]["wind_speed"]
#     }


# def build_driver_frame_series(session, master_timeline):
#     driver_series = {}
#     team_colors = {}
#     driver_names = {}

#     MAX_GAP_SECONDS = 2.0  # beyond this, hold last position instead of interpolating

#     for drv in session.drivers:
#         info = session.get_driver(drv)
#         abbr = info["Abbreviation"]
#         driver_names[abbr] = info.get("FullName", abbr)
#         team_colors[abbr] = "#" + info.get("TeamColor", "808080")

#         laps = session.laps.pick_driver(drv)
#         if laps.empty:
#             continue

#         # Build precise pit-lane time windows [start_t, end_t] for this specific driver
#         laps_sorted = laps.sort_values("LapNumber").reset_index(drop=True)
#         pit_windows = []
#         for idx in range(len(laps_sorted)):
#             pit_in_time = laps_sorted.iloc[idx].get("PitInTime")
#             if pd.isna(pit_in_time):
#                 continue
#             pit_in_t = pit_in_time.total_seconds()

#             pit_out_t = None
#             if idx + 1 < len(laps_sorted):
#                 next_out_time = laps_sorted.iloc[idx + 1].get("PitOutTime")
#                 if pd.notna(next_out_time):
#                     pit_out_t = next_out_time.total_seconds()
            
#             # If missing pit-out (e.g. retired in pits), default to an average 25s stop
#             if pit_out_t is None:
#                 pit_out_t = pit_in_t + 25.0

#             pit_windows.append((pit_in_t, pit_out_t))

#         def in_pit_window(t_arr):
#             flags = np.zeros(len(t_arr), dtype=bool)
#             for start, end in pit_windows:
#                 flags |= (t_arr >= start) & (t_arr <= end)
#             return flags

#         all_t, all_x, all_y, all_lap, all_dist = [], [], [], [], []
#         all_compound, all_tyre_life, all_in_pit = [], [], []

#         for _, lap in laps.iterrows():
#             try:
#                 tel = lap.get_telemetry()
#             except Exception:
#                 continue

#             # Skip laps with missing/corrupt telemetry entirely rather
#             # than let bad data poison the interpolation — this is the
#             # actual root cause of cars flying off track, on ANY circuit.
#             if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
#                 continue

#             lap_start_time = lap["LapStartTime"]
#             if lap_start_time is None or pd.isna(lap_start_time):
#                 continue

#             lap_start_seconds = lap_start_time.total_seconds()
#             t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
#             n = len(tel)

#             # Only flag telemetry samples that actually fall inside the pit time window
#             in_pit_arr = in_pit_window(t_seconds)
            
#             compound = lap.get("Compound") or "UNKNOWN"
#             tyre_life = lap.get("TyreLife")
#             tyre_life = float(tyre_life) if pd.notna(tyre_life) else 0.0

#             all_t.append(t_seconds)
#             all_x.append(tel["X"].to_numpy())
#             all_y.append(tel["Y"].to_numpy())
#             all_dist.append(tel["Distance"].to_numpy())  # in-lap distance, FastF1-native
#             all_lap.append(np.full(n, lap["LapNumber"]))
#             all_compound.append(np.full(n, compound, dtype=object))
#             all_tyre_life.append(np.full(n, tyre_life))
#             all_in_pit.append(in_pit_arr)

#         if not all_t:
#             continue

#         t_concat = np.concatenate(all_t)
#         x_concat = np.concatenate(all_x)
#         y_concat = np.concatenate(all_y)
#         dist_concat = np.concatenate(all_dist)
#         lap_concat = np.concatenate(all_lap)
#         compound_concat = np.concatenate(all_compound)
#         tyre_life_concat = np.concatenate(all_tyre_life)
#         in_pit_concat = np.concatenate(all_in_pit)

#         order = np.argsort(t_concat)
#         arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                   compound_concat, tyre_life_concat, in_pit_concat]
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [a[order] for a in arrays]

#         _, unique_idx = np.unique(t_concat, return_index=True)
#         unique_idx = np.sort(unique_idx)
#         t_concat, x_concat, y_concat, dist_concat, lap_concat, \
#             compound_concat, tyre_life_concat, in_pit_concat = [
#                 a[unique_idx] for a in
#                 [t_concat, x_concat, y_concat, dist_concat, lap_concat,
#                  compound_concat, tyre_life_concat, in_pit_concat]
#             ]

#         x_out = np.full(len(master_timeline), np.nan)
#         y_out = np.full(len(master_timeline), np.nan)
#         lap_out = np.full(len(master_timeline), np.nan)
#         dist_out = np.full(len(master_timeline), np.nan)
#         compound_out = np.full(len(master_timeline), "UNKNOWN", dtype=object)
#         tyre_life_out = np.full(len(master_timeline), 0.0)
#         in_pit_out = np.full(len(master_timeline), False)

#         j = 0
#         for i, t in enumerate(master_timeline):
#             while j + 1 < len(t_concat) and t_concat[j + 1] <= t:
#                 j += 1

#             if t < t_concat[0] or t > t_concat[-1]:
#                 continue  # driver not on track yet / already finished

#             gap_to_next = (t_concat[j + 1] - t_concat[j]) if j + 1 < len(t_concat) else 0

#             if 0 < gap_to_next <= MAX_GAP_SECONDS and j + 1 < len(t_concat):
#                 frac = (t - t_concat[j]) / gap_to_next
#                 x_out[i] = x_concat[j] + frac * (x_concat[j + 1] - x_concat[j])
#                 y_out[i] = y_concat[j] + frac * (y_concat[j + 1] - y_concat[j])
#                 dist_out[i] = dist_concat[j] + frac * (dist_concat[j + 1] - dist_concat[j])
#             else:
#                 # Real gap in telemetry (e.g. GPS dropout in a Monaco
#                 # tunnel) — hold last known position instead of drawing
#                 # a straight line through it.
#                 x_out[i] = x_concat[j]
#                 y_out[i] = y_concat[j]
#                 dist_out[i] = dist_concat[j]

#             lap_out[i] = lap_concat[j]
#             compound_out[i] = compound_concat[j]
#             tyre_life_out[i] = tyre_life_concat[j]
#             in_pit_out[i] = in_pit_concat[j]

#         driver_series[abbr] = {
#             "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
#             "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
#         }

#     return driver_series, team_colors, driver_names


# def main():
#     args = parse_args()

#     print(f"Loading {args.year} {args.gp} {args.session} session...")
#     session = load_session(args.year, args.gp, args.session, args.cache_dir)

#     print("Building track outline (4000-point arc-length resample)...")
#     track_outline, bounds, avg_lap_length = build_track_outline(session)

#     print("Reading track status (flags) timeline...")
#     status_events = build_track_status_timeline(session)

#     print("Reading official results (Finished/Retired/etc)...")
#     results_map = build_results_map(session)

#     # 🛠️ WEATHER PATCH: Gather track conditions history
#     print("Reading weather conditions stream timeline...")
#     weather_events = build_weather_timeline(session)

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

#     t_min, t_max = min(all_times), max(all_times)
#     master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
#     print(f"Master timeline: {len(master_timeline)} frames "
#           f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

#     print("Interpolating driver positions onto shared timeline...")
#     driver_series, team_colors, driver_names = build_driver_frame_series(session, master_timeline)

#     print("Assembling frames...")
#     frames = []
#     status_cursor = [0]
#     weather_cursor = [0] # 🛠️ WEATHER PATCH
    
#     for i, t in enumerate(master_timeline):
#         frame_cars = {}
#         for abbr, series in driver_series.items():
#             x, y, lap, dist = series["x"][i], series["y"][i], series["lap"][i], series["dist"][i]
#             if np.isnan(x):
#                 continue

#             total_distance = (lap - 1) * avg_lap_length + dist if not np.isnan(lap) else dist

#             frame_cars[abbr] = {
#                 "x": round(float(x), 2),
#                 "y": round(float(y), 2),
#                 "lap": int(lap) if not np.isnan(lap) else None,
#                 "distance": round(float(total_distance), 1),
#                 "compound": str(series["compound"][i]),
#                 "tyre_life": round(float(series["tyre_life"][i]), 1),
#                 "in_pit": bool(series["in_pit"][i]),
#             }

#         flag = status_at_time(status_events, t, status_cursor)
#         # 🛠️ WEATHER PATCH: Fetch synchronized telemetry parameters for active frame
#         w_snap = weather_at_time(weather_events, t, weather_cursor)
        
#         frames.append({
#             "t": round(float(t), 2), 
#             "cars": frame_cars, 
#             "flag": flag,
#             "weather": w_snap # 🛠️ WEATHER PATCH
#         })

#     output = {
#         "meta": {
#             "year": args.year,
#             "gp": args.gp,
#             "session": args.session,
#             "sample_interval_ms": args.sample_ms,
#             "bounds": {
#                 "x_min": bounds[0], "x_max": bounds[1],
#                 "y_min": bounds[2], "y_max": bounds[3],
#             },
#             "avg_lap_length": avg_lap_length,
#             "team_colors": team_colors,
#             "driver_names": driver_names,
#             "results": results_map,
#             "total_laps": int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None,
#         },
#         "track_outline": track_outline,
#         "frames": frames,
#     }

#     safe_gp = args.gp.lower().replace(" ", "_")
#     out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
#     os.makedirs(out_dir, exist_ok=True)
#     out_path = os.path.join(out_dir, "data.json")

#     with open(out_path, "w") as f:
#         json.dump(output, f)

#     print(f"Done. Wrote {len(frames)} frames to {out_path}")


# if __name__ == "__main__":
#     main()

"""
Grid-Lock: Track-Native Telemetry Generator v2
=================================================
Fixes vs v1:
  - Forward-fill through telemetry gaps (was: np.interp straight-lines
    through gaps, which cuts through track geometry — the off-track bug)
  - Uses FastF1's own `Distance` channel for in-lap progress instead of
    reconstructing it from nearest-point lookups — this is what makes
    the leaderboard gap/sync numbers actually correct
  - Track outline resampled by arc length to 4000 points (was: raw 300
    points, uneven spacing, jagged corners)
  - Adds track_status per frame (yellow / red / safety car / clear)
  - Adds official race Status (Finished/Retired/etc) from session.results
  - Adds tyre compound + pit status per frame
  - Adds real-time synchronized weather conditions stream per frame
  - Adds real-time driver telemetry (Speed, Gear, Throttle, Brake) per frame
"""

import argparse
import os
import json

import fastf1
import numpy as np
import pandas as pd


TRACK_STATUS_MAP = {
    "1": "clear",
    "2": "yellow",
    "3": "unknown",
    "4": "safety_car",
    "5": "red",
    "6": "vsc",
    "7": "vsc_ending",
}


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--gp", type=str, required=True)
    p.add_argument("--session", type=str, default="R")
    p.add_argument("--sample-ms", type=int, default=300)
    p.add_argument("--cache-dir", type=str, default="fastf1_cache")
    p.add_argument(
        "--output-dir",
        type=str,
        default="../backend/src/cache",
        help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/data.json",
    )
    return p.parse_args()


def load_session(year, gp, session_type, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, laps=True, weather=True)
    return session


def build_track_outline(session, n_points=4000):
    fastest_lap = session.laps.pick_fastest()
    pos = fastest_lap.get_pos_data()
    xs = pos["X"].to_numpy()
    ys = pos["Y"].to_numpy()

    seg_lengths = np.hypot(np.diff(xs), np.diff(ys))
    cum_dist = np.concatenate([[0], np.cumsum(seg_lengths)])
    total_length = float(cum_dist[-1])

    target = np.linspace(0, total_length, n_points)
    xs_dense = np.interp(target, cum_dist, xs)
    ys_dense = np.interp(target, cum_dist, ys)

    outline = [{"x": float(x), "y": float(y)} for x, y in zip(xs_dense, ys_dense)]
    bounds = (float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max()))
    return outline, bounds, total_length


def build_track_status_timeline(session):
    events = []
    for _, row in session.track_status.iterrows():
        t = row["Time"].total_seconds()
        status = str(row["Status"])
        events.append({"t": t, "status": TRACK_STATUS_MAP.get(status, "clear")})
    events.sort(key=lambda e: e["t"])
    return events


def status_at_time(events, t, cursor_state):
    idx = cursor_state[0]
    while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
        idx += 1
    cursor_state[0] = idx
    return events[idx]["status"] if events else "clear"


def build_results_map(session):
    results = {}
    for _, row in session.results.iterrows():
        abbr = row["Abbreviation"]
        results[abbr] = {
            "status": row.get("Status", "Unknown"),
            "final_position": int(row["Position"]) if pd.notna(row.get("Position")) else None,
        }
    return results


def build_weather_timeline(session):
    w_data = session.weather_data
    if w_data.empty:
        return []
    
    events = []
    for _, row in w_data.iterrows():
        events.append({
            "t": row["Time"].total_seconds(),
            "air_temp": float(row["AirTemp"]) if pd.notna(row["AirTemp"]) else 0.0,
            "track_temp": float(row["TrackTemp"]) if pd.notna(row["TrackTemp"]) else 0.0,
            "humidity": float(row["Humidity"]) if pd.notna(row["Humidity"]) else 0.0,
            "wind_speed": float(row["WindSpeed"]) if pd.notna(row["WindSpeed"]) else 0.0
        })
    events.sort(key=lambda e: e["t"])
    return events


def weather_at_time(events, t, cursor_state):
    if not events:
        return {"air_temp": 0.0, "track_temp": 0.0, "humidity": 0.0, "wind_speed": 0.0}
    idx = cursor_state[0]
    while idx + 1 < len(events) and events[idx + 1]["t"] <= t:
        idx += 1
    cursor_state[0] = idx
    return {
        "air_temp": events[idx]["air_temp"],
        "track_temp": events[idx]["track_temp"],
        "humidity": events[idx]["humidity"],
        "wind_speed": events[idx]["wind_speed"]
    }


def build_driver_frame_series(session, master_timeline):
    driver_series = {}
    team_colors = {}
    driver_names = {}

    MAX_GAP_SECONDS = 2.0 

    for drv in session.drivers:
        info = session.get_driver(drv)
        abbr = info["Abbreviation"]
        driver_names[abbr] = info.get("FullName", abbr)
        team_colors[abbr] = "#" + info.get("TeamColor", "808080")

        laps = session.laps.pick_driver(drv)
        if laps.empty:
            continue

        laps_sorted = laps.sort_values("LapNumber").reset_index(drop=True)
        pit_windows = []
        for idx in range(len(laps_sorted)):
            pit_in_time = laps_sorted.iloc[idx].get("PitInTime")
            if pd.isna(pit_in_time):
                continue
            pit_in_t = pit_in_time.total_seconds()

            pit_out_t = None
            if idx + 1 < len(laps_sorted):
                next_out_time = laps_sorted.iloc[idx + 1].get("PitOutTime")
                if pd.notna(next_out_time):
                    pit_out_t = next_out_time.total_seconds()
            
            if pit_out_t is None:
                pit_out_t = pit_in_t + 25.0

            pit_windows.append((pit_in_t, pit_out_t))

        def in_pit_window(t_arr):
            flags = np.zeros(len(t_arr), dtype=bool)
            for start, end in pit_windows:
                flags |= (t_arr >= start) & (t_arr <= end)
            return flags

        all_t, all_x, all_y, all_lap, all_dist = [], [], [], [], []
        all_compound, all_tyre_life, all_in_pit = [], [], []
        # 🛠️ COCKPIT TELEMETRY DATA LISTS
        all_speed, all_gear, all_throttle, all_brake = [], [], [], []

        for _, lap in laps.iterrows():
            try:
                tel = lap.get_telemetry()
            except Exception:
                continue

            if tel.empty or "Date" not in tel.columns or "Distance" not in tel.columns:
                continue

            lap_start_time = lap["LapStartTime"]
            if lap_start_time is None or pd.isna(lap_start_time):
                continue

            lap_start_seconds = lap_start_time.total_seconds()
            t_seconds = tel["Time"].dt.total_seconds().to_numpy() + lap_start_seconds
            n = len(tel)

            in_pit_arr = in_pit_window(t_seconds)
            
            compound = lap.get("Compound") or "UNKNOWN"
            tyre_life = lap.get("TyreLife")
            tyre_life = float(tyre_life) if pd.notna(tyre_life) else 0.0

            all_t.append(t_seconds)
            all_x.append(tel["X"].to_numpy())
            all_y.append(tel["Y"].to_numpy())
            all_dist.append(tel["Distance"].to_numpy()) 
            all_lap.append(np.full(n, lap["LapNumber"]))
            all_compound.append(np.full(n, compound, dtype=object))
            all_tyre_life.append(np.full(n, tyre_life))
            all_in_pit.append(in_pit_arr)

            # 🛠️ EXTRACTION: Grabbing raw telemetry channels (with safe fallbacks)
            all_speed.append(tel.get("Speed", pd.Series(np.zeros(n))).to_numpy(dtype=float))
            all_gear.append(tel.get("nGear", pd.Series(np.zeros(n))).to_numpy(dtype=float))
            all_throttle.append(tel.get("Throttle", pd.Series(np.zeros(n))).to_numpy(dtype=float))
            all_brake.append(tel.get("Brake", pd.Series(np.zeros(n))).to_numpy(dtype=float))

        if not all_t:
            continue

        t_concat = np.concatenate(all_t)
        x_concat = np.concatenate(all_x)
        y_concat = np.concatenate(all_y)
        dist_concat = np.concatenate(all_dist)
        lap_concat = np.concatenate(all_lap)
        compound_concat = np.concatenate(all_compound)
        tyre_life_concat = np.concatenate(all_tyre_life)
        in_pit_concat = np.concatenate(all_in_pit)
        
        # 🛠️ CONCATENATE: Telemetry arrays
        spd_concat = np.concatenate(all_speed)
        gear_concat = np.concatenate(all_gear)
        thr_concat = np.concatenate(all_throttle)
        brk_concat = np.concatenate(all_brake)

        order = np.argsort(t_concat)
        arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
                  compound_concat, tyre_life_concat, in_pit_concat,
                  spd_concat, gear_concat, thr_concat, brk_concat]
        
        t_concat, x_concat, y_concat, dist_concat, lap_concat, \
            compound_concat, tyre_life_concat, in_pit_concat, \
            spd_concat, gear_concat, thr_concat, brk_concat = [a[order] for a in arrays]

        _, unique_idx = np.unique(t_concat, return_index=True)
        unique_idx = np.sort(unique_idx)
        
        t_concat, x_concat, y_concat, dist_concat, lap_concat, \
            compound_concat, tyre_life_concat, in_pit_concat, \
            spd_concat, gear_concat, thr_concat, brk_concat = [
                a[unique_idx] for a in arrays
            ]

        n_frames = len(master_timeline)
        x_out = np.full(n_frames, np.nan)
        y_out = np.full(n_frames, np.nan)
        lap_out = np.full(n_frames, np.nan)
        dist_out = np.full(n_frames, np.nan)
        compound_out = np.full(n_frames, "UNKNOWN", dtype=object)
        tyre_life_out = np.full(n_frames, 0.0)
        in_pit_out = np.full(n_frames, False)
        
        # 🛠️ PREPARE: Output arrays for master timeline interpolation
        spd_out = np.full(n_frames, 0.0)
        gear_out = np.full(n_frames, 0.0)
        thr_out = np.full(n_frames, 0.0)
        brk_out = np.full(n_frames, 0.0)

        j = 0
        for i, t in enumerate(master_timeline):
            while j + 1 < len(t_concat) and t_concat[j + 1] <= t:
                j += 1

            if t < t_concat[0] or t > t_concat[-1]:
                continue 

            gap_to_next = (t_concat[j + 1] - t_concat[j]) if j + 1 < len(t_concat) else 0

            if 0 < gap_to_next <= MAX_GAP_SECONDS and j + 1 < len(t_concat):
                frac = (t - t_concat[j]) / gap_to_next
                x_out[i] = x_concat[j] + frac * (x_concat[j + 1] - x_concat[j])
                y_out[i] = y_concat[j] + frac * (y_concat[j + 1] - y_concat[j])
                dist_out[i] = dist_concat[j] + frac * (dist_concat[j + 1] - dist_concat[j])
                
                # 🛠️ INTERPOLATE: Cockpit variables
                spd_out[i] = spd_concat[j] + frac * (spd_concat[j + 1] - spd_concat[j])
                thr_out[i] = thr_concat[j] + frac * (thr_concat[j + 1] - thr_concat[j])
                gear_out[i] = gear_concat[j] # Hold current gear (no partial gears)
                brk_out[i] = brk_concat[j]   # Hold current brake status
            else:
                x_out[i] = x_concat[j]
                y_out[i] = y_concat[j]
                dist_out[i] = dist_concat[j]
                
                spd_out[i] = spd_concat[j]
                thr_out[i] = thr_concat[j]
                gear_out[i] = gear_concat[j]
                brk_out[i] = brk_concat[j]

            lap_out[i] = lap_concat[j]
            compound_out[i] = compound_concat[j]
            tyre_life_out[i] = tyre_life_concat[j]
            in_pit_out[i] = in_pit_concat[j]

        driver_series[abbr] = {
            "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
            "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
            "speed": spd_out, "gear": gear_out, "throttle": thr_out, "brake": brk_out # 🛠️ PACKAGED
        }

    return driver_series, team_colors, driver_names


def main():
    args = parse_args()

    print(f"Loading {args.year} {args.gp} {args.session} session...")
    session = load_session(args.year, args.gp, args.session, args.cache_dir)

    print("Building track outline (4000-point arc-length resample)...")
    track_outline, bounds, avg_lap_length = build_track_outline(session)

    print("Reading track status (flags) timeline...")
    status_events = build_track_status_timeline(session)

    print("Reading official results (Finished/Retired/etc)...")
    results_map = build_results_map(session)

    print("Reading weather conditions stream timeline...")
    weather_events = build_weather_timeline(session)

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

    t_min, t_max = min(all_times), max(all_times)
    master_timeline = np.arange(t_min, t_max, args.sample_ms / 1000.0)
    print(f"Master timeline: {len(master_timeline)} frames "
          f"({args.sample_ms}ms steps, {(t_max - t_min):.0f}s total)")

    print("Interpolating driver positions onto shared timeline...")
    driver_series, team_colors, driver_names = build_driver_frame_series(session, master_timeline)

    print("Assembling frames...")
    frames = []
    status_cursor = [0]
    weather_cursor = [0] 
    
    for i, t in enumerate(master_timeline):
        frame_cars = {}
        for abbr, series in driver_series.items():
            x, y, lap, dist = series["x"][i], series["y"][i], series["lap"][i], series["dist"][i]
            
            # 🛠️ PULL: Extract Cockpit Telemetry
            spd = series["speed"][i]
            gear = series["gear"][i]
            thr = series["throttle"][i]
            brk = series["brake"][i]

            if np.isnan(x):
                continue

            total_distance = (lap - 1) * avg_lap_length + dist if not np.isnan(lap) else dist

            frame_cars[abbr] = {
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "lap": int(lap) if not np.isnan(lap) else None,
                "distance": round(float(total_distance), 1),
                "compound": str(series["compound"][i]),
                "tyre_life": round(float(series["tyre_life"][i]), 1),
                "in_pit": bool(series["in_pit"][i]),
                
                # 🛠️ ATTACH TO JSON: Ensuring types are safe and serialized nicely
                "speed": int(spd) if not np.isnan(spd) else 0,
                "gear": int(gear) if not np.isnan(gear) else 0,
                "throttle": int(thr) if not np.isnan(thr) else 0,
                "brake": bool(brk > 0) if not np.isnan(brk) else False,
            }

        flag = status_at_time(status_events, t, status_cursor)
        w_snap = weather_at_time(weather_events, t, weather_cursor)
        
        frames.append({
            "t": round(float(t), 2), 
            "cars": frame_cars, 
            "flag": flag,
            "weather": w_snap 
        })

    output = {
        "meta": {
            "year": args.year,
            "gp": args.gp,
            "session": args.session,
            "sample_interval_ms": args.sample_ms,
            "bounds": {
                "x_min": bounds[0], "x_max": bounds[1],
                "y_min": bounds[2], "y_max": bounds[3],
            },
            "avg_lap_length": avg_lap_length,
            "team_colors": team_colors,
            "driver_names": driver_names,
            "results": results_map,
            "total_laps": int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None,
        },
        "track_outline": track_outline,
        "frames": frames,
    }

    safe_gp = args.gp.lower().replace(" ", "_")
    out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "data.json")

    with open(out_path, "w") as f:
        json.dump(output, f)

    print(f"Done. Wrote {len(frames)} frames to {out_path}")


if __name__ == "__main__":
    main()