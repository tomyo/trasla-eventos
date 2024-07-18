/**
 * @typedef {Object} EventResponse - The response from the Google Form.
 * @property {string} MarcaTemporal - The timestamp of the event.
 * @property {string} DireccionDeCorreoElectronico - The email address ("Dirección de correo electrónico").
 * @property {string} Localidad - The locality.
 * @property {string} Imagen - The URL of the image.
 * @property {string} [Ubicacion] - The location description ("Ubicación").
 * @property {string} [Descripcion] - The event description ("Descripción").
 * @property {string} Comienzo - The start time of the event.
 * @property {string} [Cierre] - The end time of the event.
 * @property {string} [TelefonoDeContacto] - The contact phone number ("Teléfono de contacto").
 * @property {string|null} [Instagram] - The Instagram handle (can be null).
 */

/**
 * @typedef  {EventResponse} EventData  - The iternal event data.
 * @property {string} id - The unique identifier.
 * @property {string} imageUrl - The URL for the image thumbnail.
 */

function formatDateString(dateString) {
  if (!dateString) return "";
  return dateString
    .replace(/:00$/, "h") // Remove seconds
    .replace(/^(.*\/.*\/)\d\d(\d\d)/, "$1$2 -"); // Remove century
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  phoneNumber = phoneNumber.replace(/[^\d+]/g, "");
  return phoneNumber?.startsWith("+") ? phoneNumber : `+54${phoneNumber}`;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    try {
      new URL(`http://${string}`);
      return true;
    } catch {
      return false;
    }
  }
}

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
      <img class="event-image" height="400px" src="${
        event.imageUrl
      }" loading="lazy" alt="Evento en ${
        event["Localidad"]
      } el ${formatDateString(event["Comienzo"])}">
        <details>
          <summary>

          <div class="info">
            <p>${event["Localidad"]}</p>
            <p class="datetime">
            ${formatDateString(event["Comienzo"])}
            </p>
          </div>
          </summary>

          <p slot="description" part="description">${event["Descripción"]} </p>

          ${this.renderButtons()}
        </details>
      `;
    }

    renderButtons() {
      let htmlString = "";
      const event = this._data;
      if (event["Teléfono de contacto"]) {
        let helloMsg =
          "Hola! 😃\nTe escribo desde eventos.trasla.com.ar por una consulta:\n\n";
        htmlString += /*html*/ `
          <a part="button" target="_blank" title="Contactarse por este evento" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
            event["Teléfono de contacto"]
          )}&text=${encodeURI(helloMsg)}">
            <img src="/assets/icons/whatsapp-w256.png" height="100%" alt="WhatsApp" loading="lazy"/>
          </a>
        `;
      }

      if (event["Ubicación"]) {
        let href = event["Ubicación"];
        if (!isValidUrl(href))
          href = `https://www.google.com/maps/search/?api=1&query=${encodeURI(
            event["Ubicación"]
          )}`;

        htmlString += /*html*/ `
          <a part="button" target="_blank" href=${href} title="Ir a la ubicación del evento">
            <img src="/assets/icons/google-maps-w256.png" height="100%" alt="Google Maps" loading="lazy"/>
          </a>
        `;
      }

      return htmlString;
    }

    handleEvent(event) {
      if (event.type === "toggle") {
        this.toggleAttribute("open", event.target.open);
      }
    }
  }
);

/**
 *
 * @param {EventResponse} event
 * @returns {EventData}
 */
function enhanceEvent(event) {
  // Provide a image_url
  const imageIdRegexp = /id=([\d\w-]*)/gm;
  const imageIdMatch = imageIdRegexp.exec(event["Imagen"]);
  const fileId = imageIdMatch && imageIdMatch.pop(); // Get the last file
  if (fileId) {
    event.id = fileId;
    event.imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w512`;
  }

  if (event["Descripción"]) {
    // Replace URLs in the content with proper anchor tags
    const urlRegex =
      /(\b(?:https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    event["Descripción"] = event["Descripción"].replace(urlRegex, (match) => {
      let url = new URL(match);
      // Remove the query parameters from the visual text
      url.search = "";
      return `<a href="${match}" target="_blank">${url.href}</a>`;
    });

    // Replace new lines with <br> tags
    event["Descripción"] = event["Descripción"].replace(/\n/g, "<br>");

    // Replace phone numbers with WhatsApp links
    const phoneRegex = /(\+?\d{2,3})?(\d{10})/g;
    event["Descripción"] = event["Descripción"].replace(phoneRegex, (match) => {
      return `<a href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
        match
      )}" target="_blank">${match}</a>`;
    });

    // Replace Instagram handles with links
    const instagramRegex = /@([a-zA-Z0-9_.]{1,30})/g;
    event["Descripción"] = event["Descripción"].replace(
      instagramRegex,
      (match) => {
        return `<a href="https://instagram.com/${match.slice(
          1
        )}" target="_blank">${match}</a>`;
      }
    );
  }

  return event;
}
