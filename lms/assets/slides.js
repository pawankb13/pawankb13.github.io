/* Slide viewer for Markdown decks.
   Address: slides.html#<course>-<year>-<deck number>[-<slide number>]   e.g. #macro-2026-27-2-4
   In a deck file:  a line with only ---    starts a new slide
                    a line with only |||    splits the slide into columns
                    a line starting Note:   begins speaker notes (hidden from the slide)
                    <!-- layout: name option -->   first line of a slide, picks a template (see README)
                    @[Title](interactives/file.html)   embeds an HTML interactive in the slide
   Keys: Right/Space/PageDown next, Left/PageUp previous, Home/End, F full screen, N notes, P print. */
(() => {
  "use strict";

  const W = 1280, H = 720, BASE = 30, MIN = 18;
  const root = document.body.dataset.root || ".";
  const url = (p) => root + "/" + p;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const st = { slides: [], notes: [], i: 0, key: "", showNotes: false, allowNotes: true };

  /* ---------- Load ---------- */
  async function init() {
    const m = location.hash.replace(/^#/, "").match(/^([a-z0-9]+)-(\d{4}-\d{2})-(\d+)(?:-(\d+))?$/i);
    let data;
    try {
      const res = await fetch(url("courses.json"), { cache: "no-cache" });
      if (!res.ok) throw new Error();
      data = await res.json();
    } catch (e) {
      return fail("The course list did not load", "Open the site through a web server or GitHub Pages. The README explains how.");
    }
    st.allowNotes = (data.site || {}).showNotes !== false;
    $("notes-btn").hidden = !st.allowNotes;
    if (!m) return fail("No deck selected", "Open a deck from a course page.");
    const c = data.courses.find((x) => x.id === m[1]);
    const y = c && c.years.find((x) => x.id === m[2]);
    const d = y && (y.decks || [])[+m[3] - 1];
    if (!d) return fail("Deck not found", "Check the deck list in courses.json.");

    st.key = `${c.id}-${y.id}-${m[3]}`;
    st.deckUrl = new URL(url(d.file), location.href).href;
    const back = url(c.page || `courses/${c.id}.html`) + "#" + y.id;
    $("back").href = back;
    $("deck-course").textContent = `${c.title} · ${y.label || y.id}`;
    $("deck-title").textContent = d.title;
    document.title = d.title;

    let src;
    try {
      const res = await fetch(url(d.file), { cache: "no-cache" });
      if (!res.ok) throw new Error();
      src = await res.text();
    } catch (e) {
      return fail("Slides file not found", `Create ${d.file}, or fix its path in courses.json.`);
    }
    build(src, `${c.title} · ${y.label || y.id}`);
    show(Math.max(0, Math.min(st.slides.length - 1, (+m[4] || 1) - 1)));
    typesetAll();
  }

  function fail(title, msg) {
    $("stage").innerHTML = `<section class="slide"><h2>${esc(title)}</h2><p>${esc(msg)}</p></section>`;
    $("counter").textContent = "";
    fit();
  }

  /* ---------- Parse and render ---------- */
  /* A line with only --- starts a new slide. Lines inside a code block are left alone. */
  function splitSlides(src) {
    const out = []; let cur = [], fence = null;
    for (const line of src.split("\n")) {
      const f = line.match(/^[ \t]*(`{3,}|~{3,})/);
      if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; }
      if (!fence && /^[ \t]*---[ \t]*$/.test(line)) { out.push(cur.join("\n")); cur = []; }
      else cur.push(line);
    }
    out.push(cur.join("\n"));
    return out.map((x) => x.trim()).filter(Boolean);
  }

  function build(src, footText) {
    const chunks = splitSlides(src.replace(/\r\n?/g, "\n"));
    const stage = $("stage");
    stage.innerHTML = "";
    chunks.forEach((chunk, i) => {
      const parts = chunk.split(/^Note:[ \t]*/m);
      const content = parts[0];
      st.notes.push(parts.slice(1).join("\n").trim());

      const sec = document.createElement("section");
      const lay = parseLayout(content);
      const titleLike = lay.name ? (lay.name === "title" || lay.name === "end") : i === 0;
      sec.className = "slide" + (lay.name ? ` layout-${lay.name}` : "") +
        lay.opts.map((o) => " opt-" + o).join("") + (titleLike ? " is-title" : "");
      sec.hidden = true;
      sec.setAttribute("aria-label", `Slide ${i + 1} of ${chunks.length}`);
      sec.innerHTML = resolveSrc(renderLayout(lay)) +
        `<div class="slide-foot"><span>${esc(footText)}</span><span>${i + 1} / ${chunks.length}</span></div>`;
      stage.appendChild(sec);
      st.slides.push(sec);
    });
    stage.querySelectorAll("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    runScripts(stage);
    stage.querySelectorAll(".interactive iframe").forEach((f) => f.addEventListener("load", () => sendTheme(f)));
  }

  /* ---------- Layouts: <!-- layout: name option --> as the first line of a slide ---------- */
  /* Images, interactives and scripts in a deck are found next to the deck's own file. */
  function resolveSrc(html) {
    if (!st.deckUrl) return html;
    return html.replace(/(\ssrc=")([^"]+)(")/g, (m, a, p, z) =>
      /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(p) ? m : a + new URL(p, st.deckUrl).href + z);
  }

  function parseLayout(src) {
    const m = src.match(/^\s*<!--\s*layout:\s*([a-z0-9-]+)((?:[ \t]+[a-z0-9-]+)*)\s*-->\s*/i);
    if (!m) return { name: "", opts: [], body: src };
    const opts = m[2].trim() ? m[2].trim().toLowerCase().split(/\s+/) : [];
    return { name: m[1].toLowerCase(), opts, body: src.slice(m[0].length) };
  }

  const IMG_ONE = /^!\[([^\]]*)\]\(([^)\s]+)\)[ \t]*$/m;
  const IMG_ALL = /^!\[([^\]]*)\]\(([^)\s]+)\)[ \t]*$/gm;
  const EMBED_ONE = /^@\[([^\]]*)\]\(([^)\s]+)\)[ \t]*$/m;

  function figure(alt, src) {
    return `<figure class="media"><img src="${esc(src)}" alt="${esc(alt)}">${alt ? `<figcaption>${esc(alt)}</figcaption>` : ""}</figure>`;
  }
  function embedHtml(title, path) {
    return `<div class="interactive"><iframe src="${esc(path)}" title="${esc(title || "Interactive")}" loading="lazy" allow="fullscreen; encrypted-media" allowfullscreen></iframe></div>`;
  }
  function splitHtml(text, sideHtml, sideFirst) {
    let head = "";
    const h = text.match(/^\s*(#{1,6} [^\n]*)\n?/);
    if (h) { head = renderMarkdown(h[1]); text = text.slice(h[0].length); }
    const t = `<div class="col col-text">${renderMarkdown(text.trim())}</div>`;
    const m = `<div class="col col-media">${sideHtml}</div>`;
    return head + `<div class="cols split">${sideFirst ? m + t : t + m}</div>`;
  }

  function renderLayout(lay) {
    const md = lay.body, n = lay.name;
    let m;
    if ((n === "image-left" || n === "image-right") && (m = IMG_ONE.exec(md))) {
      return splitHtml(md.replace(m[0], ""), figure(m[1], m[2]), n === "image-left");
    }
    if ((n === "interactive-left" || n === "interactive-right") && (m = EMBED_ONE.exec(md))) {
      return splitHtml(md.replace(m[0], ""), embedHtml(m[1], m[2]), n === "interactive-left");
    }
    if (n === "image-full" && (m = IMG_ONE.exec(md))) {
      const rest = md.replace(m[0], "").trim();
      return `<img class="bg" src="${esc(m[2])}" alt="${esc(m[1])}">` +
        (rest ? `<div class="band">${renderMarkdown(rest)}</div>` : "") +
        (m[1] ? `<span class="credit">${esc(m[1])}</span>` : "");
    }
    if (n === "image-grid") {
      const figs = [...md.matchAll(IMG_ALL)].map((x) => figure(x[1], x[2]));
      if (figs.length) {
        const rest = md.replace(IMG_ALL, "").trim();
        return renderMarkdown(rest) + `<div class="grid" style="--n:${Math.min(figs.length, 4)}">${figs.join("")}</div>`;
      }
    }
    return renderSlide(md);
  }

  function renderSlide(md) {
    if (!/^[ \t]*\|\|\|[ \t]*$/m.test(md)) return renderMarkdown(md);
    let head = "";
    const h = md.match(/^\s*(#{1,6} [^\n]*)\n/);
    if (h) { head = renderMarkdown(h[1]); md = md.slice(h[0].length); }
    const cols = md.split(/^[ \t]*\|\|\|[ \t]*$/m).map((s) => s.trim()).filter(Boolean);
    return head + `<div class="cols" style="--n:${cols.length}">` +
      cols.map((c) => `<div class="col">${renderMarkdown(c)}</div>`).join("") + `</div>`;
  }

  /* Protect code and scripts, then protect LaTeX from the Markdown parser. */
  function renderMarkdown(src) {
    const code = [], math = [];
    src = src.replace(/^@\[([^\]]*)\]\(([^)\s]+)\)[ \t]*$/gm, (m, title, path) => `\n${embedHtml(title, path)}\n`);
    src = src.replace(/<script[\s\S]*?<\/script>|```[\s\S]*?```|`[^`\n]+`/g, (m) => { code.push(m); return `CODESLOT${code.length - 1}END`; });
    const keep = (m) => { math.push(m); return `MATHSLOT${math.length - 1}END`; };
    src = src
      .replace(/\$\$[\s\S]+?\$\$/g, keep)
      .replace(/\\\[[\s\S]+?\\\]/g, keep)
      .replace(/\\\([\s\S]+?\\\)/g, keep)
      .replace(/(^|[^\\$\w])\$(?=[^\s$])([^$\n]*?[^\s$\\])\$(?!\d)/g, (m, pre, b) => pre + keep("\\(" + b + "\\)"));
    src = src.replace(/CODESLOT(\d+)END/g, (m, n) => code[+n]);
    const html = window.marked ? window.marked.parse(src, { gfm: true }) : `<pre>${esc(src)}</pre>`;
    return html.replace(/MATHSLOT(\d+)END/g, (m, n) => esc(math[+n]));
  }

  /* Scripts written inside a deck (for interactive graphs) run once the deck loads. */
  function runScripts(node) {
    node.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const a of old.attributes) s.setAttribute(a.name, a.value);
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  function typesetAll() {
    const MJ = window.MathJax;
    if (MJ && typeof MJ.typesetPromise === "function") {
      MJ.typesetPromise([$("stage")]).then(() => fitSlide(st.slides[st.i])).catch(() => {});
    }
  }
  addEventListener("mathjax-ready", () => { if (st.slides.length) typesetAll(); });

  /* ---------- Show and fit ---------- */
  function show(i) {
    if (!st.slides.length) return;
    i = Math.max(0, Math.min(st.slides.length - 1, i));
    st.slides[st.i].hidden = true;
    st.i = i;
    const s = st.slides[i];
    s.hidden = false;
    fitSlide(s);
    const n = st.slides.length;
    $("counter").textContent = `${i + 1} / ${n}`;
    $("bar").style.width = `${((i + 1) / n) * 100}%`;
    $("prev").disabled = i === 0;
    $("next").disabled = i === n - 1;
    renderNotes();
    try { history.replaceState(null, "", `#${st.key}-${i + 1}`); } catch (e) { /* ignore */ }
  }

  /* Shrink text on a slide that holds too much, so nothing is cut off. */
  function fitSlide(s) {
    if (!s) return;
    let size = BASE;
    s.style.setProperty("--fs", size + "px");
    while (s.scrollHeight > s.clientHeight + 1 && size > MIN) {
      size -= 1;
      s.style.setProperty("--fs", size + "px");
    }
  }

  function fit() {
    const vp = $("viewport");
    const cs = getComputedStyle(vp);
    const w = vp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const h = vp.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const k = Math.max(0.1, Math.min(w / W, h / H));
    $("frame").style.width = W * k + "px";
    $("frame").style.height = H * k + "px";
    $("stage").style.transform = `scale(${k})`;
  }

  function renderNotes() {
    const box = $("notes");
    box.hidden = !st.showNotes;
    if (!st.showNotes) return;
    const txt = st.notes[st.i];
    box.innerHTML = `<span class="label">Speaker notes</span>` +
      (txt ? renderMarkdown(txt) : `<p>No notes for this slide.</p>`);
    requestAnimationFrame(fit);
  }

  /* ---------- Controls ---------- */
  const next = () => show(st.i + 1);
  const prev = () => show(st.i - 1);
  const typing = (el) => el && el.closest && el.closest("input, textarea, select, [contenteditable]");

  function toggleFullscreen() {
    const d = document;
    if (d.fullscreenElement) { d.exitFullscreen && d.exitFullscreen().catch(() => {}); return; }
    const p = d.documentElement.requestFullscreen && d.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  }
  function toggleNotes() {
    if (!st.allowNotes) return;
    st.showNotes = !st.showNotes;
    $("notes-btn").setAttribute("aria-pressed", String(st.showNotes));
    renderNotes();
    if (!st.showNotes) requestAnimationFrame(fit);
  }

  $("next").addEventListener("click", next);
  $("prev").addEventListener("click", prev);
  $("fs-btn").addEventListener("click", toggleFullscreen);
  $("pdf-btn").addEventListener("click", () => window.print());
  $("notes-btn").addEventListener("click", toggleNotes);

  function handleKey(key) {
    switch (key) {
      case "ArrowRight": case "PageDown": case " ": next(); break;
      case "ArrowLeft": case "PageUp": prev(); break;
      case "Home": show(0); break;
      case "End": show(st.slides.length - 1); break;
      case "f": case "F": toggleFullscreen(); break;
      case "n": case "N": toggleNotes(); break;
      case "p": case "P": window.print(); break;
      case "Escape":
        if (document.activeElement && document.activeElement.tagName === "IFRAME") document.activeElement.blur();
        break;
      default: return false;
    }
    return true;
  }
  document.addEventListener("keydown", (e) => {
    if (typing(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.key === " " || e.key === "Enter") && e.target.closest && e.target.closest("button, a")) return;
    if (handleKey(e.key)) e.preventDefault();
  });

  /* Embedded interactives pass slide keys up, and follow the light or dark setting. */
  addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.type !== "slide-key") return;
    if ([...document.querySelectorAll(".interactive iframe")].some((f) => f.contentWindow === e.source)) handleKey(d.key);
  });
  function currentTheme() { return document.documentElement.classList.contains("dark-mode") ? "dark" : "light"; }
  function sendTheme(f) { try { f.contentWindow.postMessage({ type: "theme", theme: currentTheme() }, "*"); } catch (e) { /* not loaded */ } }
  addEventListener("themechange", () => document.querySelectorAll(".interactive iframe").forEach(sendTheme));

  /* Click or swipe on the slide itself. Ignored on links, buttons and controls. */
  let sx = null;
  const busy = (el) => el.closest("a, button, input, select, textarea, canvas, label, .demo");
  $("viewport").addEventListener("pointerdown", (e) => { sx = busy(e.target) ? null : e.clientX; });
  $("viewport").addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    else if (document.fullscreenElement) next();
  });

  /* Printing or saving as PDF: every slide on its own page, notes left out. */
  function showAll(on) {
    st.slides.forEach((sl, i) => { sl.hidden = on ? false : i !== st.i; if (on) fitSlide(sl); });
  }
  addEventListener("beforeprint", () => showAll(true));
  addEventListener("afterprint", () => { showAll(false); fitSlide(st.slides[st.i]); });

  /* A new address: same deck jumps to the slide, a different deck reloads. */
  addEventListener("hashchange", () => {
    const h = location.hash.replace(/^#/, "");
    if (st.key && h.startsWith(st.key + "-")) show((+h.slice(st.key.length + 1) || 1) - 1);
    else location.reload();
  });

  if (window.ResizeObserver) new ResizeObserver(fit).observe($("viewport"));
  addEventListener("resize", fit);
  document.addEventListener("fullscreenchange", () => {
    $("fs-btn").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
    requestAnimationFrame(fit);
  });

  fit();
  init();
})();
