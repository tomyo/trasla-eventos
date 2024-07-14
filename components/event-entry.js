/**
 * @type {CSSStyleSheet?}
 */
let styles = null;

customElements.define(
  "event-entry",
  class extends HTMLElement {
    constructor() {
      super().attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this.addStyles();
      if (this.data) this.render();

      this.shadowRoot.querySelector("details").addEventListener("toggle", this);
    }

    /**
     * @param {Object} event
     */
    render() {
      const event = this.data;

      this.shadowRoot.innerHTML = /*html*/ `
        <details>
        <summary>
          <img src="${event.image_url}" width="100%s">
          <div class="info">
            <div class="location">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M515.664-.368C305.76-.368 128 178.4 128 390.176c0 221.76 206.032 448.544 344.624 607.936.528.64 22.929 25.52 50.528 25.52h2.449c27.6 0 49.84-24.88 50.399-25.52 130.064-149.52 320-396.048 320-607.936C896 178.4 757.344-.368 515.664-.368zm12.832 955.552c-1.12 1.12-2.753 2.369-4.193 3.409-1.472-1.008-3.072-2.288-4.255-3.408l-16.737-19.248C371.92 785.2 192 578.785 192 390.176c0-177.008 148.224-326.56 323.664-326.56 218.528 0 316.336 164 316.336 326.56 0 143.184-102.128 333.296-303.504 565.008zm-15.377-761.776c-106.032 0-192 85.968-192 192s85.968 192 192 192 192-85.968 192-192-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.408 0-70.576 57.424-128 128-128 70.624 0 128 57.424 128 128 .032 70.592-55.903 129.408-126.527 129.408z"/></svg>
              <p>${event.Localidad}</p>
            </div>
            <div class="datetime">
              <p>${event["Fecha desde"]}</p>
              <p>${event["Hora desde"]}h</p>
            </div>
          </div>
        </summary>

        <p>${event["Descripción"]}</p>

        <a part="button" href="tel:+54666999666">
          Contactar
        </a>
      </details>
    `;
    }

    addStyles() {
      styles = new CSSStyleSheet();
      styles.replace(/*css*/ `
        :host {
          --visible-elements: 1;
          --padding: 0.5rem 1rem;
          display: block;
          padding: var(--padding);
          margin: 1rem;
          border-radius: 0.5rem;
          min-width: min-content;
          text-align: center; /* Center CTA button */
          }

          @media (640px < width) {
            --visible-elements: 1;
            --padding: 1rem;

            summary {
              /* Show a row instead of a column of elements */
              --grid-template: 1fr / repeat(var(--visible-elements), 1fr);
              --row-gap: 2rem;
            }
          }
        

        summary {
          --row-gap: 1rem;
          --grid-template: repeat(var(--visible-elements), 1fr) / 1fr;

          display: grid;
          grid-template: var(--grid-template);
          align-items: center;
          gap: var(--row-gap) 1rem;
          cursor: pointer;
          margin-block: 1rem;
          align-items: start;
          position: relative;

          .location, .datetime{
            display: flex;
            gap: .5rem;
          }

        

          > * {
            --display: flex;
            --flow: column;
            display: var(--display);
            flex-flow: var(--flow) nowrap;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;

            @media (640px < width) {
              & {
                --flow: column;
              }
            }
            
            

            svg {
              color: color-mix(in srgb, currentColor 60%, transparent);
            }
            
            input[type="date"] {
              -webkit-appearance: none; /* Remove arrow in chrome mobile */
              background: transparent;
              width: min-content;
              border: none;
              padding: 0;
              
              font-family: inherit;
              font-size: inherit;
              color: inherit;

              &:disabled {
                /* Allow click on parent to toggle details open/close */
                pointer-events:none;
              }
            }
            
            p {
              --margin: 0 2px; /* match input date */
              text-align: center;
              margin: var(--margin);
            }
          }

          &::-webkit-details-marker {
            display: none;
          }
        }
      `);

      this.shadowRoot.adoptedStyleSheets.push(styles);
      console.info("pushed styles", styles);
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
 * @param {Object} event - A event object
 */
export function createeventElementFrom(event) {
  const eventElement = document.createElement("event-entry");
  eventElement.data = event;
  return eventElement;
}

function makeEmailSubject(event) {
  const date =
    event.date_from +
    (event.date_to != event.date_from ? ` ~ ${event.date_to}` : "");
  return `Consulta por vuelo de ${event.origin} a ${event.destination} el ${date}`;
}
