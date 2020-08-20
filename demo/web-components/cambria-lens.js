/* eslint-disable @typescript-eslint/no-var-requires */
const { safeLoad, safeDump } = require('js-yaml')
const Cambria = require('../../dist')

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
      let hackYaml = safeLoad(value)
      if (!hackYaml.lens) {
        hackYaml = { lens: hackYaml }
      }
      value = safeDump(hackYaml)

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
