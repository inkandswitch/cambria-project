// Create a class for the element
const Cambria = require('../dist')
const Yaml = require('js-yaml')
const jsonpatch = require('fast-json-patch')

class CambriaDocument extends HTMLPreElement {
  clear() {
    this.innerText = '{}'
  }
  lastJSON = {}

  importDoc() {
    const rawText = this.innerText
    const rawJSON = JSON.parse(rawText)
    const [schema, patch] = Cambria.importDoc(rawJSON)
    this.schema = schema

    const initializationPatch = [{ op: 'add', path: '', value: {} }]
    this.dispatchEvent(
      new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch: initializationPatch },
      })
    )

    this.dispatchEvent(
      new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch },
      })
    )
  }

  handleInput() {
    try {
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
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'document edit', message: e.message },
        })
      )
    }
  }

  constructor() {
    try {
      super()

      this.importDoc()

      this.addEventListener('input', (e) => this.handleInput())
      this.addEventListener('doc-change', (e) => console.log(e.detail))

      this.addEventListener('doc-patch', (event) => {
        const { patch, schema } = event.detail
        const doc = JSON.parse(this.innerText)
        this.schema = schema
        this.innerText = JSON.stringify(jsonpatch.applyPatch(doc, patch).newDocument)
      })
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'patch application', message: e.message },
        })
      )
    }
  }

  connectedCallback() {
    this.dispatchEvent(new Event('input'))
  }
}

customElements.define('cambria-document', CambriaDocument, { extends: 'pre' })

// Sends `lens-compiled` events when it gets a new, good lens.
// Receives `doc-change` events and emits `doc-patch` ones in response.
class CambriaLens extends HTMLPreElement {
  constructor() {
    super()

    this.addEventListener('input', (e) => this.handleInput(e.target.innerText))
    this.handleInput(this.innerText)

    this.addEventListener('doc-change', (e) => this.handleDocChange(e, this.compiledLens))
  }

  handleDocChange(event, lens) {
    try {
      const { patch, schema, reverse, destination } = event.detail

      const convertedSchema = Cambria.updateSchema(schema, lens)

      const convertedPatch = Cambria.applyLensToPatch(
        reverse ? Cambria.reverseLens(lens) : lens,
        patch,
        schema
      )

      this.dispatchEvent(
        new CustomEvent('doc-patch', {
          bubbles: true,
          detail: { patch: convertedPatch, schema: convertedSchema, destination },
        })
      )
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'doc conversion', message: e.message },
        })
      )
    }
  }

  handleInput(value) {
    try {
      this.compiledLens = Cambria.loadYamlLens(value)
      this.dispatchEvent(new CustomEvent('lens-changed', { bubbles: true }))
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'lens compilation', message: e.message },
        })
      )
    }
  }
}

customElements.define('cambria-lens', CambriaLens, { extends: 'pre' })

class CambriaDemo extends HTMLElement {
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
            ' patch patch patch '
            ' error error error ';
          width: 80%;
          padding: 10px;
          height: 250px;
        }

        .left {
          grid-area: left;
        }

        pre { 
          border-radius: 4px;
          border: 2px solid green;
        }

        .lens {
          grid-area: lens;
        }
        .right {
          grid-area: right;
        }
        .error {
          grid-area: error;
          margin: 4px;
          padding: 4px;
          height: 1em;
          border: 2px solid red;
          border-radius: 4px;
          font-family: monospace;
        }
        .patch {
          grid-area: patch;
          border-color: blue;
          height: 1em;
          font-family: monospace;
        }

        .patchthumb {
          content: 'Last Patch';
          background-color: blue;
        }

        .errorthumb {
          content: 'Last Error';
          background-color: red;
        }

        .thumb {
          color: white;
          text-size: 10px;
          border-radius: 2px;
        }

      </style>
      <slot name="left"></slot>
      <slot name="lens"></slot>
      <slot name="right"></slot>

      <div class="patch"><div class="patchthumb thumb">Last Patch</div><span class="patch-content">... no activity ...</span></div>
      <div class="error"><div class="errorthumb thumb">Last Error</div><span class="error-content">... no errors yet ...</span></div>`

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    const errorDiv = (this.error = shadow.querySelector('.error-content'))
    this.patch = shadow.querySelector('.patch-content')

    let slots = {}
    shadow
      .querySelectorAll('slot')
      .forEach((slot) => (slots[slot.name] = slot.assignedElements()[0] || slot.firstElementChild))

    this.left = slots.left
    this.right = slots.right
    this.lens = slots.lens

    slots.lens.addEventListener('lens-changed', (e) => {
      // trigger a re-processing of the document
      this.right.clear()
      this.left.importDoc()
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

    // hack
    Object.values(slots).forEach((slot) =>
      slot.addEventListener('cloudina-error', (e) => {
        this.error.innerText = e.detail.topic + ': ' + e.detail.message
      })
    )

    slots.lens.addEventListener('doc-patch', (e) => {
      const { detail } = e
      const { patch, destination } = e.detail
      this.patch.innerText = JSON.stringify(e.detail.patch)
      destination.dispatchEvent(new CustomEvent('doc-patch', { detail }))
    })

    this.left.importDoc()
  }
}

// Define the new element
customElements.define('cambria-demo', CambriaDemo)
