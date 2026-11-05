# Course Portal

A course website built with Markdown, HTML, CSS and JavaScript. No build step and no database.

## How the site is organised

1. **Landing page** (`index.html`): lists every course you have taught.
2. **Course page** (`courses/<course>.html`): one page per course, with the years of teaching and the sessions for the selected year.
3. **Slides** (`slides.html`): presents a session's `slides.md` as HTML slides.

## Folder structure: one folder per session

```
index.html
courses/                    One page per course
slides.html                 Slide viewer
courses.json                Courses, years and sessions. Edit this to add anything.
assets/                     Styles and scripts
_new-session/               Copy this folder to start a new session
content/
  macro/                    Course
    2026-27/                Year of teaching
      module-1-measuring-output/     One folder per session or module
        slides.md           The slides
        images/             Images used in these slides
        interactives/       HTML interactives used in these slides
        readings/           PDFs and other reading material for this session
      module-5-is-lm/
        slides.md
        images/
        interactives/is-lm.html
    2025-26/
      session-01-introduction/
        ...
  managerial/ ...
  behavioural/ ...
  econometrics/ ...
  research/ ...
  templates/2026-27/all-layouts/     The Slide Templates deck
```

Everything a session needs sits in its own folder. Paths in `slides.md` are relative to that folder, so you write `images/gdp.png` and `interactives/is-lm.html`. Move or copy a session folder and it still works.

Folder names: `session-01-topic`, `module-5-topic` or `class-03-topic`. Use lowercase and hyphens.

## Add a new session

1. Copy `_new-session/` to `content/<course>/<year>/`, and rename it, for example `module-4-money`.
2. Edit `slides.md` and put images and interactives in its folders.
3. Add one entry to that year's `decks` list in `courses.json`:

```json
{
  "id": "money",
  "title": "The Monetary System",
  "type": "Module",
  "number": 4,
  "file": "content/macro/2026-27/module-4-money/slides.md",
  "updated": "2026-11-05",
  "visibility": "public"
}
```

- `id` is the session's address: `slides.html#macro/2026-27/money`. Use lowercase and hyphens, unique within the year. **Do not change it once you have shared the link.** You can reorder, rename or delete other sessions and the link still works.
- `type` and `number` make the label "Module 4". For something without a number, write `"label": "All layouts"` instead.
- `updated` fills itself. See "Automatic update dates" below.

The order of the list is the order on the course page. Visitors can sort it by clicking the Type or Updated heading (up and down arrows).

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

Use it to prepare a session before class and switch it to `"public"` when you are ready. The files stay in the repository, and anyone who looks through the repository on GitHub can still read them.

## Checking courses.json as you type

The first line of `courses.json` points to `courses.schema.json`. VS Code reads it, suggests field names and values as you type, and underlines mistakes in red, for example `"visibility": "Public"`, `"status": "archieved"` or a session without an `id`.

## Archive

A course page opens on the current year, with one **Archive** button at the bottom. That button switches the whole page to the previous years. A click on a year opens that year's sessions. In the Archive, one button at the bottom returns to the current year. A year goes to the Archive when its `status` in `courses.json` is `"archived"`.

## Add a new year of teaching

Add a year to the course's `years` list in `courses.json`, with `"status": "current"`. Change the old year to `"archived"` and it moves to the Archive. Then create `content/<course>/<year>/`.

```json
{ "id": "2027-28", "status": "current", "note": "One line about this offering.", "decks": [] }
```

Leave out any field you do not need. `programme` is set once on the course (`"programme": "PGDM"`) and every year uses it. Add `"programme"` to a year only when that year is different. Add `"label"` only when the name shown should differ from the `id`. `term` and `note` are optional.

## Add a new course

1. Add the course to `courses.json` with a short lowercase `id` (letters and numbers only), a `title`, a `description`, a `programme` and `"visibility": "public"`.
2. Copy any file in `courses/`, rename it `<id>.html`, and change `data-course="..."` and the `<title>`.

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

