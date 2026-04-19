(function() {
  var storageKey = 'theme';
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');

  function getStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {}
  }

  function getPreferredTheme() {
    var storedTheme = getStoredTheme();

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  function setTheme(theme) {
    var isDark = theme === 'dark';
    root.classList.toggle('dark-mode', isDark);

    if (!toggle) {
      return;
    }

    toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  setTheme(getPreferredTheme());

  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', function() {
    var nextTheme = root.classList.contains('dark-mode') ? 'light' : 'dark';
    storeTheme(nextTheme);
    setTheme(nextTheme);
  });
})();
