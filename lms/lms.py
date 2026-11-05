#!/usr/bin/env python3
"""Course portal helper. Run:  python lms.py
Menu: add a session, archive a year, start a new year.
It edits courses.json and creates folders. Nothing else is touched."""
import json, re, shutil, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "courses.json"

def load():
    return json.loads(DATA.read_text(encoding="utf-8"))

def save(d):
    DATA.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

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

def pick_course(d):
    return pick("Which course?", [c for c in d["courses"] if not c.get("hidden")], lambda c: c["title"])

def pick_year(c, only_current=False):
    ys = [y for y in c["years"] if not only_current or y.get("status") != "archived"]
    return pick("Which year?", ys, lambda y: f'{y["label"]}  ({y.get("status", "current")})')

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
    y.setdefault("decks", []).append(
        {"title": title, "label": label, "updated": date.today().isoformat(), "file": f"{rel}/slides.md"})
    save(d)
    print(f"\nDone. Write your slides in:\n  {rel}/slides.md\nPut images in its images/ folder and interactives in interactives/.")

def update_date(d):
    c = pick_course(d)
    y = pick_year(c)
    if not y.get("decks"):
        print("This year has no sessions."); return
    k = pick("Which session?", y["decks"], lambda k: f'{k.get("label", "")}  {k["title"]}  (updated {k.get("updated", "-")})')
    k["updated"] = ask("New date (YYYY-MM-DD)", date.today().isoformat())
    save(d)
    print("Date updated.")

def archive_year(d):
    c = pick_course(d)
    y = pick_year(c, only_current=True)
    y["status"] = "archived"
    save(d)
    print(f'\n{c["title"]} {y["label"]} is now in the Archive.')
    if ask("Start the next year now? (y/n)", "y").lower().startswith("y"):
        new_year(d, c)

def new_year(d, c=None):
    c = c or pick_course(d)
    yid = ask("Year, for example 2027-28")
    if any(y["id"] == yid for y in c["years"]):
        print("That year already exists."); return
    prog = ask("Programme", "PGDM")
    note = ask("One line about this offering (can be empty)", "") or ""
    c["years"].insert(0, {"id": yid, "label": yid, "status": "current", "programme": prog,
                          "note": note, "decks": []})
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
