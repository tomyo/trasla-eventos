class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /*html*/ `
      <!-- Footer for Trasla Eventos -->
      <footer class="font-body-2 mountains-top">
        <div class="bg-pattern">
          <div class="pattern-row"></div>
          <div class="pattern-row"></div>
          <div class="pattern-row"></div>
          <div class="pattern-row"></div>
        </div>
        <a href="/" title="Ir a la página principal">
          <svg-mask style="--src: url('/assets/images/trasla-eventos.svg')" alt="Trasla Eventos"> </svg-mask>
        </a>
        <button install>Instalar</button>
        <a
          title="Publicar nuevo evento"
          href="https://docs.google.com/forms/d/e/1FAIpQLSdxTx6-LxssWkFlbPqFF6u-QZrNpgC-RJpm9eNweFHXNY8bVA/viewform?usp=sf_link"
        >
          Cargar Evento
        </a>
        <fieldset>
          <legend>Ver próximos eventos en</legend>
          <nav>
            <a title="Ver eventos en Arroyo de Los Patos" href="/lugar/arroyo-de-los-patos/">Arroyo de Los Patos</a> ·
            <a title="Ver eventos en El Pueblito" href="/lugar/el-pueblito/">El Pueblito</a> ·
            <a title="Ver eventos en La Paz" href="/lugar/la-paz/">La Paz</a> ·
            <a title="Ver eventos en La Población" href="/lugar/la-poblacion/">La Población</a> ·
            <a title="Ver eventos en Las Calles" href="/lugar/las-calles/">Las Calles</a> ·
            <a title="Ver eventos en Las Chacras" href="/lugar/las-chacras/">Las Chacras</a> ·
            <a title="Ver eventos en Las Rabonas" href="/lugar/las-rabonas/">Las Rabonas</a> ·
            <a title="Ver eventos en Las Tapias" href="/lugar/las-tapias/">Las Tapias</a> ·
            <a title="Ver eventos en Los Hornillos" href="/lugar/los-hornillos/">Los Hornillos</a> ·
            <a title="Ver eventos en Los Molles" href="/lugar/los-molles/">Los Molles</a> ·
            <a title="Ver eventos en Los Pozos" href="/lugar/los-pozos/">Los Pozos</a> ·
            <a title="Ver eventos en Luyaba" href="/lugar/luyaba/">Luyaba</a> ·
            <a title="Ver eventos en Mina Clavero" href="/lugar/mina-clavero/">Mina Clavero</a> ·
            <a title="Ver eventos en Nono" href="/lugar/nono/">Nono</a> ·
            <a title="Ver eventos en Panaholma" href="/lugar/panaholma/">Panaholma</a> ·
            <a title="Ver eventos en San Huberto" href="/lugar/san-huberto/">San Huberto</a> ·
            <a title="Ver eventos en San Javier" href="/lugar/san-javier/">San Javier</a> ·
            <a title="Ver eventos en San Lorenzo" href="/lugar/san-lorenzo/">San Lorenzo</a> ·
            <a title="Ver eventos en San Pedro" href="/lugar/san-pedro/">San Pedro</a> ·
            <a title="Ver eventos en Travesia" href="/lugar/travesia/">Travesia</a> ·
            <a title="Ver eventos en Villa Cura Brochero" href="/lugar/villa-cura-brochero/">Villa Cura Brochero</a> ·
            <a title="Ver eventos en Villa de Las Rosas" href="/lugar/villa-de-las-rosas/">Villa de Las Rosas</a> ·
            <a title="Ver eventos en Villa de Merlo" href="/lugar/villa-de-merlo/">Villa de Merlo</a> ·
            <a title="Ver eventos en Villa Dolores" href="/lugar/villa-dolores/">Villa Dolores</a> ·
            <a title="Ver eventos en Yacanto" href="/lugar/yacanto/">Yacanto</a>
          </nav>
        </fieldset>
        <h3 style="margin: 0">Contacto</h3>
        <div class="contact-links">
          <a href="mailto:hola@trasla.com.ar" title="Email">
            <svg-mask style="--src: url('/assets/icons/email.svg')"></svg-mask>
          </a>
          <a target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=+5493544643473">
            <svg-mask style="--src: url('/assets/icons/whatsapp.svg')"></svg-mask>
          </a>
          <a href="https://www.instagram.com/traslaeventos/" target="_blank" title="Instagram">
            <svg-mask style="--src: url('/assets/icons/instagram.svg')"></svg-mask>
          </a>
        </div>
        <style>
          footer {
            position: relative;
            display: flex;
            flex-flow: column;
            align-items: center;
            gap: 1.5rem;
            padding: 2rem;
            font-family: var(--font-family-mono);
            background-color: var(--color-green);
            color: var(--color-light);
            text-align: center;
            text-transform: uppercase;
          }
          footer button[install] {
            background: none;
            font: inherit;
            padding: 0;
          }
          footer > * {
            z-index: 1;
            text-decoration: none;
            min-width: 8rem;
          }
          footer svg-mask {
            --color: var(--color-light);
          }
          footer fieldset {
            border-left-style: solid;
            border-width: 1px;
            border-color: var(--background-color);
            outline: none;
            max-width: 800px;
            padding: 1rem;
            line-height: 1rem;
            margin-block: 1rem;
          }
          footer fieldset a {
            text-decoration: none;
          }
          footer fieldset legend {
            margin-inline: auto;
            padding-inline: 0.5rem;
          }
          footer .contact-links {
            display: flex;
            --icon-width: 22px;
            gap: 2rem;
          }
          footer .contact-links svg-mask {
            width: var(--icon-width);
            height: var(--icon-width);
          }
        </style>
      </footer>
    `;
  }
}
customElements.define("site-footer", SiteFooter);
