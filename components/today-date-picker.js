import { isDateToday } from "/lib/utils.js";

customElements.define(
  "today-date-picker",
  class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.input = this.querySelector("input");
      if (!this.input.value) this.setDateAsToday();
      this.addEventListener("change", this);
      this.updateState();
    }

    handleEvent() {
      this.updateState();
    }

    updateState() {
      if (!this.input.value || isDateToday(this.input.value)) {
        this.toggleAttribute("today", true);
      } else {
        this.removeAttribute("today");
      }
    }

    /**
     * Set the input value to today's date in the user's timezone.
     */
    setDateAsToday() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0"); // months are zero-indexed
      const day = String(today.getDate()).padStart(2, "0");
      this.input.value = `${year}-${month}-${day}`;
    }
  }
);
