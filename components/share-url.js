customElements.define(
  "share-url",
  class extends HTMLElement {
    constructor() {
      super();

      this.element = this.querySelector("button, a");
      if (!this.element) return;

      if (navigator[this.dataset.action]) {
        this.element.addEventListener("click", this);
      }
    }

    canShare(shareData) {
      return navigator.share && location.protocol === "https:" && navigator.canShare(shareData);
    }

    handleEvent(event) {
      if (event.type === "click") {
        event.preventDefault();
        this.shareEvent();
      }
    }

    async shareEvent() {
      const url = this.dataset.url || this?.element?.href || document.location.href;
      const shareData = {
        title: this.dataset.title || document.title,
        url,
      };

      try {
        if (this.canShare(shareData)) await navigator.share(shareData);
        else await fallbackShare(shareData);

        this.shareSuccess();
      } catch (error) {
        if (error.name !== "AbortError")
          console.error(error.name, error.message, " ...Retrying with fallback");
        this.fallbackShare(shareData);
      }
    }

    async fallbackShare(shareData) {
      await navigator.clipboard.writeText(shareData.url);
      this.shareSuccess();
    }

    shareSuccess = () => {
      const originalContent = this.element.innerText || this.element.innerHTML;
      this.element.innerText = this.canShare() ? this.dataset.textSuccess : this.dataset.textSuccessFallback;
      setTimeout(() => {
        this.element.innerHTML = originalContent;
      }, 2000);
    };
  }
);
