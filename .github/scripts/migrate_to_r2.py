"""Copy generated GridLock artifacts from the gridlock-data repo into Cloudflare R2.

Only moves *finished* output — the per-race JSON the frontend actually reads. FastF1's
raw cache is deliberately not touched: it is an input to generation, never served, and
it is several gigabytes.

R2 speaks the S3 API, so this is plain boto3 pointed at an R2 endpoint.

Env (supplied by the workflow from repo secrets):
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
    SOURCE_DIR  — checkout of gridlock-data
    ONLY        — optional comma-separated key prefixes, e.g.
                  "2026/belgian_grand_prix/R" for one session, or
                  "season,session_results" for the small aggregates the hourly sync
                  refreshes. Blank uploads everything.
    DRY_RUN     — "true" to list what would upload without writing anything
"""

import json
import os
import sys
from pathlib import Path

# Matches the freshness strategy already used for these files on the backend: short
# enough that a regenerated race appears quickly, long enough to be worth caching.
CACHE_CONTROL = "public, max-age=300"

# A session is only advertised as available once all four exist. This is the same
# completeness rule the backend's cache-hit check uses, so R2 and the API agree on what
# "ready" means rather than each having their own opinion.
REQUIRED_SESSION_FILES = ("drivers/index.json", "track.json", "laps.json", "conditions.json")

SKIP_NAMES = {".DS_Store", ".gitignore", ".gitkeep"}
SKIP_DIRS = {".git"}


def r2_client():
    # Imported here rather than at module scope so a DRY_RUN can be executed anywhere
    # boto3 isn't installed — useful for checking the file-collection logic locally
    # before spending a workflow run on it.
    import boto3
    from botocore.config import Config

    account = os.environ["R2_ACCOUNT_ID"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        # R2 ignores regions but the S3 client insists on one being set.
        region_name="auto",
        config=Config(retries={"max_attempts": 5, "mode": "standard"}),
    )


def collect_files(source: Path, only: list[str] | None):
    """Every file to upload, as (local_path, r2_key) pairs."""
    out = []
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_NAMES:
            continue
        key = path.relative_to(source).as_posix()
        if only and not any(key.startswith(p) for p in only):
            continue
        out.append((path, key))
    return out


def find_complete_sessions(source: Path):
    """Sessions with the full analysis set, as {year, gp, session} records.

    Written to races-index.json because a browser cannot list a bucket — this replaces
    the backend's /api/races/list, which builds the same thing by walking directories.
    """
    races = []
    for year_dir in sorted(source.iterdir()):
        # Only year directories hold races; season/ and session_results/ are separate.
        if not year_dir.is_dir() or not year_dir.name.isdigit():
            continue
        for gp_dir in sorted(year_dir.iterdir()):
            if not gp_dir.is_dir():
                continue
            for session_dir in sorted(gp_dir.iterdir()):
                if not session_dir.is_dir():
                    continue
                if all((session_dir / f).exists() for f in REQUIRED_SESSION_FILES):
                    races.append({
                        "year": year_dir.name,
                        "gp": gp_dir.name,
                        "session": session_dir.name,
                    })
    return races


def main():
    source = Path(os.environ.get("SOURCE_DIR", "gridlock-data")).resolve()
    only = [p.strip() for p in os.environ.get("ONLY", "").split(",") if p.strip()] or None
    dry_run = os.environ.get("DRY_RUN", "").lower() == "true"
    bucket = os.environ["R2_BUCKET_NAME"]

    if not source.is_dir():
        sys.exit(f"Source directory not found: {source}")

    files = collect_files(source, only)
    races = find_complete_sessions(source)

    print(f"Source:  {source}")
    print(f"Bucket:  {bucket}")
    print(f"Filter:  {', '.join(only) if only else '(everything)'}")
    print(f"Files:   {len(files)}")
    print(f"Complete sessions found: {len(races)}")
    if dry_run:
        for _, key in files[:20]:
            print(f"  would upload  {key}")
        if len(files) > 20:
            print(f"  ... and {len(files) - 20} more")
        print("\nDRY RUN — nothing uploaded.")
        return

    if not files:
        sys.exit("Nothing matched the filter — check the ONLY prefix.")

    client = r2_client()
    uploaded = failed = 0

    for i, (path, key) in enumerate(files, 1):
        try:
            client.upload_file(
                str(path), bucket, key,
                ExtraArgs={"ContentType": "application/json", "CacheControl": CACHE_CONTROL},
            )
            uploaded += 1
        except Exception as e:
            failed += 1
            print(f"  FAILED {key}: {type(e).__name__}: {e}", flush=True)
        if i % 50 == 0 or i == len(files):
            print(f"  {i}/{len(files)} ({uploaded} ok, {failed} failed)", flush=True)

    # The index is written last, and only on a clean run: it advertises what is
    # available, so publishing it after a partial upload would point the frontend at
    # sessions whose files never made it. Skipped entirely for a filtered run, which
    # by definition only has part of the picture.
    if only:
        print("\nFiltered run — races-index.json left untouched.")
    elif failed:
        print(f"\n{failed} upload(s) failed — races-index.json NOT written.")
    else:
        index = {"success": True, "count": len(races), "races": races}
        client.put_object(
            Bucket=bucket, Key="races-index.json",
            Body=json.dumps(index).encode(),
            ContentType="application/json", CacheControl=CACHE_CONTROL,
        )
        print(f"\nWrote races-index.json ({len(races)} sessions).")

    print(f"\nDone: {uploaded} uploaded, {failed} failed.")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
