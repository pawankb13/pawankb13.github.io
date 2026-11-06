#!/usr/bin/env python3
"""Course portal helper. Run:  python lms.py
Menu: add a session, archive a year, start a new year.
It edits courses.json (and dates.json for a new session) and creates folders. Nothing else is touched."""
import json, re, shutil, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "courses.json"
DATES = ROOT / "dates.json"

def load():
    return json.loads(DATA.read_text(encoding="utf-8"))

def save(d):
    """Same layout as manage.html writes: two-space indent and a blank line between courses."""
    text = json.dumps(d, indent=2, ensure_ascii=False) + "\n"
    DATA.write_text(text.replace("\n    },\n    {\n", "\n    },\n\n    {\n"), encoding="utf-8")

def set_date(file, day):
    """Shows a date for a new session until GitHub writes the real one after your next push."""
    dates = json.loads(DATES.read_text(encoding="utf-8")) if DATES.exists() else {}
    dates[file] = day
    DATES.write_text(json.dumps(dates, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def ask(prompt, default=None):
    s = input(f"{prompt}" + (f" [{default}]" if default else "") + ": ").strip()
    return s or default

def pick(title, items, label):
    print(f"\n{title}")
    for i, it in enumerate(items, 1):
        print(f"  {i}. {label(it)}")
    while True:
        n = ask("Number")
        if n and n.isdigit() and 1 <= int(n) <= len(items):
            return items[int(n) - 1]
        print("Type one of the numbers above.")

def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")

def deck_label(k):
    return k.get("label") or " ".join(str(k[f]) for f in ("type", "number") if k.get(f) not in (None, ""))

def split_label(s):
    """'Session 4' -> {'type': 'Session', 'number': 4}. Anything without a number at the end stays a label."""
    m = re.match(r"^(.*?)\s*(\d+)$", s)
    return {"type": m.group(1), "number": int(m.group(2))} if m and m.group(1) else {"label": s}

def pick_course(d):
    return pick("Which course?", d["courses"], lambda c: c["title"])

def pick_year(c, only_current=False):
    ys = [y for y in c["years"] if not only_current or y.get("status") != "archived"]
    return pick("Which year?", ys, lambda y: f'{y.get("label", y["id"])}  ({y.get("status", "current")})')

def add_session(d):
    c = pick_course(d)
    y = pick_year(c)
    title = ask("Session title (what students see)")
    label = ask("Label, for example Session 4 or Module 4")
    folder = slug(f"{label}-{title}")
    rel = f'content/{c["id"]}/{y["id"]}/{folder}'
    dest = ROOT / rel
    if dest.exists():
        print("That folder already exists:", rel); return
    shutil.copytree(ROOT / "_new-session", dest)
    f = dest / "slides.md"
    t = f.read_text(encoding="utf-8").replace("# Session title", "# " + title, 1).replace("Course name · Session number", f'{c["title"]} · {label}', 1)
    f.write_text(t, encoding="utf-8")
    ids = {k.get("id") for k in y.get("decks", [])}
    base = slug(title) or folder
    mid, n = base, 2
    while mid in ids:
        mid, n = f"{base}-{n}", n + 1
    y.setdefault("decks", []).append({"id": mid, "title": title, **split_label(label),
        "file": f"{rel}/slides.md", "visibility": "public"})
    save(d)
    set_date(f"{rel}/slides.md", date.today().isoformat())
    print(f"\nDone. Write your slides in:\n  {rel}/slides.md\nPut images in its images/ folder and interactives in interactives/.")

def archive_year(d):
    c = pick_course(d)
    y = pick_year(c, only_current=True)
    y["status"] = "archived"
    save(d)
    print(f'\n{c["title"]} {y.get("label", y["id"])} is now in the Archive.')
    if ask("Start the next year now? (y/n)", "y").lower().startswith("y"):
        new_year(d, c)

def new_year(d, c=None):
    c = c or pick_course(d)
    yid = ask("Year, for example 2027-28")
    if any(y["id"] == yid for y in c["years"]):
        print("That year already exists."); return
    prog = ask("Programme", c.get("programme") or "PGDM")
    note = ask("One line about this offering (can be empty)", "") or ""
    ny = {"id": yid, "status": "current"}
    if prog and prog != c.get("programme"):
        ny["programme"] = prog
    if note:
        ny["note"] = note
    ny["decks"] = []
    c["years"].insert(0, ny)
    (ROOT / "content" / c["id"] / yid).mkdir(parents=True, exist_ok=True)
    save(d)
    print(f'\nDone. {c["title"]} {yid} is the current year. Add sessions with option 1.')

MENU = [("Add a new session", add_session),
        ("Archive a year", archive_year), ("Start a new year", new_year)]

def main():
    d = load()
    fn = pick("What do you want to do?", MENU, lambda m: m[0])[1]
    fn(d)

if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled.")
