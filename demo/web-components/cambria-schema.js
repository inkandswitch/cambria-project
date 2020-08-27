/* eslint-disable @typescript-eslint/no-var-requires */
const JSONSchemaView = require('json-schema-view-js')

class CambriaSchema extends HTMLElement {
  css = `.json-schema-view,
  json-schema-view {
    font-family: monospace;
    font-size: 0;
  }
  .json-schema-view > *,
  json-schema-view > * {
    font-size: 14px;
  }
  .json-schema-view .toggle-handle,
  json-schema-view .toggle-handle {
    cursor: pointer;
    margin: auto .3em;
    font-size: 10px;
    display: inline-block;
    transform-origin: 50% 40%;
    transition: transform 150ms ease-in;
  }
  .json-schema-view .toggle-handle:after,
  json-schema-view .toggle-handle:after {
    content: "▼";
  }
  .json-schema-view .toggle-handle,
  json-schema-view .toggle-handle,
  .json-schema-view .toggle-handle:hover,
  json-schema-view .toggle-handle:hover {
    text-decoration: none;
    color: #333;
  }
  .json-schema-view .description,
  json-schema-view .description {
    color: gray;
    font-style: italic;
  }
  .json-schema-view .title,
  json-schema-view .title {
    font-weight: bold;
    cursor: pointer;
  }
  .json-schema-view .title,
  json-schema-view .title,
  .json-schema-view .title:hover,
  json-schema-view .title:hover {
    text-decoration: none;
    color: #333;
  }
  .json-schema-view .title,
  json-schema-view .title,
  .json-schema-view .brace,
  json-schema-view .brace,
  .json-schema-view .bracket,
  json-schema-view .bracket {
    color: #333;
  }
  .json-schema-view .property,
  json-schema-view .property {
    font-size: 0;
    display: table-row;
  }
  .json-schema-view .property > *,
  json-schema-view .property > * {
    font-size: 14px;
    padding: .2em;
  }
  .json-schema-view .name,
  json-schema-view .name {
    color: blue;
    display: table-cell;
    vertical-align: top;
  }
  .json-schema-view .type,
  json-schema-view .type {
    color: green;
  }
  .json-schema-view .type-any,
  json-schema-view .type-any {
    color: #3333ff;
  }
  .json-schema-view .required,
  json-schema-view .required {
    color: #F00;
  }
  .json-schema-view .format,
  json-schema-view .format,
  .json-schema-view .enums,
  json-schema-view .enums,
  .json-schema-view .pattern,
  json-schema-view .pattern {
    color: #000;
  }
  .json-schema-view .inner,
  json-schema-view .inner {
    padding-left: 18px;
  }
  .json-schema-view.collapsed .description,
  json-schema-view.collapsed .description {
    display: none;
  }
  .json-schema-view.collapsed .property,
  json-schema-view.collapsed .property {
    display: none;
  }
  .json-schema-view.collapsed .closeing.brace,
  json-schema-view.collapsed .closeing.brace {
    display: inline-block;
  }
  .json-schema-view.collapsed .toggle-handle,
  json-schema-view.collapsed .toggle-handle {
    transform: rotate(-90deg);
  }
  `
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = `<style>${this.css}</style><div class="attach"></div>`
  }

  setSchema(schema) {
    const view = new JSONSchemaView.default(schema, 1)

    const attach = this.shadow.querySelector('.attach')
    attach.innerHTML = ''
    attach.appendChild(view.render())
  }
}

// Define the new element
customElements.define('cambria-schema', CambriaSchema)
