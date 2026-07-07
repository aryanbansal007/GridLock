"""
Grid-Lock: Season Data Generator
==================================
Generates two JSON files for the dashboard/standings/calendar pages:

  standings.json  — driver + constructor standings (aggregated from race results)
  calendar.json   — full season race calendar with results, winner, status

Output path:
  {output_dir}/season/{year}/standings.json
  {output_dir}/season/{year}/calendar.json

Usage:
  python generate_season_data.py --year 2024
  python generate_season_data.py --year 2021 --cache-dir fastf1_cache --output-dir ../backend/src/cache

Notes:
  - FastF1 has no direct standings endpoint, so we load each race's
    session.results and aggregate points manually using the standard
    F1 points system (25-18-15-12-10-8-6-4-2-1 + 1 for fastest lap).
  - Only "completed" rounds are aggregated. Future/cancelled rounds
    appear in calendar.json but are skipped for standings.
  - Re-run this script after each race weekend to refresh data.
"""

import argparse
import os
import json
from datetime import datetime, timedelta, timezone

import fastf1
import pandas as pd
import numpy as np


# ─── Constants ────────────────────────────────────────────────────────────────

POINTS_MAP = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8,  7: 6,  8: 4,  9: 2,  10: 1,
}
FASTEST_LAP_POINT = 1  # awarded only if driver finishes in top 10

# Official F1 team colours (hex, no #) — used for UI accent colours
TEAM_COLORS = {
    "Mercedes":         "00D2BE",
    "Red Bull Racing":  "3671C6",
    "Ferrari":          "E8002D",
    "McLaren":          "FF8000",
    "Aston Martin":     "358C75",
    "Alpine":           "0093CC",
    "Williams":         "64C4FF",
    "RB":               "6692FF",
    "Kick Sauber":      "52E252",
    "Haas F1 Team":     "B6BABD",
    # Legacy names (older seasons)
    "AlphaTauri":       "5E8FAA",
    "Alfa Romeo":       "C92D4B",
    "Racing Point":     "F596C8",
    "Renault":          "FFF500",
    "Toro Rosso":       "469BFF",
    "Force India":      "F596C8",
    "Sauber":           "9B0000",
    "Manor Marussia":   "6E0000",
    "Lotus F1":         "FFB800",
    "Marussia":         "6E0000",
    "HRT":              "999999",
    "Caterham":         "005030",
}

# Circuit images — real aerial / atmospheric circuit PHOTOGRAPHS, sourced via the Wikipedia
# media-list API (each circuit article's best real .jpg, preferring SkySat aerials) and
# verified HTTP 200 before being pasted here. Replaces the old track-map diagrams.
# Key matches event["EventName"] lowercased + underscored (see safe_gp_key).
#
# Caveat: keyed by GP name only, not (year, GP name). A GP whose host circuit changed over
# the years (e.g. "Spanish Grand Prix": Barcelona historically, Madrid from 2026) gets one
# image; a year-aware lookup would be needed to distinguish those.
CIRCUIT_IMAGES = {
    "abu_dhabi_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Yas_Marina_Circuit%2C_October_12%2C_2018_SkySat_%28cropped%29.jpg/1280px-Yas_Marina_Circuit%2C_October_12%2C_2018_SkySat_%28cropped%29.jpg",
    "australian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Melbourne_Grand_Prix_Circuit%2C_March_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Melbourne_Grand_Prix_Circuit%2C_March_22%2C_2018_SkySat_%28cropped%29.jpg",
    "austrian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Red-Bull-Ring-constrution-area-2010-07-04.JPG/1280px-Red-Bull-Ring-constrution-area-2010-07-04.JPG",
    "azerbaijan_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Baku_City_Circuit%2C_April_9%2C_2018_SkySat.jpg/1280px-Baku_City_Circuit%2C_April_9%2C_2018_SkySat.jpg",
    "bahrain_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Bahrain_International_Circuit%2C_November_2%2C_2017_SkySat_%28cropped%29.jpg/1280px-Bahrain_International_Circuit%2C_November_2%2C_2017_SkySat_%28cropped%29.jpg",
    "barcelona_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat_%28cropped%29.jpg",
    "belgian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Circuit_de_Spa-Francorchamps%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_de_Spa-Francorchamps%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg",
    "british_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Silverstone_Circuit%2C_July_2%2C_2018_SkySat_%28cropped%29.jpg/1280px-Silverstone_Circuit%2C_July_2%2C_2018_SkySat_%28cropped%29.jpg",
    "canadian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Circuit_Gilles-Villeneuve%2C_May_29%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_Gilles-Villeneuve%2C_May_29%2C_2018_SkySat_%28cropped%29.jpg",
    "chinese_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Shanghai_International_Circuit%2C_April_7%2C_2018_SkySat_%28rotated%29.jpg/1280px-Shanghai_International_Circuit%2C_April_7%2C_2018_SkySat_%28rotated%29.jpg",
    "dutch_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Circuit_Zandvoort_motorsport_race_track_in_the_Netherlands_%2846940292845%29.jpg/1280px-Circuit_Zandvoort_motorsport_race_track_in_the_Netherlands_%2846940292845%29.jpg",
    "emilia_romagna_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Autodromo_aerea_poster.jpg/1280px-Autodromo_aerea_poster.jpg",
    "french_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Circuit_Paul_Ricard%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_Paul_Ricard%2C_April_22%2C_2018_SkySat_%28cropped%29.jpg",
    "hungarian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/a/aa/Hungaroring%2C_April_28%2C_2018_SkySat_%28cropped%29.jpg",
    "italian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/6/65/Monza_aerial_photo.jpg",
    "japanese_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Suzuka_International_Racing_Course%2C_July_10%2C_2018_SkySat_%28cropped%29.jpg/1280px-Suzuka_International_Racing_Course%2C_July_10%2C_2018_SkySat_%28cropped%29.jpg",
    "las_vegas_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/The_Strip%2C_Las_Vegas.jpg/1280px-The_Strip%2C_Las_Vegas.jpg",
    "mexico_city_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez%2C_June_4%2C_2018_SkySat_%28cropped%29.jpg/1280px-Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez%2C_June_4%2C_2018_SkySat_%28cropped%29.jpg",
    "miami_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Miami_Grand_Prix_startfinish.jpg/1280px-Miami_Grand_Prix_startfinish.jpg",
    "monaco_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Circuit_de_Monaco%2C_April_1%2C_2018_SkySat_%28cropped%29.jpg",
    "portuguese_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Aut%C3%B3dromo_Internacional_do_Algarve_%282012-09-23%29%2C_by_Klugschnacker_in_Wikipedia_%2825%29.JPG/1280px-Aut%C3%B3dromo_Internacional_do_Algarve_%282012-09-23%29%2C_by_Klugschnacker_in_Wikipedia_%2825%29.JPG",
    "qatar_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/WTCC_2016%2C_Qatar.jpg/1280px-WTCC_2016%2C_Qatar.jpg",
    "russian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/2/22/F1_Grand_Prix_Russia_2014_start_lane.jpg",
    "saudi_arabian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/4/44/Jeddah.circuit.jpg",
    "singapore_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/1_singapore_f1_night_race_2012_city_skyline.jpg/1280px-1_singapore_f1_night_race_2012_city_skyline.jpg",
    "spanish_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat_%28cropped%29.jpg/1280px-Circuit_de_Barcelona-Catalunya%2C_April_19%2C_2018_SkySat_%28cropped%29.jpg",
    "styrian_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Red-Bull-Ring-constrution-area-2010-07-04.JPG/1280px-Red-Bull-Ring-constrution-area-2010-07-04.JPG",
    "são_paulo_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Bairro_de_Interlagos.jpg",
    "turkish_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Istanbul_Park_aerial.jpg/1280px-Istanbul_Park_aerial.jpg",
    "united_states_grand_prix": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Circuit_of_the_Americas%2C_April_22%2C_2018_SkySat_%28cropped2%29.jpg/1280px-Circuit_of_the_Americas%2C_April_22%2C_2018_SkySat_%28cropped2%29.jpg",
    "british_grand_prix_2021": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Silverstone_Circuit%2C_July_2%2C_2018_SkySat_%28cropped%29.jpg/1280px-Silverstone_Circuit%2C_July_2%2C_2018_SkySat_%28cropped%29.jpg",
}


