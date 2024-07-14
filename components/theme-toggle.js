const rootElement = document.documentElement;
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const STORAGE_KEY = "theme-preference";

customElements.define(
  "theme-toggle",
  class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.addEventListener("click", this);
    }

    handleEvent() {
      // Toggle the current theme
      rootElement.dataset.theme = rootElement.dataset.theme === "☀️" ? "🌑" : "☀️";
      setThemePreference();
    }
  }
);

// Initialize theme based on user's system preference
if (!rootElement.dataset.theme) rootElement.dataset.theme = getThemePreference();

// Reflect prefers-color-scheme changes in the UI
prefersDarkScheme.onchange = (e) => (rootElement.dataset.theme = e.matches ? "🌑" : "☀️");

function getThemePreference() {
  if (localStorage.getItem(STORAGE_KEY)) return localStorage.getItem(STORAGE_KEY);
  return prefersDarkScheme.matches ? "🌑" : "☀️";
}

function setThemePreference() {
  localStorage.setItem(STORAGE_KEY, rootElement.dataset.theme);
}
