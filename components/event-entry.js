import "./share-url.js";
import "./notify-button.js";
import {
  isDateToday,
  isDateWithinWeek,
  isDateTomorrow,
  formatPhoneNumber,
  isValidUrl,
  createGoogleCalendarUrl,
  slugify,
  formatDate,
  parseDate,
  formatDescription,
  unescapeHtml,
} from "../lib/utils.js";

customElements.define(
  "event-entry",
  class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.startDate = parseDate(this.dataset.startDate);
      this.endDate = parseDate(this.dataset.endDate);
      this.dataset.id && this.setAttribute("id", this.dataset.id); // to link to it inside the page
      this.render();

      this.details = this.querySelector("details");
      this.image = this.querySelector(".event-image");
      this.summary = this.querySelector("summary");
      this.details?.addEventListener("toggle", this);
      this.image.addEventListener("click", (event) => {
        this.summary?.click();
      });
    }

    /**
     * @param {Object} event
     */
    render() {
      this.innerHTML = /*html*/ `
      <div class="top-info">
        <p style="text-transform: uppercase; font-weight: 600;">${this.dataset.locality}</p>
        <p class="datetime" >
        ${formatEventDate(this.startDate)}
        </p>
        <div class="badges">
            ${this.renderBadges()}
        </div>
      </div>

      <img class="event-image" height="400" src="${this.dataset.imageUrl}" loading="lazy" alt="Evento en ${
        this.dataset.locality
      } el ${formatDate(this.startDate)}">
      ${
        this.dataset.description
          ? /*html*/ `<details ${this.hasAttribute("open") ? "open" : ""}>
        <summary>
          Ver más
        </summary>
        <p slot="description" part="description">${formatDescription(this.dataset.description)}</p>
      </details>`
          : ""
      }

      <div part="buttons">
        ${this.renderButtons()}
      </div>
      <!--
      <div class="quick-actions">
          
          <comment-button>
            <svg aria-label="Comentarios" fill="currentColor" height="21" width="21" role="img" viewBox="0 0 24 24" ><title>Comentar</title><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path></svg>
          </comment-button>
        </div>
      -->
      `;
    }
    static observedAttributes = ["open", "order"];

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "open") {
        this.open = !!newValue;
        const details = this.querySelector("details");
        if (details) details.open = !!newValue;
      }
    }

    handleEvent(event) {
      if (event.type === "toggle") {
        if (event.target.open != this.open) this.open = event.target.open;
      }
    }

    renderBadges() {
      let htmlString = "";
      if (isDateToday(this.startDate)) {
        htmlString += /*html*/ `<span data-type="today">¡HOY!</span>`;
      }
      if (isDateTomorrow(this.startDate)) {
        htmlString += /*html*/ `<span data-type="tomorrow">¡Mañana!</span>`;
      }
      if (this.dataset.activity) {
        htmlString += /*html*/ `<span data-type="${this.dataset.activity}">${this.dataset.activity}</span>`;
      }
      return htmlString;
    }

    renderButtons() {
      let htmlString = "";

      // Add WhatsApp button
      if (this.dataset.phone) {
        const shareUrl = `${location.origin}/${this.slug}`;
        let helloMsg = `Hola! 😃\nTe escribo desde ${shareUrl} por el evento ${this.dataset.title}:\n\n`;
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
            this.dataset.phone
          )}&text=${encodeURI(helloMsg)}">
            <img src="/assets/icons/whatsapp-256w.png" height="21" alt="WhatsApp" loading="lazy"/>
          </a>
        `;
      }

      // Add Instagram button
      if (this.dataset.instagram) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Instagram" href="https://instagram.com/${this.dataset.instagram.replace(
            "@",
            ""
          )}">
            <img src="/assets/icons/instagram-240w.png" height="21" alt="Instagram" loading="lazy"/>
          </a>
        `;
      }

      // Add Google Maps button
      if (this.dataset.location) {
        let href = this.dataset.location;
        if (!isValidUrl(href))
          href = `https://www.google.com/maps/search/?api=1&query=${encodeURI(
            this.dataset.location + `, ${this.dataset.locality}, Córdoba, Argentina`
          )},`;

        htmlString += /*html*/ `
          <a part="button" target="_blank" href=${href} title="¿Cómo llegar?">
            <img src="/assets/icons/google-maps-256w.png" height="21" alt="Google Maps" loading="lazy"/>
          </a>
        `;
      }

      // Add Youtube button
      if (this.dataset.youtube) {
        htmlString += /*html*/ `
        <a part="button" target="_blank" title="YouTube" href="${this.dataset.youtube}">
          <img height="21" src="/assets/icons/youtube-256w.png" alt="YouTube" loading="lazy"/>
        </a>
      `;
      }

      // Add Spotify button
      if (this.dataset.spotify) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Spotify" href="${this.dataset.spotify}">
            <img src="/assets/icons/spotify-256w.png" height="21" alt="Spotify" loading="lazy"/>
          </a>
        `;
      }

      // Add Google Calendar button
      htmlString += /*html*/ `
        <a target="_blank" part="button"  title="Agregar a tu Google Calendar"
            href="${createGoogleCalendarUrl(this)}">
          <img src="/assets/icons/google-calendar.svg" height="21" alt="">
        </a>
      `;

      // Add notify-me button
      htmlString += /*html*/ `
      <notify-button part="button" data-id="${this.dataset.id}" tabindex="0" hidden>
          <!--
          <svg data-notify="" aria-label="Me gusta" fill="currentColor" height="21" width="21" role="img" viewBox="0 0 24 24" ><title>Me gusta</title><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path></svg>
          <svg data-unnotify="" aria-label="Ya no me gusta" fill="currentColor" height="21" width="21 role="img" viewBox="0 0 48 48" "><title>Ya no me gusta</title><path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z"></path></svg>
          <svg data-notify="" height="21" width="21" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L542.6 400c2.7-7.8 1.3-16.5-3.9-23l-14.9-18.6C495.5 322.9 480 278.8 480 233.4l0-33.4c0-75.8-55.5-138.6-128-150.1L352 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 17.9c-43.9 7-81.5 32.7-104.4 68.7L38.8 5.1zM221.7 148.4C239.6 117.1 273.3 96 312 96l8 0 8 0c57.4 0 104 46.6 104 104l0 33.4c0 32.7 6.4 64.8 18.7 94.5L221.7 148.4zM406.2 416l-60.9-48-176.9 0c21.2-32.8 34.4-70.3 38.4-109.1L160 222.1l0 11.4c0 45.4-15.5 89.5-43.8 124.9L101.3 377c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l286.2 0zM384 448l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"/></svg>
          -->
          <svg data-notify="" height="21" width="21"  viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416l400 0c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4l0-25.4c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm0 96c61.9 0 112 50.1 112 112l0 25.4c0 47.9 13.9 94.6 39.7 134.6L72.3 368C98.1 328 112 281.3 112 233.4l0-25.4c0-61.9 50.1-112 112-112zm64 352l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7s18.7-28.3 18.7-45.3z"/></svg>
          <svg data-unnotify=""  height="21" width="21" viewBox="0 0 448 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/></svg>
          <input type="checkbox" name="notify" hidden>
      </notify-button >`;

      // Add Share button
      htmlString += /*html*/ `
        
      <share-url part="button" data-action="share" data-fallback-action="clipboard" data-text-success="Compartido" data-text-success-fallback="Link copiado" data-url="${location.origin}/${this.slug}" data-title="${this.dataset.title}">
        <a href="${location.origin}/${this.slug}" title="Compartir">
          <svg xmlns="http://www.w3.org/2000/svg" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        </a>
      </share-url>`;

      return htmlString;
    }

    get slug() {
      return slugify(
        unescapeHtml(this.dataset.title || this.dataset.locality + " " + formatDate(this.startDate))
      );
    }
  }
);

/**
 *
 * @param {Date} date
 * @returns {String}
 */
function formatEventDate(date, timezone = -3) {
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  // Fix to display timezone
  const targetUtcDate = new Date(date);
  targetUtcDate.setUTCHours(targetUtcDate.getUTCHours() + timezone);

  if (!isDateWithinWeek(targetUtcDate)) return formatDate(date);

  // const today = new Date();
  // dayNames[today.getDay()] = "¡HOY!";
  // dayNames[(today.getDay() + 1) % 7] = "Mañana";

  const day = targetUtcDate.getUTCDate().toString().padStart(2, "0");
  const month = (targetUtcDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const hour = targetUtcDate.getUTCHours().toString().padStart(2, "0");
  const minute = targetUtcDate.getUTCMinutes().toString().padStart(2, "0");
  return `${dayNames[date.getDay()]} ${day}/${month} - ${hour}:${minute}h`;
}
