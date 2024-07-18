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
    }

    /**
     * @param {Object} event
     */
    render() {
      const event = this._data;

      this.innerHTML = /*html*/ `
        <details> 
          <summary>
            <img class="event-image" height="400px" src="${
              event.imageUrl
            }" loading="lazy" alt="Evento en ${
        event["Localidad"]
      } el ${formatDateString(event["Comienzo"])}">
            <div class="info">
              <div class="location">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M515.664-.368C305.76-.368 128 178.4 128 390.176c0 221.76 206.032 448.544 344.624 607.936.528.64 22.929 25.52 50.528 25.52h2.449c27.6 0 49.84-24.88 50.399-25.52 130.064-149.52 320-396.048 320-607.936C896 178.4 757.344-.368 515.664-.368zm12.832 955.552c-1.12 1.12-2.753 2.369-4.193 3.409-1.472-1.008-3.072-2.288-4.255-3.408l-16.737-19.248C371.92 785.2 192 578.785 192 390.176c0-177.008 148.224-326.56 323.664-326.56 218.528 0 316.336 164 316.336 326.56 0 143.184-102.128 333.296-303.504 565.008zm-15.377-761.776c-106.032 0-192 85.968-192 192s85.968 192 192 192 192-85.968 192-192-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.408 0-70.576 57.424-128 128-128 70.624 0 128 57.424 128 128 .032 70.592-55.903 129.408-126.527 129.408z"/></svg>
                <p>${event["Localidad"]}</p>
              </div>
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
  }

  return event;
}
