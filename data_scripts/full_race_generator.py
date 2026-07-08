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
        help="Base cache dir; script writes to {output-dir}/{year}/{gp}/{session}/",
    )
    return p.parse_args()


def load_session(year, gp, session_type, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
    session = fastf1.get_session(year, gp, session_type)
    session.load(telemetry=True, laps=True, weather=True)
    return session


def _first_lap_with_pos_data(laps):
    """Try laps in the given order, return (lap, pos_df) for the first one whose
    position data actually has usable X/Y columns. Some laps (data dropouts,
    in/out laps, laps right at a session boundary) come back with empty or
    column-less position data — that shouldn't crash the whole generation."""
    for _, lap in laps.iterlaps():
        try:
            pos = lap.get_pos_data()
        except Exception:
            continue
        if pos is not None and not pos.empty and "X" in pos.columns and "Y" in pos.columns:
            return lap, pos
    return None, None


def build_track_outline(session, n_points=4000):
    quick = session.laps.pick_quicklaps() if not session.laps.empty else session.laps
    ordered = quick.sort_values("LapTime") if not quick.empty else quick
    ref_lap, pos = _first_lap_with_pos_data(ordered)

    if pos is None:
        # No quick lap had usable position data (seen on Monaco — data gaps around
        # the fastest lap) — widen the search to every lap in the session, fastest first.
        ordered_all = session.laps.sort_values("LapTime")
        ref_lap, pos = _first_lap_with_pos_data(ordered_all)

    if pos is None:
        raise RuntimeError(
            "No lap in this session has usable position (X/Y) data — FastF1 has no "
            "track-outline source available for this event/session."
        )

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

    # `total_length` above is a geometric point-to-point sum over Position data
    # (X/Y from get_pos_data()) — confirmed by direct comparison that this data
    # source is on a ~10x different scale than the car telemetry's own Distance
    # channel (e.g. real ~5837m Silverstone lap measured as ~57981m this way).
    # It's still fine for spacing outline points evenly (self-consistent within
    # its own coordinate space), but as a real-world "meters per lap" figure —
    # which cumulative_distance and now the driving-state strip's corner
    # positions depend on — it must come from the telemetry Distance channel
    # instead, which is already confirmed correctly scaled (matches real
    # circuit lengths) and is what corner distances from get_circuit_info()
    # are measured against too.
    avg_lap_length = total_length
    try:
        ref_tel = ref_lap.get_telemetry()
        if ref_tel is not None and not ref_tel.empty and "Distance" in ref_tel.columns:
            avg_lap_length = float(ref_tel["Distance"].max())
    except Exception as e:
        print(f"WARNING: could not derive avg_lap_length from telemetry Distance "
              f"({e}) — falling back to the (likely mis-scaled) position-geometry value.")

    return outline, bounds, avg_lap_length


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


def detect_quali_segments(session):
    """Split a Qualifying / Sprint-Qualifying session into Q1/Q2/Q3 time windows.

    FastF1 doesn't tag laps by segment, but the three segments are separated by
    multi-minute breaks with no cars running. So the two largest gaps between
    consecutive lap start times reliably split the session into 3 windows.
    Returns [(start_s, end_s) x3] or None (non-quali / undetectable).
    """
    name = str(getattr(session, "name", ""))
    if "Qualif" not in name and "Shootout" not in name:
        return None
    laps = session.laps
    if laps is None or laps.empty:
        return None

    starts = sorted({
        round(l["LapStartTime"].total_seconds(), 1)
        for _, l in laps.iterrows() if pd.notna(l.get("LapStartTime"))
    })
    if len(starts) < 4:
        return None

    gaps = sorted(((starts[i + 1] - starts[i], i) for i in range(len(starts) - 1)), reverse=True)
    if len(gaps) < 2:
        return None
    b1, b2 = sorted([gaps[0][1], gaps[1][1]])
    return [
        (starts[0], starts[b1]),
        (starts[b1 + 1], starts[b2]),
        (starts[b2 + 1], starts[-1]),
    ]


def _segment_for_start(windows, start_s):
    if windows is None or start_s is None:
        return None
    for idx, (a, b) in enumerate(windows, start=1):
        if a - 1.0 <= start_s <= b + 1.0:
            return idx
    return None


def build_driver_lap_tables(session):
    """Per-driver lap summary using FastF1's accurate lap data (lap time,
    compound, tyre life, stint) plus each driver's fastest lap. This powers the
    tyre-degradation chart and accurate fastest-lap selection for the Analysis
    comparison/simulation views — far more precise than reconstructing lap times
    from the 300ms telemetry samples. For quali sessions, each lap is also tagged
    with its Q1/Q2/Q3 segment.
    """
    quali_windows = detect_quali_segments(session)
    tables = {}
    for drv in session.drivers:
        try:
            info = session.get_driver(drv)
            abbr = info["Abbreviation"]
            dl = session.laps.pick_drivers(drv)
        except Exception:
            continue
        if dl is None or dl.empty:
            continue

        laps = []
        for _, lap in dl.sort_values("LapNumber").iterrows():
            lt = lap.get("LapTime")
            st = lap.get("LapStartTime")
            laps.append({
                "lap": int(lap["LapNumber"]) if pd.notna(lap.get("LapNumber")) else None,
                "lap_time_s": round(lt.total_seconds(), 3) if pd.notna(lt) else None,
                "compound": str(lap.get("Compound")) if pd.notna(lap.get("Compound")) else "UNKNOWN",
                "tyre_life": round(float(lap["TyreLife"]), 1) if pd.notna(lap.get("TyreLife")) else None,
                "stint": int(lap["Stint"]) if pd.notna(lap.get("Stint")) else None,
                "is_accurate": bool(lap.get("IsAccurate")) if pd.notna(lap.get("IsAccurate")) else False,
                # Classification position at the end of this lap. Only populated by
                # FastF1 for Race/Sprint sessions (from live timing) — null for
                # Quali/Practice, where "position after this lap" isn't a real concept.
                "position": int(lap["Position"]) if pd.notna(lap.get("Position")) else None,
                # Q1/Q2/Q3 segment (1/2/3) for quali sessions, else null.
                "segment": _segment_for_start(quali_windows, st.total_seconds() if pd.notna(st) else None),
            })

        fastest = None
        timed = [l for l in laps if l["lap_time_s"] is not None]
        if timed:
            fl = min(timed, key=lambda l: l["lap_time_s"])
            fastest = {"lap_number": fl["lap"], "lap_time_s": fl["lap_time_s"]}

        tables[abbr] = {"laps": laps, "fastest_lap": fastest}
    return tables


def _fmt_quali_time(td):
    """Timedelta -> 'm:ss.sss' string (or None). Matches session_results.py's format."""
    if td is None or pd.isna(td):
        return None
    total = td.total_seconds()
    m = int(total // 60)
    s = total - m * 60
    return f"{m}:{s:06.3f}" if m else f"{s:.3f}"


def build_quali_segments(session):
    """Per-driver Q1/Q2/Q3 times from session.results — only meaningful for
    Qualifying / Sprint Qualifying sessions (empty dict otherwise)."""
    out = {}
    try:
        results = session.results
        if results is None or results.empty or "Q1" not in results.columns:
            return out
        for _, row in results.iterrows():
            abbr = row.get("Abbreviation")
            if not abbr:
                continue
            out[abbr] = {
                "q1": _fmt_quali_time(row.get("Q1")),
                "q2": _fmt_quali_time(row.get("Q2")),
                "q3": _fmt_quali_time(row.get("Q3")),
            }
    except Exception:
        return {}
    return out


def write_laps_file(lap_tables, driver_names, team_colors, quali_segments, out_dir):
    """Session-wide lap tables for ALL drivers, WITHOUT any telemetry arrays —
    powers the Position Chart and Lap Times view (and anything else that needs
    lap-by-lap position/lap-time/stint data across the whole field) without
    downloading every driver's full per-driver telemetry file. For quali
    sessions it also carries each driver's Q1/Q2/Q3 segment times.
    """
    payload = {}
    for abbr, table in lap_tables.items():
        payload[abbr] = {
            "full_name": driver_names.get(abbr, abbr),
            "team_color": team_colors.get(abbr, "#808080"),
            "laps": table.get("laps", []),
            "fastest_lap": table.get("fastest_lap"),
            "quali": quali_segments.get(abbr),
        }
    with open(os.path.join(out_dir, "laps.json"), "w") as f:
        json.dump(payload, f)


def build_corners(session):
    """Real corner numbers + their distance along FastF1's own reference lap
    (session.get_circuit_info()) — used by the frontend's driving-state strip
    to place corner-number markers at approximately the right spot along any
    selected driver's own in-lap distance axis. Best-effort: not every
    session/track has circuit info available, so this degrades to an empty
    list rather than failing the whole generation."""
    try:
        corners = session.get_circuit_info().corners
        return [
            {"number": int(row.Number), "distance": round(float(row.Distance), 1)}
            for row in corners.itertuples()
        ]
    except Exception as e:
        print(f"WARNING: could not load circuit corner info ({e}) — corners will be empty.")
        return []


def write_track_file(track_outline, bounds, avg_lap_length, total_laps, session_name, corners, out_dir):
    """Small session-level file (~4000 outline points) so per-driver Analysis
    features can render the track without loading per-driver telemetry.
    `bounds` is the (x_min, x_max, y_min, y_max) tuple from build_track_outline."""
    payload = {
        "session": session_name,
        "track_outline": track_outline,
        "bounds": {
            "x_min": bounds[0], "x_max": bounds[1],
            "y_min": bounds[2], "y_max": bounds[3],
        },
        "avg_lap_length": round(float(avg_lap_length), 1),
        "total_laps": total_laps,
        "corners": corners,
    }
    with open(os.path.join(out_dir, "track.json"), "w") as f:
        json.dump(payload, f)


def write_conditions_file(frames, sample_ms, out_dir):
    """Small session-wide flag/weather timeline (t + flag + 4 weather floats per
    frame, no per-driver telemetry) for the Live Simulator's track-conditions
    display and flag banner. Extracted straight from the already-built `frames`
    list, since each frame already carries its own 'flag'/'weather' snapshot."""
    conditions = [
        {"t": f["t"], "flag": f["flag"], **f["weather"]}
        for f in frames
    ]
    payload = {"sample_interval_ms": sample_ms, "conditions": conditions}
    with open(os.path.join(out_dir, "conditions.json"), "w") as f:
        json.dump(payload, f)


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
        all_speed, all_gear, all_throttle, all_brake, all_rpm, all_drs = [], [], [], [], [], []

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
            all_rpm.append(tel.get("RPM", pd.Series(np.zeros(n))).to_numpy(dtype=float))
            all_drs.append(tel.get("DRS", pd.Series(np.zeros(n))).to_numpy(dtype=float))

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
        rpm_concat = np.concatenate(all_rpm)
        drs_concat = np.concatenate(all_drs)

        order = np.argsort(t_concat)
        arrays = [t_concat, x_concat, y_concat, dist_concat, lap_concat,
                  compound_concat, tyre_life_concat, in_pit_concat,
                  spd_concat, gear_concat, thr_concat, brk_concat, rpm_concat, drs_concat]

        t_concat, x_concat, y_concat, dist_concat, lap_concat, \
            compound_concat, tyre_life_concat, in_pit_concat, \
            spd_concat, gear_concat, thr_concat, brk_concat, rpm_concat, drs_concat = [a[order] for a in arrays]

        _, unique_idx = np.unique(t_concat, return_index=True)
        unique_idx = np.sort(unique_idx)

        t_concat, x_concat, y_concat, dist_concat, lap_concat, \
            compound_concat, tyre_life_concat, in_pit_concat, \
            spd_concat, gear_concat, thr_concat, brk_concat, rpm_concat, drs_concat = [
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
        rpm_out = np.full(n_frames, 0.0)
        drs_out = np.full(n_frames, 0.0)

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
                rpm_out[i] = rpm_concat[j] + frac * (rpm_concat[j + 1] - rpm_concat[j])
                drs_out[i] = drs_concat[j]   # Hold current DRS status (discrete state)
            else:
                x_out[i] = x_concat[j]
                y_out[i] = y_concat[j]
                dist_out[i] = dist_concat[j]

                spd_out[i] = spd_concat[j]
                thr_out[i] = thr_concat[j]
                gear_out[i] = gear_concat[j]
                brk_out[i] = brk_concat[j]
                rpm_out[i] = rpm_concat[j]
                drs_out[i] = drs_concat[j]

            lap_out[i] = lap_concat[j]
            compound_out[i] = compound_concat[j]
            tyre_life_out[i] = tyre_life_concat[j]
            in_pit_out[i] = in_pit_concat[j]

        driver_series[abbr] = {
            "x": x_out, "y": y_out, "lap": lap_out, "dist": dist_out,
            "compound": compound_out, "tyre_life": tyre_life_out, "in_pit": in_pit_out,
            "speed": spd_out, "gear": gear_out, "throttle": thr_out, "brake": brk_out, "rpm": rpm_out, "drs": drs_out # 🛠️ PACKAGED
        }

    return driver_series, team_colors, driver_names


def write_driver_files(driver_series, team_colors, driver_names, results_map,
                       lap_tables, master_timeline, avg_lap_length, sample_ms, out_dir):
    """Write one compact JSON file per driver.

    Each driver's series in `driver_series` is NaN-padded to the full
    master_timeline length (valid only where the driver was actually on track).
    We trim each to its own valid contiguous range before writing — this both
    avoids serializing a bare `NaN` token (invalid JSON that would break the
    frontend's JSON.parse) and keeps each file small.

    The valid region is guaranteed contiguous: build_driver_frame_series only
    leaves x_out at its initial NaN when the master-timeline loop `continue`s
    (i.e. before the driver's first lap or after their last). Every other branch
    writes a real value. So one first/last valid index pair per driver suffices.
    """
    drivers_dir = os.path.join(out_dir, "drivers")
    os.makedirs(drivers_dir, exist_ok=True)
    manifest = {}

    for abbr, series in driver_series.items():
        valid = ~np.isnan(series["x"])
        if not valid.any():
            continue  # defensive — driver_series only holds drivers with laps
        idx = np.flatnonzero(valid)
        start, end = int(idx[0]), int(idx[-1]) + 1  # end exclusive

        t = master_timeline[start:end]
        lap = series["lap"][start:end]
        dist = series["dist"][start:end]  # in-lap distance (resets each lap)
        cumulative_distance = (lap - 1) * avg_lap_length + dist

        driver_laps = lap_tables.get(abbr, {})
        fastest_lap = driver_laps.get("fastest_lap")

        payload = {
            "driver": abbr,
            "full_name": driver_names.get(abbr, abbr),
            "team_color": team_colors.get(abbr, "#808080"),
            "status": results_map.get(abbr, {}).get("status"),
            "sample_interval_ms": sample_ms,
            "avg_lap_length": round(float(avg_lap_length), 1),
            "fastest_lap": fastest_lap,
            "laps": driver_laps.get("laps", []),
            "t": np.round(t, 2).tolist(),
            "x": np.round(series["x"][start:end], 2).tolist(),
            "y": np.round(series["y"][start:end], 2).tolist(),
            "lap": np.round(lap).astype(int).tolist(),
            "dist": np.round(dist, 1).tolist(),
            "cumulative_distance": np.round(cumulative_distance, 1).tolist(),
            "compound": [str(c) for c in series["compound"][start:end]],
            "tyre_life": np.round(series["tyre_life"][start:end], 1).tolist(),
            "in_pit": [bool(v) for v in series["in_pit"][start:end]],
            "speed": [int(v) for v in series["speed"][start:end]],
            "gear": [int(v) for v in series["gear"][start:end]],
            "throttle": [int(v) for v in series["throttle"][start:end]],
            "brake": [bool(v > 0) for v in series["brake"][start:end]],
            "rpm": [int(v) for v in series["rpm"][start:end]],
            # FastF1's DRS channel uses 0/1/2/3/8 for various "off/detected" states and
            # 10/12/14 for genuinely open — >=10 is the standard "DRS actually open" cutoff.
            "drs": [bool(v >= 10) for v in series["drs"][start:end]],
        }

        with open(os.path.join(drivers_dir, f"{abbr}.json"), "w") as f:
            json.dump(payload, f)

        manifest[abbr] = {
            "full_name": driver_names.get(abbr, abbr),
            "team_color": team_colors.get(abbr, "#808080"),
            "status": results_map.get(abbr, {}).get("status"),
            "num_samples": int(end - start),
            "t_start": round(float(t[0]), 2),
            "t_end": round(float(t[-1]), 2),
            "fastest_lap": fastest_lap,
        }

    with open(os.path.join(drivers_dir, "index.json"), "w") as f:
        json.dump(manifest, f)

    return len(manifest)


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

    # Only t/flag/weather ever get read back out of `frames` (by write_conditions_file
    # below) — per-driver positions/telemetry are written separately and far more
    # efficiently by write_driver_files, which only serializes each driver's own valid
    # range instead of a dense frame x driver grid. This used to also build a
    # `frame_cars` dict per frame (looping every driver for every one of potentially
    # 15,000+ frames) for the old merged data.json — that file was dropped, but this
    # loop kept running and its result just got discarded, wasting real CPU/memory
    # for nothing on every single generation.
    print("Assembling session-wide flag/weather timeline...")
    frames = []
    status_cursor = [0]
    weather_cursor = [0]

    for t in master_timeline:
        flag = status_at_time(status_events, t, status_cursor)
        w_snap = weather_at_time(weather_events, t, weather_cursor)
        frames.append({"t": round(float(t), 2), "flag": flag, "weather": w_snap})

    safe_gp = args.gp.lower().replace(" ", "_")
    out_dir = os.path.join(args.output_dir, str(args.year), safe_gp, args.session)
    os.makedirs(out_dir, exist_ok=True)

    total_laps = int(session.total_laps) if hasattr(session, "total_laps") and session.total_laps else None

    # Outputs: per-driver telemetry files + track/laps/conditions files, consumed by
    # the Analysis page and Live Simulator. These are now the only outputs this
    # script produces, so a failure here must propagate (nonzero exit) rather than
    # be swallowed — runPythonGenerator treats any nonzero exit as a hard failure,
    # and a caught-and-warned exception here would otherwise report success with
    # zero files actually written.
    print("Building per-driver lap tables (accurate lap times / stints)...")
    lap_tables = build_driver_lap_tables(session)

    print("Writing per-driver telemetry files...")
    n = write_driver_files(driver_series, team_colors, driver_names, results_map,
                           lap_tables, master_timeline, avg_lap_length, args.sample_ms, out_dir)
    print(f"Done. Wrote {n} per-driver files to {os.path.join(out_dir, 'drivers')}")

    print("Writing track file...")
    corners = build_corners(session)
    write_track_file(track_outline, bounds, avg_lap_length, total_laps, args.session, corners, out_dir)
    print(f"Done. Wrote track.json to {out_dir}")

    print("Writing session-wide laps file (all drivers, no telemetry)...")
    quali_segments = build_quali_segments(session)
    write_laps_file(lap_tables, driver_names, team_colors, quali_segments, out_dir)
    print(f"Done. Wrote laps.json to {out_dir}")

    print("Writing session conditions file (flag/weather timeline)...")
    write_conditions_file(frames, args.sample_ms, out_dir)
    print(f"Done. Wrote conditions.json to {out_dir}")


if __name__ == "__main__":
    main()