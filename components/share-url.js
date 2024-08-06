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
      return (
        navigator.share &&
        location.protocol === "https:" &&
        navigator.canShare(shareData)
      );
    }

    handleEvent(event) {
      if (event.type === "click") {
        event.preventDefault();
        this.shareEvent();
      }
    }

    async shareEvent() {
      const shareData = {
        title: this.dataset.title || document.title,
        url: this.dataset.url || this.element.href || document.location.href,
      };

      try {
        if (this.canShare(shareData)) await navigator.share(shareData);
        else await navigator.clipboard.writeText(url);

        this.shareSuccess();
      } catch (error) {
        if (error.name !== "AbortError")
          console.error(error.name, error.message);
      }
    }

    shareSuccess = () => {
      const originalContent = this.element.innerText || this.element.innerHTML;
      this.element.innerText = this.canShare()
        ? this.dataset.textSuccess
        : this.dataset.textSuccessFallback;
      setTimeout(() => {
        this.element.innerHTML = originalContent;
      }, 2000);
    };
  }
);
