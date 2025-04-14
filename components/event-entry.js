import "./share-url.js";
import {
  formatPhoneNumber,
  isValidUrl,
  formatDate,
  parseDate,
  formatDescription,
  formatLocalDate,
  getGoogleDriveImagesPreview,
} from "../lib/utils.js";

customElements.define(
  "event-entry",
  class extends HTMLElement {
    static requiredDatasetAttributes = ["title", "starts-at", "images", "locality", "slug"];

    constructor() {
      super();
    }

    connectedCallback() {
      if (!this.isDatasetValid()) return;

      this.processData();
      this.render();
      this.addEventListeners();
    }

    validateDataset() {
      // Check for required data attributes
      const missingAttributes = this.requiredAttributes.filter((attr) => {
        return this.dataset[attr] === undefined;
      });

      if (missingAttributes.length > 0) {
        console.warn(
          `Missing required data attributes: ${missingAttributes.map((attr) => `data-${attr}`).join(", ")}`
        );
        return false;
      }

      return true;
    }

    processData() {
      this.startDate = parseDate(this.dataset.startsAt);
      if (this.dataset.endsAt) this.endDate = parseDate(this.dataset.endsAt);
      this.previewImage = getGoogleDriveImagesPreview(this.dataset.images);
      this.setAttribute("date", formatLocalDate(new Date(this.dataset.startsAt)));
    }

    addEventListeners() {
      this.details = this.querySelector("details");
      this.image = this.querySelector(".event-image");
      this.summary = this.querySelector("summary");
      this.details?.addEventListener("toggle", this);
      this.image.addEventListener("click", (event) => {
        this.summary?.click();
      });
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || newValue === null) return; // Skip processing while disconnected

      if (name === "open") {
        this.open = !!newValue;
        const details = this.querySelector("details");
        if (details) details.open = !!newValue;
        return;
      }

      if (oldValue !== newValue) {
        // Re-validate and possibly re-render when attributes change
        if (this.isDatasetValid()) {
          this.processData();
          this.render();
        } else {
          console.log("Invalid dataset. Skipping rendering.");
        }
      }
    }

    // Specify which attributes to observe for changes
    static get observedAttributes() {
      return ["open", ...this.requiredDatasetAttributes.map((attr) => `data-${attr}`)];
    }

    isDatasetValid() {
      // Check for required data attributes
      const missingAttributes = this.constructor.requiredDatasetAttributes.filter(
        (attr) => !this.getAttribute(`data-${attr}`)
      );

      if (missingAttributes.length > 0) {
        console.warn(
          `Missing required data attributes: ${missingAttributes.map((attr) => `data-${attr}`).join(", ")}`
        );
        return false;
      }

      return true;
    }

    /**
     * @param {Object} event
     */
    render() {
      this.innerHTML = /*html*/ `
        <h3 part="title">${this.dataset.title}</h3>

        <img class="event-image" height="400" src="${this.previewImage}" loading="lazy" alt="Evento en ${
        this.dataset.locality
      } el ${formatDate(this.startDate)}">

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
            <img src="/assets/icons/maps.svg" height="23" alt=""/>
          </a>
        `;
      }

      // Add Youtube button
      if (this.dataset.youtube) {
        htmlString += /*html*/ `
        <a part="button" target="_blank" title="YouTube" href="${this.dataset.youtube}">
          <img height="21" src="/assets/icons/youtube.svg" alt=""/>
        </a>
      `;
      }

      // Add Spotify button
      if (this.dataset.spotify) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Spotify" href="${this.dataset.spotify}">
            <img src="/assets/icons/spotify.svg" height="21" alt=""/>
          </a>
        `;
      }

      // Add Tickets button
      if (this.dataset.tickets) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Conseguir Entradas" href="${this.dataset.tickets}">
            <img src="/assets/icons/ticket.svg" height="21" alt=""/>
          </a>
        `;
      }

      // Add Form button
      if (this.dataset.form) {
        htmlString += /*html*/ `
        <a part="button" target="_blank" title="Formulario" href="${this.dataset.form}">
          <img src="/assets/icons/form.svg" height="23" alt=""/>
        </a>
      `;
      }

      // Add Another link button
      if (this.dataset.link) {
        htmlString += /*html*/ `
        <a part="button" target="_blank" title="Link externo" href="${this.dataset.link}">
          <img src="/assets/icons/link.svg" height="28" alt=""/>
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
        <a href="${location.origin}/${this.dataset.slug}" title="Compartir este evento">
          <img src="/assets/icons/share.svg" height="21" alt=""/>
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
function formatEventDate(date, { onlyTime = false } = {}) {
  const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
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
