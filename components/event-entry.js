import "./share-url.js";
import {
  generateImageUrl,
  getFileIdFromDriveUrls,
  enhanceEvent,
  parseDateString,
  isDateToday,
  formatPhoneNumber,
  formatDateString,
  isValidUrl,
  createGoogleCalendarUrl,
  slugify,
} from "../lib/utils.js";

customElements.define(
  "event-entry",
  class extends HTMLElement {
    constructor() {
      super();
      this._data = null;
    }

    /**
     * @param {EventResponse} event
     */
    set data(event) {
      this._data = enhanceEvent(event);
    }

    /**
     * @returns {EventData}
     */
    get data() {
      return this._data;
    }

    connectedCallback() {
      if (this._data) this.render();
      this?._data?.id && this.setAttribute("id", this._data.id);

      this.querySelector("details").addEventListener("toggle", this);
      this.querySelector(".event-image").addEventListener("click", (event) => {
        event.target.nextElementSibling.firstElementChild.click();
      });
    }

    /**
     * @param {Object} event
     */
    render() {
      const event = this._data;

      this.innerHTML = /*html*/ `
      <h3 ${
        isDateToday(event.startDate) ? "" : "hidden"
      } class="today-reminder">¡HOY!</h3>
      <img class="event-image" height="400px" src="${
        event.imageUrl
      }" loading="lazy" alt="Evento en ${
        event["Localidad"]
      } el ${formatDateString(event["Comienzo"])}">
        <details ${this.open ? "open" : ""}>
          <summary>

          <div class="info">
            <p>${event["Localidad"]}</p>
            <p class="datetime">
            ${formatDateString(event["Comienzo"])}
            </p>
          </div>
          </summary>

          <p slot="description" part="description">${event["Descripción"]} </p>

          <div part="buttons">
            ${this.renderButtons()}
          </div>

        </details>
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
        // this.toggleAttribute("open", event.target.open);
      }
    }

    renderButtons() {
      let htmlString = "";
      const event = this._data;

      // Add WhatsApp button
      if (event["Teléfono de contacto"]) {
        let helloMsg =
          "Hola! 😃\nTe escribo desde eventos.trasla.com.ar por una consulta:\n\n";
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Contactarse por este evento" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
            event["Teléfono de contacto"]
          )}&text=${encodeURI(helloMsg)}">
            <img src="/assets/icons/whatsapp-256w.png" height="100%" alt="WhatsApp" loading="lazy"/>
          </a>
        `;
      }

      // Add Instagram button
      if (event["Instagram"]) {
        htmlString += /*html*/ `
          <a part="button" target="_blank" href="https://instagram.com/${event[
            "Instagram"
          ].replace("@", "")}">
            <img src="/assets/icons/instagram-240w.png" height="100%" alt="Instagram" loading="lazy"/>
          </a>
        `;
      }

      // Add Google Maps button
      if (event["Ubicación"]) {
        let href = event["Ubicación"];
        if (!isValidUrl(href))
          href = `https://www.google.com/maps/search/?api=1&query=${encodeURI(
            event["Ubicación"]
          )}`;

        htmlString += /*html*/ `
          <a part="button" target="_blank" href=${href} title="Ir a la ubicación del evento">
            <img src="/assets/icons/google-maps-256w.png" height="100%" alt="Google Maps" loading="lazy"/>
          </a>
        `;
      }

      // Add Google Calendar button
      htmlString += /*html*/ `<a target="_blank" part="button" href="${createGoogleCalendarUrl(
        event
      )}"><img src="/assets/icons/google-calendar.svg" height="100%"></a>`;

      // Add link to share the event
      const slug = slugify(
        event["Localidad"] + " " + formatDateString(event["Comienzo"])
      );

      const shareAction =
        navigator.share && navigator.canShare() ? "share" : "clipboard";
      const sharedMsg = shareAction == "share" ? "Compartido" : "Link copiado";
      const shareUrl = `${location.origin}?q=${encodeURI(slug)}`;
      const shareTitle =
        event["Título"] ||
        `Evento en ${event["Localidad"]} el ${formatDateString(
          event["Comienzo"]
        )}`;

      htmlString += /*html*/ `
        <share-url action="${shareAction}" text-success="${sharedMsg}" url="${shareUrl}" title="${shareTitle}">
        <button part="button">
          <svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        </button>
      </share-url>`;

      return htmlString;
    }
  }
);
