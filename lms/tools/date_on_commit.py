#!/usr/bin/env python3
"""Called by the git hook lms/tools/hooks/pre-commit, just before each commit.

For every session in courses.json whose folder has a change in this commit (slides, images,
interactives or readings), it sets "updated" to today and adds courses.json to the same commit.
Sessions that were not changed keep their date. Only the date values change in courses.json;
its layout and spacing stay as they are.

If anything goes wrong, it prints a line and lets the commit go ahead."""
import json, subprocess, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # the lms folder
DATA = ROOT / "courses.json"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from set_dates import set_date                           # changes one session's date, nothing else

def git(*args, cwd=ROOT):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True).stdout

def main():
    top = Path(git("rev-parse", "--show-toplevel").strip())
    prefix = ROOT.resolve().relative_to(top.resolve()).as_posix()      # "lms"
    staged = [p for p in git("diff", "--cached", "--name-only", "-z", cwd=top).split("\0") if p]
    staged = [p[len(prefix) + 1:] for p in staged if p.startswith(prefix + "/")]   # paths inside lms/
    if not any(p.startswith("content/") for p in staged):
        return

    text = DATA.read_text(encoding="utf-8")
    d = json.loads(text)
    decks = [k for c in d.get("courses", []) for y in c.get("years", []) for k in y.get("decks", [])]
    decks += d.get("templates", {}).get("decks", [])
    today = date.today().isoformat()
    changed = []
    for k in decks:
        file = k.get("file", "")
        folder = file if file.lower().endswith((".html", ".htm")) else file.rsplit("/", 1)[0] + "/"
        if any(p == folder or p.startswith(folder) for p in staged) and k.get("updated") != today:
            text = set_date(text, file, today)
            changed.append(k.get("title", file))
    if not changed:
        return
    json.loads(text)                     # never write a broken courses.json
    DATA.write_text(text, encoding="utf-8")
    git("add", "--", str(DATA))
    print("Updated date set to " + today + ": " + ", ".join(changed))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:               # a date problem must never block a commit
        print("Session dates not updated:", e)
