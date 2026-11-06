#!/usr/bin/env python3
"""Builds lms/index.json: courses.json, every year.json and every sessions.json merged into one file,
plus the list of readings.md files that have something in them.

The site reads this one file instead of about fifteen, so pages open after one request.
You never edit index.json. It is rebuilt:
  - by the git hook lms/tools/hooks/pre-commit, on every commit from this computer;
  - by the GitHub Action .github/workflows/lms-index.yml, after every push (this covers edits made on github.com).
Run it by hand any time:  python3 lms/tools/build_index.py

If index.json is missing or broken, the site falls back to reading the separate files."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # the lms folder
OUT = ROOT / "index.json"
VERSION = 1

def read_json(path):
    """A missing or broken file gives None, as the site does."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None

def has_content(path):
    """The same test the site uses: anything left after removing <!-- --> comments."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return False
    return re.sub(r"<!--[\s\S]*?(-->|$)", "", text).strip() != ""

def build():
    raw = read_json(ROOT / "courses.json")
    if not isinstance(raw, dict):
        raise SystemExit("courses.json is missing or not valid JSON; index.json not built.")
    ids = [y if isinstance(y, str) else y.get("id") for y in raw.get("years", [])]
    years, files = [], {}
    for yid in ids:
        y = read_json(ROOT / "content" / yid / "year.json")
        if isinstance(y, dict):
            years.append({**y, "id": yid})
        else:
            years.append({"id": yid, "missing": True, "courses": []})
    for y in years:
        for cid in y.get("courses", []):
            files[f'{y["id"]}/{cid}'] = read_json(ROOT / "content" / y["id"] / cid / "sessions.json")
    readings = sorted(p.relative_to(ROOT).as_posix()
                      for p in (ROOT / "content").rglob("readings.md") if has_content(p))
    return {
        "_note": "Made by tools/build_index.py. Do not edit: change courses.json, year.json or sessions.json instead.",
        "version": VERSION, "raw": raw, "years": years, "files": files, "readings": readings,
    }

def main():
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    old = OUT.read_text(encoding="utf-8") if OUT.exists() else None
    if text != old:
        OUT.write_text(text, encoding="utf-8")
        print("index.json rebuilt")
    return 0

if __name__ == "__main__":
    sys.exit(main())
