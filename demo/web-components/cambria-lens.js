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

    this.addEventListener('doc-patch', (e) => this.handleDocPatch(e, this.compiledLens))
    this.addEventListener('doc-change', (e) => this.handleDocChange(e, this.compiledLens))
  }

  translateChange(detail) {
    const { schema, patch, reverse } = detail
    const lens = this.compiledLens

    const outSchema = Cambria.updateSchema(schema, reverse ? Cambria.reverseLens(lens) : lens)

    this.schema = schema
    this.outSchema = outSchema

    const outPatch = Cambria.applyLensToPatch(
      reverse ? Cambria.reverseLens(lens) : lens,
      patch,
      this.schema
    )

    return { schema: outSchema, patch: outPatch, reverse }
  }

  translatePatch(detail) {
    const { patch, reverse } = detail
    const lens = this.compiledLens

    const outPatch = Cambria.applyLensToPatch(
      reverse ? Cambria.reverseLens(lens) : lens,
      patch,
      reverse ? this.outSchema : this.schema
    )

    return { patch: outPatch, reverse }
  }

  handleDocChange(event, lens) {
    try {
      const { schema, patch, reverse, destination } = event.detail

      const outSchema = Cambria.updateSchema(schema, reverse ? Cambria.reverseLens(lens) : lens)

      this.schema = schema
      this.outSchema = outSchema

      const convertedPatch = Cambria.applyLensToPatch(
        reverse ? Cambria.reverseLens(lens) : lens,
        patch,
        this.schema
      )

      destination.dispatchEvent(
        new CustomEvent('doc-change', {
          bubbles: false,
          detail: { schema: outSchema, patch: convertedPatch, destination },
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

  handleDocPatch(event, lens) {
    try {
      const { patch, reverse, destination } = event.detail

      if (!this.schema) {
        throw new Error('Tried to convert a patch before receiving the schema.')
      }

      const convertedPatch = Cambria.applyLensToPatch(
        reverse ? Cambria.reverseLens(lens) : lens,
        patch,
        this.schema
      )

      destination.dispatchEvent(
        new CustomEvent('doc-patch', {
          bubbles: false,
          detail: { patch: convertedPatch, destination },
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
