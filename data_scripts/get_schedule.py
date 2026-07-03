import fastf1
import json
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Fetch F1 schedule for a given year")
    parser.add_argument("--year", type=int, required=True)
    args = parser.parse_args()

    try:
        # Fetch the official schedule for the year
        schedule = fastf1.get_event_schedule(args.year)
        
        # Filter out pre-season testing (RoundNumber 0)
        official_races = schedule[schedule['RoundNumber'] > 0]
        
        # Extract the official Event Names into a list
        events = official_races['EventName'].tolist()
        
        print(json.dumps({"success": True, "schedule": events}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()