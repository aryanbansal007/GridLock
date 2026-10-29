"""
Index of the FIA stewards' documents for each race weekend (decisions, infringements, summons,
classifications, ...), from fia.com's public decision-documents pages.

Only the index is stored: the title, publication time and the link to the official PDF on
fia.com, plus the car number and the kind of document read from its title. The documents
themselves stay on the FIA's site and are linked, not copied.

    python fia_documents.py --year 2026 --data ../gridlock-data

Writes <data>/<year>/<gp_slug>/documents.json for every completed race. Run it from your own
machine, and again after a race weekend: the stewards publish documents for a few hours after
the flag.
"""
import argparse
import html
import json
import os
import re
import time
import urllib.parse
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import requests

BASE = "https://www.fia.com"
SEASON_PAGE = {2026: "/documents/championships/fia-formula-one-world-championship-14/season/season-2026-2072"}
# Calendar names the FIA spells differently.
FIA_NAMES = {"Barcelona Grand Prix": "Barcelona-Catalunya Grand Prix"}
HEADERS = {"User-Agent": "Mozilla/5.0 (GridLock data script)"}

ROW_RE = re.compile(r'<li class="document-row.*?</li>', re.S)
HREF_RE = re.compile(r'href="(/system/files/decision-document/[^"]+\.pdf)"')
# Two page layouts exist: older documents wrap the title in field markup, newer ones put the
# text straight inside <div class="title">.
TITLE_RES = (
    re.compile(r'field-name-title-field.*?<div class="field-item even">(.*?)</div>', re.S),
    re.compile(r'<div class="title">(.*?)</div>', re.S),
)
DATE_RE = re.compile(r"Published on <span[^>]*>([^<]+)</span>\s*([A-Z]+)")
CAR_RE = re.compile(r"\bcars?\s*(\d+)(?:\s*(?:and|&|,)\s*(?:car\s*)?(\d+))?", re.I)


def classify(title):
    t = title.lower()
    if re.search(r"\bsummons\b", t):
        return "summons"
    if re.search(r"\bdecision\b", t):
        return "decision"
    if re.search(r"\binfringement\b", t):
        return "infringement"
    if re.search(r"hearing|adjourn|right of review|appeal", t):
        return "hearing"
    if re.search(r"classification|starting grid|championship points|qualifying sc|sc2", t):
        return "results"
    return "notice"


SESSION_NAMES = {"FP1": "Practice 1", "FP2": "Practice 2", "FP3": "Practice 3",
                 "SQ": "Sprint Qualifying", "S": "Sprint", "Q": "Qualifying", "R": "Race"}
# The FIA stamps documents in Paris time (labelled CET all year).
FIA_TZ = ZoneInfo("Europe/Paris")
PUBLISHED_RE = re.compile(r"(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})")


def published_utc(text):
    m = PUBLISHED_RE.search(text or "")
    if not m:
        return None
    d, mo, y, h, mi = (int(x) for x in m.groups())
    return datetime(2000 + y, mo, d, h, mi, tzinfo=FIA_TZ).astimezone(timezone.utc)


def title_session(title):
    """A session named in the title wins over the publication time."""
    t = title.lower()
    for pat, code in ((r"sprint qualifying|sprint shootout", "SQ"), (r"free practice 1|practice 1|\bfp1\b", "FP1"),
                      (r"free practice 2|practice 2|\bfp2\b", "FP2"), (r"free practice 3|practice 3|\bfp3\b", "FP3"),
                      (r"\bsprint\b", "S"), (r"qualifying", "Q"), (r"\brace\b(?! director)|starting grid|post-race", "R")):
        if re.search(pat, t):
            return code
    return None


def assign_sessions(docs, starts):
    """Tag each document with the session it belongs to: named in the title, else the session
    that was last under way when it was published ("weekend" before the first session)."""
    order = sorted(starts.items(), key=lambda kv: kv[1])
    for d in docs:
        code = title_session(d["title"])
        if not code:
            when = published_utc(d.get("published"))
            code = "weekend"
            if when:
                for c, start in order:
                    if start <= when:
                        code = c
        if code not in starts and code != "weekend":
            code = "weekend"
        d["session"] = code
    return docs


