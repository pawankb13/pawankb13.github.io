/* Reading material for one session.
   Address:  readings.html#<course>-<year>-<session number>   (same as the slides address)
   The content comes from readings.md in that session's own folder. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function init() {
    let data;
    try {
      const res = await fetch("courses.json", { cache: "no-cache" });
      if (!res.ok) throw new Error();
      data = await res.json();
    } catch (e) {
      $("main").innerHTML = `<div class="notice"><h2>The page did not load</h2><p>Open the site from GitHub Pages or a local server.</p></div>`;
      return;
    }
    const s = data.site || {};
    $("brand").textContent = s.instructor || "Home";
    if (s.homepage) $("brand").href = s.homepage;
    $("site-sub").textContent = s.institution || "";
    $("foot").textContent = [s.instructor, s.institution].filter(Boolean).join(", ");

    const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    let found = null;
    data.courses.forEach((c) => c.years.forEach((y) => {
      const pre = `${c.id}-${y.id}-`;
      if (hash.startsWith(pre) && /^\d+$/.test(hash.slice(pre.length))) {
        const d = (y.decks || [])[parseInt(hash.slice(pre.length), 10) - 1];
        if (d) found = { c, y, d, n: parseInt(hash.slice(pre.length), 10) };
      }
    }));
    if (!found) {
      $("main").innerHTML = `<div class="notice"><h2>Session not found</h2><p>Open this page from the Reading Material link on a course page.</p></div>`;
      return;
    }
    const { c, y, d, n } = found;
    document.title = `Reading: ${d.title}`;
    const folder = d.file.replace(/[^\/]*$/, "");
    const mdUrl = new URL(folder + "readings.md", location.href);
    const back = `courses/${c.id}.html` + (y.status === "archived" ? `#${y.id}` : "");
    const slides = /\.html?$/i.test(d.file) ? d.file : `slides.html#${c.id}-${y.id}-${n}`;

    $("main").innerHTML = `
      <p class="crumb"><a href="${esc(back)}">\u2039 ${esc(c.title)}</a></p>
      <h1 class="page-title">Reading Material</h1>
      <p class="lede">${esc(c.title)} \u00b7 ${esc(y.label || y.id)} \u00b7 ${esc(d.label ? d.label + ": " : "")}${esc(d.title)}</p>
      <div class="reading-body" id="body"></div>
      <p class="reading-actions"><a class="switch-btn" href="${esc(slides)}">Open slides</a></p>`;

    let md = "";
    try {
      const r = await fetch(mdUrl, { cache: "no-cache" });
      if (r.ok) md = await r.text();
    } catch (e) { /* shown as empty below */ }
    const box = $("body");
    box.innerHTML = window.marked ? marked.parse(md) : `<pre>${esc(md)}</pre>`;
    /* Links to files in the session folder (readings/...) are found next to readings.md. */
    box.querySelectorAll("a[href]").forEach((a) => {
      const h = a.getAttribute("href");
      if (!/^([a-z][a-z0-9+.-]*:|\/\/|#|\?)/i.test(h)) a.href = new URL(h, mdUrl).href;
      if (/^https?:/i.test(a.href)) { a.target = "_blank"; a.rel = "noopener"; }
    });
    box.querySelectorAll("img[src]").forEach((im) => {
      const h = im.getAttribute("src");
      if (!/^([a-z][a-z0-9+.-]*:|\/\/|data:)/i.test(h)) im.src = new URL(h, mdUrl).href;
    });
    if (!box.textContent.trim() && !box.querySelector("img")) {
      box.innerHTML = `<p class="year-note">No reading material has been added for this session yet.</p>`;
    }
  }
  addEventListener("hashchange", () => location.reload());
  init();
})();
