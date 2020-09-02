/* eslint-disable @typescript-eslint/no-var-requires */
const jsonpatch = require('fast-json-patch')
const { JSONEditor } = require('@json-editor/json-editor')

const Cambria = require('../../dist')

class CambriaDocument extends HTMLElement {
  lastJSON = {}

  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    this.editorHost = document.createElement('div')
    shadow.appendChild(this.editorHost)

    this.addEventListener('doc-patch', (e) => this.handlePatch(e))
    this.addEventListener('doc-change', (e) => this.handleChange(e))
  }

  /** import a new JSON doc into the system
   * this also triggers "downstream" editors to regenerate schemas
   * we also run this when the lens changes to reset state
   */
  importDoc() {
    const rawText = this.firstChild.wholeText
    const rawJSON = JSON.parse(rawText)
    const [schema, patch] = Cambria.importDoc(rawJSON)
    this.lastJSON = rawJSON
    this.schema = schema

    // This bit here is rather dubious.
    const initializationPatch = [{ op: 'add', path: '', value: {} }]
    this.dispatchEvent(
      new CustomEvent('doc-change', {
        bubbles: true,
        composed: true,
        detail: { schema, patch: initializationPatch },
      })
    )

    this.dispatchEvent(
      new CustomEvent('doc-patch', {
        bubbles: true,
        composed: true,
        detail: { patch },
      })
    )
  }

  clear() {
    if (!this.editor) {
      throw new Error("can't clear without an editor initialized")
    }
    this.editor.setValue({})
  }

  handleEdit() {
    try {
      const validation = this.editor.validate()
      if (validation.valid === false && validation.errors.length > 0) {
        throw new Error(validation.errors[0].message)
      }
      const newJSON = this.editor.getValue()
      const patch = jsonpatch.compare(this.lastJSON, newJSON)
      this.lastJSON = newJSON

      if (patch.length > 0) {
        this.dispatchEvent(
          new CustomEvent('doc-patch', {
            bubbles: true,
            composed: true,
            detail: { patch },
          })
        )
      }

      // clear the error status
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

  applyChange({ patch, schema }) {
    if (this.editor) {
      this.editor.destroy()
    }
    this.editor = new JSONEditor(this.editorHost, { schema })
    this.applyPatch({ patch })
    this.editor.on('change', (e) => this.handleEdit(e))
  }

  applyPatch({ patch }) {
    if (!this.editor) {
      throw new Error('received a patch before editor initialized')
    }

    const { lastJSON } = this
    const newJSON = jsonpatch.applyPatch(lastJSON, patch).newDocument
    this.editor.setValue(newJSON)
    this.lastJSON = newJSON
  }

  /** receive a new schema,
   * make a new editor, clear the old state */
  handleChange(event) {
    const { schema } = event.detail
    if (this.editor) {
      this.editor.destroy()
    }
    this.editor = new JSONEditor(this.editorHost, { schema })
    this.editor.on('change', (e) => this.handleEdit(e))

    // let handlePatch take care of filling in the data
    this.handlePatch(event)
  }

  handlePatch(event) {
    const { patch } = event.detail

    if (!this.editor) {
      throw new Error('received a patch before editor initialized')
    }

    const { lastJSON } = this
    const newJSON = jsonpatch.applyPatch(lastJSON, patch).newDocument
    this.editor.setValue(newJSON)
    this.lastJSON = newJSON
  }

  connectedCallback() {
    this.dispatchEvent(new Event('input'))
  }
}

customElements.define('cambria-document', CambriaDocument)
