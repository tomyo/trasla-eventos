customElements.define(
  "events-filter",
  class extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("input", this);
      this.events = this.querySelector("event-entries");
      this.form = this.querySelector("form");

      // Detect events changes and update hide/show them according to the filters.
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            showHideEvents(this.events, [...new FormData(this.form)]);
          }
        });

        this.updateLocalitiesOptions(this.events);
      });
      observer.observe(this.events, { childList: true });

      this.updateLocalitiesOptions(this.events);
    }

    handleEvent(event) {
      if (event.type === "input") {
        showHideEvents(this.events, [...new FormData(this.form)]);
      }
    }

    updateLocalitiesOptions(events, { showCount = false } = {}) {
      const availableLocalities = new Map();
      events.querySelectorAll("event-entry").forEach((event) => {
        let locality = event.dataset.locality;
        let localityCount = availableLocalities.has(locality)
          ? availableLocalities.get(locality)
          : 0;
        availableLocalities.set(event.dataset.locality, localityCount + 1);
      });
      for (const option of this.form.querySelector("[name=locality]").options) {
        if (option.value == "") continue;
        if (!availableLocalities.has(option.value)) {
          option.hidden = true;
          continue;
        }
        if (showCount)
          option.textContent = `${option.value} (${availableLocalities.get(
            option.value
          )})`;
        option.hidden = false;
      }
    }
  }
);

function showHideElement(element, criteriaFormData) {
  let shouldHide = false;
  for (const [key, value] of criteriaFormData) {
    // Filter by locality
    if (key === "locality") {
      if (!element.dataset.locality.includes(value)) {
        shouldHide = true;
      }
    }
    // Filter by start date
    if (key == "startDate") {
      if (element.startDate < new Date(value)) {
        shouldHide = true;
      }
    }
  }
  if (shouldHide) return element.toggleAttribute("hidden", true);

  element.removeAttribute("hidden");
}

/**
 *
 * @param {[HTMLElement]} events
 * @param {FormData} criteriaFormData
 */
function showHideEvents(events, criteriaFormData) {
  events.querySelectorAll("event-entry").forEach((event) => {
    showHideElement(event, criteriaFormData);
  });
}
