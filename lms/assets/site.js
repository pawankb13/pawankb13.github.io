/* Landing page and course pages. Both read courses.json.
   <body data-page="home">                         -> list of courses
   <body data-page="course" data-course="macro">   -> one course, years of teaching, slide decks
   data-root points from the page to the site folder ("." or ".."). */
(() => {
  "use strict";

  const body = document.body;
  const root = body.dataset.root || ".";
  const url = (p) => root + "/" + p;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const coursePage = (c) => url(c.page || `courses/${c.id}.html`);
  const isHtmlDeck = (d) => /\.html?$/i.test(d.file || "");
  const deckHref = (c, y, i, d) => isHtmlDeck(d) ? url(d.file) : url("slides.html") + `#${c.id}-${y.id}-${i + 1}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  async function init() {
    let data;
    try {
      const res = await fetch(url("courses.json"), { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (err) {
      $("main").innerHTML = `<div class="notice"><h2>The course list did not load</h2>
        <p>The site reads <code>courses.json</code> through the browser. Browsers block this when a page is
        opened straight from a folder. Run a local server or publish on GitHub Pages. The README explains both.</p></div>`;
      return;
    }
    const s = data.site || {};
    $("brand").textContent = s.instructor || "Courses";
    $("site-sub").textContent = s.institution || "";
    $("foot").textContent = [s.instructor, s.institution].filter(Boolean).join(", ");
    if (body.dataset.page === "course") renderCourse(data);
    else renderHome(data);
  }

  function renderHome(data) {
    const s = data.site || {};
    const rows = data.courses.filter((c) => !c.hidden).map((c) => {
      const decks = c.years.reduce((n, y) => n + (y.decks || []).length, 0);
      return `<li><a class="course-link" href="${coursePage(c)}">
          <div><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p></div>
          <div class="course-stats">${plural(decks, "slide deck", "slide decks")}</div>
        </a></li>`;
    }).join("");
    $("main").innerHTML = `
      <h1 class="page-title">${esc(s.title || "Courses")}</h1>
      <p class="lede">${esc(s.intro || "")}</p>
      <ul class="course-list">${rows}</ul>`;
  }

  function renderCourse(data) {
    const c = data.courses.find((x) => x.id === body.dataset.course);
    if (!c) {
      $("main").innerHTML = `<div class="notice"><h2>Course not found</h2>
        <p>No course with id <code>${esc(body.dataset.course)}</code> in courses.json.</p></div>`;
      return;
    }
    document.title = c.title;

    const draw = () => {
      const want = location.hash.replace(/^#/, "");
      const y = c.years.find((x) => x.id === want) || c.years.find((x) => x.status === "current") || c.years[0];
      if (!y) {
        $("main").innerHTML = head(c) + `<div class="notice"><h2>No years yet</h2><p>Add a year for this course in courses.json.</p></div>`;
        return;
      }
      const pills = c.years.map((yr) => {
        const cur = yr.id === y.id ? ' aria-current="page"' : "";
        const tag = yr.status === "current" ? " <small>Current</small>" : "";
        return `<a class="year-pill" href="#${esc(yr.id)}"${cur}>${esc(yr.label || yr.id)}${tag}</a>`;
      }).join("");

      const decks = y.decks || [];
      const list = decks.length
        ? `<ol class="deck-list">${decks.map((d, i) => `<li><a class="deck" href="${deckHref(c, y, i, d)}">
              <span class="deck-no">${esc(d.label || "Deck " + (i + 1))}</span>
              <span class="deck-title">${esc(d.title)}</span>
              <span class="deck-open">Open slides<span class="deck-kind">${isHtmlDeck(d) ? "HTML file" : "Markdown"}</span></span>
            </a></li>`).join("")}</ol>`
        : `<div class="notice"><h2>No slides for ${esc(y.label || y.id)} yet</h2>
            <p>Add a deck to this year's <code>decks</code> list in courses.json.</p></div>`;

      const meta = [y.programme, y.term, plural(decks.length, "deck", "decks")].filter(Boolean).map(esc).join(" · ");
      $("main").innerHTML = head(c) + `
        <section class="years" aria-label="Year of teaching">
          <span class="label">Year of teaching</span>
          <nav class="year-nav">${pills}</nav>
        </section>
        <section aria-label="Slides for ${esc(y.label || y.id)}">
          <div class="year-head"><h2>${esc(y.label || y.id)} lecture slides</h2><span class="year-meta">${meta}</span></div>
          ${y.note ? `<p class="year-note">${esc(y.note)}</p>` : ""}
          ${list}
        </section>`;
    };
    addEventListener("hashchange", draw);
    draw();
  }

  function head(c) {
    return `<p class="crumb"><a href="${url("index.html")}">‹ All courses</a></p>
      <h1 class="page-title">${esc(c.title)}</h1>
      <p class="lede">${esc(c.description)}</p>`;
  }

  init();
})();
