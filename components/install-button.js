class InstallButton extends HTMLElement {
  constructor() {
    super();
    this.toggleAttribute("hidden", true); // Initially hidden until the beforeinstallprompt event
    this.deferredPrompt = null; // Store the deferred prompt event
  }

  connectedCallback() {
    this.addEventListener("click", this);
    window.addEventListener("beforeinstallprompt", this);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this);
    window.removeEventListener("beforeinstallprompt", this);
  }

  handleEvent(e) {
    if (e.type === "beforeinstallprompt") {
      e.preventDefault();
      this.deferredPrompt = e;
      // Show the install button
      this.toggleAttribute("hidden", false);
    } else if (e.type === "click") {
      this.install();
    }
  }

  async install() {
    if (!this.deferredPrompt) return;
    const result = await this.deferredPrompt.prompt();
    console.info(`Install was: ${result.outcome}`);
    // Hide the install button
    this.toggleAttribute("hidden", true);
    this.deferredPrompt = null;
  }
}

customElements.define("install-button", InstallButton);