# Driver portraits — real Wikipedia headshots, verified HTTP 200. Keyed by full driver name
# as it appears in FastF1 results. Missing drivers fall back to an empty string (the frontend
# then renders an initials avatar in the team colour).
# Wikipedia Commons thumbnails at 500px (bumped from 330px for sharper avatars at the
# larger sizes used on podium cards / the driver season-overview popup). Each URL is the
# same photo Wikipedia's own infobox uses for that driver — verified against their
# pageimages API rather than picked ad hoc — except Gasly's, whose old entry pointed at
# an on-track car photo (not even a recognizable portrait); swapped for his real infobox
# photo instead. This dict is shared across every cached season year (2020-2026), not just
# the current one, so retired/former drivers are kept too — they're still needed whenever
# the SeasonSelector is switched back to a year they actually raced in.
DRIVER_IMAGES = {
    "Alexander Albon": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Alex_Albon_%28cropped%29.jpg/500px-Alex_Albon_%28cropped%29.jpg",
    "Antonio Giovinazzi": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Antonio_Giovinazzi_-_Ferrari_499P_-_Hybrid_during_the_pitwalk_at_the_2023_Le_Mans_%2853468237574%29.jpg/500px-Antonio_Giovinazzi_-_Ferrari_499P_-_Hybrid_during_the_pitwalk_at_the_2023_Le_Mans_%2853468237574%29.jpg",
    "Arvid Lindblad": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Arvid_Lindblad_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7869%29_%28cropped%29.jpg/500px-Arvid_Lindblad_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7869%29_%28cropped%29.jpg",
    "Carlos Sainz": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg/500px-Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg",
    "Charles Leclerc": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3978_by_Stepro_%28cropped2%29.jpg",
    "Daniel Ricciardo": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Daniel_Ricciardo_January_2024.jpg/500px-Daniel_Ricciardo_January_2024.jpg",
    "Esteban Ocon": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg/500px-Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg",
    "Fernando Alonso": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Alonso-68_%2824710447098%29.jpg/500px-Alonso-68_%2824710447098%29.jpg",
    "Franco Colapinto": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Franco_Colapinto_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8704%29_%28cropped%29.jpg/500px-Franco_Colapinto_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8704%29_%28cropped%29.jpg",
    "Gabriel Bortoleto": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Gabriel_Bortoleto_%28cropped%29.jpg/500px-Gabriel_Bortoleto_%28cropped%29.jpg",
    "George Russell": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/KingsLeonSilverstne040724_%2828_of_112%29_%2853838006028%29_%28cropped%29.jpg/500px-KingsLeonSilverstne040724_%2828_of_112%29_%2853838006028%29_%28cropped%29.jpg",
    "Isack Hadjar": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Isack_Hadjar_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8753%29_%28cropped%29.jpg/500px-Isack_Hadjar_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8753%29_%28cropped%29.jpg",
    "Kimi Antonelli": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Kimi_Antonelli_at_the_2025_US_Grand_Prix_in_Austin%2C_TX_%28cropped%29.jpg/500px-Kimi_Antonelli_at_the_2025_US_Grand_Prix_in_Austin%2C_TX_%28cropped%29.jpg",
    "Kimi Räikkönen": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/F12019_Schloss_Gabelhofen_%2822%29_%28cropped%29.jpg/500px-F12019_Schloss_Gabelhofen_%2822%29_%28cropped%29.jpg",
    "Lance Stroll": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2025_Japan_GP_-_Aston_Martin_-_Lance_Stroll_-_Fanzone_Stage_%28cropped%29.jpg/500px-2025_Japan_GP_-_Aston_Martin_-_Lance_Stroll_-_Fanzone_Stage_%28cropped%29.jpg",
    "Lando Norris": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3968_by_Stepro_%28cropped2%29.jpg",
    "Lewis Hamilton": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/500px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg",
    "Liam Lawson": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Liam_Lawson_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7793%29.jpg/500px-Liam_Lawson_at_the_Red_Bull_Fan_Zone_%E2%80%93_Crown_Riverwalk%2C_Melbourne_%28028A7793%29.jpg",
    "Max Verstappen": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg/500px-2024-08-25_Motorsport%2C_Formel_1%2C_Gro%C3%9Fer_Preis_der_Niederlande_2024_STP_3973_by_Stepro_%28medium_crop%29.jpg",
    "Mick Schumacher": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mick_Schumacher_2024_WEC_Fuji.jpg/500px-Mick_Schumacher_2024_WEC_Fuji.jpg",
    "Nicholas Latifi": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Nicholas_Latifi_at_Singapore_in_2022_%28cropped%29.jpg/500px-Nicholas_Latifi_at_Singapore_in_2022_%28cropped%29.jpg",
    "Nico Hulkenberg": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/2019_Formula_One_tests_Barcelona%2C_Hulkenberg_%2840287128313%29.jpg/500px-2019_Formula_One_tests_Barcelona%2C_Hulkenberg_%2840287128313%29.jpg",
    "Nikita Mazepin": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/%D0%9D%D0%B8%D0%BA%D0%B8%D1%82%D0%B0_%D0%9C%D0%B0%D0%B7%D0%B5%D0%BF%D0%B8%D0%BD_-_%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B2%D1%8C%D1%8E_-_2019%2C_02.jpg/500px-%D0%9D%D0%B8%D0%BA%D0%B8%D1%82%D0%B0_%D0%9C%D0%B0%D0%B7%D0%B5%D0%BF%D0%B8%D0%BD_-_%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B2%D1%8C%D1%8E_-_2019%2C_02.jpg",
    "Oliver Bearman": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2025_Japan_GP_-_Haas_-_Oliver_Bearman_-_Thursday_%28cropped%29.jpg/500px-2025_Japan_GP_-_Haas_-_Oliver_Bearman_-_Thursday_%28cropped%29.jpg",
    "Oscar Piastri": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2026_Chinese_GP_-_Oscar_Piastri_%28cropped%29_%28cropped%29.jpg/500px-2026_Chinese_GP_-_Oscar_Piastri_%28cropped%29_%28cropped%29.jpg",
    "Pierre Gasly": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/2022_French_Grand_Prix_%2852279065728%29_%28midcrop%29.png/500px-2022_French_Grand_Prix_%2852279065728%29_%28midcrop%29.png",
    "Robert Kubica": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Robert_Kubica_at_Monza_2023.jpg/500px-Robert_Kubica_at_Monza_2023.jpg",
    "Sebastian Vettel": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg/500px-Sebastian_Vettel_-_2022236172324_2022-08-24_Champions_for_Charity_-_Sven_-_1D_X_MK_II_-_0418_-_B70I2428_%28cropped%29.jpg",
    "Sergio Perez": "https://upload.wikimedia.org/wikipedia/commons/5/55/2021_US_GP_driver_parade_%28cropped2%29.jpg",
    "Valtteri Bottas": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg/500px-Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg",
    "Yuki Tsunoda": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Yuki_Tsunoda_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8096%29.jpg/500px-Yuki_Tsunoda_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8096%29.jpg",
}


