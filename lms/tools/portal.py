"""Shared helpers for lms.py, tools/set_dates.py and tools/date_on_commit.py.

Layout (paths inside the lms folder):
    courses.json                              site settings, courses, and the list of year folders (newest first)
    content/<year>/year.json                  "status": "current" or "archived", and the courses taught that year
    content/<year>/<course>/sessions.json     that course's sessions that year
    content/<year>/<course>/<session folder>/ slides.md, readings.md, images/, interactives/, readings/
    content/shared/<course>/                  files used by several sessions of a course
    content/templates/all-layouts/            the Slide Templates deck
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # the lms folder
DATA = ROOT / "courses.json"
YEAR_SCHEMA = "../../year.schema.json"                 # from content/<year>/
SESSIONS_SCHEMA = "../../../sessions.schema.json"      # from content/<year>/<course>/

def year_folder(y):
    return f'content/{y if isinstance(y, str) else y["id"]}'

def year_path(y):
    return f"{year_folder(y)}/year.json"

def sessions_path(y, course_id):
    """Path of sessions.json, relative to the lms folder."""
    return f"{year_folder(y)}/{course_id}/sessions.json"

def dump(obj):
    """The one layout every tool writes: two-space indent, a blank line between courses and between
    sessions, and short lists of names on one line. manage.html writes the same layout."""
    text = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
    text = re.sub(r'\[\s*\n\s*("[^"\n]*"(?:,\s*\n\s*"[^"\n]*")*)\s*\n\s*\]',
                  lambda m: "[" + re.sub(r",\s*\n\s*", ", ", m.group(1)) + "]", text)
    return text.replace('\n    },\n    {\n      "id"', '\n    },\n\n    {\n      "id"')

def _with_schema(obj, schema):
    obj = dict(obj)
    obj.pop("id", None)                                  # a year's id is its folder name, not stored inside
    obj.pop("$schema", None)
    return {"$schema": schema, **obj}

def load_courses():
    return json.loads(DATA.read_text(encoding="utf-8"))

def save_courses(d):
    DATA.write_text(dump(d), encoding="utf-8")

def load_years(d=None):
    """Every year listed in courses.json, in that order: its year.json plus "id". A missing year.json is skipped."""
    d = d or load_courses()
    out = []
    for yid in d.get("years", []):
        p = ROOT / year_path(yid)
        if p.exists():
            out.append({**json.loads(p.read_text(encoding="utf-8")), "id": yid})
    return out

def save_year(y):
    p = ROOT / year_path(y)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dump(_with_schema(y, YEAR_SCHEMA)), encoding="utf-8")

def load_sessions(rel):
    p = ROOT / rel
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {"$schema": SESSIONS_SCHEMA, "sessions": []}

def save_sessions(rel, s):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dump(_with_schema(s, SESSIONS_SCHEMA)), encoding="utf-8")

def all_sessions(d=None):
    """Yields (sessions.json path, session folder path, session) for every session, both relative to lms/.
    The Slide Templates decks come last, with sessions.json path None (their dates live in courses.json)."""
    d = d or load_courses()
    for y in load_years(d):
        for cid in y.get("courses", []):
            rel = sessions_path(y, cid)
            p = ROOT / rel
            if not p.exists():
                continue
            for s in json.loads(p.read_text(encoding="utf-8")).get("sessions", []):
                if s.get("folder"):
                    yield rel, f"{year_folder(y)}/{cid}/{s['folder']}", s
    for k in d.get("templates", {}).get("decks", []):
        if k.get("file"):
            yield None, k["file"].rsplit("/", 1)[0], k

def set_date(text, match_key, match_value, day):
    """Sets "updated" inside the one object whose match_key ("folder" or "file") equals match_value.
    Only that date changes; the rest of the text, including its layout, stays as it is."""
    m = re.search(r'"%s"\s*:\s*%s' % (match_key, re.escape(json.dumps(match_value))), text)
    if not m:
        return text
    start = text.rfind("{", 0, m.start())
    end = text.find("}", m.end())
    obj = text[start:end]
    if re.search(r'"updated"\s*:', obj):
        obj = re.sub(r'("updated"\s*:\s*)"[^"]*"', lambda u: u.group(1) + json.dumps(day), obj, count=1)
    else:
        indent = re.search(r'\n([ \t]*)"%s"' % match_key, obj)
        pad = indent.group(1) if indent else "      "
        obj = obj[:m.end() - start] + f',\n{pad}"updated": {json.dumps(day)}' + obj[m.end() - start:]
    return text[:start] + obj + text[end:]

def write_date(sessions_rel, session, day):
    """Writes one session's date into its file. Returns the file changed (relative to lms/)."""
    if sessions_rel is None:                                   # a Slide Templates deck
        rel, key, value = "courses.json", "file", session["file"]
    else:
        rel, key, value = sessions_rel, "folder", session["folder"]
    p = ROOT / rel
    text = set_date(p.read_text(encoding="utf-8"), key, value, day)
    json.loads(text)                                           # never write a broken file
    p.write_text(text, encoding="utf-8")
    return rel
