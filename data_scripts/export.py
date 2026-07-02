import fastf1
import json
import os

# Create the folder if it doesn't exist
if not os.path.exists('f1_cache'):
    os.makedirs('f1_cache')
    
# Create a folder for data to speed up future runs
fastf1.Cache.enable_cache('f1_cache') 

session = fastf1.get_session(2025, 'Abu Dhabi', 'R')
session.load()

# Get the fastest lap and extract telemetry
lap = session.laps.pick_fastest()
tel = lap.get_telemetry()

# Save as JSON for your React app
tel[['X', 'Y', 'Time']].to_json('race_data.json', orient='records')

print("Success! Check for race_data.json in this folder.")