/* Landing page and course pages. Both read courses.json.
   <body data-page="home">                         -> list of courses
   <body data-page="course" data-course="macro">   -> one course: current years, Archive, sessions
   Course page addresses:  courses/macro.html (current year)  |  #archive  |  #2025-26 (an archived year)
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
  const isArchived = (y) => y.status === "archived";
  /* "2026-11-05" -> "5 Nov 2026". Anything unreadable is shown as written; a missing date shows a dash. */
  const fmtDate = (v) => {
    if (!v) return "–";
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return v;
    const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  };

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
    const brand = $("brand");
    brand.textContent = s.instructor || "Home";
    if (s.homepage) brand.href = s.homepage;
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
    const current = c.years.filter((y) => !isArchived(y));
    const archived = c.years.filter(isArchived);

    const draw = () => {
      const want = location.hash.replace(/^#/, "");
      const inArchiveList = want === "archive";
      const y = inArchiveList ? null : (c.years.find((x) => x.id === want) || current[0] || archived[0]);
      const inArchive = inArchiveList || (y && isArchived(y));

      const now = current[0];
      const toCurrent = now
        ? `<a class="switch-btn" href="#${esc(now.id)}">‹ Current year ${esc(now.label || now.id)}</a>` : "";
      const toArchive = archived.length ? `<a class="switch-btn" href="#archive">Archive ›</a>` : "";
      const foot = (btn) => `<div class="switch">${btn}</div>`;

      if (inArchiveList) {
        $("main").innerHTML = head(c, "") + archiveList(c, archived) + foot(toCurrent);
      } else if (!y) {
        $("main").innerHTML = head(c, "") + `<div class="notice"><h2>No years yet</h2><p>Add a year for this course in courses.json.</p></div>`;
      } else if (inArchive) {
        $("main").innerHTML = head(c, `<a href="#archive">‹ Archive</a>`) + sessionList(c, y) + foot(toCurrent);
      } else {
        $("main").innerHTML = head(c, "") + sessionList(c, y, true) + (toArchive ? foot(toArchive) : "");
      }
    };
    addEventListener("hashchange", draw);
    draw();
  }

  /* Previous years: one row per archived year. A click opens that year's sessions. */
  function archiveList(c, archived) {
    if (!archived.length) {
      return `<section aria-label="Archive"><div class="notice"><h2>No archived years yet</h2>
        <p>When a year ends, set its <code>status</code> to <code>"archived"</code> in courses.json and it will appear here.</p></div></section>`;
    }
    const rows = archived.map((y) => {
      const n = (y.decks || []).length;
      const sub = [y.programme, y.term].filter(Boolean).join(" · ");
      return `<li><a class="course-link" href="#${esc(y.id)}">
          <div><h2>${esc(y.label || y.id)}</h2>${sub || y.note ? `<p>${esc([sub, y.note].filter(Boolean).join(". "))}</p>` : ""}</div>
          <div class="course-stats">${plural(n, "session", "sessions")}</div>
        </a></li>`;
    }).join("");
    return `<section aria-label="Archive">
        <div class="year-head"><h2>Archive</h2><span class="year-meta">Previous years of teaching</span></div>
        <ul class="course-list">${rows}</ul>
      </section>`;
  }

  /* The sessions of one year, in the order listed in courses.json. */
  function sessionList(c, y, isCurrent) {
    const decks = y.decks || [];
    const list = decks.length
      ? `<div class="deck-head" aria-hidden="true"><span>Session</span><span>Topic</span><span></span><span>Updated</span></div>
        <ol class="deck-list">${decks.map((d, i) => `<li><a class="deck" href="${deckHref(c, y, i, d)}">
            <span class="deck-no">${esc(d.label || "Session " + (i + 1))}</span>
            <span class="deck-title">${esc(d.title)}</span>
            <span class="deck-open">Open slides</span>
            <span class="deck-date"><span class="deck-date-label">Updated </span>${esc(fmtDate(d.updated))}</span>
          </a></li>`).join("")}</ol>`
      : `<div class="notice"><h2>No slides for ${esc(y.label || y.id)} yet</h2>
          <p>Add a session to this year's <code>decks</code> list in courses.json.</p></div>`;
    const meta = [y.programme, y.term, plural(decks.length, "session", "sessions")].filter(Boolean).map(esc).join(" · ");
    return `<section aria-label="Sessions for ${esc(y.label || y.id)}">
        <div class="year-head"><h2>${esc(y.label || y.id)} sessions${isCurrent ? ' <small class="now">Current</small>' : ""}</h2><span class="year-meta">${meta}</span></div>
        ${y.note ? `<p class="year-note">${esc(y.note)}</p>` : ""}
        ${list}
      </section>`;
  }

  function head(c, extraCrumb) {
    return `<p class="crumb"><a href="${url("index.html")}">‹ All courses</a>${extraCrumb ? ` <span class="crumb-sep">/</span> ${extraCrumb}` : ""}</p>
      <h1 class="page-title">${esc(c.title)}</h1>
      <p class="lede">${esc(c.description)}</p>`;
  }

  init();
})();
