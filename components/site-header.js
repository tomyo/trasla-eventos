import "./install-button.js";

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /*html*/ `
      <header>
        <a href="/" style="opacity: 0"><img src="/assets/icons/favicon-192x192.png" height="20" alt="logo" /></a>
        <details>
          <summary class="summary-hamburger-button">
            <span class="line"></span>
            <span class="line"></span>
            <span class="line"></span>
          </summary>
          <nav-menu>
            <div class="bg-pattern">
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
              <div class="pattern-row"></div>
            </div>
            <nav>
              <a class="logo-title" href="/" aria-label="Trasla Eventos">
                <svg-mask
                  style="
                    --src: url('/assets/icons/trasla-eventos.svg');
                    --color: var(--color-light);
                    height: 40px;
                    aspect-ratio: 300.04831 / 84.928;
                  "
                >
                </svg-mask>
              </a>
              <a
                id="addEvent"
                class="button"
                target="_blank"
                title="Publicar nuevo evento"
                href="https://docs.google.com/forms/d/e/1FAIpQLSdxTx6-LxssWkFlbPqFF6u-QZrNpgC-RJpm9eNweFHXNY8bVA/viewform?usp=sf_link"
              >
                <img src="/assets/icons/upload.svg" width="20px" alt="" />
                Cargar evento
              </a>
              <install-button style="color: var(--color-red);">
                <button data-nosnippet>
                  <svg-mask
                    style="--src: url('/assets/icons/loica.svg'); --color: var(--color-red); width: 20px; height: 18px"
                  ></svg-mask>
                  Instalar
                </button>
              </install-button>
            </nav>
          </nav-menu>
        </details>
        <style>
          header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            position: fixed;
            inset: 0 0 auto;
            z-index: 2;
            --nav-button-color: var(--color-red);
            &.hide {
              transform: translateY(-100%);
            }
            nav-menu {
              opacity: 0;
              position: fixed;
              inset: 0;
              padding: 5rem 3rem;
              background-color: var(--color-red);
              &,
              details:has(> &)::details-content {
                transition: all var(--animation-time-short) ease-in-out;
                transition-behavior: allow-discrete;
              }
              details[open] & {
                opacity: 1;
                body:has(&) {
                  overflow: hidden;
                }
              }
            }
            & .bg-pattern {
              z-index: -1;
            }
            & nav {
              display: flex;
              flex-flow: column;
              align-items: center;
              justify-content: start;
              gap: 3rem;
              color: var(--color-light);
              & > * {
                display: flex;
                gap: 1rem;
                align-items: start;
              }
            }
          }
        </style>
        <style>
          .summary-hamburger-button {
            --line-color: var(--color-red);
            width: 2rem;
            display: flex;
            flex-direction: column;
            gap: 4px;
            cursor: pointer;
            position: relative;
            z-index: 1;
            outline: none;
            -webkit-touch-callout: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            list-style: none;
            appearance: none;
            &::-webkit-details-marker {
              display: none !important;
            }
            &::marker {
              content: none;
            }
            details[open] & {
              --line-color: var(--color-light);
            }
          }
          .summary-hamburger-button .line {
            height: 3px;
            background: var(--line-color);
            border-radius: 2px;
            transition: all var(--animation-time-short) ease-out;
          }
          details[open] .line:nth-of-type(1) {
            transform: translateY(225%) rotate(-45deg);
          }
          details[open] .line:nth-of-type(2) {
            opacity: 0;
          }
          details[open] .line:nth-of-type(3) {
            transform: translateY(-225%) rotate(45deg);
          }
        </style>
      </header>
    `;
  }
}
customElements.define("site-header", SiteHeader);
