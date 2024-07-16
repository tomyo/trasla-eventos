/**
 * @type {CSSStyleSheet?}
 */
let styles = null;

function formatDateString(dateString) {
  if (!dateString) return "";
  return dateString
    .replace(/:00$/, "h")
    .replace(/^(.*\/.*\/)\d\d(\d\d)/, "$1$2");
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";

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
    }

    connectedCallback() {
      if (this.data) this.render();
      this?.data?.id && this.setAttribute("id", this.data.id);

      this.querySelector("details").addEventListener("toggle", this);
    }

    /**
     * @param {Object} event
     */
    render() {
      const event = this.data;

      this.innerHTML = /*html*/ `
        <details> 
          <summary>
            <img class="event-image" src="${event.imageUrl}">
            <div class="info">
              <div class="location">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M515.664-.368C305.76-.368 128 178.4 128 390.176c0 221.76 206.032 448.544 344.624 607.936.528.64 22.929 25.52 50.528 25.52h2.449c27.6 0 49.84-24.88 50.399-25.52 130.064-149.52 320-396.048 320-607.936C896 178.4 757.344-.368 515.664-.368zm12.832 955.552c-1.12 1.12-2.753 2.369-4.193 3.409-1.472-1.008-3.072-2.288-4.255-3.408l-16.737-19.248C371.92 785.2 192 578.785 192 390.176c0-177.008 148.224-326.56 323.664-326.56 218.528 0 316.336 164 316.336 326.56 0 143.184-102.128 333.296-303.504 565.008zm-15.377-761.776c-106.032 0-192 85.968-192 192s85.968 192 192 192 192-85.968 192-192-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.408 0-70.576 57.424-128 128-128 70.624 0 128 57.424 128 128 .032 70.592-55.903 129.408-126.527 129.408z"/></svg>
                <p>${event.Localidad}</p>
              </div>
              <p class="datetime">
                ${formatDateString(event["Comienzo"])}
              </p>
            </div>
          </summary>

          <p slot="description" part="description">${event["Descripción"]}</p>

          ${this.renderButtons()}
        </details>
      `;
    }

    renderButtons() {
      let htmlString = "";
      const event = this.data;
      if (event["Teléfono de contacto"]) {
        let helloMsg =
          "Hola! 😃\nTe escribo desde eventos.trasla.com.ar por una consulta:\n\n";
        htmlString += /*html*/ `
          <a part="button" target="_blank" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
            event["Teléfono de contacto"]
          )}&text=${encodeURI(helloMsg)}">
            <img src="/assets/icons/whatsapp-w256.png" height="100%"/>
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
          <a part="button" target="_blank" href=${href}>
            <img src="/assets/icons/google-maps-w256.png" height="100%"/>
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
