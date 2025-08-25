customElements.define(
  "share-url",
  class extends HTMLElement {
    connectedCallback() {
      if (navigator[this.dataset.action] || navigator[this.dataset.fallbackAction]) {
        this.addEventListener("click", this);
      }
    }

    canShare(shareData = {}) {
      try {
        // Check if running on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        return (
          navigator.share && location.protocol === "https:" && navigator.canShare(shareData) && isMobile // Only return true for mobile devices
        );
      } catch (error) {
        console.warn("Share API check failed:", error);
        return false;
      }
    }

    async handleEvent(event) {
      if (event.type === "click") {
        event.preventDefault();
        await this.shareEvent();
      }
    }

    async shareEvent() {
      const url = this.dataset.url || this?.element?.href || document.location.href;
      const shareData = {
        title: this.dataset.title || document.title,
        url,
      };

      let mustFallback = false;
      try {
        if (this.canShare(shareData)) await navigator.share(shareData);
        else mustFallback = true;
      } catch (error) {
        if (error.name !== "AbortError") console.warn(error.name, error.message, " ...Retrying with fallback");
        mustFallback = true;
      }
      if (mustFallback) {
        // Fallback share using clipboard
        navigator.clipboard.writeText(shareData.url).then(() => {
          this.fallbackShareSuccess();
        });
      }
    }

    fallbackShareSuccess = () => {
      const element = this.querySelector(":first-child") || this;
      const originalContent = element.innerText || element.innerHTML;
      element.innerText = this.canShare() ? this.dataset.textSuccess : this.dataset.textSuccessFallback;
      setTimeout(() => {
        element.innerHTML = originalContent;
      }, 2000);
    };
  }
);
