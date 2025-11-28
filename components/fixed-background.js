class FixedBackground extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /*html*/ `
      <picture>
        <source
          srcset="/assets/images/portada-1920w-1200h.avif 1x"
          type="image/avif"
          media="(orientation: landscape)"
          width="1920"
          height="1200"
        />
        <source
          srcset="/assets/images/portada-1920w-1200h.jpg 1x"
          type="image/jpeg"
          media="(orientation: landscape)"
          width="1920"
          height="1200"
        />
        <source srcset="/assets/images/portada-720w-1280h.avif 1x" type="image/avif" width="720" height="1280" />
        <img id="fixed-background" srcset="/assets/images/portada-720w-1280h.jpg 1x" alt="" width="720" height="1280" />
        <style>
          #fixed-background {
            position: fixed;
            top: 0;
            width: 100vw;
            height: 100vh;
            height: 100vhl;
            z-index: -1;
            object-fit: cover;
            view-transition-name: fixed-background;
          }
        </style>
      </picture>
    `;
  }
}
customElements.define("fixed-background", FixedBackground);
