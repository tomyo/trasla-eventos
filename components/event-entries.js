/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateForTimeEntry(dateString) {
  return new Date(dateString)
    .toLocaleDateString("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC", // Interpret as UTC to avoid timezone missmatch
    })
    .toUpperCase();
}

/**
 * This components assumesthat:
 * - slotted events are sorted in ascending order by time
 * - slotted events have a date attribute in YYYY-MM-DD format
 */
customElements.define(
  "event-entries",
  class extends HTMLElement {
    constructor() {
      super().attachShadow({ mode: "open" }).innerHTML = /*html*/ `
        <style>
          [hidden]{
            display: none !important;
          }
        </style>
        <slot name="loading" part="loading">
          <p part="loading" style="text-align: center">· · ·</p>
        </slot>
        <slot></slot>
      `;

      this.root = this.shadowRoot ? this.shadowRoot : this;
      this.loadingSlot = this.root.querySelector("slot[name='loading']");
      this.defaultSlot = this.root.querySelector("slot:not([name])");
      this.dates = []; // Store dates (YYYY-MM-DD) present in the slotted events

      // Consume eventEntry elements via slotchange event
      this.defaultSlot.addEventListener("slotchange", this);
      // Observe attribute changes on eventEntry elements to update visibility of date groups
      this.dateGroupsVisibilityObserver = new MutationObserver((mutations) =>
        this.updateDateGroupsVisibility(mutations.map((mutation) => mutation.target.slot).filter(Boolean))
      );
    }

    handleEvent(event) {
      if (event.type !== "slotchange") return;
      this.loadingSlot.hidden = true;

      for (const eventEntry of event.target.assignedElements({ flatten: true })) {
        this.appendEventEntryToDateSlot(eventEntry);
        // Track hidden/excluded attribute changes to update time entries visibility
        this.dateGroupsVisibilityObserver.observe(eventEntry, { attributeFilter: ["hidden", "excluded"] });
        this.updateDateGroupsVisibility(this.dates);
      }
    }

    /**
     * Appends an event entry to the corresponding named slot, or creates it if it doesn't exist
     * @param {HTMLElement} eventEntry - The event entry to append
     */
    appendEventEntryToDateSlot(eventEntry) {
      const date = eventEntry.getAttribute("date");
      eventEntry.slot = date;

      if (!this.dates.includes(date)) {
        this.dates.push(date);
        const template = document.createElement("template");
        template.innerHTML = /*html*/ `
            <time date="${date}" part="date-label">
              ${formatDateForTimeEntry(date)}
            </time>
            <slot date="${date}" name="${date}" part="date-group"></slot>
          `;
        this.root.appendChild(template.content.cloneNode(true));
      }
    }

    /**
     * Adds a time entry for the given date
     * @param {string} dateString - The date in YYYY-MM-DD format
     */
    addTimeEntry(dateString) {
      const timeEntry = document.createElement("time");
      timeEntry.setAttribute("date", dateString);
      timeEntry.setAttribute("part", "date-label");
      timeEntry.textContent = formatDateForTimeEntry(dateString);
      this.root.appendChild(timeEntry);
    }

    /**
     * Updates the visibility of the time entries based on the visibility of the events
     * @param {string[]} dates - The dates to update
     */
    updateDateGroupsVisibility(dates) {
      dates.forEach((date) => {
        const timeEntry = this.root.querySelector(`time[date="${date}"]`);
        const visibleEventInGroup = this.querySelector(`[slot="${date}"]:not([hidden]):not([excluded])`);
        this.root.querySelectorAll(`[date="${date}"]`).forEach((timeEntry) => {
          timeEntry.toggleAttribute("hidden", !visibleEventInGroup);
        });
      });
    }

    disconnectedCallback() {
      this.dateGroupsVisibilityObserver?.disconnect();
    }
  }
);
