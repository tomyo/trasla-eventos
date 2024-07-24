class TypeWriter extends HTMLElement {
  constructor() {
    super();
    this.words = [];
    this.currentWord = "";
    this.currentIndex = 0;
    this.isDeleting = false;
    this.typingSpeed = 100;
    this.deletingSpeed = 70;
    this.delayBeforeDelete = 2300;
  }

  connectedCallback() {
    this.words = this.getAttribute("data-words")
      .split(",")
      .map((word) => word.trim());

    if (document.readyState === "complete") {
      this.typeWriter();
    } else {
      window.addEventListener("load", this.typeWriter);
    }
  }

  typeWriter = () => {
    const current = this.currentIndex % this.words.length;
    const fullWord = this.words[current];

    if (this.isDeleting) {
      this.currentWord = fullWord.substring(0, this.currentWord.length - 1);
    } else {
      this.currentWord = fullWord.substring(0, this.currentWord.length + 1);
    }

    this.textContent = this.currentWord;

    let typeSpeed = this.isDeleting ? this.deletingSpeed : this.typingSpeed;

    if (!this.isDeleting && this.currentWord === fullWord) {
      typeSpeed = this.delayBeforeDelete;
      this.isDeleting = true;
    } else if (this.isDeleting && this.currentWord === "") {
      this.isDeleting = false;
      this.currentIndex++;
      typeSpeed = 500;
    }

    setTimeout(() => this.typeWriter(), typeSpeed);
  };
}

customElements.define("type-writer", TypeWriter);
