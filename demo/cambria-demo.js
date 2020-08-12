// Create a class for the element
const Cambria = require('..')
const Yaml = require('js-yaml')

class CambriaDemo extends HTMLElement {
  template = document.createElement('template')

  get mode() {
    const attrValue = this.getAttribute('mode')
    if (attrValue === 'patch') {
      return 'patch'
    }
    // default to document mode (including bad values)
    if (!attrValue || attrValue === 'document') {
      return 'document'
    }
    console.log('unrecognized conversion mode, defaulting to "document"')
    return 'document'
  }
  set mode(newValue) {
    this.setAttribute('mode', newValue)
  }

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
      <slot name="left"><textarea></textarea></slot>
      <slot name="lens"><textarea></textarea></slot>
      <slot name="right"><textarea></textarea></slot>
      <div class="error"></div>`

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    this.error = shadow.querySelector('.error')

    let slots = {}
    shadow
      .querySelectorAll('slot')
      .forEach((slot) => (slots[slot.name] = slot.assignedElements()[0] || slot.firstElementChild))

    this.left = slots.left
    this.right = slots.right
    this.lens = slots.lens

    slots.lens.addEventListener('keyup', (e) => this.updateLens(e.target.value))
    this.updateLens(slots.lens.textContent)

    slots.left.addEventListener('keyup', (e) => this.updateTextArea(e.target.value))
  }

  updateTextArea(value) {
    try {
      this.error.textContent = ''
      const inputData = JSON.parse(value)
      if (inputData) {
        if (this.mode == 'patch') {
          this.right.textContent = JSON.stringify(
            Cambria.applyLensToPatch(this.compiledLens, inputData)
          )
        } else {
          this.right.textContent = JSON.stringify(
            Cambria.applyLensToDoc(this.compiledLens, inputData)
          )
        }
      }
    } catch (err) {
      this.error.textContent = err.message
    }
  }

  updateLens(value) {
    try {
      this.error.textContent = ''
      this.compiledLens = Cambria.loadYamlLens(value)
      this.updateTextArea(this.left.value)
    } catch (err) {
      this.error.textContent = err.message
    }
  }
}

// Define the new element
customElements.define('cambria-demo', CambriaDemo)
