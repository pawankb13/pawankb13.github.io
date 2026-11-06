/* Helper for HTML interactives shown inside slides.
   Add one line to the <head> of any interactive. The ../ steps climb to the lms folder:
       in a session's interactives/ folder (content/<year>/<course>/<session>/interactives/), five:
       <script src="../../../../../assets/interactive.js"></script>
       in content/shared/<course>/interactives/ or content/templates/all-layouts/interactives/, four:
       <script src="../../../../assets/interactive.js"></script>
   It does two things:
   1. Light and dark: sets the "dark-mode" or "light-mode" class on <html>, matching the slides,
      and fires a "themechange" event if your code needs to redraw.
   2. Slide keys: arrow keys, Page Up/Down, F and N still control the slides after you click
      inside the interactive. Esc hands focus back to the slides. Keys typed into sliders and
      text boxes stay with the interactive. */
(function () {
  var root = document.documentElement;
  var inFrame = window.parent !== window;

  function apply(theme) {
    var dark = theme === "dark";
    root.classList.toggle("dark-mode", dark);
    root.classList.toggle("light-mode", !dark);
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  function initialTheme() {
    try {
      var pc = window.parent.document.documentElement.classList;
      if (inFrame && pc.contains("dark-mode")) return "dark";
      if (inFrame && pc.contains("light-mode")) return "light";
    } catch (e) { /* parent on another site */ }
    try {
      var s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") return s;
    } catch (e) { /* storage blocked */ }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  apply(initialTheme());

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "theme") apply(e.data.theme);
  });

  var KEYS = ["ArrowRight", "ArrowLeft", "PageDown", "PageUp", "Home", "End", " ", "f", "F", "n", "N", "Escape"];
  document.addEventListener("keydown", function (e) {
    if (!inFrame || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]") && e.key !== "Escape") return;
    if (KEYS.indexOf(e.key) < 0) return;
    if (e.key === " " && e.target.closest && e.target.closest("button, a")) return;
    e.preventDefault();
    window.parent.postMessage({ type: "slide-key", key: e.key }, "*");
  });
})();
