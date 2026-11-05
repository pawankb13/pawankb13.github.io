/* Light and dark switch. Uses the same saved setting ("theme" in localStorage) and the same
   "dark-mode" class as pawankb13.github.io, so the choice carries across both sites.
   Load this in <head> so the page never flashes the wrong theme. */
(function () {
  var root = document.documentElement;
  var KEY = "theme";

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(t) { try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ } }

  function preferred() {
    var s = stored();
    if (s === "dark" || s === "light") return s;
    var host = root.getAttribute("data-theme");
    if (host === "dark" || host === "light") return host;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    var dark = theme === "dark";
    root.classList.toggle("dark-mode", dark);
    root.classList.toggle("light-mode", !dark);
    var label = dark ? "Switch to light mode" : "Switch to dark mode";
    var buttons = document.querySelectorAll(".theme-toggle");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-checked", dark ? "true" : "false");
      buttons[i].setAttribute("aria-label", label);
      buttons[i].setAttribute("title", label);
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  apply(preferred());

  document.addEventListener("DOMContentLoaded", function () {
    apply(root.classList.contains("dark-mode") ? "dark" : "light");
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".theme-toggle");
    if (!b) return;
    var next = root.classList.contains("dark-mode") ? "light" : "dark";
    save(next);
    apply(next);
  });
})();
