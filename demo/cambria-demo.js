// Create a class for the element
const Cambria = require('../dist')
const Yaml = require('js-yaml')
const jsonpatch = require('fast-json-patch')

class CambriaDocument extends HTMLElement {
  template = document.createElement('template')

  constructor() {
    try {
      super()

      this.template.innerHTML = `
      <div>
        <pre class="data" contenteditable="true">
        <slot/>
        </pre>
        <pre class="schemaViewer">NO SCHEMA HERE</pre>
      </div>
      `

      const shadow = this.attachShadow({ mode: 'open' })
      const result = this.template.content.cloneNode(true)
      shadow.appendChild(result)

      this.data = shadow.querySelector('.data')
      this.schemaViewer = shadow.querySelector('.schemaViewer')

      this.importDoc()

      this.addEventListener('input', (e) => this.handleInput())
      this.addEventListener('doc-change', (e) => console.log(e.detail))

      this.addEventListener('doc-patch', (event) => this.handlePatch(event))
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'patch application', message: e.message },
        })
      )
    }
  }

  clear() {
    this.innerText = '{}'
  }
  lastJSON = {}

  importDoc() {
    const rawText = this.innerText
    const rawJSON = JSON.parse(rawText)
    const [schema, patch] = Cambria.importDoc(rawJSON)
    this.schema = schema
    this.renderSchema(schema)

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

  renderSchema(schema) {
    this.schemaViewer.innerText = JSON.stringify(this.schema.properties)
  }

  renderJSON(json) {
    this.innerText = JSON.stringify(json)
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

      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'document edit', message: '' },
        })
      )
    } catch (e) {
      this.dispatchEvent(
        new CustomEvent('cloudina-error', {
          detail: { topic: 'document edit', message: e.message },
        })
      )
    }
  }

  handlePatch(event) {
    const { patch, schema } = event.detail
    const doc = JSON.parse(this.innerText)
    this.schema = schema
    this.renderSchema(schema)
    const newJSON = jsonpatch.applyPatch(doc, patch).newDocument
    this.renderJSON(newJSON)
  }

  connectedCallback() {
    this.dispatchEvent(new Event('input'))
  }
}

customElements.define('cambria-document', CambriaDocument)

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

      const convertedSchema = Cambria.updateSchema(
        schema,
        reverse ? Cambria.reverseLens(lens) : lens
      )

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
          grid-gap: 4px;
          width: 80%;
        }

        .left {
          grid-area: left;
          --color: blue;
        }

        .lens {
          grid-area: lens;
          --color: black;
        }

        .right {
          grid-area: right;
          --color: green;
        }

        .error {
          grid-area: error;
          --color: red;
          font-family: monospace;
        }

        .patch {
          grid-area: patch;
          --color: grey;
          font-family: monospace;
        }

        .thumb {
          background-color: var(--color);
          color: white;
          text-size: 10px;
          border-radius: 2px;
        }

        .block {
          border: 2px solid var(--color);
        }

        .schema {  border: 1px solid black; }
        
      </style>
      <div class="left block">
        <div class="thumb">Left Document</div>
        <slot name="left"></slot>
        <div class="schema"></div>
      </div>
      <div class="lens block">
        <div class="thumb">Lens</div>
        <slot name="lens"></slot></div>
      </div>
      <div class="right block">
        <div class="thumb">Right Document</div>
        <slot name="right"></slot>
        <div class="schema"></div>
      </div>

      <div class="patch block">
        <div class="thumb">Last Patch</div>
        <span class="content">... no activity ...</span>
      </div>
      
      <div class="error block">
        <div class="thumb">Last Error</div>
        <span class="content">... no errors yet ...</span>
      </div>`

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    const errorDiv = (this.error = shadow.querySelector('.error .content'))
    this.patch = shadow.querySelector('.patch .content')

    let slots = {}
    shadow
      .querySelectorAll('slot')
      .forEach((slot) => (slots[slot.name] = slot.assignedElements()[0] || slot.firstElementChild))

    this.left = slots.left

    this.leftSchema = shadow.querySelector('.left .schema')
    this.rightSchema = shadow.querySelector('.right .schema')

    this.right = slots.right
    this.lens = slots.lens

    slots.lens.addEventListener('lens-changed', (e) => {
      // trigger a re-processing of the document
      this.right.clear()
      this.left.importDoc()
    })

    // ehhhhhh
    slots.left.addEventListener('doc-change', (e) => {
      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', { detail: { ...e.detail, destination: slots.right } })
      )
    })

    slots.right.addEventListener('doc-change', (e) => {
      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', {
          detail: { ...e.detail, reverse: true, destination: slots.left },
        })
      )
    })

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
