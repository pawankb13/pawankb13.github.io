/* Reads courses.json and fills in the defaults, so every page sees the same shape.
   Loaded before site.js, slides.js and readings.js. Gives them window.LMS.

   Session address:  #<course>/<year>/<session id>[/<slide number>]   e.g. #macro/2026-27/is-lm/4
   Older addresses (#macro-2026-27-2-4, by position in the list) still open. */
(() => {
  "use strict";
  const LEVELS = ["public", "unlisted", "hidden"];

  /* "public" unless set. Older files used "show": "No" (hidden) and "hidden": true (unlisted). */
  function visibility(x) {
    if (LEVELS.includes(x.visibility)) return x.visibility;
    if (x.show !== undefined && /^(no|false)$/i.test(String(x.show).trim())) return "hidden";
    if (x.hidden === true) return "unlisted";
    return "public";
  }
  const folderName = (file) => String(file || "").replace(/\/[^\/]*$/, "").replace(/^.*\//, "");

  function deck(d, i) {
    const label = d.label || [d.type, d.number].filter((v) => v !== undefined && v !== "").join(" ");
    return Object.assign({}, d, {
      id: String(d.id || folderName(d.file) || i + 1),
      label, index: i, visibility: visibility(d),
    });
  }
  function year(y, c) {
    return Object.assign({}, y, {
      label: y.label || y.id, status: y.status || "current",
      programme: y.programme ?? c.programme ?? "", term: y.term || "", note: y.note || "",
      decks: (y.decks || []).map(deck),
    });
  }
  function course(c) {
    return Object.assign({}, c, {
      description: c.description || "", visibility: visibility(c),
      years: (c.years || []).map((y) => year(y, c)),
    });
  }

  function normalise(raw) {
    const list = (raw.courses || []).slice();
    const t = raw.templates;
    if (t) list.push({
      id: "templates", title: t.title || "Slide Templates", description: t.description, visibility: "unlisted",
      years: [{ id: "reference", label: t.label || "Reference", status: "current", note: t.note, decks: t.decks || [] }],
    });
    return { site: raw.site || {}, courses: list.map(course) };
  }

  async function load(root) {
    const res = await fetch((root || ".") + "/courses.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return normalise(await res.json());
  }

  const listed = (x) => x.visibility === "public";    /* shown in lists and counts */
  const opens = (x) => x.visibility !== "hidden";     /* its page or slides can be opened */
  const key = (c, y, d) => [c.id, y.id, d.id].map(encodeURIComponent).join("/");
  /* Address of a course page, relative to the site folder. One page, course.html, serves every course.
     Add "#<year id>" to open an archived year. A course can point elsewhere with "page" in courses.json. */
  const coursePage = (c) => c.page || "course.html?c=" + encodeURIComponent(c.id);
  /* A path in a session's slides.md or readings.md, made into a full address. fileUrl is that file's address.
     Most paths are relative to the session folder (images/x.png). A path starting with shared/ points to
     the course's shared folder, content/<course>/shared/, two folders up from the session. */
  const resolve = (path, fileUrl) =>
    /^shared\//.test(path) ? new URL("../../" + path, fileUrl).href : new URL(path, fileUrl).href;

  /* Finds the session in an address. Returns null when it does not exist or is hidden. */
  function find(data, hash) {
    const h = decodeURIComponent(String(hash || "").replace(/^#/, ""));
    let c, y, d, slide = 0;
    const p = h.split("/");
    if (p.length >= 3) {
      c = data.courses.find((x) => x.id === p[0]);
      y = c && c.years.find((x) => x.id === p[1]);
      d = y && y.decks.find((x) => x.id === p[2]);
      slide = parseInt(p[3], 10) || 0;
    } else {
      const m = h.match(/^([a-z0-9]+)-(\d{4}-\d{2})-(\d+)(?:-(\d+))?$/i);
      if (m) {
        c = data.courses.find((x) => x.id === m[1]);
        y = c && c.years.find((x) => x.id === m[2]);
        d = y && y.decks[+m[3] - 1];
        slide = +m[4] || 0;
      }
    }
    if (!c || !y || !d || !opens(c) || !opens(d)) return null;
    return { c, y, d, slide };
  }

  window.LMS = { load, normalise, find, key, coursePage, resolve, listed, opens };
})();
