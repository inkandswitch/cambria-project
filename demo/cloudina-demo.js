// Create a class for the element
const Cloudina = require('..')
const Yaml = require('js-yaml')

class CloudinaDemo extends HTMLElement {
  lens = []
  left = { name: 'The Fifth Element' }
  right = {}
  leftElt = null
  rightElt = null
  errorDisplay = null

  constructor() {
    super()

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    // Create spans
    const wrapper = document.createElement('div')
    wrapper.setAttribute('class', 'wrapper')

    const errorDisplay = document.createElement('p')
    errorDisplay.setAttribute('class', 'errorDisplay')
    this.errorDisplay = errorDisplay

    const lens = document.createElement('textarea')
    lens.setAttribute('type', 'text')
    lens.setAttribute('id', 'lens')
    lens.addEventListener('keyup', (e) => this.updateLens(e.target.value))
    lens.textContent = `lens:
    - rename: 
       source: name
       destination: title`
    this.updateLens(lens.textContent)

    const left = document.createElement('textarea')
    left.setAttribute('type', 'text')
    left.setAttribute('id', 'left')
    left.textContent = JSON.stringify(this.left)
    left.addEventListener('keyup', (e) => this.updateTextArea(e.target.value))
    this.leftElt = left

    const right = document.createElement('textarea')
    right.setAttribute('type', 'text')
    right.setAttribute('id', 'right')
    this.rightElt = right

    // Create some CSS to apply to the shadow dom
    const style = document.createElement('style')

    style.textContent = `
      .wrapper {
        position: relative;
      }
      input {
        color: blue;
        width: 250px;
        height: 250px;
      }
      .errorDisplay {
        width: 100%;
        color: red;
        margin: 2px;
        padding: 2px;
        border: 1px solid black;
      }
    `
    shadow.appendChild(style)

    shadow.appendChild(wrapper)
    wrapper.appendChild(left)
    wrapper.appendChild(lens)
    wrapper.appendChild(right)
    wrapper.appendChild(errorDisplay)
  }

  updateTextArea(value) {
    let newJson
    try {
      newJson = JSON.parse(value)
      if (newJson) {
        const newDoc = Cloudina.applyLensToDoc(this.lens, newJson)
        this.rightElt.textContent = JSON.stringify(newDoc)
      }
    } catch (err) {
      this.errorDisplay.textContent = err.message
    }
  }
  updateLens(value) {
    try {
      this.lens = Cloudina.loadYamlLens(value)
    } catch (err) {
      this.errorDisplay.textContent = err.message
    }
  }
}

// Define the new element
customElements.define('cloudina-demo', CloudinaDemo)
