#!/usr/bin/env python3
"""Course portal helper. Run:  python lms.py
Menu: add a session, add a course, start a new year (moves the current year to the archive).
It edits courses.json and the sessions.json files, and creates or moves folders. Nothing else is touched."""
import re, shutil, sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "tools"))
from portal import ROOT, load_courses, save_courses, load_sessions, save_sessions, sessions_path, year_folder

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

def split_label(s):
    """'Session 4' -> {'type': 'Session', 'number': 4}. Anything without a number at the end stays a label."""
    m = re.match(r"^(.*?)\s*(\d+)$", s)
    return {"type": m.group(1), "number": int(m.group(2))} if m and m.group(1) else {"label": s}

def current_year(d):
    ys = [y for y in d.get("years", []) if y.get("status") != "archived"]
    return ys[0] if ys else None

def year_label(y):
    return f'{y["id"]}  ({y.get("status", "current")})'

def add_session(d):
    c = pick("Which course?", d["courses"], lambda c: c["title"])
    cur = current_year(d)
    years = d.get("years", [])
    if not years:
        print("There is no year yet. Use 'Start a new year' first."); return
    y = cur if cur and ask(f"Add it to the current year {cur['id']}? (y/n)", "y").lower().startswith("y") \
        else pick("Which year?", years, year_label)
    title = ask("Session title (what students see)")
    label = ask("Label, for example Session 4 or Module 4")
    if not title or not label:
        print("A title and a label are needed."); return
    folder = slug(f"{label}-{title}")
    rel = sessions_path(y, c["id"])
    dest = ROOT / year_folder(y) / c["id"] / folder
    if dest.exists():
        print("That folder already exists:", dest.relative_to(ROOT)); return
    shutil.copytree(ROOT / "_new-session", dest, ignore=shutil.ignore_patterns(".DS_Store"))
    f = dest / "slides.md"
    t = f.read_text(encoding="utf-8").replace("# Session title", "# " + title, 1) \
        .replace("Course name · Session number", f'{c["title"]} · {label}', 1)
    f.write_text(t, encoding="utf-8")
    s = load_sessions(rel)
    ids = {k.get("id") for k in s["sessions"]}
    base = slug(title) or folder
    sid, n = base, 2
    while sid in ids:
        sid, n = f"{base}-{n}", n + 1
    s["sessions"].append({"id": sid, "title": title, **split_label(label), "folder": folder,
                          "updated": date.today().isoformat(), "visibility": "public"})
    save_sessions(rel, s)
    if c["id"] not in y.setdefault("courses", []):
        y["courses"].append(c["id"])
        save_courses(d)
    print(f"\nDone. Write your slides in:\n  {dest.relative_to(ROOT)}/slides.md\n"
          f"Put images in its images/ folder and interactives in interactives/.\n"
          f"The session is listed in {rel}.")

def add_course(d):
    title = ask("Course title, for example Public Policy")
    if not title:
        return
    cid = re.sub(r"[^a-z0-9]+", "", title.lower())[:24]
    cid = ask("Short id (letters and numbers only, used in links)", cid)
    if not re.fullmatch(r"[a-z0-9]+", cid or "") or cid == "templates":
        print("Use lowercase letters and numbers only (and not 'templates')."); return
    if any(c["id"] == cid for c in d["courses"]):
        print("A course with this id already exists."); return
    course = {"id": cid, "title": title, "description": ask("One-line description", "") or ""}
    prog = ask("Programme (can be empty)", "PGDM")
    if prog:
        course["programme"] = prog
    course["visibility"] = "public"
    d["courses"].append(course)
    y = current_year(d)
    if y:
        y.setdefault("courses", []).append(cid)
        save_sessions(sessions_path(y, cid), {"sessions": []})
    save_courses(d)
    print(f"\nDone. Its page is course.html?c={cid}." + (f" Add sessions to it with option 1." if y else ""))

def new_year(d):
    cur = current_year(d)
    yid = ask("New year, for example 2027-28")
    if not yid or not re.fullmatch(r"[A-Za-z0-9-]+", yid):
        print("Use letters, numbers and hyphens only."); return
    if any(y["id"] == yid for y in d.get("years", [])):
        print("That year already exists."); return
    if cur:
        src, dst = ROOT / year_folder(cur), ROOT / "content" / "archive" / cur["id"]
        print(f"\nThis moves {cur['id']} to the Archive:\n  {src.relative_to(ROOT)}  ->  {dst.relative_to(ROOT)}")
        if not ask("Go ahead? (y/n)", "y").lower().startswith("y"):
            print("Nothing changed."); return
        if dst.exists():
            print("The archive already has a folder for", cur["id"], "- nothing changed."); return
        if src.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))
        cur["status"] = "archived"
        carry = cur.get("courses", [])
        names = ", ".join(c["title"] for c in d["courses"] if c["id"] in carry)
        keep = ask(f"Teach the same courses in {yid}? ({names}) (y/n)", "y").lower().startswith("y")
        courses = list(carry) if keep else []
    else:
        courses = []
    ny = {"id": yid, "status": "current", "courses": courses}
    note = ask("One line about this year (can be empty)", "") or ""
    if note:
        ny["note"] = note
    d.setdefault("years", []).insert(0, ny)
    (ROOT / year_folder(ny)).mkdir(parents=True, exist_ok=True)
    for cid in courses:
        save_sessions(sessions_path(ny, cid), {"sessions": []})
    save_courses(d)
    print(f"\nDone. {yid} is the current year, in {year_folder(ny)}/. Add sessions with option 1.")

MENU = [("Add a new session", add_session),
        ("Add a new course", add_course),
        ("Start a new year (moves the current year to the Archive)", new_year)]

def main():
    d = load_courses()
    fn = pick("What do you want to do?", MENU, lambda m: m[0])[1]
    fn(d)

if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled.")
