customElements.define(
  "events-filter",
  class extends HTMLElement {
    constructor() {
      super();
      this.events = this.querySelector("event-entries");
      this.form = this.querySelector("form");

      if (!this.form["dateFrom"].value) {
        this.setStartDateToToday();
      }

      // Set the end date to one week from now by default
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      this.setEndDate();
      this.updateLocalitiesOptions(this.events);

      this.form.addEventListener("input", this);
      this.addEventListener("click", this);
      this.form.addEventListener("submit", this);

      // Detect events changes and update hide/show them according to the filters.
      const observer = new MutationObserver((mutations) => {
        this.updateLocalitiesOptions(this.events);
      });
      observer.observe(this.events, { childList: true });
    }

    handleEvent(event) {
      if (event.type === "submit") {
        event.preventDefault();
      }
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
        let localityCount = availableLocalities.has(locality) ? availableLocalities.get(locality) : 0;
        availableLocalities.set(event.dataset.locality, localityCount + 1);
      });

      for (const option of this.form.querySelector("[name=locality]").options) {
        if (option.value == "") continue;
        if (!availableLocalities.has(option.value)) {
          option.hidden = true;
          continue;
        }
        if (showCount) option.textContent = `${option.value} (${availableLocalities.get(option.value)})`;
        option.hidden = false;
      }
    }

    /**
     *
     * @param {Date} [date] - The date to set the input to. If empty, defaults to today.
     */
    setStartDateToToday(date) {
      date = new Date();
      date.setUTCDate(date.getDate());
      this.form["startDate"].value = date.toISOString().split("T")[0];
    }

    setEndDate(date) {
      let value = ""; // No end date by default
      if (!!date) {
        date.setDate(date.getUTCDate());
        date.setHours(23, 59, 59);
        value = date.toISOString().split("T")[0];
      }
      this.form["endDate"].value = value;
    }

    resetFilters() {
      this.form.reset();
      this.setStartDateToToday();
      this.setEndDate();
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
      const startDate = new Date(value);
      startDate.setDate(startDate.getUTCDate());
      startDate.setHours(0);
      if (element.startDate < startDate) {
        shouldHide = true;
      }
    }

    // Filter by end date
    if (key == "endDate") {
      const endDate = new Date(value);
      endDate.setDate(endDate.getUTCDate());
      endDate.setHours(23, 59, 59);
      if (element.startDate > endDate) {
        shouldHide = true;
      }
    }
    // Filter by search term
    if (key == "search") {
      for (const word of value.toLowerCase().trim().split(" ")) {
        if (!element.dataset.title.toLowerCase().includes(word)) {
          shouldHide = true;
        }
      }
    }
  }

  const activities = filters.getAll("activities[]");
  if (!activities.includes(element.dataset.activity)) {
    shouldHide = true;
  }

  if (shouldHide) return element.toggleAttribute("hidden", true);

  element.removeAttribute("hidden");
}
