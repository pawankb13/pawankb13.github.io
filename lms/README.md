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
{ "title": "The Monetary System", "label": "Module 4", "file": "content/macro/2026-27/module-4-money/slides.md" }
```

The order of the list is the order on the course page.

## Add a new year of teaching

Add a year to the course's `years` list in `courses.json`. Put the newest year first, mark it `"status": "current"`, and change the old year to `"archived"`. Then create `content/<course>/<year>/`.

```json
{ "id": "2027-28", "label": "2027-28", "status": "current", "programme": "PGDM", "term": "Term II", "note": "One line about this offering.", "decks": [] }
```

## Add a new course

1. Add the course to `courses.json` with a short lowercase `id` (letters and numbers only).
2. Copy any file in `courses/`, rename it `<id>.html`, and change `data-course="..."` and the `<title>`.

## Writing slides

| You type | You get |
|---|---|
| A line with only `---` | A new slide |
| A line with only three bars | Splits the slide into columns |
| `Note:` on its own line | Speaker notes, hidden from students |
| `$x^2$` and `$$ ... $$` | Equations (LaTeX) |
| `<!-- layout: name -->` as the first line | A slide template (below) |

The first slide is the title slide. Text shrinks if a slide holds too much.

## Slide templates

Open **Slide Templates** (`slides.html#templates-2026-27-1`) to see every layout. Its source is `content/templates/2026-27/all-layouts/slides.md`. Copy a slide from it and change the content.

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
| `references` | Reading list |
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
- F: full screen. N: speaker notes.
- Each slide has its own address, for example `slides.html#macro-2026-27-2-4` (course, year, deck, slide).
- Swipe on a phone or tablet.

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
