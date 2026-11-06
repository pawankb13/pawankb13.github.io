#!/usr/bin/env python3
"""Sets each session's "updated" date in courses.json from git history:
the date of the last commit that touched that session's folder (slides, images, interactives or readings).
Runs automatically on GitHub (see .github/workflows/update-dates.yml at the repository root).
You can also run it by hand:

    python tools/set_dates.py           change courses.json
    python tools/set_dates.py --check   only show what would change

Only the date values are changed. The rest of courses.json, including its spacing, is left as it is."""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "courses.json"

def last_commit_date(folder: Path):
    r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(folder)],
                       cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() or None

def set_date(text: str, file: str, day: str):
    """Changes "updated" inside the one deck object whose "file" is `file`. Returns the new text."""
    m = re.search(r'"file"\s*:\s*' + re.escape(json.dumps(file)), text)
    if not m:
        return text
    start = text.rfind("{", 0, m.start())
    end = text.find("}", m.end())
    obj = text[start:end]
    if re.search(r'"updated"\s*:', obj):
        obj = re.sub(r'("updated"\s*:\s*)"[^"]*"', lambda u: u.group(1) + json.dumps(day), obj, count=1)
    else:
        obj = obj[:m.end() - start] + f',\n              "updated": {json.dumps(day)}' + obj[m.end() - start:]
    return text[:start] + obj + text[end:]

def main():
    check = "--check" in sys.argv[1:]
    text = DATA.read_text(encoding="utf-8")
    d = json.loads(text)
    decks = [k for c in d.get("courses", []) for y in c.get("years", []) for k in y.get("decks", [])]
    decks += d.get("templates", {}).get("decks", [])
    changed = 0
    for k in decks:
        path = ROOT / k["file"]
        folder = path if k["file"].lower().endswith((".html", ".htm")) else path.parent
        day = last_commit_date(folder)
        if day and k.get("updated") != day:
            print(f'{k["file"]}: {k.get("updated", "none")} -> {day}')
            text = set_date(text, k["file"], day)
            changed += 1
    if changed and not check:
        json.loads(text)   # stop before writing if the result is not valid JSON
        DATA.write_text(text, encoding="utf-8")
    print(f"Dates {'to change' if check else 'changed'}: {changed}")

if __name__ == "__main__":
    sys.exit(main())
