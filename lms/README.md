# Course Portal

A course website built with Markdown, HTML, CSS and JavaScript. No build step and no database.

## How the site is organised

1. **Landing page** (`index.html`): lists every course you have taught.
2. **Course page** (`course.html?c=<course>`): one page serves every course. It shows the years of teaching and the sessions for the selected year.
3. **Slides** (`slides.html`): presents a session's `slides.md` as HTML slides.

## Folder structure: year, then course, then session

```
index.html
course.html                 The course page, for every course (course.html?c=macro)
courses/                    Old course addresses, kept so links you shared still work
slides.html                 Slide viewer
courses.json                Your courses, and the list of year folders. Small; changes rarely.
index.json                  Made for you on every commit and push. The site reads only this file. Never edit it.
courses.schema.json         Checks courses.json as you type (VS Code)
year.schema.json            Checks every year.json as you type
sessions.schema.json        Checks every sessions.json as you type
lms.py                      Add a session, add a course, start a new year
assets/                     Styles and scripts
tools/                      The date hook and helpers used by lms.py
_new-session/               The starter folder for a new session
content/
  2026-27/                  One folder per year
    year.json               "status": "current" or "archived", and the courses taught this year
    macro/                  One folder per course taught this year
      sessions.json         Macro's sessions for 2026-27: edit this to add, rename, hide or reorder
      module-1-measuring-output/     One folder per session
        slides.md           The slides
        readings.md         The Reading Material page
        images/             Images used in these slides
        interactives/       HTML interactives used in these slides
        readings/           PDFs and other reading material for this session
      module-3-inflation-unemployment/
      module-5-is-lm/
    managerial/
      sessions.json
      ...
  2025-26/                  A past year, same layout
    year.json               "status": "archived"
    macro/
      sessions.json
      session-01-introduction/
  shared/
    macro/                  Files used by several Macro sessions, in any year
      interactives/is-lm.html
  templates/all-layouts/    The Slide Templates deck
```

To work on a course, open `content/<year>/<course>/`. Its `sessions.json` lists the sessions and the session folders sit next to it. Folders never move: a year stays in `content/<year>/` when it is archived.

Everything a session needs sits in its own folder. Paths in `slides.md` are relative to that folder, so you write `images/gdp.png` and `interactives/is-lm.html`. Folder names: `session-01-topic`, `module-5-topic` or `class-03-topic`. Use lowercase and hyphens.

### courses.json

It lists your courses once, then the year folders, newest first:

```json
"courses": [
  { "id": "macro", "title": "Macroeconomics", "description": "…", "programme": "PGDM", "visibility": "public" }
],
"years": ["2026-27", "2025-26"]
```

The site cannot look inside folders, so a year folder appears only when its name is in `years`. That is the one thing to remember when you make a year folder by hand.

### year.json (one per year)

`content/2026-27/year.json`:

```json
{
  "$schema": "../../year.schema.json",
  "status": "current",
  "courses": ["managerial", "macro", "behavioural"]
}
```

- `status`: `"current"` or `"archived"`. Exactly one year is current; course pages open on it, and archived years are under the Archive button. To archive a year, change this one word. Nothing moves.
- `courses`: the courses taught this year. Each has a folder next to `year.json` with a `sessions.json`.
- Optional: `"note"` (one line shown on every course page that year), `"label"` (only when the name shown should differ from the folder name), `"term"`.

### sessions.json (one per course per year)

`content/2026-27/macro/sessions.json`:

```json
{
  "$schema": "../../../sessions.schema.json",
  "sessions": [
    {
      "id": "inflation-unemployment",
      "title": "Inflation and Unemployment",
      "type": "Module",
      "number": 3,
      "folder": "module-3-inflation-unemployment",
      "updated": "2026-11-06",
      "visibility": "public"
    }
  ]
}
```

