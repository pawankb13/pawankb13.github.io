#!/usr/bin/env python3
"""Called by the git hook lms/tools/hooks/pre-commit, just before each commit.

For every session whose folder has a change in this commit (slides, images, interactives or readings),
it sets "updated" to today in that course's sessions.json and adds that file to the same commit.
Sessions that were not changed keep their date. A folder that was only moved or renamed does not
count as a change.

If anything goes wrong, it prints a line and lets the commit go ahead."""
import subprocess, sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from portal import ROOT, all_sessions, write_date

def git(*args, cwd=ROOT):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True).stdout

def changed_paths(top, prefix):
    """Paths inside lms/ that this commit adds, changes or deletes. Pure moves (100% renames) are left out."""
    out = git("diff", "--cached", "--name-status", "-M", "-z", cwd=top).split("\0")
    paths, i = [], 0
    while i < len(out) and out[i]:
        status = out[i]
        if status[0] in "RC":
            old, new = out[i + 1], out[i + 2]
            i += 3
            if status in ("R100", "C100"):
                continue
            paths.append(new)
        else:
            paths.append(out[i + 1])
            i += 2
    return [p[len(prefix) + 1:] for p in paths if p.startswith(prefix + "/")]

def main():
    top = Path(git("rev-parse", "--show-toplevel").strip())
    prefix = ROOT.resolve().relative_to(top.resolve()).as_posix()      # "lms"
    staged = changed_paths(top, prefix)
    if not any(p.startswith("content/") for p in staged):
        return
    today = date.today().isoformat()
    touched, names = set(), []
    for rel, folder, s in all_sessions():
        f = folder + "/"
        if s.get("updated") != today and any(p.startswith(f) for p in staged):
            touched.add(write_date(rel, s, today))
            names.append(s.get("title", folder))
    for rel in sorted(touched):
        git("add", "--", str(ROOT / rel))
    if names:
        print("Updated date set to " + today + ": " + ", ".join(names))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:               # a date problem must never block a commit
        print("Session dates not updated:", e)