# ─── Argument Parsing ─────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="Generate GridLock season standings + calendar JSON")
    p.add_argument("--year",       type=int, required=True,                 help="F1 season year e.g. 2024")
    p.add_argument("--cache-dir",  type=str, default="fastf1_cache",        help="FastF1 cache directory")
    p.add_argument("--output-dir", type=str, default="../backend/src/cache", help="Root cache output dir")
    return p.parse_args()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def safe_gp_key(event_name: str) -> str:
    """Convert event name to slug key matching CIRCUIT_IMAGES map."""
    return event_name.lower().replace(" ", "_")


def get_team_color(team_name: str) -> str:
    """Return hex color for a team, fallback to grey."""
    return TEAM_COLORS.get(team_name, "808080")


def get_circuit_image(event_name: str) -> str:
    """Return image URL for circuit, fallback to empty string."""
    key = safe_gp_key(event_name)
    return CIRCUIT_IMAGES.get(key, "")


def get_driver_image(full_name: str) -> str:
    """Return portrait URL for a driver, fallback to empty string."""
    return DRIVER_IMAGES.get(full_name, "")


def points_for_position(pos, fastest_lap=False, in_top_10=False) -> int:
    """Calculate F1 points for a finishing position."""
    pts = POINTS_MAP.get(int(pos), 0)
    if fastest_lap and in_top_10:
        pts += FASTEST_LAP_POINT
    return pts


def _as_aware_datetime(value):
    """Coerce a pandas/py datetime (possibly tz-naive) to a tz-aware UTC datetime."""
    if value is None or (hasattr(value, "__class__") and str(type(value)) == "<class 'pandas._libs.tslibs.nattype.NaTType'>"):
        return None
    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def determine_race_status(event, today: datetime) -> str:
    """
    Determine race card status using the *actual* session start times FastF1 gives us
    (Session1Date = first practice/quali, Session5Date = the Race — true for every current
    event format, sprint or conventional) rather than a fuzzy +/-3 CALENDAR DAY window
    around EventDate. The old day-count approach kept a race "ongoing" for a full 3 days
    *after* it had actually finished (e.g. a Sunday race still showed live on Tuesday),
    which also silently excluded it from standings aggregation below (only "completed"
    rounds are aggregated) even though the race had long since finished:
      'completed'  — more than RACE_FINISHED_BUFFER after the Race session's start
      'ongoing'    — anywhere from the weekend's first session up to that buffer
      'upcoming'   — before the weekend's first session has started
    """
    today_utc = today.replace(tzinfo=timezone.utc) if today.tzinfo is None else today.astimezone(timezone.utc)

    weekend_start = _as_aware_datetime(event.get("Session1Date"))
    race_start = _as_aware_datetime(event.get("Session5Date"))

    # Fall back to the old date-only heuristic if precise session times aren't available
    # for some reason (shouldn't normally happen — every event has these columns).
    if race_start is None:
        race_date = _as_aware_datetime(event.get("EventDate"))
        if race_date is None:
            return "upcoming"
        delta_days = (race_date.date() - today_utc.date()).days
        if delta_days < -3:
            return "completed"
        elif -3 <= delta_days <= 3:
            return "ongoing"
        else:
            return "upcoming"

    # Races typically run ~2 hours plus podium/press — 4 hours covers that with margin
    # without leaving a finished race marked "ongoing" for days afterward.
    RACE_FINISHED_BUFFER = timedelta(hours=4)
    race_finished_at = race_start + RACE_FINISHED_BUFFER

    if today_utc > race_finished_at:
        return "completed"

    # Far-future events often don't have Session1Date published yet (FastF1 leaves it
    # NaT until the weekend's schedule is finalized — seen on 2026 Singapore, for
    # instance). Falling back to treating "unknown weekend start" as ongoing was the
    # bug: it marked races literally months away as live. Fall back to the Race
    # session's own start time as the "has this weekend begun" cutoff instead.
    effective_start = weekend_start if weekend_start is not None else race_start
    if today_utc < effective_start:
        return "upcoming"
    return "ongoing"


