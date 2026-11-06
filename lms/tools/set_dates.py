#!/usr/bin/env python3
"""Writes dates.json: for each session in courses.json, the date of the last commit that touched
that session's folder (slides, images, interactives or readings).
Runs automatically on GitHub (see .github/workflows/update-dates.yml at the repository root).
You can also run it by hand, in the lms folder:

    python tools/set_dates.py           write dates.json
    python tools/set_dates.py --check   only show what would change

courses.json is only read, never changed. dates.json is not meant to be edited by hand."""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "courses.json"
DATES = ROOT / "dates.json"

def last_commit_date(folder: Path):
    r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(folder)],
                       cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() or None

def main():
    check = "--check" in sys.argv[1:]
    d = json.loads(DATA.read_text(encoding="utf-8"))
    old = json.loads(DATES.read_text(encoding="utf-8")) if DATES.exists() else {}
    decks = [k for c in d.get("courses", []) for y in c.get("years", []) for k in y.get("decks", [])]
    decks += d.get("templates", {}).get("decks", [])
    new = {}
    for k in decks:
        file = k["file"]
        path = ROOT / file
        folder = path if file.lower().endswith((".html", ".htm")) else path.parent
        # No commit yet (a brand-new folder): keep the date it had, or the one typed in courses.json.
        day = last_commit_date(folder) or old.get(file) or k.get("updated")
        if day:
            new[file] = day
    for file in sorted(set(old) | set(new)):
        if old.get(file) != new.get(file):
            print(f'{file}: {old.get(file, "none")} -> {new.get(file, "removed")}')
    changed = new != old
    if changed and not check:
        DATES.write_text(json.dumps(new, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("dates.json " + ("would change" if check and changed else "changed" if changed else "is up to date"))

if __name__ == "__main__":
    sys.exit(main())
