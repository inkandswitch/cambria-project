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

// Sends `lens-compiled` events when it gets a new, good lens.
// Receives `doc-change` events and emits `doc-patch` ones in response.
class CloudinaLens extends HTMLElement {
  template = document.createElement('template')

  constructor() {
    super()

    this.template.innerHTML = `
      <slot><textarea></textarea></slot>
    `

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    let slot = shadow.querySelector('slot')
    const textarea = slot.assignedElements()[0] || slot.firstElementChild

    textarea.addEventListener('input', (e) => this.handleInput(e.target.value))
    this.handleInput(textarea.textContent)

    this.addEventListener('doc-change', (e) => this.handleDocChange(e, this.compiledLens))
  }

  handleDocChange(event, lens) {
    const { patch, schema, reverse, destination } = event.detail

    const convertedPatch = Cloudina.applyLensToPatch(
      reverse ? Cloudina.reverseLens(lens) : lens,
      patch,
      schema
    )

    this.dispatchEvent(
      new CustomEvent('doc-patch', {
        bubbles: true,
        detail: { patch: convertedPatch, destination },
      })
    )
  }

  handleInput(value) {
    this.compiledLens = Cloudina.loadYamlLens(value)
    this.dispatchEvent(new CustomEvent('lens-changed', { bubbles: true }))
  }
}

customElements.define('cloudina-lens', CloudinaLens)

class CloudinaDemo extends HTMLElement {
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

    slots.lens.addEventListener('lens-changed', (e) => {
      // trigger a re-processing of the document
      this.left.dispatchEvent(new Event('input'))
    })

    // ehhhhhh
    slots.left.addEventListener('doc-change', (e) =>
      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', { detail: { ...e.detail, destination: slots.right } })
      )
    )

    slots.right.addEventListener('doc-change', (e) =>
      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', {
          detail: { ...e.detail, reverse: true, destination: slots.left },
        })
      )
    )

    slots.lens.addEventListener('doc-patch', (e) => {
      const { detail } = e
      const { patch, destination } = e.detail
      destination.dispatchEvent(new CustomEvent('doc-patch', { detail }))
    })
  }
}

// Define the new element
customElements.define('cloudina-demo', CloudinaDemo)