# ─── Session Loading ───────────────────────────────────────────────────────────

# ─── Session Loading ───────────────────────────────────────────────────────────

def load_point_awarding_sessions(year, gp_round, cache_dir):
    """
    Load point-awarding sessions (Main Race and Sprint).
    Returns a list of valid sessions.
    """
    sessions = []
    
    # 1. Load the Main Race
    try:
        race = fastf1.get_session(year, gp_round, "R")
        # Much faster: we don't need laps/telemetry because we use the official 'Points' column
        race.load(telemetry=False, laps=False, weather=False)
        sessions.append(race)
    except Exception as e:
        print(f"    Could not load race for round {gp_round}: {e}")

    # 2. Load the Sprint (if it exists for this weekend)
    try:
        sprint = fastf1.get_session(year, gp_round, "Sprint")
        sprint.load(telemetry=False, laps=False, weather=False)
        sessions.append(sprint)
    except Exception:
        # Not every weekend has a sprint, so we silently pass
        pass

    return sessions


# ─── Calendar Builder ─────────────────────────────────────────────────────────

def build_calendar(year, schedule, completed_sessions, cache_dir):
    today = datetime.now(timezone.utc)
    races = []

    for _, event in schedule.iterrows():
        round_number = int(event.get("RoundNumber", 0))
        if round_number == 0:
            continue 

        event_name = str(event.get("EventName", ""))
        circuit    = str(event.get("Location", ""))
        country    = str(event.get("Country", ""))
        
        race_date = event.get("EventDate")
        if hasattr(race_date, "to_pydatetime"):
            race_date = race_date.to_pydatetime()
        date_str = race_date.strftime("%Y-%m-%d") if race_date else ""

        # Weekend start = the first session's date (usually Friday practice) —
        # lets the calendar show "Jul 17 - Jul 19" instead of just the race day.
        # Must use pd.notna(), not a plain truthy check — a pandas NaT (missing
        # session date, seen on some rounds) is truthy in Python but crashes
        # strftime, which took down the whole script before this fix.
        weekend_start = event.get("Session1Date")
        weekend_start_str = date_str
        if pd.notna(weekend_start):
            if hasattr(weekend_start, "to_pydatetime"):
                weekend_start = weekend_start.to_pydatetime()
            weekend_start_str = weekend_start.strftime("%Y-%m-%d")

        # Exact Race session start (ISO, UTC) — lets the frontend show a "just finished,
        # results updating" state for a few hours after the race instead of only knowing
        # the bare calendar date. None if unavailable (mirrors weekend_start's NaT guard).
        race_start_dt = _as_aware_datetime(event.get("Session5Date"))
        race_time_str = race_start_dt.isoformat() if race_start_dt is not None else None

        status = determine_race_status(event, today)

        # FastF1 EventFormat is 'conventional' for normal weekends and a
        # 'sprint*' variant (sprint / sprint_shootout / sprint_qualifying) for
        # sprint weekends. The Analysis page uses this to hide Sprint / Sprint
        # Qualifying session options on weekends that don't run a sprint.
        event_format = str(event.get("EventFormat", "")).lower()
        has_sprint = "sprint" in event_format

        # Pull winner from the main Race session
        winner_name = None
        winner_team = None
        sessions = completed_sessions.get(round_number, [])
        
        main_race = next((s for s in sessions if s.name == 'Race'), None)

        if main_race is not None and not main_race.results.empty:
            try:
                res = main_race.results.sort_values("Position")
                top = res.iloc[0]
                winner_name = str(top.get("FullName", top.get("Abbreviation", "")))
                winner_team = str(top.get("TeamName", ""))
            except Exception:
                pass

        races.append({
            "round":        round_number,
            "name":         event_name,
            "circuit":      circuit,
            "country":      country,
            "date":         date_str,
            "status":       status,
            "winner":       winner_name,
            "winner_team":  winner_team,
            "image_url":    get_circuit_image(event_name),
            "race_id":      f"{year}_{safe_gp_key(event_name)}",
            "has_sprint":   has_sprint,
            "weekend_start": weekend_start_str,
            "race_time":    race_time_str,
        })

    races.sort(key=lambda r: r["round"])
    return races


# ─── Standings Builder ────────────────────────────────────────────────────────