- `id` is the session's address: `slides.html#macro/2026-27/inflation-unemployment`. Use lowercase and hyphens, unique in this file. **Do not change it once you have shared the link.** You can reorder, rename, move or delete other sessions and the link still works.
- `folder` is the session's folder, next to this file.
- `type` and `number` make the label "Module 3". For something without a number, write `"label": "Revision"` instead.
- `updated` fills itself when you commit a change to the session. See "Automatic update dates" below.
- Optional at the top of the file: `"note"` (one line about this course this year), `"programme"` (only when it differs from the course's), `"term"`.

The order of the list is the order on the course page. Visitors can sort it by clicking the Type or Updated heading (up and down arrows).

### Files used by more than one session: shared/

When several sessions of a course use the same image or interactive, keep one copy in `content/shared/<course>/` instead of a copy in each session. In `slides.md` or `readings.md`, start the path with `shared/`:

```
@[IS-LM interactive](shared/interactives/is-lm.html)
![Phillips curve](shared/images/phillips.svg)
```

`shared/` always means `content/shared/<course>/`, whichever session or year the slides are in. Every other path still means the session's own folder. Changing a shared file does not change any session's Updated date.

## Add a new session

The easy way: run `python lms.py` in the `lms` folder and choose **Add a new session**. It makes the folder from `_new-session/`, fills in the title, and adds the entry to `sessions.json`.

By hand:

1. Copy `_new-session/` into `content/<year>/<course>/` and rename it, for example `module-4-money`.
2. Add an entry for it to the `sessions` list in that course's `sessions.json` (copy one above).
3. Write the slides in its `slides.md`.

If the course is new to this year, also add its id to the `courses` list in that year's `year.json`, and create its `sessions.json`.

## Show or hide a session or course

Every session and every course has a `visibility` field with one of three values:

| Value | Listed on the site | Opens from a link |
|---|---|---|
| `"public"` (or no field) | Yes | Yes |
| `"unlisted"` | No | Yes |
| `"hidden"` | No | No |

- On a **session**: `"unlisted"` keeps it off the course page but its slides and Reading Material still open, for example to share with one group first. `"hidden"` switches it off completely.
- On a **course**: `"unlisted"` keeps it off the home page but its course page works. `"hidden"` makes the course page say it is not available, and none of its slides or Reading Material open.
- Counts on the home page and the Archive count only public sessions.
- A session's `visibility` is in its course's `sessions.json`; a course's is in `courses.json`.

Use it to prepare a session before class and switch it to `"public"` when you are ready. The files stay in the repository, and anyone who looks through the repository on GitHub can still read them.

## Checking the files as you type

The first line of `courses.json` points to `courses.schema.json`, and the first line of every `sessions.json` points to `sessions.schema.json`. VS Code reads them, suggests field names and values as you type, and underlines mistakes in red, for example `"visibility": "Public"`, `"status": "archieved"` or a session without a `folder`.

## Archive

A course page opens on the current year, with one **Archive** button at the bottom. That button switches the whole page to the previous years. A click on a year opens that year's sessions. In the Archive, one button at the bottom returns to the current year.

## Start a new year of teaching

Run `python lms.py` in the `lms` folder and choose **Start a new year**, or use **Years → Start a new year** on the Manage page. Either one:

1. sets the current year's `year.json` to `"archived"` (its folder stays where it is),
2. creates `content/<new year>/year.json` as `"current"`, with the same courses unless you say otherwise,
3. creates an empty `sessions.json` for each of those courses,
4. adds the new year to the front of `years` in `courses.json`.

Nothing moves, so every link keeps working, including direct links to PDFs and images, and session dates do not change. Commit and sync afterwards.

By hand: create `content/2027-28/year.json` with `"status": "current"` and its courses, change the old year's `year.json` to `"archived"`, and add `"2027-28"` to the front of `years` in `courses.json`.

## Add a new course

Run `python lms.py` and choose **Add a new course**. It adds the course to `courses.json`, adds it to the current year, and creates its folder and `sessions.json`.

By hand: add the course to the `courses` list in `courses.json` with a short lowercase `id` (letters and numbers only), a `title`, a `description`, a `programme` and `"visibility": "public"`. Add the id to the `courses` list in the current year's `year.json`. Create `content/<year>/<id>/sessions.json` containing `{ "sessions": [] }`.

Its page is `course.html?c=<id>`, for example `course.html?c=macro`, and the home page links to it. There is no page file to create.

## Writing slides

| You type | You get |
|---|---|
| A line with only `---` | A new slide |
| A line with only three bars | Splits the slide into columns |
| `Note:` on its own line | Speaker notes, shown only through the Notes button |
| `$x^2$` and `$$ ... $$` | Equations (LaTeX) |
| `<!-- layout: name -->` as the first line | A slide template (below) |

The first slide is the title slide. Text shrinks if a slide holds too much.

## Slide templates

Open **Slide Templates** (`slides.html#templates/reference/all-layouts`) to see every layout. It is listed in the `templates` section at the end of `courses.json`, not under `courses`, so it never appears on the home page. Its source is `content/templates/all-layouts/slides.md`. Copy a slide from it and change the content.

| Layout line | Use |
|---|---|
| none | Plain bullets |
| `compare` | Two ideas side by side (use three bars between them) |
| `callout` | Key idea or definition (a quote block) |
| `quote` | A quotation, then the source on the next line |
| `stat` | Big numbers, one per column, each starting with `# number` |
| `equation` | One large formula |
| `table` | Table with larger text |
| `code` | Code on the left, explanation on the right |
| `section` | Section divider |
| `agenda` | Numbered plan for the session |
| `steps` | Numbered process shown as cards |
| `activity` | Class exercise |
| `discussion` | Open question |
| `case` | Case study |
| `takeaways` | Summary points with ticks |
| `references` | Reading list (links work too; the full list lives in `readings.md`) |
| `end` | Closing slide |
| `image-right` / `image-left` | Text on one side, one image on the other |
| `image-full` | One image across the slide, title on a band |
| `image-grid` | Two to four images side by side |
| `interactive` | Interactive fills the slide |
| `interactive-right` / `interactive-left` | Short text on one side, interactive on the other |
| `video` | YouTube embed |

Add `cover` after an image layout to fill the space and trim the edges, for example `<!-- layout: image-full cover -->`. Without it, images are shown whole.

**Images:** a line `![Caption and source](images/chart.png)`. The text in brackets becomes the caption.

**Interactives:** a line `@[Title](interactives/is-lm.html)`.

**Video:** a line `@[Title](https://www.youtube.com/embed/VIDEO_ID)` under the `video` layout.

## HTML interactives

1. Save the interactive in the session's `interactives/` folder.
2. Add this line to its `<head>`. The `../` steps go up to the site folder (`lms`). In a session's `interactives/` folder, such as `content/2026-27/macro/module-1-measuring-output/interactives/`, it is five:

```html
<script src="../../../../../assets/interactive.js"></script>
```

   In `content/shared/<course>/interactives/` it is four (`../../../../assets/interactive.js`).

   It makes the interactive follow the light and dark switch, and keeps the arrow keys working for the slides. Esc hands control back to the slides.
3. Show it in a slide with `@[Title](interactives/file.html)`.

For dark mode, define the interactive's colours under `:root.dark-mode`. If it draws on a canvas, redraw on the `themechange` event. See `content/shared/macro/interactives/is-lm.html`.

You can also put small demos straight into a slide with `<script>`. See `content/2026-27/managerial/session-03-elasticity/slides.md`.

## Presenting

- Right arrow, Space or Page Down: next. Left arrow or Page Up: previous.
- F: full screen. N: speaker notes. P or the **Download PDF** button: opens the print dialog. Choose "Save as PDF" as the destination (one slide per page, light colours).
- Each slide has its own address, for example `slides.html#macro/2026-27/is-lm/4` (course, year, session id, slide). Older addresses such as `#macro-2026-27-2-4` still open, by position in the list.
- Swipe on a phone or tablet.

## Notes, prices and code blocks

- Speaker notes sit in the Markdown file, which anyone can open. Keep private material out of them. Set `"showNotes": false` under `site` in `courses.json` to remove the Notes button.
- Prices such as `$5 and $10` are safe. A formula needs no space just inside the dollar signs: `$x^2$`.
- A line of three dashes inside a code block does not start a new slide.

## Run on your computer

Browsers block reading local files, so use a small server. From this folder:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

The portal is the `lms/` folder of the `pawankb13.github.io` repository. Push, and the site is at `https://pawankb13.github.io/lms/`.

## Before you publish

The sample years, sessions and images are examples. Replace them with your own.

## Libraries

Loaded from jsDelivr, nothing to install: marked 12.0.2 (Markdown) and MathJax 3.2.2 (equations).

## Easy way to add and archive: lms.py

Run `python lms.py` in the `lms` folder. It shows a menu:

1. **Add a new session**: asks for course, year, title and label. It creates the session folder from `_new-session/`, adds the entry to that course's `sessions.json` and sets today as the update date.
2. **Add a new course**: adds it to `courses.json` and to the current year, and creates its folder and `sessions.json`.
3. **Start a new year**: marks the current year archived, creates the new year's folder and `year.json` as current, and sets up its course folders. Nothing moves.

Then commit and sync.

## index.json: why pages load fast

The live site reads one file, `index.json`, instead of `courses.json`, every `year.json`, every `sessions.json` and every `readings.md` one after another. `index.json` is all of those merged into one file. **Never edit it.** Keep editing the usual files; `index.json` is rebuilt for you:

- **On your computer**, the git hook `tools/hooks/pre-commit` rebuilds it on every commit and adds it to the commit (same one-time setup as below).
- **On github.com** (for example after pasting files from `manage.html`), the GitHub Action `.github/workflows/lms-index.yml` rebuilds it after each push and commits it as "Rebuild lms/index.json". The live site shows the change a minute or two later.
- **By hand**, any time: `python3 tools/build_index.py` in the `lms` folder.

When you preview on your own computer (`localhost`), the site skips `index.json` and reads the separate files, so your edits show before you commit. If `index.json` is ever missing or broken, the live site does the same.

## Automatic update dates

The Updated column shows the day you last changed that session: its slides, images, interactives or readings. The date is set on your computer at the moment you commit, and goes into the same commit. Nothing is committed for you afterwards, so syncing never clashes.

When a commit includes a change in a session's folder, the git hook `tools/hooks/pre-commit` (which runs `tools/date_on_commit.py`) sets that session's `"updated"` in its course's `sessions.json` to today and adds that file to the commit. Sessions you did not change keep their date. Moving or renaming a folder does not count as a change. This works for commits from VS Code and the terminal alike. If something goes wrong, the commit still goes through and the date is simply not changed.

One-time setup on each computer, in the repository folder (`pawankb13.github.io`):

```
git config core.hooksPath lms/tools/hooks
```

Changes made on github.com (for example a reading link pasted into `readings.md` there) do not set a date. Type that session's date yourself if you want it to show: `"updated": "YYYY-MM-DD"` in its `sessions.json`.

To set every date from git history at once, run `python tools/set_dates.py` in the `lms` folder (`--check` only shows what would change). It follows files across moves and renames, so a moved session keeps the date of its last real change.

## Manage page (form)

Open `manage.html` on your published site, for example `https://pawankb13.github.io/lms/manage.html`. No page links to it.

| Group | What you can do |
|---|---|
| Courses | Add a course. Delete a course. |
| Sessions | Add a session. Delete a session. |
| Years | Start a new year: the current year becomes archived and the new one current. |
| Portal | Check for problems: finds missing `sessions.json` and slide files, and mistakes in the JSON files. |

Each change lists the files to update on GitHub: usually one `sessions.json`, and sometimes a `year.json` or `courses.json`. For each there is a button that opens it on GitHub (filled in, for a new file), a Copy button and a Download button. Adding a session also gives buttons that open GitHub with its new `slides.md` and `readings.md` already filled in. Deleting gives links to the folders to remove on GitHub, and asks you to tick a confirmation box first. The page checks the new files before showing them, and stops if they would be invalid.

The buttons use the `github` setting in `courses.json` (`repo`, `branch`, `folder`). Change it if your repository, branch or folder name differs.

## Reading material

1. Put the files (PDF, Word, Excel) in the session's `readings/` folder, for example `content/2026-27/macro/module-5-is-lm/readings/mankiw-ch11.pdf`.
2. Add a reading list slide at the end of that session's `slides.md`:

```
<!-- layout: references -->
## Reading

- [Mankiw, Chapter 11: Aggregate demand](readings/mankiw-ch11.pdf)
- [RBI Monetary Policy Report](https://www.rbi.org.in/)
- Dornbusch, Fischer and Startz. *Macroeconomics*. McGraw Hill.
```

A link to a file in `readings/` opens from the slide. A link starting with `https://` opens the website in a new tab. A line with no link is a plain reference. Keep files small, since GitHub Pages is not built for large files.

## Reading Material page (one per session)

A session row on the course page shows a **Reading Material** link before **Open slides** only when that session has reading material. It opens a page for that session only.

The link appears by itself: the course page looks at each session's `readings.md` and shows the link when the file has something in it. A file with only the starter instructions (the text between `<!--` and `-->`), an empty file, or no file at all means no link. To remove the link again, delete your lines from `readings.md`. The page shows the file `readings.md` from the session's own folder, for example `content/2026-27/macro/module-5-is-lm/readings.md`.

To add links, open that file on GitHub, click the pencil icon, paste your links, and commit:

```
- [Title of the reading](https://link-to-the-reading)
- [Chapter 11](readings/chapter-11.pdf)
- A book reference with no link
```

The second line opens a file saved in the session's `readings/` folder. Every session folder has a `readings.md`, including the `_new-session/` starter. The Manage page's Add session gives a button that creates it. Editing `readings.md` also changes the session's Updated date.
