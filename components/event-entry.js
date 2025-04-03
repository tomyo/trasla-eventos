import "./share-url.js";
import { formatPhoneNumber, isValidUrl, formatDate, parseDate, formatDescription } from "../lib/utils.js";

customElements.define(
  "event-entry",
  class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.startDate = parseDate(this.dataset.startsAt);
      this.endDate = parseDate(this.dataset.endsAt);
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
        <h3 part="title">${this.dataset.title}</h3>

        <img class="event-image" height="400" src="${
          this.dataset.previewImage
        }" loading="lazy" alt="Evento en ${this.dataset.locality} el ${formatDate(this.startDate)}">

        <p part="where-and-when">
          ${this.dataset.locality} - ${formatEventDate(this.startDate, { onlyTime: true })}
        </p>
        
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
      return htmlString;
    }

    renderButtons() {
      let htmlString = "";

      // Add WhatsApp button
      if (this.dataset.phone) {
        const shareUrl = `${location.origin}/${this.dataset.slug}`;
        let helloMsg = `Hola! 😃\nTe escribo desde ${shareUrl} por el evento ${this.dataset.title}:\n\n`;
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
            this.dataset.phone
          )}&text=${encodeURI(helloMsg)}">
            <img src="/assets/icons/whatsapp.svg" height="21" alt="WhatsApp"/>
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
            <img src="/assets/icons/instagram.svg" height="21" alt="Instagram"/>
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
            <img src="/assets/icons/maps.svg" height="23" alt="Google Maps"/>
          </a>
        `;
      }

      // Add Youtube button
      if (this.dataset.youtube) {
        htmlString += /*html*/ `
        <a part="button" target="_blank" title="YouTube" href="${this.dataset.youtube}">
          <img height="21" src="/assets/icons/youtube.svg" alt="YouTube"/>
        </a>
      `;
      }

      // Add Spotify button
      if (this.dataset.spotify) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Spotify" href="${this.dataset.spotify}">
            <img src="/assets/icons/spotify.svg" height="21" alt="Spotify"/>
          </a>
        `;
      }

      // Add Google Calendar button
      htmlString += /*html*/ `
        <a target="_blank" part="button"  title="Agregar a tu Google Calendar"
            href="${createGoogleCalendarUrl(this)}">
          <img src="/assets/icons/calendar.svg" height="21" alt="">
        </a>
      `;

      // Add Share button
      htmlString += /*html*/ `
        
      <share-url part="button" data-action="share" data-fallback-action="clipboard" data-text-success="Compartido" data-text-success-fallback="Link copiado" data-url="${location.origin}/${this.dataset.slug}" data-title="${this.dataset.title}">
        <a href="${location.origin}/${this.dataset.slug}" title="Ir a la página del evento">
          <img src="/assets/icons/share.svg" height="21" alt="Compartir"/>
        </a>
      </share-url>`;

      return htmlString;
    }
  }
);

/**
 *
 * @param {Date} date
 * @returns {String}
 */
function formatEventDate(date, { timezone = -3, onlyTime = false } = {}) {
  const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

  // Fix to display timezone
  const targetUtcDate = new Date(date);
  targetUtcDate.setUTCHours(targetUtcDate.getUTCHours() + timezone);

  const day = targetUtcDate.getUTCDate().toString().padStart(2, "0");
  const month = (targetUtcDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const hour = targetUtcDate.getUTCHours().toString().padStart(2, "0");
  const minute = targetUtcDate.getUTCMinutes().toString().padStart(2, "0");
  if (onlyTime) return `${hour}:${minute}h`;

  return `${dayNames[date.getDay()]} ${day}/${month} - ${hour}:${minute}h`;
}

function createGoogleCalendarUrl(eventElement) {
  const hook = `https://eventos.trasla.com.ar/${eventElement.slug}\n\n`;
  let eventTitle = eventElement.dataset.title;
  if (!eventTitle) {
    eventTitle = `Actividad en ${eventElement.dataset.locality}`;
  }
  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const encodedDetails = encodeURIComponent(hook + eventElement.dataset.description || "");
  const encodedLocation = encodeURIComponent(eventElement.dataset.location || "");
  const encodedSummary = encodeURIComponent(eventTitle);

  let url = `${baseUrl}&text=${encodedSummary}&details=${encodedDetails}&location=${encodedLocation}`;
  const startDateString = eventElement.dataset.startsAt.replace(/-|:|\.\d\d\d/g, "");

  // Default event duration is 2 hours if end time is not provided.
  let endDate = eventElement.endDate
    ? eventElement.endDate
    : new Date(new Date(eventElement.dataset.startsAt).getTime() + 2 * 60 * 60 * 1000);

  const endDateString = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  url += `&dates=${startDateString}/${endDateString}`;
  return url;
}