def build_standings(year, completed_sessions):
    """
    Aggregate driver and constructor standings from all completed race sessions.
    """
    drivers = {}
    constructors = {}

    for round_number, sessions in sorted(completed_sessions.items()):
        # Snapshot cumulative points BEFORE this round's sessions, so we can diff after —
        # gives "points gained in the most recent race" (Race + Sprint combined, if any)
        # for the standings pages. Re-taken (and overwritten below) every round, so after
        # the full loop it reflects only the LATEST completed round, not some earlier one.
        driver_points_before = {abbr: d["points"] for abbr, d in drivers.items()}
        constructor_points_before = {team: c["points"] for team, c in constructors.items()}

        for session in sessions:
            if session is None or session.results.empty:
                continue

            # Identify if this is the main race (to correctly assign wins/podiums)
            is_main_race = (session.name == 'Race')
            results = session.results.copy()

            for _, row in results.iterrows():
                abbr      = str(row.get("Abbreviation", ""))
                full_name = str(row.get("FullName", abbr))
                number    = str(row.get("DriverNumber", ""))
                team      = str(row.get("TeamName", "Unknown"))
                color     = get_team_color(team)
                
                position  = row.get("Position")
                # USE THE OFFICIAL POINTS COLUMN — .get()'s default only covers a missing
                # key, not a present-but-NaN value (some rows, e.g. non-classified drivers
                # in irregular seasons like 2020, have Points == NaN), so guard explicitly.
                raw_pts   = row.get("Points", 0.0)
                race_pts  = float(raw_pts) if pd.notna(raw_pts) else 0.0

                finished  = pd.notna(position)
                pos_int   = int(position) if finished else 99

                # DNF must be read from ClassifiedPosition, NOT Position — Position is
                # always numeric (FastF1 orders retirees by laps completed), even for a
                # driver who retired or didn't start. ClassifiedPosition is the one that
                # stays a letter code ('R' retired, 'W' withdrawn/DNS, 'D' disqualified,
                # 'N' not classified) for a non-finish, and a plain digit string ('7',
                # 'R'-turned-'23', etc.) for anyone actually classified — including drivers
                # who finished laps down, which Status sometimes mislabels as "Lapped" even
                # when ClassifiedPosition says 'R' (seen on 2026 Australian GP data).
                classified   = row.get("ClassifiedPosition")
                classified_s = str(classified).strip() if pd.notna(classified) else ""
                did_not_finish = not classified_s.isdigit()

                # ── Driver accumulation ──
                if abbr not in drivers:
                    drivers[abbr] = {
                        "abbreviation": abbr,
                        "name":         full_name,
                        "number":       number,
                        "team":         team,
                        "team_color":   color,
                        "image_url":    get_driver_image(full_name),
                        "points":       0.0,
                        "wins":         0,
                        "podiums":      0,
                        "dnfs":         0,
                        "points_last_race": 0.0,
                    }

                drivers[abbr]["points"]  += race_pts
                drivers[abbr]["team"]     = team
                drivers[abbr]["team_color"] = color

                # Only add stats for the main Grand Prix, not the Sprint
                if is_main_race:
                    if finished:
                        if pos_int == 1:
                            drivers[abbr]["wins"]    += 1
                        if pos_int <= 3:
                            drivers[abbr]["podiums"] += 1
                    if did_not_finish:
                        drivers[abbr]["dnfs"] += 1

                # ── Constructor accumulation ──
                if team not in constructors:
                    constructors[team] = {
                        "name":    team,
                        "color":   color,
                        "points":  0.0,
                        "wins":    0,
                        "podiums": 0,
                        "points_last_race": 0.0,
                    }

                constructors[team]["points"] += race_pts

                if is_main_race and finished:
                    if pos_int == 1:
                        constructors[team]["wins"]    += 1
                    if pos_int <= 3:
                        constructors[team]["podiums"] += 1

        # After this round's sessions are all processed: diff against the pre-round
        # snapshot so points_last_race reflects THIS round for everyone (including 0 for
        # anyone who didn't score, or wasn't even entered yet before their debut round) —
        # overwritten every round, so only the final (most recent) round's value survives.
        for abbr, d in drivers.items():
            d["points_last_race"] = d["points"] - driver_points_before.get(abbr, 0.0)
        for team, c in constructors.items():
            c["points_last_race"] = c["points"] - constructor_points_before.get(team, 0.0)

    # ── Sort and assign positions ──
    driver_list = sorted(drivers.values(), key=lambda d: d["points"], reverse=True)
    for i, d in enumerate(driver_list):
        d["position"] = i + 1

    constructor_list = sorted(constructors.values(), key=lambda c: c["points"], reverse=True)
    for i, c in enumerate(constructor_list):
        c["position"] = i + 1

    return driver_list, constructor_list

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    year = args.year

    print(f"Generating season data for {year}...")
    print(f"Cache dir:  {args.cache_dir}")
    print(f"Output dir: {args.output_dir}")

    # Setup FastF1 cache
    os.makedirs(args.cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(args.cache_dir)

    # Get full season schedule
    print(f"\nFetching {year} season schedule...")
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
    except Exception as e:
        print(f"Failed to fetch schedule: {e}")
        return

    total_rounds = len(schedule)
    print(f"Found {total_rounds} rounds in {year} season.")

    # Determine which rounds are completed (race date has passed)
    today = datetime.now(timezone.utc)
    completed_rounds = []
    for _, event in schedule.iterrows():
        round_number = int(event.get("RoundNumber", 0))
        if round_number == 0:
            continue
        status = determine_race_status(event, today)
        if status == "completed":
            completed_rounds.append(round_number)

    print(f"Completed rounds to load: {completed_rounds}")

    # Load completed sessions
    completed_sessions = {}
    for round_number in completed_rounds:
        print(f"  Loading round {round_number}...")
        session = load_point_awarding_sessions(year, round_number, args.cache_dir)
        completed_sessions[round_number] = session

    # ── Build Calendar ──
    print("\nBuilding calendar...")
    calendar_races = build_calendar(year, schedule, completed_sessions, args.cache_dir)
    print(f"  {len(calendar_races)} races in calendar.")

    # ── Build Standings ──
    print("\nAggregating standings...")
    driver_standings, constructor_standings = build_standings(year, completed_sessions)
    print(f"  {len(driver_standings)} drivers, {len(constructor_standings)} constructors.")

    # ── Assemble output objects ──
    calendar_output = {
        "meta": {
            "year":          year,
            "total_rounds":  total_rounds,
            "generated_at":  datetime.now(timezone.utc).isoformat(),
        },
        "races": calendar_races,
    }

    standings_output = {
        "meta": {
            "year":         year,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "rounds_counted": len([r for r in completed_rounds if completed_sessions.get(r) is not None]),
        },
        "drivers":       driver_standings,
        "constructors":  constructor_standings,
    }

    # ── Write output files ──
    out_dir = os.path.join(args.output_dir, "season", str(year))
    os.makedirs(out_dir, exist_ok=True)

    calendar_path  = os.path.join(out_dir, "calendar.json")
    standings_path = os.path.join(out_dir, "standings.json")

    with open(calendar_path, "w") as f:
        json.dump(calendar_output, f, indent=2)
    print(f"\nCalendar  → {calendar_path}")

    with open(standings_path, "w") as f:
        json.dump(standings_output, f, indent=2)
    print(f"Standings → {standings_path}")

    print(f"\nDone. Run with --year {year} again after each race weekend to refresh.")


if __name__ == "__main__":
    main()

    
# """
# Grid-Lock: Season Data Generator
# ==================================
# Generates two JSON files for the dashboard/standings/calendar pages:

#   standings.json  — driver + constructor standings (aggregated from race results)
#   calendar.json   — full season race calendar with results, winner, status

# Output path:
#   {output_dir}/season/{year}/standings.json
#   {output_dir}/season/{year}/calendar.json

# Usage:
#   python generate_season_data.py --year 2024
#   python generate_season_data.py --year 2021 --cache-dir fastf1_cache --output-dir ../backend/src/cache

# Notes:
#   - FastF1 has no direct standings endpoint, so we load each race's
#     session.results and aggregate points manually using the standard
#     F1 points system (25-18-15-12-10-8-6-4-2-1 + 1 for fastest lap).
#   - Only "completed" rounds are aggregated. Future/cancelled rounds
#     appear in calendar.json but are skipped for standings.
#   - Re-run this script after each race weekend to refresh data.
# """

# import argparse
# import os
# import json
# from datetime import datetime, timezone

# import fastf1
# import pandas as pd
# import numpy as np


# # ─── Constants ────────────────────────────────────────────────────────────────

# POINTS_MAP = {
#     1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
#     6: 8,  7: 6,  8: 4,  9: 2,  10: 1,
# }
# FASTEST_LAP_POINT = 1  # awarded only if driver finishes in top 10

# # Official F1 team colours (hex, no #) — used for UI accent colours
# TEAM_COLORS = {
#     "Mercedes":         "00D2BE",
#     "Red Bull Racing":  "3671C6",
#     "Ferrari":          "E8002D",
#     "McLaren":          "FF8000",
#     "Aston Martin":     "358C75",
#     "Alpine":           "0093CC",
#     "Williams":         "64C4FF",
#     "RB":               "6692FF",
#     "Kick Sauber":      "52E252",
#     "Haas F1 Team":     "B6BABD",
#     # Legacy names (older seasons)
#     "AlphaTauri":       "5E8FAA",
#     "Alfa Romeo":       "C92D4B",
#     "Racing Point":     "F596C8",
#     "Renault":          "FFF500",
#     "Toro Rosso":       "469BFF",
#     "Force India":      "F596C8",
#     "Sauber":           "9B0000",
#     "Manor Marussia":   "6E0000",
#     "Lotus F1":         "FFB800",
#     "Marussia":         "6E0000",
#     "HRT":              "999999",
#     "Caterham":         "005030",
# }

# # Circuit images — Wikipedia commons / reliable static URLs
# # Add more as needed; key matches event["EventName"] lowercased + underscored
# CIRCUIT_IMAGES = {
#     "bahrain_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Bahrain_International_Circuit%2C_2021.jpg/1280px-Bahrain_International_Circuit%2C_2021.jpg",
#     "saudi_arabian_grand_prix":     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Jeddah_street_circuit_2021.jpg/1280px-Jeddah_street_circuit_2021.jpg",
#     "australian_grand_prix":        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Albert_Park_Circuit_2022.jpg/1280px-Albert_Park_Circuit_2022.jpg",
#     "japanese_grand_prix":          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Suzuka_circuit_2005.jpg/1280px-Suzuka_circuit_2005.jpg",
#     "chinese_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Shanghai_International_Circuit.jpg/1280px-Shanghai_International_Circuit.jpg",
#     "miami_grand_prix":             "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Miami_International_Autodrome_2022.jpg/1280px-Miami_International_Autodrome_2022.jpg",
#     "emilia_romagna_grand_prix":    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Autodromo_Enzo_e_Dino_Ferrari.jpg/1280px-Autodromo_Enzo_e_Dino_Ferrari.jpg",
#     "monaco_grand_prix":            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Monte_Carlo_Formula_1_track_2022.jpg/1280px-Monte_Carlo_Formula_1_track_2022.jpg",
#     "canadian_grand_prix":          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Circuit_Gilles_Villeneuve_2017.jpg/1280px-Circuit_Gilles_Villeneuve_2017.jpg",
#     "spanish_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Circuit_de_Catalunya_2022.jpg/1280px-Circuit_de_Catalunya_2022.jpg",
#     "austrian_grand_prix":          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/RedBullRing.jpg/1280px-RedBullRing.jpg",
#     "british_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Silverstone_Circuit_2020.jpg/1280px-Silverstone_Circuit_2020.jpg",
#     "hungarian_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Hungaroring.jpg/1280px-Hungaroring.jpg",
#     "belgian_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Spa-Francorchamps_2022.jpg/1280px-Spa-Francorchamps_2022.jpg",
#     "dutch_grand_prix":             "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zandvoort_racing_circuit.jpg/1280px-Zandvoort_racing_circuit.jpg",
#     "italian_grand_prix":           "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Autodromo_Nazionale_Monza_1.jpg/1280px-Autodromo_Nazionale_Monza_1.jpg",
#     "azerbaijan_grand_prix":        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Baku_City_Circuit_2022.jpg/1280px-Baku_City_Circuit_2022.jpg",
#     "singapore_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Marina_Bay_Street_Circuit_2022.jpg/1280px-Marina_Bay_Street_Circuit_2022.jpg",
#     "united_states_grand_prix":     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Circuit_of_the_Americas_from_the_air.jpg/1280px-Circuit_of_the_Americas_from_the_air.jpg",
#     "mexico_city_grand_prix":       "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Autodromo_Hermanos_Rodriguez_2015.jpg/1280px-Autodromo_Hermanos_Rodriguez_2015.jpg",
#     "são_paulo_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Autodromo_Jose_Carlos_Pace.jpg/1280px-Autodromo_Jose_Carlos_Pace.jpg",
#     "las_vegas_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Las_Vegas_Strip_Circuit.jpg/1280px-Las_Vegas_Strip_Circuit.jpg",
#     "qatar_grand_prix":             "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Losail_International_Circuit.jpg/1280px-Losail_International_Circuit.jpg",
#     "abu_dhabi_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Yas_Marina_Circuit_2021.jpg/1280px-Yas_Marina_Circuit_2021.jpg",
#     # Aliases / alternate names
#     "barcelona_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Circuit_de_Catalunya_2022.jpg/1280px-Circuit_de_Catalunya_2022.jpg",
#     "sao_paulo_grand_prix":         "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Autodromo_Jose_Carlos_Pace.jpg/1280px-Autodromo_Jose_Carlos_Pace.jpg",
#     "british_grand_prix_2021":      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Silverstone_Circuit_2020.jpg/1280px-Silverstone_Circuit_2020.jpg",
# }


# # ─── Argument Parsing ─────────────────────────────────────────────────────────

# def parse_args():
#     p = argparse.ArgumentParser(description="Generate GridLock season standings + calendar JSON")
#     p.add_argument("--year",       type=int, required=True,                 help="F1 season year e.g. 2024")
#     p.add_argument("--cache-dir",  type=str, default="fastf1_cache",        help="FastF1 cache directory")
#     p.add_argument("--output-dir", type=str, default="../backend/src/cache", help="Root cache output dir")
#     return p.parse_args()


# # ─── Helpers ──────────────────────────────────────────────────────────────────

# def safe_gp_key(event_name: str) -> str:
#     """Convert event name to slug key matching CIRCUIT_IMAGES map."""
#     return event_name.lower().replace(" ", "_")


# def get_team_color(team_name: str) -> str:
#     """Return hex color for a team, fallback to grey."""
#     return TEAM_COLORS.get(team_name, "808080")


# def get_circuit_image(event_name: str) -> str:
#     """Return image URL for circuit, fallback to empty string."""
#     key = safe_gp_key(event_name)
#     return CIRCUIT_IMAGES.get(key, "")


# def points_for_position(pos, fastest_lap=False, in_top_10=False) -> int:
#     """Calculate F1 points for a finishing position."""
#     pts = POINTS_MAP.get(int(pos), 0)
#     if fastest_lap and in_top_10:
#         pts += FASTEST_LAP_POINT
#     return pts


# def determine_race_status(event, today: datetime) -> str:
#     """
#     Determine race card status:
#       'completed'  — race weekend has passed
#       'upcoming'   — race weekend in the future
#       'ongoing'    — race weekend is this weekend
#       'cancelled'  — event is cancelled (no FastF1 data / marked cancelled)
#     """
#     race_date = event.get("EventDate")
#     if race_date is None:
#         return "upcoming"

#     if hasattr(race_date, "to_pydatetime"):
#         race_date = race_date.to_pydatetime()

#     if race_date.tzinfo is None:
#         race_date = race_date.replace(tzinfo=timezone.utc)

#     today_utc = today.replace(tzinfo=timezone.utc) if today.tzinfo is None else today
#     delta_days = (race_date.date() - today_utc.date()).days

#     if delta_days < -3:
#         return "completed"
#     elif -3 <= delta_days <= 3:
#         return "ongoing"
#     else:
#         return "upcoming"


# # ─── Session Loading ───────────────────────────────────────────────────────────

# def load_race_session(year, gp_round, cache_dir):
#     """
#     Load a race session for a given round number.
#     Returns None if session cannot be loaded (future race / no data).
#     """
#     try:
#         session = fastf1.get_session(year, gp_round, "R")
#         session.load(telemetry=False, laps=True, weather=False)
#         return session
#     except Exception as e:
#         print(f"    Could not load round {gp_round}: {e}")
#         return None


# # ─── Calendar Builder ─────────────────────────────────────────────────────────

# def build_calendar(year, schedule, completed_sessions, cache_dir):
#     """
#     Build calendar.json data from the season schedule.
#     completed_sessions: dict { round_number: session }
#     """
#     today = datetime.now(timezone.utc)
#     races = []

#     for _, event in schedule.iterrows():
#         round_number = int(event.get("RoundNumber", 0))
#         if round_number == 0:
#             continue  # testing/pre-season

#         event_name = str(event.get("EventName", ""))
#         circuit    = str(event.get("Location", ""))
#         country    = str(event.get("Country", ""))

#         race_date = event.get("EventDate")
#         if hasattr(race_date, "to_pydatetime"):
#             race_date = race_date.to_pydatetime()
#         date_str = race_date.strftime("%Y-%m-%d") if race_date else ""

#         status = determine_race_status(event, today)

#         # Pull winner from session results if completed
#         winner_name = None
#         winner_team = None
#         session = completed_sessions.get(round_number)

#         if session is not None and not session.results.empty:
#             try:
#                 res = session.results.sort_values("Position")
#                 top = res.iloc[0]
#                 winner_name = str(top.get("FullName", top.get("Abbreviation", "")))
#                 winner_team = str(top.get("TeamName", ""))
#             except Exception:
#                 pass

#         races.append({
#             "round":        round_number,
#             "name":         event_name,
#             "circuit":      circuit,
#             "country":      country,
#             "date":         date_str,
#             "status":       status,
#             "winner":       winner_name,
#             "winner_team":  winner_team,
#             "image_url":    get_circuit_image(event_name),
#             "race_id":      f"{year}_{safe_gp_key(event_name)}",
#         })

#     races.sort(key=lambda r: r["round"])
#     return races


# # ─── Standings Builder ────────────────────────────────────────────────────────

# def build_standings(year, completed_sessions):
#     """
#     Aggregate driver and constructor standings from all completed race sessions.
#     Returns (driver_standings, constructor_standings) as sorted lists.
#     """

#     # Accumulator dicts
#     # driver key: abbreviation
#     drivers = {}     # abbr -> { name, number, team, team_color, points, wins, podiums }
#     constructors = {}  # team_name -> { points, wins, podiums, color }

#     for round_number, session in sorted(completed_sessions.items()):
#         if session is None or session.results.empty:
#             continue

#         results = session.results.copy()

#         # Find fastest lap holder
#         fastest_lap_abbr = None
#         try:
#             laps = session.laps
#             if not laps.empty:
#                 fastest = laps.pick_fastest()
#                 if fastest is not None:
#                     fastest_lap_abbr = fastest["Driver"]
#         except Exception:
#             pass

#         for _, row in results.iterrows():
#             abbr      = str(row.get("Abbreviation", ""))
#             full_name = str(row.get("FullName", abbr))
#             number    = str(row.get("DriverNumber", ""))
#             team      = str(row.get("TeamName", "Unknown"))
#             color     = get_team_color(team)

#             position  = row.get("Position")
#             status    = str(row.get("Status", ""))

#             finished  = pd.notna(position)
#             pos_int   = int(position) if finished else 99

#             has_fastest = (abbr == fastest_lap_abbr)
#             in_top_10   = pos_int <= 10

#             race_pts = points_for_position(pos_int, has_fastest, in_top_10) if finished else 0

#             # ── Driver accumulation ──
#             if abbr not in drivers:
#                 drivers[abbr] = {
#                     "abbreviation": abbr,
#                     "name":         full_name,
#                     "number":       number,
#                     "team":         team,
#                     "team_color":   color,
#                     "points":       0,
#                     "wins":         0,
#                     "podiums":      0,
#                     "dnfs":         0,
#                 }

#             drivers[abbr]["points"]  += race_pts
#             drivers[abbr]["team"]     = team       # keep most recent team (for mid-season moves)
#             drivers[abbr]["team_color"] = color

#             if finished:
#                 if pos_int == 1:
#                     drivers[abbr]["wins"]    += 1
#                 if pos_int <= 3:
#                     drivers[abbr]["podiums"] += 1
#             else:
#                 drivers[abbr]["dnfs"] += 1

#             # ── Constructor accumulation ──
#             if team not in constructors:
#                 constructors[team] = {
#                     "name":    team,
#                     "color":   color,
#                     "points":  0,
#                     "wins":    0,
#                     "podiums": 0,
#                 }

#             constructors[team]["points"] += race_pts

#             if finished:
#                 if pos_int == 1:
#                     constructors[team]["wins"]    += 1
#                 if pos_int <= 3:
#                     constructors[team]["podiums"] += 1

#     # ── Sort and assign positions ──
#     driver_list = sorted(drivers.values(), key=lambda d: d["points"], reverse=True)
#     for i, d in enumerate(driver_list):
#         d["position"] = i + 1

#     constructor_list = sorted(constructors.values(), key=lambda c: c["points"], reverse=True)
#     for i, c in enumerate(constructor_list):
#         c["position"] = i + 1

#     return driver_list, constructor_list


# # ─── Main ─────────────────────────────────────────────────────────────────────

# def main():
#     args = parse_args()
#     year = args.year

#     print(f"Generating season data for {year}...")
#     print(f"Cache dir:  {args.cache_dir}")
#     print(f"Output dir: {args.output_dir}")

#     # Setup FastF1 cache
#     os.makedirs(args.cache_dir, exist_ok=True)
#     fastf1.Cache.enable_cache(args.cache_dir)

#     # Get full season schedule
#     print(f"\nFetching {year} season schedule...")
#     try:
#         schedule = fastf1.get_event_schedule(year, include_testing=False)
#     except Exception as e:
#         print(f"Failed to fetch schedule: {e}")
#         return

#     total_rounds = len(schedule)
#     print(f"Found {total_rounds} rounds in {year} season.")

#     # Determine which rounds are completed (race date has passed)
#     today = datetime.now(timezone.utc)
#     completed_rounds = []
#     for _, event in schedule.iterrows():
#         round_number = int(event.get("RoundNumber", 0))
#         if round_number == 0:
#             continue
#         status = determine_race_status(event, today)
#         if status == "completed":
#             completed_rounds.append(round_number)

#     print(f"Completed rounds to load: {completed_rounds}")

#     # Load completed sessions
#     completed_sessions = {}
#     for round_number in completed_rounds:
#         print(f"  Loading round {round_number}...")
#         session = load_race_session(year, round_number, args.cache_dir)
#         completed_sessions[round_number] = session

#     # ── Build Calendar ──
#     print("\nBuilding calendar...")
#     calendar_races = build_calendar(year, schedule, completed_sessions, args.cache_dir)
#     print(f"  {len(calendar_races)} races in calendar.")

#     # ── Build Standings ──
#     print("\nAggregating standings...")
#     driver_standings, constructor_standings = build_standings(year, completed_sessions)
#     print(f"  {len(driver_standings)} drivers, {len(constructor_standings)} constructors.")

#     # ── Assemble output objects ──
#     calendar_output = {
#         "meta": {
#             "year":          year,
#             "total_rounds":  total_rounds,
#             "generated_at":  datetime.now(timezone.utc).isoformat(),
#         },
#         "races": calendar_races,
#     }

#     standings_output = {
#         "meta": {
#             "year":         year,
#             "generated_at": datetime.now(timezone.utc).isoformat(),
#             "rounds_counted": len([r for r in completed_rounds if completed_sessions.get(r) is not None]),
#         },
#         "drivers":       driver_standings,
#         "constructors":  constructor_standings,
#     }

#     # ── Write output files ──
#     out_dir = os.path.join(args.output_dir, "season", str(year))
#     os.makedirs(out_dir, exist_ok=True)

#     calendar_path  = os.path.join(out_dir, "calendar.json")
#     standings_path = os.path.join(out_dir, "standings.json")

#     with open(calendar_path, "w") as f:
#         json.dump(calendar_output, f, indent=2)
#     print(f"\nCalendar  → {calendar_path}")

#     with open(standings_path, "w") as f:
#         json.dump(standings_output, f, indent=2)
#     print(f"Standings → {standings_path}")

#     print(f"\nDone. Run with --year {year} again after each race weekend to refresh.")


# if __name__ == "__main__":
#     main()