Open **Slide Templates** (`slides.html#templates/reference/all-layouts`) to see every layout. It is listed in the `templates` section at the end of `courses.json`, not under `courses`, so it never appears on the home page. Its source is `content/templates/2026-27/all-layouts/slides.md`. Copy a slide from it and change the content.

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
2. Add this line to its `<head>`. The `../` steps go up to the site root, so count the folders from your file to the root. In `content/macro/2026-27/module-5-is-lm/interactives/` it is five:

```html
<script src="../../../../../assets/interactive.js"></script>
```

   It makes the interactive follow the light and dark switch, and keeps the arrow keys working for the slides. Esc hands control back to the slides.
3. Show it in a slide with `@[Title](interactives/file.html)`.

For dark mode, define the interactive's colours under `:root.dark-mode`. If it draws on a canvas, redraw on the `themechange` event. See `content/macro/2026-27/module-5-is-lm/interactives/is-lm.html`.

You can also put small demos straight into a slide with `<script>`. See `content/managerial/2026-27/session-03-elasticity/slides.md`.

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

Copy this folder into your `pawankb13.github.io` repository, for example as `teaching/`, and push. The site will be at `https://pawankb13.github.io/teaching/`.

## Before you publish

The sample years, sessions and images are examples. Replace them with your own.

## Libraries

Loaded from jsDelivr, nothing to install: marked 12.0.2 (Markdown) and MathJax 3.2.2 (equations).

## Easy way to add and archive: lms.py

Run `python lms.py` in this folder. It shows a menu:

1. Add a new session: asks for course, year, title and label. It creates the session folder from `_new-session/`, adds the entry to `courses.json` and sets today as the update date.
2. Archive a year: moves the current year to the Archive, then offers to start the next year.
3. Start a new year: makes it the current year and creates its folder.

Then write your slides in the new `slides.md`.

## Automatic update dates

The Updated column shows the date of the last change to that session's folder (slides, images or interactives). GitHub works it out from your commits. You never type a date.

One-time setup, on github.com:
1. In your repository, click **Add file**, then **Create new file**.
2. Name it `.github/workflows/update-dates.yml`.
3. Paste the contents of `.github-workflow/update-dates.yml` from this portal. If your portal folder is not called `teaching`, change the three lines marked CHANGE.
4. Click **Commit changes**.
5. In the repository, open **Settings**, then **Actions**, then **General**. Under Workflow permissions, choose **Read and write permissions** and save.

After this, each time you commit a change under `content/`, GitHub updates `courses.json` within a minute, and the site shows the new date. Until then, the date in `courses.json` is used.

## Manage page (form)

Open `manage.html` on your published site, for example `https://pawankb13.github.io/teaching/manage.html`. No page links to it.

| Group | What you can do |
|---|---|
| Courses | Add a course. Delete a course. |
| Modules | Add a module. Delete a module. |
| Years | Start a new year. Archive a year. |
| Portal | Check for problems: finds missing course pages and slide files. |

Each change gives you the new `courses.json` to paste on GitHub (with a button that opens the file for you, a Copy button and a Download button). Adding gives a button that opens GitHub with the new slides or course page already filled in. Deleting gives links to the files and folders to remove on GitHub. Deleting asks you to tick a confirmation box first. The page checks the new file before showing it, and stops if it would be invalid.

The buttons use the `github` setting in `courses.json` (`repo`, `branch`, `folder`). Change it if your repository, branch or folder name differs.

## Reading material

1. Put the files (PDF, Word, Excel) in the session's `readings/` folder, for example `content/macro/2026-27/module-5-is-lm/readings/mankiw-ch11.pdf`.
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

Each session row on the course page has a **Reading Material** link before **Open slides**. It opens a page for that session only. The page shows the file `readings.md` from the session's own folder, for example `content/macro/2026-27/module-5-is-lm/readings.md`.

To add links, open that file on GitHub, click the pencil icon, paste your links, and commit:

```
- [Title of the reading](https://link-to-the-reading)
- [Chapter 11](readings/chapter-11.pdf)
- A book reference with no link
```

The second line opens a file saved in the session's `readings/` folder. Every session folder has a `readings.md`, including the `_new-session/` starter. The Manage page's Add module gives a button that creates it. Editing `readings.md` also changes the session's Updated date.