def parse_event(page):
    docs = []
    for row in ROW_RE.findall(page):
        href = HREF_RE.search(row)
        title = next((m for m in (r.search(row) for r in TITLE_RES) if m and re.sub(r"<[^>]+>", "", m.group(1)).strip()), None)
        if not href or not title:
            continue
        title_text = html.unescape(re.sub(r"<[^>]+>", "", title.group(1))).strip()
        date = DATE_RE.search(row)
        number = re.match(r"Doc\s*(\d+)\s*-\s*(.*)", title_text, re.I)
        clean = number.group(2).strip() if number else title_text
        cars = []
        m = CAR_RE.search(clean)
        if m:
            cars = [int(c) for c in m.groups() if c]
        docs.append({
            "doc": int(number.group(1)) if number else None,
            "title": clean,
            "kind": classify(clean),
            "cars": cars,
            "published": f"{date.group(1).strip()} {date.group(2)}" if date else None,
            "url": BASE + urllib.parse.quote(href.group(1)),
        })
    docs.sort(key=lambda d: (d["doc"] is None, d["doc"] or 0))
    return docs


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, default=2026)
    p.add_argument("--data", default="../gridlock-data")
    p.add_argument("--only", default="", help="slug of a single race, e.g. italian_grand_prix")
    args = p.parse_args()

    season = requests.get(BASE + SEASON_PAGE[args.year], headers=HEADERS, timeout=60).text
    events = dict((html.unescape(n).strip(), urllib.parse.unquote(u)) for u, n in
                  re.findall(r'<option value="([^"]*/event/[^"]+)">([^<]+)</option>', season))
    print(f"{len(events)} events listed on fia.com")

    with open(os.path.join(args.data, "season", str(args.year), "calendar.json")) as f:
        races = [r for r in json.load(f)["races"] if r["status"] == "completed"]

    meetings = [m for m in sorted(requests.get("https://api.openf1.org/v1/meetings", params={"year": args.year}, timeout=60).json(),
                                  key=lambda m: m["date_start"]) if "Testing" not in m["meeting_name"]]
    # The two rounds cancelled this year still exist as OpenF1 meetings.
    meetings = [m for m in meetings if m["meeting_name"] != "Saudi Arabian Grand Prix"
                and not (m["meeting_name"] == "Bahrain Grand Prix" and m["date_start"] < "2026-04-30")]
    sessions = requests.get("https://api.openf1.org/v1/sessions", params={"year": args.year}, timeout=60).json()

    for race, meeting in zip(races, meetings):
        slug = race["name"].lower().replace(" ", "_")
        if args.only and slug != args.only:
            continue
        path = events.get(FIA_NAMES.get(race["name"], race["name"]))
        if not path:
            print("no FIA event named", race["name"])
            continue
        page = requests.get(BASE + urllib.parse.quote(path), headers=HEADERS, timeout=60).text
        starts = {}
        for code, name in SESSION_NAMES.items():
            found = [x for x in sessions if x["meeting_key"] == meeting["meeting_key"] and x["session_name"] == name]
            if found:
                starts[code] = datetime.fromisoformat(found[0]["date_start"]).astimezone(timezone.utc)
        docs = assign_sessions(parse_event(page), starts)
        out_dir = os.path.join(args.data, str(args.year), slug)
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "documents.json"), "w") as f:
            json.dump({"event": race["name"], "source": BASE + urllib.parse.quote(path), "documents": docs}, f)
        by_session = {}
        for d in docs:
            by_session[d["session"]] = by_session.get(d["session"], 0) + 1
        print(f"{slug}: {len(docs)} documents {by_session}", flush=True)
        time.sleep(1.0)


if __name__ == "__main__":
    main()
