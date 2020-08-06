// Create a class for the element
const Cloudina = require('..')
const Yaml = require('js-yaml')

class CloudinaDemo extends HTMLElement {
  template = document.createElement('template')

  constructor() {
    super()

    this.template.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: 40% 30% 40%;
          grid-template-rows: auto;
          grid-template-areas:
            ' left lens right '
            ' error error error ';
          width: 80%;
          padding: 10px;
          height: 250px;
        }
        .leftData {
          grid-area: left;
        }
        .lens {
          grid-area: lens;
        }
        .rightData {
          grid-area: right;
        }
        .errorDisplay {
          grid-area: error;
          color: red;
          margin: 4px;
          padding: 4px;
          height: 1em;
          border: 1px solid black;
        }
      </style>
      <slot name="left">{}</slot>
      <slot name="lens">no lens</slot>
      <slot name="right">{}</slot>
      <div class="error"></div>`

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    this.error = shadow.querySelector('.error')

    let slots = {}
    shadow
      .querySelectorAll('slot')
      .forEach((slot) => (slots[slot.name] = slot.assignedElements()[0]))

    this.left = slots.left
    this.right = slots.right
    this.lens = slots.lens

    slots.lens.addEventListener('keyup', (e) => this.updateLens(e.target.value))
    this.updateLens(slots.lens.textContent)

    slots.left.addEventListener('keyup', (e) => this.updateTextArea(e.target.value))
  }

  updateTextArea(value) {
    let newJson
    try {
      this.error.textContent = ''
      newJson = JSON.parse(value)
      if (newJson) {
        const newDoc = Cloudina.applyLensToDoc(this.compiledLens, newJson)
        this.right.textContent = JSON.stringify(newDoc)
      }
    } catch (err) {
      this.error.textContent = err.message
    }
  }
  updateLens(value) {
    try {
      this.error.textContent = ''
      this.compiledLens = Cloudina.loadYamlLens(value)
      this.updateTextArea(this.left.value)
    } catch (err) {
      this.error.textContent = err.message
    }
  }
}

// Define the new element
customElements.define('cloudina-demo', CloudinaDemo)
