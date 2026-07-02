import json
import random

# 1. Define the full 2024 F1 Grid
drivers = [
    {"id": "VER", "color": "#3b82f6", "team": "Red Bull"},
    {"id": "PER", "color": "#3b82f6", "team": "Red Bull"},
    {"id": "LEC", "color": "#ef4444", "team": "Ferrari"},
    {"id": "SAI", "color": "#ef4444", "team": "Ferrari"},
    {"id": "NOR", "color": "#f97316", "team": "McLaren"},
    {"id": "PIA", "color": "#f97316", "team": "McLaren"},
    {"id": "HAM", "color": "#2dd4bf", "team": "Mercedes"},
    {"id": "RUS", "color": "#2dd4bf", "team": "Mercedes"},
    {"id": "ALO", "color": "#10b981", "team": "Aston Martin"},
    {"id": "STR", "color": "#10b981", "team": "Aston Martin"},
    {"id": "GAS", "color": "#ec4899", "team": "Alpine"},
    {"id": "OCO", "color": "#ec4899", "team": "Alpine"},
    {"id": "ALB", "color": "#0ea5e9", "team": "Williams"},
    {"id": "SAR", "color": "#0ea5e9", "team": "Williams"},
    {"id": "TSU", "color": "#6366f1", "team": "RB"},
    {"id": "RIC", "color": "#6366f1", "team": "RB"},
    {"id": "BOT", "color": "#22c55e", "team": "Sauber"},
    {"id": "ZHO", "color": "#22c55e", "team": "Sauber"},
    {"id": "MAG", "color": "#f3f4f6", "team": "Haas"},
    {"id": "HUL", "color": "#f3f4f6", "team": "Haas"}
]

# 2. Assign base speeds (so some cars are naturally faster)
# Base progress per frame is around 0.002
speeds = [0.002 + random.uniform(-0.0002, 0.0002) for _ in range(20)]
speeds[0] += 0.0001 # Give Max a slight edge for realism

frames = []
current_positions = [0.0] * 20 # Everyone starts at the start line

print("Generating 1000 frames of telemetry...")

# 3. Generate 1,000 frames (Loops the track continuously)
for i in range(1000):
    for j in range(20):
        # Add speed + a tiny bit of random noise for "micro-battles"
        current_positions[j] = (current_positions[j] + speeds[j] + random.uniform(-0.00005, 0.00005)) % 1.0
        
    frames.append({
        "timestamp": i,
        "positions": [round(p, 5) for p in current_positions]
    })

# 4. Package it up
race_data = {
    "drivers": drivers,
    "frames": frames
}

# 5. Save the file
with open('data.json', 'w') as f:
    json.dump(race_data, f)

print("✅ Success! 'data.json' has been created.")