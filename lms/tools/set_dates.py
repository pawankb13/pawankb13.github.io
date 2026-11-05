#!/usr/bin/env python3
"""Sets each session's "updated" date in courses.json from git history:
the date of the last commit that touched that session's folder (slides, images or interactives).
Runs automatically on GitHub (see .github-workflow/update-dates.yml). You can also run it by hand."""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "courses.json"

def last_commit_date(folder: Path):
    r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(folder)],
                       cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() or None

def main():
    d = json.loads(DATA.read_text(encoding="utf-8"))
    changed = 0
    for c in d["courses"]:
        for y in c["years"]:
            for k in y.get("decks", []):
                if k["file"].lower().endswith((".html", ".htm")):
                    folder = (ROOT / k["file"])
                else:
                    folder = (ROOT / k["file"]).parent
                day = last_commit_date(folder)
                if day and k.get("updated") != day:
                    k["updated"] = day
                    changed += 1
    if changed:
        DATA.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Dates changed: {changed}")

if __name__ == "__main__":
    sys.exit(main())
