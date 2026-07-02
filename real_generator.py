import fastf1
import json
import os
import pandas as pd
import numpy as np

# 1. Enable Caching (Highly recommended by FastF1 documentation to avoid slow API down times)
os.makedirs('fastf1_cache', exist_ok=True)
fastf1.Cache.enable_cache('fastf1_cache')

print("Fetching authentic 2023 Abu Dhabi Grand Prix Telemetry...")
# Load the 2023 Abu Dhabi GP Race Session
session = fastf1.get_session(2023, 'Abu Dhabi', 'R')
session.load(telemetry=True)

drivers_list = session.drivers
drivers_config = []
telemetry_by_driver = {}

print("Processing driver attributes and mapping lap telemetry...")
# 2. Extract Driver Details & Laps
for d_num in drivers_list:
    driver_info = session.get_driver(d_num)
    d_id = driver_info['Abbreviation']
    team_color = f"#{driver_info['TeamColor']}" if driver_info['TeamColor'] else "#ffffff"
    
    drivers_config.append({
        "id": d_id,
        "color": team_color,
        "team": driver_info['TeamName']
    })
    
    # Pick the actual first lap driven by this driver
    driver_laps = session.laps.pick_driver(d_id)
    lap_one = driver_laps[driver_laps['LapNumber'] == 1]
    
    if not lap_one.empty:
        # Get raw timing/distance telemetry 
        tel = lap_one.iloc[0].get_telemetry()
        # Add relative distance (0.0 at start, 1.0 at finish line)
        tel = tel.add_relative_distance()
        
        # Store time string and relative progress
        telemetry_by_driver[d_id] = tel[['Time', 'RelativeDistance']].copy()

# 3. Synchronize Frames by Time
# Telemetry signals come at different micro-intervals; we must align them onto a single timestamp axis
all_times = []
for d_id, df in telemetry_by_driver.items():
    all_times.extend(df['Time'].dt.total_seconds().tolist())

# Create a master timeline from the earliest to latest stamp of Lap 1 (sampled every 200ms)
master_timeline = np.arange(min(all_times), max(all_times), 0.2)

frames = []
for step_idx, current_time in enumerate(master_timeline):
    positions_at_frame = []
    
    for d_config in drivers_config:
        d_id = d_config["id"]
        if d_id in telemetry_by_driver:
            df = telemetry_by_driver[d_id]
            df_seconds = df['Time'].dt.total_seconds()
            
            # Interpolate the exact position of the driver at this specific time step
            current_progress = np.interp(current_time, df_seconds, df['RelativeDistance'], left=0.0, right=1.0)
            positions_at_frame.append(round(current_progress, 5))
        else:
            positions_at_frame.append(0.0)
            
    frames.append({
        "timestamp": step_idx,
        "positions": positions_at_frame
    })

# 4. Save structured JSON directly into your React App
output_data = {
    "drivers": drivers_config,
    "frames": frames
}

output_path = 'data.json'
with open(output_path, 'w') as f:
    json.dump(output_data, f)

print(f"✅ Telemetry compilation complete! Real data written successfully.")
