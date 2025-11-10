import "./install-button/install-button.js";

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /*html*/ `
      <header>
        <a href="/" style="opacity: 0"><img src="/assets/icons/icon-192x192.png" height="20" alt="logo" /></a>
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
                title="Publicar nuevo evento"
                href="/publicar-evento/"
              >
                <img src="/assets/icons/upload.svg" width="20px" alt="" />
                Publicar evento
              </a>
              <install-button style="color: var(--color-red);">
                <button data-nosnippet>
                  <svg-mask
                    style="--src: url('/assets/icons/loica.svg'); --color: var(--color-red); width: 20px; height: 18px"
                  ></svg-mask>
                  Instalar
                </button>
              </install-button>
              <footer class="font-body-2">
                <h3 style="margin: 0">Contacto</h3>
                <div class="contact-links">
                  <a href="mailto:hola@trasla.com.ar" title="Email">
                    <svg-mask style="--src: url('/assets/icons/email.svg')"></svg-mask>
                  </a>
                  <a target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=+5493544632482">
                    <svg-mask style="--src: url('/assets/icons/whatsapp.svg')"></svg-mask>
                  </a>
                  <a href="https://www.instagram.com/traslaeventos/" target="_blank" title="Instagram">
                    <svg-mask style="--src: url('/assets/icons/instagram.svg')"></svg-mask>
                  </a>
                </div>
              </footer>
            </nav>
          </nav-menu>
        </details>
        <style>
          /* Moved to base.css so it can be included in legacy.css*/
        </style>
      </header>
    `;
  }
}
customElements.define("site-header", SiteHeader);
