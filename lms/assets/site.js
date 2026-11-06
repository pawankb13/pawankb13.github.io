/* Landing page and course pages. Both read courses.json through assets/data.js (window.LMS).
   <body data-page="home">                         -> list of courses
   <body data-page="course">                       -> one course (course.html?c=macro): current years, Archive, sessions
   Course page addresses:  course.html?c=macro (current year)  |  ...#archive  |  ...#2025-26 (an archived year)
   (data-course="macro" on the body still works, for a page made for one course.)
   data-root points from the page to the site folder ("." or ".."). */
(() => {
  "use strict";

  const body = document.body;
  const root = body.dataset.root || ".";
  const url = (p) => root + "/" + p;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const coursePage = (c) => url(LMS.coursePage(c));
  const isHtmlDeck = (d) => /\.html?$/i.test(d.file || "");
  const deckHref = (c, y, d) => isHtmlDeck(d) ? url(d.file) : url("slides.html") + "#" + LMS.key(c, y, d);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const isArchived = (y) => y.status === "archived";
  const { listed, opens } = LMS;   /* visibility: public = listed, unlisted = opens from a link only, hidden = off */
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
      data = await LMS.load(root);
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
    const rows = data.courses.filter(listed).map((c) => {
      const decks = c.years.reduce((n, y) => n + y.decks.filter(listed).length, 0);
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
    const id = body.dataset.course || new URLSearchParams(location.search).get("c") || "";
    const c = data.courses.find((x) => x.id === id);
    if (c && !opens(c)) {
      $("main").innerHTML = `<div class="notice"><h2>Course not available</h2>
        <p>This course is not open yet. <a href="${url("index.html")}">See all courses</a>.</p></div>`;
      return;
    }
    if (!c) {
      $("main").innerHTML = `<div class="notice"><h2>Course not found</h2>
        <p>No course with id <code>${esc(id)}</code> in courses.json. <a href="${url("index.html")}">See all courses</a>.</p></div>`;
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
      sortState.key = ""; sortState.dir = 1;

      if (inArchiveList) {
        $("main").innerHTML = head(c, "") + archiveList(c, archived) + foot(toCurrent);
      } else if (!y) {
        $("main").innerHTML = head(c, "") + `<div class="notice"><h2>No years yet</h2><p>Add this course to a year's <code>courses</code> list in courses.json.</p></div>`;
      } else if (inArchive) {
        $("main").innerHTML = head(c, `<a href="#archive">‹ Archive</a>`) + sessionList(c, y) + foot(toCurrent);
        bindSort(c, y);
      } else {
        $("main").innerHTML = head(c, "") + sessionList(c, y, true) + (toArchive ? foot(toArchive) : "");
        bindSort(c, y);
      }
    };
    addEventListener("hashchange", draw);
    draw();
  }

  /* Previous years: one row per archived year. A click opens that year's sessions. */
  function archiveList(c, archived) {
    if (!archived.length) {
      return `<section aria-label="Archive"><div class="notice"><h2>No archived years yet</h2>
        <p>When you start a new year with <code>python lms.py</code>, the current year moves here.</p></div></section>`;
    }
    const rows = archived.map((y) => {
      const n = y.decks.filter(listed).length;
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

  /* The sessions of one year. Order follows sessions.json until a column heading is clicked. */
  const sortState = { key: "", dir: 1 };
  const num = (s) => { const m = /\d+/.exec(s || ""); return m ? parseInt(m[0], 10) : Infinity; };
  function sortedDecks(decks) {
    const rows = decks.filter(listed).map((d) => ({ d, i: d.index }));
    const { key, dir } = sortState;
    if (!key) return rows;
    rows.sort((p, q) => {
      let r;
      if (key === "updated") {
        const a = p.d.updated || "", b = q.d.updated || "";
        if (!a && !b) return p.i - q.i;
        if (!a) return 1;           /* no date: always last */
        if (!b) return -1;
        r = a < b ? -1 : a > b ? 1 : 0;
      } else {
        r = (p.d.number ?? num(p.d.label)) - (q.d.number ?? num(q.d.label));
        if (!r || !isFinite(r)) r = String(p.d.label || "").localeCompare(String(q.d.label || ""), undefined, { numeric: true });
      }
      return r * dir || p.i - q.i;
    });
    return rows;
  }
  function sortBtn(key, text) {
    const on = sortState.key === key;
    const up = on && sortState.dir === 1, down = on && sortState.dir === -1;
    return `<button type="button" class="sort${on ? " on" : ""}" data-sort="${key}" aria-label="Sort by ${text.toLowerCase()}, ${up ? "now ascending" : down ? "now descending" : "not sorted"}">
        ${text}<span class="arrows" aria-hidden="true"><span class="${up ? "act" : ""}">▲</span><span class="${down ? "act" : ""}">▼</span></span></button>`;
  }
  const readingsHref = (c, y, d) => url("readings.html") + "#" + LMS.key(c, y, d);
  function deckRows(c, y, decks) {
    return `<ol class="deck-list">${sortedDecks(decks).map(({ d, i }) => `<li class="deck">
            <span class="deck-no">${esc(d.label || "Session " + (i + 1))}</span>
            <a class="deck-title" href="${deckHref(c, y, d)}">${esc(d.title)}</a>
            <span class="deck-links">
              <a class="deck-read" href="${readingsHref(c, y, d)}">Reading Material</a>
              <a class="deck-open" href="${deckHref(c, y, d)}">Open slides</a>
            </span>
            <span class="deck-date"><span class="deck-date-label">Updated </span>${esc(fmtDate(d.updated))}</span>
          </li>`).join("")}</ol>`;
  }
  function deckTable(c, y, decks) {
    return `<div class="deck-head" role="group" aria-label="Sort sessions">${sortBtn("session", "Type")}<span class="head-topic">Topic</span><span class="head-gap"></span>${sortBtn("updated", "Updated")}</div>
        ${deckRows(c, y, decks)}`;
  }
  function bindSort(c, y) {
    const wrap = $("deck-wrap");
    if (!wrap) return;
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sort]");
      if (!b) return;
      const key = b.dataset.sort;
      if (sortState.key === key) sortState.dir = -sortState.dir; else { sortState.key = key; sortState.dir = 1; }
      wrap.innerHTML = deckTable(c, y, y.decks);
      const again = wrap.querySelector(`[data-sort="${key}"]`);
      if (again) again.focus();
    });
  }
  function sessionList(c, y, isCurrent) {
    const decks = y.decks.filter(listed);
    const list = decks.length
      ? `<div id="deck-wrap">${deckTable(c, y, y.decks)}</div>`
      : y.missing
      ? `<div class="notice"><h2>Sessions file missing</h2>
          <p>courses.json lists this course for ${esc(y.label || y.id)}, but <code>${esc(y.sessionsFile)}</code> was not found.</p></div>`
      : `<div class="notice"><h2>No slides for ${esc(y.label || y.id)} yet</h2>
          <p>Add a session to <code>${esc(y.sessionsFile || "sessions.json")}</code>.</p></div>`;
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
