/* eslint-disable @typescript-eslint/no-var-requires */
const jsonpatch = require('fast-json-patch')
const Cambria = require('../../dist')

class CambriaDocument extends HTMLElement {
  template = document.createElement('template')

  constructor() {
    super()
    try {
      this.template.innerHTML = `
      <div>
        <pre class="data" contenteditable="true"><slot/></pre>
      </div>
      `

      const shadow = this.attachShadow({ mode: 'open' })
      const result = this.template.content.cloneNode(true)
      shadow.appendChild(result)

      this.data = shadow.querySelector('.data')
      this.schemaViewer = shadow.querySelector('.schemaViewer')

      this.importDoc()

      this.addEventListener('input', (e) => this.handleInput())
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

  renderJSON(json) {
    this.innerText = JSON.stringify(json, null, 2)
  }

  handleInput() {
    try {
      const rawText = this.innerText
      const rawJSON = JSON.parse(rawText)

      const { schema } = this
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

    console.log(patch, schema, this.innerText)

    const doc = JSON.parse(this.innerText)
    this.schema = schema
    const newJSON = jsonpatch.applyPatch(doc, patch).newDocument
    this.renderJSON(newJSON)
  }

  connectedCallback() {
    this.dispatchEvent(new Event('input'))
  }
}

customElements.define('cambria-document', CambriaDocument)
