import { isDateToday } from "/lib/utils.js";

customElements.define(
  "today-date-picker",
  class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.input = this.querySelector("input");
      this.addEventListener("change", this);
      this.updateState();
    }

    handleEvent() {
      this.updateState();
    }

    updateState() {
      if (isDateToday(this.input.value)) {
        this.toggleAttribute("today", true);
      } else {
        this.removeAttribute("today");
      }
    }
  }
);
