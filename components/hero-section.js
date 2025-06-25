class HeroSection extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /*html*/ `
      <!-- Hero section for Trasla Eventos -->
        <a class="logo-title" href="/" aria-label="Trasla Eventos">
          <svg-mask style="--src: url('/assets/icons/trasla-eventos.svg'); --color: var(--color-red); height: 40px">
          </svg-mask>
        </a>
        <h1 class="moto">La agenda cultural de Traslasierra</h1>
        <style>
          hero-section {
            display: flex;
            flex-flow: column;
            text-align: center;
            height: 45vh;
            height: 45lvh;
            justify-content: start;
            align-items: center;
            padding-top: 5rem;
            color: var(--color-light);

            & .logo-title {
              display: inline-block;
              width: 9rem;
              color: var(--color-red);
            }

            & .moto {
              line-height: 1.3;
              font-weight: 500;
              font-size: calc(1.3rem + 1vw);
              font-family: var(--font-family-branding);
              min-height: 6ch;
              letter-spacing: 1px;
              margin-block: auto;
            }

            & #actions {
              display: grid;
              justify-content: center;
              gap: 1rem;
              text-align: center;
            }
          }
        </style>
    `;
  }
}
customElements.define("hero-section", HeroSection);
