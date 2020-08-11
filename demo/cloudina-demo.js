// Create a class for the element
const Cloudina = require('..')
const Yaml = require('js-yaml')
const jsonpatch = require('fast-json-patch')

class CloudinaDocument extends HTMLElement {
  template = document.createElement('template')
  prevJSON = {}

  constructor() {
    super()

    this.template.innerHTML = `
      <slot><textarea></textarea></slot>
    `

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    // As the user types, the textarea inside the form dispatches/triggers the event to fire, and uses itself as the starting point
    const slot = shadow.querySelector('slot')
    const textarea = slot.assignedElements()[0] || slot.firstElementChild

    // The form element listens for the custom "awesome" event and then consoles the output of the passed text() method
    textarea.addEventListener('doc-change', (e) => console.log(e.detail))

    textarea.addEventListener('input', (e) => {
      const rawText = textarea.value
      const rawJSON = JSON.parse(rawText)
      const [schema, patch] = Cloudina.importDoc(rawJSON)

      const event = new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch },
      })

      e.target.dispatchEvent(event)
    })
    textarea.dispatchEvent(new Event('input'))

    this.addEventListener('doc-patch', (event) => {
      const patch = event.detail.patch
      const doc = JSON.parse(textarea.value)
      textarea.value = JSON.stringify(jsonpatch.applyPatch(doc, patch).newDocument)
    })
  }
}

customElements.define('cloudina-document', CloudinaDocument)

class CloudinaLens extends HTMLElement {
  template = document.createElement('template')
  lastJSON = {}

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
      <slot name="left"></slot>
      <slot name="lens"></slot>
      <slot name="right"></slot>
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

    slots.lens.addEventListener('input', (e) => this.updateLens(e.target.value))
    this.updateLens(slots.lens.textContent)

    slots.left.addEventListener('doc-change', (e) =>
      this.applyLens(e, this.compiledLens, this.right)
    )
    slots.right.addEventListener('doc-change', (e) =>
      this.applyLens(e, Cloudina.reverseLens(this.compiledLens), this.left)
    )
  }

  applyLens(event, lens, target) {
    try {
      const { patch, schema } = event.detail
      const convertedPatch = Cloudina.applyLensToPatch(lens, patch, schema)

      const outEvent = new CustomEvent('doc-patch', {
        bubbles: true,
        detail: { patch: convertedPatch },
      })
      target.dispatchEvent(outEvent)
    } catch (err) {
      this.error.textContent = err.message
    }
  }

  updateLens(value) {
    try {
      this.error.textContent = ''
      this.compiledLens = Cloudina.loadYamlLens(value)
    } catch (err) {
      this.error.textContent = err.message
    }
  }
}

// Define the new element
customElements.define('cloudina-lens', CloudinaLens)
