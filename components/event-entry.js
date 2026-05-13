import "/components/share-url/share-url.js";
import { renderEventEntryInnerHtml } from "/lib/render.js";
import "/components/horizontal-carousel/horizontal-carousel.js";

// Global style injection
let stylesInjected = false;
function injectStylesIfMissing() {
  if (stylesInjected) return;

  if (!document.getElementById("event-entry-style")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "event-entry-style";
    link.href = new URL("./event-entry.css", import.meta.url).href;
    document.head.appendChild(link);

    stylesInjected = true;
  }
}

// Lazy client-side rendering via IntersectionObserver
const renderFromDataObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.renderFromData();
        renderFromDataObserver.unobserve(entry.target);
      }
    }
  },
  { rootMargin: "600px" },
);

customElements.define(
  "event-entry",
  class extends HTMLElement {
    static requiredDatasetAttributesForClientSideRender = ["title", "starts-at", "images", "locality", "slug"];

    constructor() {
      super();
      injectStylesIfMissing();
    }

    connectedCallback() {
      // Only observe if it's empty (CSR needed) AND it has the required data attributes
      if (!this.hasChildNodes() && this.hasRequiredDatasetAttributesForClientSideRender()) {
        renderFromDataObserver.observe(this);
      }
    }

    disconnectedCallback() {
      renderFromDataObserver.unobserve(this);
    }

    renderFromData() {
      // CSR for when data was passed through data-* attributes
      this.innerHTML = renderEventEntryInnerHtml(this.dataset, location.origin);
    }

    hasRequiredDatasetAttributesForClientSideRender() {
      const missingAttributes = this.constructor.requiredDatasetAttributesForClientSideRender.filter(
        (attr) => !this.getAttribute(`data-${attr}`),
      );

      if (missingAttributes.length > 0) {
        console.warn(`Missing required data attributes: ${missingAttributes.map((attr) => `data-${attr}`).join(", ")}`);
        return false;
      }

      return true;
    }
  },
);
