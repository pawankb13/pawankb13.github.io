#!/usr/bin/env python3
"""Sets every session's "updated" date from git history: the date of the last commit that changed
a file in that session's folder (slides, images, interactives or readings). Folder moves do not count.

Day to day, dates are set at each commit by tools/hooks/pre-commit (see README). This script resets
all of them from history at once. Run it by hand in the lms folder:

    python tools/set_dates.py           change the dates
    python tools/set_dates.py --check   only show what would change

Only the date values change, in each course's sessions.json (and courses.json for Slide Templates)."""
import subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal import ROOT, all_sessions, write_date

def last_change(folder):
    """Newest date on which any file now in the folder was added or edited, following each file
    back across moves, so moving a year to the archive does not count as a change."""
    best = None
    for f in (ROOT / folder).rglob("*"):
        if f.is_file() and f.name != ".DS_Store":
            r = subprocess.run(["git", "log", "-1", "--follow", "-M100%", "--diff-filter=AM", "--format=%cs", "--", str(f)],
                               cwd=ROOT, capture_output=True, text=True)
            d = r.stdout.strip()
            if d and (best is None or d > best):
                best = d
    return best

def main():
    check = "--check" in sys.argv[1:]
    changed = 0
    for rel, folder, s in list(all_sessions()):
        day = last_change(folder)
        if day and s.get("updated") != day:
            print(f'{folder}: {s.get("updated", "none")} -> {day}')
            if not check:
                write_date(rel, s, day)
            changed += 1
    print(f"Dates {'to change' if check else 'changed'}: {changed}")

if __name__ == "__main__":
    sys.exit(main())
