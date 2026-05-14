const PAGE_SIZE_ATTRIBUTE = "page-size";
const DEFAULT_PAGE_SIZE = 10;

customElements.define(
  "events-filter",
  class extends HTMLElement {
    connectedCallback() {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => this.init());
      } else {
        setTimeout(() => this.init(), 1);
      }
    }

    set pageSize(value) {
      this.setAttribute(PAGE_SIZE_ATTRIBUTE, value);
    }

    get pageSize() {
      return Number(this.getAttribute(PAGE_SIZE_ATTRIBUTE));
    }

    init() {
      if (!this.pageSize) this.pageSize = DEFAULT_PAGE_SIZE;
      this.paginateAt = this.pageSize;

      this.formEl = this.querySelector("form");
      this._noop = !this.formEl || !this.querySelector("event-entries");

      if (this._noop) return;

      if (!this.formEl["startDate"].value) {
        this._setStartDateToToday();
      }

      this.formEl.addEventListener("input", this);
      this.formEl.addEventListener("submit", this);

      if (this.dataset.hide === "when") {
        this.formEl.querySelectorAll("[part~=when]").forEach((el) => el.remove());
      }
      if (this.dataset.hide === "where") {
        this.formEl.querySelectorAll("[part~=where]").forEach((el) => el.remove());
      }

      this.updateUI();
    }

    set allShown(value) {
      this.toggleAttribute("all-shown", value);
    }

    get allShown() {
      return this.hasAttribute("all-shown");
    }

    handleEvent(event) {
      if (event.type === "submit") {
        event.preventDefault();
      }

      this.updateUI();
    }

    /**
     *
     * @param {Date} [date] - The date to set the input to. If empty, defaults to today.
     */
    _setStartDateToToday(date = new Date()) {
      date.setUTCDate(date.getDate());
      this.formEl["startDate"].value = date.toISOString().split("T")[0];
    }

    setEndDate(date) {
      let value = ""; // No end date by default
      if (!!date) {
        date.setDate(date.getUTCDate());
        date.setHours(23, 59, 59);
        value = date.toISOString().split("T")[0];
      }
      this.formEl["endDate"].value = value;
    }

    showMore(moreToShow = 10) {
      this.paginateAt += moreToShow;
      if (this._noop) return;
      this._toggleEventsPaginationVisibility();
    }

    updateUI() {
      if (this._noop) return;
      this._allEvents = this.querySelectorAll("event-entry");
      this._localitiesFormEl = this.formEl.querySelector("[name=locality]");
      this._filterEvents();
      this._toggleEventsPaginationVisibility();
      this._updateLocalitiesOptions();
    }

    _updateLocalitiesOptions({ showCount = false } = {}) {
      if (this._localitiesFormEl?.options.length <= 1) return;

      const availableLocalities = new Map();
      const formData = new FormData(this.formEl);

      this._allEvents.forEach((event) => {
        if (_shouldExcludeEvent(event, formData, { keysToOmit: ["locality"] })) return;
        let localityCount = availableLocalities.has(event.dataset.locality) ? availableLocalities.get(event.dataset.locality) : 0;
        availableLocalities.set(event.dataset.locality, localityCount + 1);
      });

      for (const option of this._localitiesFormEl?.options) {
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
     *  Filter events based on the current filters.
     *  An event is considered filtered out when it has the `excluded` attribute.
     */
    _filterEvents() {
      let includedCount = 0;
      const formData = new FormData(this.formEl);
      // Events DOM order expected by date
      this._allEvents.forEach((event) => {
        if (_shouldExcludeEvent(event, formData)) {
          event.toggleAttribute("excluded", true);
          includedCount++;
        } else {
          event.toggleAttribute("excluded", false);
        }
      });
    }

    /**
     * Show events in selected date or until `this.paginateAt`.
     * Skips excluded events. Hide the rest.
     * Sets `all-shown` attribute if all events are shown.
     */
    _toggleEventsPaginationVisibility() {
      let shownCount = 0;
      let allShown = true;
      // Events DOM order expected by date
      const formData = new FormData(this.formEl);
      this.querySelectorAll("event-entry").forEach((event) => {
        if (event.hasAttribute("excluded")) return;

        // Show up to this.paginateAt count of events
        if (shownCount < this.paginateAt) {
          shownCount++;
          event.hidden = false;
          return;
        }

        // Also ensure we show all events happening in selected `startDate` form input
        if (new Date(event.dataset.startsAt) <= new Date(`${formData.get("startDate")}T23:59:59`)) {
          shownCount++;
          this.paginateAt++;
          event.hidden = false;
          return;
        }

        event.hidden = true;
        allShown = false;
      });

      this.allShown = allShown;
    }
  },
);

/**
 *
 * @param {eventEntry} event
 * @param {FormData} filters
 * @param {Object} options
 * @returns `true` if the event should be excluded, `false` otherwise.
 */
function _shouldExcludeEvent(event, filters, { keysToOmit = [] } = {}) {
  const localities = filters.getAll("locality");
  if (localities.length > 0 && !keysToOmit.includes("locality")) {
    // if a locality=="" is selected, it means "all localities", so we don't exclude anything
    const hasMatchingLocality = localities.some((locality) => event.dataset.locality.includes(locality));
    if (!hasMatchingLocality) {
      return true;
    }
  }

  for (const [key, value] of filters) {
    if (keysToOmit.includes(key) || !value || key === "locality") continue;
    // Filter out events starting before given date
    if (key == "startDate") {
      const minDate = new Date(value + "T00:00:00");
      if (new Date(event.dataset.startsAt) < minDate) {
        return true;
      }
    }

    // Filter out events starting after given date
    if (key == "endDate") {
      const maxDate = new Date(value + "T23:59:59");
      if (maxDate < new Date(event.dataset.startsAt)) {
        return true;
      }
    }
    // Filter by search term
    if (key == "search") {
      for (const word of value.toLowerCase().trim().split(" ")) {
        if (!event.dataset.title?.toLowerCase().includes(word)) {
          return true;
        }
      }
    }
  }

  const activities = filters.getAll("activities[]");
  if (!activities.includes(event.dataset.activity)) {
    return true;
  }

  return false;
}
