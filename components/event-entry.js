import "./share-url.js";
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
        <h2 part="title">${this.dataset.title}</h2>

        <img class="event-image" height="400" src="${this.dataset.imageUrl}" loading="lazy" alt="Evento en ${
        this.dataset.locality
      } el ${formatDate(this.startDate)}">

        <div part="where-and-when">
          <p part="locality">${this.dataset.locality}</p>
          <p part="datetime">${formatEventDate(this.startDate)}</p>
        </div>
        
        <div class="badges">
          ${this.renderBadges()}
        </div>

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
      if (this.dataset.activity) {
        htmlString += /*html*/ `<span data-type="${this.dataset.activity}">${this.dataset.activity}</span>`;
      }
      if (isDateToday(this.startDate)) {
        htmlString += /*html*/ `<span data-type="today">¡HOY!</span>`;
      }
      if (isDateTomorrow(this.startDate)) {
        htmlString += /*html*/ `<span data-type="tomorrow">¡Mañana!</span>`;
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
