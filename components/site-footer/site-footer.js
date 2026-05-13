// Global style injection for fallback
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  if (!document.getElementById("site-footer-style")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "site-footer-style";
    link.href = new URL("./site-footer.css", import.meta.url).href;
    document.head.appendChild(link);
  }
}

import "../install-button/install-button.js";

class SiteFooter extends HTMLElement {
  constructor() {
    super();
    injectStyles();
  }

  async connectedCallback() {
    if (!this.hasChildNodes()) {
      try {
        const res = await fetch("/components/site-footer/site-footer.html");
        if (res.ok) {
          this.innerHTML = await res.text();
        }
      } catch (err) {
        console.error("Failed to load site-footer HTML", err);
      }
    }
  }
}
customElements.define("site-footer", SiteFooter);
