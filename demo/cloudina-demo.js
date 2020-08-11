// Create a class for the element
const Cloudina = require('..')
const Yaml = require('js-yaml')
const jsonpatch = require('fast-json-patch')

class CloudinaDocument extends HTMLPreElement {
  clear() {
    this.innerText = '{}'
  }
  lastJSON = {}

  importDoc() {
    const rawText = this.innerText
    const rawJSON = JSON.parse(rawText)
    const [schema, patch] = Cloudina.importDoc(rawJSON)
    this.schema = schema

    this.dispatchEvent(
      new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch },
      })
    )
  }

  handleInput() {
    const rawText = this.innerText
    const rawJSON = JSON.parse(rawText)

    const schema = this.schema
    const patch = jsonpatch.compare(this.lastJSON, rawJSON)

    this.dispatchEvent(
      new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch },
      })
    )
    this.lastJSON = rawJSON
  }

  constructor() {
    super()

    this.importDoc()

    this.addEventListener('input', (e) => this.handleInput())
    this.addEventListener('doc-change', (e) => console.log(e.detail))

    this.addEventListener('doc-patch', (event) => {
      const patch = event.detail.patch
      const doc = JSON.parse(this.innerText)
      this.innerText = JSON.stringify(jsonpatch.applyPatch(doc, patch).newDocument)
    })
  }

  connectedCallback() {
    this.dispatchEvent(new Event('input'))
  }
}

customElements.define('cloudina-document', CloudinaDocument, { extends: 'pre' })

// Sends `lens-compiled` events when it gets a new, good lens.
// Receives `doc-change` events and emits `doc-patch` ones in response.
class CloudinaLens extends HTMLPreElement {
  constructor() {
    super()

    this.addEventListener('input', (e) => this.handleInput(e.target.innerText))
    this.handleInput(this.innerText)

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

customElements.define('cloudina-lens', CloudinaLens, { extends: 'pre' })

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
            ' reset reverse reset  '
            ' error error error ';
          width: 80%;
          padding: 10px;
          height: 250px;
        }
        .left {
          grid-area: left;
        }
        .lens {
          grid-area: lens;
        }
        .right {
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

      <button class="reset">Reset</button>
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

    const resetButton = shadow.querySelector('.reset')
    resetButton.addEventListener('click', (e) => {
      this.left.importDoc()
      this.right.clear()
    })

    slots.lens.addEventListener('lens-changed', (e) => {
      // trigger a re-processing of the document
      this.right.importDoc()
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
      this.error.innerText = JSON.stringify(e.detail.patch)
      destination.dispatchEvent(new CustomEvent('doc-patch', { detail }))
    })
  }
}

// Define the new element
customElements.define('cloudina-demo', CloudinaDemo)
