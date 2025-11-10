let instancesCount = 0;

customElements.define(
  "horizontal-carousel",
  class extends HTMLElement {
    constructor() {
      super(); //.attachShadow({ mode: "open" });
      this.dataset.instance = ++instancesCount;
      if (!document.getElementById("horizontal-carousel-style")) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.id = "horizontal-carousel-style";
        link.href = new URL("./horizontal-carousel.css", import.meta.url).href;
        document.head.appendChild(link);
      }
    }

    connectedCallback() {
      if (this.children.length < 2) {
        return this.toggleAttribute("hide-controls", true);
      }
      for (const [index, item] of Object.entries([...this.children])) {
        if (!item.id) item.id = `carousel-${this.dataset.instance}-item-${index + 1}`;
        item.setAttribute("part", "carousel-image");
      }

      this.style.setProperty("--anchor-name", `--carousel-${instancesCount}`);

      // Add carousel dots fallback for browsers without scroll marker support
      if (!CSS.supports("scroll-marker-group", "after")) {
        const carousel = document.createElement("carousel-dots");
        carousel.innerHTML = /*html*/ `
          ${Array.from(this.children)
            .map((el) => `<a href="#${el.id}">●</a>`)
            .join(" ")}
        `;
        this.insertAdjacentElement("afterend", carousel);
        carousel.addEventListener("click", this);
      }
    }

    handleEvent(event) {
      if (event.type !== "click" || !event.target.href) return;
      event.preventDefault();
      document.querySelector(event.target.getAttribute("href"))?.scrollIntoView({
        behavior: "smooth",
        block: "nearest", // Don't scroll vertically
        inline: "center", // Center horizontally in carousel
      });
    }
  }
);
