customElements.define(
  "events-filter",
  class extends HTMLElement {
    constructor() {
      super();
      this.events = this.querySelector("event-entries");
      this.form = this.querySelector("form");
      this.paginateAt = 10;
      this.allShown = false;

      if (!this.form["dateFrom"].value) {
        this.setStartDateToToday();
      }

      this.form.addEventListener("input", this);
      this.form.addEventListener("submit", this);
    }

    handleEvent(event) {
      if (event.type === "submit") {
        event.preventDefault();
      }

      this.updateUI();
    }

    updateLocalitiesOptions({ showCount = false } = {}) {
      const availableLocalities = new Map();
      const formData = new FormData(this.form);
      this.events.querySelectorAll("event-entry").forEach((event) => {
        if (shouldExcludeEvent(event, formData, { keysToOmit: ["locality"] })) return;
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

    showMore(moreToShow = 10) {
      this.paginateAt += moreToShow;
      this.toggleEventsPaginationVisibility();
    }

    updateUI() {
      this.filterEvents();
      this.toggleEventsPaginationVisibility();
      this.updateLocalitiesOptions();
    }

    /**
     *  Filter events based on the current filters.
     *  An event is considered filtered out when it has the 'excluded' attribute.
     */
    filterEvents() {
      let includedCount = 0;
      let moreEventsAvailable = false;
      const formData = new FormData(this.form);
      // Events DOM order expected by date
      this.events.querySelectorAll("event-entry").forEach((event) => {
        if (shouldExcludeEvent(event, formData)) {
          event.toggleAttribute("excluded", true);
          includedCount++;
        } else {
          event.toggleAttribute("excluded", false);
        }
      });

      if (!moreEventsAvailable) this.allShown = true;
    }

    /*
     *  Show included events until `this.paginateAt`.
     */
    toggleEventsPaginationVisibility() {
      let shownCount = 0;
      let allShown = true;
      // Events DOM order expected by date
      this.events.querySelectorAll("event-entry").forEach((event) => {
        if (event.hasAttribute("excluded")) return;

        if (shownCount < this.paginateAt) {
          shownCount++;
          event.hidden = false;
          return;
        }

        event.hidden = true;
        allShown = false;
      });

      this.allShown = allShown;
    }
  }
);

/**
 *
 * @param {eventEntry} element
 * @param {FormData} filters
 * @param {Object} options
 * @returns true if the element should be ex, false otherwise.
 */
function shouldExcludeEvent(element, filters, { keysToOmit = [] } = {}) {
  let shouldExclude = false;
  for (const [key, value] of filters) {
    if (keysToOmit.includes(key)) continue;

    // Filter by locality
    if (key === "locality") {
      if (!element.dataset.locality.includes(value)) {
        shouldExclude = true;
      }
    }
    // Filter by start date
    if (key == "startDate") {
      const startDate = new Date(value);
      startDate.setDate(startDate.getUTCDate());
      startDate.setHours(0);
      if (element.startDate < startDate) {
        shouldExclude = true;
      }
    }

    // Filter by end date
    if (key == "endDate") {
      const endDate = new Date(value);
      endDate.setDate(endDate.getUTCDate());
      endDate.setHours(23, 59, 59);
      if (element.startDate > endDate) {
        shouldExclude = true;
      }
    }
    // Filter by search term
    if (key == "search") {
      for (const word of value.toLowerCase().trim().split(" ")) {
        if (!element.dataset.title.toLowerCase().includes(word)) {
          shouldExclude = true;
        }
      }
    }
  }

  const activities = filters.getAll("activities[]");
  if (!activities.includes(element.dataset.activity)) {
    shouldExclude = true;
  }

  return shouldExclude;
}
