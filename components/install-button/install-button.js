import { getUserId } from "../../lib/user.js";

class InstallButton extends HTMLElement {
  constructor() {
    super();
    this.deferredPrompt = null; // Will hold the beforeinstallprompt event
  }

  connectedCallback() {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // Hide the install button if app is already installed
      return this.hideContentAfterInstall();
    }

    this.addEventListener("click", this);
    window.addEventListener("beforeinstallprompt", this);
  }

  handleEvent(e) {
    if (e.type === "beforeinstallprompt") {
      // Check for anonymous user ID to determine if it's a first visit
      const userId = getUserId();

      if (!userId) {
        // First visit: allow browser to show its default install hint
        return;
      }

      // Subsequent visits: prevent default and show our custom button
      e.preventDefault();
      this.deferredPrompt = e;
      this.dataset.installable = "true";
    } else if (e.type === "click") {
      if (this.contains(e.target.closest("dialog"))) return; // Ignore clicks inside the dialog

      const link = e.target.closest("a");
      if (link && this.contains(link)) {
        e.preventDefault();
      }

      this.install();
    }
  }

  hideContentAfterInstall() {
    this.toggleAttribute("hidden", true);
    this.dispatchEvent(new CustomEvent("install-success", { bubbles: true, composed: true }));
  }

  showInstallInstructions() {
    // Show a dialog indicating manual installation instructions
    const dialog =
      this.querySelector("dialog") ||
      document.querySelector(this.dataset.installInstructionsDialogSelector || "#installInstructions");
    if (dialog) {
      dialog.showModal();
    } else {
      const link = this.querySelector("a");
      if (link && link.href) {
        window.location.href = link.href;
      } else {
        console.warn("No dialog found for install instructions");
      }
    }
  }

  async install() {
    if (!this.deferredPrompt) {
      // No install prompt available, show manual instructions
      return this.showInstallInstructions();
    }
    const result = await this.deferredPrompt.prompt();
    console.info(`Install was: ${result.outcome}`);
    if (result.outcome === "accepted") {
      this.hideContentAfterInstall();
    }
  }
}

customElements.define("install-button", InstallButton);
