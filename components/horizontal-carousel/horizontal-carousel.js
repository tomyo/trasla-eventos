let instancesCount = 0;

// Global Event Delegation for clicks on carousel dots
document.addEventListener("click", (event) => {
  const dot = event.target.closest("carousel-dots a");
  if (!dot) return;

  event.preventDefault();
  const targetId = dot.getAttribute("href");
  if (targetId) {
    document.querySelector(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest", // Don't scroll vertically
      inline: "center", // Center horizontally in carousel
    });
  }
});

// Lazy initialization via IntersectionObserver
const carouselObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.showControls();
        carouselObserver.unobserve(entry.target);
      }
    }
  },
  { rootMargin: "300px" },
);

// Global style injection for fallback
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  if (!document.getElementById("horizontal-carousel-style")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "horizontal-carousel-style";
    link.href = new URL("./horizontal-carousel.css", import.meta.url).href;
    document.head.appendChild(link);
  }
}

customElements.define(
  "horizontal-carousel",
  class extends HTMLElement {
    constructor() {
      super();
      this.dataset.instance = ++instancesCount;
      injectStyles();
    }

    connectedCallback() {
      if (this.children.length > 1) {
        carouselObserver.observe(this);
      }
    }

    disconnectedCallback() {
      carouselObserver.unobserve(this);
    }

    showControls() {
      this.toggleAttribute("show-controls", true);
      for (const [index, item] of Object.entries([...this.children])) {
        if (!item.id) item.id = `carousel-${this.dataset.instance}-item-${Number(index) + 1}`;
        item.setAttribute("part", "carousel-image");
      }

      this.style.setProperty("--anchor-name", `--carousel-${instancesCount}`);

      // Add carousel dots fallback for browsers without scroll marker support
      if (!CSS.supports("scroll-marker-group", "after")) {
        const carousel = document.createElement("carousel-dots");
        carousel.innerHTML = `
          ${Array.from(this.children)
            .map((el) => /*html*/ `<a href="#${el.id}">●</a>`)
            .join(" ")}
        `;
        this.insertAdjacentElement("afterend", carousel);
      }
    }
  },
);
