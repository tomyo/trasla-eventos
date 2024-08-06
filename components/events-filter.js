customElements.define(
  "events-filter",
  class extends HTMLElement {
    constructor() {
      super();
      this.events = this.querySelector("event-entries");
      this.form = this.querySelector("form");

      this.setStartDate();
      this.updateLocalitiesOptions(this.events);

      this.addEventListener("input", this);
      this.addEventListener("click", this);

      // Detect events changes and update hide/show them according to the filters.
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            this.showHideEvents();
          }
        });

        this.updateLocalitiesOptions(this.events);
      });
      observer.observe(this.events, { childList: true });
    }

    handleEvent(event) {
      if (event.type === "input") {
        this.showHideEvents();
      }
      if (event.type === "click" && event.target.type === "reset") {
        this.resetFilters();
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

    /**
     *
     * @param {Date} [date] - The date to set the input to. If empty, defaults to today.
     */
    setStartDate(date) {
      if (!date) date = new Date();

      const formattedDate = date.toISOString().split("T")[0];
      this.form["startDate"].value = formattedDate;
    }

    resetFilters() {
      this.form.reset();
      this.setStartDate();
      this.updateLocalitiesOptions(this.events);
      this.showHideEvents();
    }

    /**
     *  Show or hide events based on the current filters.
     */
    showHideEvents() {
      this.events.querySelectorAll("event-entry").forEach((event) => {
        showHideElement(event, new FormData(this.form));
      });
    }
  }
);

/**
 *
 * @param {event-entry} element
 * @param {FormData} filters
 * @returns
 */
function showHideElement(element, filters) {
  let shouldHide = false;
  for (const [key, value] of filters) {
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
