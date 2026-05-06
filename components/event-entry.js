import "/components/share-url/share-url.js";
import { renderEventEntryInnerHtml } from "/lib/render.js";
import "/components/horizontal-carousel/horizontal-carousel.js";

customElements.define(
  "event-entry",
  class extends HTMLElement {
    static requiredDatasetAttributesForRerender = ["title", "starts-at", "images", "locality", "slug"];
    constructor() {
      super();
      if (!document.getElementById("event-entry-style")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.id = "event-entry-style";
        link.href = new URL("./event-entry.css", import.meta.url).href;
        document.head.appendChild(link);
      }
    }

    connectedCallback() {
      const isPreRendered = this.innerHTML.trim() !== "";

      if (!isPreRendered && !this.isDatasetValid()) return;

      this.render();
      this.addEventListeners();
    }

    validateDataset() {
      // Check for required data attributes
      const missingAttributes = this.requiredAttributes.filter((attr) => {
        return this.dataset[attr] === undefined;
      });

      if (missingAttributes.length > 0) {
        console.warn(`Missing required data attributes: ${missingAttributes.map((attr) => `data-${attr}`).join(", ")}`);
        return false;
      }

      return true;
    }

    addEventListeners() {
      this.details = this.querySelector("details");
      this.images = this.querySelector("horizontal-carousel");
      this.summary = this.querySelector("summary");
      this.details?.addEventListener("toggle", this);
      this.images.addEventListener("click", (event) => {
        if (event.target.tagName.toLowerCase() !== "img") return; // Avoid clicks opening <details> on the carousel container
        this.summary?.click();
      });
      for (const button of this.querySelectorAll("[part='buttons'] > *")) {
        button.addEventListener("click", this);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || newValue === null) return; // Skip processing while disconnected

      if (name === "open") {
        this.open = !!newValue;
        const details = this.querySelector("details");
        if (details) details.open = !!newValue;
        return;
      }

      if (oldValue && oldValue !== newValue) {
        // Re-validate and possibly re-render when attributes change
        if (this.isDatasetValid()) {
          this.render();
        } else {
          console.log("Invalid dataset. Skipping rendering.");
        }
      }
    }

    // Specify which attributes to observe for changes
    static get observedAttributes() {
      return ["open", ...this.requiredDatasetAttributesForRerender.map((attr) => `data-${attr}`)];
    }

    isDatasetValid() {
      const missingAttributes = this.constructor.requiredDatasetAttributesForRerender.filter(
        (attr) => !this.getAttribute(`data-${attr}`),
      );

      if (missingAttributes.length > 0) {
        console.warn(`Missing required data attributes: ${missingAttributes.map((attr) => `data-${attr}`).join(", ")}`);
        return false;
      }

      return true;
    }

    render() {
      // Only render if it's empty to avoid wiping out SSR'd content
      if (this.innerHTML.trim() === "") {
        this.innerHTML = renderEventEntryInnerHtml(this.dataset, location.origin);
      }
    }

    handleEvent(event) {
      if (event.type === "toggle") {
        if (event.target.open != this.open) this.open = event.target.open;
        return;
      }
    }
  },
);
