// Global style injection for fallback
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  if (!document.getElementById("site-header-style")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "site-header-style";
    link.href = new URL("./site-header.css", import.meta.url).href;
    document.head.appendChild(link);
  }
}

import "../install-button/install-button.js";

customElements.define(
  "site-header",
  class extends HTMLElement {
    constructor() {
      super();
      injectStyles();
    }

    async connectedCallback() {
      if (!this.hasChildNodes()) {
        try {
          const res = await fetch(new URL("./site-header.html", import.meta.url));
          if (res.ok) {
            this.innerHTML = await res.text();
          }
        } catch (err) {
          console.error("Failed to load site-header HTML", err);
        }
      }
    }
  },
);
