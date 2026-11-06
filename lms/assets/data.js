/* Reads courses.json and every course's sessions.json, fills in the defaults, and gives every page
   the same shape: courses -> years -> decks. Loaded before site.js, slides.js and readings.js.
   Gives them window.LMS.

   Files:
     courses.json                                    site settings, the courses, the years (newest first)
     content/active/<year>/<course>/sessions.json    the current year's sessions of one course
     content/archive/<year>/<course>/sessions.json   an archived year's sessions of one course
   Each session's folder sits next to its sessions.json.

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

  /* Where a year's folders are: content/active/2026-27/ for the current year, content/archive/2025-26/ for past ones. */
  const yearFolder = (y) => `content/${y.status === "archived" ? "archive" : "active"}/${y.id}/`;
  const courseFolder = (y, courseId) => yearFolder(y) + courseId + "/";
  const sessionsFile = (y, courseId) => courseFolder(y, courseId) + "sessions.json";
  /* Files used by several sessions of a course: content/shared/<course>/ */
  const sharedFolder = (c) => `content/shared/${c.id}/`;

  /* base: the course folder for that year. A session names its "folder"; its slides are <folder>/slides.md
     unless it sets "file". The Slide Templates decks give the full "file" path instead. */
  function deck(d, i, base) {
    const label = d.label || [d.type, d.number].filter((v) => v !== undefined && v !== "").join(" ");
    const file = d.folder ? base + d.folder + "/" + (d.file || "slides.md") : d.file || "";
    const fallbackId = d.folder || String(file).replace(/\/[^\/]*$/, "").replace(/^.*\//, "");
    return Object.assign({}, d, {
      id: String(d.id || fallbackId || i + 1),
      file, label, index: i, visibility: visibility(d), updated: d.updated || "",
    });
  }

  /* files: { "<year>/<course>": the parsed sessions.json, or null when it is missing } */
  function normalise(raw, files) {
    files = files || {};
    const years = raw.years || [];
    const courses = (raw.courses || []).map((c) => {
      const ys = years.filter((y) => (y.courses || []).includes(c.id)).map((y) => {
        const f = files[y.id + "/" + c.id];
        const s = f || {};
        return {
          id: y.id, label: s.label || y.label || y.id, status: y.status || "current",
          programme: s.programme ?? c.programme ?? "", term: s.term || y.term || "", note: s.note || y.note || "",
          sessionsFile: sessionsFile(y, c.id), missing: f === null,
          decks: (s.sessions || []).map((d, i) => deck(d, i, courseFolder(y, c.id))),
        };
      });
      return Object.assign({}, c, { description: c.description || "", visibility: visibility(c), years: ys });
    });
    const t = raw.templates;
    if (t) courses.push({
      id: "templates", title: t.title || "Slide Templates", description: t.description || "", visibility: "unlisted",
      years: [{ id: "reference", label: t.label || "Reference", status: "current", programme: "", term: "",
        note: t.note || "", decks: (t.decks || []).map((d, i) => deck(d, i, "")) }],
    });
    return { site: raw.site || {}, courses };
  }

  /* Fetches every sessions.json listed in courses.json. A missing or broken one gives null. */
  async function loadFiles(raw, root) {
    const base = (root || ".") + "/";
    const jobs = [];
    (raw.years || []).forEach((y) => (y.courses || []).forEach((cid) => {
      jobs.push(fetch(base + sessionsFile(y, cid), { cache: "no-cache" })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null)
        .then((json) => [y.id + "/" + cid, json]));
    }));
    return Object.fromEntries(await Promise.all(jobs));
  }

  async function loadRaw(root) {
    const res = await fetch((root || ".") + "/courses.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw = await res.json();
    return { raw, files: await loadFiles(raw, root) };
  }

  async function load(root) {
    const { raw, files } = await loadRaw(root);
    return normalise(raw, files);
  }

  const listed = (x) => x.visibility === "public";    /* shown in lists and counts */
  const opens = (x) => x.visibility !== "hidden";     /* its page or slides can be opened */
  const key = (c, y, d) => [c.id, y.id, d.id].map(encodeURIComponent).join("/");
  /* Address of a course page, relative to the site folder. One page, course.html, serves every course.
     Add "#<year id>" to open an archived year. A course can point elsewhere with "page" in courses.json. */
  const coursePage = (c) => c.page || "course.html?c=" + encodeURIComponent(c.id);
  /* A path in a session's slides.md or readings.md, made into a full address. fileUrl is that file's address,
     sharedUrl the address of the course's shared folder. Most paths are relative to the session folder
     (images/x.png). A path starting with shared/ points to content/shared/<course>/. */
  const resolve = (path, fileUrl, sharedUrl) =>
    /^shared\//.test(path) && sharedUrl ? new URL(path.slice(7), sharedUrl).href : new URL(path, fileUrl).href;

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

  window.LMS = { load, loadRaw, normalise, find, key, coursePage, resolve, sharedFolder,
    yearFolder, courseFolder, sessionsFile, listed, opens };
})();
