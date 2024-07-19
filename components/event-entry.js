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
 * @property {string} [Instagram] - The Instagram handle.
 * @property {string} [Titulo] - The title of the event. ("Título")
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
      htmlString += /*html*/ `<a target="_blank" part="button" href="${
        location.origin
      }?q=${encodeURI(
        slug
      )}"><svg xmlns="http://www.w3.org/2000/svg" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></a>`;

      return htmlString;
    }
  }
);

/**
 *
 * @param {EventResponse} event
 * @returns {EventData}
 */
function enhanceEvent(event) {
  // Add start/end Date objects
  event.startDate = parseDateString(event["Comienzo"]);
  event.endDate = event["Cierre"] ? parseDateString(event["Cierre"]) : null;

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

function slugify(text) {
  const from = "àáäâãåçèéêëìíîïñòóôöõùúûüýÿ";
  const to = "aaaaaaceeeeiiiinooooouuuuyy";

  // Create a map of accented characters to their replacements
  const map = {};
  for (let i = 0; i < from.length; i++) {
    map[from.charAt(i)] = to.charAt(i);
  }

  // Replace accented characters and other necessary replacements
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-/]/g, (char) => map[char] || "") // Replace non-ASCII chars with mapped chars or remove
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/\//g, "-") // Replace slashes with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens

  return slug;
}

/**
 *
 * @param {EventData} event
 * @returns
 */
function createGoogleCalendarUrl(event) {
  const hook = "Más información en https://eventos.trasla.com.ar\n\n";
  const eventTitle = `${event["Título"] || "Evento"} en ${event["Localidad"]}`;

  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const encodedDetails = encodeURIComponent(hook + event["Descripción"] || "");
  const encodedLocation = encodeURIComponent(event["Ubicación"] || "");
  const encodedSummary = encodeURIComponent("Evento en " + event["Localidad"]);

  let url = `${baseUrl}&text=${encodedSummary}&details=${encodedDetails}&location=${encodedLocation}`;
  const startDate = parseDateString(event["Comienzo"]);
  const startDateString = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  // Default event duration is 2 hours if end time is not provided.
  let endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  if (event["Cierre"]) endDate = parseDateString(event["Cierre"]);
  const endDateString = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  url += `&dates=${startDateString}/${endDateString}`;
  return url;
}

/**
 *
 * @param {String} dateString
 * @returns {Date}
 *
 * Format expected: "dd/mm/yyyy hh:mm:ss"
 */
function parseDateString(dateString) {
  const [date, time] = dateString.split(" ");
  const [day, month, year] = date.split("/");
  const [hour, minute] = time.split(":");
  return new Date(year, month - 1, day, hour, minute);
}

/**
 *
 * @param {Date} date
 * @returns {boolean} True if the date is today.
 */
function isDateToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
