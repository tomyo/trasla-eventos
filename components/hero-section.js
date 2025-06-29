class HeroSection extends HTMLElement {
  constructor() {
    super().attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = /*html*/ `
      <!-- Hero section for Trasla Eventos -->
        <slot name="logo"></slot>
        <slot name="title"></slot>
        <slot></slot>
    `;
  }

  connectedCallback() {
    // Default logo if no logo slot is provided
    if (this.shadowRoot.querySelector("slot[name='logo']").assignedNodes().length === 0) {
      this.innerHTML += /*html*/ `
        <a slot="logo"  href="/" aria-label="Trasla Eventos">
          <svg-mask style="--src: url('/assets/icons/trasla-eventos.svg'); --color: var(--hero-logo-color, var(--color-red)); height: 40px">
          </svg-mask>
        </a>
      `;
    }
  }
}
customElements.define("hero-section", HeroSection);
