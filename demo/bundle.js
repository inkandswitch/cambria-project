(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
require('./cambria-document')
require('./cambria-lens')
require('./cambria-schema')

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
        <div class="thumb">Left Schema</div>
        <cambria-schema class="schema"/>
        <div class="thumb">Patch</div>
      </div>
      <div class="lens block">
        <div class="thumb">Lens</div>
        <slot name="lens"></slot></div>
      </div>
      <div class="right block">
        <div class="thumb">Right Document</div>
        <slot name="right"></slot>
        <div class="thumb">Right Schema</div>
        <cambria-schema class="schema"/>
      </div>

      <div class="patch block">
        <div class="thumb">Last Patch</div>
        <pre class="content">... no activity ...</pre>
      </div>
      
      <div class="error block">
        <div class="thumb">Last Error</div>
        <span class="content">... no errors yet ...</span>
      </div>`

    // Create a shadow root
    const shadow = this.attachShadow({ mode: 'open' })

    const result = this.template.content.cloneNode(true)
    shadow.appendChild(result)

    this.error = shadow.querySelector('.error .content')
    this.patch = shadow.querySelector('.patch .content')

    const slots = {}
    shadow.querySelectorAll('slot').forEach((slot) => {
      slots[slot.name] = slot.assignedElements()[0] || slot.firstElementChild
    })

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

    this.left.addEventListener('doc-change', (e) => {
      this.leftSchema.setSchema(e.detail.schema)
      const { patch, schema } = this.lens.translateChange(e.detail)
      this.rightSchema.setSchema(schema)
      this.right.applyChange({ patch, schema })
      console.log('doc-change', e)
    })

    this.left.addEventListener('doc-patch', (e) => {
      const { patch } = this.lens.translatePatch(e.detail)
      this.right.applyPatch({ patch })
      console.log('doc-patch', e)
    })

    this.right.addEventListener('doc-change', (e) => {
      const { patch, schema } = this.lens.translateChange({ ...e.detail, reverse: true })
      this.left.applyChange({ patch, schema })
      console.log('doc-change from right', e)
    })

    this.right.addEventListener('doc-patch', (e) => {
      const { patch } = this.lens.translatePatch({ ...e.detail, reverse: true })
      this.left.applyPatch({ patch })
      console.log('doc-patchfrom right', e)
    })

    /*
    // ehhhhhh
    slots.left.addEventListener('doc-change', (e) => {
      this.renderSchema(this.leftSchema, e.detail.schema)
      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', { detail: { ...e.detail, destination: slots.right } })
      )
    })

    slots.right.addEventListener('doc-change', (e) => {
      this.renderSchema(this.rightSchema, e.detail.schema)

      slots.lens.dispatchEvent(
        new CustomEvent('doc-change', {
          detail: { ...e.detail, reverse: true, destination: slots.left },
        })
      )
    })

    slots.left.addEventListener('doc-patch', (e) => {
      slots.lens.dispatchEvent(
        new CustomEvent('doc-patch', { detail: { ...e.detail, destination: slots.right } })
      )
    })

    slots.right.addEventListener('doc-patch', (e) => {
      slots.lens.dispatchEvent(
        new CustomEvent('doc-patch', {
          detail: { ...e.detail, reverse: true, destination: slots.left },
        })
      )
    })

    // hack
    Object.values(slots).forEach((slot) =>
      slot.addEventListener('cloudina-error', (e) => {
        this.error.innerText = `${e.detail.topic}: ${e.detail.message}`
      })
    )

    slots.lens.addEventListener('doc-change', (e) => {
      debugger
      const { detail } = e
      const { destination } = e.detail

      destination.dispatchEvent(
        new CustomEvent('doc-change', { bubbles: false, detail: { ...detail, origin: 'LENS' } })
      )
    })

    slots.lens.addEventListener('doc-patch', (e) => {
      debugger
      const { detail } = e
      const { patch, destination } = e.detail
      this.patch.innerText = JSON.stringify(patch, null, 2)

      if (destination === slots.left) {
        this.renderSchema(this.leftSchema, e.detail.schema)
      } else if (destination === slots.right) {
        this.renderSchema(this.rightSchema, e.detail.schema)
      }
      destination.dispatchEvent(new CustomEvent('doc-patch', { detail }))
    }) */

    this.left.importDoc()
  }

  renderSchema(target, schema) {
    target.innerText = JSON.stringify(schema, null, 2)
  }
}

// Define the new element
customElements.define('cambria-demo', CambriaDemo)

},{"./cambria-document":2,"./cambria-lens":3,"./cambria-schema":4}],2:[function(require,module,exports){
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

},{"../../dist":8,"@json-editor/json-editor":14,"fast-json-patch":21}],3:[function(require,module,exports){
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

},{"../../dist":8,"js-yaml":42}],4:[function(require,module,exports){
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

},{"json-schema-view-js":72}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDefaultValues = exports.defaultObjectForSchema = exports.defaultValuesByType = void 0;
/* eslint-disable no-use-before-define */
const fast_json_patch_1 = require("fast-json-patch");
/**
 * behaviour:
 *  - if we have an array of types where null is an option, that's our default
 *  - otherwise use the first type in the array to pick a default from the table
 *  - otherwise just use the value to lookup in the table
 */
const defaultValuesForType = {
    string: '',
    number: 0,
    boolean: false,
    array: [],
    object: {},
};
function defaultValuesByType(type) {
    if (Array.isArray(type)) {
        if (type.includes('null')) {
            return null;
        }
        return defaultValuesForType[type[0]];
    }
    return defaultValuesForType[type];
}
exports.defaultValuesByType = defaultValuesByType;
// Return a recursively filled-in default object for a given schema
function defaultObjectForSchema(schema) {
    // By setting the root to empty object,
    // we kick off a recursive process that fills in the entire thing
    const initializeRootPatch = [
        {
            op: 'add',
            path: '',
            value: {},
        },
    ];
    const defaultsPatch = addDefaultValues(initializeRootPatch, schema);
    return fast_json_patch_1.applyPatch({}, defaultsPatch).newDocument;
}
exports.defaultObjectForSchema = defaultObjectForSchema;
function addDefaultValues(patch, schema) {
    return patch
        .map((op) => {
        const isMakeMap = (op.op === 'add' || op.op === 'replace') &&
            op.value !== null &&
            typeof op.value === 'object' &&
            Object.entries(op.value).length === 0;
        if (!isMakeMap)
            return op;
        const objectProperties = getPropertiesForPath(schema, op.path);
        return [
            op,
            // fill in default values for each property on the object
            ...Object.entries(objectProperties).map(([propName, propSchema]) => {
                if (typeof propSchema !== 'object')
                    throw new Error(`Missing property ${propName}`);
                const path = `${op.path}/${propName}`;
                // Fill in a default iff:
                // 1) it's an object or array: init to empty
                // 2) it's another type and there's a default value set.
                // TODO: is this right?
                // Should we allow defaulting containers to non-empty? seems like no.
                // Should we fill in "default defaults" like empty string?
                // I think better to let the json schema explicitly define defaults
                let defaultValue;
                if (propSchema.type === 'object') {
                    defaultValue = {};
                }
                else if (propSchema.type === 'array') {
                    defaultValue = [];
                }
                else if ('default' in propSchema) {
                    defaultValue = propSchema.default;
                }
                else if (Array.isArray(propSchema.type) && propSchema.type.includes('null')) {
                    defaultValue = null;
                }
                if (defaultValue !== undefined) {
                    // todo: this is a TS hint, see if we can remove
                    if (op.op !== 'add' && op.op !== 'replace')
                        throw new Error('');
                    return addDefaultValues([Object.assign(Object.assign({}, op), { path, value: defaultValue })], schema);
                }
                return [];
            }),
        ].flat(Infinity);
    })
        .flat(Infinity);
}
exports.addDefaultValues = addDefaultValues;
// given a json schema and a json path to an object field somewhere in that schema,
// return the json schema for the object being pointed to
function getPropertiesForPath(schema, path) {
    const pathComponents = path.split('/').slice(1);
    const { properties } = pathComponents.reduce((schema, pathSegment) => {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        if (types.includes('object')) {
            const schemaForProperty = schema.properties && schema.properties[pathSegment];
            if (typeof schemaForProperty !== 'object')
                throw new Error('Expected object');
            return schemaForProperty;
        }
        if (types.includes('array')) {
            // throw away the array index, just return the schema for array items
            if (!schema.items || typeof schema.items !== 'object')
                throw new Error('Expected array items to have types');
            // todo: revisit this "as", was a huge pain to get this past TS
            return schema.items;
        }
        throw new Error('Expected object or array in schema based on JSON Pointer');
    }, schema);
    if (properties === undefined)
        return {};
    return properties;
}

},{"fast-json-patch":21}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLensToDoc = exports.importDoc = void 0;
const fast_json_patch_1 = require("fast-json-patch");
const to_json_schema_1 = __importDefault(require("to-json-schema"));
const defaults_1 = require("./defaults");
const patch_1 = require("./patch");
const json_schema_1 = require("./json-schema");
/**
 * importDoc - convert any Plain Old Javascript Object into an implied JSON Schema and
 *             a JSON Patch that sets every value in that document.
 * @param inputDoc a document to convert into a big JSON patch describing its full contents
 */
function importDoc(inputDoc) {
    const options = {
        postProcessFnc: (type, schema, obj, defaultFnc) => (Object.assign(Object.assign({}, defaultFnc(type, schema, obj)), { type: [type, 'null'] })),
        objects: {
            postProcessFnc: (schema, obj, defaultFnc) => (Object.assign(Object.assign({}, defaultFnc(schema, obj)), { required: Object.getOwnPropertyNames(obj) })),
        },
    };
    const schema = to_json_schema_1.default(inputDoc, options);
    const patch = fast_json_patch_1.compare({}, inputDoc);
    return [schema, patch];
}
exports.importDoc = importDoc;
/**
 * applyLensToDoc - converts a full document through a lens.
 * Under the hood, we convert your input doc into a big patch and the apply it to the targetDoc.
 * This allows merging data back and forth with other omitted values.
 * @property lensSource: the lens specification to apply to the document
 * @property inputDoc: the Plain Old Javascript Object to convert
 * @property inputSchema: (default: inferred from inputDoc) a JSON schema defining the input
 * @property targetDoc: (default: {}) a document to apply the contents of this document to as a patch
 */
function applyLensToDoc(lensSource, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
inputDoc, inputSchema, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
targetDoc) {
    const [impliedSchema, patchForOriginalDoc] = importDoc(inputDoc);
    if (inputSchema === undefined || inputSchema === null) {
        inputSchema = impliedSchema;
    }
    // construct the "base" upon which we will apply the patches from doc.
    // We start with the default object for the output schema,
    // then we add in any existing fields on the target doc.
    // TODO: I think we need to deep merge here, can't just shallow merge?
    const outputSchema = json_schema_1.updateSchema(inputSchema, lensSource);
    const base = Object.assign(defaults_1.defaultObjectForSchema(outputSchema), targetDoc || {});
    // return a doc based on the converted patch.
    // (start with either a specified baseDoc, or just empty doc)
    // convert the patch through the lens
    const outputPatch = patch_1.applyLensToPatch(lensSource, patchForOriginalDoc, inputSchema);
    return fast_json_patch_1.applyPatch(base, outputPatch).newDocument;
}
exports.applyLensToDoc = applyLensToDoc;

},{"./defaults":5,"./json-schema":9,"./patch":12,"fast-json-patch":21,"to-json-schema":273}],7:[function(require,module,exports){
"use strict";
// helper functions for nicer syntax
// (we might write our own parser later, but at least for now
// this avoids seeing the raw json...)
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValue = exports.map = exports.inside = exports.headProperty = exports.wrapProperty = exports.plungeProperty = exports.hoistProperty = exports.renameProperty = exports.removeProperty = exports.addProperty = void 0;
function addProperty(property) {
    return Object.assign({ op: 'add' }, property);
}
exports.addProperty = addProperty;
function removeProperty(property) {
    return Object.assign({ op: 'remove' }, property);
}
exports.removeProperty = removeProperty;
function renameProperty(source, destination) {
    return {
        op: 'rename',
        source,
        destination,
    };
}
exports.renameProperty = renameProperty;
function hoistProperty(host, name) {
    return {
        op: 'hoist',
        host,
        name,
    };
}
exports.hoistProperty = hoistProperty;
function plungeProperty(host, name) {
    return {
        op: 'plunge',
        host,
        name,
    };
}
exports.plungeProperty = plungeProperty;
function wrapProperty(name) {
    return {
        op: 'wrap',
        name,
    };
}
exports.wrapProperty = wrapProperty;
function headProperty(name) {
    return {
        op: 'head',
        name,
    };
}
exports.headProperty = headProperty;
function inside(name, lens) {
    return {
        op: 'in',
        name,
        lens,
    };
}
exports.inside = inside;
function map(lens) {
    return {
        op: 'map',
        lens,
    };
}
exports.map = map;
function convertValue(name, mapping, sourceType, destinationType) {
    return {
        op: 'convert',
        name,
        mapping,
        sourceType,
        destinationType,
    };
}
exports.convertValue = convertValue;

},{}],8:[function(require,module,exports){
"use strict";
// TODO: The exported surface is fairly large right now,
// See how much we can narrow this.
Object.defineProperty(exports, "__esModule", { value: true });
var json_schema_1 = require("./json-schema");
Object.defineProperty(exports, "updateSchema", { enumerable: true, get: function () { return json_schema_1.updateSchema; } });
Object.defineProperty(exports, "schemaForLens", { enumerable: true, get: function () { return json_schema_1.schemaForLens; } });
var patch_1 = require("./patch");
Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return patch_1.compile; } });
Object.defineProperty(exports, "applyLensToPatch", { enumerable: true, get: function () { return patch_1.applyLensToPatch; } });
var doc_1 = require("./doc");
Object.defineProperty(exports, "applyLensToDoc", { enumerable: true, get: function () { return doc_1.applyLensToDoc; } });
Object.defineProperty(exports, "importDoc", { enumerable: true, get: function () { return doc_1.importDoc; } });
var defaults_1 = require("./defaults");
Object.defineProperty(exports, "defaultObjectForSchema", { enumerable: true, get: function () { return defaults_1.defaultObjectForSchema; } });
var reverse_1 = require("./reverse");
Object.defineProperty(exports, "reverseLens", { enumerable: true, get: function () { return reverse_1.reverseLens; } });
var lens_graph_1 = require("./lens-graph");
Object.defineProperty(exports, "initLensGraph", { enumerable: true, get: function () { return lens_graph_1.initLensGraph; } });
Object.defineProperty(exports, "registerLens", { enumerable: true, get: function () { return lens_graph_1.registerLens; } });
Object.defineProperty(exports, "lensGraphSchema", { enumerable: true, get: function () { return lens_graph_1.lensGraphSchema; } });
Object.defineProperty(exports, "lensFromTo", { enumerable: true, get: function () { return lens_graph_1.lensFromTo; } });
var helpers_1 = require("./helpers");
Object.defineProperty(exports, "addProperty", { enumerable: true, get: function () { return helpers_1.addProperty; } });
Object.defineProperty(exports, "removeProperty", { enumerable: true, get: function () { return helpers_1.removeProperty; } });
Object.defineProperty(exports, "renameProperty", { enumerable: true, get: function () { return helpers_1.renameProperty; } });
Object.defineProperty(exports, "hoistProperty", { enumerable: true, get: function () { return helpers_1.hoistProperty; } });
Object.defineProperty(exports, "plungeProperty", { enumerable: true, get: function () { return helpers_1.plungeProperty; } });
Object.defineProperty(exports, "wrapProperty", { enumerable: true, get: function () { return helpers_1.wrapProperty; } });
Object.defineProperty(exports, "headProperty", { enumerable: true, get: function () { return helpers_1.headProperty; } });
Object.defineProperty(exports, "inside", { enumerable: true, get: function () { return helpers_1.inside; } });
Object.defineProperty(exports, "map", { enumerable: true, get: function () { return helpers_1.map; } });
Object.defineProperty(exports, "convertValue", { enumerable: true, get: function () { return helpers_1.convertValue; } });
var lens_loader_1 = require("./lens-loader");
Object.defineProperty(exports, "loadYamlLens", { enumerable: true, get: function () { return lens_loader_1.loadYamlLens; } });

},{"./defaults":5,"./doc":6,"./helpers":7,"./json-schema":9,"./lens-graph":10,"./lens-loader":11,"./patch":12,"./reverse":13}],9:[function(require,module,exports){
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaForLens = exports.updateSchema = exports.emptySchema = void 0;
const util_1 = require("util");
const defaults_1 = require("./defaults");
exports.emptySchema = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    additionalProperties: false,
};
function deepInspect(object) {
    return util_1.inspect(object, false, null, true);
}
// add a property to a schema
// note: property names are in json pointer with leading /
// (because that's how our Property types work for now)
// mutates the schema that is passed in
// (should switch to a more functional style)
function addProperty(schema, property) {
    const { properties: origProperties = {}, required: origRequired = [] } = schema;
    const { name, items, required: isPropertyRequired } = property;
    let { type } = property;
    if (!name || !type) {
        throw new Error(`Missing property name in addProperty.\nFound:\n${JSON.stringify(property)}`);
    }
    if (Array.isArray(type)) {
        type = type.map((t) => (t === null ? 'null' : t));
    }
    const arraylessPropertyDefinition = {
        type,
        default: property.default || defaults_1.defaultValuesByType(type),
    };
    // this is kludgey but you should see the crazy syntax for the alternative
    const propertyDefinition = type === 'array' && items
        ? Object.assign(Object.assign({}, arraylessPropertyDefinition), { items: { type: items.type, default: items.default || defaults_1.defaultValuesByType(items.type) } }) : arraylessPropertyDefinition;
    const properties = Object.assign(Object.assign({}, origProperties), { [name]: propertyDefinition });
    const shouldAdd = isPropertyRequired !== false && !origRequired.includes(name);
    const required = [...origRequired, ...(shouldAdd ? [name] : [])];
    return Object.assign(Object.assign({}, schema), { properties,
        required });
}
function withNullable(schema, fn) {
    if (schema.anyOf) {
        if (schema.anyOf.length !== 2) {
            throw new Error('We only support this operation on schemas with one type or a nullable type');
        }
        return Object.assign(Object.assign({}, schema), { anyOf: schema.anyOf.map(db).map((s) => (s.type === 'null' ? s : fn(s))) });
    }
    else {
        return fn(schema);
    }
}
function renameProperty(_schema, from, to) {
    return withNullable(_schema, (schema) => {
        if (typeof schema !== 'object' || typeof schema.properties !== 'object') {
            throw new Error(`expected schema object, got ${JSON.stringify(schema)}`);
        }
        if (!from) {
            throw new Error("Rename property requires a 'source' to rename.");
        }
        if (!schema.properties[from]) {
            throw new Error(`Cannot rename property '${from}' because it does not exist among ${Object.keys(schema.properties)}.`);
        }
        if (!to) {
            throw new Error(`Need a 'destination' to rename ${from} to.`);
        }
        const { properties = {}, required = [] } = schema; // extract properties with default of empty
        const _a = properties, _b = from, propDetails = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]); // pull out the old value
        if (propDetails === undefined) {
            throw new Error(`Rename error: missing expected property ${from}`);
        }
        return Object.assign(Object.assign({}, schema), { properties: Object.assign({ [to]: propDetails }, rest), required: [...required.filter((r) => r !== from), to] }); // assign it to the new one
    });
}
// remove a property from a schema
// property name is _not_ in JSON Pointer, no leading slash here.
// (yes, that's inconsistent with addPropertyToSchema, which is bad)
function removeProperty(schema, removedPointer) {
    const { properties = {}, required = [] } = schema;
    const removed = removedPointer;
    // we don't care about the `discarded` variable...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (!(removed in properties)) {
        throw new Error(`Attempting to remove nonexistent property: ${removed}`);
    }
    // no way to discard the
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _a = properties, _b = removed, discarded = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return Object.assign(Object.assign({}, schema), { properties: rest, required: required.filter((e) => e !== removed) });
}
function schemaSupportsType(typeValue, type) {
    if (!typeValue) {
        return false;
    }
    if (!Array.isArray(typeValue)) {
        typeValue = [typeValue];
    }
    return typeValue.includes(type);
}
/** db
 * removes the horrible, obnoxious, and annoying case where JSON schemas can just be
 * "true" or "false" meaning the below definitions and screwing up my type checker
 */
function db(s) {
    if (s === true) {
        return {};
    }
    if (s === false) {
        return { not: {} };
    }
    return s;
}
function supportsNull(schema) {
    var _a;
    return (schemaSupportsType(schema.type, 'null') ||
        !!((_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.some((subSchema) => schemaSupportsType(db(subSchema).type, 'null'))));
}
function findHost(schema, name) {
    var _a;
    if (schema.anyOf) {
        const maybeSchema = (_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.find((t) => typeof t === 'object' && t.properties);
        if (typeof maybeSchema === 'object' && typeof maybeSchema.properties === 'object') {
            const maybeHost = maybeSchema.properties[name];
            if (maybeHost !== false && maybeHost !== true) {
                return maybeHost;
            }
        }
    }
    else if (schema.properties && schema.properties[name]) {
        const maybeHost = schema.properties[name];
        if (maybeHost !== false && maybeHost !== true) {
            return maybeHost;
        }
    }
    throw new Error("Coudln't find the host for this data.");
}
function inSchema(schema, op) {
    var _a;
    const properties = schema.properties
        ? schema.properties
        : ((_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.find((t) => typeof t === 'object' && t.properties)).properties;
    if (!properties) {
        throw new Error("Cannot look 'in' an object that doesn't have properties.");
    }
    const { name, lens } = op;
    if (!name) {
        throw new Error(`Expected to find property ${name} in ${Object.keys(op || {})}`);
    }
    const host = findHost(schema, name);
    if (host === undefined) {
        throw new Error(`Expected to find property ${name} in ${Object.keys(properties || {})}`);
    }
    const newProperties = Object.assign(Object.assign({}, properties), { [name]: updateSchema(host, lens) });
    return Object.assign(Object.assign({}, schema), { properties: newProperties });
}
function validateSchemaItems(items) {
    if (Array.isArray(items)) {
        throw new Error('Cambria only supports consistent types for arrays.');
    }
    if (!items || items === true) {
        throw new Error(`Cambria requires a specific items definition, found ${items}.`);
    }
    return items;
}
function mapSchema(schema, lens) {
    if (!lens) {
        throw new Error('Map requires a `lens` to map over the array.');
    }
    if (!schema.items) {
        throw new Error(`Map requires a schema with items to map over, ${deepInspect(schema)}`);
    }
    return Object.assign(Object.assign({}, schema), { items: updateSchema(validateSchemaItems(schema.items), lens) });
}
function filterScalarOrArray(v, cb) {
    if (!Array.isArray(v)) {
        v = [v];
    }
    v = v.filter(cb);
    if (v.length === 1) {
        return v[0];
    }
    return v;
}
// XXX: THIS SHOULD REMOVE DEFAULT: NULL
function removeNullSupport(prop) {
    if (!supportsNull(prop)) {
        return prop;
    }
    if (prop.type) {
        if (prop.type === 'null') {
            return null;
        }
        prop = Object.assign(Object.assign({}, prop), { type: filterScalarOrArray(prop.type, (t) => t !== 'null') });
        if (prop.default === null) {
            prop.default = defaults_1.defaultValuesByType(prop.type); // the above always assigns a legal type
        }
    }
    if (prop.anyOf) {
        const newAnyOf = prop.anyOf.reduce((acc, s) => {
            const clean = removeNullSupport(db(s));
            return clean ? [...acc, clean] : acc;
        }, []);
        if (newAnyOf.length === 1) {
            return newAnyOf[0];
        }
        prop = Object.assign(Object.assign({}, prop), { anyOf: newAnyOf });
    }
    return prop;
}
function wrapProperty(schema, op) {
    if (!op.name) {
        throw new Error('Wrap property requires a `name` to identify what to wrap.');
    }
    if (!schema.properties) {
        throw new Error('Cannot wrap a property here. There are no properties.');
    }
    const prop = db(schema.properties[op.name]);
    if (!prop) {
        throw new Error(`Cannot wrap property '${op.name}' because it does not exist.`);
    }
    if (!supportsNull(prop)) {
        throw new Error(`Cannot wrap property '${op.name}' because it does not allow nulls, found ${deepInspect(schema)}`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [op.name]: {
                type: 'array',
                default: [],
                items: removeNullSupport(prop) || { not: {} },
            } }) });
}
function headProperty(schema, op) {
    if (!op.name) {
        throw new Error('Head requires a `name` to identify what to take head from.');
    }
    if (!schema.properties[op.name]) {
        throw new Error(`Cannot head property '${op.name}' because it does not exist.`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [op.name]: { anyOf: [{ type: 'null' }, schema.properties[op.name].items] } }) });
}
function hoistProperty(_schema, host, name) {
    return withNullable(_schema, (schema) => {
        if (schema.properties === undefined) {
            throw new Error(`Can't hoist when root schema isn't an object`);
        }
        if (!host) {
            throw new Error(`Need a \`host\` property to hoist from.`);
        }
        if (!name) {
            throw new Error(`Need to provide a \`name\` to hoist up`);
        }
        const { properties } = schema;
        if (!(host in properties)) {
            throw new Error(`Can't hoist anything from ${host}, it does not exist here. (Found properties ${Object.keys(properties)})`);
        }
        const hoistedPropertySchema = withNullable(db(properties[host]), (hostSchema) => {
            const hostProperties = hostSchema.properties;
            const hostRequired = hostSchema.required || [];
            if (!hostProperties) {
                throw new Error(`There are no properties to hoist out of ${host}, found ${Object.keys(hostSchema)}`);
            }
            if (!(name in hostProperties)) {
                throw new Error(`Can't hoist anything from ${host}, it does not exist here. (Found properties ${Object.keys(properties)})`);
            }
            const _a = hostProperties, _b = name, target = _a[_b], remainingProperties = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            return Object.assign(Object.assign({}, hostSchema), { properties: remainingProperties, required: hostRequired.filter((e) => e !== name) });
        });
        const childObject = withNullable(db(properties[host]), (hostSchema) => {
            const hostProperties = hostSchema.properties;
            const { [name]: target } = hostProperties;
            return db(target);
        });
        return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [host]: hoistedPropertySchema, [name]: childObject }), required: [...(schema.required || []), name] });
    });
}
function plungeProperty(schema, host, name) {
    // XXXX what should we do for missing child properties? error?
    const { properties = {} } = schema;
    if (!host) {
        throw new Error(`Need a \`host\` property to plunge into`);
    }
    if (!name) {
        throw new Error(`Need to provide a \`name\` to plunge`);
    }
    const destinationTypeProperties = properties[name];
    if (!destinationTypeProperties) {
        throw new Error(`Could not find a property called ${name} among ${Object.keys(properties)}`);
    }
    // we can throw an error here if things are missing?
    if (destinationTypeProperties === true) {
        // errrr... complain?
        return schema;
    }
    // add the property to the root schema
    schema = inSchema(schema, {
        op: 'in',
        name: host,
        lens: [
            Object.assign(Object.assign({ op: 'add' }, destinationTypeProperties), { name }),
        ],
    });
    // remove it from its current parent
    // PS: ugh
    schema = removeProperty(schema, name);
    return schema;
}
function convertValue(schema, lensOp) {
    const { name, destinationType, mapping } = lensOp;
    if (!destinationType) {
        return schema;
    }
    if (!name) {
        throw new Error(`Missing property name in 'convert'.\nFound:\n${JSON.stringify(lensOp)}`);
    }
    if (!mapping) {
        throw new Error(`Missing mapping for 'convert'.\nFound:\n${JSON.stringify(lensOp)}`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [name]: {
                type: destinationType,
                default: defaults_1.defaultValuesByType(destinationType),
            } }) });
}
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function applyLensOperation(schema, op) {
    switch (op.op) {
        case 'add':
            return addProperty(schema, op);
        case 'remove':
            return removeProperty(schema, op.name || '');
        case 'rename':
            return renameProperty(schema, op.source, op.destination);
        case 'in':
            return inSchema(schema, op);
        case 'map':
            return mapSchema(schema, op.lens);
        case 'wrap':
            return wrapProperty(schema, op);
        case 'head':
            return headProperty(schema, op);
        case 'hoist':
            return hoistProperty(schema, op.host, op.name);
        case 'plunge':
            return plungeProperty(schema, op.host, op.name);
        case 'convert':
            return convertValue(schema, op);
        default:
            assertNever(op); // exhaustiveness check
            return null;
    }
}
function updateSchema(schema, lens) {
    return lens.reduce((schema, op) => {
        if (schema === undefined)
            throw new Error("Can't update undefined schema");
        return applyLensOperation(schema, op);
    }, schema);
}
exports.updateSchema = updateSchema;
function schemaForLens(lens) {
    const emptySchema = {
        $schema: 'http://json-schema.org/draft-07/schema',
        type: 'object',
        additionalProperties: false,
    };
    return updateSchema(emptySchema, lens);
}
exports.schemaForLens = schemaForLens;

},{"./defaults":5,"util":17}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lensFromTo = exports.lensGraphSchema = exports.lensGraphSchemas = exports.registerLens = exports.initLensGraph = void 0;
const graphlib_1 = require("graphlib");
const _1 = require(".");
const json_schema_1 = require("./json-schema");
function initLensGraph() {
    const lensGraph = { graph: new graphlib_1.Graph() };
    lensGraph.graph.setNode('mu', json_schema_1.emptySchema);
    return lensGraph;
}
exports.initLensGraph = initLensGraph;
function registerLens({ graph }, from, to, lenses) {
    // clone the graph to ensure this is a pure function
    graph = graphlib_1.json.read(graphlib_1.json.write(graph)); // (these are graphlib's jsons)
    if (!graph.node(from)) {
        throw new RangeError(`unknown schema ${from}`);
    }
    const existingLens = graph.edge({ v: from, w: to });
    if (existingLens) {
        // we could assert this? assert.deepEqual(existingLens, lenses)
        // we've already registered a lens on this edge, hope it's the same one!
        return { graph };
    }
    if (graph.node(to)) {
        throw new RangeError(`already have a schema named ${to}`);
    }
    graph.setEdge(from, to, lenses);
    graph.setEdge(to, from, _1.reverseLens(lenses));
    graph.setNode(to, _1.updateSchema(graph.node(from), lenses));
    return { graph };
}
exports.registerLens = registerLens;
function lensGraphSchemas({ graph }) {
    return graph.nodes();
}
exports.lensGraphSchemas = lensGraphSchemas;
function lensGraphSchema({ graph }, schema) {
    return graph.node(schema);
}
exports.lensGraphSchema = lensGraphSchema;
function lensFromTo({ graph }, from, to) {
    const migrationPaths = graphlib_1.alg.dijkstra(graph, to);
    const lenses = [];
    if (migrationPaths[from].distance == Infinity) {
        throw new Error(`no path found from ${from} to ${to}`);
    }
    if (migrationPaths[from].distance == 0) {
        return [];
    }
    for (let v = from; v != to; v = migrationPaths[v].predecessor) {
        const w = migrationPaths[v].predecessor;
        const edge = graph.edge({ v, w });
        lenses.push(...edge);
    }
    return lenses;
}
exports.lensFromTo = lensFromTo;

},{".":8,"./json-schema":9,"graphlib":22}],11:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadYamlLens = exports.loadLens = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const foldInOp = (lensOpJson) => {
    const opName = Object.keys(lensOpJson)[0];
    // the json format is
    // {"<opName>": {opArgs}}
    // and the internal format is
    // {op: <opName>, ...opArgs}
    const data = lensOpJson[opName];
    if (['in', 'map'].includes(opName)) {
        data.lens = data.lens.map((lensOp) => foldInOp(lensOp));
    }
    const op = Object.assign({ op: opName }, data);
    return op;
};
function loadLens(rawLens) {
    return rawLens.lens
        .filter((o) => o !== null)
        .map((lensOpJson) => foldInOp(lensOpJson));
}
exports.loadLens = loadLens;
function loadYamlLens(lensData) {
    const rawLens = js_yaml_1.default.safeLoad(lensData);
    if (!rawLens || typeof rawLens !== 'object')
        throw new Error('Error loading lens');
    if (!('lens' in rawLens))
        throw new Error(`Expected top-level key 'lens' in YAML lens file`);
    // we could have a root op to make this consistent...
    return loadLens(rawLens);
}
exports.loadYamlLens = loadYamlLens;

},{"js-yaml":42}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandPatch = exports.applyLensToPatchOp = exports.applyLensToPatch = exports.compile = void 0;
const reverse_1 = require("./reverse");
const defaults_1 = require("./defaults");
const json_schema_1 = require("./json-schema");
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function noNulls(items) {
    return items.filter((x) => x !== null);
}
// Provide curried functions that incorporate the lenses internally;
// this is useful for exposing a pre-baked converter function to developers
// without them needing to access the lens themselves
// TODO: the public interface could just be runLens and reverseLens
// ... maybe also composeLens?
function compile(lensSource) {
    return {
        right: (patch, targetDoc) => applyLensToPatch(lensSource, patch, targetDoc),
        left: (patch, targetDoc) => applyLensToPatch(reverse_1.reverseLens(lensSource), patch, targetDoc),
    };
}
exports.compile = compile;
// given a patch, returns a new patch that has had the lens applied to it.
function applyLensToPatch(lensSource, patch, patchSchema // the json schema for the doc the patch was operating on
) {
    // expand patches that set nested objects into scalar patches
    const expandedPatch = patch.map((op) => expandPatch(op)).flat();
    // send everything through the lens
    const lensedPatch = noNulls(expandedPatch.map((patchOp) => applyLensToPatchOp(lensSource, patchOp)));
    // add in default values needed (based on the new schema after lensing)
    const readerSchema = json_schema_1.updateSchema(patchSchema, lensSource);
    const lensedPatchWithDefaults = defaults_1.addDefaultValues(lensedPatch, readerSchema);
    return lensedPatchWithDefaults;
}
exports.applyLensToPatch = applyLensToPatch;
// todo: remove destinationDoc entirely
function applyLensToPatchOp(lensSource, patchOp) {
    return lensSource.reduce((prevPatch, lensOp) => {
        return runLensOp(lensOp, prevPatch);
    }, patchOp);
}
exports.applyLensToPatchOp = applyLensToPatchOp;
function runLensOp(lensOp, patchOp) {
    if (patchOp === null) {
        return null;
    }
    switch (lensOp.op) {
        case 'rename':
            if (
            // TODO: what about other JSON patch op types?
            // (consider other parts of JSON patch: move / copy / test / remove ?)
            (patchOp.op === 'replace' || patchOp.op === 'add') &&
                patchOp.path.split('/')[1] === lensOp.source) {
                const path = patchOp.path.replace(lensOp.source, lensOp.destination);
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        case 'hoist': {
            // leading slash needs trimming
            const pathElements = patchOp.path.substr(1).split('/');
            const [possibleSource, possibleDestination, ...rest] = pathElements;
            if (possibleSource === lensOp.host && possibleDestination === lensOp.name) {
                const path = ['', lensOp.name, ...rest].join('/');
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'plunge': {
            const pathElements = patchOp.path.substr(1).split('/');
            const [head] = pathElements;
            if (head === lensOp.name) {
                const path = ['', lensOp.host, pathElements].join('/');
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'wrap': {
            const pathComponent = new RegExp(`^/(${lensOp.name})(.*)`);
            const match = patchOp.path.match(pathComponent);
            if (match) {
                const path = `/${match[1]}/0${match[2]}`;
                if ((patchOp.op === 'add' || patchOp.op === 'replace') &&
                    patchOp.value === null &&
                    match[2] === '') {
                    return { op: 'remove', path };
                }
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'head': {
            // break early if we're not handling a write to the array handled by this lens
            const arrayMatch = patchOp.path.split('/')[1] === lensOp.name;
            if (!arrayMatch)
                break;
            // We only care about writes to the head element, nothing else matters
            const headMatch = patchOp.path.match(new RegExp(`^/${lensOp.name}/0(.*)`));
            if (!headMatch)
                return null;
            if (patchOp.op === 'add' || patchOp.op === 'replace') {
                // If the write is to the first array element, write to the scalar
                return {
                    op: patchOp.op,
                    path: `/${lensOp.name}${headMatch[1] || ''}`,
                    value: patchOp.value,
                };
            }
            if (patchOp.op === 'remove') {
                if (headMatch[1] === '') {
                    return {
                        op: 'replace',
                        path: `/${lensOp.name}${headMatch[1] || ''}`,
                        value: null,
                    };
                }
                else {
                    return Object.assign(Object.assign({}, patchOp), { path: `/${lensOp.name}${headMatch[1] || ''}` });
                }
            }
            break;
        }
        case 'add':
            // hmm, what do we do here? perhaps write the default value if there's nothing
            // already written into the doc there?
            // (could be a good use case for destinationDoc)
            break;
        case 'remove':
            if (patchOp.path.split('/')[1] === lensOp.name)
                return null;
            break;
        case 'in': {
            // Run the inner body in a context where the path has been narrowed down...
            const pathComponent = new RegExp(`^/${lensOp.name}`);
            if (patchOp.path.match(pathComponent)) {
                const childPatch = applyLensToPatchOp(lensOp.lens, Object.assign(Object.assign({}, patchOp), { path: patchOp.path.replace(pathComponent, '') }));
                if (childPatch) {
                    return Object.assign(Object.assign({}, childPatch), { path: `/${lensOp.name}${childPatch.path}` });
                }
                else {
                    return null;
                }
            }
            break;
        }
        case 'map': {
            const arrayIndexMatch = patchOp.path.match(/\/([0-9]+)\//);
            if (!arrayIndexMatch)
                break;
            const arrayIndex = arrayIndexMatch[1];
            const itemPatch = applyLensToPatchOp(lensOp.lens, Object.assign(Object.assign({}, patchOp), { path: patchOp.path.replace(/\/[0-9]+\//, '/') }));
            if (itemPatch) {
                return Object.assign(Object.assign({}, itemPatch), { path: `/${arrayIndex}${itemPatch.path}` });
            }
            return null;
        }
        case 'convert': {
            if (patchOp.op !== 'add' && patchOp.op !== 'replace')
                break;
            if (`/${lensOp.name}` !== patchOp.path)
                break;
            const stringifiedValue = String(patchOp.value);
            // todo: should we add in support for fallback/default conversions
            if (!Object.keys(lensOp.mapping[0]).includes(stringifiedValue)) {
                throw new Error(`No mapping for value: ${stringifiedValue}`);
            }
            return Object.assign(Object.assign({}, patchOp), { value: lensOp.mapping[0][stringifiedValue] });
        }
        default:
            assertNever(lensOp); // exhaustiveness check
    }
    return patchOp;
}
function expandPatch(patchOp) {
    // this only applies for add and replace ops; no expansion to do otherwise
    // todo: check the whole list of json patch verbs
    if (patchOp.op !== 'add' && patchOp.op !== 'replace')
        return [patchOp];
    if (patchOp.value && typeof patchOp.value === 'object') {
        let result = [
            {
                op: patchOp.op,
                path: patchOp.path,
                value: Array.isArray(patchOp.value) ? [] : {},
            },
        ];
        result = result.concat(Object.entries(patchOp.value).map(([key, value]) => {
            return expandPatch({
                op: patchOp.op,
                path: `${patchOp.path}/${key}`,
                value,
            });
        }));
        return result.flat(Infinity);
    }
    return [patchOp];
}
exports.expandPatch = expandPatch;

},{"./defaults":5,"./json-schema":9,"./reverse":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseLens = void 0;
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function reverseLens(lens) {
    return lens
        .slice()
        .reverse()
        .map((l) => reverseLensOp(l));
}
exports.reverseLens = reverseLens;
function reverseLensOp(lensOp) {
    switch (lensOp.op) {
        case 'rename':
            return Object.assign(Object.assign({}, lensOp), { source: lensOp.destination, destination: lensOp.source });
        case 'add': {
            return Object.assign(Object.assign({}, lensOp), { op: 'remove' });
        }
        case 'remove':
            return Object.assign(Object.assign({}, lensOp), { op: 'add' });
        case 'wrap':
            return Object.assign(Object.assign({}, lensOp), { op: 'head' });
        case 'head':
            return Object.assign(Object.assign({}, lensOp), { op: 'wrap' });
        case 'in':
        case 'map':
            return Object.assign(Object.assign({}, lensOp), { lens: reverseLens(lensOp.lens) });
        case 'hoist':
            return Object.assign(Object.assign({}, lensOp), { op: 'plunge' });
        case 'plunge':
            return Object.assign(Object.assign({}, lensOp), { op: 'hoist' });
        case 'convert': {
            const mapping = [lensOp.mapping[1], lensOp.mapping[0]];
            const reversed = Object.assign(Object.assign({}, lensOp), { mapping, sourceType: lensOp.destinationType, destinationType: lensOp.sourceType });
            return reversed;
        }
        default:
            return assertNever(lensOp); // exhaustiveness check
    }
}

},{}],14:[function(require,module,exports){
/*!
 * /**
 * * @name JSON Editor
 * * @description JSON Schema Based Editor
 * * This library is the continuation of jdorn's great work (see also https://github.com/jdorn/json-editor/issues/800)
 * * @version "2.3.0"
 * * @author Jeremy Dorn
 * * @see https://github.com/jdorn/json-editor/
 * * @see https://github.com/json-editor/json-editor
 * * @license MIT
 * * @example see README.md and docs/ for requirements, examples and usage info
 * * /
 */
!function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var s=e();for(var i in s)("object"==typeof exports?exports:t)[i]=s[i]}}(window,(function(){return function(t){var e={};function s(i){if(e[i])return e[i].exports;var r=e[i]={i:i,l:!1,exports:{}};return t[i].call(r.exports,r,r.exports,s),r.l=!0,r.exports}return s.m=t,s.c=e,s.d=function(t,e,i){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,e){if(1&e&&(t=s(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)s.d(i,r,function(e){return t[e]}.bind(null,r));return i},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="/dist/",s(s.s=3)}([function(t,e,s){var i=s(1),r=s(2);"string"==typeof(r=r.__esModule?r.default:r)&&(r=[[t.i,r,""]]);var o={insert:"head",singleton:!1};i(r,o);t.exports=r.locals||{}},function(t,e,s){var i,r=function(){return void 0===i&&(i=Boolean(window&&document&&document.all&&!window.atob)),i},o=function(){var t={};return function(e){if(void 0===t[e]){var s=document.querySelector(e);if(window.HTMLIFrameElement&&s instanceof window.HTMLIFrameElement)try{s=s.contentDocument.head}catch(t){s=null}t[e]=s}return t[e]}}(),n=[];function a(t){for(var e=-1,s=0;s<n.length;s++)if(n[s].identifier===t){e=s;break}return e}function l(t,e){for(var s={},i=[],r=0;r<t.length;r++){var o=t[r],l=e.base?o[0]+e.base:o[0],h=s[l]||0,d="".concat(l," ").concat(h);s[l]=h+1;var c=a(d),p={css:o[1],media:o[2],sourceMap:o[3]};-1!==c?(n[c].references++,n[c].updater(p)):n.push({identifier:d,updater:g(p,e),references:1}),i.push(d)}return i}function h(t){var e=document.createElement("style"),i=t.attributes||{};if(void 0===i.nonce){var r=s.nc;r&&(i.nonce=r)}if(Object.keys(i).forEach((function(t){e.setAttribute(t,i[t])})),"function"==typeof t.insert)t.insert(e);else{var n=o(t.insert||"head");if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");n.appendChild(e)}return e}var d,c=(d=[],function(t,e){return d[t]=e,d.filter(Boolean).join("\n")});function p(t,e,s,i){var r=s?"":i.media?"@media ".concat(i.media," {").concat(i.css,"}"):i.css;if(t.styleSheet)t.styleSheet.cssText=c(e,r);else{var o=document.createTextNode(r),n=t.childNodes;n[e]&&t.removeChild(n[e]),n.length?t.insertBefore(o,n[e]):t.appendChild(o)}}function u(t,e,s){var i=s.css,r=s.media,o=s.sourceMap;if(r?t.setAttribute("media",r):t.removeAttribute("media"),o&&btoa&&(i+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(o))))," */")),t.styleSheet)t.styleSheet.cssText=i;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(i))}}var m=null,b=0;function g(t,e){var s,i,r;if(e.singleton){var o=b++;s=m||(m=h(e)),i=p.bind(null,s,o,!1),r=p.bind(null,s,o,!0)}else s=h(e),i=u.bind(null,s,e),r=function(){!function(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t)}(s)};return i(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;i(t=e)}else r()}}t.exports=function(t,e){(e=e||{}).singleton||"boolean"==typeof e.singleton||(e.singleton=r());var s=l(t=t||[],e);return function(t){if(t=t||[],"[object Array]"===Object.prototype.toString.call(t)){for(var i=0;i<s.length;i++){var r=a(s[i]);n[r].references--}for(var o=l(t,e),h=0;h<s.length;h++){var d=a(s[h]);0===n[d].references&&(n[d].updater(),n.splice(d,1))}s=o}}}},function(t,e){t.exports=""},function(t,e,s){s.r(e),s.d(e,"JSONEditor",(function(){return K}));const i=["actionscript","batchfile","c","c++","cpp","coffee","csharp","css","dart","django","ejs","erlang","golang","groovy","handlebars","haskell","haxe","html","ini","jade","java","javascript","json","less","lisp","lua","makefile","matlab","mysql","objectivec","pascal","perl","pgsql","php","python","r","ruby","sass","scala","scss","smarty","sql","sqlserver","stylus","svg","twig","vbscript","xml","yaml"],r=[t=>"string"===t.type&&"color"===t.format&&"colorpicker",t=>"string"===t.type&&["ip","ipv4","ipv6","hostname"].includes(t.format)&&"ip",t=>"string"===t.type&&i.includes(t.format)&&"ace",t=>"string"===t.type&&["xhtml","bbcode"].includes(t.format)&&"sceditor",t=>"string"===t.type&&"markdown"===t.format&&"simplemde",t=>"string"===t.type&&"jodit"===t.format&&"jodit",t=>"string"===t.type&&"autocomplete"===t.format&&"autocomplete",t=>"string"===t.type&&"uuid"===t.format&&"uuid",t=>"info"===t.format&&"info",t=>"button"===t.format&&"button",t=>{if(t.links)for(let e=0;e<t.links.length;e++)if(t.links[e].rel&&"describedby"===t.links[e].rel.toLowerCase())return"describedBy"},t=>["string","integer"].includes(t.type)&&["starrating","rating"].includes(t.format)&&"starrating",t=>["string","integer"].includes(t.type)&&["date","time","datetime-local"].includes(t.format)&&"datetime",t=>(t.oneOf||t.anyOf)&&"multiple",t=>{if("array"===t.type&&t.items&&!Array.isArray(t.items)&&["string","number","integer"].includes(t.items.type)){if("choices"===t.format)return"arrayChoices";if(t.uniqueItems){if("selectize"===t.format)return"arraySelectize";if("select2"===t.format)return"arraySelect2";if("table"!==t.format)return"multiselect"}}},t=>{if(t.enum){if("array"===t.type||"object"===t.type)return"enum";if("number"===t.type||"integer"===t.type||"string"===t.type)return"radio"===t.format?"radio":"select2"===t.format?"select2":"selectize"===t.format?"selectize":"choices"===t.format?"choices":"select"}},t=>{if(t.enumSource)return"radio"===t.format?"radio":"select2"===t.format?"select2":"selectize"===t.format?"selectize":"choices"===t.format?"choices":"select"},t=>"array"===t.type&&"table"===t.format&&"table",t=>"string"===t.type&&"url"===t.format&&window.FileReader&&t.options&&t.options.upload===Object(t.options.upload)&&"upload",t=>"string"===t.type&&t.media&&"base64"===t.media.binaryEncoding&&"base64",t=>"any"===t.type&&"multiple",t=>{if("boolean"===t.type)return"checkbox"===t.format||t.options&&t.options.checkbox?"checkbox":"select2"===t.format?"select2":"selectize"===t.format?"selectize":"choices"===t.format?"choices":"select"},t=>"string"===t.type&&"signature"===t.format&&"signature",t=>"string"==typeof t.type&&t.type,t=>!t.type&&t.properties&&"object",t=>"string"!=typeof t.type&&"multiple"],o={},n={};n.en={error_notset:"Property must be set",error_notempty:"Value required",error_enum:"Value must be one of the enumerated values",error_anyOf:"Value must validate against at least one of the provided schemas",error_oneOf:"Value must validate against exactly one of the provided schemas. It currently validates against {{0}} of the schemas.",error_not:"Value must not validate against the provided schema",error_type_union:"Value must be one of the provided types",error_type:"Value must be of type {{0}}",error_disallow_union:"Value must not be one of the provided disallowed types",error_disallow:"Value must not be of type {{0}}",error_multipleOf:"Value must be a multiple of {{0}}",error_maximum_excl:"Value must be less than {{0}}",error_maximum_incl:"Value must be at most {{0}}",error_minimum_excl:"Value must be greater than {{0}}",error_minimum_incl:"Value must be at least {{0}}",error_maxLength:"Value must be at most {{0}} characters long",error_minLength:"Value must be at least {{0}} characters long",error_pattern:"Value must match the pattern {{0}}",error_additionalItems:"No additional items allowed in this array",error_maxItems:"Value must have at most {{0}} items",error_minItems:"Value must have at least {{0}} items",error_uniqueItems:"Array must have unique items",error_maxProperties:"Object must have at most {{0}} properties",error_minProperties:"Object must have at least {{0}} properties",error_required:"Object is missing the required property '{{0}}'",error_additional_properties:"No additional properties allowed, but property {{0}} is set",error_dependency:"Must have property {{0}}",error_date:"Date must be in the format {{0}}",error_time:"Time must be in the format {{0}}",error_datetime_local:"Datetime must be in the format {{0}}",error_invalid_epoch:"Date must be greater than 1 January 1970",error_ipv4:"Value must be a valid IPv4 address in the form of 4 numbers between 0 and 255, separated by dots",error_ipv6:"Value must be a valid IPv6 address",error_hostname:"The hostname has the wrong format",button_delete_all:"All",button_delete_all_title:"Delete All",button_delete_last:"Last {{0}}",button_delete_last_title:"Delete Last {{0}}",button_add_row_title:"Add {{0}}",button_move_down_title:"Move down",button_move_up_title:"Move up",button_object_properties:"Object Properties",button_delete_row_title:"Delete {{0}}",button_delete_row_title_short:"Delete",button_copy_row_title_short:"Copy",button_collapse:"Collapse",button_expand:"Expand",flatpickr_toggle_button:"Toggle",flatpickr_clear_button:"Clear",choices_placeholder_text:"Start typing to add value",default_array_item_title:"item",button_delete_node_warning:"Are you sure you want to remove this node?"},Object.entries(o).forEach(([t,e])=>{o[t].options=e.options||{}});const a={options:{upload:function(t,e,s){console.log("Upload handler required for upload editor")},prompt_before_delete:!0,use_default_values:!0,max_depth:0},theme:"html",template:"default",themes:{},callbacks:{},templates:{},iconlibs:{},editors:o,languages:n,resolvers:r,custom_validators:[],default_language:"en",language:"en",translate:function(t,e){const s=a.languages[a.language];if(!s)throw new Error("Unknown language "+a.language);let i=s[t]||a.languages.en[t];if(void 0===i)throw new Error("Unknown translate string "+t);if(e)for(let t=0;t<e.length;t++)i=i.replace(new RegExp(`\\{\\{${t}}}`,"g"),e[t]);return i}};function l(t,e,s,i){try{switch(t.format){case"ipv4":(t=>{const e=t.split(".");if(4!==e.length)throw new Error("error_ipv4");e.forEach(t=>{if(isNaN(+t)||+t<0||+t>255)throw new Error("error_ipv4")})})(e);break;case"ipv6":(t=>{if(!t.match("^(?:(?:(?:[a-fA-F0-9]{1,4}:){6}|(?=(?:[a-fA-F0-9]{0,4}:){2,6}(?:[0-9]{1,3}.){3}[0-9]{1,3}$)(([0-9a-fA-F]{1,4}:){1,5}|:)((:[0-9a-fA-F]{1,4}){1,5}:|:)|::(?:[a-fA-F0-9]{1,4}:){5})(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9]).){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])|(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}|(?=(?:[a-fA-F0-9]{0,4}:){0,7}[a-fA-F0-9]{0,4}$)(([0-9a-fA-F]{1,4}:){1,7}|:)((:[0-9a-fA-F]{1,4}){1,7}|:)|(?:[a-fA-F0-9]{1,4}:){7}:|:(:[a-fA-F0-9]{1,4}){7})$"))throw new Error("error_ipv6")})(e);break;case"hostname":(t=>{if(!t.match("(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9].)+[a-zA-Z]{2,63}$)"))throw new Error("error_hostname")})(e)}return[]}catch(t){return[{path:s,property:"format",message:i(t.message)}]}}function h(t){return null!==t&&("object"==typeof t&&!t.nodeType&&t!==t.window&&!(t.constructor&&!u(t.constructor.prototype,"isPrototypeOf")))}function d(t){return h(t)?c({},t):Array.isArray(t)?t.map(d):t}function c(t,...e){return e.forEach(e=>{Object.keys(e).forEach(s=>{e[s]&&h(e[s])?(u(t,s)||(t[s]={}),c(t[s],e[s])):Array.isArray(e[s])?t[s]=d(e[s]):t[s]=e[s]})}),t}function p(t,e){const s=document.createEvent("HTMLEvents");s.initEvent(e,!0,!0),t.dispatchEvent(s)}function u(t,e){return t&&Object.prototype.hasOwnProperty.call(t,e)}const m=/^\s*(-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/;const b=/^\s*(-|\+)?(\d+)\s*$/;class g{constructor(t,e,s,i){this.jsoneditor=t,this.schema=e||this.jsoneditor.schema,this.options=s||{},this.translate=this.jsoneditor.translate||i.translate,this.defaults=i,this._validateSubSchema={enum(t,e,s){const i=JSON.stringify(e);return t.enum.some(t=>i===JSON.stringify(t))?[]:[{path:s,property:"enum",message:this.translate("error_enum")}]},extends(t,e,s){return t.extends.reduce((t,i)=>(t.push(...this._validateSchema(i,e,s)),t),[])},allOf(t,e,s){return t.allOf.reduce((t,i)=>(t.push(...this._validateSchema(i,e,s)),t),[])},anyOf(t,e,s){return t.anyOf.some(t=>!this._validateSchema(t,e,s).length)?[]:[{path:s,property:"anyOf",message:this.translate("error_anyOf")}]},oneOf(t,e,s){let i=0;const r=[];t.oneOf.forEach((t,o)=>{const n=this._validateSchema(t,e,s);n.length||i++,n.forEach(t=>{t.path=`${s}.oneOf[${o}]${t.path.substr(s.length)}`}),r.push(...n)});const o=[];return 1!==i&&(o.push({path:s,property:"oneOf",message:this.translate("error_oneOf",[i])}),o.push(...r)),o},not(t,e,s){return this._validateSchema(t.not,e,s).length?[]:[{path:s,property:"not",message:this.translate("error_not")}]},type(t,e,s){if(Array.isArray(t.type)){if(!t.type.some(t=>this._checkType(t,e)))return[{path:s,property:"type",message:this.translate("error_type_union")}]}else if(["date","time","datetime-local"].includes(t.format)&&"integer"===t.type){if(!this._checkType("string",""+e))return[{path:s,property:"type",message:this.translate("error_type",[t.format])}]}else if(!this._checkType(t.type,e))return[{path:s,property:"type",message:this.translate("error_type",[t.type])}];return[]},disallow(t,e,s){if(Array.isArray(t.disallow)){if(t.disallow.some(t=>this._checkType(t,e)))return[{path:s,property:"disallow",message:this.translate("error_disallow_union")}]}else if(this._checkType(t.disallow,e))return[{path:s,property:"disallow",message:this.translate("error_disallow",[t.disallow])}];return[]}},this._validateNumberSubSchema={multipleOf(t,e,s){return this._validateNumberSubSchemaMultipleDivisible(t,e,s)},divisibleBy(t,e,s){return this._validateNumberSubSchemaMultipleDivisible(t,e,s)},maximum(t,e,s){let i=t.exclusiveMaximum?e<t.maximum:e<=t.maximum;return window.math?i=window.math[t.exclusiveMaximum?"smaller":"smallerEq"](window.math.bignumber(e),window.math.bignumber(t.maximum)):window.Decimal&&(i=new window.Decimal(e)[t.exclusiveMaximum?"lt":"lte"](new window.Decimal(t.maximum))),i?[]:[{path:s,property:"maximum",message:this.translate(t.exclusiveMaximum?"error_maximum_excl":"error_maximum_incl",[t.maximum])}]},minimum(t,e,s){let i=t.exclusiveMinimum?e>t.minimum:e>=t.minimum;return window.math?i=window.math[t.exclusiveMinimum?"larger":"largerEq"](window.math.bignumber(e),window.math.bignumber(t.minimum)):window.Decimal&&(i=new window.Decimal(e)[t.exclusiveMinimum?"gt":"gte"](new window.Decimal(t.minimum))),i?[]:[{path:s,property:"minimum",message:this.translate(t.exclusiveMinimum?"error_minimum_excl":"error_minimum_incl",[t.minimum])}]}},this._validateStringSubSchema={maxLength(t,e,s){const i=[];return(""+e).length>t.maxLength&&i.push({path:s,property:"maxLength",message:this.translate("error_maxLength",[t.maxLength])}),i},minLength(t,e,s){return(""+e).length<t.minLength?[{path:s,property:"minLength",message:this.translate(1===t.minLength?"error_notempty":"error_minLength",[t.minLength])}]:[]},pattern(t,e,s){return new RegExp(t.pattern).test(e)?[]:[{path:s,property:"pattern",message:t.options&&t.options.patternmessage?t.options.patternmessage:this.translate("error_pattern",[t.pattern])}]}},this._validateArraySubSchema={items(t,e,s){const i=[];if(Array.isArray(t.items))for(let r=0;r<e.length;r++)if(t.items[r])console.log("--\x3e"),i.push(...this._validateSchema(t.items[r],e[r],`${s}.${r}`));else{if(!0===t.additionalItems)break;if(!t.additionalItems){if(!1===t.additionalItems){i.push({path:s,property:"additionalItems",message:this.translate("error_additionalItems")});break}break}i.push(...this._validateSchema(t.additionalItems,e[r],`${s}.${r}`))}else e.forEach((e,r)=>{i.push(...this._validateSchema(t.items,e,`${s}.${r}`))});return i},maxItems(t,e,s){return e.length>t.maxItems?[{path:s,property:"maxItems",message:this.translate("error_maxItems",[t.maxItems])}]:[]},minItems(t,e,s){return e.length<t.minItems?[{path:s,property:"minItems",message:this.translate("error_minItems",[t.minItems])}]:[]},uniqueItems(t,e,s){const i={};for(let t=0;t<e.length;t++){const r=JSON.stringify(e[t]);if(i[r])return[{path:s,property:"uniqueItems",message:this.translate("error_uniqueItems")}];i[r]=!0}return[]}},this._validateObjectSubSchema={maxProperties(t,e,s){return Object.keys(e).length>t.maxProperties?[{path:s,property:"maxProperties",message:this.translate("error_maxProperties",[t.maxProperties])}]:[]},minProperties(t,e,s){return Object.keys(e).length<t.minProperties?[{path:s,property:"minProperties",message:this.translate("error_minProperties",[t.minProperties])}]:[]},required(t,e,s){const i=[];return Array.isArray(t.required)&&t.required.forEach(t=>{if(void 0!==e[t])return;const r=this.jsoneditor.getEditor(`${s}.${t}`);r&&["button","info"].includes(r.schema.format||r.schema.type)||i.push({path:s,property:"required",message:this.translate("error_required",[t])})}),i},properties(t,e,s,i){const r=[];return Object.entries(t.properties).forEach(([t,o])=>{i[t]=!0,r.push(...this._validateSchema(o,e[t],`${s}.${t}`))}),r},patternProperties(t,e,s,i){const r=[];return Object.entries(t.patternProperties).forEach(([t,o])=>{const n=new RegExp(t);Object.entries(e).forEach(([t,e])=>{n.test(t)&&(i[t]=!0,r.push(...this._validateSchema(o,e,`${s}.${t}`)))})}),r}},this._validateObjectSubSchema2={additionalProperties(t,e,s,i){const r=[],o=Object.keys(e);for(let n=0;n<o.length;n++){const a=o[n];if(!i[a]){if(!t.additionalProperties){r.push({path:s,property:"additionalProperties",message:this.translate("error_additional_properties",[a])});break}if(!0===t.additionalProperties)break;r.push(...this._validateSchema(t.additionalProperties,e[a],`${s}.${a}`))}}return r},dependencies(t,e,s){const i=[];return Object.entries(t.dependencies).forEach(([t,r])=>{void 0!==e[t]&&(Array.isArray(r)?r.forEach(t=>{void 0===e[t]&&i.push({path:s,property:"dependencies",message:this.translate("error_dependency",[t])})}):i.push(...this._validateSchema(r,e,s)))}),i}}}fitTest(t,e,s=1e7){const i={match:0,extra:0};if("object"==typeof t&&null!==t){const r=this._getSchema(e).properties;for(const e in r)if(u(r,e)){if("object"==typeof t[e]&&"object"==typeof r[e]&&"object"==typeof r[e].properties){const o=this.fitTest(t[e],r[e],s/100);i.match+=o.match,i.extra+=o.extra}void 0!==t[e]&&(i.match+=s)}else i.extra+=s}return i}_getSchema(t){return void 0===t?c({},this.jsoneditor.expandRefs(this.schema)):t}validate(t){return this._validateSchema(this.schema,t)}_validateSchema(t,e,s){const i=[];return s=s||"root",t=c({},this.jsoneditor.expandRefs(t)),void 0===e?this._validateV3Required(t,e,s):(Object.keys(t).forEach(r=>{this._validateSubSchema[r]&&i.push(...this._validateSubSchema[r].call(this,t,e,s))}),i.push(...this._validateByValueType(t,e,s)),t.links&&t.links.forEach((r,o)=>{r.rel&&"describedby"===r.rel.toLowerCase()&&(t=this._expandSchemaLink(t,o),i.push(...this._validateSchema(t,e,s,this.translate)))}),["date","time","datetime-local"].includes(t.format)&&i.push(...this._validateDateTimeSubSchema(t,e,s)),i.push(...this._validateCustomValidator(t,e,s)),this._removeDuplicateErrors(i))}_expandSchemaLink(t,e){const s=t.links[e].href,i=this.jsoneditor.root.getValue(),r=this.jsoneditor.compileTemplate(s,this.jsoneditor.template),o=document.location.origin+document.location.pathname+r(i);return t.links=t.links.slice(0,e).concat(t.links.slice(e+1)),c({},t,this.jsoneditor.refs[o])}_validateV3Required(t,e,s){return void 0!==t.required&&!0===t.required||void 0===t.required&&!0===this.jsoneditor.options.required_by_default?[{path:s,property:"required",message:this.translate("error_notset")}]:[]}_validateByValueType(t,e,s){const i=[];if(null===e)return i;if("number"==typeof e)Object.keys(t).forEach(r=>{this._validateNumberSubSchema[r]&&i.push(...this._validateNumberSubSchema[r].call(this,t,e,s))});else if("string"==typeof e)Object.keys(t).forEach(r=>{this._validateStringSubSchema[r]&&i.push(...this._validateStringSubSchema[r].call(this,t,e,s))});else if(Array.isArray(e))Object.keys(t).forEach(r=>{this._validateArraySubSchema[r]&&i.push(...this._validateArraySubSchema[r].call(this,t,e,s))});else if("object"==typeof e){const r={};Object.keys(t).forEach(o=>{this._validateObjectSubSchema[o]&&i.push(...this._validateObjectSubSchema[o].call(this,t,e,s,r))}),void 0!==t.additionalProperties||!this.jsoneditor.options.no_additional_properties||t.oneOf||t.anyOf||t.allOf||(t.additionalProperties=!1),Object.keys(t).forEach(o=>{void 0!==this._validateObjectSubSchema2[o]&&i.push(...this._validateObjectSubSchema2[o].call(this,t,e,s,r))})}return i}_validateNumberSubSchemaMultipleDivisible(t,e,s){const i=t.multipleOf||t.divisibleBy;let r=e/i===Math.floor(e/i);return window.math?r=window.math.mod(window.math.bignumber(e),window.math.bignumber(i)).equals(0):window.Decimal&&(r=new window.Decimal(e).mod(new window.Decimal(i)).equals(0)),r?[]:[{path:s,property:t.multipleOf?"multipleOf":"divisibleBy",message:this.translate("error_multipleOf",[i])}]}_validateDateTimeSubSchema(t,e,s){const i=(t,e,s)=>1*e<1?[{path:s,property:"format",message:this.translate("error_invalid_epoch")}]:e!==Math.abs(parseInt(e))?[{path:s,property:"format",message:this.translate("error_"+t.format.replace(/-/g,"_"),[a])}]:[],r=(t,e,s,i)=>{if(""!==e){let t;if("single"!==i.flatpickr.config.mode){const e="range"===i.flatpickr.config.mode?i.flatpickr.l10n.rangeSeparator:", ";t=i.flatpickr.selectedDates.map(t=>i.flatpickr.formatDate(t,i.flatpickr.config.dateFormat)).join(e)}try{if(t){if(t!==e)throw new Error(i.flatpickr.config.mode+" mismatch")}else if(i.flatpickr.formatDate(i.flatpickr.parseDate(e,i.flatpickr.config.dateFormat),i.flatpickr.config.dateFormat)!==e)throw new Error("mismatch")}catch(t){const e=void 0!==i.flatpickr.config.errorDateFormat?i.flatpickr.config.errorDateFormat:i.flatpickr.config.dateFormat;return[{path:s,property:"format",message:this.translate("error_"+i.format.replace(/-/g,"_"),[e])}]}}return[]},o={date:/^(\d{4}\D\d{2}\D\d{2})?$/,time:/^(\d{2}:\d{2}(?::\d{2})?)?$/,"datetime-local":/^(\d{4}\D\d{2}\D\d{2}[ T]\d{2}:\d{2}(?::\d{2})?)?$/},n=this.jsoneditor.getEditor(s),a=n&&n.flatpickr?n.flatpickr.config.dateFormat:{date:'"YYYY-MM-DD"',time:'"HH:MM"',"datetime-local":'"YYYY-MM-DD HH:MM"'}[t.format];if("integer"===t.type)return i(t,e,s);if(n&&n.flatpickr){if(n)return r(0,e,s,n)}else if(!o[t.format].test(e))return[{path:s,property:"format",message:this.translate("error_"+t.format.replace(/-/g,"_"),[a])}];return[]}_validateCustomValidator(t,e,s){const i=[];i.push(...l.call(this,t,e,s,this.translate));const r=r=>{i.push(...r.call(this,t,e,s))};return this.defaults.custom_validators.forEach(r),this.options.custom_validators&&this.options.custom_validators.forEach(r),i}_removeDuplicateErrors(t){return t.reduce((t,e)=>{let s=!0;return t||(t=[]),t.forEach(t=>{t.message===e.message&&t.path===e.path&&t.property===e.property&&(t.errorcount++,s=!1)}),s&&(e.errorcount=1,t.push(e)),t},[])}_checkType(t,e){const s={string:t=>"string"==typeof t,number:t=>"number"==typeof t,integer:t=>"number"==typeof t&&t===Math.floor(t),boolean:t=>"boolean"==typeof t,array:t=>Array.isArray(t),object:t=>null!==t&&!Array.isArray(t)&&"object"==typeof t,null:t=>null===t};return"string"==typeof t?!s[t]||s[t](e):!this._validateSchema(t,e).length}}class f{constructor(t){this.options=t||{},this.refs=this.options.refs||{},this.refs_with_info={},this.refs_prefix="#/counter/",this.refs_counter=1,this._subSchema1={type(t){"object"==typeof t.type&&(t.type=this._expandSubSchema(t.type))},disallow(t){"object"==typeof t.disallow&&(t.disallow=this._expandSubSchema(t.disallow))},anyOf(t){Object.entries(t.anyOf).forEach(([e,s])=>{t.anyOf[e]=this.expandSchema(s)})},dependencies(t){Object.entries(t.dependencies).forEach(([e,s])=>{"object"!=typeof s||Array.isArray(s)||(t.dependencies[e]=this.expandSchema(s))})},not(t){t.not=this.expandSchema(t.not)}},this._subSchema2={allOf(t,e){let s=c({},e);return Object.entries(t.allOf).forEach(([e,i])=>{t.allOf[e]=this.expandRefs(i,!0),s=this.extendSchemas(s,this.expandSchema(i))}),delete s.allOf,s},extends(t,e){let s;return s=Array.isArray(t.extends)?t.extends.reduce((t,e,s)=>this.extendSchemas(t,this.expandSchema(e)),e):this.extendSchemas(e,this.expandSchema(t.extends)),delete s.extends,s},oneOf(t,e){const s=c({},e);return delete s.oneOf,t.oneOf.reduce((t,e,i)=>(t.oneOf[i]=this.extendSchemas(this.expandSchema(e),s),t),e),e}}}load(t,e,s,i){this._loadExternalRefs(t,()=>{this._getDefinitions(t,s+"#/definitions/"),e(this.expandRefs(t))},s,this._getFileBase(i))}expandRefs(t,e){const s=c({},t);if(!s.$ref)return s;const i=this.refs_with_info[s.$ref];delete s.$ref;const r=i.$ref.startsWith("#")?i.fetchUrl:"",o=this._getRef(r,i);if(this.refs[o]){if(e&&u(this.refs[o],"allOf")){const t=this.refs[o].allOf;Object.keys(t).forEach(e=>{t[e]=this.expandRefs(t[e],!0)})}}else console.warn(`reference:'${o}' not found!`);return this.extendSchemas(s,this.expandSchema(this.refs[o]))}expandSchema(t,e){Object.entries(this._subSchema1).forEach(([e,s])=>{t[e]&&s.call(this,t)});let s=c({},t);return Object.entries(this._subSchema2).forEach(([e,i])=>{t[e]&&(s=i.call(this,t,s))}),this.expandRefs(s)}_getRef(t,e){const s=t+e;return this.refs[s]?s:t+decodeURIComponent(e.$ref)}_expandSubSchema(t){return Array.isArray(t)?t.map(t=>"object"==typeof value?this.expandSchema(t):t):this.expandSchema(t)}_getDefinitions(t,e){t.definitions&&Object.keys(t.definitions).forEach(s=>{this.refs[e+s]=t.definitions[s],t.definitions[s].definitions&&this._getDefinitions(t.definitions[s],e+s+"/definitions/")})}_getExternalRefs(t,e){const s={},i=t=>Object.keys(t).forEach(t=>{s[t]=!0});if(t.$ref&&"object"!=typeof t.$ref){const i=this.refs_prefix+this.refs_counter++;"#"===t.$ref.substr(0,1)||this.refs[t.$ref]||(s[t.$ref]=!0),this.refs_with_info[i]={fetchUrl:e,$ref:t.$ref},t.$ref=i}return Object.values(t).forEach(t=>{t&&"object"==typeof t&&(Array.isArray(t)?Object.values(t).forEach(t=>{t&&"object"==typeof t&&i(this._getExternalRefs(t,e))}):i(this._getExternalRefs(t,e)))}),s}_getFileBase(t){const{ajaxBase:e}=this.options;return void 0===e?this._getFileBaseFromFileLocation(t):e}_getFileBaseFromFileLocation(t){const e=t.split("/");return e.pop(),e.join("/")+"/"}_isLocalUrl(t,e){return e!==t.substr(0,e.length)&&"http"!==t.substr(0,4)&&"/"!==t.substr(0,1)}_loadExternalRefs(t,e,s,i){const r=this._getExternalRefs(t,s);let o=0,n=0,a=!1;Object.keys(r).forEach(t=>{if(this.refs[t])return;if(!this.options.ajax)throw new Error("Must set ajax option to true to load external ref "+t);this.refs[t]="loading",n++;const s=this._isLocalUrl(t,i)?i+t:t,r=new XMLHttpRequest;r.overrideMimeType("application/json"),r.open("GET",s,!0),this.options.ajaxCredentials&&(r.withCredentials=this.options.ajaxCredentials),r.onreadystatechange=()=>{if(4===r.readyState){if(200!==r.status)throw window.console.log(r),new Error("Failed to fetch ref via ajax- "+t);{let i;try{i=JSON.parse(r.responseText)}catch(t){throw window.console.log(t),new Error("Failed to parse external ref "+s)}if("boolean"!=typeof i&&"object"!=typeof i||null===i||Array.isArray(i))throw new Error("External ref does not contain a valid schema - "+s);this.refs[t]=i;const l=this._getFileBaseFromFileLocation(s);this._getDefinitions(i,s+"#/definitions/"),this._loadExternalRefs(i,()=>{o++,o>=n&&!a&&(a=!0,e())},s,l)}}},r.send()}),n||e()}extendSchemas(t,e){t=c({},t),e=c({},e);const s={},i=(t,i)=>{((t,e)=>("required"===t||"defaultProperties"===t)&&"object"==typeof e&&Array.isArray(e))(t,i)?s[t]=i.concat(e[t]).reduce((t,e)=>(t.includes(e)||t.push(e),t),[]):"type"!==t||"string"!=typeof i&&!Array.isArray(i)?"object"!=typeof i||Array.isArray(i)||null===i?s[t]=i:s[t]=this.extendSchemas(i,e[t]):r(i)},r=t=>{"string"==typeof t&&(t=[t]),"string"==typeof e.type&&(e.type=[e.type]),e.type&&e.type.length?s.type=t.filter(t=>e.type.includes(t)):s.type=t,1===s.type.length&&"string"==typeof s.type[0]?s.type=s.type[0]:0===s.type.length&&delete s.type};return Object.entries(t).forEach(([t,r])=>{void 0!==e[t]?i(t,r):s[t]=r}),Object.entries(e).forEach(([e,i])=>{void 0===t[e]&&(s[e]=i)}),s}}class _{constructor(t,e){this.defaults=e,this.jsoneditor=t.jsoneditor,this.theme=this.jsoneditor.theme,this.template_engine=this.jsoneditor.template,this.iconlib=this.jsoneditor.iconlib,this.translate=this.jsoneditor.translate||this.defaults.translate,this.original_schema=t.schema,this.schema=this.jsoneditor.expandSchema(this.original_schema),this.active=!0,this.options=c({},this.options||{},this.schema.options||{},t.schema.options||{},t),t.path||this.schema.id||(this.schema.id="root"),this.path=t.path||"root",this.formname=t.formname||this.path.replace(/\.([^.]+)/g,"[$1]"),this.jsoneditor.options.form_name_root&&(this.formname=this.formname.replace(/^root\[/,this.jsoneditor.options.form_name_root+"[")),this.parent=t.parent,this.key=void 0!==this.parent?this.path.split(".").slice(this.parent.path.split(".").length).join("."):this.path,this.link_watchers=[],this.watchLoop=!1,t.container&&this.setContainer(t.container),this.registerDependencies()}onChildEditorChange(t){this.onChange(!0)}notify(){this.path&&this.jsoneditor.notifyWatchers(this.path)}change(){this.parent?this.parent.onChildEditorChange(this):this.jsoneditor&&this.jsoneditor.onChange()}onChange(t){this.notify(),this.watch_listener&&this.watch_listener(),t&&this.change()}register(){this.jsoneditor.registerEditor(this),this.onChange()}unregister(){this.jsoneditor&&this.jsoneditor.unregisterEditor(this)}getNumColumns(){return 12}isActive(){return this.active}activate(){this.active=!0,this.optInCheckbox.checked=!0,this.enable(),this.change()}deactivate(){this.isRequired()||(this.active=!1,this.optInCheckbox.checked=!1,this.disable(),this.change())}registerDependencies(){this.dependenciesFulfilled=!0;const t=this.options.dependencies;t&&Object.keys(t).forEach(e=>{let s=this.path.split(".");s[s.length-1]=e,s=s.join(".");const i=t[e];this.jsoneditor.watch(s,()=>{this.checkDependency(s,i)})})}checkDependency(t,e){const s=this.container||this.control;if(this.path===t||!s||null===this.jsoneditor)return;const i=this.jsoneditor.getEditor(t),r=i?i.getValue():void 0,o=this.dependenciesFulfilled;this.dependenciesFulfilled=!1,i&&i.dependenciesFulfilled?Array.isArray(e)?e.some(t=>{if(r===t)return this.dependenciesFulfilled=!0,!0}):"object"==typeof e?"object"!=typeof r?this.dependenciesFulfilled=e===r:Object.keys(e).some(t=>!!u(e,t)&&(u(r,t)&&e[t]===r[t]?void(this.dependenciesFulfilled=!0):(this.dependenciesFulfilled=!1,!0))):"string"==typeof e||"number"==typeof e?this.dependenciesFulfilled=r===e:"boolean"==typeof e&&(this.dependenciesFulfilled=e?r||r.length>0:!r||0===r.length):this.dependenciesFulfilled=!1,this.dependenciesFulfilled!==o&&this.notify();const n=this.dependenciesFulfilled?"block":"none";"TD"===s.tagName?Object.keys(s.childNodes).forEach(t=>s.childNodes[t].style.display=n):s.style.display=n}setContainer(t){this.container=t,this.schema.id&&this.container.setAttribute("data-schemaid",this.schema.id),this.schema.type&&"string"==typeof this.schema.type&&this.container.setAttribute("data-schematype",this.schema.type),this.container.setAttribute("data-schemapath",this.path)}setOptInCheckbox(t){this.optInCheckbox=document.createElement("input"),this.optInCheckbox.setAttribute("type","checkbox"),this.optInCheckbox.setAttribute("style","margin: 0 10px 0 0;"),this.optInCheckbox.classList.add("json-editor-opt-in"),this.optInCheckbox.addEventListener("click",()=>{this.isActive()?this.deactivate():this.activate()}),(this.jsoneditor.options.show_opt_in||this.options.show_opt_in)&&this.parent&&"object"===this.parent.schema.type&&!this.isRequired()&&this.header&&(this.header.appendChild(this.optInCheckbox),this.header.insertBefore(this.optInCheckbox,this.header.firstChild))}preBuild(){}build(){}postBuild(){this.setupWatchListeners(),this.addLinks(),this.setValue(this.getDefault(),!0),this.updateHeaderText(),this.register(),this.onWatchedFieldChange()}setupWatchListeners(){if(this.watched={},this.schema.vars&&(this.schema.watch=this.schema.vars),this.watched_values={},this.watch_listener=()=>{this.refreshWatchedFieldValues()&&this.onWatchedFieldChange()},u(this.schema,"watch")){let t,e,s,i,r;const o=this.container.getAttribute("data-schemapath");Object.keys(this.schema.watch).forEach(n=>{if(t=this.schema.watch[n],Array.isArray(t)){if(t.length<2)return;e=[t[0]].concat(t[1].split("."))}else e=t.split("."),this.theme.closest(this.container,`[data-schemaid="${e[0]}"]`)||e.unshift("#");if(s=e.shift(),"#"===s&&(s=this.jsoneditor.schema.id||"root"),i=this.theme.closest(this.container,`[data-schemaid="${s}"]`),!i)throw new Error("Could not find ancestor node with id "+s);r=`${i.getAttribute("data-schemapath")}.${e.join(".")}`,o.startsWith(r)&&(this.watchLoop=!0),this.jsoneditor.watch(r,this.watch_listener),this.watched[n]=r})}this.schema.headerTemplate&&(this.header_template=this.jsoneditor.compileTemplate(this.schema.headerTemplate,this.template_engine))}addLinks(){if(!this.no_link_holder&&(this.link_holder=this.theme.getLinksHolder(),void 0!==this.description?this.description.parentNode.insertBefore(this.link_holder,this.description):this.container.appendChild(this.link_holder),this.schema.links))for(let t=0;t<this.schema.links.length;t++)this.addLink(this.getLink(this.schema.links[t]))}onMove(){}getButton(t,e,s){const i="json-editor-btn-"+e;!(e=this.iconlib?this.iconlib.getIcon(e):null)&&s&&(t=s,s=null);const r=this.theme.getButton(t,e,s);return r.classList.add(i),r}setButtonText(t,e,s,i){return!(s=this.iconlib?this.iconlib.getIcon(s):null)&&i&&(e=i,i=null),this.theme.setButtonText(t,e,s,i)}addLink(t){this.link_holder&&this.link_holder.appendChild(t)}getLink(t){let e,s;const i=(t.mediaType||"application/javascript").split("/")[0],r=this.jsoneditor.compileTemplate(t.href,this.template_engine),o=this.jsoneditor.compileTemplate(t.rel?t.rel:t.href,this.template_engine);let n=null;if(t.download&&(n=t.download),n&&!0!==n&&(n=this.jsoneditor.compileTemplate(n,this.template_engine)),"image"===i){e=this.theme.getBlockLinkHolder(),s=document.createElement("a"),s.setAttribute("target","_blank");const t=document.createElement("img");this.theme.createImageLink(e,s,t),this.link_watchers.push(e=>{const i=r(e),n=o(e);s.setAttribute("href",i),s.setAttribute("title",n||i),t.setAttribute("src",i)})}else if(["audio","video"].includes(i)){e=this.theme.getBlockLinkHolder(),s=this.theme.getBlockLink(),s.setAttribute("target","_blank");const t=document.createElement(i);t.setAttribute("controls","controls"),this.theme.createMediaLink(e,s,t),this.link_watchers.push(e=>{const i=r(e),n=o(e);s.setAttribute("href",i),s.textContent=n||i,t.setAttribute("src",i)})}else s=e=this.theme.getBlockLink(),e.setAttribute("target","_blank"),e.textContent=t.rel,e.style.display="none",this.link_watchers.push(t=>{const s=r(t),i=o(t);s&&(e.style.display=""),e.setAttribute("href",s),e.textContent=i||s});return n&&s&&(!0===n?s.setAttribute("download",""):this.link_watchers.push(t=>{s.setAttribute("download",n(t))})),t.class&&s.classList.add(t.class),e}refreshWatchedFieldValues(){if(!this.watched_values)return;const t={};let e=!1;return this.watched&&Object.keys(this.watched).forEach(s=>{const i=this.jsoneditor.getEditor(this.watched[s]),r=i?i.getValue():null;this.watched_values[s]!==r&&(e=!0),t[s]=r}),t.self=this.getValue(),this.watched_values.self!==t.self&&(e=!0),this.watched_values=t,e}getWatchedFieldValues(){return this.watched_values}updateHeaderText(){if(this.header){const t=this.getHeaderText();if(this.header.children.length){for(let e=0;e<this.header.childNodes.length;e++)if(3===this.header.childNodes[e].nodeType){this.header.childNodes[e].nodeValue=this.cleanText(t);break}}else window.DOMPurify?this.header.innerHTML=window.DOMPurify.sanitize(t):this.header.textContent=this.cleanText(t)}}getHeaderText(t){return this.header_text?this.header_text:t?this.schema.title:this.getTitle()}cleanText(t){const e=document.createElement("div");return e.innerHTML=t,e.textContent||e.innerText}onWatchedFieldChange(){let t;if(this.header_template){t=c(this.getWatchedFieldValues(),{key:this.key,i:this.key,i0:1*this.key,i1:1*this.key+1,title:this.getTitle()});const e=this.header_template(t);e!==this.header_text&&(this.header_text=e,this.updateHeaderText(),this.notify())}if(this.link_watchers.length){t=this.getWatchedFieldValues();for(let e=0;e<this.link_watchers.length;e++)this.link_watchers[e](t)}}setValue(t){this.value=t}getValue(){if(this.dependenciesFulfilled)return this.value}refreshValue(){}getChildEditors(){return!1}destroy(){this.unregister(this),this.watched&&Object.values(this.watched).forEach(t=>this.jsoneditor.unwatch(t,this.watch_listener)),this.watched=null,this.watched_values=null,this.watch_listener=null,this.header_text=null,this.header_template=null,this.value=null,this.container&&this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container=null,this.jsoneditor=null,this.schema=null,this.path=null,this.key=null,this.parent=null}isDefaultRequired(){return this.isRequired()||!!this.jsoneditor.options.use_default_values}getDefault(){if(void 0!==this.schema.default)return this.schema.default;if(void 0!==this.schema.enum)return this.schema.enum[0];let t=this.schema.type||this.schema.oneOf;if(t&&Array.isArray(t)&&(t=t[0]),t&&"object"==typeof t&&(t=t.type),t&&Array.isArray(t)&&(t=t[0]),"string"==typeof t){if("number"===t)return this.isDefaultRequired()?0:void 0;if("boolean"===t)return!this.isDefaultRequired()&&void 0;if("integer"===t)return this.isDefaultRequired()?0:void 0;if("string"===t)return"";if("object"===t)return{};if("array"===t)return[]}return null}getTitle(){return this.schema.title||this.key}enable(){this.disabled=!1}disable(){this.disabled=!0}isEnabled(){return!this.disabled}isRequired(){return"boolean"==typeof this.schema.required?this.schema.required:this.parent&&this.parent.schema&&Array.isArray(this.parent.schema.required)?this.parent.schema.required.includes(this.key):!!this.jsoneditor.options.required_by_default}getDisplayText(t){const e=[],s={};t.forEach(t=>{t.title&&(s[t.title]=s[t.title]||0,s[t.title]++),t.description&&(s[t.description]=s[t.description]||0,s[t.description]++),t.format&&(s[t.format]=s[t.format]||0,s[t.format]++),t.type&&(s[t.type]=s[t.type]||0,s[t.type]++)}),t.forEach(t=>{let i;i="string"==typeof t?t:t.title&&s[t.title]<=1?t.title:t.format&&s[t.format]<=1?t.format:t.type&&s[t.type]<=1?t.type:t.description&&s[t.description]<=1?t.descripton:t.title?t.title:t.format?t.format:t.type?t.type:t.description?t.description:JSON.stringify(t).length<500?JSON.stringify(t):"type",e.push(i)});const i={};return e.forEach((t,r)=>{i[t]=i[t]||0,i[t]++,s[t]>1&&(e[r]=`${t} ${i[t]}`)}),e}getValidId(t){return(t=void 0===t?"":t.toString()).replace(/\s+/g,"-")}setInputAttributes(t){if(this.schema.options&&this.schema.options.inputAttributes){const e=this.schema.options.inputAttributes,s=["name","type"].concat(t);Object.keys(e).forEach(t=>{s.includes(t.toLowerCase())||this.input.setAttribute(t,e[t])})}}expandCallbacks(t,e){const s=this.defaults.callbacks[t];return Object.entries(e).forEach(([i,r])=>{r===Object(r)?e[i]=this.expandCallbacks(t,r):"string"==typeof r&&"object"==typeof s&&"function"==typeof s[r]&&(e[i]=s[r].bind(null,this))}),e}showValidationErrors(t){}}class y extends _{register(){super.register(),this.input&&this.input.setAttribute("name",this.formname)}unregister(){super.unregister(),this.input&&this.input.removeAttribute("name")}setValue(t,e,s){if(this.template&&!s)return;if(null==t?t="":"object"==typeof t?t=JSON.stringify(t):"string"!=typeof t&&(t=""+t),t===this.serialized)return;const i=this.sanitize(t);if(this.input.value===i)return;if(this.input.value=i,"range"===this.format){const t=this.control.querySelector("output");t&&(t.value=i)}const r=s||this.getValue()!==t;return this.refreshValue(),e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0),this.adjust_height&&this.adjust_height(this.input),this.onChange(r),{changed:r,value:i}}getNumColumns(){const t=Math.ceil(Math.max(this.getTitle().length,this.schema.maxLength||0,this.schema.minLength||0)/5);let e;return e="textarea"===this.input_type?6:["text","email"].includes(this.input_type)?4:2,Math.min(12,Math.max(t,e))}build(){if(this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.format=this.schema.format,!this.format&&this.schema.media&&this.schema.media.type&&(this.format=this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g,"")),!this.format&&this.options.default_format&&(this.format=this.options.default_format),this.options.format&&(this.format=this.options.format),this.format)if("textarea"===this.format)this.input_type="textarea",this.input=this.theme.getTextareaInput();else if("range"===this.format){this.input_type="range";let t=this.schema.minimum||0,e=this.schema.maximum||Math.max(100,t+1),s=1;this.schema.multipleOf&&(t%this.schema.multipleOf&&(t=Math.ceil(t/this.schema.multipleOf)*this.schema.multipleOf),e%this.schema.multipleOf&&(e=Math.floor(e/this.schema.multipleOf)*this.schema.multipleOf),s=this.schema.multipleOf),this.input=this.theme.getRangeInput(t,e,s)}else this.input_type="text",["button","checkbox","color","date","datetime-local","email","file","hidden","image","month","number","password","radio","reset","search","submit","tel","text","time","url","week"].includes(this.format)&&(this.input_type=this.format),this.input=this.theme.getFormInputField(this.input_type);else this.input_type="text",this.input=this.theme.getFormInputField(this.input_type);void 0!==this.schema.maxLength&&this.input.setAttribute("maxlength",this.schema.maxLength),void 0!==this.schema.pattern?this.input.setAttribute("pattern",this.schema.pattern):void 0!==this.schema.minLength&&this.input.setAttribute("pattern",`.{${this.schema.minLength},}`),this.options.compact?this.container.classList.add("compact"):this.options.input_width&&(this.input.style.width=this.options.input_width),(this.schema.readOnly||this.schema.readonly||this.schema.template)&&(this.always_disabled=!0,this.input.setAttribute("readonly","true")),this.setInputAttributes(["maxlength","pattern","readonly","min","max","step"]),this.input.addEventListener("change",t=>{if(t.preventDefault(),t.stopPropagation(),this.schema.template)return void(t.currentTarget.value=this.value);const e=t.currentTarget.value,s=this.sanitize(e);e!==s&&(t.currentTarget.value=s),this.is_dirty=!0,this.refreshValue(),this.onChange(!0)}),this.options.input_height&&(this.input.style.height=this.options.input_height),this.options.expand_height&&(this.adjust_height=t=>{if(!t)return;let e,s=t.offsetHeight;if(t.offsetHeight<t.scrollHeight)for(e=0;t.offsetHeight<t.scrollHeight+3&&!(e>100);)e++,s++,t.style.height=s+"px";else{for(e=0;t.offsetHeight>=t.scrollHeight+3&&!(e>100);)e++,s--,t.style.height=s+"px";t.style.height=s+1+"px"}},this.input.addEventListener("keyup",t=>{this.adjust_height(t.currentTarget)}),this.input.addEventListener("change",t=>{this.adjust_height(t.currentTarget)}),this.adjust_height()),this.format&&this.input.setAttribute("data-schemaformat",this.format);let{input:t}=this;if("range"===this.format&&(t=this.theme.getRangeControl(this.input,this.theme.getRangeOutput(this.input,this.schema.default||Math.max(this.schema.minimum||0,0)))),this.control=this.theme.getFormControl(this.label,t,this.description,this.infoButton),this.container.appendChild(this.control),window.requestAnimationFrame(()=>{this.input.parentNode&&this.afterInputReady(),this.adjust_height&&this.adjust_height(this.input)}),this.schema.template){const t=this.expandCallbacks("template",{template:this.schema.template});"function"==typeof t.template?this.template=t.template:this.template=this.jsoneditor.compileTemplate(this.schema.template,this.template_engine),this.refreshValue()}else this.refreshValue()}setupCleave(t){const e=this.expandCallbacks("cleave",c({},this.defaults.options.cleave||{},this.options.cleave||{}));"object"==typeof e&&Object.keys(e).length>0&&(this.cleave_instance=new window.Cleave(t,e))}setupImask(t){const e=this.expandCallbacks("imask",c({},this.defaults.options.imask||{},this.options.imask||{}));"object"==typeof e&&Object.keys(e).length>0&&(this.imask_instance=window.IMask(t,this.ajustIMaskOptions(e)))}ajustIMaskOptions(t){return Object.keys(t).forEach(e=>{if(t[e]===Object(t[e]))t[e]=this.ajustIMaskOptions(t[e]);else if("mask"===e)if("regex:"===t[e].substr(0,6)){const s=t[e].match(/^regex:\/(.*)\/([gimsuy]*)$/);if(null!==s)try{t[e]=new RegExp(s[1],s[2])}catch(t){}}else t[e]=this.getGlobalPropertyFromString(t[e])}),t}getGlobalPropertyFromString(t){if(t.includes(".")){const e=t.split("."),s=e[0],i=e[1];if(void 0!==window[s]&&void 0!==window[s][i])return window[s][i]}else if(void 0!==window[t])return window[t];return t}getValue(){return this.imask_instance&&this.dependenciesFulfilled&&this.options.imask.returnUnmasked?this.imask_instance.unmaskedValue:super.getValue()}enable(){this.always_disabled||(this.input.disabled=!1,super.enable())}disable(t){t&&(this.always_disabled=!0),this.input.disabled=!0,super.disable()}afterInputReady(){this.theme.afterInputReady(this.input),window.Cleave&&!this.cleave_instance?this.setupCleave(this.input):window.IMask&&!this.imask_instance&&this.setupImask(this.input)}refreshValue(){this.value=this.input.value,"string"!=typeof this.value&&(this.value=""),this.serialized=this.value}destroy(){this.cleave_instance&&this.cleave_instance.destroy(),this.imask_instance&&this.imask_instance.destroy(),this.template=null,this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),super.destroy()}sanitize(t){return t}onWatchedFieldChange(){let t;this.template&&(t=this.getWatchedFieldValues(),this.setValue(this.template(t),!1,!0)),super.onWatchedFieldChange()}showValidationErrors(t){if("always"===this.jsoneditor.options.show_errors);else if(!this.is_dirty&&this.previous_error_setting===this.jsoneditor.options.show_errors)return;this.previous_error_setting=this.jsoneditor.options.show_errors;const e=t.reduce((t,e)=>(e.path===this.path&&t.push(e.message),t),[]);e.length?this.theme.addInputError(this.input,e.join(". ")+"."):this.theme.removeInputError(this.input)}}class w extends _{askConfirmation(){return!0!==this.jsoneditor.options.prompt_before_delete||!1!==window.confirm(this.translate("button_delete_node_warning"))}getDefault(){return this.schema.default||[]}register(){if(super.register(),this.rows)for(let t=0;t<this.rows.length;t++)this.rows[t].register()}unregister(){if(super.unregister(),this.rows)for(let t=0;t<this.rows.length;t++)this.rows[t].unregister()}getNumColumns(){const t=this.getItemInfo(0);return this.tabs_holder&&"tabs-top"!==this.schema.format?Math.max(Math.min(12,t.width+2),4):t.width}enable(){if(!this.always_disabled){if(this.add_row_button&&(this.add_row_button.disabled=!1),this.remove_all_rows_button&&(this.remove_all_rows_button.disabled=!1),this.delete_last_row_button&&(this.delete_last_row_button.disabled=!1),this.copy_button&&(this.copy_button.disabled=!1),this.delete_button&&(this.delete_button.disabled=!1),this.moveup_button&&(this.moveup_button.disabled=!1),this.movedown_button&&(this.movedown_button.disabled=!1),this.rows)for(let t=0;t<this.rows.length;t++)this.rows[t].enable(),this.rows[t].add_row_button&&(this.rows[t].add_row_button.disabled=!1),this.rows[t].remove_all_rows_button&&(this.rows[t].remove_all_rows_button.disabled=!1),this.rows[t].delete_last_row_button&&(this.rows[t].delete_last_row_button.disabled=!1),this.rows[t].copy_button&&(this.rows[t].copy_button.disabled=!1),this.rows[t].delete_button&&(this.rows[t].delete_button.disabled=!1),this.rows[t].moveup_button&&(this.rows[t].moveup_button.disabled=!1),this.rows[t].movedown_button&&(this.rows[t].movedown_button.disabled=!1);super.enable()}}disable(t){if(t&&(this.always_disabled=!0),this.add_row_button&&(this.add_row_button.disabled=!0),this.remove_all_rows_button&&(this.remove_all_rows_button.disabled=!0),this.delete_last_row_button&&(this.delete_last_row_button.disabled=!0),this.copy_button&&(this.copy_button.disabled=!0),this.delete_button&&(this.delete_button.disabled=!0),this.moveup_button&&(this.moveup_button.disabled=!0),this.movedown_button&&(this.movedown_button.disabled=!0),this.rows)for(let e=0;e<this.rows.length;e++)this.rows[e].disable(t),this.rows[e].add_row_button&&(this.rows[e].add_row_button.disabled=!0),this.rows[e].remove_all_rows_button&&(this.rows[e].remove_all_rows_button.disabled=!0),this.rows[e].delete_last_row_button&&(this.rows[e].delete_last_row_button.disabled=!0),this.rows[e].copy_button&&(this.rows[e].copy_button.disabled=!0),this.rows[e].delete_button&&(this.rows[e].delete_button.disabled=!0),this.rows[e].moveup_button&&(this.rows[e].moveup_button.disabled=!0),this.rows[e].movedown_button&&(this.rows[e].movedown_button.disabled=!0);super.disable()}preBuild(){super.preBuild(),this.rows=[],this.row_cache=[],this.hide_delete_buttons=this.options.disable_array_delete||this.jsoneditor.options.disable_array_delete,this.hide_delete_all_rows_buttons=this.hide_delete_buttons||this.options.disable_array_delete_all_rows||this.jsoneditor.options.disable_array_delete_all_rows,this.hide_delete_last_row_buttons=this.hide_delete_buttons||this.options.disable_array_delete_last_row||this.jsoneditor.options.disable_array_delete_last_row,this.hide_move_buttons=this.options.disable_array_reorder||this.jsoneditor.options.disable_array_reorder,this.hide_add_button=this.options.disable_array_add||this.jsoneditor.options.disable_array_add,this.show_copy_button=this.options.enable_array_copy||this.jsoneditor.options.enable_array_copy,this.array_controls_top=this.options.array_controls_top||this.jsoneditor.options.array_controls_top}build(){this.options.compact?(this.title=this.theme.getHeader(""),this.container.appendChild(this.title),this.panel=this.theme.getIndentedPanel(),this.container.appendChild(this.panel),this.title_controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.title_controls),this.controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.controls),this.row_holder=document.createElement("div"),this.panel.appendChild(this.row_holder)):(this.header=document.createElement("label"),this.header.textContent=this.getTitle(),this.title=this.theme.getHeader(this.header),this.container.appendChild(this.title),this.title_controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.title_controls),this.schema.description&&(this.description=this.theme.getDescription(this.schema.description),this.container.appendChild(this.description)),this.error_holder=document.createElement("div"),this.container.appendChild(this.error_holder),"tabs-top"===this.schema.format?(this.controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.controls),this.tabs_holder=this.theme.getTopTabHolder(this.getValidId(this.getItemTitle())),this.container.appendChild(this.tabs_holder),this.row_holder=this.theme.getTopTabContentHolder(this.tabs_holder),this.active_tab=null):"tabs"===this.schema.format?(this.controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.controls),this.tabs_holder=this.theme.getTabHolder(this.getValidId(this.getItemTitle())),this.container.appendChild(this.tabs_holder),this.row_holder=this.theme.getTabContentHolder(this.tabs_holder),this.active_tab=null):(this.panel=this.theme.getIndentedPanel(),this.container.appendChild(this.panel),this.row_holder=document.createElement("div"),this.panel.appendChild(this.row_holder),this.controls=this.theme.getButtonHolder(),this.array_controls_top?this.title.appendChild(this.controls):this.panel.appendChild(this.controls))),this.addControls()}onChildEditorChange(t){this.refreshValue(),this.refreshTabs(!0),super.onChildEditorChange(t)}getItemTitle(){if(!this.item_title)if(this.schema.items&&!Array.isArray(this.schema.items)){const t=this.jsoneditor.expandRefs(this.schema.items);this.item_title=t.title||this.translate("default_array_item_title")}else this.item_title=this.translate("default_array_item_title");return this.cleanText(this.item_title)}getItemSchema(t){return Array.isArray(this.schema.items)?t>=this.schema.items.length?!0===this.schema.additionalItems?{}:this.schema.additionalItems?c({},this.schema.additionalItems):void 0:c({},this.schema.items[t]):this.schema.items?c({},this.schema.items):{}}getItemInfo(t){let e=this.getItemSchema(t);this.item_info=this.item_info||{};const s=JSON.stringify(e);return void 0!==this.item_info[s]||(e=this.jsoneditor.expandRefs(e),this.item_info[s]={title:e.title||this.translate("default_array_item_title"),default:e.default,width:12,child_editors:e.properties||e.items}),this.item_info[s]}getElementEditor(t){const e=this.getItemInfo(t);let s=this.getItemSchema(t);s=this.jsoneditor.expandRefs(s),s.title=`${e.title} ${t+1}`;const i=this.jsoneditor.getEditorClass(s);let r;this.tabs_holder?(r="tabs-top"===this.schema.format?this.theme.getTopTabContent():this.theme.getTabContent(),r.id=`${this.path}.${t}`):r=e.child_editors?this.theme.getChildEditorHolder():this.theme.getIndentedPanel(),this.row_holder.appendChild(r);const o=this.jsoneditor.createEditor(i,{jsoneditor:this.jsoneditor,schema:s,container:r,path:`${this.path}.${t}`,parent:this,required:!0});return o.preBuild(),o.build(),o.postBuild(),o.title_controls||(o.array_controls=this.theme.getButtonHolder(),r.appendChild(o.array_controls)),o}destroy(){this.empty(!0),this.title&&this.title.parentNode&&this.title.parentNode.removeChild(this.title),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),this.row_holder&&this.row_holder.parentNode&&this.row_holder.parentNode.removeChild(this.row_holder),this.controls&&this.controls.parentNode&&this.controls.parentNode.removeChild(this.controls),this.panel&&this.panel.parentNode&&this.panel.parentNode.removeChild(this.panel),this.rows=this.row_cache=this.title=this.description=this.row_holder=this.panel=this.controls=null,super.destroy()}empty(t){this.rows&&(this.rows.forEach((e,s)=>{t&&(e.tab&&e.tab.parentNode&&e.tab.parentNode.removeChild(e.tab),this.destroyRow(e,!0),this.row_cache[s]=null),this.rows[s]=null}),this.rows=[],t&&(this.row_cache=[]))}destroyRow(t,e){const s=t.container;e?(t.destroy(),s.parentNode&&s.parentNode.removeChild(s),t.tab&&t.tab.parentNode&&t.tab.parentNode.removeChild(t.tab)):(t.tab&&(t.tab.style.display="none"),s.style.display="none",t.unregister())}getMax(){return Array.isArray(this.schema.items)&&!1===this.schema.additionalItems?Math.min(this.schema.items.length,this.schema.maxItems||1/0):this.schema.maxItems||1/0}refreshTabs(t){this.rows.forEach(e=>{e.tab&&(t?e.tab_text.textContent=e.getHeaderText():e.tab===this.active_tab?this.theme.markTabActive(e):this.theme.markTabInactive(e))})}setValue(t=[],e){if(Array.isArray(t)||(t=[t]),JSON.stringify(t)===this.serialized)return;if(this.schema.minItems)for(;t.length<this.schema.minItems;)t.push(this.getItemInfo(t.length).default);this.getMax()&&t.length>this.getMax()&&(t=t.slice(0,this.getMax())),t.forEach((t,s)=>{if(this.rows[s])this.rows[s].setValue(t,e);else if(this.row_cache[s])this.rows[s]=this.row_cache[s],this.rows[s].setValue(t,e),this.rows[s].container.style.display="",this.rows[s].tab&&(this.rows[s].tab.style.display=""),this.rows[s].register(),this.jsoneditor.trigger("addRow",this.rows[s]);else{const s=this.addRow(t,e);this.jsoneditor.trigger("addRow",s)}});for(let e=t.length;e<this.rows.length;e++)this.destroyRow(this.rows[e]),this.rows[e]=null;this.rows=this.rows.slice(0,t.length);const s=this.rows.find(t=>t.tab===this.active_tab);let i=void 0!==s?s.tab:null;!i&&this.rows.length&&(i=this.rows[0].tab),this.active_tab=i,this.refreshValue(e),this.refreshTabs(!0),this.refreshTabs(),this.onChange()}refreshValue(t){const e=this.value?this.value.length:0;if(this.value=this.rows.map(t=>t.getValue()),e!==this.value.length||t){const t=this.schema.minItems&&this.schema.minItems>=this.rows.length;this.rows.forEach((e,s)=>{e.movedown_button&&(s===this.rows.length-1?e.movedown_button.style.display="none":e.movedown_button.style.display=""),e.delete_button&&(e.delete_button.style.display=t?"none":""),this.value[s]=e.getValue()});let e=!1;this.value.length?1===this.value.length?(this.remove_all_rows_button.style.display="none",t||this.hide_delete_last_row_buttons?this.delete_last_row_button.style.display="none":(this.delete_last_row_button.style.display="",e=!0)):(t||this.hide_delete_last_row_buttons?this.delete_last_row_button.style.display="none":(this.delete_last_row_button.style.display="",e=!0),t||this.hide_delete_all_rows_buttons?this.remove_all_rows_button.style.display="none":(this.remove_all_rows_button.style.display="",e=!0)):(this.delete_last_row_button.style.display="none",this.remove_all_rows_button.style.display="none"),this.getMax()&&this.getMax()<=this.rows.length||this.hide_add_button?this.add_row_button.style.display="none":(this.add_row_button.style.display="",e=!0),!this.collapsed&&e?this.controls.style.display="inline-block":this.controls.style.display="none"}}addRow(t,e){const s=this.rows.length;this.rows[s]=this.getElementEditor(s),this.row_cache[s]=this.rows[s],this.tabs_holder&&(this.rows[s].tab_text=document.createElement("span"),this.rows[s].tab_text.textContent=this.rows[s].getHeaderText(),"tabs-top"===this.schema.format?(this.rows[s].tab=this.theme.getTopTab(this.rows[s].tab_text,this.getValidId(this.rows[s].path)),this.theme.addTopTab(this.tabs_holder,this.rows[s].tab)):(this.rows[s].tab=this.theme.getTab(this.rows[s].tab_text,this.getValidId(this.rows[s].path)),this.theme.addTab(this.tabs_holder,this.rows[s].tab)),this.rows[s].tab.addEventListener("click",t=>{this.active_tab=this.rows[s].tab,this.refreshTabs(),t.preventDefault(),t.stopPropagation()}));const i=this.rows[s].title_controls||this.rows[s].array_controls;return this.hide_delete_buttons||(this.rows[s].delete_button=this.getButton(this.getItemTitle(),"delete",this.translate("button_delete_row_title",[this.getItemTitle()])),this.rows[s].delete_button.classList.add("delete","json-editor-btntype-delete"),this.rows[s].delete_button.setAttribute("data-i",s),this.rows[s].delete_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue().filter((t,s)=>s!==e);let i=null;const r=this.rows[e];this.setValue(s),this.rows[e]?i=this.rows[e].tab:this.rows[e-1]&&(i=this.rows[e-1].tab),i&&(this.active_tab=i,this.refreshTabs()),this.onChange(!0),this.jsoneditor.trigger("deleteRow",r)}),i&&i.appendChild(this.rows[s].delete_button)),this.show_copy_button&&(this.rows[s].copy_button=this.getButton(this.getItemTitle(),"copy","Copy "+this.getItemTitle()),this.rows[s].copy_button.classList.add("copy","json-editor-btntype-copy"),this.rows[s].copy_button.setAttribute("data-i",s),this.rows[s].copy_button.addEventListener("click",t=>{const e=this.getValue();t.preventDefault(),t.stopPropagation();const s=1*t.currentTarget.getAttribute("data-i");e.forEach((t,i)=>{i===s&&e.push(t)}),this.setValue(e),this.refreshValue(!0),this.onChange(!0)}),i.appendChild(this.rows[s].copy_button)),s&&!this.hide_move_buttons&&(this.rows[s].moveup_button=this.getButton("","tabs-top"===this.schema.format?"moveleft":"moveup",this.translate("button_move_up_title")),this.rows[s].moveup_button.classList.add("moveup","json-editor-btntype-move"),this.rows[s].moveup_button.setAttribute("data-i",s),this.rows[s].moveup_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=1*t.currentTarget.getAttribute("data-i");if(e<=0)return;const s=this.getValue(),i=s[e-1];s[e-1]=s[e],s[e]=i,this.setValue(s),this.active_tab=this.rows[e-1].tab,this.refreshTabs(),this.onChange(!0),this.jsoneditor.trigger("moveRow",this.rows[e-1])}),i&&i.appendChild(this.rows[s].moveup_button)),this.hide_move_buttons||(this.rows[s].movedown_button=this.getButton("","tabs-top"===this.schema.format?"moveright":"movedown",this.translate("button_move_down_title")),this.rows[s].movedown_button.classList.add("movedown","json-editor-btntype-move"),this.rows[s].movedown_button.setAttribute("data-i",s),this.rows[s].movedown_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue();if(e>=s.length-1)return;const i=s[e+1];s[e+1]=s[e],s[e]=i,this.setValue(s),this.active_tab=this.rows[e+1].tab,this.refreshTabs(),this.onChange(!0),this.jsoneditor.trigger("moveRow",this.rows[e+1])}),i&&i.appendChild(this.rows[s].movedown_button)),t&&this.rows[s].setValue(t,e),this.refreshTabs(),this.rows[s]}addControls(){this.collapsed=!1,this.toggle_button=this.getButton("","collapse",this.translate("button_collapse")),this.toggle_button.classList.add("json-editor-btntype-toggle"),this.toggle_button.style.margin="0 10px 0 0",this.title.insertBefore(this.toggle_button,this.title.childNodes[0]);const t=this.row_holder.style.display,e=this.controls.style.display;this.toggle_button.addEventListener("click",s=>{s.preventDefault(),s.stopPropagation(),this.collapsed?(this.collapsed=!1,this.panel&&(this.panel.style.display=""),this.row_holder.style.display=t,this.tabs_holder&&(this.tabs_holder.style.display=""),this.controls.style.display=e,this.setButtonText(s.currentTarget,"","collapse",this.translate("button_collapse"))):(this.collapsed=!0,this.row_holder.style.display="none",this.tabs_holder&&(this.tabs_holder.style.display="none"),this.controls.style.display="none",this.panel&&(this.panel.style.display="none"),this.setButtonText(s.currentTarget,"","expand",this.translate("button_expand")))}),this.options.collapsed&&p(this.toggle_button,"click"),this.schema.options&&void 0!==this.schema.options.disable_collapse?this.schema.options.disable_collapse&&(this.toggle_button.style.display="none"):this.jsoneditor.options.disable_collapse&&(this.toggle_button.style.display="none"),this.add_row_button=this.getButton(this.getItemTitle(),"add",this.translate("button_add_row_title",[this.getItemTitle()])),this.add_row_button.classList.add("json-editor-btntype-add"),this.add_row_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=this.rows.length;let s;this.row_cache[e]?(s=this.rows[e]=this.row_cache[e],this.rows[e].setValue(this.rows[e].getDefault(),!0),this.rows[e].container.style.display="",this.rows[e].tab&&(this.rows[e].tab.style.display=""),this.rows[e].register()):s=this.addRow(),this.active_tab=this.rows[e].tab,this.refreshTabs(),this.refreshValue(),this.onChange(!0),this.jsoneditor.trigger("addRow",s)}),this.controls.appendChild(this.add_row_button),this.delete_last_row_button=this.getButton(this.translate("button_delete_last",[this.getItemTitle()]),"subtract",this.translate("button_delete_last_title",[this.getItemTitle()])),this.delete_last_row_button.classList.add("json-editor-btntype-deletelast"),this.delete_last_row_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;const e=this.getValue();let s=null;const i=e.pop();this.setValue(e),this.rows[this.rows.length-1]&&(s=this.rows[this.rows.length-1].tab),s&&(this.active_tab=s,this.refreshTabs()),this.onChange(!0),this.jsoneditor.trigger("deleteRow",i)}),this.controls.appendChild(this.delete_last_row_button),this.remove_all_rows_button=this.getButton(this.translate("button_delete_all"),"delete",this.translate("button_delete_all_title")),this.remove_all_rows_button.classList.add("json-editor-btntype-deleteall"),this.remove_all_rows_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;this.empty(!0),this.setValue([]),this.onChange(!0),this.jsoneditor.trigger("deleteAllRows")}),this.controls.appendChild(this.remove_all_rows_button),this.tabs&&(this.add_row_button.style.width="100%",this.add_row_button.style.textAlign="left",this.add_row_button.style.marginBottom="3px",this.delete_last_row_button.style.width="100%",this.delete_last_row_button.style.textAlign="left",this.delete_last_row_button.style.marginBottom="3px",this.remove_all_rows_button.style.width="100%",this.remove_all_rows_button.style.textAlign="left",this.remove_all_rows_button.style.marginBottom="3px")}showValidationErrors(t){const e=[],s=[];t.forEach(t=>{t.path===this.path?e.push(t):s.push(t)}),this.error_holder&&(e.length?(this.error_holder.innerHTML="",this.error_holder.style.display="",e.forEach(t=>{this.error_holder.appendChild(this.theme.getErrorMessage(t.message))})):this.error_holder.style.display="none"),this.rows.forEach(t=>t.showValidationErrors(s))}}class v extends _{onInputChange(){this.value=this.input.value,this.onChange(!0)}register(){super.register(),this.input&&this.input.setAttribute("name",this.formname)}unregister(){super.unregister(),this.input&&this.input.removeAttribute("name")}getNumColumns(){let t=this.getTitle().length;return Object.keys(this.select_values).forEach(e=>t=Math.max(t,(""+this.select_values[e]).length+4)),Math.min(12,Math.max(t/7,2))}preBuild(){let t;super.preBuild(),this.select_options={},this.select_values={},this.option_keys=[],this.option_titles=[];const e=this.jsoneditor.expandRefs(this.schema.items||{}),s=e.enum||[],i=e.options&&e.options.enum_titles||[];for(t=0;t<s.length;t++)this.sanitize(s[t])===s[t]&&(this.option_keys.push(""+s[t]),this.option_titles.push(""+(i[t]||s[t])),this.select_values[""+s[t]]=s[t])}build(){let t;if(this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options.compact&&this.container.classList.add("compact"),!this.schema.format&&this.option_keys.length<8||"checkbox"===this.schema.format){for(this.input_type="checkboxes",this.inputs={},this.controls={},t=0;t<this.option_keys.length;t++){const e=this.formname+t.toString();this.inputs[this.option_keys[t]]=this.theme.getCheckbox(),this.inputs[this.option_keys[t]].id=e,this.select_options[this.option_keys[t]]=this.inputs[this.option_keys[t]];const s=this.theme.getCheckboxLabel(this.option_titles[t]);s.htmlFor=e,this.controls[this.option_keys[t]]=this.theme.getFormControl(s,this.inputs[this.option_keys[t]])}this.control=this.theme.getMultiCheckboxHolder(this.controls,this.label,this.description,this.infoButton),this.inputs.controlgroup=this.inputs.controls=this.control}else{for(this.input_type="select",this.input=this.theme.getSelectInput(this.option_keys,!0),this.theme.setSelectOptions(this.input,this.option_keys,this.option_titles),this.input.setAttribute("multiple","multiple"),this.input.size=Math.min(10,this.option_keys.length),t=0;t<this.option_keys.length;t++)this.select_options[this.option_keys[t]]=this.input.children[t];this.control=this.theme.getFormControl(this.label,this.input,this.description,this.infoButton)}(this.schema.readOnly||this.schema.readonly)&&this.disable(!0),this.container.appendChild(this.control),this.multiselectChangeHandler=e=>{const s=[];for(t=0;t<this.option_keys.length;t++)this.select_options[this.option_keys[t]]&&(this.select_options[this.option_keys[t]].selected||this.select_options[this.option_keys[t]].checked)&&s.push(this.select_values[this.option_keys[t]]);this.updateValue(s),this.onChange(!0)},this.control.addEventListener("change",this.multiselectChangeHandler,!1),window.requestAnimationFrame(()=>{this.afterInputReady()})}postBuild(){super.postBuild()}afterInputReady(){this.theme.afterInputReady(this.input||this.inputs)}setValue(t,e){t=t||[],Array.isArray(t)||(t=[t]),t=t.map(t=>""+t),Object.keys(this.select_options).forEach(e=>{this.select_options[e]["select"===this.input_type?"selected":"checked"]=t.includes(e)}),this.updateValue(t),this.onChange(!0)}removeValue(t){t=[].concat(t),this.setValue(this.getValue().filter(e=>!t.includes(e)))}addValue(t){this.setValue(this.getValue().concat(t))}updateValue(t){let e=!1;const s=[];for(let i=0;i<t.length;i++){if(!this.select_options[""+t[i]]){e=!0;continue}const r=this.sanitize(this.select_values[t[i]]);s.push(r),r!==t[i]&&(e=!0)}return this.value=s,e}sanitize(t){return"boolean"===this.schema.items.type?!!t:"number"===this.schema.items.type?1*t||0:"integer"===this.schema.items.type?Math.floor(1*t||0):""+t}enable(){this.always_disabled||(this.input?this.input.disabled=!1:this.inputs&&Object.keys(this.inputs).forEach(t=>this.inputs[t].disabled=!1),super.enable())}disable(t){t&&(this.always_disabled=!0),this.input?this.input.disabled=!0:this.inputs&&Object.keys(this.inputs).forEach(t=>this.inputs[t].disabled=!0),super.disable()}destroy(){super.destroy()}escapeRegExp(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}showValidationErrors(t){const e=new RegExp(`^${this.escapeRegExp(this.path)}(\\.\\d+)?$`),s=t.reduce((t,s)=>(s.path.match(e)&&t.push(s.message),t),[]);s.length?this.theme.addInputError(this.input||this.inputs,s.join(". ")+"."):this.theme.removeInputError(this.input||this.inputs)}}class C extends _{constructor(t,e){super(t,e),this.active=!1,this.parent&&this.parent.schema&&(Array.isArray(this.parent.schema.required)?this.parent.schema.required.includes(this.key)||this.parent.schema.required.push(this.key):this.parent.schema.required=[this.key])}build(){this.options.compact=!0;const t=this.schema.title||this.key,e=this.expandCallbacks("button",c({},{icon:"",validated:!1,align:"left",action:(t,e)=>{window.alert(`No button action defined for "${t.path}"`)}},this.defaults.options.button||{},this.options.button||{}));this.input=this.theme.getFormButton(t,e.icon,t),this.input.addEventListener("click",e.action,!1),(this.schema.readOnly||this.schema.readonly||this.schema.template)&&(this.always_disabled=!0,this.input.setAttribute("readonly","true")),this.setInputAttributes(["readonly"]),this.control=this.theme.getFormButtonHolder(e.align),this.control.appendChild(this.input),this.container.appendChild(this.control),this.changeHandler=()=>{this.jsoneditor.validate(this.jsoneditor.getValue()).length>0?this.disable():this.enable()},e.validated&&this.jsoneditor.on("change",this.changeHandler)}enable(){this.always_disabled||(this.input.disabled=!1,super.enable())}disable(t){t&&(this.always_disabled=!0),this.input.disabled=!0,super.disable()}getNumColumns(){return 2}activate(){this.active=!1,this.enable()}deactivate(){this.isRequired()||(this.active=!1,this.disable())}destroy(){this.jsoneditor.off("change",this.changeHandler),this.changeHandler=null,super.destroy()}}class x extends _{setValue(t,e){let s=this.typecast(t);const i=!!this.jsoneditor.options.use_default_values||void 0!==this.schema.default;this.enum_values.includes(s)&&(!e||this.isRequired()||i)||(s=this.enum_values[0]),this.value!==s&&(e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0),this.input.value=this.enum_options[this.enum_values.indexOf(s)],this.value=s,this.onChange(),this.change())}register(){super.register(),this.input&&this.input.setAttribute("name",this.formname)}unregister(){super.unregister(),this.input&&this.input.removeAttribute("name")}getNumColumns(){if(!this.enum_options)return 3;let t=this.getTitle().length;for(let e=0;e<this.enum_options.length;e++)t=Math.max(t,this.enum_options[e].length+4);return Math.min(12,Math.max(t/7,2))}typecast(t){return"boolean"===this.schema.type?"undefined"===t||void 0===t?void 0:!!t:"number"===this.schema.type?1*t||0:"integer"===this.schema.type?Math.floor(1*t||0):this.schema.enum&&void 0===t?void 0:""+t}getValue(){if(this.dependenciesFulfilled)return this.typecast(this.value)}preBuild(){let t,e;if(this.input_type="select",this.enum_options=[],this.enum_values=[],this.enum_display=[],this.schema.enum){const t=this.schema.options&&this.schema.options.enum_titles||[];this.schema.enum.forEach((e,s)=>{this.enum_options[s]=""+e,this.enum_display[s]=""+(t[s]||e),this.enum_values[s]=this.typecast(e)}),this.isRequired()||(this.enum_display.unshift(" "),this.enum_options.unshift("undefined"),this.enum_values.unshift(void 0))}else if("boolean"===this.schema.type)this.enum_display=this.schema.options&&this.schema.options.enum_titles||["true","false"],this.enum_options=["1",""],this.enum_values=[!0,!1],this.isRequired()||(this.enum_display.unshift(" "),this.enum_options.unshift("undefined"),this.enum_values.unshift(void 0));else{if(!this.schema.enumSource)throw new Error("'select' editor requires the enum property to be set.");if(this.enumSource=[],this.enum_display=[],this.enum_options=[],this.enum_values=[],Array.isArray(this.schema.enumSource))for(t=0;t<this.schema.enumSource.length;t++)"string"==typeof this.schema.enumSource[t]?this.enumSource[t]={source:this.schema.enumSource[t]}:Array.isArray(this.schema.enumSource[t])?this.enumSource[t]=this.schema.enumSource[t]:this.enumSource[t]=c({},this.schema.enumSource[t]);else this.schema.enumValue?this.enumSource=[{source:this.schema.enumSource,value:this.schema.enumValue}]:this.enumSource=[{source:this.schema.enumSource}];for(t=0;t<this.enumSource.length;t++)this.enumSource[t].value&&(e=this.expandCallbacks("template",{template:this.enumSource[t].value}),"function"==typeof e.template?this.enumSource[t].value=e.template:this.enumSource[t].value=this.jsoneditor.compileTemplate(this.enumSource[t].value,this.template_engine)),this.enumSource[t].title&&(e=this.expandCallbacks("template",{template:this.enumSource[t].title}),"function"==typeof e.template?this.enumSource[t].title=e.template:this.enumSource[t].title=this.jsoneditor.compileTemplate(this.enumSource[t].title,this.template_engine)),this.enumSource[t].filter&&this.enumSource[t].value&&(e=this.expandCallbacks("template",{template:this.enumSource[t].filter}),"function"==typeof e.template?this.enumSource[t].filter=e.template:this.enumSource[t].filter=this.jsoneditor.compileTemplate(this.enumSource[t].filter,this.template_engine))}}build(){this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options.compact&&this.container.classList.add("compact"),this.input=this.theme.getSelectInput(this.enum_options,!1),this.theme.setSelectOptions(this.input,this.enum_options,this.enum_display),(this.schema.readOnly||this.schema.readonly)&&(this.always_disabled=!0,this.input.disabled=!0),this.setInputAttributes([]),this.input.addEventListener("change",t=>{t.preventDefault(),t.stopPropagation(),this.onInputChange()}),this.control=this.theme.getFormControl(this.label,this.input,this.description,this.infoButton),this.container.appendChild(this.control),this.value=this.enum_values[0],window.requestAnimationFrame(()=>{this.input.parentNode&&this.afterInputReady()})}afterInputReady(){this.theme.afterInputReady(this.input)}onInputChange(){const t=this.typecast(this.input.value);let e;e=this.enum_values.includes(t)?this.enum_values[this.enum_values.indexOf(t)]:this.enum_values[0],e!==this.value&&(this.is_dirty=!0,this.value=e,this.onChange(!0))}onWatchedFieldChange(){let t,e,s=[],i=[];if(this.enumSource){t=this.getWatchedFieldValues();for(let r=0;r<this.enumSource.length;r++)if(Array.isArray(this.enumSource[r]))s=s.concat(this.enumSource[r]),i=i.concat(this.enumSource[r]);else{let o=[];if(o=Array.isArray(this.enumSource[r].source)?this.enumSource[r].source:t[this.enumSource[r].source],o){if(this.enumSource[r].slice&&(o=Array.prototype.slice.apply(o,this.enumSource[r].slice)),this.enumSource[r].filter){const s=[];for(e=0;e<o.length;e++)this.enumSource[r].filter({i:e,item:o[e],watched:t})&&s.push(o[e]);o=s}const n=[],a=[];for(e=0;e<o.length;e++){const t=o[e];this.enumSource[r].value?a[e]=this.typecast(this.enumSource[r].value({i:e,item:t})):a[e]=o[e],this.enumSource[r].title?n[e]=this.enumSource[r].title({i:e,item:t}):n[e]=a[e]}this.enumSource[r].sort&&((t,e,s)=>{t.map((t,s)=>({v:t,t:e[s]})).sort((t,e)=>t.v<e.v?-s:t.v===e.v?0:s).forEach((s,i)=>{t[i]=s.v,e[i]=s.t})}).bind(null,a,n,"desc"===this.enumSource[r].sort?1:-1)(),s=s.concat(a),i=i.concat(n)}}const r=this.value;this.theme.setSelectOptions(this.input,s,i),this.enum_options=s,this.enum_display=i,this.enum_values=s,s.includes(r)||!1!==this.jsoneditor.options.enum_source_value_auto_select?(this.input.value=r,this.value=r):(this.input.value=s[0],this.value=this.typecast(s[0]||""),this.parent&&!this.watchLoop?this.parent.onChildEditorChange(this):this.jsoneditor.onChange(),this.jsoneditor.notifyWatchers(this.path))}super.onWatchedFieldChange()}enable(){this.always_disabled||(this.input.disabled=!1),super.enable()}disable(t){t&&(this.always_disabled=!0),this.input.disabled=!0,super.disable(t)}destroy(){this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),super.destroy()}showValidationErrors(t){this.previous_error_setting=this.jsoneditor.options.show_errors;const e=t.reduce((t,e)=>(e.path===this.path&&t.push(e.message),t),[]);e.length?this.theme.addInputError(this.input,e.join(". ")+"."):this.theme.removeInputError(this.input)}}class k extends x{setValue(t,e){if(this.choices_instance){let s=this.typecast(t||"");if(this.enum_values.includes(s)||(s=this.enum_values[0]),this.value===s)return;e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0),this.input.value=this.enum_options[this.enum_values.indexOf(s)],this.choices_instance.setChoiceByValue(this.input.value),this.value=s,this.onChange()}else super.setValue(t,e)}afterInputReady(){if(window.Choices&&!this.choices_instance){const t=this.expandCallbacks("choices",c({},this.defaults.options.choices||{},this.options.choices||{}));this.choices_instance=new window.Choices(this.input,t)}super.afterInputReady()}onWatchedFieldChange(){if(super.onWatchedFieldChange(),this.choices_instance){const t=this.enum_options.map((t,e)=>({value:t,label:this.enum_display[e]}));this.choices_instance.setChoices(t,"value","label",!0),this.choices_instance.setChoiceByValue(""+this.value)}}enable(){!this.always_disabled&&this.choices_instance&&this.choices_instance.enable(),super.enable()}disable(t){this.choices_instance&&this.choices_instance.disable(),super.disable(t)}destroy(){this.choices_instance&&(this.choices_instance.destroy(),this.choices_instance=null),super.destroy()}}k.rules={".choices > *":"box-sizing:border-box"};class E extends y{build(){if(super.build(),void 0!==this.schema.minimum){let{minimum:t}=this.schema;void 0!==this.schema.exclusiveMinimum&&(t+=1),this.input.setAttribute("min",t)}if(void 0!==this.schema.maximum){let{maximum:t}=this.schema;void 0!==this.schema.exclusiveMaximum&&(t-=1),this.input.setAttribute("max",t)}if(void 0!==this.schema.step){const t=this.schema.step||1;this.input.setAttribute("step",t)}this.setInputAttributes(["maxlength","pattern","readonly","min","max","step"])}getNumColumns(){return 2}getValue(){if(this.dependenciesFulfilled)return function(t){if(null==t)return!1;const e=t.match(m),s=parseFloat(t);return null!==e&&!isNaN(s)&&isFinite(s)}(this.value)?parseFloat(this.value):this.value}}class j extends y{build(){if(this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options.compact&&this.container.classList.add("compact"),this.ratingContainer=document.createElement("div"),this.ratingContainer.classList.add("starrating"),void 0===this.schema.enum){let t=this.schema.maximum?this.schema.maximum:5;this.schema.exclusiveMaximum&&t--,this.enum_values=[];for(let e=0;e<t;e++)this.enum_values.push(e+1)}else this.enum_values=this.schema.enum;this.radioGroup=[];const t=t=>{t.preventDefault(),t.stopPropagation(),this.setValue(t.currentTarget.value),this.onChange(!0)};for(let e=this.enum_values.length-1;e>-1;e--){const s=this.formname+(e+1),i=this.theme.getFormInputField("radio");i.name=this.formname+"[starrating]",i.value=this.enum_values[e],i.id=s,i.addEventListener("change",t,!1),this.radioGroup.push(i);const r=document.createElement("label");r.htmlFor=s,r.title=this.enum_values[e],this.options.displayValue&&r.classList.add("starrating-display-enabled"),this.ratingContainer.appendChild(i),this.ratingContainer.appendChild(r)}if(this.options.displayValue&&(this.displayRating=document.createElement("div"),this.displayRating.classList.add("starrating-display"),this.displayRating.innerText=this.enum_values[0],this.ratingContainer.appendChild(this.displayRating)),this.schema.readOnly||this.schema.readonly){this.always_disabled=!0;for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!0;this.ratingContainer.classList.add("readonly")}const e=this.theme.getContainer();e.appendChild(this.ratingContainer),this.input=e,this.control=this.theme.getFormControl(this.label,e,this.description,this.infoButton),this.container.appendChild(this.control),this.refreshValue()}enable(){if(!this.always_disabled){for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!1;this.ratingContainer.classList.remove("readonly"),super.enable()}}disable(t){t&&(this.always_disabled=!0);for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!0;this.ratingContainer.classList.add("readonly"),super.disable()}destroy(){this.ratingContainer.parentNode&&this.ratingContainer.parentNode.parentNode&&this.ratingContainer.parentNode.parentNode.removeChild(this.ratingContainer.parentNode),this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),super.destroy()}getNumColumns(){return 2}getValue(){if(this.dependenciesFulfilled)return"integer"===this.schema.type?""===this.value?void 0:1*this.value:this.value}setValue(t){for(let e=0;e<this.radioGroup.length;e++)if(this.radioGroup[e].value===""+t){this.radioGroup[e].checked=!0,this.value=t,this.options.displayValue&&(this.displayRating.innerHTML=this.value),this.onChange(!0);break}}}j.rules={".starrating":"direction:rtl;display:inline-block;white-space:nowrap",".starrating > input":"display:none",".starrating > label:before":"content:'%5C2606';margin:1px;font-size:18px;font-style:normal;font-weight:400;line-height:1;font-family:'Arial';display:inline-block",".starrating > label":"color:%23888;cursor:pointer;margin:8px%200%202px%200",".starrating > label.starrating-display-enabled":"margin:1px%200%200%200",".starrating > input:checked ~ label":"color:%23ffca08",".starrating:not(.readonly) > input:hover ~ label":"color:%23ffca08",".starrating > input:checked ~ label:before":"content:'%5C2605';text-shadow:0%200%201px%20rgba(0%2C20%2C20%2C1)",".starrating:not(.readonly) > input:hover ~ label:before":"content:'%5C2605';text-shadow:0%200%201px%20rgba(0%2C20%2C20%2C1)",".starrating .starrating-display":"position:relative;direction:rtl;text-align:center;font-size:10px;line-height:0px"};const L={ace:class extends y{setValue(t,e,s){const i=super.setValue(t,e,s);void 0!==i&&i.changed&&this.ace_editor_instance&&(this.ace_editor_instance.setValue(i.value),this.ace_editor_instance.session.getSelection().clearSelection(),this.ace_editor_instance.resize())}build(){this.options.format="textarea",super.build(),this.input_type=this.schema.format,this.input.setAttribute("data-schemaformat",this.input_type)}afterInputReady(){let t;if(window.ace){let e=this.input_type;"cpp"!==e&&"c++"!==e&&"c"!==e||(e="c_cpp"),t=this.expandCallbacks("ace",c({},{selectionStyle:"text",minLines:30,maxLines:30},this.defaults.options.ace||{},this.options.ace||{},{mode:"ace/mode/"+e})),this.ace_container=document.createElement("div"),this.ace_container.style.width="100%",this.ace_container.style.position="relative",this.input.parentNode.insertBefore(this.ace_container,this.input),this.input.style.display="none",this.ace_editor_instance=window.ace.edit(this.ace_container,t),this.ace_editor_instance.setValue(this.getValue()),this.ace_editor_instance.session.getSelection().clearSelection(),this.ace_editor_instance.resize(),(this.schema.readOnly||this.schema.readonly||this.schema.template)&&this.ace_editor_instance.setReadOnly(!0),this.ace_editor_instance.on("change",()=>{this.input.value=this.ace_editor_instance.getValue(),this.refreshValue(),this.is_dirty=!0,this.onChange(!0)}),this.theme.afterInputReady(this.input)}else super.afterInputReady()}getNumColumns(){return 6}enable(){!this.always_disabled&&this.ace_editor_instance&&this.ace_editor_instance.setReadOnly(!1),super.enable()}disable(t){this.ace_editor_instance&&this.ace_editor_instance.setReadOnly(!0),super.disable(t)}destroy(){this.ace_editor_instance&&(this.ace_editor_instance.destroy(),this.ace_editor_instance=null),super.destroy()}},array:w,arrayChoices:class extends v{setValue(t,e){this.choices_instance?(t=[].concat(t).map(t=>""+t),this.updateValue(t),this.choices_instance.removeActiveItems(),this.choices_instance.setChoiceByValue(this.value),this.onChange(!0)):super.setValue(t,e)}afterInputReady(){if(window.Choices&&!this.choices_instance){const t=this.expandCallbacks("choices",c({},{removeItems:!0,removeItemButton:!0},this.defaults.options.choices||{},this.options.choices||{},{addItems:!0,editItems:!1,duplicateItemsAllowed:!1}));this.newEnumAllowed=!1,this.choices_instance=new window.Choices(this.input,t),this.control.removeEventListener("change",this.multiselectChangeHandler),this.multiselectChangeHandler=t=>{const e=this.choices_instance.getValue(!0);this.updateValue(e),this.onChange(!0)},this.control.addEventListener("change",this.multiselectChangeHandler,!1)}super.afterInputReady()}updateValue(t){t=[].concat(t);let e=!1;const s=[];for(let i=0;i<t.length;i++){if(!this.select_values[""+t[i]]){if(e=!0,!this.newEnumAllowed)continue;if(!this.addNewOption(t[i]))continue}const r=this.sanitize(this.select_values[t[i]]);s.push(r),r!==t[i]&&(e=!0)}return this.value=s,e}addNewOption(t){return this.option_keys.push(""+t),this.option_titles.push(""+t),this.select_values[""+t]=t,this.schema.items.enum.push(t),this.choices_instance.setChoices([{value:""+t,label:""+t}],"value","label",!1),!0}enable(){!this.always_disabled&&this.choices_instance&&this.choices_instance.enable(),super.enable()}disable(t){this.choices_instance&&this.choices_instance.disable(),super.disable(t)}destroy(){this.choices_instance&&(this.choices_instance.destroy(),this.choices_instance=null),super.destroy()}},arraySelect2:class extends v{setValue(t,e){this.select2_instance?(t=[].concat(t).map(t=>""+t),this.updateValue(t),this.select2v4?this.select2_instance.val(this.value).change():this.select2_instance.select2("val",this.value),this.onChange(!0)):super.setValue(t,e)}afterInputReady(){let t;window.jQuery&&window.jQuery.fn&&window.jQuery.fn.select2&&!this.select2_instance&&(t=this.expandCallbacks("select2",c({},{tags:!0,width:"100%"},this.defaults.options.select2||{},this.options.select2||{})),this.newEnumAllowed=t.tags=!!t.tags&&this.schema.items&&"string"===this.schema.items.type,this.select2_instance=window.jQuery(this.input).select2(t),this.select2v4=u(this.select2_instance.select2,"amd"),this.selectChangeHandler=()=>{const t=this.select2v4?this.select2_instance.val():this.select2_instance.select2("val");this.updateValue(t),this.onChange(!0)},this.select2_instance.on("select2-blur",this.selectChangeHandler),this.select2_instance.on("change",this.selectChangeHandler)),super.afterInputReady()}updateValue(t){t=[].concat(t);let e=!1;const s=[];for(let i=0;i<t.length;i++){if(!this.select_values[""+t[i]]){if(e=!0,!this.newEnumAllowed)continue;if(!this.addNewOption(t[i]))continue}const r=this.sanitize(this.select_values[t[i]]);s.push(r),r!==t[i]&&(e=!0)}return this.value=s,e}addNewOption(t){this.option_keys.push(""+t),this.option_titles.push(""+t),this.select_values[""+t]=t,this.schema.items.enum.push(t);const e=this.input.querySelector(`option[value="${t}"]`);return e?e.removeAttribute("data-select2-tag"):this.input.appendChild(new Option(t,t,!1,!1)).trigger("change"),!0}enable(){!this.always_disabled&&this.select2_instance&&(this.select2v4?this.select2_instance.prop("disabled",!1):this.select2_instance.select2("enable",!0)),super.enable()}disable(t){this.select2_instance&&(this.select2v4?this.select2_instance.prop("disabled",!0):this.select2_instance.select2("enable",!1)),super.disable()}destroy(){this.select2_instance&&(this.select2_instance.select2("destroy"),this.select2_instance=null),super.destroy()}},arraySelectize:class extends v{setValue(t,e){this.selectize_instance?(t=[].concat(t).map(t=>""+t),this.updateValue(t),this.selectize_instance.setValue(this.value),this.onChange(!0)):super.setValue(t,e)}afterInputReady(){let t;window.jQuery&&window.jQuery.fn&&window.jQuery.fn.selectize&&!this.selectize_instance&&(t=this.expandCallbacks("selectize",c({},{plugins:["remove_button"],delimiter:!1,createOnBlur:!0,create:!0},this.defaults.options.selectize||{},this.options.selectize||{})),this.newEnumAllowed=t.create=!!t.create&&this.schema.items&&"string"===this.schema.items.type,this.selectize_instance=window.jQuery(this.input).selectize(t)[0].selectize,this.control.removeEventListener("change",this.multiselectChangeHandler),this.multiselectChangeHandler=t=>{const e=this.selectize_instance.getValue();this.updateValue(e),this.onChange(!0)},this.selectize_instance.on("change",this.multiselectChangeHandler)),super.afterInputReady()}updateValue(t){t=[].concat(t);let e=!1;const s=[];for(let i=0;i<t.length;i++){if(!this.select_values[""+t[i]]){if(e=!0,!this.newEnumAllowed)continue;if(!this.addNewOption(t[i]))continue}const r=this.sanitize(this.select_values[t[i]]);s.push(r),r!==t[i]&&(e=!0)}return this.value=s,e}addNewOption(t){return this.option_keys.push(""+t),this.option_titles.push(""+t),this.select_values[""+t]=t,this.schema.items.enum.push(t),this.selectize_instance.addOption({text:t,value:t}),!0}enable(){!this.always_disabled&&this.selectize_instance&&this.selectize_instance.unlock(),super.enable()}disable(t){this.selectize_instance&&this.selectize_instance.lock(),super.disable(t)}destroy(){this.selectize_instance&&(this.selectize_instance.destroy(),this.selectize_instance=null),super.destroy()}},autocomplete:class extends y{postBuild(){window.Autocomplete&&(this.autocomplete_wrapper=document.createElement("div"),this.input.parentNode.insertBefore(this.autocomplete_wrapper,this.input.nextSibling),this.autocomplete_wrapper.appendChild(this.input),this.autocomplete_dropdown=document.createElement("ul"),this.input.parentNode.insertBefore(this.autocomplete_dropdown,this.input.nextSibling)),super.postBuild()}afterInputReady(){let t;window.Autocomplete&&!this.autocomplete_instance&&(t=this.expandCallbacks("autocomplete",c({},{search:(t,e)=>(console.log(`No "search" callback defined for autocomplete in property "${t.key}"`),[]),baseClass:"autocomplete"},this.defaults.options.autocomplete||{},this.options.autocomplete||{})),this.autocomplete_wrapper.classList.add(t.baseClass),this.autocomplete_dropdown.classList.add(t.baseClass+"-result-list"),this.autocomplete_instance=new window.Autocomplete(this.autocomplete_wrapper,t)),super.afterInputReady()}destroy(){this.autocomplete_instance&&(this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),this.autocomplete_dropdown&&this.autocomplete_dropdown.parentNode&&this.autocomplete_dropdown.parentNode.removeChild(this.autocomplete_dropdown),this.autocomplete_wrapper&&this.autocomplete_wrapper.parentNode&&this.autocomplete_wrapper.parentNode.removeChild(this.autocomplete_wrapper),this.autocomplete_instance=null),super.destroy()}},base64:class extends _{getNumColumns(){return 4}setFileReaderListener(t){t.addEventListener("load",t=>{if(this.count===this.current_item_index)this.value[this.count][this.key]=t.target.result;else{const e={};for(const t in this.parent.schema.properties)e[t]="";e[this.key]=t.target.result,this.value.splice(this.count,0,e)}this.count+=1,this.count===this.total+this.current_item_index&&this.arrayEditor.setValue(this.value)})}build(){if(this.title=this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired()),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.input=this.theme.getFormInputField("hidden"),this.container.appendChild(this.input),!this.schema.readOnly&&!this.schema.readonly){if(!window.FileReader)throw new Error("FileReader required for base64 editor");this.uploader=this.theme.getFormInputField("file"),this.schema.options&&this.schema.options.multiple&&!0===this.schema.options.multiple&&this.parent&&"object"===this.parent.schema.type&&this.parent.parent&&"array"===this.parent.parent.schema.type&&this.uploader.setAttribute("multiple",""),this.uploader.addEventListener("change",t=>{if(t.preventDefault(),t.stopPropagation(),t.currentTarget.files&&t.currentTarget.files.length)if(t.currentTarget.files.length>1&&this.schema.options&&this.schema.options.multiple&&!0===this.schema.options.multiple&&this.parent&&"object"===this.parent.schema.type&&this.parent.parent&&"array"===this.parent.parent.schema.type){this.arrayEditor=this.jsoneditor.getEditor(this.parent.parent.path),this.value=this.arrayEditor.getValue(),this.total=t.currentTarget.files.length,this.current_item_index=parseInt(this.parent.key),this.count=this.current_item_index;for(let e=0;e<this.total;e++){const s=new FileReader;this.setFileReaderListener(s),s.readAsDataURL(t.currentTarget.files[e])}}else{let e=new FileReader;e.onload=t=>{this.value=t.target.result,this.refreshPreview(),this.onChange(!0),e=null},e.readAsDataURL(t.currentTarget.files[0])}})}this.preview=this.theme.getFormInputDescription(this.schema.description),this.container.appendChild(this.preview),this.control=this.theme.getFormControl(this.label,this.uploader||this.input,this.preview,this.infoButton),this.container.appendChild(this.control)}refreshPreview(){if(this.last_preview===this.value)return;if(this.last_preview=this.value,this.preview.innerHTML="",!this.value)return;let t=this.value.match(/^data:([^;,]+)[;,]/);if(t&&(t=t[1]),t){if(this.preview.innerHTML=`<strong>Type:</strong> ${t}, <strong>Size:</strong> ${Math.floor((this.value.length-this.value.split(",")[0].length-1)/1.33333)} bytes`,"image"===t.substr(0,5)){this.preview.innerHTML+="<br>";const t=document.createElement("img");t.style.maxWidth="100%",t.style.maxHeight="100px",t.src=this.value,this.preview.appendChild(t)}}else this.preview.innerHTML="<em>Invalid data URI</em>"}enable(){this.always_disabled||(this.uploader&&(this.uploader.disabled=!1),super.enable())}disable(t){t&&(this.always_disabled=!0),this.uploader&&(this.uploader.disabled=!0),super.disable()}setValue(t){this.value!==t&&(this.value=t,this.input.value=this.value,this.refreshPreview(),this.onChange())}destroy(){this.preview&&this.preview.parentNode&&this.preview.parentNode.removeChild(this.preview),this.title&&this.title.parentNode&&this.title.parentNode.removeChild(this.title),this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),this.uploader&&this.uploader.parentNode&&this.uploader.parentNode.removeChild(this.uploader),super.destroy()}},button:C,checkbox:class extends _{setValue(t,e){t=!!t;const s=this.getValue()!==t;this.value=t,this.input.checked=this.value,this.onChange(s)}register(){super.register(),this.input&&this.input.setAttribute("name",this.formname)}unregister(){super.unregister(),this.input&&this.input.removeAttribute("name")}getNumColumns(){return Math.min(12,Math.max(this.getTitle().length/7,2))}build(){this.parent.options.table_row||(this.label=this.header=this.theme.getCheckboxLabel(this.getTitle(),this.isRequired()),this.label.htmlFor=this.formname),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&!this.options.compact&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options.compact&&this.container.classList.add("compact"),this.input=this.theme.getCheckbox(),this.input.id=this.formname,this.control=this.theme.getFormControl(this.label,this.input,this.description,this.infoButton),(this.schema.readOnly||this.schema.readonly)&&(this.always_disabled=!0,this.input.disabled=!0),this.input.addEventListener("change",t=>{t.preventDefault(),t.stopPropagation(),this.value=t.currentTarget.checked,this.onChange(!0)}),this.container.appendChild(this.control)}enable(){this.always_disabled||(this.input.disabled=!1,super.enable())}disable(t){t&&(this.always_disabled=!0),this.input.disabled=!0,super.disable()}destroy(){this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),super.destroy()}showValidationErrors(t){if("always"===this.jsoneditor.options.show_errors);else if(!this.is_dirty&&this.previous_error_setting===this.jsoneditor.options.show_errors)return;this.previous_error_setting=this.jsoneditor.options.show_errors;const e=t.reduce((t,e)=>(e.path===this.path&&t.push(e.message),t),[]);this.input.controlgroup=this.control,e.length?this.theme.addInputError(this.input,e.join(". ")+"."):this.theme.removeInputError(this.input)}},choices:k,datetime:class extends y{build(){if(super.build(),this.input&&window.flatpickr&&"object"==typeof this.options.flatpickr){this.options.flatpickr.enableTime="date"!==this.schema.format,this.options.flatpickr.noCalendar="time"===this.schema.format,"integer"===this.schema.type&&(this.options.flatpickr.mode="single"),this.input.setAttribute("data-input","");let{input:t}=this;if(!0===this.options.flatpickr.wrap){const e=[];if(!1!==this.options.flatpickr.showToggleButton){const t=this.getButton("","time"===this.schema.format?"time":"calendar",this.translate("flatpickr_toggle_button"));t.setAttribute("data-toggle",""),e.push(t)}if(!1!==this.options.flatpickr.showClearButton){const t=this.getButton("","clear",this.translate("flatpickr_clear_button"));t.setAttribute("data-clear",""),e.push(t)}const{parentNode:s}=this.input,{nextSibling:i}=this.input,r=this.theme.getInputGroup(this.input,e);void 0!==r?(this.options.flatpickr.inline=!1,s.insertBefore(r,i),t=r):this.options.flatpickr.wrap=!1}this.flatpickr=window.flatpickr(t,this.options.flatpickr),!0===this.options.flatpickr.inline&&!0===this.options.flatpickr.inlineHideInput&&this.input.setAttribute("type","hidden")}}getValue(){if(!this.dependenciesFulfilled)return;if("string"===this.schema.type)return this.value;if(""===this.value||void 0===this.value)return;const t="time"===this.schema.format?"1970-01-01 "+this.value:this.value;return parseInt(new Date(t).getTime()/1e3)}setValue(t,e,s){if("string"===this.schema.type)super.setValue(t,e,s),this.flatpickr&&this.flatpickr.setDate(t);else if(t>0){const e=new Date(1e3*t),s=e.getFullYear(),i=this.zeroPad(e.getMonth()+1),r=this.zeroPad(e.getDate()),o=this.zeroPad(e.getHours()),n=this.zeroPad(e.getMinutes()),a=this.zeroPad(e.getSeconds()),l=[s,i,r].join("-"),h=[o,n,a].join(":");let d=`${l}T${h}`;"date"===this.schema.format?d=l:"time"===this.schema.format&&(d=h),this.input.value=d,this.refreshValue(),this.flatpickr&&this.flatpickr.setDate(d)}}destroy(){this.flatpickr&&this.flatpickr.destroy(),this.flatpickr=null,super.destroy()}zeroPad(t){return("0"+t).slice(-2)}},describedBy:class extends _{register(){if(this.editors){for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].unregister();this.editors[this.currentEditor]&&this.editors[this.currentEditor].register()}super.register()}unregister(){if(super.unregister(),this.editors)for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].unregister()}getNumColumns(){return this.editors[this.currentEditor]?Math.max(this.editors[this.currentEditor].getNumColumns(),4):4}enable(){if(this.editors)for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].enable();super.enable()}disable(){if(this.editors)for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].disable();super.disable()}switchEditor(){const t=this.getWatchedFieldValues();if(!t)return;const e=document.location.origin+document.location.pathname+this.template(t);this.editors[this.refs[e]]||this.buildChildEditor(e),this.currentEditor=this.refs[e],this.register(),this.editors.forEach((t,e)=>{t&&(this.currentEditor===e?t.container.style.display="":t.container.style.display="none")}),this.refreshValue(),this.onChange(!0)}buildChildEditor(t){this.refs[t]=this.editors.length;const e=this.theme.getChildEditorHolder();this.editor_holder.appendChild(e);const s=c({},this.schema,this.jsoneditor.refs[t]),i=this.jsoneditor.getEditorClass(s,this.jsoneditor),r=this.jsoneditor.createEditor(i,{jsoneditor:this.jsoneditor,schema:s,container:e,path:this.path,parent:this,required:!0});this.editors.push(r),r.preBuild(),r.build(),r.postBuild()}preBuild(){let t;for(this.refs={},this.editors=[],this.currentEditor="",t=0;t<this.schema.links.length;t++)if("describedby"===this.schema.links[t].rel.toLowerCase()){this.template=this.jsoneditor.compileTemplate(this.schema.links[t].href,this.template_engine);break}this.schema.links=this.schema.links.slice(0,t).concat(this.schema.links.slice(t+1)),0===this.schema.links.length&&delete this.schema.links,this.baseSchema=c({},this.schema)}build(){this.editor_holder=document.createElement("div"),this.container.appendChild(this.editor_holder),this.switchEditor()}onWatchedFieldChange(){this.switchEditor()}onChildEditorChange(t){this.editors[this.currentEditor]&&this.refreshValue(),super.onChildEditorChange(t)}refreshValue(){this.editors[this.currentEditor]&&(this.value=this.editors[this.currentEditor].getValue())}setValue(t,e){this.editors[this.currentEditor]&&(this.editors[this.currentEditor].setValue(t,e),this.refreshValue(),this.onChange())}destroy(){this.editors.forEach(t=>{t&&t.destroy()}),this.editor_holder&&this.editor_holder.parentNode&&this.editor_holder.parentNode.removeChild(this.editor_holder),super.destroy()}showValidationErrors(t){this.editors.forEach(e=>{e&&e.showValidationErrors(t)})}},enum:class extends _{getNumColumns(){return 4}build(){this.title=this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired()),this.container.appendChild(this.title),this.options.enum_titles=this.options.enum_titles||[],this.enum=this.schema.enum,this.selected=0,this.select_options=[],this.html_values=[];for(let t=0;t<this.enum.length;t++)this.select_options[t]=this.options.enum_titles[t]||"Value "+(t+1),this.html_values[t]=this.getHTML(this.enum[t]);this.switcher=this.theme.getSwitcher(this.select_options),this.container.appendChild(this.switcher),this.display_area=this.theme.getIndentedPanel(),this.container.appendChild(this.display_area),this.options.hide_display&&(this.display_area.style.display="none"),this.switcher.addEventListener("change",t=>{this.selected=this.select_options.indexOf(t.currentTarget.value),this.value=this.enum[this.selected],this.refreshValue(),this.onChange(!0)}),this.value=this.enum[0],this.refreshValue(),1===this.enum.length&&(this.switcher.style.display="none")}refreshValue(){this.selected=-1;const t=JSON.stringify(this.value);this.enum.forEach((e,s)=>{if(t===JSON.stringify(e))return this.selected=s,!1}),this.selected<0?this.setValue(this.enum[0]):(this.switcher.value=this.select_options[this.selected],this.display_area.innerHTML=this.html_values[this.selected])}enable(){this.always_disabled||(this.switcher.disabled=!1,super.enable())}disable(t){t&&(this.always_disabled=!0),this.switcher.disabled=!0,super.disable()}getHTML(t){if(null===t)return"<em>null</em>";if("object"==typeof t){let e="";return((t,e)=>{Array.isArray(t)||"number"==typeof t.length&&t.length>0&&t.length-1 in t?Array.from(t).forEach((t,s)=>e(s,t)):Object.entries(t).forEach(([t,s])=>e(t,s))})(t,(s,i)=>{let r=this.getHTML(i);Array.isArray(t)||(r=`<div><em>${s}</em>: ${r}</div>`),e+=`<li>${r}</li>`}),e=Array.isArray(t)?`<ol>${e}</ol>`:`<ul style='margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0;'>${e}</ul>`,e}return"boolean"==typeof t?t?"true":"false":"string"==typeof t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):t}setValue(t){this.value!==t&&(this.value=t,this.refreshValue(),this.onChange())}destroy(){this.display_area&&this.display_area.parentNode&&this.display_area.parentNode.removeChild(this.display_area),this.title&&this.title.parentNode&&this.title.parentNode.removeChild(this.title),this.switcher&&this.switcher.parentNode&&this.switcher.parentNode.removeChild(this.switcher),super.destroy()}},hidden:class extends _{register(){super.register(),this.input&&this.input.setAttribute("name",this.formname)}unregister(){super.unregister(),this.input&&this.input.removeAttribute("name")}setValue(t,e,s){if(this.template&&!s)return;if(null==t?t="":"object"==typeof t?t=JSON.stringify(t):"string"!=typeof t&&(t=""+t),t===this.serialized)return;const i=this.sanitize(t);if(this.input.value===i)return;this.input.value=i;const r=s||this.getValue()!==t;this.refreshValue(),e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0),this.adjust_height&&this.adjust_height(this.input),this.onChange(r)}getNumColumns(){return 2}enable(){super.enable()}disable(){super.disable()}refreshValue(){this.value=this.input.value,"string"!=typeof this.value&&(this.value=""),this.serialized=this.value}destroy(){this.template=null,this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),super.destroy()}sanitize(t){return t}onWatchedFieldChange(){let t;this.template&&(t=this.getWatchedFieldValues(),this.setValue(this.template(t),!1,!0)),super.onWatchedFieldChange()}build(){if(this.format=this.schema.format,!this.format&&this.options.default_format&&(this.format=this.options.default_format),this.options.format&&(this.format=this.options.format),this.input_type="hidden",this.input=this.theme.getFormInputField(this.input_type),this.format&&this.input.setAttribute("data-schemaformat",this.format),this.container.appendChild(this.input),this.schema.template){const t=this.expandCallbacks("template",{template:this.schema.template});"function"==typeof t.template?this.template=t.template:this.template=this.jsoneditor.compileTemplate(this.schema.template,this.template_engine),this.refreshValue()}else this.refreshValue()}},info:class extends C{build(){this.options.compact=!1,this.header=this.label=this.theme.getFormInputLabel(this.getTitle()),this.description=this.theme.getDescription(this.schema.description||""),this.control=this.theme.getFormControl(this.label,this.description,null),this.container.appendChild(this.control)}getTitle(){return this.schema.title}getNumColumns(){return 12}},integer:class extends E{getNumColumns(){return 2}getValue(){if(this.dependenciesFulfilled)return function(t){if(null==t)return!1;const e=t.match(b),s=parseInt(t);return null!==e&&!isNaN(s)&&isFinite(s)}(this.value)?parseInt(this.value):this.value}},ip:class extends y{preBuild(){if(super.preBuild(),this.schema.options||(this.schema.options={}),!this.schema.options.cleave)switch(this.format){case"ipv6":this.schema.options.cleave={delimiters:[":"],blocks:[4,4,4,4,4,4,4,4],uppercase:!0};break;case"ipv4":this.schema.options.cleave={delimiters:["."],blocks:[3,3,3,3],numericOnly:!0}}this.options=c(this.options,this.schema.options||{})}},jodit:class extends y{setValue(t,e,s){const i=super.setValue(t,e,s);void 0!==i&&i.changed&&this.jodit_instance&&this.jodit_instance.setEditorValue(i.value)}build(){this.options.format="textarea",super.build(),this.input_type=this.schema.format,this.input.setAttribute("data-schemaformat",this.input_type)}afterInputReady(){let t;window.Jodit?(t=this.expandCallbacks("jodit",c({},{height:300},this.defaults.options.jodit||{},this.options.jodit||{})),this.jodit_instance=new window.Jodit(this.input,t),(this.schema.readOnly||this.schema.readonly||this.schema.template)&&this.jodit_instance.setReadOnly(!0),this.jodit_instance.events.on("change",()=>{this.value=this.jodit_instance.getEditorValue(),this.is_dirty=!0,this.onChange(!0)}),this.theme.afterInputReady(this.input)):super.afterInputReady()}getNumColumns(){return 6}enable(){!this.always_disabled&&this.jodit_instance&&this.jodit_instance.setReadOnly(!1),super.enable()}disable(t){this.jodit_instance&&this.jodit_instance.setReadOnly(!0),super.disable(t)}destroy(){this.jodit_instance&&(this.jodit_instance.destruct(),this.jodit_instance=null),super.destroy()}},multiple:class extends _{register(){if(this.editors){for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].unregister();this.editors[this.type]&&this.editors[this.type].register()}super.register()}unregister(){if(super.unregister(),this.editors)for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].unregister()}getNumColumns(){return this.editors[this.type]?Math.max(this.editors[this.type].getNumColumns(),4):4}enable(){if(!this.always_disabled){if(this.editors)for(let t=0;t<this.editors.length;t++)this.editors[t]&&this.editors[t].enable();this.switcher.disabled=!1,super.enable()}}disable(t){if(t&&(this.always_disabled=!0),this.editors)for(let e=0;e<this.editors.length;e++)this.editors[e]&&this.editors[e].disable(t);this.switcher.disabled=!0,super.disable()}switchEditor(t){this.editors[t]||this.buildChildEditor(t);const e=this.getValue();this.type=t,this.register(),this.editors.forEach((t,s)=>{t&&(this.type===s?(this.keep_values&&t.setValue(e,!0),t.container.style.display=""):t.container.style.display="none")}),this.refreshValue(),this.refreshHeaderText()}buildChildEditor(t){const e=this.types[t],s=this.theme.getChildEditorHolder();let i;this.editor_holder.appendChild(s),"string"==typeof e?(i=c({},this.schema),i.type=e):(i=c({},this.schema,e),i=this.jsoneditor.expandRefs(i),e&&e.required&&Array.isArray(e.required)&&this.schema.required&&Array.isArray(this.schema.required)&&(i.required=this.schema.required.concat(e.required)));const r=this.jsoneditor.getEditorClass(i);this.editors[t]=this.jsoneditor.createEditor(r,{jsoneditor:this.jsoneditor,schema:i,container:s,path:this.path,parent:this,required:!0}),this.editors[t].preBuild(),this.editors[t].build(),this.editors[t].postBuild(),this.editors[t].header&&(this.editors[t].header.style.display="none"),this.editors[t].option=this.switcher_options[t],s.addEventListener("change_header_text",()=>{this.refreshHeaderText()}),t!==this.type&&(s.style.display="none")}preBuild(){if(this.types=[],this.type=0,this.editors=[],this.validators=[],this.keep_values=!0,void 0!==this.jsoneditor.options.keep_oneof_values&&(this.keep_values=this.jsoneditor.options.keep_oneof_values),void 0!==this.options.keep_oneof_values&&(this.keep_values=this.options.keep_oneof_values),this.schema.oneOf)this.oneOf=!0,this.types=this.schema.oneOf,delete this.schema.oneOf;else if(this.schema.anyOf)this.anyOf=!0,this.types=this.schema.anyOf,delete this.schema.anyOf;else{if(this.schema.type&&"any"!==this.schema.type)Array.isArray(this.schema.type)?this.types=this.schema.type:this.types=[this.schema.type];else if(this.types=["string","number","integer","boolean","object","array","null"],this.schema.disallow){let{disallow:t}=this.schema;"object"==typeof t&&Array.isArray(t)||(t=[t]);const e=[];this.types.forEach(s=>{t.includes(s)||e.push(s)}),this.types=e}delete this.schema.type}this.display_text=this.getDisplayText(this.types)}build(){const{container:t}=this;this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired()),this.container.appendChild(this.header),this.switcher=this.theme.getSwitcher(this.display_text),t.appendChild(this.switcher),this.switcher.addEventListener("change",t=>{t.preventDefault(),t.stopPropagation(),this.switchEditor(this.display_text.indexOf(t.currentTarget.value)),this.onChange(!0)}),this.editor_holder=document.createElement("div"),t.appendChild(this.editor_holder);const e={};this.jsoneditor.options.custom_validators&&(e.custom_validators=this.jsoneditor.options.custom_validators),this.switcher_options=this.theme.getSwitcherOptions(this.switcher),this.types.forEach((t,s)=>{let i;this.editors[s]=!1,"string"==typeof t?(i=c({},this.schema),i.type=t):(i=c({},this.schema,t),t.required&&Array.isArray(t.required)&&this.schema.required&&Array.isArray(this.schema.required)&&(i.required=this.schema.required.concat(t.required))),this.validators[s]=new g(this.jsoneditor,i,e,this.defaults)}),this.switchEditor(0)}onChildEditorChange(t){this.editors[this.type]&&(this.refreshValue(),this.refreshHeaderText()),super.onChildEditorChange()}refreshHeaderText(){const t=this.getDisplayText(this.types);Array.from(this.switcher_options).forEach((e,s)=>{e.textContent=t[s]})}refreshValue(){this.value=this.editors[this.type].getValue()}setValue(t,e){const s=this.type;let i={match:0,extra:0,i:this.type};const r={match:0,i:null};this.validators.forEach((e,s)=>{let o=null;void 0!==this.anyOf&&this.anyOf&&(o=e.fitTest(t),(i.match<o.match||i.match===o.match&&i.extra>o.extra)&&(i=o,i.i=s)),e.validate(t).length||null!==r.i||(r.i=s,null!==o&&(r.match=o.match))});let o=r.i;void 0!==this.anyOf&&this.anyOf&&r.match<i.match&&(o=i.i),null===o&&(o=this.type),this.type=o,this.switcher.value=this.display_text[o];const n=this.type!==s;n&&this.switchEditor(this.type),this.editors[this.type].setValue(t,e),this.refreshValue(),this.onChange(n)}destroy(){this.editors.forEach(t=>{t&&t.destroy()}),this.editor_holder&&this.editor_holder.parentNode&&this.editor_holder.parentNode.removeChild(this.editor_holder),this.switcher&&this.switcher.parentNode&&this.switcher.parentNode.removeChild(this.switcher),super.destroy()}showValidationErrors(t){if(this.oneOf||this.anyOf){const e=this.oneOf?"oneOf":"anyOf";this.editors.forEach((s,i)=>{if(!s)return;const r=`${this.path}.${e}[${i}]`;s.showValidationErrors(t.reduce((t,e)=>{if(e.path===r.substr(0,e.path.length)){const s=c({},e);s.path=this.path+s.path.substr(r.length),t.push(s)}return t},[]))})}else this.editors.forEach(e=>{e&&e.showValidationErrors(t)})}addLinks(){}},multiselect:v,null:class extends _{getValue(){if(this.dependenciesFulfilled)return null}setValue(){this.onChange()}getNumColumns(){return 2}},number:E,object:class extends _{constructor(t,e,s){super(t,e),this.currentDepth=s}getDefault(){return c({},this.schema.default||{})}getChildEditors(){return this.editors}register(){super.register(),this.editors&&Object.values(this.editors).forEach(t=>t.register())}unregister(){super.unregister(),this.editors&&Object.values(this.editors).forEach(t=>t.unregister())}getNumColumns(){return Math.max(Math.min(12,this.maxwidth),3)}enable(){this.always_disabled||(this.editjson_control&&(this.editjson_control.disabled=!1),this.addproperty_button&&(this.addproperty_button.disabled=!1),super.enable(),this.editors&&Object.values(this.editors).forEach(t=>{t.isActive()&&t.enable(),t.optInCheckbox.disabled=!1}))}disable(t){t&&(this.always_disabled=!0),this.editjson_control&&(this.editjson_control.disabled=!0),this.addproperty_button&&(this.addproperty_button.disabled=!0),this.hideEditJSON(),super.disable(),this.editors&&Object.values(this.editors).forEach(e=>{e.isActive()&&e.disable(t),e.optInCheckbox.disabled=!0})}layoutEditors(){let t,e,s;if(!this.row_container)return;this.property_order=Object.keys(this.editors),this.property_order=this.property_order.sort((t,e)=>{let s=this.editors[t].schema.propertyOrder,i=this.editors[e].schema.propertyOrder;return"number"!=typeof s&&(s=1e3),"number"!=typeof i&&(i=1e3),s-i});const i="categories"===this.format,r=[];let o,n=null,a=null;if("grid-strict"===this.format){let i=0;if(o=[],this.property_order.forEach(t=>{const e=this.editors[t];if(e.property_removed)return;const s=e.options.hidden?0:e.options.grid_columns||e.getNumColumns(),n=e.options.hidden?0:e.options.grid_offset||0,a=!e.options.hidden&&(e.options.grid_break||!1),l={key:t,width:s,offset:n,height:e.options.hidden?0:e.container.offsetHeight};o.push(l),r[i]=o,a&&(i++,o=[])}),this.layout===JSON.stringify(r))return!1;for(this.layout=JSON.stringify(r),s=document.createElement("div"),t=0;t<r.length;t++)for(o=this.theme.getGridRow(),s.appendChild(o),e=0;e<r[t].length;e++)n=r[t][e].key,a=this.editors[n],a.options.hidden?a.container.style.display="none":this.theme.setGridColumnSize(a.container,r[t][e].width,r[t][e].offset),o.appendChild(a.container)}else if("grid"===this.format){for(this.property_order.forEach(t=>{const e=this.editors[t];if(e.property_removed)return;let s=!1;const i=e.options.hidden?0:e.options.grid_columns||e.getNumColumns(),o=e.options.hidden?0:e.container.offsetHeight;for(let t=0;t<r.length;t++)r[t].width+i<=12&&(!o||.5*r[t].minh<o&&2*r[t].maxh>o)&&(s=t);!1===s&&(r.push({width:0,minh:999999,maxh:0,editors:[]}),s=r.length-1),r[s].editors.push({key:t,width:i,height:o}),r[s].width+=i,r[s].minh=Math.min(r[s].minh,o),r[s].maxh=Math.max(r[s].maxh,o)}),t=0;t<r.length;t++)if(r[t].width<12){let s=!1,i=0;for(e=0;e<r[t].editors.length;e++)(!1===s||r[t].editors[e].width>r[t].editors[s].width)&&(s=e),r[t].editors[e].width*=12/r[t].width,r[t].editors[e].width=Math.floor(r[t].editors[e].width),i+=r[t].editors[e].width;i<12&&(r[t].editors[s].width+=12-i),r[t].width=12}if(this.layout===JSON.stringify(r))return!1;for(this.layout=JSON.stringify(r),s=document.createElement("div"),t=0;t<r.length;t++)for(o=this.theme.getGridRow(),s.appendChild(o),e=0;e<r[t].editors.length;e++)n=r[t].editors[e].key,a=this.editors[n],a.options.hidden?a.container.style.display="none":this.theme.setGridColumnSize(a.container,r[t].editors[e].width),o.appendChild(a.container)}else{if(s=document.createElement("div"),i){const t=document.createElement("div"),e=this.theme.getTopTabHolder(this.schema.title),s=this.theme.getTopTabContentHolder(e);for(this.property_order.forEach(i=>{const r=this.editors[i];if(r.property_removed)return;const o=this.theme.getTabContent(),n=r.schema&&("object"===r.schema.type||"array"===r.schema.type);o.isObjOrArray=n;const a=this.theme.getGridRow();r.tab||(void 0===this.basicPane?this.addRow(r,e,o):this.addRow(r,e,this.basicPane)),o.id=this.getValidId(r.tab_text.textContent),n?(o.appendChild(a),s.appendChild(o),this.theme.addTopTab(e,r.tab)):(t.appendChild(a),s.childElementCount>0?s.firstChild.isObjOrArray&&(o.appendChild(t),s.insertBefore(o,s.firstChild),this.theme.insertBasicTopTab(r.tab,e),r.basicPane=o):(o.appendChild(t),s.appendChild(o),this.theme.addTopTab(e,r.tab),r.basicPane=o)),r.options.hidden?r.container.style.display="none":this.theme.setGridColumnSize(r.container,12),a.appendChild(r.container),r.rowPane=o});this.tabPanesContainer.firstChild;)this.tabPanesContainer.removeChild(this.tabPanesContainer.firstChild);const i=this.tabs_holder.parentNode;i.removeChild(i.firstChild),i.appendChild(e),this.tabPanesContainer=s,this.tabs_holder=e;const r=this.theme.getFirstTab(this.tabs_holder);return void(r&&p(r,"click"))}this.property_order.forEach(t=>{const e=this.editors[t];e.property_removed||(o=this.theme.getGridRow(),s.appendChild(o),e.options.hidden?e.container.style.display="none":this.theme.setGridColumnSize(e.container,12),o.appendChild(e.container))})}for(;this.row_container.firstChild;)this.row_container.removeChild(this.row_container.firstChild);this.row_container.appendChild(s)}getPropertySchema(t){let e=this.schema.properties[t]||{};e=c({},e);let s=!!this.schema.properties[t];return this.schema.patternProperties&&Object.keys(this.schema.patternProperties).forEach(i=>{new RegExp(i).test(t)&&(e.allOf=e.allOf||[],e.allOf.push(this.schema.patternProperties[i]),s=!0)}),!s&&this.schema.additionalProperties&&"object"==typeof this.schema.additionalProperties&&(e=c({},this.schema.additionalProperties)),e}preBuild(){if(super.preBuild(),this.editors={},this.cached_editors={},this.format=this.options.layout||this.options.object_layout||this.schema.format||this.jsoneditor.options.object_layout||"normal",this.schema.properties=this.schema.properties||{},this.minwidth=0,this.maxwidth=0,this.options.table_row)Object.entries(this.schema.properties).forEach(([t,e])=>{const s=this.jsoneditor.getEditorClass(e);this.editors[t]=this.jsoneditor.createEditor(s,{jsoneditor:this.jsoneditor,schema:e,path:`${this.path}.${t}`,parent:this,compact:!0,required:!0},this.currentDepth+1),this.editors[t].preBuild();const i=this.editors[t].options.hidden?0:this.editors[t].options.grid_columns||this.editors[t].getNumColumns();this.minwidth+=i,this.maxwidth+=i}),this.no_link_holder=!0;else{if(this.options.table)throw new Error("Not supported yet");this.schema.defaultProperties||(this.jsoneditor.options.display_required_only||this.options.display_required_only?this.schema.defaultProperties=Object.keys(this.schema.properties).filter(t=>this.isRequiredObject({key:t,schema:this.schema.properties[t]})):this.schema.defaultProperties=Object.keys(this.schema.properties)),this.maxwidth+=1,this.schema.defaultProperties.forEach(t=>{this.addObjectProperty(t,!0),this.editors[t]&&(this.minwidth=Math.max(this.minwidth,this.editors[t].options.grid_columns||this.editors[t].getNumColumns()),this.maxwidth+=this.editors[t].options.grid_columns||this.editors[t].getNumColumns())})}this.property_order=Object.keys(this.editors),this.property_order=this.property_order.sort((t,e)=>{let s=this.editors[t].schema.propertyOrder,i=this.editors[e].schema.propertyOrder;return"number"!=typeof s&&(s=1e3),"number"!=typeof i&&(i=1e3),s-i})}addTab(t){const e=this.rows[t].schema&&("object"===this.rows[t].schema.type||"array"===this.rows[t].schema.type);this.tabs_holder&&(this.rows[t].tab_text=document.createElement("span"),this.rows[t].tab_text.textContent=e?this.rows[t].getHeaderText():void 0===this.schema.basicCategoryTitle?"Basic":this.schema.basicCategoryTitle,this.rows[t].tab=this.theme.getTopTab(this.rows[t].tab_text,this.getValidId(this.rows[t].tab_text.textContent)),this.rows[t].tab.addEventListener("click",e=>{this.active_tab=this.rows[t].tab,this.refreshTabs(),e.preventDefault(),e.stopPropagation()}))}addRow(t,e,s){const i=this.rows.length,r="object"===t.schema.type||"array"===t.schema.type;this.rows[i]=t,this.rows[i].rowPane=s,r?(this.addTab(i),this.theme.addTopTab(e,this.rows[i].tab)):void 0===this.basicTab?(this.addTab(i),this.basicTab=i,this.basicPane=s,this.theme.addTopTab(e,this.rows[i].tab)):(this.rows[i].tab=this.rows[this.basicTab].tab,this.rows[i].tab_text=this.rows[this.basicTab].tab_text,this.rows[i].rowPane=this.rows[this.basicTab].rowPane)}refreshTabs(t){const e=void 0!==this.basicTab;let s=!1;this.rows.forEach(i=>{i.tab&&i.rowPane&&i.rowPane.parentNode&&(e&&i.tab===this.rows[this.basicTab].tab&&s||(t?i.tab_text.textContent=i.getHeaderText():(e&&i.tab===this.rows[this.basicTab].tab&&(s=!0),i.tab===this.active_tab?this.theme.markTabActive(i):this.theme.markTabInactive(i))))})}build(){const t="categories"===this.format;if(this.rows=[],this.active_tab=null,this.options.table_row)this.editor_holder=this.container,Object.entries(this.editors).forEach(([t,e])=>{const s=this.theme.getTableCell();this.editor_holder.appendChild(s),e.setContainer(s),e.build(),e.postBuild(),e.setOptInCheckbox(e.header),this.editors[t].options.hidden&&(s.style.display="none"),this.editors[t].options.input_width&&(s.style.width=this.editors[t].options.input_width)});else{if(this.options.table)throw new Error("Not supported yet");{this.header="",this.options.compact||(this.header=document.createElement("label"),this.header.textContent=this.getTitle()),this.title=this.theme.getHeader(this.header),this.controls=this.theme.getButtonHolder(),this.controls.style.margin="0 0 0 10px",this.container.appendChild(this.title),this.container.appendChild(this.controls),this.container.style.position="relative",this.editjson_holder=this.theme.getModal(),this.editjson_textarea=this.theme.getTextareaInput(),this.editjson_textarea.style.height="170px",this.editjson_textarea.style.width="300px",this.editjson_textarea.style.display="block",this.editjson_save=this.getButton("Save","save","Save"),this.editjson_save.classList.add("json-editor-btntype-save"),this.editjson_save.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.saveJSON()}),this.editjson_copy=this.getButton("Copy","copy","Copy"),this.editjson_copy.classList.add("json-editor-btntype-copy"),this.editjson_copy.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.copyJSON()}),this.editjson_cancel=this.getButton("Cancel","cancel","Cancel"),this.editjson_cancel.classList.add("json-editor-btntype-cancel"),this.editjson_cancel.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.hideEditJSON()}),this.editjson_holder.appendChild(this.editjson_textarea),this.editjson_holder.appendChild(this.editjson_save),this.editjson_holder.appendChild(this.editjson_copy),this.editjson_holder.appendChild(this.editjson_cancel),this.addproperty_holder=this.theme.getModal(),this.addproperty_list=document.createElement("div"),this.addproperty_list.style.width="295px",this.addproperty_list.style.maxHeight="160px",this.addproperty_list.style.padding="5px 0",this.addproperty_list.style.overflowY="auto",this.addproperty_list.style.overflowX="hidden",this.addproperty_list.style.paddingLeft="5px",this.addproperty_list.setAttribute("class","property-selector"),this.addproperty_add=this.getButton("add","add","add"),this.addproperty_add.classList.add("json-editor-btntype-add"),this.addproperty_input=this.theme.getFormInputField("text"),this.addproperty_input.setAttribute("placeholder","Property name..."),this.addproperty_input.style.width="220px",this.addproperty_input.style.marginBottom="0",this.addproperty_input.style.display="inline-block",this.addproperty_add.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),this.addproperty_input.value){if(this.editors[this.addproperty_input.value])return void window.alert("there is already a property with that name");this.addObjectProperty(this.addproperty_input.value),this.editors[this.addproperty_input.value]&&this.editors[this.addproperty_input.value].disable(),this.onChange(!0)}}),this.addproperty_input.addEventListener("input",t=>{t.target.previousSibling.childNodes.forEach(e=>{e.innerText.includes(t.target.value)?e.style.display="":e.style.display="none"})}),this.addproperty_holder.appendChild(this.addproperty_list),this.addproperty_holder.appendChild(this.addproperty_input),this.addproperty_holder.appendChild(this.addproperty_add);const e=document.createElement("div");e.style.clear="both",this.addproperty_holder.appendChild(e),document.addEventListener("click",this.onOutsideModalClick),this.schema.description&&(this.description=this.theme.getDescription(this.schema.description),this.container.appendChild(this.description)),this.error_holder=document.createElement("div"),this.container.appendChild(this.error_holder),this.editor_holder=this.theme.getIndentedPanel(),this.container.appendChild(this.editor_holder),this.row_container=this.theme.getGridContainer(),t?(this.tabs_holder=this.theme.getTopTabHolder(this.getValidId(this.schema.title)),this.tabPanesContainer=this.theme.getTopTabContentHolder(this.tabs_holder),this.editor_holder.appendChild(this.tabs_holder)):(this.tabs_holder=this.theme.getTabHolder(this.getValidId(this.schema.title)),this.tabPanesContainer=this.theme.getTabContentHolder(this.tabs_holder),this.editor_holder.appendChild(this.row_container)),Object.values(this.editors).forEach(e=>{const s=this.theme.getTabContent(),i=this.theme.getGridColumn(),r=!(!e.schema||"object"!==e.schema.type&&"array"!==e.schema.type);if(s.isObjOrArray=r,t){if(r){const t=this.theme.getGridContainer();t.appendChild(i),s.appendChild(t),this.tabPanesContainer.appendChild(s),this.row_container=t}else void 0===this.row_container_basic&&(this.row_container_basic=this.theme.getGridContainer(),s.appendChild(this.row_container_basic),0===this.tabPanesContainer.childElementCount?this.tabPanesContainer.appendChild(s):this.tabPanesContainer.insertBefore(s,this.tabPanesContainer.childNodes[1])),this.row_container_basic.appendChild(i);this.addRow(e,this.tabs_holder,s),s.id=this.getValidId(e.schema.title)}else this.row_container.appendChild(i);e.setContainer(i),e.build(),e.postBuild(),e.setOptInCheckbox(e.header)}),this.rows[0]&&p(this.rows[0].tab,"click"),this.collapsed=!1,this.collapse_control=this.getButton("","collapse",this.translate("button_collapse")),this.collapse_control.style.margin="0 10px 0 0",this.collapse_control.classList.add("json-editor-btntype-toggle"),this.title.insertBefore(this.collapse_control,this.title.childNodes[0]),this.collapse_control.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.collapsed?(this.editor_holder.style.display="",this.collapsed=!1,this.setButtonText(this.collapse_control,"","collapse",this.translate("button_collapse"))):(this.editor_holder.style.display="none",this.collapsed=!0,this.setButtonText(this.collapse_control,"","expand",this.translate("button_expand")))}),this.options.collapsed&&p(this.collapse_control,"click"),this.schema.options&&void 0!==this.schema.options.disable_collapse?this.schema.options.disable_collapse&&(this.collapse_control.style.display="none"):this.jsoneditor.options.disable_collapse&&(this.collapse_control.style.display="none"),this.editjson_control=this.getButton("JSON","edit","Edit JSON"),this.editjson_control.classList.add("json-editor-btntype-editjson"),this.editjson_control.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.toggleEditJSON()}),this.controls.appendChild(this.editjson_control),this.controls.insertBefore(this.editjson_holder,this.controls.childNodes[0]),this.schema.options&&void 0!==this.schema.options.disable_edit_json?this.schema.options.disable_edit_json&&(this.editjson_control.style.display="none"):this.jsoneditor.options.disable_edit_json&&(this.editjson_control.style.display="none"),this.addproperty_button=this.getButton("Properties","edit_properties",this.translate("button_object_properties")),this.addproperty_button.classList.add("json-editor-btntype-properties"),this.addproperty_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.toggleAddProperty()}),this.controls.appendChild(this.addproperty_button),this.controls.insertBefore(this.addproperty_holder,this.controls.childNodes[1]),this.refreshAddProperties(),this.deactivateNonRequiredProperties()}}this.options.table_row?(this.editor_holder=this.container,this.property_order.forEach(t=>{this.editor_holder.appendChild(this.editors[t].container)})):(this.layoutEditors(),this.layoutEditors())}deactivateNonRequiredProperties(){(this.jsoneditor.options.show_opt_in||this.options.show_opt_in)&&Object.entries(this.editors).forEach(([t,e])=>{this.isRequiredObject(e)||this.editors[t].deactivate()})}showEditJSON(){this.editjson_holder&&(this.hideAddProperty(),this.editjson_holder.style.left=this.editjson_control.offsetLeft+"px",this.editjson_holder.style.top=this.editjson_control.offsetTop+this.editjson_control.offsetHeight+"px",this.editjson_textarea.value=JSON.stringify(this.getValue(),null,2),this.disable(),this.editjson_holder.style.display="",this.editjson_control.disabled=!1,this.editing_json=!0)}hideEditJSON(){this.editjson_holder&&this.editing_json&&(this.editjson_holder.style.display="none",this.enable(),this.editing_json=!1)}copyJSON(){if(!this.editjson_holder)return;const t=document.createElement("textarea");t.value=this.editjson_textarea.value,t.setAttribute("readonly",""),t.style.position="absolute",t.style.left="-9999px",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}saveJSON(){if(this.editjson_holder)try{const t=JSON.parse(this.editjson_textarea.value);this.setValue(t),this.hideEditJSON(),this.onChange(!0)}catch(t){throw window.alert("invalid JSON"),t}}toggleEditJSON(){this.editing_json?this.hideEditJSON():this.showEditJSON()}insertPropertyControlUsingPropertyOrder(t,e,s){let i;this.schema.properties[t]&&(i=this.schema.properties[t].propertyOrder),"number"!=typeof i&&(i=1e3),e.propertyOrder=i;for(let t=0;t<s.childNodes.length;t++){const i=s.childNodes[t];if(e.propertyOrder<i.propertyOrder){this.addproperty_list.insertBefore(e,i),e=null;break}}e&&this.addproperty_list.appendChild(e)}addPropertyCheckbox(t){let e;const s=this.theme.getCheckbox();s.style.width="auto",e=this.schema.properties[t]&&this.schema.properties[t].title?this.schema.properties[t].title:t;const i=this.theme.getCheckboxLabel(e),r=this.theme.getFormControl(i,s);return r.style.paddingBottom=r.style.marginBottom=r.style.paddingTop=r.style.marginTop=0,r.style.height="auto",this.insertPropertyControlUsingPropertyOrder(t,r,this.addproperty_list),s.checked=t in this.editors,s.addEventListener("change",()=>{s.checked?this.addObjectProperty(t):this.removeObjectProperty(t),this.onChange(!0)}),this.addproperty_checkboxes[t]=s,s}showAddProperty(){this.addproperty_holder&&(this.hideEditJSON(),this.addproperty_holder.style.left=this.addproperty_button.offsetLeft+"px",this.addproperty_holder.style.top=this.addproperty_button.offsetTop+this.addproperty_button.offsetHeight+"px",this.disable(),this.adding_property=!0,this.addproperty_button.disabled=!1,this.addproperty_holder.style.display="",this.refreshAddProperties())}hideAddProperty(){this.addproperty_holder&&this.adding_property&&(this.addproperty_holder.style.display="none",this.enable(),this.adding_property=!1)}toggleAddProperty(){this.adding_property?this.hideAddProperty():this.showAddProperty()}removeObjectProperty(t){this.editors[t]&&(this.editors[t].unregister(),delete this.editors[t],this.refreshValue(),this.layoutEditors())}getSchemaOnMaxDepth(t){return Object.keys(t).reduce((e,s)=>{switch(s){case"$ref":return e;case"properties":case"items":return{...e,[s]:{}};case"additionalProperties":return{...e,[s]:!0};default:return{...e,[s]:t[s]}}},{})}addObjectProperty(t,e){if(!this.editors[t]){if(this.cached_editors[t]){if(this.editors[t]=this.cached_editors[t],e)return;this.editors[t].register()}else{if(!(this.canHaveAdditionalProperties()||this.schema.properties&&this.schema.properties[t]))return;const s=this.getPropertySchema(t);"number"!=typeof s.propertyOrder&&(s.propertyOrder=Object.keys(this.editors).length+1e3);const i=this.jsoneditor.getEditorClass(s),{max_depth:r}=this.jsoneditor.options;if(this.editors[t]=this.jsoneditor.createEditor(i,{jsoneditor:this.jsoneditor,schema:r&&this.currentDepth>=r?this.getSchemaOnMaxDepth(s):s,path:`${this.path}.${t}`,parent:this},this.currentDepth+1),this.editors[t].preBuild(),!e){const e=this.theme.getChildEditorHolder();this.editor_holder.appendChild(e),this.editors[t].setContainer(e),this.editors[t].build(),this.editors[t].postBuild(),this.editors[t].setOptInCheckbox(i.header),this.editors[t].activate()}this.cached_editors[t]=this.editors[t]}e||(this.refreshValue(),this.layoutEditors())}}onOutsideModalClick(t){this.addproperty_holder&&!this.addproperty_holder.contains(t.path[0]||t.composedPath()[0])&&this.adding_property&&(t.preventDefault(),t.stopPropagation(),this.toggleAddProperty())}onChildEditorChange(t){this.refreshValue(),super.onChildEditorChange(t)}canHaveAdditionalProperties(){return"boolean"==typeof this.schema.additionalProperties?this.schema.additionalProperties:!this.jsoneditor.options.no_additional_properties}destroy(){Object.values(this.cached_editors).forEach(t=>t.destroy()),this.editor_holder&&(this.editor_holder.innerHTML=""),this.title&&this.title.parentNode&&this.title.parentNode.removeChild(this.title),this.error_holder&&this.error_holder.parentNode&&this.error_holder.parentNode.removeChild(this.error_holder),this.editors=null,this.cached_editors=null,this.editor_holder&&this.editor_holder.parentNode&&this.editor_holder.parentNode.removeChild(this.editor_holder),this.editor_holder=null,document.removeEventListener("click",this.onOutsideModalClick),super.destroy()}getValue(){if(!this.dependenciesFulfilled)return;const t=super.getValue();return t&&(this.jsoneditor.options.remove_empty_properties||this.options.remove_empty_properties)&&Object.keys(t).forEach(e=>{var s;(void 0===(s=t[e])||""===s||s===Object(s)&&0===Object.keys(s).length&&s.constructor===Object)&&delete t[e]}),t}refreshValue(){this.value={},Object.keys(this.editors).forEach(t=>{this.editors[t].isActive()&&(this.value[t]=this.editors[t].getValue())}),this.adding_property&&this.refreshAddProperties()}refreshAddProperties(){if(this.options.disable_properties||!1!==this.options.disable_properties&&this.jsoneditor.options.disable_properties)return void(this.addproperty_button.style.display="none");let t=!1,e=0,s=!1;Object.keys(this.editors).forEach(t=>e++),t=this.canHaveAdditionalProperties()&&!(void 0!==this.schema.maxProperties&&e>=this.schema.maxProperties),this.addproperty_checkboxes&&(this.addproperty_list.innerHTML=""),this.addproperty_checkboxes={},Object.keys(this.cached_editors).forEach(i=>{this.addPropertyCheckbox(i),this.isRequiredObject(this.cached_editors[i])&&i in this.editors&&(this.addproperty_checkboxes[i].disabled=!0),void 0!==this.schema.minProperties&&e<=this.schema.minProperties?(this.addproperty_checkboxes[i].disabled=this.addproperty_checkboxes[i].checked,this.addproperty_checkboxes[i].checked||(s=!0)):i in this.editors?s=!0:t||u(this.schema.properties,i)?(this.addproperty_checkboxes[i].disabled=!1,s=!0):this.addproperty_checkboxes[i].disabled=!0}),this.canHaveAdditionalProperties()&&(s=!0),Object.keys(this.schema.properties).forEach(t=>{this.cached_editors[t]||(s=!0,this.addPropertyCheckbox(t))}),s?this.canHaveAdditionalProperties()?this.addproperty_add.disabled=!t:(this.addproperty_add.style.display="none",this.addproperty_input.style.display="none"):(this.hideAddProperty(),this.addproperty_button.style.display="none")}isRequiredObject(t){if(t)return"boolean"==typeof t.schema.required?t.schema.required:Array.isArray(this.schema.required)?this.schema.required.includes(t.key):!!this.jsoneditor.options.required_by_default}setValue(t,e){("object"!=typeof(t=t||{})||Array.isArray(t))&&(t={}),Object.entries(this.cached_editors).forEach(([s,i])=>{void 0!==t[s]?(this.addObjectProperty(s),i.setValue(t[s],e)):e||this.isRequiredObject(i)?i.setValue(i.getDefault(),e):this.removeObjectProperty(s)}),Object.entries(t).forEach(([t,s])=>{this.cached_editors[t]||(this.addObjectProperty(t),this.editors[t]&&this.editors[t].setValue(s,e))}),this.refreshValue(),this.layoutEditors(),this.onChange()}showValidationErrors(t){const e=[],s=[];t.forEach(t=>{t.path===this.path?e.push(t):s.push(t)}),this.error_holder&&(e.length?(this.error_holder.innerHTML="",this.error_holder.style.display="",e.forEach(t=>{t.errorcount&&t.errorcount>1&&(t.message+=` (${t.errorcount} errors)`),this.error_holder.appendChild(this.theme.getErrorMessage(t.message))})):this.error_holder.style.display="none"),this.options.table_row&&(e.length?this.theme.addTableRowError(this.container):this.theme.removeTableRowError(this.container)),Object.values(this.editors).forEach(t=>{t.showValidationErrors(s)})}},radio:class extends x{preBuild(){this.schema.required=!0,super.preBuild()}build(){this.label="",this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options.compact&&this.container.classList.add("compact"),this.radioContainer=document.createElement("div"),this.radioGroup=[];const t=t=>{this.setValue(t.currentTarget.value),this.onChange(!0)};for(let e=0;e<this.enum_values.length;e++){this.input=this.theme.getFormRadio({name:this.formname,id:`${this.formname}[${e}]`,value:this.enum_values[e]}),this.setInputAttributes(["id","value","name"]),this.input.addEventListener("change",t,!1),this.radioGroup.push(this.input);const s=this.theme.getFormRadioLabel(this.enum_display[e]);s.htmlFor=this.input.id;const i=this.theme.getFormRadioControl(s,this.input,!("horizontal"!==this.options.layout&&!this.options.compact));this.radioContainer.appendChild(i)}if(this.schema.readOnly||this.schema.readonly){this.always_disabled=!0;for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!0;this.radioContainer.classList.add("readonly")}const e=this.theme.getContainer();e.appendChild(this.radioContainer),e.dataset.containerFor="radio",this.input=e,this.control=this.theme.getFormControl(this.label,e,this.description,this.infoButton),this.container.appendChild(this.control),window.requestAnimationFrame(()=>{this.input.parentNode&&this.afterInputReady()})}enable(){if(!this.always_disabled){for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!1;this.radioContainer.classList.remove("readonly"),super.enable()}}disable(t){t&&(this.always_disabled=!0);for(let t=0;t<this.radioGroup.length;t++)this.radioGroup[t].disabled=!0;this.radioContainer.classList.add("readonly"),super.disable()}destroy(){this.radioContainer.parentNode&&this.radioContainer.parentNode.parentNode&&this.radioContainer.parentNode.parentNode.removeChild(this.radioContainer.parentNode),this.label&&this.label.parentNode&&this.label.parentNode.removeChild(this.label),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),super.destroy()}getNumColumns(){return 2}setValue(t){for(let e=0;e<this.radioGroup.length;e++)if(this.radioGroup[e].value===t){this.radioGroup[e].checked=!0,this.value=t,this.onChange();break}}},sceditor:class extends y{setValue(t,e,s){const i=super.setValue(t,e,s);void 0!==i&&i.changed&&this.sceditor_instance&&this.sceditor_instance.val(i.value)}build(){this.options.format="textarea",super.build(),this.input_type=this.schema.format,this.input.setAttribute("data-schemaformat",this.input_type)}afterInputReady(){if(window.sceditor){const t=this.expandCallbacks("sceditor",c({},{format:this.input_type,emoticonsEnabled:!1,width:"100%",height:300,readOnly:this.schema.readOnly||this.schema.readonly||this.schema.template},this.defaults.options.sceditor||{},this.options.sceditor||{},{element:this.input})),e=window.sceditor.instance(this.input);void 0===e&&window.sceditor.create(this.input,t),this.sceditor_instance=e||window.sceditor.instance(this.input),this.sceditor_instance.blur(()=>{this.value=this.sceditor_instance.val(),this.sceditor_instance.updateOriginal(),this.is_dirty=!0,this.onChange(!0)}),this.theme.afterInputReady(this.input)}else super.afterInputReady()}getNumColumns(){return 6}enable(){!this.always_disabled&&this.sceditor_instance&&this.sceditor_instance.readOnly(!1),super.enable()}disable(t){this.sceditor_instance&&this.sceditor_instance.readOnly(!0),super.disable(t)}destroy(){this.sceditor_instance&&(this.sceditor_instance.destroy(),this.sceditor_instance=null),super.destroy()}},select:x,select2:class extends x{setValue(t,e){if(this.select2_instance){e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0);const s=this.updateValue(t);this.input.value=s,this.select2v4?this.select2_instance.val(s).trigger("change"):this.select2_instance.select2("val",s),this.onChange(!0)}else super.setValue(t,e)}afterInputReady(){if(window.jQuery&&window.jQuery.fn&&window.jQuery.fn.select2&&!this.select2_instance){const t=this.expandCallbacks("select2",c({},this.defaults.options.select2||{},this.options.select2||{}));this.newEnumAllowed=t.tags=!!t.tags&&"string"===this.schema.type,this.select2_instance=window.jQuery(this.input).select2(t),this.select2v4=u(this.select2_instance.select2,"amd"),this.selectChangeHandler=()=>{const t=this.select2v4?this.select2_instance.val():this.select2_instance.select2("val");this.updateValue(t),this.onChange(!0)},this.select2_instance.on("change",this.selectChangeHandler),this.select2_instance.on("select2-blur",this.selectChangeHandler)}super.afterInputReady()}updateValue(t){let e=this.enum_values[0];return t=this.typecast(t||""),this.enum_values.includes(t)?e=t:this.newEnumAllowed&&(e=this.addNewOption(t)?t:e),this.value=e,e}addNewOption(t){const e=this.typecast(t);let s,i=!1;return this.enum_values.includes(e)||""===e||(this.enum_options.push(""+e),this.enum_display.push(""+e),this.enum_values.push(e),this.schema.enum.push(e),s=this.input.querySelector(`option[value="${e}"]`),s?s.removeAttribute("data-select2-tag"):this.input.appendChild(new Option(e,e,!1,!1)).trigger("change"),i=!0),i}enable(){this.always_disabled||this.select2_instance&&(this.select2v4?this.select2_instance.prop("disabled",!1):this.select2_instance.select2("enable",!0)),super.enable()}disable(t){this.select2_instance&&(this.select2v4?this.select2_instance.prop("disabled",!0):this.select2_instance.select2("enable",!1)),super.disable(t)}destroy(){this.select2_instance&&(this.select2_instance.select2("destroy"),this.select2_instance=null),super.destroy()}},selectize:class extends x{setValue(t,e){if(this.selectize_instance){e?this.is_dirty=!1:"change"===this.jsoneditor.options.show_errors&&(this.is_dirty=!0);const s=this.updateValue(t);this.input.value=s,this.selectize_instance.clear(!0),this.selectize_instance.setValue(s),this.onChange(!0)}else super.setValue(t,e)}afterInputReady(){if(window.jQuery&&window.jQuery.fn&&window.jQuery.fn.selectize&&!this.selectize_instance){const t=this.expandCallbacks("selectize",c({},this.defaults.options.selectize||{},this.options.selectize||{}));this.newEnumAllowed=t.create=!!t.create&&"string"===this.schema.type,this.selectize_instance=window.jQuery(this.input).selectize(t)[0].selectize,this.control.removeEventListener("change",this.multiselectChangeHandler),this.multiselectChangeHandler=t=>{this.updateValue(t),this.onChange(!0)},this.selectize_instance.on("change",this.multiselectChangeHandler)}super.afterInputReady()}updateValue(t){let e=this.enum_values[0];return t=this.typecast(t||""),this.enum_values.includes(t)?e=t:this.newEnumAllowed&&(e=this.addNewOption(t)?t:e),this.value=e,e}addNewOption(t){const e=this.typecast(t);let s=!1;return this.enum_values.includes(e)||""===e||(this.enum_options.push(""+e),this.enum_display.push(""+e),this.enum_values.push(e),this.schema.enum.push(e),this.selectize_instance.addItem(e),this.selectize_instance.refreshOptions(!1),s=!0),s}onWatchedFieldChange(){super.onWatchedFieldChange(),this.selectize_instance&&(this.selectize_instance.clear(!0),this.selectize_instance.clearOptions(!0),this.enum_options.forEach((t,e)=>{this.selectize_instance.addOption({value:t,text:this.enum_display[e]})}),this.selectize_instance.addItem(""+this.value,!0))}enable(){!this.always_disabled&&this.selectize_instance&&this.selectize_instance.unlock(),super.enable()}disable(t){this.selectize_instance&&this.selectize_instance.lock(),super.disable(t)}destroy(){this.selectize_instance&&(this.selectize_instance.destroy(),this.selectize_instance=null),super.destroy()}},signature:class extends y{build(){this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description));const t=this.formname.replace(/\W/g,"");if("function"==typeof SignaturePad){this.input=this.theme.getFormInputField("hidden"),this.container.appendChild(this.input);const e=document.createElement("div");e.classList.add("signature-container");const s=document.createElement("canvas");s.setAttribute("name",t),s.classList.add("signature"),e.appendChild(s),this.signaturePad=new window.SignaturePad(s,{onEnd(){this.signaturePad.isEmpty()?this.input.value="":this.input.value=this.signaturePad.toDataURL(),this.is_dirty=!0,this.refreshValue(),this.watch_listener(),this.jsoneditor.notifyWatchers(this.path),this.parent?this.parent.onChildEditorChange(this):this.jsoneditor.onChange()}});const i=document.createElement("div"),r=document.createElement("button");r.classList.add("tiny","button"),r.innerHTML="Clear signature",i.appendChild(r),e.appendChild(i),this.options.compact&&this.container.setAttribute("class",this.container.getAttribute("class")+" compact"),(this.schema.readOnly||this.schema.readonly)&&(this.always_disabled=!0,Array.from(this.inputs).forEach(t=>{s.setAttribute("readOnly","readOnly"),t.disabled=!0})),r.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.signaturePad.clear(),this.signaturePad.strokeEnd()}),this.control=this.theme.getFormControl(this.label,e,this.description),this.container.appendChild(this.control),this.refreshValue(),s.width=e.offsetWidth,this.options&&this.options.canvas_height?s.height=this.options.canvas_height:s.height="300"}else{const t=document.createElement("p");t.innerHTML="Signature pad is not available, please include SignaturePad from https://github.com/szimek/signature_pad",this.container.appendChild(t)}}setValue(t){if("function"==typeof SignaturePad){const e=this.sanitize(t);if(this.value===e)return;return this.value=e,this.input.value=this.value,this.signaturePad.clear(),t&&""!==t&&this.signaturePad.fromDataURL(t),this.watch_listener(),this.jsoneditor.notifyWatchers(this.path),!1}}destroy(){this.signaturePad.off(),delete this.signaturePad}},simplemde:class extends y{setValue(t,e,s){const i=super.setValue(t,e,s);void 0!==i&&i.changed&&this.simplemde_instance&&this.simplemde_instance.value(i.value)}build(){this.options.format="textarea",super.build(),this.input_type=this.schema.format,this.input.setAttribute("data-schemaformat",this.input_type)}afterInputReady(){let t;window.SimpleMDE?(t=this.expandCallbacks("simplemde",c({},{height:300},this.defaults.options.simplemde||{},this.options.simplemde||{},{element:this.input})),this.simplemde_instance=new window.SimpleMDE(t),(this.schema.readOnly||this.schema.readonly||this.schema.template)&&(this.simplemde_instance.codemirror.options.readOnly=!0),this.simplemde_instance.codemirror.on("change",()=>{this.value=this.simplemde_instance.value(),this.is_dirty=!0,this.onChange(!0)}),t.autorefresh&&this.startListening(this.simplemde_instance.codemirror,this.simplemde_instance.codemirror.state.autoRefresh={delay:250}),this.theme.afterInputReady(this.input)):super.afterInputReady()}getNumColumns(){return 6}enable(){!this.always_disabled&&this.simplemde_instance&&(this.simplemde_instance.codemirror.options.readOnly=!1),super.enable()}disable(t){this.simplemde_instance&&(this.simplemde_instance.codemirror.options.readOnly=!0),super.disable(t)}destroy(){this.simplemde_instance&&(this.simplemde_instance.toTextArea(),this.simplemde_instance=null),super.destroy()}startListening(t,e){function s(){t.display.wrapper.offsetHeight?(this.stopListening(t,e),t.display.lastWrapHeight!==t.display.wrapper.clientHeight&&t.refresh()):e.timeout=window.setTimeout(s,e.delay)}e.timeout=window.setTimeout(s,e.delay),e.hurry=()=>{window.clearTimeout(e.timeout),e.timeout=window.setTimeout(s,50)},t.on(window,"mouseup",e.hurry),t.on(window,"keyup",e.hurry)}stopListening(t,e){window.clearTimeout(e.timeout),t.off(window,"mouseup",e.hurry),t.off(window,"keyup",e.hurry)}},starrating:j,string:y,table:class extends w{register(){if(super.register(),this.rows)for(let t=0;t<this.rows.length;t++)this.rows[t].register()}unregister(){if(super.unregister(),this.rows)for(let t=0;t<this.rows.length;t++)this.rows[t].unregister()}getNumColumns(){return Math.max(Math.min(12,this.width),3)}preBuild(){const t=this.jsoneditor.expandRefs(this.schema.items||{});this.item_title=t.title||"row",this.item_default=t.default||null,this.item_has_child_editors=t.properties||t.items,this.width=12,super.preBuild()}build(){this.table=this.theme.getTable(),this.container.appendChild(this.table),this.thead=this.theme.getTableHead(),this.table.appendChild(this.thead),this.header_row=this.theme.getTableRow(),this.thead.appendChild(this.header_row),this.row_holder=this.theme.getTableBody(),this.table.appendChild(this.row_holder);const t=this.getElementEditor(0,!0);if(this.item_default=t.getDefault(),this.width=t.getNumColumns()+2,this.options.compact?(this.panel=document.createElement("div"),this.container.appendChild(this.panel)):(this.header=document.createElement("label"),this.header.textContent=this.getTitle(),this.title=this.theme.getHeader(this.header),this.container.appendChild(this.title),this.title_controls=this.theme.getHeaderButtonHolder(),this.title.appendChild(this.title_controls),this.schema.description&&(this.description=this.theme.getDescription(this.schema.description),this.container.appendChild(this.description)),this.panel=this.theme.getIndentedPanel(),this.container.appendChild(this.panel),this.error_holder=document.createElement("div"),this.panel.appendChild(this.error_holder)),this.panel.appendChild(this.table),this.controls=this.theme.getButtonHolder(),this.panel.appendChild(this.controls),this.item_has_child_editors){const e=t.getChildEditors(),s=t.property_order||Object.keys(e);for(let t=0;t<s.length;t++){const i=this.theme.getTableHeaderCell(e[s[t]].getTitle());e[s[t]].options.hidden&&(i.style.display="none"),this.header_row.appendChild(i)}}else this.header_row.appendChild(this.theme.getTableHeaderCell(this.item_title));t.destroy(),this.row_holder.innerHTML="",this.controls_header_cell=this.theme.getTableHeaderCell(" "),this.header_row.appendChild(this.controls_header_cell),this.addControls()}onChildEditorChange(t){this.refreshValue(),super.onChildEditorChange()}getItemDefault(){return c({},{default:this.item_default}).default}getItemTitle(){return this.item_title}getElementEditor(t,e){const s=c({},this.schema.items),i=this.jsoneditor.getEditorClass(s,this.jsoneditor),r=this.row_holder.appendChild(this.theme.getTableRow());let o=r;this.item_has_child_editors||(o=this.theme.getTableCell(),r.appendChild(o));const n=this.jsoneditor.createEditor(i,{jsoneditor:this.jsoneditor,schema:s,container:o,path:`${this.path}.${t}`,parent:this,compact:!0,table_row:!0});return n.preBuild(),e||(n.build(),n.postBuild(),n.controls_cell=r.appendChild(this.theme.getTableCell()),n.row=r,n.table_controls=this.theme.getButtonHolder(),n.controls_cell.appendChild(n.table_controls),n.table_controls.style.margin=0,n.table_controls.style.padding=0),n}destroy(){this.innerHTML="",this.title&&this.title.parentNode&&this.title.parentNode.removeChild(this.title),this.description&&this.description.parentNode&&this.description.parentNode.removeChild(this.description),this.row_holder&&this.row_holder.parentNode&&this.row_holder.parentNode.removeChild(this.row_holder),this.table&&this.table.parentNode&&this.table.parentNode.removeChild(this.table),this.panel&&this.panel.parentNode&&this.panel.parentNode.removeChild(this.panel),this.rows=this.title=this.description=this.row_holder=this.table=this.panel=null,super.destroy()}setValue(t=[],e){if(this.schema.minItems)for(;t.length<this.schema.minItems;)t.push(this.getItemDefault());if(this.schema.maxItems&&t.length>this.schema.maxItems&&(t=t.slice(0,this.schema.maxItems)),JSON.stringify(t)===this.serialized)return;let s=!1;t.forEach((t,e)=>{this.rows[e]?this.rows[e].setValue(t):(this.addRow(t),s=!0)});for(let e=t.length;e<this.rows.length;e++){const t=this.rows[e].container;this.item_has_child_editors||this.rows[e].row.parentNode.removeChild(this.rows[e].row),this.rows[e].destroy(),t.parentNode&&t.parentNode.removeChild(t),this.rows[e]=null,s=!0}this.rows=this.rows.slice(0,t.length),this.refreshValue(),(s||e)&&this.refreshRowButtons(),this.onChange()}refreshRowButtons(){const t=this.schema.minItems&&this.schema.minItems>=this.rows.length,e=this.schema.maxItems&&this.schema.maxItems<=this.rows.length;let s=!1;this.rows.forEach((i,r)=>{i.delete_button&&(t?i.delete_button.style.display="none":(s=!0,i.delete_button.style.display="")),i.copy_button&&(e?i.copy_button.style.display="none":(s=!0,i.copy_button.style.display="")),i.moveup_button&&(0===r?i.moveup_button.style.display="none":(s=!0,i.moveup_button.style.display="")),i.movedown_button&&(r===this.rows.length-1?i.movedown_button.style.display="none":(s=!0,i.movedown_button.style.display=""))}),this.rows.forEach(t=>{t.controls_cell.style.display=s?"":"none"}),this.controls_header_cell.style.display=s?"":"none",this.value.length?this.table.style.display="":this.table.style.display="none";let i=!1;e||this.hide_add_button?this.add_row_button.style.display="none":(this.add_row_button.style.display="",i=!0),!this.value.length||t||this.hide_delete_last_row_buttons?this.delete_last_row_button.style.display="none":(this.delete_last_row_button.style.display="",i=!0),this.value.length<=1||t||this.hide_delete_all_rows_buttons?this.remove_all_rows_button.style.display="none":(this.remove_all_rows_button.style.display="",i=!0),this.controls.style.display=i?"":"none"}refreshValue(){this.value=[],this.rows.forEach((t,e)=>{this.value[e]=t.getValue()}),this.serialized=JSON.stringify(this.value)}addRow(t){const e=this.rows.length;this.rows[e]=this.getElementEditor(e);const s=this.rows[e].table_controls;this.hide_delete_buttons||(this.rows[e].delete_button=this.getButton("","delete",this.translate("button_delete_row_title_short")),this.rows[e].delete_button.classList.add("delete","json-editor-btntype-delete"),this.rows[e].delete_button.setAttribute("data-i",e),this.rows[e].delete_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue();s.splice(e,1),this.setValue(s),this.onChange(!0),this.jsoneditor.trigger("deleteRow",this.rows[e])}),s.appendChild(this.rows[e].delete_button)),this.show_copy_button&&(this.rows[e].copy_button=this.getButton("","copy",this.translate("button_copy_row_title_short")),this.rows[e].copy_button.classList.add("copy","json-editor-btntype-copy"),this.rows[e].copy_button.setAttribute("data-i",e),this.rows[e].copy_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue();s.splice(e+1,0,s[e]),this.setValue(s),this.onChange(!0),this.jsoneditor.trigger("copyRow",this.rows[e+1])}),s.appendChild(this.rows[e].copy_button)),this.hide_move_buttons||(this.rows[e].moveup_button=this.getButton("","moveup",this.translate("button_move_up_title")),this.rows[e].moveup_button.classList.add("moveup","json-editor-btntype-move"),this.rows[e].moveup_button.setAttribute("data-i",e),this.rows[e].moveup_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue();s.splice(e-1,0,s.splice(e,1)[0]),this.setValue(s),this.onChange(!0),this.jsoneditor.trigger("moveRow",this.rows[e-1])}),s.appendChild(this.rows[e].moveup_button)),this.hide_move_buttons||(this.rows[e].movedown_button=this.getButton("","movedown",this.translate("button_move_down_title")),this.rows[e].movedown_button.classList.add("movedown","json-editor-btntype-move"),this.rows[e].movedown_button.setAttribute("data-i",e),this.rows[e].movedown_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=1*t.currentTarget.getAttribute("data-i"),s=this.getValue();s.splice(e+1,0,s.splice(e,1)[0]),this.setValue(s),this.onChange(!0),this.jsoneditor.trigger("moveRow",this.rows[e+1])}),s.appendChild(this.rows[e].movedown_button)),t&&this.rows[e].setValue(t)}addControls(){this.collapsed=!1,this.toggle_button=this.getButton("","collapse",this.translate("button_collapse")),this.toggle_button.classList.add("json-editor-btntype-toggle"),this.toggle_button.style.margin="0 10px 0 0",this.title_controls&&(this.title.insertBefore(this.toggle_button,this.title.childNodes[0]),this.toggle_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),this.collapsed?(this.collapsed=!1,this.panel.style.display="",this.setButtonText(t.currentTarget,"","collapse",this.translate("button_collapse"))):(this.collapsed=!0,this.panel.style.display="none",this.setButtonText(t.currentTarget,"","expand",this.translate("button_expand")))}),this.options.collapsed&&p(this.toggle_button,"click"),this.schema.options&&void 0!==this.schema.options.disable_collapse?this.schema.options.disable_collapse&&(this.toggle_button.style.display="none"):this.jsoneditor.options.disable_collapse&&(this.toggle_button.style.display="none")),this.add_row_button=this.getButton(this.getItemTitle(),"add",this.translate("button_add_row_title",[this.getItemTitle()])),this.add_row_button.classList.add("json-editor-btntype-add"),this.add_row_button.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const e=this.addRow();this.refreshValue(),this.refreshRowButtons(),this.onChange(!0),this.jsoneditor.trigger("addRow",e)}),this.controls.appendChild(this.add_row_button),this.delete_last_row_button=this.getButton(this.translate("button_delete_last",[this.getItemTitle()]),"subtract",this.translate("button_delete_last_title",[this.getItemTitle()])),this.delete_last_row_button.classList.add("json-editor-btntype-deletelast"),this.delete_last_row_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;const e=this.getValue(),s=e.pop();this.setValue(e),this.onChange(!0),this.jsoneditor.trigger("deleteRow",s)}),this.controls.appendChild(this.delete_last_row_button),this.remove_all_rows_button=this.getButton(this.translate("button_delete_all"),"delete",this.translate("button_delete_all_title")),this.remove_all_rows_button.classList.add("json-editor-btntype-deleteall"),this.remove_all_rows_button.addEventListener("click",t=>{if(t.preventDefault(),t.stopPropagation(),!this.askConfirmation())return!1;this.setValue([]),this.onChange(!0),this.jsoneditor.trigger("deleteAllRows")}),this.controls.appendChild(this.remove_all_rows_button)}},upload:class extends _{getNumColumns(){return 4}build(){if(this.options.compact||(this.header=this.label=this.theme.getFormInputLabel(this.getTitle(),this.isRequired())),this.schema.description&&(this.description=this.theme.getFormInputDescription(this.schema.description)),this.options.infoText&&(this.infoButton=this.theme.getInfoButton(this.options.infoText)),this.options=this.expandCallbacks("upload",c({},{title:"Browse",icon:"",auto_upload:!1,hide_input:!1,enable_drag_drop:!1,drop_zone_text:"Drag & Drop file here",drop_zone_top:!1,alt_drop_zone:"",mime_type:"",max_upload_size:0,upload_handler:(t,e,s,i)=>{window.alert(`No upload_handler defined for "${t.path}". You must create your own handler to enable upload to server`)}},this.defaults.options.upload||{},this.options.upload||{})),this.options.mime_type=this.options.mime_type?[].concat(this.options.mime_type):[],this.input=this.theme.getFormInputField("hidden"),this.container.appendChild(this.input),!this.schema.readOnly&&!this.schema.readonly){if("function"!=typeof this.options.upload_handler)throw new Error("Upload handler required for upload editor");if(this.uploader=this.theme.getFormInputField("file"),this.uploader.style.display="none",this.options.mime_type.length&&this.uploader.setAttribute("accept",this.options.mime_type),!0===this.options.enable_drag_drop&&!0===this.options.hide_input||(this.clickHandler=t=>{this.uploader.dispatchEvent(new window.MouseEvent("click",{view:window,bubbles:!0,cancelable:!1}))},this.browseButton=this.getButton(this.options.title,this.options.icon,this.options.title),this.browseButton.addEventListener("click",this.clickHandler),this.fileDisplay=this.theme.getFormInputField("input"),this.fileDisplay.setAttribute("readonly",!0),this.fileDisplay.value="No file selected.",this.fileDisplay.addEventListener("dblclick",this.clickHandler),this.fileUploadGroup=this.theme.getInputGroup(this.fileDisplay,[this.browseButton]),this.fileUploadGroup||(this.fileUploadGroup=document.createElement("div"),this.fileUploadGroup.appendChild(this.fileDisplay),this.fileUploadGroup.appendChild(this.browseButton))),!0===this.options.enable_drag_drop){if(""!==this.options.alt_drop_zone){if(this.altDropZone=document.querySelector(this.options.alt_drop_zone),!this.altDropZone)throw new Error(`Error: alt_drop_zone selector "${this.options.alt_drop_zone}" not found!`);this.dropZone=this.altDropZone}else this.dropZone=this.theme.getDropZone(this.options.drop_zone_text);this.dropZone&&(this.dropZone.classList.add("upload-dropzone"),this.dropZone.addEventListener("dblclick",this.clickHandler))}this.uploadHandler=t=>{t.preventDefault(),t.stopPropagation();const e=t.target.files||t.dataTransfer.files;if(e&&e.length)if(0!==this.options.max_upload_size&&e[0].size>this.options.max_upload_size)this.theme.addInputError(this.uploader,"Filesize too large. Max size is "+this.options.max_upload_size);else if(0===this.options.mime_type.length||this.isValidMimeType(e[0].type,this.options.mime_type)){this.fileDisplay&&(this.fileDisplay.value=e[0].name);let t=new window.FileReader;t.onload=s=>{this.preview_value=s.target.result,this.refreshPreview(e),this.onChange(!0),t=null},t.readAsDataURL(e[0])}else this.theme.addInputError(this.uploader,"Wrong file format. Allowed format(s): "+this.options.mime_type.toString())},this.uploader.addEventListener("change",this.uploadHandler),this.dragHandler=t=>{const e=t.dataTransfer.items||t.dataTransfer.files,s=e&&e.length&&(0===this.options.mime_type.length||this.isValidMimeType(e[0].type,this.options.mime_type)),i=t.currentTarget.classList&&t.currentTarget.classList.contains("upload-dropzone")&&s;switch((t.currentTarget===window?"w_":"e_")+t.type){case"w_drop":case"w_dragover":i||(t.dataTransfer.dropEffect="none");break;case"e_dragenter":i?(this.dropZone.classList.add("valid-dropzone"),t.dataTransfer.dropEffect="copy"):this.dropZone.classList.add("invalid-dropzone");break;case"e_dragover":i&&(t.dataTransfer.dropEffect="copy");break;case"e_dragleave":this.dropZone.classList.remove("valid-dropzone","invalid-dropzone");break;case"e_drop":this.dropZone.classList.remove("valid-dropzone","invalid-dropzone"),i&&this.uploadHandler(t)}i||t.preventDefault()},!0===this.options.enable_drag_drop&&(["dragover","drop"].forEach(t=>{window.addEventListener(t,this.dragHandler,!0)}),["dragenter","dragover","dragleave","drop"].forEach(t=>{this.dropZone.addEventListener(t,this.dragHandler,!0)}))}this.preview=document.createElement("div"),this.control=this.input.controlgroup=this.theme.getFormControl(this.label,this.uploader||this.input,this.description,this.infoButton),this.uploader&&(this.uploader.controlgroup=this.control);const t=this.uploader||this.input,e=document.createElement("div");this.dropZone&&!this.altDropZone&&!0===this.options.drop_zone_top&&e.appendChild(this.dropZone),this.fileUploadGroup&&e.appendChild(this.fileUploadGroup),this.dropZone&&!this.altDropZone&&!0!==this.options.drop_zone_top&&e.appendChild(this.dropZone),e.appendChild(this.preview),t.parentNode.insertBefore(e,t.nextSibling),this.container.appendChild(this.control),window.requestAnimationFrame(()=>{this.afterInputReady()})}afterInputReady(){if(this.value){const t=document.createElement("img");t.style.maxWidth="100%",t.style.maxHeight="100px",t.onload=e=>{this.preview.appendChild(t)},t.onerror=t=>{console.error("upload error",t,t.currentTarget)},t.src=this.container.querySelector("a").href}this.theme.afterInputReady(this.input)}refreshPreview(t){if(this.last_preview===this.preview_value)return;if(this.last_preview=this.preview_value,this.preview.innerHTML="",!this.preview_value)return;const e=t[0],s=this.preview_value.match(/^data:([^;,]+)[;,]/);if(e.mimeType=s?s[1]:"unknown",e.size>0){const t=Math.floor(Math.log(e.size)/Math.log(1024));e.formattedSize=`${parseFloat((e.size/1024**t).toFixed(2))} ${["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][t]}`}else e.formattedSize="0 Bytes";const i=this.getButton("Upload","upload","Upload");i.addEventListener("click",t=>{t.preventDefault(),i.setAttribute("disabled","disabled"),this.theme.removeInputError(this.uploader),this.theme.getProgressBar&&(this.progressBar=this.theme.getProgressBar(),this.preview.appendChild(this.progressBar)),this.options.upload_handler(this.path,e,{success(t){this.setValue(t),this.parent?this.parent.onChildEditorChange(this):this.jsoneditor.onChange(),this.progressBar&&this.preview.removeChild(this.progressBar),i.removeAttribute("disabled")},failure(t){this.theme.addInputError(this.uploader,t),this.progressBar&&this.preview.removeChild(this.progressBar),i.removeAttribute("disabled")},updateProgress(t){this.progressBar&&(t?this.theme.updateProgressBar(this.progressBar,t):this.theme.updateProgressBarUnknown(this.progressBar))}})}),this.preview.appendChild(this.theme.getUploadPreview(e,i,this.preview_value)),this.options.auto_upload&&(i.dispatchEvent(new window.MouseEvent("click")),this.preview.removeChild(i))}enable(){this.always_disabled||(this.uploader&&(this.uploader.disabled=!1),super.enable())}disable(t){t&&(this.always_disabled=!0),this.uploader&&(this.uploader.disabled=!0),super.disable()}setValue(t){this.value!==t&&(this.value=t,this.input.value=this.value,this.onChange())}destroy(){!0===this.options.enable_drag_drop&&(["dragover","drop"].forEach(t=>{window.removeEventListener(t,this.dragHandler,!0)}),["dragenter","dragover","dragleave","drop"].forEach(t=>{this.dropZone.removeEventListener(t,this.dragHandler,!0)}),this.dropZone.removeEventListener("dblclick",this.clickHandler),this.dropZone&&this.dropZone.parentNode&&this.dropZone.parentNode.removeChild(this.dropZone)),this.uploader&&this.uploader.parentNode&&(this.uploader.removeEventListener("change",this.uploadHandler),this.uploader.parentNode.removeChild(this.uploader)),this.browseButton&&this.browseButton.parentNode&&(this.browseButton.removeEventListener("click",this.clickHandler),this.browseButton.parentNode.removeChild(this.browseButton)),this.fileDisplay&&this.fileDisplay.parentNode&&(this.fileDisplay.removeEventListener("dblclick",this.clickHandler),this.fileDisplay.parentNode.removeChild(this.fileDisplay)),this.fileUploadGroup&&this.fileUploadGroup.parentNode&&this.fileUploadGroup.parentNode.removeChild(this.fileUploadGroup),this.preview&&this.preview.parentNode&&this.preview.parentNode.removeChild(this.preview),this.header&&this.header.parentNode&&this.header.parentNode.removeChild(this.header),this.input&&this.input.parentNode&&this.input.parentNode.removeChild(this.input),super.destroy()}isValidMimeType(t,e){return e.reduce((e,s)=>e||new RegExp(s.replace(/\*/g,".*"),"gi").test(t),!1)}},uuid:class extends _{preBuild(){super.preBuild(),this.schema.default=this.uuid=this.getUuid(),this.jsoneditor.validator.schema.properties[this.key].pattern=this.schema.pattern="^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",this.schema.options||(this.schema.options={}),this.schema.options.cleave||(this.schema.options.cleave={delimiters:["-"],blocks:[8,4,4,4,12]})}sanitize(t){return this.testUuid(t)||(t=this.uuid),t}setValue(t,e,s){this.testUuid(t)||(t=this.uuid),this.uuid=t,super.setValue(t,e,s)}getUuid(){let t=(new Date).getTime();return"undefined"!=typeof performance&&"function"==typeof performance.now&&(t+=performance.now()),"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const s=(t+16*Math.random())%16|0;return t=Math.floor(t/16),("x"===e?s:3&s|8).toString(16)})}testUuid(t){return/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)}},colorpicker:class extends y{postBuild(){window.Picker&&(this.input.type="text"),this.input.style.padding="3px"}setValue(t,e,s){const i=super.setValue(t,e,s);return this.picker_instance&&this.picker_instance.domElement&&i&&i.changed&&this.picker_instance.setColor(i.value,!0),i}getNumColumns(){return 2}afterInputReady(){super.afterInputReady(),this.createPicker(!0)}disable(){if(super.disable(),this.picker_instance&&this.picker_instance.domElement){this.picker_instance.domElement.style.pointerEvents="none";const t=this.picker_instance.domElement.querySelectorAll("button");for(let e=0;e<t.length;e++)t[e].disabled=!0}}enable(){if(super.enable(),this.picker_instance&&this.picker_instance.domElement){this.picker_instance.domElement.style.pointerEvents="auto";const t=this.picker_instance.domElement.querySelectorAll("button");for(let e=0;e<t.length;e++)t[e].disabled=!1}}destroy(){this.createPicker(!1),super.destroy()}createPicker(t){if(t){if(window.Picker&&!this.picker_instance){const t=this.expandCallbacks("colorpicker",c({},{editor:!1,alpha:!1,color:this.value,popup:"bottom"},this.defaults.options.colorpicker||{},this.options.colorpicker||{},{parent:this.container})),e=t=>{const e=this.picker_instance.settings.editorFormat,s=this.picker_instance.settings.alpha;this.setValue("hex"===e?s?t.hex:t.hex.slice(0,7):t[e+(s?"a":"")+"String"])};t.popup||"function"==typeof t.onChange?t.popup&&"function"!=typeof t.onDone&&(t.onDone=e):t.onChange=e,this.picker_instance=new window.Picker(t),t.popup||(this.input.style.display="none",this.theme.afterInputReady(this.picker_instance.domElement))}}else this.picker_instance&&(this.picker_instance.destroy(),this.picker_instance=null,this.input.style.display="")}}},T={default:()=>({compile(t){const e=t.match(/{{\s*([a-zA-Z0-9\-_ .]+)\s*}}/g),s=e&&e.length;if(!s)return()=>t;const i=[],r=t=>{let s=e[t].replace(/[{}]+/g,"").trim().split(".");const r=s.length;let o;if(r>1){let e;o=i=>{for(e=i,t=0;t<r&&(e=e[s[t]],e);t++);return e}}else s=s[0],o=t=>t[s];i.push({s:e[t],r:o})};for(var o=0;o<s;o++)r(o);return e=>{let r,n=""+t;for(o=0;o<s;o++)r=i[o],n=n.replace(r.s,r.r(e));return n}}}),ejs:()=>!!window.EJS&&{compile(t){const e=new window.EJS({text:t});return t=>e.render(t)}},handlebars:()=>window.Handlebars,hogan:()=>!!window.Hogan&&{compile(t){const e=window.Hogan.compile(t);return t=>e.render(t)}},lodash:()=>!!window._&&{compile:t=>e=>window._.template(t)(e)},markup:()=>!(!window.Mark||!window.Mark.up)&&{compile:t=>e=>window.Mark.up(t,e)},mustache:()=>!!window.Mustache&&{compile:t=>e=>window.Mustache.render(t,e)},swig:()=>window.swig,underscore:()=>!!window._&&{compile:t=>e=>window._.template(t)(e)}},A={collapse:"",expand:"",delete:"",edit:"",add:"",cancel:"",save:"",moveup:"",movedown:""};class I{constructor(t="",e=A){this.mapping=e,this.icon_prefix=t}getIconClass(t){return this.mapping[t]?this.icon_prefix+this.mapping[t]:null}getIcon(t){const e=this.getIconClass(t);if(!e)return null;const s=document.createElement("i");return s.classList.add(...e.split(" ")),s}}const S={collapse:"chevron-down",expand:"chevron-right",delete:"trash",edit:"pencil",add:"plus",subtract:"minus",cancel:"floppy-remove",save:"floppy-saved",moveup:"arrow-up",moveright:"arrow-right",movedown:"arrow-down",moveleft:"arrow-left",copy:"copy",clear:"remove-circle",time:"time",calendar:"calendar",edit_properties:"list"};const O={collapse:"chevron-down",expand:"chevron-right",delete:"trash",edit:"pencil",add:"plus",subtract:"minus",cancel:"ban-circle",save:"save",moveup:"arrow-up",moveright:"arrow-right",movedown:"arrow-down",moveleft:"arrow-left",copy:"copy",clear:"remove-circle",time:"time",calendar:"calendar",edit_properties:"list"};const B={collapse:"caret-square-o-down",expand:"caret-square-o-right",delete:"times",edit:"pencil",add:"plus",subtract:"minus",cancel:"ban",save:"save",moveup:"arrow-up",moveright:"arrow-right",movedown:"arrow-down",moveleft:"arrow-left",copy:"files-o",clear:"times-circle-o",time:"clock-o",calendar:"calendar",edit_properties:"list"};const N={collapse:"caret-down",expand:"caret-right",delete:"trash",edit:"pen",add:"plus",subtract:"minus",cancel:"ban",save:"save",moveup:"arrow-up",moveright:"arrow-right",movedown:"arrow-down",moveleft:"arrow-left",copy:"copy",clear:"times-circle",time:"clock",calendar:"calendar",edit_properties:"list"};const F={collapse:"triangle-1-s",expand:"triangle-1-e",delete:"trash",edit:"pencil",add:"plusthick",subtract:"minusthick",cancel:"closethick",save:"disk",moveup:"arrowthick-1-n",moveright:"arrowthick-1-e",movedown:"arrowthick-1-s",moveleft:"arrowthick-1-w",copy:"copy",clear:"circle-close",time:"time",calendar:"calendar",edit_properties:"note"};const V={collapse:"arrow-down",expand:"arrow-right",delete:"delete",edit:"edit",add:"plus",subtract:"minus",cancel:"cross",save:"check",moveup:"upward",moveright:"forward",movedown:"downward",moveleft:"back",copy:"copy",clear:"close",time:"time",calendar:"bookmark",edit_properties:"menu"};const H={bootstrap3:class extends I{constructor(){super("glyphicon glyphicon-",S)}},fontawesome3:class extends I{constructor(){super("icon-",O)}},fontawesome4:class extends I{constructor(){super("fa fa-",B)}},fontawesome5:class extends I{constructor(){super("fas fa-",N)}},jqueryui:class extends I{constructor(){super("ui-icon ui-icon-",F)}},spectre:class extends I{constructor(){super("icon icon-",V)}}},R=["matches","webkitMatchesSelector","mozMatchesSelector","msMatchesSelector","oMatchesSelector"].find(t=>t in document.documentElement);class P{constructor(t,e={disable_theme_rules:!1}){this.jsoneditor=t,this.options=e}getContainer(){return document.createElement("div")}getFloatRightLinkHolder(){const t=document.createElement("div");return t.style=t.style||{},t.style.cssFloat="right",t.style.marginLeft="10px",t}getModal(){const t=document.createElement("div");return t.style.backgroundColor="white",t.style.border="1px solid black",t.style.boxShadow="3px 3px black",t.style.position="absolute",t.style.zIndex="10",t.style.display="none",t}getGridContainer(){return document.createElement("div")}getGridRow(){const t=document.createElement("div");return t.classList.add("row"),t}getGridColumn(){return document.createElement("div")}setGridColumnSize(t,e){}getLink(t){const e=document.createElement("a");return e.setAttribute("href","#"),e.appendChild(document.createTextNode(t)),e}disableHeader(t){t.style.color="#ccc"}disableLabel(t){t.style.color="#ccc"}enableHeader(t){t.style.color=""}enableLabel(t){t.style.color=""}getInfoButton(t){const e=document.createElement("span");e.innerText="ⓘ",e.style.fontSize="16px",e.style.fontWeight="bold",e.style.padding=".25rem",e.style.position="relative",e.style.display="inline-block";const s=document.createElement("span");return s.style.fontSize="12px",e.style.fontWeight="normal",s.style["font-family"]="sans-serif",s.style.visibility="hidden",s.style["background-color"]="rgba(50, 50, 50, .75)",s.style.margin="0 .25rem",s.style.color="#FAFAFA",s.style.padding=".5rem 1rem",s.style["border-radius"]=".25rem",s.style.width="20rem",s.style.position="absolute",s.innerText=t,e.onmouseover=()=>{s.style.visibility="visible"},e.onmouseleave=()=>{s.style.visibility="hidden"},e.appendChild(s),e}getFormInputLabel(t,e){const s=document.createElement("label");return s.appendChild(document.createTextNode(t)),e&&s.classList.add("required"),s}getHeader(t){const e=document.createElement("h3");return"string"==typeof t?e.textContent=t:e.appendChild(t),e.style.display="inline-block",e}getCheckbox(){const t=this.getFormInputField("checkbox");return t.style.display="inline-block",t.style.width="auto",t}getCheckboxLabel(t,e){const s=document.createElement("label");return s.appendChild(document.createTextNode(" "+t)),e&&s.classList.add("required"),s}getMultiCheckboxHolder(t,e,s,i){const r=document.createElement("div");return r.classList.add("control-group"),e&&(e.style.display="block",r.appendChild(e),i&&e.appendChild(i)),Object.values(t).forEach(t=>{t.style.display="inline-block",t.style.marginRight="20px",r.appendChild(t)}),s&&r.appendChild(s),r}getFormCheckboxControl(t,e,s){const i=document.createElement("div");return i.appendChild(t),e.style.width="auto",t.insertBefore(e,t.firstChild),s&&this.applyStyles(i,{display:"inline-block",marginRight:"1rem"}),i}getFormRadio(t){const e=this.getFormInputField("radio");for(const s in t)e.setAttribute(s,t[s]);return e.style.display="inline-block",e.style.width="auto",e}getFormRadioLabel(t,e){const s=document.createElement("label");return s.appendChild(document.createTextNode(" "+t)),e&&s.classList.add("required"),s}getFormRadioControl(t,e,s){const i=document.createElement("div");return i.appendChild(t),e.style.width="auto",t.insertBefore(e,t.firstChild),s&&this.applyStyles(i,{display:"inline-block",marginRight:"1rem"}),i}getSelectInput(t,e){const s=document.createElement("select");return t&&this.setSelectOptions(s,t),s}getSwitcher(t){const e=this.getSelectInput(t,!1);return e.style.backgroundColor="transparent",e.style.display="inline-block",e.style.fontStyle="italic",e.style.fontWeight="normal",e.style.height="auto",e.style.marginBottom=0,e.style.marginLeft="5px",e.style.padding="0 0 0 3px",e.style.width="auto",e}getSwitcherOptions(t){return t.getElementsByTagName("option")}setSwitcherOptions(t,e,s){this.setSelectOptions(t,e,s)}setSelectOptions(t,e,s=[]){t.innerHTML="";for(let i=0;i<e.length;i++){const r=document.createElement("option");r.setAttribute("value",e[i]),r.textContent=s[i]||e[i],t.appendChild(r)}}getTextareaInput(){const t=document.createElement("textarea");return t.style=t.style||{},t.style.width="100%",t.style.height="300px",t.style.boxSizing="border-box",t}getRangeInput(t,e,s){const i=this.getFormInputField("range");return i.setAttribute("min",t),i.setAttribute("max",e),i.setAttribute("step",s),i}getRangeOutput(t,e){const s=document.createElement("output");s.value=e||0;const i=t=>{s.value=t.currentTarget.value};return t.addEventListener("change",i,!1),t.addEventListener("input",i,!1),s}getRangeControl(t,e){const s=document.createElement("div");return s.style.textAlign="center",e&&s.appendChild(e),s.appendChild(t),s}getFormInputField(t){const e=document.createElement("input");return e.setAttribute("type",t),e}afterInputReady(t){}getFormControl(t,e,s,i){const r=document.createElement("div");return r.classList.add("form-control"),t&&r.appendChild(t),"checkbox"!==e.type&&"radio"!==e.type||!t?(i&&t&&t.appendChild(i),r.appendChild(e)):(e.style.width="auto",t.insertBefore(e,t.firstChild),i&&t.appendChild(i)),s&&r.appendChild(s),r}getIndentedPanel(){const t=document.createElement("div");return t.style=t.style||{},t.style.paddingLeft="10px",t.style.marginLeft="10px",t.style.borderLeft="1px solid #ccc",t}getTopIndentedPanel(){const t=document.createElement("div");return t.style=t.style||{},t.style.paddingLeft="10px",t.style.marginLeft="10px",t}getChildEditorHolder(){return document.createElement("div")}getDescription(t){const e=document.createElement("p");return window.DOMPurify?e.innerHTML=window.DOMPurify.sanitize(t):e.textContent=this.cleanText(t),e}getCheckboxDescription(t){return this.getDescription(t)}getFormInputDescription(t){return this.getDescription(t)}getButtonHolder(){return document.createElement("span")}getHeaderButtonHolder(){return this.getButtonHolder()}getFormButtonHolder(t){return this.getButtonHolder()}getButton(t,e,s){const i=document.createElement("button");return i.type="button",this.setButtonText(i,t,e,s),i}getFormButton(t,e,s){return this.getButton(t,e,s)}setButtonText(t,e,s,i){for(;t.firstChild;)t.removeChild(t.firstChild);if(s&&(t.appendChild(s),e=" "+e),!this.jsoneditor.options.iconlib||!this.jsoneditor.options.remove_button_labels||!s){const s=document.createElement("span");s.appendChild(document.createTextNode(e)),t.appendChild(s)}i&&t.setAttribute("title",i)}getTable(){return document.createElement("table")}getTableRow(){return document.createElement("tr")}getTableHead(){return document.createElement("thead")}getTableBody(){return document.createElement("tbody")}getTableHeaderCell(t){const e=document.createElement("th");return e.textContent=t,e}getTableCell(){return document.createElement("td")}getErrorMessage(t){const e=document.createElement("p");return e.style=e.style||{},e.style.color="red",e.appendChild(document.createTextNode(t)),e}addInputError(t,e){}removeInputError(t){}addTableRowError(t){}removeTableRowError(t){}getTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<div style='float: left; width: 130px;' class='tabs'></div><div class='content' style='margin-left: 120px;' id='${e}'></div><div style='clear:both;'></div>`,s}getTopTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<div class='tabs' style='margin-left: 10px;'></div><div style='clear:both;'></div><div class='content' id='${e}'></div>`,s}applyStyles(t,e){Object.keys(e).forEach(s=>t.style[s]=e[s])}closest(t,e){for(;t&&t!==document;){if(!t[R])return!1;if(t[R](e))return t;t=t.parentNode}return!1}insertBasicTopTab(t,e){e.firstChild.insertBefore(t,e.firstChild.firstChild)}getTab(t,e){const s=document.createElement("div");return s.appendChild(t),s.id=e,s.style=s.style||{},this.applyStyles(s,{border:"1px solid #ccc",borderWidth:"1px 0 1px 1px",textAlign:"center",lineHeight:"30px",borderRadius:"5px",borderBottomRightRadius:0,borderTopRightRadius:0,fontWeight:"bold",cursor:"pointer"}),s}getTopTab(t,e){const s=document.createElement("div");return s.id=e,s.appendChild(t),s.style=s.style||{},this.applyStyles(s,{float:"left",border:"1px solid #ccc",borderWidth:"1px 1px 0px 1px",textAlign:"center",lineHeight:"30px",borderRadius:"5px",paddingLeft:"5px",paddingRight:"5px",borderBottomRightRadius:0,borderBottomLeftRadius:0,fontWeight:"bold",cursor:"pointer"}),s}getTabContentHolder(t){return t.children[1]}getTopTabContentHolder(t){return t.children[1]}getTabContent(){return this.getIndentedPanel()}getTopTabContent(){return this.getTopIndentedPanel()}markTabActive(t){this.applyStyles(t.tab,{opacity:1,background:"white"}),void 0!==t.rowPane?t.rowPane.style.display="":t.container.style.display=""}markTabInactive(t){this.applyStyles(t.tab,{opacity:.5,background:""}),void 0!==t.rowPane?t.rowPane.style.display="none":t.container.style.display="none"}addTab(t,e){t.children[0].appendChild(e)}addTopTab(t,e){t.children[0].appendChild(e)}getBlockLink(){const t=document.createElement("a");return t.style.display="block",t}getBlockLinkHolder(){return document.createElement("div")}getLinksHolder(){return document.createElement("div")}createMediaLink(t,e,s){t.appendChild(e),s.style.width="100%",t.appendChild(s)}createImageLink(t,e,s){t.appendChild(e),e.appendChild(s)}getFirstTab(t){return t.firstChild.firstChild}getInputGroup(t,e){}cleanText(t){const e=document.createElement("div");return e.innerHTML=t,e.textContent||e.innerText}getDropZone(t){const e=document.createElement("div");return e.setAttribute("data-text",t),e.classList.add("je-dropzone"),e}getUploadPreview(t,e,s){const i=document.createElement("div");if(i.classList.add("je-upload-preview"),"image"===t.mimeType.substr(0,5)){const t=document.createElement("img");t.src=s,i.appendChild(t)}const r=document.createElement("div");r.innerHTML+=`<strong>Name:</strong> ${t.name}<br><strong>Type:</strong> ${t.type}<br><strong>Size:</strong> ${t.formattedSize}`,i.appendChild(r),i.appendChild(e);const o=document.createElement("div");return o.style.clear="left",i.appendChild(o),i}getProgressBar(){const t=document.createElement("progress");return t.setAttribute("max",100),t.setAttribute("value",0),t}updateProgressBar(t,e){t&&t.setAttribute("value",e)}updateProgressBarUnknown(t){t&&t.removeAttribute("value")}}P.rules={".je-upload-preview img":"float:left;margin:0 0.5rem 0.5rem 0;max-width:100%;max-height:100px"};class z extends P{getFormInputLabel(t,e){const s=super.getFormInputLabel(t,e);return s.classList.add("je-form-input-label"),s}getFormInputDescription(t){const e=super.getFormInputDescription(t);return e.classList.add("je-form-input-label"),e}getIndentedPanel(){const t=super.getIndentedPanel();return t.classList.add("je-indented-panel"),t}getTopIndentedPanel(){return this.getIndentedPanel()}getChildEditorHolder(){const t=super.getChildEditorHolder();return t.classList.add("je-child-editor-holder"),t}getHeaderButtonHolder(){const t=this.getButtonHolder();return t.classList.add("je-header-button-holder"),t}getTable(){const t=super.getTable();return t.classList.add("je-table"),t}addInputError(t,e){if(t.style.borderColor="red",t.errmsg)t.errmsg.style.display="block";else{const e=this.closest(t,".form-control");t.errmsg=document.createElement("div"),t.errmsg.setAttribute("class","errmsg"),t.errmsg.style=t.errmsg.style||{},t.errmsg.style.color="red",e.appendChild(t.errmsg)}t.errmsg.innerHTML="",t.errmsg.appendChild(document.createTextNode(e))}removeInputError(t){t.style&&(t.style.borderColor=""),t.errmsg&&(t.errmsg.style.display="none")}}z.rules={"je-form-input-label":"display:block;margin-bottom:3px;font-weight:bold","je-form-input-description":"display:inline-block;margin:0;font-size:0.8em;font-style:italic","je-indented-panel":"padding:5px;margin:10px;border-radius:3px;border:1px%20solid%20%23ddd","je-child-editor-holder":"margin-bottom:8px","je-header-button-holder":"display:inline-block;margin-left:10px;font-size:0.8em;vertical-align:middle","je-table":"margin-bottom:5px;border-bottom:1px%20solid%20%23ccc",".je-upload-preview img":"float:left;margin:0%200.5rem%200.5rem%200;max-width:100%25;max-height:5rem",".je-dropzone":"position:relative;margin:0.5rem%200;border:2px%20dashed%20black;width:100%25;height:60px;background:teal;transition:all%200.5s",".je-dropzone:before":"position:absolute;content:attr(data-text);color:rgba(0%2C%200%2C%200%2C%200.6);left:50%25;top:50%25;transform:translate(-50%25%2C%20-50%25)",".je-dropzone.valid-dropzone":"background:green",".je-dropzone.invalid-dropzone":"background:red"};var M=s(0),D=s.n(M);class q extends P{getSelectInput(t,e){const s=super.getSelectInput(t);return s.classList.add("form-control"),s}setGridColumnSize(t,e,s){t.classList.add("col-md-"+e),s&&t.classList.add("col-md-offset-"+s)}afterInputReady(t){if(!t.controlgroup&&(t.controlgroup=this.closest(t,".form-group"),this.closest(t,".compact")&&(t.controlgroup.style.marginBottom=0),this.queuedInputErrorText)){const e=this.queuedInputErrorText;delete this.queuedInputErrorText,this.addInputError(t,e)}}getTextareaInput(){const t=document.createElement("textarea");return t.classList.add("form-control"),t}getRangeInput(t,e,s){return super.getRangeInput(t,e,s)}getFormInputField(t){const e=super.getFormInputField(t);return"checkbox"!==t&&"radio"!==t&&e.classList.add("form-control"),e}getFormControl(t,e,s){const i=document.createElement("div");return!t||"checkbox"!==e.type&&"radio"!==e.type?(i.classList.add("form-group"),t&&(t.classList.add("control-label"),i.appendChild(t)),i.appendChild(e)):(i.classList.add(e.type),t.insertBefore(e,t.firstChild),i.appendChild(t)),s&&i.appendChild(s),i}getIndentedPanel(){const t=document.createElement("div");return t.classList.add("well","well-sm"),t.style.paddingBottom=0,t}getInfoButton(t){const e=document.createElement("span");e.classList.add("glyphicon","glyphicon-info-sign","pull-right"),e.style.padding=".25rem",e.style.position="relative",e.style.display="inline-block";const s=document.createElement("span");return s.style["font-family"]="sans-serif",s.style.visibility="hidden",s.style["background-color"]="rgba(50, 50, 50, .75)",s.style.margin="0 .25rem",s.style.color="#FAFAFA",s.style.padding=".5rem 1rem",s.style["border-radius"]=".25rem",s.style.width="25rem",s.style.transform="translateX(-27rem) translateY(-.5rem)",s.style.position="absolute",s.innerText=t,e.onmouseover=()=>{s.style.visibility="visible"},e.onmouseleave=()=>{s.style.visibility="hidden"},e.appendChild(s),e}getFormInputDescription(t){const e=document.createElement("p");return e.classList.add("help-block"),window.DOMPurify?e.innerHTML=window.DOMPurify.sanitize(t):e.textContent=this.cleanText(t),e}getHeaderButtonHolder(){const t=this.getButtonHolder();return t.style.marginLeft="10px",t}getButtonHolder(){const t=document.createElement("span");return t.classList.add("btn-group"),t}getButton(t,e,s){const i=super.getButton(t,e,s);return i.classList.add("btn","btn-default"),i}getTable(){const t=document.createElement("table");return t.classList.add("table","table-bordered"),t.style.width="auto",t.style.maxWidth="none",t}addInputError(t,e){t.controlgroup?(t.controlgroup.classList.add("has-error"),t.errmsg?t.errmsg.style.display="":(t.errmsg=document.createElement("p"),t.errmsg.classList.add("help-block","errormsg"),t.controlgroup.appendChild(t.errmsg)),t.errmsg.textContent=e):this.queuedInputErrorText=e}removeInputError(t){t.controlgroup||delete this.queuedInputErrorText,t.errmsg&&(t.errmsg.style.display="none",t.controlgroup.classList.remove("has-error"))}getTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<ul class='col-md-2 nav nav-pills nav-stacked' id='${e}' role='tablist'></ul><div class='col-md-10 tab-content well well-small'  id='${e}'></div>`,s}getTopTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<ul class='nav nav-tabs' id='${e}' role='tablist'></ul><div class='tab-content well well-small'  id='${e}'></div>`,s}getTab(t,e){const s=document.createElement("li");s.setAttribute("role","presentation");const i=document.createElement("a");return i.setAttribute("href","#"+e),i.appendChild(t),i.setAttribute("aria-controls",e),i.setAttribute("role","tab"),i.setAttribute("data-toggle","tab"),s.appendChild(i),s}getTopTab(t,e){const s=document.createElement("li");s.setAttribute("role","presentation");const i=document.createElement("a");return i.setAttribute("href","#"+e),i.appendChild(t),i.setAttribute("aria-controls",e),i.setAttribute("role","tab"),i.setAttribute("data-toggle","tab"),s.appendChild(i),s}getTabContent(){const t=document.createElement("div");return t.classList.add("tab-pane"),t.setAttribute("role","tabpanel"),t}getTopTabContent(){const t=document.createElement("div");return t.classList.add("tab-pane"),t.setAttribute("role","tabpanel"),t}markTabActive(t){t.tab.classList.add("active"),void 0!==t.rowPane?t.rowPane.classList.add("active"):t.container.classList.add("active")}markTabInactive(t){t.tab.classList.remove("active"),void 0!==t.rowPane?t.rowPane.classList.remove("active"):t.container.classList.remove("active")}getProgressBar(){const t=document.createElement("div");t.classList.add("progress");const e=document.createElement("div");return e.classList.add("progress-bar"),e.setAttribute("role","progressbar"),e.setAttribute("aria-valuenow",0),e.setAttribute("aria-valuemin",0),e.setAttribute("aria-valuenax",100),e.innerHTML="0%",t.appendChild(e),t}updateProgressBar(t,e){if(!t)return;const s=t.firstChild,i=e+"%";s.setAttribute("aria-valuenow",e),s.style.width=i,s.innerHTML=i}updateProgressBarUnknown(t){if(!t)return;const e=t.firstChild;t.classList.add("progress","progress-striped","active"),e.removeAttribute("aria-valuenow"),e.style.width="100%",e.innerHTML=""}getInputGroup(t,e){if(!t)return;const s=document.createElement("div");s.classList.add("input-group"),s.appendChild(t);const i=document.createElement("div");i.classList.add("input-group-btn"),s.appendChild(i);for(let t=0;t<e.length;t++)i.appendChild(e[t]);return s}}q.rules=D.a;const $={disable_theme_rules:!1,input_size:"normal",custom_forms:!1,object_indent:!0,object_background:"bg-light",object_text:"",table_border:!1,table_zebrastyle:!1,tooltip:"bootstrap"};class G extends P{constructor(t){super(t,$)}getSelectInput(t,e){const s=super.getSelectInput(t);return s.classList.add("form-control"),!1===this.options.custom_forms?("small"===this.options.input_size&&s.classList.add("form-control-sm"),"large"===this.options.input_size&&s.classList.add("form-control-lg")):(s.classList.remove("form-control"),s.classList.add("custom-select"),"small"===this.options.input_size&&s.classList.add("custom-select-sm"),"large"===this.options.input_size&&s.classList.add("custom-select-lg")),s}getContainer(){const t=document.createElement("div");return this.options.object_indent||t.classList.add("je-noindent"),t}setGridColumnSize(t,e,s){t.classList.add("col-md-"+e),s&&t.classList.add("offset-md-"+s)}afterInputReady(t){if(t.controlgroup)return;const e=t.name;t.id=e;const s=t.parentNode.parentNode.getElementsByTagName("label")[0];s&&(s.htmlFor=e),t.controlgroup=this.closest(t,".form-group")}getTextareaInput(){const t=document.createElement("textarea");return t.classList.add("form-control"),"small"===this.options.input_size&&t.classList.add("form-control-sm"),"large"===this.options.input_size&&t.classList.add("form-control-lg"),t}getRangeInput(t,e,s){const i=super.getRangeInput(t,e,s);return!0===this.options.custom_forms&&(i.classList.remove("form-control"),i.classList.add("custom-range")),i}getFormInputField(t){const e=super.getFormInputField(t);return"checkbox"!==t&&"radio"!==t&&"file"!==t&&(e.classList.add("form-control"),"small"===this.options.input_size&&e.classList.add("form-control-sm"),"large"===this.options.input_size&&e.classList.add("form-control-lg")),"file"===t&&e.classList.add("form-control-file"),e}getFormControl(t,e,s,i){const r=document.createElement("div");if(r.classList.add("form-group"),!t||"checkbox"!==e.type&&"radio"!==e.type)t&&(r.appendChild(t),i&&r.appendChild(i)),r.appendChild(e);else{const s=document.createElement("div");!1===this.options.custom_forms?(s.classList.add("form-check"),e.classList.add("form-check-input"),t.classList.add("form-check-label")):(s.classList.add("custom-control"),e.classList.add("custom-control-input"),t.classList.add("custom-control-label"),"checkbox"===e.type?s.classList.add("custom-checkbox"):s.classList.add("custom-radio"));const o=(Date.now()*Math.random()).toFixed(0);e.setAttribute("id",o),t.setAttribute("for",o),s.appendChild(e),s.appendChild(t),i&&s.appendChild(i),r.appendChild(s)}return s&&r.appendChild(s),r}getInfoButton(t){const e=document.createElement("button");e.type="button",e.classList.add("ml-3","jsoneditor-twbs4-text-button"),e.setAttribute("data-toggle","tooltip"),e.setAttribute("data-placement","auto"),e.title=t;const s=document.createTextNode("ⓘ");return e.appendChild(s),"bootstrap"===this.options.tooltip?window.jQuery&&window.jQuery().tooltip?window.jQuery(e).tooltip():console.warn("Could not find popper jQuery plugin of Bootstrap."):"css"===this.options.tooltip&&e.classList.add("je-tooltip"),e}getCheckbox(){return this.getFormInputField("checkbox")}getMultiCheckboxHolder(t,e,s,i){const r=document.createElement("div");r.classList.add("form-group"),e&&(r.appendChild(e),i&&e.appendChild(i));const o=document.createElement("div");return Object.values(t).forEach(t=>{const e=t.firstChild;o.appendChild(e)}),r.appendChild(o),s&&r.appendChild(s),r}getFormRadio(t){const e=this.getFormInputField("radio");for(const s in t)e.setAttribute(s,t[s]);return!1===this.options.custom_forms?e.classList.add("form-check-input"):e.classList.add("custom-control-input"),e}getFormRadioLabel(t,e){const s=document.createElement("label");return!1===this.options.custom_forms?s.classList.add("form-check-label"):s.classList.add("custom-control-label"),s.appendChild(document.createTextNode(t)),s}getFormRadioControl(t,e,s){const i=document.createElement("div");return!1===this.options.custom_forms?i.classList.add("form-check"):i.classList.add("custom-control","custom-radio"),i.appendChild(e),i.appendChild(t),s&&(!1===this.options.custom_forms?i.classList.add("form-check-inline"):i.classList.add("custom-control-inline")),i}getIndentedPanel(){const t=document.createElement("div");return t.classList.add("card","card-body","mb-3"),this.options.object_background&&t.classList.add(this.options.object_background),this.options.object_text&&t.classList.add(this.options.object_text),t}getFormInputDescription(t){const e=document.createElement("small");return e.classList.add("form-text"),window.DOMPurify?e.innerHTML=window.DOMPurify.sanitize(t):e.textContent=this.cleanText(t),e}getHeader(t){const e=document.createElement("h3");return e.classList.add("card-title"),"string"==typeof t?e.textContent=t:e.appendChild(t),e.style.display="inline-block",e}getHeaderButtonHolder(){return this.getButtonHolder()}getButtonHolder(){const t=document.createElement("span");return t.classList.add("btn-group"),t}getFormButtonHolder(t){const e=this.getButtonHolder();return e.classList.add("d-block"),"center"===t?e.classList.add("text-center"):"right"===t&&e.classList.add("text-right"),e}getButton(t,e,s){const i=super.getButton(t,e,s);return i.classList.add("btn","btn-secondary","btn-sm"),i}getTable(){const t=document.createElement("table");return t.classList.add("table","table-sm"),this.options.table_border&&t.classList.add("table-bordered"),this.options.table_zebrastyle&&t.classList.add("table-striped"),t}getErrorMessage(t){const e=document.createElement("div");return e.classList.add("alert","alert-danger"),e.setAttribute("role","alert"),e.appendChild(document.createTextNode(t)),e}addInputError(t,e){t.controlgroup&&(t.classList.add("is-invalid"),t.errmsg?t.errmsg.style.display="":(t.errmsg=document.createElement("p"),t.errmsg.classList.add("invalid-feedback"),t.controlgroup.appendChild(t.errmsg)),t.errmsg.textContent=e)}removeInputError(t){t.errmsg&&(t.errmsg.style.display="none",t.classList.remove("is-invalid"))}getTabHolder(t){const e=document.createElement("div"),s=void 0===t?"":t;return e.innerHTML=`<div class='col-md-2' id='${s}'><ul class='nav flex-column nav-pills'></ul></div><div class='col-md-10'><div class='tab-content' id='${s}'></div></div>`,e.classList.add("row"),e}addTab(t,e){t.children[0].children[0].appendChild(e)}getTabContentHolder(t){return t.children[1].children[0]}getTopTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.classList.add("card"),s.innerHTML=`<div class='card-header'><ul class='nav nav-tabs card-header-tabs' id='${e}'></ul></div><div class='card-body'><div class='tab-content' id='${e}'></div></div>`,s}getTab(t,e){const s=document.createElement("li");s.classList.add("nav-item");const i=document.createElement("a");return i.classList.add("nav-link"),i.setAttribute("href","#"+e),i.setAttribute("data-toggle","tab"),i.appendChild(t),s.appendChild(i),s}getTopTab(t,e){const s=document.createElement("li");s.classList.add("nav-item");const i=document.createElement("a");return i.classList.add("nav-link"),i.setAttribute("href","#"+e),i.setAttribute("data-toggle","tab"),i.appendChild(t),s.appendChild(i),s}getTabContent(){const t=document.createElement("div");return t.classList.add("tab-pane"),t.setAttribute("role","tabpanel"),t}getTopTabContent(){const t=document.createElement("div");return t.classList.add("tab-pane"),t.setAttribute("role","tabpanel"),t}markTabActive(t){t.tab.firstChild.classList.add("active"),void 0!==t.rowPane?t.rowPane.classList.add("active"):t.container.classList.add("active")}markTabInactive(t){t.tab.firstChild.classList.remove("active"),void 0!==t.rowPane?t.rowPane.classList.remove("active"):t.container.classList.remove("active")}insertBasicTopTab(t,e){e.children[0].children[0].insertBefore(t,e.children[0].children[0].firstChild)}addTopTab(t,e){t.children[0].children[0].appendChild(e)}getTopTabContentHolder(t){return t.children[1].children[0]}getFirstTab(t){return t.firstChild.firstChild.firstChild}getProgressBar(){const t=document.createElement("div");t.classList.add("progress");const e=document.createElement("div");return e.classList.add("progress-bar"),e.setAttribute("role","progressbar"),e.setAttribute("aria-valuenow",0),e.setAttribute("aria-valuemin",0),e.setAttribute("aria-valuenax",100),e.innerHTML="0%",t.appendChild(e),t}updateProgressBar(t,e){if(!t)return;const s=t.firstChild,i=e+"%";s.setAttribute("aria-valuenow",e),s.style.width=i,s.innerHTML=i}updateProgressBarUnknown(t){if(!t)return;const e=t.firstChild;t.classList.add("progress","progress-striped","active"),e.removeAttribute("aria-valuenow"),e.style.width="100%",e.innerHTML=""}getBlockLink(){const t=document.createElement("a");return t.classList.add("mb-3","d-inline-block"),t}getLinksHolder(){return document.createElement("div")}getInputGroup(t,e){if(!t)return;const s=document.createElement("div");s.classList.add("input-group"),s.appendChild(t);const i=document.createElement("div");i.classList.add("input-group-append"),s.appendChild(i);for(let t=0;t<e.length;t++)e[t].classList.remove("mr-2","btn-secondary"),e[t].classList.add("btn-outline-secondary"),i.appendChild(e[t]);return s}}G.rules={".jsoneditor-twbs4-text-button":"background:none;padding:0;border:0;color:currentColor","td > .form-group":"margin-bottom:0",".json-editor-btn-upload":"margin-top:1rem",".je-noindent .card":"padding:0;border:0",".je-tooltip:hover::before":"display:block;position:absolute;font-size:0.8em;color:%23fff;border-radius:0.2em;content:attr(title);background-color:%23000;margin-top:-2.5em;padding:0.3em",".je-tooltip:hover::after":"display:block;position:absolute;font-size:0.8em;color:%23fff",".select2-container--default .select2-selection--single":"height:calc(1.5em%20%2B%200.75rem%20%2B%202px)",".select2-container--default   .select2-selection--single   .select2-selection__arrow":"height:calc(1.5em%20%2B%200.75rem%20%2B%202px)",".select2-container--default   .select2-selection--single   .select2-selection__rendered":"line-height:calc(1.5em%20%2B%200.75rem%20%2B%202px)",".selectize-control.form-control":"padding:0",".selectize-dropdown.form-control":"padding:0;height:auto",".je-upload-preview img":"float:left;margin:0%200.5rem%200.5rem%200;max-width:100%25;max-height:5rem",".je-dropzone":"position:relative;margin:0.5rem%200;border:2px%20dashed%20black;width:100%25;height:60px;background:teal;transition:all%200.5s",".je-dropzone:before":"position:absolute;content:attr(data-text);color:rgba(0%2C%200%2C%200%2C%200.6);left:50%25;top:50%25;transform:translate(-50%25%2C%20-50%25)",".je-dropzone.valid-dropzone":"background:green",".je-dropzone.invalid-dropzone":"background:red"};class U extends P{getTable(){const t=super.getTable();return t.setAttribute("cellpadding",5),t.setAttribute("cellspacing",0),t}getTableHeaderCell(t){const e=super.getTableHeaderCell(t);return e.classList.add("ui-state-active"),e.style.fontWeight="bold",e}getTableCell(){const t=super.getTableCell();return t.classList.add("ui-widget-content"),t}getHeaderButtonHolder(){const t=this.getButtonHolder();return t.style.marginLeft="10px",t.style.fontSize=".6em",t.style.display="inline-block",t}getFormInputDescription(t){const e=this.getDescription(t);return e.style.marginLeft="10px",e.style.display="inline-block",e}getFormControl(t,e,s,i){const r=super.getFormControl(t,e,s,i);return"checkbox"===e.type?(r.style.lineHeight="25px",r.style.padding="3px 0"):r.style.padding="4px 0 8px 0",r}getDescription(t){const e=document.createElement("span");return e.style.fontSize=".8em",e.style.fontStyle="italic",window.DOMPurify?e.innerHTML=window.DOMPurify.sanitize(t):e.textContent=this.cleanText(t),e}getButtonHolder(){const t=document.createElement("div");return t.classList.add("ui-buttonset"),t.style.fontSize=".7em",t}getFormInputLabel(t,e){const s=document.createElement("label");return s.style.fontWeight="bold",s.style.display="block",s.textContent=t,e&&s.classList.add("required"),s}getButton(t,e,s){const i=document.createElement("button");i.classList.add("ui-button","ui-widget","ui-state-default","ui-corner-all"),e&&!t?(i.classList.add("ui-button-icon-only"),e.classList.add("ui-button-icon-primary","ui-icon-primary"),i.appendChild(e)):e?(i.classList.add("ui-button-text-icon-primary"),e.classList.add("ui-button-icon-primary","ui-icon-primary"),i.appendChild(e)):i.classList.add("ui-button-text-only");const r=document.createElement("span");return r.classList.add("ui-button-text"),r.textContent=t||s||".",i.appendChild(r),i.setAttribute("title",s),i}setButtonText(t,e,s,i){t.innerHTML="",t.classList.add("ui-button","ui-widget","ui-state-default","ui-corner-all"),s&&!e?(t.classList.add("ui-button-icon-only"),s.classList.add("ui-button-icon-primary","ui-icon-primary"),t.appendChild(s)):s?(t.classList.add("ui-button-text-icon-primary"),s.classList.add("ui-button-icon-primary","ui-icon-primary"),t.appendChild(s)):t.classList.add("ui-button-text-only");const r=document.createElement("span");r.classList.add("ui-button-text"),r.textContent=e||i||".",t.appendChild(r),t.setAttribute("title",i)}getIndentedPanel(){const t=document.createElement("div");return t.classList.add("ui-widget-content","ui-corner-all"),t.style.padding="1em 1.4em",t.style.marginBottom="20px",t}afterInputReady(t){if(!t.controls&&(t.controls=this.closest(t,".form-control"),this.queuedInputErrorText)){const e=this.queuedInputErrorText;delete this.queuedInputErrorText,this.addInputError(t,e)}}addInputError(t,e){t.controls?(t.errmsg?t.errmsg.style.display="":(t.errmsg=document.createElement("div"),t.errmsg.classList.add("ui-state-error"),t.controls.appendChild(t.errmsg)),t.errmsg.textContent=e):this.queuedInputErrorText=e}removeInputError(t){t.controls||delete this.queuedInputErrorText,t.errmsg&&(t.errmsg.style.display="none")}markTabActive(t){t.tab.classList.remove("ui-widget-header"),t.tab.classList.add("ui-state-active"),void 0!==t.rowPane?t.rowPane.style.display="":t.container.style.display=""}markTabInactive(t){t.tab.classList.add("ui-widget-header"),t.tab.classList.remove("ui-state-active"),void 0!==t.rowPane?t.rowPane.style.display="none":t.container.style.display="none"}}U.rules={'div[data-schemaid="root"]:after':'position:relative;color:red;margin:10px 0;font-weight:600;display:block;width:100%;text-align:center;content:"This is an old JSON-Editor 1.x Theme and might not display elements correctly when used with the 2.x version"'};class J extends P{addInputError(t,e){if(t.errmsg)t.errmsg.style.display="block";else{const e=this.closest(t,".form-control");t.errmsg=document.createElement("div"),t.errmsg.setAttribute("class","errmsg"),e.appendChild(t.errmsg)}t.errmsg.innerHTML="",t.errmsg.appendChild(document.createTextNode(e))}removeInputError(t){t.style&&(t.style.borderColor=""),t.errmsg&&(t.errmsg.style.display="none")}}J.rules={".je-upload-preview img":"float:left;margin:0%200.5rem%200.5rem%200;max-width:100%25;max-height:5rem",".je-dropzone":"position:relative;margin:0.5rem%200;border:2px%20dashed%20black;width:100%25;height:60px;background:teal;transition:all%200.5s",".je-dropzone:before":"position:absolute;content:attr(data-text);color:rgba(0%2C%200%2C%200%2C%200.6);left:50%25;top:50%25;transform:translate(-50%25%2C%20-50%25)",".je-dropzone.valid-dropzone":"background:green",".je-dropzone.invalid-dropzone":"background:red"};const W={disable_theme_rules:!1,label_bold:!0,align_bottom:!1,object_indent:!1,object_border:!1,table_border:!1,table_zebrastyle:!1,input_size:"normal"};class Z extends P{constructor(t){super(t,W)}setGridColumnSize(t,e,s){t.classList.add("col-"+e),s&&t.classList.add("col-mx-auto")}getGridContainer(){const t=document.createElement("div");return t.classList.add("container"),this.options.object_indent||t.classList.add("je-noindent"),t}getGridRow(){const t=document.createElement("div");return t.classList.add("columns"),t}getGridColumn(){const t=document.createElement("div");return t.classList.add("column"),this.options.align_bottom&&t.classList.add("je-align-bottom"),t}getIndentedPanel(){const t=document.createElement("div");return t.classList.add("je-panel"),this.options.object_border&&t.classList.add("je-border"),t}getTopIndentedPanel(){const t=document.createElement("div");return t.classList.add("je-panel-top"),this.options.object_border&&t.classList.add("je-border"),t}getHeaderButtonHolder(){return this.getButtonHolder()}getButtonHolder(){const t=super.getButtonHolder();return t.classList.add("btn-group"),t}getFormButtonHolder(t){const e=super.getFormButtonHolder();return e.classList.remove("btn-group"),e.classList.add("d-block"),"center"===t?e.classList.add("text-center"):"right"===t?e.classList.add("text-right"):e.classList.add("text-left"),e}getFormButton(t,e,s){const i=super.getFormButton(t,e,s);return i.classList.add("btn","btn-primary","mx-2","my-1"),"small"!==this.options.input_size&&i.classList.remove("btn-sm"),"large"===this.options.input_size&&i.classList.add("btn-lg"),i}getButton(t,e,s){const i=super.getButton(t,e,s);return i.classList.add("btn","btn-sm","btn-primary","mr-2","my-1"),i}getHeader(t){const e=document.createElement("h4");return"string"==typeof t?e.textContent=t:e.appendChild(t),e.style.display="inline-block",e}getFormInputDescription(t){const e=super.getFormInputDescription(t);return e.classList.add("je-desc","hide-sm"),e}getFormInputLabel(t,e){const s=super.getFormInputLabel(t,e);return this.options.label_bold&&s.classList.add("je-label"),s}getCheckbox(){return this.getFormInputField("checkbox")}getCheckboxLabel(t,e){const s=super.getCheckboxLabel(t,e),i=document.createElement("i");return i.classList.add("form-icon"),s.classList.add("form-checkbox","mr-5"),s.insertBefore(i,s.firstChild),s}getFormCheckboxControl(t,e,s){return t.insertBefore(e,t.firstChild),s&&t.classList.add("form-inline"),t}getMultiCheckboxHolder(t,e,s,i){return console.log("mul"),super.getMultiCheckboxHolder(t,e,s,i)}getFormRadio(t){const e=this.getFormInputField("radio");for(const s in t)e.setAttribute(s,t[s]);return e}getFormRadioLabel(t,e){const s=super.getFormRadioLabel(t,e),i=document.createElement("i");return i.classList.add("form-icon"),s.classList.add("form-radio"),s.insertBefore(i,s.firstChild),s}getFormRadioControl(t,e,s){return t.insertBefore(e,t.firstChild),s&&t.classList.add("form-inline"),t}getFormInputField(t){const e=super.getFormInputField(t);return["checkbox","radio"].includes(t)||e.classList.add("form-input"),e}getRangeInput(t,e,s){const i=this.getFormInputField("range");return i.classList.add("slider"),i.classList.remove("form-input"),i.setAttribute("oninput",'this.setAttribute("value", this.value)'),i.setAttribute("min",t),i.setAttribute("max",e),i.setAttribute("step",s),i}getRangeControl(t,e){const s=super.getRangeControl(t,e);return s.classList.add("text-center"),s}getSelectInput(t,e){const s=super.getSelectInput(t);return s.classList.add("form-select"),s}getTextareaInput(){const t=document.createElement("textarea");return t.classList.add("form-input"),t}getFormControl(t,e,s,i){const r=document.createElement("div");return r.classList.add("form-group"),t&&("checkbox"===e.type&&(t=this.getFormCheckboxControl(t,e,!1)),t.classList.add("form-label"),r.appendChild(t),i&&r.insertBefore(i,r.firstChild)),"small"===this.options.input_size?e.classList.add("input-sm","select-sm"):"large"===this.options.input_size&&e.classList.add("input-lg","select-lg"),"checkbox"!==e.type&&r.appendChild(e),s&&r.appendChild(s),r}getInputGroup(t,e){if(!t)return;const s=document.createElement("div");s.classList.add("input-group"),s.appendChild(t);for(let t=0;t<e.length;t++)e[t].classList.add("input-group-btn"),e[t].classList.remove("btn-sm","mr-2","my-1"),s.appendChild(e[t]);return s}getInfoButton(t){const e=document.createElement("div");e.classList.add("popover","popover-left","float-right");const s=document.createElement("button");s.classList.add("btn","btn-secondary","btn-info","btn-action","s-circle"),s.setAttribute("tabindex","-1"),e.appendChild(s);const i=document.createTextNode("I");s.appendChild(i);const r=document.createElement("div");r.classList.add("popover-container"),e.appendChild(r);const o=document.createElement("div");o.classList.add("card"),r.appendChild(o);const n=document.createElement("div");return n.classList.add("card-body"),n.innerHTML=t,o.appendChild(n),e}getTable(){const t=super.getTable();return t.classList.add("table","table-scroll"),this.options.table_border&&t.classList.add("je-table-border"),this.options.table_zebrastyle&&t.classList.add("table-striped"),t}getProgressBar(){const t=super.getProgressBar();return t.classList.add("progress"),t}getTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.classList.add("columns"),s.innerHTML=`<div class="column col-2"></div><div class="column col-10 content" id="${e}"></div>`,s}getTopTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<ul class="tab"></ul><div class="content" id="${e}"></div>`,s}getTab(t,e){const s=document.createElement("a");return s.classList.add("btn","btn-secondary","btn-block"),s.setAttribute("href","#"+e),s.appendChild(t),s}getTopTab(t,e){const s=document.createElement("li");s.id=e,s.classList.add("tab-item");const i=document.createElement("a");return i.setAttribute("href","#"+e),i.appendChild(t),s.appendChild(i),s}markTabActive(t){t.tab.classList.add("active"),void 0!==t.rowPane?t.rowPane.style.display="":t.container.style.display=""}markTabInactive(t){t.tab.classList.remove("active"),void 0!==t.rowPane?t.rowPane.style.display="none":t.container.style.display="none"}afterInputReady(t){if("select"===t.localName)if(t.classList.contains("selectized")){const e=t.nextSibling;e&&(e.classList.remove("form-select"),Array.from(e.querySelectorAll(".form-select")).forEach(t=>{t.classList.remove("form-select")}))}else if(t.classList.contains("select2-hidden-accessible")){const e=t.nextSibling;e&&e.querySelector(".select2-selection--single")&&e.classList.add("form-select")}t.controlgroup||(t.controlgroup=this.closest(t,".form-group"),this.closest(t,".compact")&&(t.controlgroup.style.marginBottom=0))}addInputError(t,e){t.controlgroup&&(t.controlgroup.classList.add("has-error"),t.errmsg||(t.errmsg=document.createElement("p"),t.errmsg.classList.add("form-input-hint"),t.controlgroup.appendChild(t.errmsg)),t.errmsg.classList.remove("d-hide"),t.errmsg.textContent=e)}removeInputError(t){t.errmsg&&(t.errmsg.classList.add("d-hide"),t.controlgroup.classList.remove("has-error"))}}Z.rules={"*":"--primary-color:%235755d9;--gray-color:%23bcc3ce;--light-color:%23fff",".slider:focus":"box-shadow:none","h4 > label + .btn-group":"margin-left:1rem",".text-right > button":"margin-right:0%20!important",".text-left > button":"margin-left:0%20!important",".property-selector":"font-size:0.7rem;font-weight:normal;max-height:260px%20!important;width:395px%20!important",".property-selector .form-checkbox":"margin:0",textarea:"width:100%25;min-height:2rem;resize:vertical",table:"border-collapse:collapse",".table td":"padding:0.4rem%200.4rem",".mr-5":"margin-right:1rem%20!important","div[data-schematype]:not([data-schematype='object'])":"transition:0.5s","div[data-schematype]:not([data-schematype='object']):hover":"background-color:%23eee",".je-table-border td":"border:0.05rem%20solid%20%23dadee4%20!important",".btn-info":"font-size:0.5rem;font-weight:bold;height:0.8rem;padding:0.15rem%200;line-height:0.8;margin:0.3rem%200%200.3rem%200.1rem",".je-label + select":"min-width:5rem",".je-label":"font-weight:600",".btn-action.btn-info":"width:0.8rem",".je-border":"border:0.05rem%20solid%20%23dadee4",".je-panel":"padding:0.2rem;margin:0.2rem;background-color:rgba(218%2C%20222%2C%20228%2C%200.1)",".je-panel-top":"padding:0.2rem;margin:0.2rem;background-color:rgba(218%2C%20222%2C%20228%2C%200.1)",".required:after":"content:%22%20*%22;color:red;font:inherit",".je-align-bottom":"margin-top:auto",".je-desc":"font-size:smaller;margin:0.2rem%200",".je-upload-preview img":"float:left;margin:0%200.5rem%200.5rem%200;max-width:100%25;max-height:5rem;border:3px%20solid%20white;box-shadow:0px%200px%208px%20rgba(0%2C%200%2C%200%2C%200.3);box-sizing:border-box",".je-dropzone":"position:relative;margin:0.5rem%200;border:2px%20dashed%20black;width:100%25;height:60px;background:teal;transition:all%200.5s",".je-dropzone:before":"position:absolute;content:attr(data-text);color:rgba(0%2C%200%2C%200%2C%200.6);left:50%25;top:50%25;transform:translate(-50%25%2C%20-50%25)",".je-dropzone.valid-dropzone":"background:green",".je-dropzone.invalid-dropzone":"background:red",".columns .container.je-noindent":"padding-left:0;padding-right:0",".selectize-control.multi .item":"background:var(--primary-color)%20!important",".select2-container--default   .select2-selection--single   .select2-selection__arrow":"display:none",".select2-container--default .select2-selection--single":"border:none",".select2-container .select2-selection--single .select2-selection__rendered":"padding:0",".select2-container .select2-search--inline .select2-search__field":"margin-top:0",".select2-container--default.select2-container--focus   .select2-selection--multiple":"border:0.05rem%20solid%20var(--gray-color)",".select2-container--default   .select2-selection--multiple   .select2-selection__choice":"margin:0.4rem%200.2rem%200.2rem%200;padding:2px%205px;background-color:var(--primary-color);color:var(--light-color)",".select2-container--default .select2-search--inline .select2-search__field":"line-height:normal",".choices":"margin-bottom:auto",".choices__list--multiple .choices__item":"border:none;background-color:var(--primary-color);color:var(--light-color)",".choices[data-type*='select-multiple'] .choices__button":"border-left:0.05rem%20solid%20%232826a6",".choices__inner":"font-size:inherit;min-height:20px;padding:4px%207.5px%204px%203.75px",".choices[data-type*='select-one'] .choices__inner":"padding-bottom:4px",".choices__list--dropdown .choices__item":"font-size:inherit"};const Q={disable_theme_rules:!1,label_bold:!1,object_panel_default:!0,object_indent:!0,object_border:!1,table_border:!1,table_hdiv:!1,table_zebrastyle:!1,input_size:"small",enable_compact:!1};class Y extends P{constructor(t){super(t,Q)}getGridContainer(){const t=document.createElement("div");return t.classList.add("flex","flex-col","w-full"),this.options.object_indent||t.classList.add("je-noindent"),t}getGridRow(){const t=document.createElement("div");return t.classList.add("flex","flex-wrap","w-full"),t}getGridColumn(){const t=document.createElement("div");return t.classList.add("flex","flex-col"),t}setGridColumnSize(t,e,s){e>0&&e<12?t.classList.add(`w-${e}/12`,"px-1"):t.classList.add("w-full","px-1"),s&&(t.style.marginLeft=100/12*s+"%")}getIndentedPanel(){const t=document.createElement("div");return this.options.object_panel_default?t.classList.add("w-full","p-1"):t.classList.add("relative","flex","flex-col","rounded","break-words","border","bg-white","border-0","border-blue-400","p-1","shadow-md"),this.options.object_border&&t.classList.add("je-border"),t}getTopIndentedPanel(){const t=document.createElement("div");return this.options.object_panel_default?t.classList.add("w-full","m-2"):t.classList.add("relative","flex","flex-col","rounded","break-words","border","bg-white","border-0","border-blue-400","p-1","shadow-md"),this.options.object_border&&t.classList.add("je-border"),t}getTitle(){return this.schema.title}getSelectInput(t,e){const s=super.getSelectInput(t);return e?s.classList.add("form-multiselect","block","py-0","h-auto","w-full","px-1","text-sm","text-black","leading-normal","bg-white","border","border-grey","rounded"):s.classList.add("form-select","block","py-0","h-6","w-full","px-1","text-sm","text-black","leading-normal","bg-white","border","border-grey","rounded"),this.options.enable_compact&&s.classList.add("compact"),s}afterInputReady(t){t.controlgroup||(t.controlgroup=this.closest(t,".form-group"),this.closest(t,".compact")&&(t.controlgroup.style.marginBottom=0))}getTextareaInput(){const t=super.getTextareaInput();return t.classList.add("block","w-full","px-1","text-sm","leading-normal","bg-white","text-black","border","border-grey","rounded"),this.options.enable_compact&&t.classList.add("compact"),t.style.height=0,t}getRangeInput(t,e,s){const i=this.getFormInputField("range");return i.classList.add("slider"),this.options.enable_compact&&i.classList.add("compact"),i.setAttribute("oninput",'this.setAttribute("value", this.value)'),i.setAttribute("min",t),i.setAttribute("max",e),i.setAttribute("step",s),i}getRangeControl(t,e){const s=super.getRangeControl(t,e);return s.classList.add("text-center","text-black"),s}getCheckbox(){const t=this.getFormInputField("checkbox");return t.classList.add("form-checkbox","text-red-600"),t}getCheckboxLabel(t,e){const s=super.getCheckboxLabel(t,e);return s.classList.add("inline-flex","items-center"),s}getFormCheckboxControl(t,e,s){return t.insertBefore(e,t.firstChild),s&&t.classList.add("inline-flex flex-row"),t}getMultiCheckboxHolder(t,e,s,i){const r=super.getMultiCheckboxHolder(t,e,s,i);return r.classList.add("inline-flex","flex-col"),r}getFormRadio(t){const e=this.getFormInputField("radio");e.classList.add("form-radio","text-red-600");for(const s in t)e.setAttribute(s,t[s]);return e}getFormRadioLabel(t,e){const s=super.getFormRadioLabel(t,e);return s.classList.add("inline-flex","items-center","mr-2"),s}getFormRadioControl(t,e,s){return t.insertBefore(e,t.firstChild),s&&t.classList.add("form-radio"),t}getRadioHolder(t,e,s,i,r){const o=super.getRadioHolder(e,s,i,r);return"h"===t.options.layout?o.classList.add("inline-flex","flex-row"):o.classList.add("inline-flex","flex-col"),o}getFormInputLabel(t,e){const s=super.getFormInputLabel(t,e);return this.options.label_bold?s.classList.add("font-bold"):s.classList.add("required"),s}getFormInputField(t){const e=super.getFormInputField(t);return["checkbox","radio"].includes(t)||e.classList.add("block","w-full","px-1","text-black","text-sm","leading-normal","bg-white","border","border-grey","rounded"),this.options.enable_compact&&e.classList.add("compact"),e}getFormInputDescription(t){const e=document.createElement("p");return e.classList.add("block","mt-1","text-xs"),window.DOMPurify?e.innerHTML=window.DOMPurify.sanitize(t):e.textContent=this.cleanText(t),e}getFormControl(t,e,s,i){const r=document.createElement("div");return r.classList.add("form-group","mb-1","w-full"),t&&(t.classList.add("text-xs"),"checkbox"===e.type&&(e.classList.add("form-checkbox","text-xs","text-red-600","mr-1"),t.classList.add("items-center","flex"),t=this.getFormCheckboxControl(t,e,!1,i)),"radio"===e.type&&(e.classList.add("form-radio","text-red-600","mr-1"),t.classList.add("items-center","flex"),t=this.getFormRadioControl(t,e,!1,i)),r.appendChild(t),!["checkbox","radio"].includes(e.type)&&i&&r.appendChild(i)),["checkbox","radio"].includes(e.type)||("small"===this.options.input_size?e.classList.add("text-xs"):"normal"===this.options.input_size?e.classList.add("text-base"):"large"===this.options.input_size&&e.classList.add("text-xl"),r.appendChild(e)),s&&r.appendChild(s),r}getHeaderButtonHolder(){const t=this.getButtonHolder();return t.classList.add("text-sm"),t}getButtonHolder(){const t=document.createElement("div");return t.classList.add("flex","relative","inline-flex","align-middle"),t}getButton(t,e,s){const i=super.getButton(t,e,s);return i.classList.add("inline-block","align-middle","text-center","text-sm","bg-blue-700","text-white","py-1","pr-1","m-2","shadow","select-none","whitespace-no-wrap","rounded"),i}getInfoButton(t){const e=document.createElement("a");e.classList.add("tooltips","float-right"),e.innerHTML="ⓘ";const s=document.createElement("span");return s.innerHTML=t,e.appendChild(s),e}getTable(){const t=super.getTable();return this.options.table_border?t.classList.add("je-table-border"):t.classList.add("table","border","p-0"),t}getTableRow(){const t=super.getTableRow();return this.options.table_border&&t.classList.add("je-table-border"),this.options.table_zebrastyle&&t.classList.add("je-table-zebra"),t}getTableHeaderCell(t){const e=super.getTableHeaderCell(t);return this.options.table_border?e.classList.add("je-table-border"):this.options.table_hdiv?e.classList.add("je-table-hdiv"):e.classList.add("text-xs","border","p-0","m-0"),e}getTableCell(){const t=super.getTableCell();return this.options.table_border?t.classList.add("je-table-border"):this.options.table_hdiv?t.classList.add("je-table-hdiv"):t.classList.add("border-0","p-0","m-0"),t}addInputError(t,e){t.controlgroup&&(t.controlgroup.classList.add("has-error"),t.classList.add("bg-red-600"),t.errmsg?t.errmsg.style.display="":(t.errmsg=document.createElement("p"),t.errmsg.classList.add("block","mt-1","text-xs","text-red"),t.controlgroup.appendChild(t.errmsg)),t.errmsg.textContent=e)}removeInputError(t){t.errmsg&&(t.errmsg.style.display="none",t.classList.remove("bg-red-600"),t.controlgroup.classList.remove("has-error"))}getTabHolder(t){const e=document.createElement("div"),s=void 0===t?"":t;return e.innerHTML=`<div class='w-2/12' id='${s}'><ul class='list-reset pl-0 mb-0'></ul></div><div class='w-10/12' id='${s}'></div>`,e.classList.add("flex"),e}addTab(t,e){t.children[0].children[0].appendChild(e)}getTopTabHolder(t){const e=void 0===t?"":t,s=document.createElement("div");return s.innerHTML=`<ul class='nav-tabs flex list-reset pl-0 mb-0 border-b border-grey-light' id='${e}'></ul><div class='p-6 block' id='${e}'></div>`,s}getTab(t,e){const s=document.createElement("li");s.classList.add("nav-item","flex-col","text-center","text-white","bg-blue-500","shadow-md","border","p-2","mb-2","mr-2","hover:bg-blue-400","rounded");const i=document.createElement("a");return i.classList.add("nav-link","text-center"),i.setAttribute("href","#"+e),i.setAttribute("data-toggle","tab"),i.appendChild(t),s.appendChild(i),s}getTopTab(t,e){const s=document.createElement("li");s.classList.add("nav-item","flex","border-l","border-t","border-r");const i=document.createElement("a");return i.classList.add("nav-link","-mb-px","flex-row","text-center","bg-white","p-2","hover:bg-blue-400","rounded-t"),i.setAttribute("href","#"+e),i.setAttribute("data-toggle","tab"),i.appendChild(t),s.appendChild(i),s}getTabContent(){const t=document.createElement("div");return t.setAttribute("role","tabpanel"),t}getTopTabContent(){const t=document.createElement("div");return t.setAttribute("role","tabpanel"),t}markTabActive(t){t.tab.firstChild.classList.add("block"),!0===t.tab.firstChild.classList.contains("border-b")?(t.tab.firstChild.classList.add("border-b-0"),t.tab.firstChild.classList.remove("border-b")):t.tab.firstChild.classList.add("border-b-0"),!0===t.container.classList.contains("hidden")?(t.container.classList.remove("hidden"),t.container.classList.add("block")):t.container.classList.add("block")}markTabInactive(t){!0===t.tab.firstChild.classList.contains("border-b-0")?(t.tab.firstChild.classList.add("border-b"),t.tab.firstChild.classList.remove("border-b-0")):t.tab.firstChild.classList.add("border-b"),!0===t.container.classList.contains("block")&&(t.container.classList.remove("block"),t.container.classList.add("hidden"))}getProgressBar(){const t=document.createElement("div");t.classList.add("progress");const e=document.createElement("div");return e.classList.add("bg-blue","leading-none","py-1","text-xs","text-center","text-white"),e.setAttribute("role","progressbar"),e.setAttribute("aria-valuenow",0),e.setAttribute("aria-valuemin",0),e.setAttribute("aria-valuenax",100),e.innerHTML="0%",t.appendChild(e),t}updateProgressBar(t,e){if(!t)return;const s=t.firstChild,i=e+"%";s.setAttribute("aria-valuenow",e),s.style.width=i,s.innerHTML=i}updateProgressBarUnknown(t){if(!t)return;const e=t.firstChild;t.classList.add("progress","bg-blue","leading-none","py-1","text-xs","text-center","text-white","block"),e.removeAttribute("aria-valuenow"),e.classList.add("w-full"),e.innerHTML=""}getInputGroup(t,e){if(!t)return;const s=document.createElement("div");s.classList.add("relative","items-stretch","w-full"),s.appendChild(t);const i=document.createElement("div");i.classList.add("-mr-1"),s.appendChild(i);for(let t=0;t<e.length;t++)i.appendChild(e[t]);return s}}Y.rules={".slider":"-webkit-appearance:none;-moz-appearance:none;appearance:none;background:transparent;display:block;border:none;height:1.2rem;width:100%25",".slider:focus":"box-shadow:0%200%200%200%20rgba(87%2C%2085%2C%20217%2C%200.2);outline:none",".slider.tooltip:not([data-tooltip])::after":"content:attr(value)",".slider::-webkit-slider-thumb":"-webkit-appearance:none;background:%23f17405;border-radius:100%25;height:0.6rem;margin-top:-0.25rem;transition:transform%200.2s;width:0.6rem",".slider:active::-webkit-slider-thumb":"transform:scale(1.25);outline:none",".slider::-webkit-slider-runnable-track":"background:%23b2b4b6;border-radius:0.1rem;height:0.1rem;width:100%25","a.tooltips":"position:relative;display:inline","a.tooltips span":"position:absolute;white-space:nowrap;width:auto;padding-left:1rem;padding-right:1rem;color:%23ffffff;background:rgba(56%2C%2056%2C%2056%2C%200.85);height:1.5rem;line-height:1.5rem;text-align:center;visibility:hidden;border-radius:3px","a.tooltips span:after":"content:%22%22;position:absolute;top:50%25;left:100%25;margin-top:-5px;width:0;height:0;border-left:5px%20solid%20rgba(56%2C%2056%2C%2056%2C%200.85);border-top:5px%20solid%20transparent;border-bottom:5px%20solid%20transparent","a:hover.tooltips span":"visibility:visible;opacity:0.9;font-size:0.8rem;right:100%25;top:50%25;margin-top:-12px;margin-right:10px;z-index:999",".json-editor-btntype-properties + div":"font-size:0.8rem;font-weight:normal",textarea:"width:100%25;min-height:2rem;resize:vertical",table:"width:100%25;border-collapse:collapse",".table td":"padding:0rem%200rem","div[data-schematype]:not([data-schematype='object'])":"transition:0.5s","div[data-schematype]:not([data-schematype='object']):hover":"background-color:%23e6f4fe","div[data-schemaid='root']":"position:relative;width:inherit;display:inherit;overflow-x:hidden;z-index:10","select[multiple]":"height:auto","select[multiple].from-select":"height:auto",".je-table-zebra:nth-child(even)":"background-color:%23f2f2f2",".je-table-border":"border:0.5px%20solid%20black",".je-table-hdiv":"border-bottom:1px%20solid%20black",".je-border":"border:0.05rem%20solid%20%233182ce",".je-panel":"width:inherit;padding:0.2rem;margin:0.2rem;background-color:rgba(218%2C%20222%2C%20228%2C%200.1)",".je-panel-top":"width:100%25;padding:0.2rem;margin:0.2rem;background-color:rgba(218%2C%20222%2C%20228%2C%200.1)",".required:after":"content:%22%20*%22;color:red;font:inherit;font-weight:bold",".je-desc":"font-size:smaller;margin:0.2rem%200",".container-xl.je-noindent":"padding-left:0;padding-right:0",".json-editor-btntype-add":"color:white;margin:0.3rem;padding:0.3rem%200.8rem;background-color:%234299e1;box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-webkit-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-moz-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2)",".json-editor-btntype-deletelast":"color:white;margin:0.3rem;padding:0.3rem%200.8rem;background-color:%23e53e3e;box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-webkit-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-moz-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2)",".json-editor-btntype-deleteall":"color:white;margin:0.3rem;padding:0.3rem%200.8rem;background-color:%23000000;box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-webkit-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-moz-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2)",".json-editor-btn-save":"float:right;color:white;margin:0.3rem;padding:0.3rem%200.8rem;background-color:%232b6cb0;box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-webkit-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-moz-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2)",".json-editor-btn-back":"color:white;margin:0.3rem;padding:0.3rem%200.8rem;background-color:%232b6cb0;box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-webkit-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2);-moz-box-shadow:3px%203px%205px%201px%20rgba(4%2C%204%2C%204%2C%200.2)",".json-editor-btntype-delete":"color:%23e53e3e;background-color:rgba(218%2C%20222%2C%20228%2C%200.1);margin:0.03rem;padding:0.1rem",".json-editor-btntype-move":"color:%23000000;background-color:rgba(218%2C%20222%2C%20228%2C%200.1);margin:0.03rem;padding:0.1rem",".json-editor-btn-collapse":"padding:0em%200.8rem;font-size:1.3rem;color:%23e53e3e;background-color:rgba(218%2C%20222%2C%20228%2C%200.1)",".je-upload-preview img":"float:left;margin:0%200.5rem%200.5rem%200;max-width:100%25;max-height:5rem",".je-dropzone":"position:relative;margin:0.5rem%200;border:2px%20dashed%20black;width:100%25;height:60px;background:teal;transition:all%200.5s",".je-dropzone:before":"position:absolute;content:attr(data-text);color:rgba(0%2C%200%2C%200%2C%200.6);left:50%25;top:50%25;transform:translate(-50%25%2C%20-50%25)",".je-dropzone.valid-dropzone":"background:green",".je-dropzone.invalid-dropzone":"background:red"};const X={html:z,bootstrap3:q,bootstrap4:G,jqueryui:U,barebones:J,spectre:Z,tailwind:Y};class K{constructor(t,e={}){if(!(t instanceof Element))throw new Error("element should be an instance of Element");this.element=t,this.options=c({},K.defaults.options,e),this.ready=!1,this.copyClipboard=null,this.schema=this.options.schema,this.template=this.options.template,this.translate=this.options.translate||K.defaults.translate,this.uuid=0,this.__data={};const s=this.options.theme||K.defaults.theme,i=K.defaults.themes[s];if(!i)throw new Error("Unknown theme "+s);this.element.setAttribute("data-theme",s),this.theme=new i(this);const r=c(i.rules,this.getEditorsRules());if(!this.theme.options.disable_theme_rules){const t=function t(e){return e&&("[object ShadowRoot]"===e.toString()?e:t(e.parentNode))}(this.element);this[t?"addNewStyleRulesToShadowRoot":"addNewStyleRules"](s,r,t)}const o=K.defaults.iconlibs[this.options.iconlib||K.defaults.iconlib];o&&(this.iconlib=new o),this.root_container=this.theme.getContainer(),this.element.appendChild(this.root_container);const n=document.location.origin+document.location.pathname.toString(),a=new f(this.options),l=document.location.toString();this.expandSchema=(t,e)=>a.expandSchema(t,e),this.expandRefs=(t,e)=>a.expandRefs(t,e),this.refs=a.refs,a.load(this.schema,t=>{const e=this.options.custom_validators?{custom_validators:this.options.custom_validators}:{};this.validator=new g(this,null,e,K.defaults);const s=this.getEditorClass(t);this.root=this.createEditor(s,{jsoneditor:this,schema:t,required:!0,container:this.root_container}),this.root.preBuild(),this.root.build(),this.root.postBuild(),u(this.options,"startval")&&this.root.setValue(this.options.startval),this.validation_results=this.validator.validate(this.root.getValue()),this.root.showValidationErrors(this.validation_results),this.ready=!0,window.requestAnimationFrame(()=>{this.ready&&(this.validation_results=this.validator.validate(this.root.getValue()),this.root.showValidationErrors(this.validation_results),this.trigger("ready"),this.trigger("change"))})},n,l)}getValue(){if(!this.ready)throw new Error("JSON Editor not ready yet.  Listen for 'ready' event before getting the value");return this.root.getValue()}setValue(t){if(!this.ready)throw new Error("JSON Editor not ready yet.  Listen for 'ready' event before setting the value");return this.root.setValue(t),this}validate(t){if(!this.ready)throw new Error("JSON Editor not ready yet.  Listen for 'ready' event before validating");return 1===arguments.length?this.validator.validate(t):this.validation_results}destroy(){this.destroyed||this.ready&&(this.schema=null,this.options=null,this.root.destroy(),this.root=null,this.root_container=null,this.validator=null,this.validation_results=null,this.theme=null,this.iconlib=null,this.template=null,this.__data=null,this.ready=!1,this.element.innerHTML="",this.element.removeAttribute("data-theme"),this.destroyed=!0)}on(t,e){return this.callbacks=this.callbacks||{},this.callbacks[t]=this.callbacks[t]||[],this.callbacks[t].push(e),this}off(t,e){if(t&&e){this.callbacks=this.callbacks||{},this.callbacks[t]=this.callbacks[t]||[];const s=[];for(let i=0;i<this.callbacks[t].length;i++)this.callbacks[t][i]!==e&&s.push(this.callbacks[t][i]);this.callbacks[t]=s}else t?(this.callbacks=this.callbacks||{},this.callbacks[t]=[]):this.callbacks={};return this}trigger(t,e){if(this.callbacks&&this.callbacks[t]&&this.callbacks[t].length)for(let s=0;s<this.callbacks[t].length;s++)this.callbacks[t][s].apply(this,[e]);return this}setOption(t,e){if("show_errors"!==t)throw new Error(`Option ${t} must be set during instantiation and cannot be changed later`);return this.options.show_errors=e,this.onChange(),this}getEditorsRules(){return Object.values(K.defaults.editors).reduce((t,e)=>e.rules?c(t,e.rules):t,{})}getEditorClass(t){let e;if(t=this.expandSchema(t),K.defaults.resolvers.find(s=>(e=s(t),e&&K.defaults.editors[e])),!e)throw new Error("Unknown editor for schema "+JSON.stringify(t));if(!K.defaults.editors[e])throw new Error("Unknown editor "+e);return K.defaults.editors[e]}createEditor(t,e,s=1){return new t(e=c({},t.options||{},e),K.defaults,s)}onChange(){if(this.ready&&!this.firing_change)return this.firing_change=!0,window.requestAnimationFrame(()=>{this.firing_change=!1,this.ready&&(this.validation_results=this.validator.validate(this.root.getValue()),"never"!==this.options.show_errors?this.root.showValidationErrors(this.validation_results):this.root.showValidationErrors([]),this.trigger("change"))}),this}compileTemplate(t,e=K.defaults.template){let s;if("string"==typeof e){if(!K.defaults.templates[e])throw new Error("Unknown template engine "+e);if(s=K.defaults.templates[e](),!s)throw new Error(`Template engine ${e} missing required library.`)}else s=e;if(!s)throw new Error("No template engine set");if(!s.compile)throw new Error("Invalid template engine set");return s.compile(t)}_data(t,e,s){if(3!==arguments.length)return t.hasAttribute("data-jsoneditor-"+e)?this.__data[t.getAttribute("data-jsoneditor-"+e)]:null;{let i;t.hasAttribute("data-jsoneditor-"+e)?i=t.getAttribute("data-jsoneditor-"+e):(i=this.uuid++,t.setAttribute("data-jsoneditor-"+e,i)),this.__data[i]=s}}registerEditor(t){return this.editors=this.editors||{},this.editors[t.path]=t,this}unregisterEditor(t){return this.editors=this.editors||{},this.editors[t.path]=null,this}getEditor(t){if(this.editors)return this.editors[t]}watch(t,e){return this.watchlist=this.watchlist||{},this.watchlist[t]=this.watchlist[t]||[],this.watchlist[t].push(e),this}unwatch(t,e){if(!this.watchlist||!this.watchlist[t])return this;if(!e)return this.watchlist[t]=null,this;const s=[];for(let i=0;i<this.watchlist[t].length;i++)this.watchlist[t][i]!==e&&s.push(this.watchlist[t][i]);return this.watchlist[t]=s.length?s:null,this}notifyWatchers(t){if(!this.watchlist||!this.watchlist[t])return this;for(let e=0;e<this.watchlist[t].length;e++)this.watchlist[t][e]()}isEnabled(){return!this.root||this.root.isEnabled()}enable(){this.root.enable()}disable(){this.root.disable()}setCopyClipboardContents(t){this.copyClipboard=t}getCopyClipboardContents(){return this.copyClipboard}addNewStyleRules(t,e){let s=document.querySelector("#theme-"+t);s||(s=document.createElement("style"),s.setAttribute("id","theme-"+t),s.appendChild(document.createTextNode("")),document.head.appendChild(s));const i=s.sheet?s.sheet:s.styleSheet,r=this.element.nodeName.toLowerCase();Object.keys(e).forEach(s=>{const o=`${r}[data-theme="${t}"] ${s}`;i.insertRule?i.insertRule(o+" {"+decodeURIComponent(e[s])+"}",0):i.addRule&&i.addRule(o,decodeURIComponent(e[s]),0)})}addNewStyleRulesToShadowRoot(t,e,s){const i=this.element.nodeName.toLowerCase();let r="";Object.keys(e).forEach(s=>{r+=`${i}[data-theme="${t}"] ${s}`+" {"+decodeURIComponent(e[s])+"}\n"});const o=new CSSStyleSheet;o.replaceSync(r),s.adoptedStyleSheets=[...s.adoptedStyleSheets,o]}}K.defaults=a,K.AbstractEditor=_,K.AbstractTheme=P,K.AbstractIconLib=I,Object.assign(K.defaults.themes,X),Object.assign(K.defaults.editors,L),Object.assign(K.defaults.templates,T),Object.assign(K.defaults.iconlibs,H)}])}));
},{}],15:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],16:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],17:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":16,"_process":271,"inherits":15}],18:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_js_1 = require("./helpers.js");
exports.JsonPatchError = helpers_js_1.PatchError;
exports.deepClone = helpers_js_1._deepClone;
/* We use a Javascript hash to store each
 function. Each hash entry (property) uses
 the operation identifiers specified in rfc6902.
 In this way, we can map each patch operation
 to its dedicated function in efficient way.
 */
/* The operations applicable to an object */
var objOps = {
    add: function (obj, key, document) {
        obj[key] = this.value;
        return { newDocument: document };
    },
    remove: function (obj, key, document) {
        var removed = obj[key];
        delete obj[key];
        return { newDocument: document, removed: removed };
    },
    replace: function (obj, key, document) {
        var removed = obj[key];
        obj[key] = this.value;
        return { newDocument: document, removed: removed };
    },
    move: function (obj, key, document) {
        /* in case move target overwrites an existing value,
        return the removed value, this can be taxing performance-wise,
        and is potentially unneeded */
        var removed = getValueByPointer(document, this.path);
        if (removed) {
            removed = helpers_js_1._deepClone(removed);
        }
        var originalValue = applyOperation(document, { op: "remove", path: this.from }).removed;
        applyOperation(document, { op: "add", path: this.path, value: originalValue });
        return { newDocument: document, removed: removed };
    },
    copy: function (obj, key, document) {
        var valueToCopy = getValueByPointer(document, this.from);
        // enforce copy by value so further operations don't affect source (see issue #177)
        applyOperation(document, { op: "add", path: this.path, value: helpers_js_1._deepClone(valueToCopy) });
        return { newDocument: document };
    },
    test: function (obj, key, document) {
        return { newDocument: document, test: _areEquals(obj[key], this.value) };
    },
    _get: function (obj, key, document) {
        this.value = obj[key];
        return { newDocument: document };
    }
};
/* The operations applicable to an array. Many are the same as for the object */
var arrOps = {
    add: function (arr, i, document) {
        if (helpers_js_1.isInteger(i)) {
            arr.splice(i, 0, this.value);
        }
        else { // array props
            arr[i] = this.value;
        }
        // this may be needed when using '-' in an array
        return { newDocument: document, index: i };
    },
    remove: function (arr, i, document) {
        var removedList = arr.splice(i, 1);
        return { newDocument: document, removed: removedList[0] };
    },
    replace: function (arr, i, document) {
        var removed = arr[i];
        arr[i] = this.value;
        return { newDocument: document, removed: removed };
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
};
/**
 * Retrieves a value from a JSON document by a JSON pointer.
 * Returns the value.
 *
 * @param document The document to get the value from
 * @param pointer an escaped JSON pointer
 * @return The retrieved value
 */
function getValueByPointer(document, pointer) {
    if (pointer == '') {
        return document;
    }
    var getOriginalDestination = { op: "_get", path: pointer };
    applyOperation(document, getOriginalDestination);
    return getOriginalDestination.value;
}
exports.getValueByPointer = getValueByPointer;
/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the {newDocument, result} of the operation.
 * It modifies the `document` and `operation` objects - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyOperation(document, jsonpatch._deepClone(operation))`.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @param banPrototypeModifications Whether to ban modifications to `__proto__`, defaults to `true`.
 * @return `{newDocument, result}` after the operation
 */
function applyOperation(document, operation, validateOperation, mutateDocument, banPrototypeModifications, index) {
    if (validateOperation === void 0) { validateOperation = false; }
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (index === void 0) { index = 0; }
    if (validateOperation) {
        if (typeof validateOperation == 'function') {
            validateOperation(operation, 0, document, operation.path);
        }
        else {
            validator(operation, 0);
        }
    }
    /* ROOT OPERATIONS */
    if (operation.path === "") {
        var returnValue = { newDocument: document };
        if (operation.op === 'add') {
            returnValue.newDocument = operation.value;
            return returnValue;
        }
        else if (operation.op === 'replace') {
            returnValue.newDocument = operation.value;
            returnValue.removed = document; //document we removed
            return returnValue;
        }
        else if (operation.op === 'move' || operation.op === 'copy') { // it's a move or copy to root
            returnValue.newDocument = getValueByPointer(document, operation.from); // get the value by json-pointer in `from` field
            if (operation.op === 'move') { // report removed item
                returnValue.removed = document;
            }
            return returnValue;
        }
        else if (operation.op === 'test') {
            returnValue.test = _areEquals(document, operation.value);
            if (returnValue.test === false) {
                throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
            }
            returnValue.newDocument = document;
            return returnValue;
        }
        else if (operation.op === 'remove') { // a remove on root
            returnValue.removed = document;
            returnValue.newDocument = null;
            return returnValue;
        }
        else if (operation.op === '_get') {
            operation.value = document;
            return returnValue;
        }
        else { /* bad operation */
            if (validateOperation) {
                throw new exports.JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
            }
            else {
                return returnValue;
            }
        }
    } /* END ROOT OPERATIONS */
    else {
        if (!mutateDocument) {
            document = helpers_js_1._deepClone(document);
        }
        var path = operation.path || "";
        var keys = path.split('/');
        var obj = document;
        var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
        var len = keys.length;
        var existingPathFragment = undefined;
        var key = void 0;
        var validateFunction = void 0;
        if (typeof validateOperation == 'function') {
            validateFunction = validateOperation;
        }
        else {
            validateFunction = validator;
        }
        while (true) {
            key = keys[t];
            if (banPrototypeModifications && key == '__proto__') {
                throw new TypeError('JSON-Patch: modifying `__proto__` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README');
            }
            if (validateOperation) {
                if (existingPathFragment === undefined) {
                    if (obj[key] === undefined) {
                        existingPathFragment = keys.slice(0, t).join('/');
                    }
                    else if (t == len - 1) {
                        existingPathFragment = operation.path;
                    }
                    if (existingPathFragment !== undefined) {
                        validateFunction(operation, 0, document, existingPathFragment);
                    }
                }
            }
            t++;
            if (Array.isArray(obj)) {
                if (key === '-') {
                    key = obj.length;
                }
                else {
                    if (validateOperation && !helpers_js_1.isInteger(key)) {
                        throw new exports.JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
                    } // only parse key when it's an integer for `arr.prop` to work
                    else if (helpers_js_1.isInteger(key)) {
                        key = ~~key;
                    }
                }
                if (t >= len) {
                    if (validateOperation && operation.op === "add" && key > obj.length) {
                        throw new exports.JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
                    }
                    var returnValue = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            else {
                if (key && key.indexOf('~') != -1) {
                    key = helpers_js_1.unescapePathComponent(key);
                }
                if (t >= len) {
                    var returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            obj = obj[key];
        }
    }
}
exports.applyOperation = applyOperation;
/**
 * Apply a full JSON Patch array on a JSON document.
 * Returns the {newDocument, result} of the patch.
 * It modifies the `document` object and `patch` - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyPatch(document, jsonpatch._deepClone(patch))`.
 *
 * @param document The document to patch
 * @param patch The patch to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @param banPrototypeModifications Whether to ban modifications to `__proto__`, defaults to `true`.
 * @return An array of `{newDocument, result}` after the patch
 */
function applyPatch(document, patch, validateOperation, mutateDocument, banPrototypeModifications) {
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (validateOperation) {
        if (!Array.isArray(patch)) {
            throw new exports.JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
    }
    if (!mutateDocument) {
        document = helpers_js_1._deepClone(document);
    }
    var results = new Array(patch.length);
    for (var i = 0, length_1 = patch.length; i < length_1; i++) {
        // we don't need to pass mutateDocument argument because if it was true, we already deep cloned the object, we'll just pass `true`
        results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
        document = results[i].newDocument; // in case root was replaced
    }
    results.newDocument = document;
    return results;
}
exports.applyPatch = applyPatch;
/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the updated document.
 * Suitable as a reducer.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @return The updated document
 */
function applyReducer(document, operation, index) {
    var operationResult = applyOperation(document, operation);
    if (operationResult.test === false) { // failed test
        throw new exports.JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
    }
    return operationResult.newDocument;
}
exports.applyReducer = applyReducer;
/**
 * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
 * @param {object} operation - operation object (patch)
 * @param {number} index - index of operation in the sequence
 * @param {object} [document] - object where the operation is supposed to be applied
 * @param {string} [existingPathFragment] - comes along with `document`
 */
function validator(operation, index, document, existingPathFragment) {
    if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
        throw new exports.JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, document);
    }
    else if (!objOps[operation.op]) {
        throw new exports.JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
    }
    else if (typeof operation.path !== 'string') {
        throw new exports.JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, document);
    }
    else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
        // paths that aren't empty string should start with "/"
        throw new exports.JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, document);
    }
    else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
        throw new exports.JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, document);
    }
    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
        throw new exports.JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, document);
    }
    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && helpers_js_1.hasUndefined(operation.value)) {
        throw new exports.JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, document);
    }
    else if (document) {
        if (operation.op == "add") {
            var pathLen = operation.path.split("/").length;
            var existingPathLen = existingPathFragment.split("/").length;
            if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
                throw new exports.JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, document);
            }
        }
        else if (operation.op === 'replace' || operation.op === 'remove' || operation.op === '_get') {
            if (operation.path !== existingPathFragment) {
                throw new exports.JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
            }
        }
        else if (operation.op === 'move' || operation.op === 'copy') {
            var existingValue = { op: "_get", path: operation.from, value: undefined };
            var error = validate([existingValue], document);
            if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
                throw new exports.JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
            }
        }
    }
}
exports.validator = validator;
/**
 * Validates a sequence of operations. If `document` parameter is provided, the sequence is additionally validated against the object document.
 * If error is encountered, returns a JsonPatchError object
 * @param sequence
 * @param document
 * @returns {JsonPatchError|undefined}
 */
function validate(sequence, document, externalValidator) {
    try {
        if (!Array.isArray(sequence)) {
            throw new exports.JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
        if (document) {
            //clone document and sequence so that we can safely try applying operations
            applyPatch(helpers_js_1._deepClone(document), helpers_js_1._deepClone(sequence), externalValidator || true);
        }
        else {
            externalValidator = externalValidator || validator;
            for (var i = 0; i < sequence.length; i++) {
                externalValidator(sequence[i], i, document, undefined);
            }
        }
    }
    catch (e) {
        if (e instanceof exports.JsonPatchError) {
            return e;
        }
        else {
            throw e;
        }
    }
}
exports.validate = validate;
// based on https://github.com/epoberezkin/fast-deep-equal
// MIT License
// Copyright (c) 2017 Evgeny Poberezkin
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function _areEquals(a, b) {
    if (a === b)
        return true;
    if (a && b && typeof a == 'object' && typeof b == 'object') {
        var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
        if (arrA && arrB) {
            length = a.length;
            if (length != b.length)
                return false;
            for (i = length; i-- !== 0;)
                if (!_areEquals(a[i], b[i]))
                    return false;
            return true;
        }
        if (arrA != arrB)
            return false;
        var keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length)
            return false;
        for (i = length; i-- !== 0;)
            if (!b.hasOwnProperty(keys[i]))
                return false;
        for (i = length; i-- !== 0;) {
            key = keys[i];
            if (!_areEquals(a[key], b[key]))
                return false;
        }
        return true;
    }
    return a !== a && b !== b;
}
exports._areEquals = _areEquals;
;

},{"./helpers.js":20}],19:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var helpers_js_1 = require("./helpers.js");
var core_js_1 = require("./core.js");
var beforeDict = new WeakMap();
var Mirror = /** @class */ (function () {
    function Mirror(obj) {
        this.observers = new Map();
        this.obj = obj;
    }
    return Mirror;
}());
var ObserverInfo = /** @class */ (function () {
    function ObserverInfo(callback, observer) {
        this.callback = callback;
        this.observer = observer;
    }
    return ObserverInfo;
}());
function getMirror(obj) {
    return beforeDict.get(obj);
}
function getObserverFromMirror(mirror, callback) {
    return mirror.observers.get(callback);
}
function removeObserverFromMirror(mirror, observer) {
    mirror.observers.delete(observer.callback);
}
/**
 * Detach an observer from an object
 */
function unobserve(root, observer) {
    observer.unobserve();
}
exports.unobserve = unobserve;
/**
 * Observes changes made to an object, which can then be retrieved using generate
 */
function observe(obj, callback) {
    var patches = [];
    var observer;
    var mirror = getMirror(obj);
    if (!mirror) {
        mirror = new Mirror(obj);
        beforeDict.set(obj, mirror);
    }
    else {
        var observerInfo = getObserverFromMirror(mirror, callback);
        observer = observerInfo && observerInfo.observer;
    }
    if (observer) {
        return observer;
    }
    observer = {};
    mirror.value = helpers_js_1._deepClone(obj);
    if (callback) {
        observer.callback = callback;
        observer.next = null;
        var dirtyCheck = function () {
            generate(observer);
        };
        var fastCheck = function () {
            clearTimeout(observer.next);
            observer.next = setTimeout(dirtyCheck);
        };
        if (typeof window !== 'undefined') { //not Node
            window.addEventListener('mouseup', fastCheck);
            window.addEventListener('keyup', fastCheck);
            window.addEventListener('mousedown', fastCheck);
            window.addEventListener('keydown', fastCheck);
            window.addEventListener('change', fastCheck);
        }
    }
    observer.patches = patches;
    observer.object = obj;
    observer.unobserve = function () {
        generate(observer);
        clearTimeout(observer.next);
        removeObserverFromMirror(mirror, observer);
        if (typeof window !== 'undefined') {
            window.removeEventListener('mouseup', fastCheck);
            window.removeEventListener('keyup', fastCheck);
            window.removeEventListener('mousedown', fastCheck);
            window.removeEventListener('keydown', fastCheck);
            window.removeEventListener('change', fastCheck);
        }
    };
    mirror.observers.set(callback, new ObserverInfo(callback, observer));
    return observer;
}
exports.observe = observe;
/**
 * Generate an array of patches from an observer
 */
function generate(observer, invertible) {
    if (invertible === void 0) { invertible = false; }
    var mirror = beforeDict.get(observer.object);
    _generate(mirror.value, observer.object, observer.patches, "", invertible);
    if (observer.patches.length) {
        core_js_1.applyPatch(mirror.value, observer.patches);
    }
    var temp = observer.patches;
    if (temp.length > 0) {
        observer.patches = [];
        if (observer.callback) {
            observer.callback(temp);
        }
    }
    return temp;
}
exports.generate = generate;
// Dirty check if obj is different from mirror, generate patches and update mirror
function _generate(mirror, obj, patches, path, invertible) {
    if (obj === mirror) {
        return;
    }
    if (typeof obj.toJSON === "function") {
        obj = obj.toJSON();
    }
    var newKeys = helpers_js_1._objectKeys(obj);
    var oldKeys = helpers_js_1._objectKeys(mirror);
    var changed = false;
    var deleted = false;
    //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"
    for (var t = oldKeys.length - 1; t >= 0; t--) {
        var key = oldKeys[t];
        var oldVal = mirror[key];
        if (helpers_js_1.hasOwnProperty(obj, key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
            var newVal = obj[key];
            if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
                _generate(oldVal, newVal, patches, path + "/" + helpers_js_1.escapePathComponent(key), invertible);
            }
            else {
                if (oldVal !== newVal) {
                    changed = true;
                    if (invertible) {
                        patches.push({ op: "test", path: path + "/" + helpers_js_1.escapePathComponent(key), value: helpers_js_1._deepClone(oldVal) });
                    }
                    patches.push({ op: "replace", path: path + "/" + helpers_js_1.escapePathComponent(key), value: helpers_js_1._deepClone(newVal) });
                }
            }
        }
        else if (Array.isArray(mirror) === Array.isArray(obj)) {
            if (invertible) {
                patches.push({ op: "test", path: path + "/" + helpers_js_1.escapePathComponent(key), value: helpers_js_1._deepClone(oldVal) });
            }
            patches.push({ op: "remove", path: path + "/" + helpers_js_1.escapePathComponent(key) });
            deleted = true; // property has been deleted
        }
        else {
            if (invertible) {
                patches.push({ op: "test", path: path, value: mirror });
            }
            patches.push({ op: "replace", path: path, value: obj });
            changed = true;
        }
    }
    if (!deleted && newKeys.length == oldKeys.length) {
        return;
    }
    for (var t = 0; t < newKeys.length; t++) {
        var key = newKeys[t];
        if (!helpers_js_1.hasOwnProperty(mirror, key) && obj[key] !== undefined) {
            patches.push({ op: "add", path: path + "/" + helpers_js_1.escapePathComponent(key), value: helpers_js_1._deepClone(obj[key]) });
        }
    }
}
/**
 * Create an array of patches from the differences in two objects
 */
function compare(tree1, tree2, invertible) {
    if (invertible === void 0) { invertible = false; }
    var patches = [];
    _generate(tree1, tree2, patches, '', invertible);
    return patches;
}
exports.compare = compare;

},{"./core.js":18,"./helpers.js":20}],20:[function(require,module,exports){
/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
    return _hasOwnProperty.call(obj, key);
}
exports.hasOwnProperty = hasOwnProperty;
function _objectKeys(obj) {
    if (Array.isArray(obj)) {
        var keys = new Array(obj.length);
        for (var k = 0; k < keys.length; k++) {
            keys[k] = "" + k;
        }
        return keys;
    }
    if (Object.keys) {
        return Object.keys(obj);
    }
    var keys = [];
    for (var i in obj) {
        if (hasOwnProperty(obj, i)) {
            keys.push(i);
        }
    }
    return keys;
}
exports._objectKeys = _objectKeys;
;
/**
* Deeply clone the object.
* https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
* @param  {any} obj value to clone
* @return {any} cloned obj
*/
function _deepClone(obj) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
        case "undefined":
            return null; //this is how JSON.stringify behaves for array items
        default:
            return obj; //no need to clone primitives
    }
}
exports._deepClone = _deepClone;
//3x faster than cached /^\d+$/.test(str)
function isInteger(str) {
    var i = 0;
    var len = str.length;
    var charCode;
    while (i < len) {
        charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            i++;
            continue;
        }
        return false;
    }
    return true;
}
exports.isInteger = isInteger;
/**
* Escapes a json pointer path
* @param path The raw pointer
* @return the Escaped path
*/
function escapePathComponent(path) {
    if (path.indexOf('/') === -1 && path.indexOf('~') === -1)
        return path;
    return path.replace(/~/g, '~0').replace(/\//g, '~1');
}
exports.escapePathComponent = escapePathComponent;
/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
function unescapePathComponent(path) {
    return path.replace(/~1/g, '/').replace(/~0/g, '~');
}
exports.unescapePathComponent = unescapePathComponent;
function _getPathRecursive(root, obj) {
    var found;
    for (var key in root) {
        if (hasOwnProperty(root, key)) {
            if (root[key] === obj) {
                return escapePathComponent(key) + '/';
            }
            else if (typeof root[key] === 'object') {
                found = _getPathRecursive(root[key], obj);
                if (found != '') {
                    return escapePathComponent(key) + '/' + found;
                }
            }
        }
    }
    return '';
}
exports._getPathRecursive = _getPathRecursive;
function getPath(root, obj) {
    if (root === obj) {
        return '/';
    }
    var path = _getPathRecursive(root, obj);
    if (path === '') {
        throw new Error("Object not found in root");
    }
    return '/' + path;
}
exports.getPath = getPath;
/**
* Recursively checks whether an object has any undefined values inside.
*/
function hasUndefined(obj) {
    if (obj === undefined) {
        return true;
    }
    if (obj) {
        if (Array.isArray(obj)) {
            for (var i = 0, len = obj.length; i < len; i++) {
                if (hasUndefined(obj[i])) {
                    return true;
                }
            }
        }
        else if (typeof obj === "object") {
            var objKeys = _objectKeys(obj);
            var objKeysLength = objKeys.length;
            for (var i = 0; i < objKeysLength; i++) {
                if (hasUndefined(obj[objKeys[i]])) {
                    return true;
                }
            }
        }
    }
    return false;
}
exports.hasUndefined = hasUndefined;
function patchErrorMessageFormatter(message, args) {
    var messageParts = [message];
    for (var key in args) {
        var value = typeof args[key] === 'object' ? JSON.stringify(args[key], null, 2) : args[key]; // pretty print
        if (typeof value !== 'undefined') {
            messageParts.push(key + ": " + value);
        }
    }
    return messageParts.join('\n');
}
var PatchError = /** @class */ (function (_super) {
    __extends(PatchError, _super);
    function PatchError(message, name, index, operation, tree) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree })) || this;
        _this.name = name;
        _this.index = index;
        _this.operation = operation;
        _this.tree = tree;
        Object.setPrototypeOf(_this, _newTarget.prototype); // restore prototype chain, see https://stackoverflow.com/a/48342359
        _this.message = patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree });
        return _this;
    }
    return PatchError;
}(Error));
exports.PatchError = PatchError;

},{}],21:[function(require,module,exports){
var core = require("./commonjs/core.js");
Object.assign(exports, core);

var duplex = require("./commonjs/duplex.js");
Object.assign(exports, duplex);

var helpers = require("./commonjs/helpers.js");
exports.JsonPatchError = helpers.PatchError;
exports.deepClone = helpers._deepClone;
exports.escapePathComponent = helpers.escapePathComponent;
exports.unescapePathComponent = helpers.unescapePathComponent;

},{"./commonjs/core.js":18,"./commonjs/duplex.js":19,"./commonjs/helpers.js":20}],22:[function(require,module,exports){
/**
 * Copyright (c) 2014, Chris Pettitt
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var lib = require("./lib");

module.exports = {
  Graph: lib.Graph,
  json: require("./lib/json"),
  alg: require("./lib/alg"),
  version: lib.version
};

},{"./lib":38,"./lib/alg":29,"./lib/json":39}],23:[function(require,module,exports){
var _ = require("../lodash");

module.exports = components;

function components(g) {
  var visited = {};
  var cmpts = [];
  var cmpt;

  function dfs(v) {
    if (_.has(visited, v)) return;
    visited[v] = true;
    cmpt.push(v);
    _.each(g.successors(v), dfs);
    _.each(g.predecessors(v), dfs);
  }

  _.each(g.nodes(), function(v) {
    cmpt = [];
    dfs(v);
    if (cmpt.length) {
      cmpts.push(cmpt);
    }
  });

  return cmpts;
}

},{"../lodash":40}],24:[function(require,module,exports){
var _ = require("../lodash");

module.exports = dfs;

/*
 * A helper that preforms a pre- or post-order traversal on the input graph
 * and returns the nodes in the order they were visited. If the graph is
 * undirected then this algorithm will navigate using neighbors. If the graph
 * is directed then this algorithm will navigate using successors.
 *
 * Order must be one of "pre" or "post".
 */
function dfs(g, vs, order) {
  if (!_.isArray(vs)) {
    vs = [vs];
  }

  var navigation = (g.isDirected() ? g.successors : g.neighbors).bind(g);

  var acc = [];
  var visited = {};
  _.each(vs, function(v) {
    if (!g.hasNode(v)) {
      throw new Error("Graph does not have node: " + v);
    }

    doDfs(g, v, order === "post", visited, navigation, acc);
  });
  return acc;
}

function doDfs(g, v, postorder, visited, navigation, acc) {
  if (!_.has(visited, v)) {
    visited[v] = true;

    if (!postorder) { acc.push(v); }
    _.each(navigation(v), function(w) {
      doDfs(g, w, postorder, visited, navigation, acc);
    });
    if (postorder) { acc.push(v); }
  }
}

},{"../lodash":40}],25:[function(require,module,exports){
var dijkstra = require("./dijkstra");
var _ = require("../lodash");

module.exports = dijkstraAll;

function dijkstraAll(g, weightFunc, edgeFunc) {
  return _.transform(g.nodes(), function(acc, v) {
    acc[v] = dijkstra(g, v, weightFunc, edgeFunc);
  }, {});
}

},{"../lodash":40,"./dijkstra":26}],26:[function(require,module,exports){
var _ = require("../lodash");
var PriorityQueue = require("../data/priority-queue");

module.exports = dijkstra;

var DEFAULT_WEIGHT_FUNC = _.constant(1);

function dijkstra(g, source, weightFn, edgeFn) {
  return runDijkstra(g, String(source),
    weightFn || DEFAULT_WEIGHT_FUNC,
    edgeFn || function(v) { return g.outEdges(v); });
}

function runDijkstra(g, source, weightFn, edgeFn) {
  var results = {};
  var pq = new PriorityQueue();
  var v, vEntry;

  var updateNeighbors = function(edge) {
    var w = edge.v !== v ? edge.v : edge.w;
    var wEntry = results[w];
    var weight = weightFn(edge);
    var distance = vEntry.distance + weight;

    if (weight < 0) {
      throw new Error("dijkstra does not allow negative edge weights. " +
                      "Bad edge: " + edge + " Weight: " + weight);
    }

    if (distance < wEntry.distance) {
      wEntry.distance = distance;
      wEntry.predecessor = v;
      pq.decrease(w, distance);
    }
  };

  g.nodes().forEach(function(v) {
    var distance = v === source ? 0 : Number.POSITIVE_INFINITY;
    results[v] = { distance: distance };
    pq.add(v, distance);
  });

  while (pq.size() > 0) {
    v = pq.removeMin();
    vEntry = results[v];
    if (vEntry.distance === Number.POSITIVE_INFINITY) {
      break;
    }

    edgeFn(v).forEach(updateNeighbors);
  }

  return results;
}

},{"../data/priority-queue":36,"../lodash":40}],27:[function(require,module,exports){
var _ = require("../lodash");
var tarjan = require("./tarjan");

module.exports = findCycles;

function findCycles(g) {
  return _.filter(tarjan(g), function(cmpt) {
    return cmpt.length > 1 || (cmpt.length === 1 && g.hasEdge(cmpt[0], cmpt[0]));
  });
}

},{"../lodash":40,"./tarjan":34}],28:[function(require,module,exports){
var _ = require("../lodash");

module.exports = floydWarshall;

var DEFAULT_WEIGHT_FUNC = _.constant(1);

function floydWarshall(g, weightFn, edgeFn) {
  return runFloydWarshall(g,
    weightFn || DEFAULT_WEIGHT_FUNC,
    edgeFn || function(v) { return g.outEdges(v); });
}

function runFloydWarshall(g, weightFn, edgeFn) {
  var results = {};
  var nodes = g.nodes();

  nodes.forEach(function(v) {
    results[v] = {};
    results[v][v] = { distance: 0 };
    nodes.forEach(function(w) {
      if (v !== w) {
        results[v][w] = { distance: Number.POSITIVE_INFINITY };
      }
    });
    edgeFn(v).forEach(function(edge) {
      var w = edge.v === v ? edge.w : edge.v;
      var d = weightFn(edge);
      results[v][w] = { distance: d, predecessor: v };
    });
  });

  nodes.forEach(function(k) {
    var rowK = results[k];
    nodes.forEach(function(i) {
      var rowI = results[i];
      nodes.forEach(function(j) {
        var ik = rowI[k];
        var kj = rowK[j];
        var ij = rowI[j];
        var altDistance = ik.distance + kj.distance;
        if (altDistance < ij.distance) {
          ij.distance = altDistance;
          ij.predecessor = kj.predecessor;
        }
      });
    });
  });

  return results;
}

},{"../lodash":40}],29:[function(require,module,exports){
module.exports = {
  components: require("./components"),
  dijkstra: require("./dijkstra"),
  dijkstraAll: require("./dijkstra-all"),
  findCycles: require("./find-cycles"),
  floydWarshall: require("./floyd-warshall"),
  isAcyclic: require("./is-acyclic"),
  postorder: require("./postorder"),
  preorder: require("./preorder"),
  prim: require("./prim"),
  tarjan: require("./tarjan"),
  topsort: require("./topsort")
};

},{"./components":23,"./dijkstra":26,"./dijkstra-all":25,"./find-cycles":27,"./floyd-warshall":28,"./is-acyclic":30,"./postorder":31,"./preorder":32,"./prim":33,"./tarjan":34,"./topsort":35}],30:[function(require,module,exports){
var topsort = require("./topsort");

module.exports = isAcyclic;

function isAcyclic(g) {
  try {
    topsort(g);
  } catch (e) {
    if (e instanceof topsort.CycleException) {
      return false;
    }
    throw e;
  }
  return true;
}

},{"./topsort":35}],31:[function(require,module,exports){
var dfs = require("./dfs");

module.exports = postorder;

function postorder(g, vs) {
  return dfs(g, vs, "post");
}

},{"./dfs":24}],32:[function(require,module,exports){
var dfs = require("./dfs");

module.exports = preorder;

function preorder(g, vs) {
  return dfs(g, vs, "pre");
}

},{"./dfs":24}],33:[function(require,module,exports){
var _ = require("../lodash");
var Graph = require("../graph");
var PriorityQueue = require("../data/priority-queue");

module.exports = prim;

function prim(g, weightFunc) {
  var result = new Graph();
  var parents = {};
  var pq = new PriorityQueue();
  var v;

  function updateNeighbors(edge) {
    var w = edge.v === v ? edge.w : edge.v;
    var pri = pq.priority(w);
    if (pri !== undefined) {
      var edgeWeight = weightFunc(edge);
      if (edgeWeight < pri) {
        parents[w] = v;
        pq.decrease(w, edgeWeight);
      }
    }
  }

  if (g.nodeCount() === 0) {
    return result;
  }

  _.each(g.nodes(), function(v) {
    pq.add(v, Number.POSITIVE_INFINITY);
    result.setNode(v);
  });

  // Start from an arbitrary node
  pq.decrease(g.nodes()[0], 0);

  var init = false;
  while (pq.size() > 0) {
    v = pq.removeMin();
    if (_.has(parents, v)) {
      result.setEdge(v, parents[v]);
    } else if (init) {
      throw new Error("Input graph is not connected: " + g);
    } else {
      init = true;
    }

    g.nodeEdges(v).forEach(updateNeighbors);
  }

  return result;
}

},{"../data/priority-queue":36,"../graph":37,"../lodash":40}],34:[function(require,module,exports){
var _ = require("../lodash");

module.exports = tarjan;

function tarjan(g) {
  var index = 0;
  var stack = [];
  var visited = {}; // node id -> { onStack, lowlink, index }
  var results = [];

  function dfs(v) {
    var entry = visited[v] = {
      onStack: true,
      lowlink: index,
      index: index++
    };
    stack.push(v);

    g.successors(v).forEach(function(w) {
      if (!_.has(visited, w)) {
        dfs(w);
        entry.lowlink = Math.min(entry.lowlink, visited[w].lowlink);
      } else if (visited[w].onStack) {
        entry.lowlink = Math.min(entry.lowlink, visited[w].index);
      }
    });

    if (entry.lowlink === entry.index) {
      var cmpt = [];
      var w;
      do {
        w = stack.pop();
        visited[w].onStack = false;
        cmpt.push(w);
      } while (v !== w);
      results.push(cmpt);
    }
  }

  g.nodes().forEach(function(v) {
    if (!_.has(visited, v)) {
      dfs(v);
    }
  });

  return results;
}

},{"../lodash":40}],35:[function(require,module,exports){
var _ = require("../lodash");

module.exports = topsort;
topsort.CycleException = CycleException;

function topsort(g) {
  var visited = {};
  var stack = {};
  var results = [];

  function visit(node) {
    if (_.has(stack, node)) {
      throw new CycleException();
    }

    if (!_.has(visited, node)) {
      stack[node] = true;
      visited[node] = true;
      _.each(g.predecessors(node), visit);
      delete stack[node];
      results.push(node);
    }
  }

  _.each(g.sinks(), visit);

  if (_.size(visited) !== g.nodeCount()) {
    throw new CycleException();
  }

  return results;
}

function CycleException() {}
CycleException.prototype = new Error(); // must be an instance of Error to pass testing
},{"../lodash":40}],36:[function(require,module,exports){
var _ = require("../lodash");

module.exports = PriorityQueue;

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
function PriorityQueue() {
  this._arr = [];
  this._keyIndices = {};
}

/**
 * Returns the number of elements in the queue. Takes `O(1)` time.
 */
PriorityQueue.prototype.size = function() {
  return this._arr.length;
};

/**
 * Returns the keys that are in the queue. Takes `O(n)` time.
 */
PriorityQueue.prototype.keys = function() {
  return this._arr.map(function(x) { return x.key; });
};

/**
 * Returns `true` if **key** is in the queue and `false` if not.
 */
PriorityQueue.prototype.has = function(key) {
  return _.has(this._keyIndices, key);
};

/**
 * Returns the priority for **key**. If **key** is not present in the queue
 * then this function returns `undefined`. Takes `O(1)` time.
 *
 * @param {Object} key
 */
PriorityQueue.prototype.priority = function(key) {
  var index = this._keyIndices[key];
  if (index !== undefined) {
    return this._arr[index].priority;
  }
};

/**
 * Returns the key for the minimum element in this queue. If the queue is
 * empty this function throws an Error. Takes `O(1)` time.
 */
PriorityQueue.prototype.min = function() {
  if (this.size() === 0) {
    throw new Error("Queue underflow");
  }
  return this._arr[0].key;
};

/**
 * Inserts a new key into the priority queue. If the key already exists in
 * the queue this function returns `false`; otherwise it will return `true`.
 * Takes `O(n)` time.
 *
 * @param {Object} key the key to add
 * @param {Number} priority the initial priority for the key
 */
PriorityQueue.prototype.add = function(key, priority) {
  var keyIndices = this._keyIndices;
  key = String(key);
  if (!_.has(keyIndices, key)) {
    var arr = this._arr;
    var index = arr.length;
    keyIndices[key] = index;
    arr.push({key: key, priority: priority});
    this._decrease(index);
    return true;
  }
  return false;
};

/**
 * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
 */
PriorityQueue.prototype.removeMin = function() {
  this._swap(0, this._arr.length - 1);
  var min = this._arr.pop();
  delete this._keyIndices[min.key];
  this._heapify(0);
  return min.key;
};

/**
 * Decreases the priority for **key** to **priority**. If the new priority is
 * greater than the previous priority, this function will throw an Error.
 *
 * @param {Object} key the key for which to raise priority
 * @param {Number} priority the new priority for the key
 */
PriorityQueue.prototype.decrease = function(key, priority) {
  var index = this._keyIndices[key];
  if (priority > this._arr[index].priority) {
    throw new Error("New priority is greater than current priority. " +
        "Key: " + key + " Old: " + this._arr[index].priority + " New: " + priority);
  }
  this._arr[index].priority = priority;
  this._decrease(index);
};

PriorityQueue.prototype._heapify = function(i) {
  var arr = this._arr;
  var l = 2 * i;
  var r = l + 1;
  var largest = i;
  if (l < arr.length) {
    largest = arr[l].priority < arr[largest].priority ? l : largest;
    if (r < arr.length) {
      largest = arr[r].priority < arr[largest].priority ? r : largest;
    }
    if (largest !== i) {
      this._swap(i, largest);
      this._heapify(largest);
    }
  }
};

PriorityQueue.prototype._decrease = function(index) {
  var arr = this._arr;
  var priority = arr[index].priority;
  var parent;
  while (index !== 0) {
    parent = index >> 1;
    if (arr[parent].priority < priority) {
      break;
    }
    this._swap(index, parent);
    index = parent;
  }
};

PriorityQueue.prototype._swap = function(i, j) {
  var arr = this._arr;
  var keyIndices = this._keyIndices;
  var origArrI = arr[i];
  var origArrJ = arr[j];
  arr[i] = origArrJ;
  arr[j] = origArrI;
  keyIndices[origArrJ.key] = i;
  keyIndices[origArrI.key] = j;
};

},{"../lodash":40}],37:[function(require,module,exports){
"use strict";

var _ = require("./lodash");

module.exports = Graph;

var DEFAULT_EDGE_NAME = "\x00";
var GRAPH_NODE = "\x00";
var EDGE_KEY_DELIM = "\x01";

// Implementation notes:
//
//  * Node id query functions should return string ids for the nodes
//  * Edge id query functions should return an "edgeObj", edge object, that is
//    composed of enough information to uniquely identify an edge: {v, w, name}.
//  * Internally we use an "edgeId", a stringified form of the edgeObj, to
//    reference edges. This is because we need a performant way to look these
//    edges up and, object properties, which have string keys, are the closest
//    we're going to get to a performant hashtable in JavaScript.

function Graph(opts) {
  this._isDirected = _.has(opts, "directed") ? opts.directed : true;
  this._isMultigraph = _.has(opts, "multigraph") ? opts.multigraph : false;
  this._isCompound = _.has(opts, "compound") ? opts.compound : false;

  // Label for the graph itself
  this._label = undefined;

  // Defaults to be set when creating a new node
  this._defaultNodeLabelFn = _.constant(undefined);

  // Defaults to be set when creating a new edge
  this._defaultEdgeLabelFn = _.constant(undefined);

  // v -> label
  this._nodes = {};

  if (this._isCompound) {
    // v -> parent
    this._parent = {};

    // v -> children
    this._children = {};
    this._children[GRAPH_NODE] = {};
  }

  // v -> edgeObj
  this._in = {};

  // u -> v -> Number
  this._preds = {};

  // v -> edgeObj
  this._out = {};

  // v -> w -> Number
  this._sucs = {};

  // e -> edgeObj
  this._edgeObjs = {};

  // e -> label
  this._edgeLabels = {};
}

/* Number of nodes in the graph. Should only be changed by the implementation. */
Graph.prototype._nodeCount = 0;

/* Number of edges in the graph. Should only be changed by the implementation. */
Graph.prototype._edgeCount = 0;


/* === Graph functions ========= */

Graph.prototype.isDirected = function() {
  return this._isDirected;
};

Graph.prototype.isMultigraph = function() {
  return this._isMultigraph;
};

Graph.prototype.isCompound = function() {
  return this._isCompound;
};

Graph.prototype.setGraph = function(label) {
  this._label = label;
  return this;
};

Graph.prototype.graph = function() {
  return this._label;
};


/* === Node functions ========== */

Graph.prototype.setDefaultNodeLabel = function(newDefault) {
  if (!_.isFunction(newDefault)) {
    newDefault = _.constant(newDefault);
  }
  this._defaultNodeLabelFn = newDefault;
  return this;
};

Graph.prototype.nodeCount = function() {
  return this._nodeCount;
};

Graph.prototype.nodes = function() {
  return _.keys(this._nodes);
};

Graph.prototype.sources = function() {
  var self = this;
  return _.filter(this.nodes(), function(v) {
    return _.isEmpty(self._in[v]);
  });
};

Graph.prototype.sinks = function() {
  var self = this;
  return _.filter(this.nodes(), function(v) {
    return _.isEmpty(self._out[v]);
  });
};

Graph.prototype.setNodes = function(vs, value) {
  var args = arguments;
  var self = this;
  _.each(vs, function(v) {
    if (args.length > 1) {
      self.setNode(v, value);
    } else {
      self.setNode(v);
    }
  });
  return this;
};

Graph.prototype.setNode = function(v, value) {
  if (_.has(this._nodes, v)) {
    if (arguments.length > 1) {
      this._nodes[v] = value;
    }
    return this;
  }

  this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v);
  if (this._isCompound) {
    this._parent[v] = GRAPH_NODE;
    this._children[v] = {};
    this._children[GRAPH_NODE][v] = true;
  }
  this._in[v] = {};
  this._preds[v] = {};
  this._out[v] = {};
  this._sucs[v] = {};
  ++this._nodeCount;
  return this;
};

Graph.prototype.node = function(v) {
  return this._nodes[v];
};

Graph.prototype.hasNode = function(v) {
  return _.has(this._nodes, v);
};

Graph.prototype.removeNode =  function(v) {
  var self = this;
  if (_.has(this._nodes, v)) {
    var removeEdge = function(e) { self.removeEdge(self._edgeObjs[e]); };
    delete this._nodes[v];
    if (this._isCompound) {
      this._removeFromParentsChildList(v);
      delete this._parent[v];
      _.each(this.children(v), function(child) {
        self.setParent(child);
      });
      delete this._children[v];
    }
    _.each(_.keys(this._in[v]), removeEdge);
    delete this._in[v];
    delete this._preds[v];
    _.each(_.keys(this._out[v]), removeEdge);
    delete this._out[v];
    delete this._sucs[v];
    --this._nodeCount;
  }
  return this;
};

Graph.prototype.setParent = function(v, parent) {
  if (!this._isCompound) {
    throw new Error("Cannot set parent in a non-compound graph");
  }

  if (_.isUndefined(parent)) {
    parent = GRAPH_NODE;
  } else {
    // Coerce parent to string
    parent += "";
    for (var ancestor = parent;
      !_.isUndefined(ancestor);
      ancestor = this.parent(ancestor)) {
      if (ancestor === v) {
        throw new Error("Setting " + parent+ " as parent of " + v +
                        " would create a cycle");
      }
    }

    this.setNode(parent);
  }

  this.setNode(v);
  this._removeFromParentsChildList(v);
  this._parent[v] = parent;
  this._children[parent][v] = true;
  return this;
};

Graph.prototype._removeFromParentsChildList = function(v) {
  delete this._children[this._parent[v]][v];
};

Graph.prototype.parent = function(v) {
  if (this._isCompound) {
    var parent = this._parent[v];
    if (parent !== GRAPH_NODE) {
      return parent;
    }
  }
};

Graph.prototype.children = function(v) {
  if (_.isUndefined(v)) {
    v = GRAPH_NODE;
  }

  if (this._isCompound) {
    var children = this._children[v];
    if (children) {
      return _.keys(children);
    }
  } else if (v === GRAPH_NODE) {
    return this.nodes();
  } else if (this.hasNode(v)) {
    return [];
  }
};

Graph.prototype.predecessors = function(v) {
  var predsV = this._preds[v];
  if (predsV) {
    return _.keys(predsV);
  }
};

Graph.prototype.successors = function(v) {
  var sucsV = this._sucs[v];
  if (sucsV) {
    return _.keys(sucsV);
  }
};

Graph.prototype.neighbors = function(v) {
  var preds = this.predecessors(v);
  if (preds) {
    return _.union(preds, this.successors(v));
  }
};

Graph.prototype.isLeaf = function (v) {
  var neighbors;
  if (this.isDirected()) {
    neighbors = this.successors(v);
  } else {
    neighbors = this.neighbors(v);
  }
  return neighbors.length === 0;
};

Graph.prototype.filterNodes = function(filter) {
  var copy = new this.constructor({
    directed: this._isDirected,
    multigraph: this._isMultigraph,
    compound: this._isCompound
  });

  copy.setGraph(this.graph());

  var self = this;
  _.each(this._nodes, function(value, v) {
    if (filter(v)) {
      copy.setNode(v, value);
    }
  });

  _.each(this._edgeObjs, function(e) {
    if (copy.hasNode(e.v) && copy.hasNode(e.w)) {
      copy.setEdge(e, self.edge(e));
    }
  });

  var parents = {};
  function findParent(v) {
    var parent = self.parent(v);
    if (parent === undefined || copy.hasNode(parent)) {
      parents[v] = parent;
      return parent;
    } else if (parent in parents) {
      return parents[parent];
    } else {
      return findParent(parent);
    }
  }

  if (this._isCompound) {
    _.each(copy.nodes(), function(v) {
      copy.setParent(v, findParent(v));
    });
  }

  return copy;
};

/* === Edge functions ========== */

Graph.prototype.setDefaultEdgeLabel = function(newDefault) {
  if (!_.isFunction(newDefault)) {
    newDefault = _.constant(newDefault);
  }
  this._defaultEdgeLabelFn = newDefault;
  return this;
};

Graph.prototype.edgeCount = function() {
  return this._edgeCount;
};

Graph.prototype.edges = function() {
  return _.values(this._edgeObjs);
};

Graph.prototype.setPath = function(vs, value) {
  var self = this;
  var args = arguments;
  _.reduce(vs, function(v, w) {
    if (args.length > 1) {
      self.setEdge(v, w, value);
    } else {
      self.setEdge(v, w);
    }
    return w;
  });
  return this;
};

/*
 * setEdge(v, w, [value, [name]])
 * setEdge({ v, w, [name] }, [value])
 */
Graph.prototype.setEdge = function() {
  var v, w, name, value;
  var valueSpecified = false;
  var arg0 = arguments[0];

  if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
    v = arg0.v;
    w = arg0.w;
    name = arg0.name;
    if (arguments.length === 2) {
      value = arguments[1];
      valueSpecified = true;
    }
  } else {
    v = arg0;
    w = arguments[1];
    name = arguments[3];
    if (arguments.length > 2) {
      value = arguments[2];
      valueSpecified = true;
    }
  }

  v = "" + v;
  w = "" + w;
  if (!_.isUndefined(name)) {
    name = "" + name;
  }

  var e = edgeArgsToId(this._isDirected, v, w, name);
  if (_.has(this._edgeLabels, e)) {
    if (valueSpecified) {
      this._edgeLabels[e] = value;
    }
    return this;
  }

  if (!_.isUndefined(name) && !this._isMultigraph) {
    throw new Error("Cannot set a named edge when isMultigraph = false");
  }

  // It didn't exist, so we need to create it.
  // First ensure the nodes exist.
  this.setNode(v);
  this.setNode(w);

  this._edgeLabels[e] = valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name);

  var edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
  // Ensure we add undirected edges in a consistent way.
  v = edgeObj.v;
  w = edgeObj.w;

  Object.freeze(edgeObj);
  this._edgeObjs[e] = edgeObj;
  incrementOrInitEntry(this._preds[w], v);
  incrementOrInitEntry(this._sucs[v], w);
  this._in[w][e] = edgeObj;
  this._out[v][e] = edgeObj;
  this._edgeCount++;
  return this;
};

Graph.prototype.edge = function(v, w, name) {
  var e = (arguments.length === 1
    ? edgeObjToId(this._isDirected, arguments[0])
    : edgeArgsToId(this._isDirected, v, w, name));
  return this._edgeLabels[e];
};

Graph.prototype.hasEdge = function(v, w, name) {
  var e = (arguments.length === 1
    ? edgeObjToId(this._isDirected, arguments[0])
    : edgeArgsToId(this._isDirected, v, w, name));
  return _.has(this._edgeLabels, e);
};

Graph.prototype.removeEdge = function(v, w, name) {
  var e = (arguments.length === 1
    ? edgeObjToId(this._isDirected, arguments[0])
    : edgeArgsToId(this._isDirected, v, w, name));
  var edge = this._edgeObjs[e];
  if (edge) {
    v = edge.v;
    w = edge.w;
    delete this._edgeLabels[e];
    delete this._edgeObjs[e];
    decrementOrRemoveEntry(this._preds[w], v);
    decrementOrRemoveEntry(this._sucs[v], w);
    delete this._in[w][e];
    delete this._out[v][e];
    this._edgeCount--;
  }
  return this;
};

Graph.prototype.inEdges = function(v, u) {
  var inV = this._in[v];
  if (inV) {
    var edges = _.values(inV);
    if (!u) {
      return edges;
    }
    return _.filter(edges, function(edge) { return edge.v === u; });
  }
};

Graph.prototype.outEdges = function(v, w) {
  var outV = this._out[v];
  if (outV) {
    var edges = _.values(outV);
    if (!w) {
      return edges;
    }
    return _.filter(edges, function(edge) { return edge.w === w; });
  }
};

Graph.prototype.nodeEdges = function(v, w) {
  var inEdges = this.inEdges(v, w);
  if (inEdges) {
    return inEdges.concat(this.outEdges(v, w));
  }
};

function incrementOrInitEntry(map, k) {
  if (map[k]) {
    map[k]++;
  } else {
    map[k] = 1;
  }
}

function decrementOrRemoveEntry(map, k) {
  if (!--map[k]) { delete map[k]; }
}

function edgeArgsToId(isDirected, v_, w_, name) {
  var v = "" + v_;
  var w = "" + w_;
  if (!isDirected && v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }
  return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM +
             (_.isUndefined(name) ? DEFAULT_EDGE_NAME : name);
}

function edgeArgsToObj(isDirected, v_, w_, name) {
  var v = "" + v_;
  var w = "" + w_;
  if (!isDirected && v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }
  var edgeObj =  { v: v, w: w };
  if (name) {
    edgeObj.name = name;
  }
  return edgeObj;
}

function edgeObjToId(isDirected, edgeObj) {
  return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}

},{"./lodash":40}],38:[function(require,module,exports){
// Includes only the "core" of graphlib
module.exports = {
  Graph: require("./graph"),
  version: require("./version")
};

},{"./graph":37,"./version":41}],39:[function(require,module,exports){
var _ = require("./lodash");
var Graph = require("./graph");

module.exports = {
  write: write,
  read: read
};

function write(g) {
  var json = {
    options: {
      directed: g.isDirected(),
      multigraph: g.isMultigraph(),
      compound: g.isCompound()
    },
    nodes: writeNodes(g),
    edges: writeEdges(g)
  };
  if (!_.isUndefined(g.graph())) {
    json.value = _.clone(g.graph());
  }
  return json;
}

function writeNodes(g) {
  return _.map(g.nodes(), function(v) {
    var nodeValue = g.node(v);
    var parent = g.parent(v);
    var node = { v: v };
    if (!_.isUndefined(nodeValue)) {
      node.value = nodeValue;
    }
    if (!_.isUndefined(parent)) {
      node.parent = parent;
    }
    return node;
  });
}

function writeEdges(g) {
  return _.map(g.edges(), function(e) {
    var edgeValue = g.edge(e);
    var edge = { v: e.v, w: e.w };
    if (!_.isUndefined(e.name)) {
      edge.name = e.name;
    }
    if (!_.isUndefined(edgeValue)) {
      edge.value = edgeValue;
    }
    return edge;
  });
}

function read(json) {
  var g = new Graph(json.options).setGraph(json.value);
  _.each(json.nodes, function(entry) {
    g.setNode(entry.v, entry.value);
    if (entry.parent) {
      g.setParent(entry.v, entry.parent);
    }
  });
  _.each(json.edges, function(entry) {
    g.setEdge({ v: entry.v, w: entry.w, name: entry.name }, entry.value);
  });
  return g;
}

},{"./graph":37,"./lodash":40}],40:[function(require,module,exports){
/* global window */

var lodash;

if (typeof require === "function") {
  try {
    lodash = {
      clone: require("lodash/clone"),
      constant: require("lodash/constant"),
      each: require("lodash/each"),
      filter: require("lodash/filter"),
      has:  require("lodash/has"),
      isArray: require("lodash/isArray"),
      isEmpty: require("lodash/isEmpty"),
      isFunction: require("lodash/isFunction"),
      isUndefined: require("lodash/isUndefined"),
      keys: require("lodash/keys"),
      map: require("lodash/map"),
      reduce: require("lodash/reduce"),
      size: require("lodash/size"),
      transform: require("lodash/transform"),
      union: require("lodash/union"),
      values: require("lodash/values")
    };
  } catch (e) {
    // continue regardless of error
  }
}

if (!lodash) {
  lodash = window._;
}

module.exports = lodash;

},{"lodash/clone":231,"lodash/constant":232,"lodash/each":233,"lodash/filter":235,"lodash/has":238,"lodash/isArray":242,"lodash/isEmpty":246,"lodash/isFunction":247,"lodash/isUndefined":256,"lodash/keys":257,"lodash/map":259,"lodash/reduce":263,"lodash/size":264,"lodash/transform":268,"lodash/union":269,"lodash/values":270}],41:[function(require,module,exports){
module.exports = '2.1.8';

},{}],42:[function(require,module,exports){
'use strict';


var yaml = require('./lib/js-yaml.js');


module.exports = yaml;

},{"./lib/js-yaml.js":43}],43:[function(require,module,exports){
'use strict';


var loader = require('./js-yaml/loader');
var dumper = require('./js-yaml/dumper');


function deprecated(name) {
  return function () {
    throw new Error('Function ' + name + ' is deprecated and cannot be used.');
  };
}


module.exports.Type                = require('./js-yaml/type');
module.exports.Schema              = require('./js-yaml/schema');
module.exports.FAILSAFE_SCHEMA     = require('./js-yaml/schema/failsafe');
module.exports.JSON_SCHEMA         = require('./js-yaml/schema/json');
module.exports.CORE_SCHEMA         = require('./js-yaml/schema/core');
module.exports.DEFAULT_SAFE_SCHEMA = require('./js-yaml/schema/default_safe');
module.exports.DEFAULT_FULL_SCHEMA = require('./js-yaml/schema/default_full');
module.exports.load                = loader.load;
module.exports.loadAll             = loader.loadAll;
module.exports.safeLoad            = loader.safeLoad;
module.exports.safeLoadAll         = loader.safeLoadAll;
module.exports.dump                = dumper.dump;
module.exports.safeDump            = dumper.safeDump;
module.exports.YAMLException       = require('./js-yaml/exception');

// Deprecated schema names from JS-YAML 2.0.x
module.exports.MINIMAL_SCHEMA = require('./js-yaml/schema/failsafe');
module.exports.SAFE_SCHEMA    = require('./js-yaml/schema/default_safe');
module.exports.DEFAULT_SCHEMA = require('./js-yaml/schema/default_full');

// Deprecated functions from JS-YAML 1.x.x
module.exports.scan           = deprecated('scan');
module.exports.parse          = deprecated('parse');
module.exports.compose        = deprecated('compose');
module.exports.addConstructor = deprecated('addConstructor');

},{"./js-yaml/dumper":45,"./js-yaml/exception":46,"./js-yaml/loader":47,"./js-yaml/schema":49,"./js-yaml/schema/core":50,"./js-yaml/schema/default_full":51,"./js-yaml/schema/default_safe":52,"./js-yaml/schema/failsafe":53,"./js-yaml/schema/json":54,"./js-yaml/type":55}],44:[function(require,module,exports){
'use strict';


function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


module.exports.isNothing      = isNothing;
module.exports.isObject       = isObject;
module.exports.toArray        = toArray;
module.exports.repeat         = repeat;
module.exports.isNegativeZero = isNegativeZero;
module.exports.extend         = extend;

},{}],45:[function(require,module,exports){
'use strict';

/*eslint-disable no-use-before-define*/

var common              = require('./common');
var YAMLException       = require('./exception');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');

var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;

var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_EQUALS               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new YAMLException('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}

function State(options) {
  this.schema        = options['schema'] || DEFAULT_FULL_SCHEMA;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== 0xFEFF /* BOM */)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// [24] b-line-feed       ::=     #xA    /* LF */
// [25] b-carriage-return ::=     #xD    /* CR */
// [3]  c-byte-order-mark ::=     #xFEFF
function isNsChar(c) {
  return isPrintable(c) && !isWhitespace(c)
    // byte-order-mark
    && c !== 0xFEFF
    // b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// Simplified test for values allowed after the first character in plain style.
function isPlainSafe(c, prev) {
  // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
  // where nb-char ::= c-printable - b-char - c-byte-order-mark.
  return isPrintable(c) && c !== 0xFEFF
    // - c-flow-indicator
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // - ":" - "#"
    // /* An ns-char preceding */ "#"
    && c !== CHAR_COLON
    && ((c !== CHAR_SHARP) || (prev && isNsChar(prev)));
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  return isPrintable(c) && c !== 0xFEFF
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
  var i;
  var char, prev_char;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(string.charCodeAt(0))
          && !isWhitespace(string.charCodeAt(string.length - 1));

  if (singleLineOnly) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; i++) {
      char = string.charCodeAt(i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
      plain = plain && isPlainSafe(char, prev_char);
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; i++) {
      char = string.charCodeAt(i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
      plain = plain && isPlainSafe(char, prev_char);
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    return plain && !testAmbiguousType(string)
      ? STYLE_PLAIN : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey) {
  state.dump = (function () {
    if (string.length === 0) {
      return "''";
    }
    if (!state.noCompatMode &&
        DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
      return "'" + string + "'";
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string, lineWidth) + '"';
      default:
        throw new YAMLException('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString(string) {
  var result = '';
  var char, nextChar;
  var escapeSeq;

  for (var i = 0; i < string.length; i++) {
    char = string.charCodeAt(i);
    // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").
    if (char >= 0xD800 && char <= 0xDBFF/* high surrogate */) {
      nextChar = string.charCodeAt(i + 1);
      if (nextChar >= 0xDC00 && nextChar <= 0xDFFF/* low surrogate */) {
        // Combine the surrogate pair and store it escaped.
        result += encodeHex((char - 0xD800) * 0x400 + nextChar - 0xDC00 + 0x10000);
        // Advance index one extra since we already used that char here.
        i++; continue;
      }
    }
    escapeSeq = ESCAPE_SEQUENCES[char];
    result += !escapeSeq && isPrintable(char)
      ? string[i]
      : escapeSeq || encodeHex(char);
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level, object[index], false, false)) {
      if (index !== 0) _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length;

  for (index = 0, length = object.length; index < length; index += 1) {
    // Write only valid elements.
    if (writeNode(state, level + 1, object[index], true, true)) {
      if (!compact || index !== 0) {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (index !== 0) pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new YAMLException('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || index !== 0) {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      state.tag = explicit ? type.tag : '?';

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new YAMLException('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      var arrayLevel = (state.noArrayIndent && (level > 0)) ? level - 1 : level;
      if (block && (state.dump.length !== 0)) {
        writeBlockSequence(state, arrayLevel, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, arrayLevel, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey);
      }
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      state.dump = '!<' + state.tag + '> ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump(input, options) {
  options = options || {};

  var state = new State(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  if (writeNode(state, 0, input, true, true)) return state.dump + '\n';

  return '';
}

function safeDump(input, options) {
  return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}

module.exports.dump     = dump;
module.exports.safeDump = safeDump;

},{"./common":44,"./exception":46,"./schema/default_full":51,"./schema/default_safe":52}],46:[function(require,module,exports){
// YAML error class. http://stackoverflow.com/questions/8458984
//
'use strict';

function YAMLException(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = (this.reason || '(unknown reason)') + (this.mark ? ' ' + this.mark.toString() : '');

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException.prototype = Object.create(Error.prototype);
YAMLException.prototype.constructor = YAMLException;


YAMLException.prototype.toString = function toString(compact) {
  var result = this.name + ': ';

  result += this.reason || '(unknown reason)';

  if (!compact && this.mark) {
    result += ' ' + this.mark.toString();
  }

  return result;
};


module.exports = YAMLException;

},{}],47:[function(require,module,exports){
'use strict';

/*eslint-disable max-len,no-use-before-define*/

var common              = require('./common');
var YAMLException       = require('./exception');
var Mark                = require('./mark');
var DEFAULT_SAFE_SCHEMA = require('./schema/default_safe');
var DEFAULT_FULL_SCHEMA = require('./schema/default_full');


var _hasOwnProperty = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || DEFAULT_FULL_SCHEMA;
  this.onWarning = options['onWarning'] || null;
  this.legacy    = options['legacy']    || false;
  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  return new YAMLException(
    message,
    new Mark(state.filename, state.input, state.position, state.line, (state.position - state.lineStart)));
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty.call(overridableKeys, keyNode) &&
        _hasOwnProperty.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }
    _result[keyNode] = valueNode;
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = {},
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _pos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = {},
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.
    _pos = state.position;

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }

    } else {
      break; // Reading is done. Go to the epilogue.
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if (state.lineIndent > nodeIndent && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!state.anchorMap.hasOwnProperty(alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag !== null && state.tag !== '!') {
    if (state.tag === '?') {
      // Implicit resolving is not allowed for non-scalar types, and '?'
      // non-specific tag is only automatically assigned to plain scalars.
      //
      // We only need to check kind conformity in case user explicitly assigns '?'
      // tag, for example like this: "!<?> [0]"
      //
      if (state.result !== null && state.kind !== 'scalar') {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }

      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type = state.implicitTypes[typeIndex];

        if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
          state.result = type.construct(state.result);
          state.tag = type.tag;
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
          break;
        }
      }
    } else if (_hasOwnProperty.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];

      if (state.result !== null && type.kind !== state.kind) {
        throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
      }

      if (!type.resolve(state.result)) { // `state.result` updated in resolver if matched
        throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
      } else {
        state.result = type.construct(state.result);
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = {};
  state.anchorMap = {};

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException('expected a single document in the stream, but found more');
}


function safeLoadAll(input, iterator, options) {
  if (typeof iterator === 'object' && iterator !== null && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  return loadAll(input, iterator, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


function safeLoad(input, options) {
  return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options));
}


module.exports.loadAll     = loadAll;
module.exports.load        = load;
module.exports.safeLoadAll = safeLoadAll;
module.exports.safeLoad    = safeLoad;

},{"./common":44,"./exception":46,"./mark":48,"./schema/default_full":51,"./schema/default_safe":52}],48:[function(require,module,exports){
'use strict';


var common = require('./common');


function Mark(name, buffer, position, line, column) {
  this.name     = name;
  this.buffer   = buffer;
  this.position = position;
  this.line     = line;
  this.column   = column;
}


Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
  var head, start, tail, end, snippet;

  if (!this.buffer) return null;

  indent = indent || 4;
  maxLength = maxLength || 75;

  head = '';
  start = this.position;

  while (start > 0 && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(start - 1)) === -1) {
    start -= 1;
    if (this.position - start > (maxLength / 2 - 1)) {
      head = ' ... ';
      start += 5;
      break;
    }
  }

  tail = '';
  end = this.position;

  while (end < this.buffer.length && '\x00\r\n\x85\u2028\u2029'.indexOf(this.buffer.charAt(end)) === -1) {
    end += 1;
    if (end - this.position > (maxLength / 2 - 1)) {
      tail = ' ... ';
      end -= 5;
      break;
    }
  }

  snippet = this.buffer.slice(start, end);

  return common.repeat(' ', indent) + head + snippet + tail + '\n' +
         common.repeat(' ', indent + this.position - start + head.length) + '^';
};


Mark.prototype.toString = function toString(compact) {
  var snippet, where = '';

  if (this.name) {
    where += 'in "' + this.name + '" ';
  }

  where += 'at line ' + (this.line + 1) + ', column ' + (this.column + 1);

  if (!compact) {
    snippet = this.getSnippet();

    if (snippet) {
      where += ':\n' + snippet;
    }
  }

  return where;
};


module.exports = Mark;

},{"./common":44}],49:[function(require,module,exports){
'use strict';

/*eslint-disable max-len*/

var common        = require('./common');
var YAMLException = require('./exception');
var Type          = require('./type');


function compileList(schema, name, result) {
  var exclude = [];

  schema.include.forEach(function (includedSchema) {
    result = compileList(includedSchema, name, result);
  });

  schema[name].forEach(function (currentType) {
    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
        exclude.push(previousIndex);
      }
    });

    result.push(currentType);
  });

  return result.filter(function (type, index) {
    return exclude.indexOf(index) === -1;
  });
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      }, index, length;

  function collectType(type) {
    result[type.kind][type.tag] = result['fallback'][type.tag] = type;
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema(definition) {
  this.include  = definition.include  || [];
  this.implicit = definition.implicit || [];
  this.explicit = definition.explicit || [];

  this.implicit.forEach(function (type) {
    if (type.loadKind && type.loadKind !== 'scalar') {
      throw new YAMLException('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }
  });

  this.compiledImplicit = compileList(this, 'implicit', []);
  this.compiledExplicit = compileList(this, 'explicit', []);
  this.compiledTypeMap  = compileMap(this.compiledImplicit, this.compiledExplicit);
}


Schema.DEFAULT = null;


Schema.create = function createSchema() {
  var schemas, types;

  switch (arguments.length) {
    case 1:
      schemas = Schema.DEFAULT;
      types = arguments[0];
      break;

    case 2:
      schemas = arguments[0];
      types = arguments[1];
      break;

    default:
      throw new YAMLException('Wrong number of arguments for Schema.create function');
  }

  schemas = common.toArray(schemas);
  types = common.toArray(types);

  if (!schemas.every(function (schema) { return schema instanceof Schema; })) {
    throw new YAMLException('Specified list of super schemas (or a single Schema object) contains a non-Schema object.');
  }

  if (!types.every(function (type) { return type instanceof Type; })) {
    throw new YAMLException('Specified list of YAML types (or a single Type object) contains a non-Type object.');
  }

  return new Schema({
    include: schemas,
    explicit: types
  });
};


module.exports = Schema;

},{"./common":44,"./exception":46,"./type":55}],50:[function(require,module,exports){
// Standard YAML's Core schema.
// http://www.yaml.org/spec/1.2/spec.html#id2804923
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, Core schema has no distinctions from JSON schema is JS-YAML.


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./json')
  ]
});

},{"../schema":49,"./json":54}],51:[function(require,module,exports){
// JS-YAML's default schema for `load` function.
// It is not described in the YAML specification.
//
// This schema is based on JS-YAML's default safe schema and includes
// JavaScript-specific types: !!js/undefined, !!js/regexp and !!js/function.
//
// Also this schema is used as default base schema at `Schema.create` function.


'use strict';


var Schema = require('../schema');


module.exports = Schema.DEFAULT = new Schema({
  include: [
    require('./default_safe')
  ],
  explicit: [
    require('../type/js/undefined'),
    require('../type/js/regexp'),
    require('../type/js/function')
  ]
});

},{"../schema":49,"../type/js/function":60,"../type/js/regexp":61,"../type/js/undefined":62,"./default_safe":52}],52:[function(require,module,exports){
// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./core')
  ],
  implicit: [
    require('../type/timestamp'),
    require('../type/merge')
  ],
  explicit: [
    require('../type/binary'),
    require('../type/omap'),
    require('../type/pairs'),
    require('../type/set')
  ]
});

},{"../schema":49,"../type/binary":56,"../type/merge":64,"../type/omap":66,"../type/pairs":67,"../type/set":69,"../type/timestamp":71,"./core":50}],53:[function(require,module,exports){
// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  explicit: [
    require('../type/str'),
    require('../type/seq'),
    require('../type/map')
  ]
});

},{"../schema":49,"../type/map":63,"../type/seq":68,"../type/str":70}],54:[function(require,module,exports){
// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.


'use strict';


var Schema = require('../schema');


module.exports = new Schema({
  include: [
    require('./failsafe')
  ],
  implicit: [
    require('../type/null'),
    require('../type/bool'),
    require('../type/int'),
    require('../type/float')
  ]
});

},{"../schema":49,"../type/bool":57,"../type/float":58,"../type/int":59,"../type/null":65,"./failsafe":53}],55:[function(require,module,exports){
'use strict';

var YAMLException = require('./exception');

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.tag          = tag;
  this.kind         = options['kind']         || null;
  this.resolve      = options['resolve']      || function () { return true; };
  this.construct    = options['construct']    || function (data) { return data; };
  this.instanceOf   = options['instanceOf']   || null;
  this.predicate    = options['predicate']    || null;
  this.represent    = options['represent']    || null;
  this.defaultStyle = options['defaultStyle'] || null;
  this.styleAliases = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

module.exports = Type;

},{"./exception":46}],56:[function(require,module,exports){
'use strict';

/*eslint-disable no-bitwise*/

var NodeBuffer;

try {
  // A trick for browserified version, to not include `Buffer` shim
  var _require = require;
  NodeBuffer = _require('buffer').Buffer;
} catch (__) {}

var Type       = require('../type');


// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  // Wrap into Buffer for NodeJS and leave Array for browser
  if (NodeBuffer) {
    // Support node 6.+ Buffer API when available
    return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
  }

  return result;
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(object) {
  return NodeBuffer && NodeBuffer.isBuffer(object);
}

module.exports = new Type('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});

},{"../type":55}],57:[function(require,module,exports){
'use strict';

var Type = require('../type');

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

module.exports = new Type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});

},{"../type":55}],58:[function(require,module,exports){
'use strict';

var common = require('../common');
var Type   = require('../type');

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // 20:59
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign, base, digits;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;
  digits = [];

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;

  } else if (value.indexOf(':') >= 0) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseFloat(v, 10));
    });

    value = 0.0;
    base = 1;

    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });

    return sign * value;

  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common.isNegativeZero(object));
}

module.exports = new Type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

},{"../common":44,"../type":55}],59:[function(require,module,exports){
'use strict';

var common = require('../common');
var Type   = require('../type');

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }

    // base 8
    for (; index < max; index++) {
      ch = data[index];
      if (ch === '_') continue;
      if (!isOctCode(data.charCodeAt(index))) return false;
      hasDigits = true;
    }
    return hasDigits && ch !== '_';
  }

  // base 10 (except 0) or base 60

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (ch === ':') break;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  // if !base60 - done;
  if (ch !== ':') return true;

  // base60 almost not used, no needs to optimize
  return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch, base, digits = [];

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value, 16);
    return sign * parseInt(value, 8);
  }

  if (value.indexOf(':') !== -1) {
    value.split(':').forEach(function (v) {
      digits.unshift(parseInt(v, 10));
    });

    value = 0;
    base = 1;

    digits.forEach(function (d) {
      value += (d * base);
      base *= 60;
    });

    return sign * value;

  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common.isNegativeZero(object));
}

module.exports = new Type('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0'  + obj.toString(8) : '-0'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

},{"../common":44,"../type":55}],60:[function(require,module,exports){
'use strict';

var esprima;

// Browserified version does not have esprima
//
// 1. For node.js just require module as deps
// 2. For browser try to require mudule via external AMD system.
//    If not found - try to fallback to window.esprima. If not
//    found too - then fail to parse.
//
try {
  // workaround to exclude package from browserify list.
  var _require = require;
  esprima = _require('esprima');
} catch (_) {
  /* eslint-disable no-redeclare */
  /* global window */
  if (typeof window !== 'undefined') esprima = window.esprima;
}

var Type = require('../../type');

function resolveJavascriptFunction(data) {
  if (data === null) return false;

  try {
    var source = '(' + data + ')',
        ast    = esprima.parse(source, { range: true });

    if (ast.type                    !== 'Program'             ||
        ast.body.length             !== 1                     ||
        ast.body[0].type            !== 'ExpressionStatement' ||
        (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
          ast.body[0].expression.type !== 'FunctionExpression')) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

function constructJavascriptFunction(data) {
  /*jslint evil:true*/

  var source = '(' + data + ')',
      ast    = esprima.parse(source, { range: true }),
      params = [],
      body;

  if (ast.type                    !== 'Program'             ||
      ast.body.length             !== 1                     ||
      ast.body[0].type            !== 'ExpressionStatement' ||
      (ast.body[0].expression.type !== 'ArrowFunctionExpression' &&
        ast.body[0].expression.type !== 'FunctionExpression')) {
    throw new Error('Failed to resolve function');
  }

  ast.body[0].expression.params.forEach(function (param) {
    params.push(param.name);
  });

  body = ast.body[0].expression.body.range;

  // Esprima's ranges include the first '{' and the last '}' characters on
  // function expressions. So cut them out.
  if (ast.body[0].expression.body.type === 'BlockStatement') {
    /*eslint-disable no-new-func*/
    return new Function(params, source.slice(body[0] + 1, body[1] - 1));
  }
  // ES6 arrow functions can omit the BlockStatement. In that case, just return
  // the body.
  /*eslint-disable no-new-func*/
  return new Function(params, 'return ' + source.slice(body[0], body[1]));
}

function representJavascriptFunction(object /*, style*/) {
  return object.toString();
}

function isFunction(object) {
  return Object.prototype.toString.call(object) === '[object Function]';
}

module.exports = new Type('tag:yaml.org,2002:js/function', {
  kind: 'scalar',
  resolve: resolveJavascriptFunction,
  construct: constructJavascriptFunction,
  predicate: isFunction,
  represent: representJavascriptFunction
});

},{"../../type":55}],61:[function(require,module,exports){
'use strict';

var Type = require('../../type');

function resolveJavascriptRegExp(data) {
  if (data === null) return false;
  if (data.length === 0) return false;

  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers = '';

  // if regexp starts with '/' it can have modifiers and must be properly closed
  // `/foo/gim` - modifiers tail can be maximum 3 chars
  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1];

    if (modifiers.length > 3) return false;
    // if expression starts with /, is should be properly terminated
    if (regexp[regexp.length - modifiers.length - 1] !== '/') return false;
  }

  return true;
}

function constructJavascriptRegExp(data) {
  var regexp = data,
      tail   = /\/([gim]*)$/.exec(data),
      modifiers = '';

  // `/foo/gim` - tail can be maximum 4 chars
  if (regexp[0] === '/') {
    if (tail) modifiers = tail[1];
    regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
  }

  return new RegExp(regexp, modifiers);
}

function representJavascriptRegExp(object /*, style*/) {
  var result = '/' + object.source + '/';

  if (object.global) result += 'g';
  if (object.multiline) result += 'm';
  if (object.ignoreCase) result += 'i';

  return result;
}

function isRegExp(object) {
  return Object.prototype.toString.call(object) === '[object RegExp]';
}

module.exports = new Type('tag:yaml.org,2002:js/regexp', {
  kind: 'scalar',
  resolve: resolveJavascriptRegExp,
  construct: constructJavascriptRegExp,
  predicate: isRegExp,
  represent: representJavascriptRegExp
});

},{"../../type":55}],62:[function(require,module,exports){
'use strict';

var Type = require('../../type');

function resolveJavascriptUndefined() {
  return true;
}

function constructJavascriptUndefined() {
  /*eslint-disable no-undefined*/
  return undefined;
}

function representJavascriptUndefined() {
  return '';
}

function isUndefined(object) {
  return typeof object === 'undefined';
}

module.exports = new Type('tag:yaml.org,2002:js/undefined', {
  kind: 'scalar',
  resolve: resolveJavascriptUndefined,
  construct: constructJavascriptUndefined,
  predicate: isUndefined,
  represent: representJavascriptUndefined
});

},{"../../type":55}],63:[function(require,module,exports){
'use strict';

var Type = require('../type');

module.exports = new Type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});

},{"../type":55}],64:[function(require,module,exports){
'use strict';

var Type = require('../type');

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

module.exports = new Type('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});

},{"../type":55}],65:[function(require,module,exports){
'use strict';

var Type = require('../type');

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

module.exports = new Type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; }
  },
  defaultStyle: 'lowercase'
});

},{"../type":55}],66:[function(require,module,exports){
'use strict';

var Type = require('../type');

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _toString       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

module.exports = new Type('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});

},{"../type":55}],67:[function(require,module,exports){
'use strict';

var Type = require('../type');

var _toString = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

module.exports = new Type('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});

},{"../type":55}],68:[function(require,module,exports){
'use strict';

var Type = require('../type');

module.exports = new Type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});

},{"../type":55}],69:[function(require,module,exports){
'use strict';

var Type = require('../type');

var _hasOwnProperty = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

module.exports = new Type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

},{"../type":55}],70:[function(require,module,exports){
'use strict';

var Type = require('../type');

module.exports = new Type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});

},{"../type":55}],71:[function(require,module,exports){
'use strict';

var Type = require('../type');

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

module.exports = new Type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

},{"../type":55}],72:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["json-schema-view-js"] = factory();
	else
		root["json-schema-view-js"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__json_schema_view__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__style_less__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__style_less___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__style_less__);



window['JSONSchemaView'] = __WEBPACK_IMPORTED_MODULE_0__json_schema_view__["a" /* default */];

/* harmony default export */ __webpack_exports__["default"] = (__WEBPACK_IMPORTED_MODULE_0__json_schema_view__["a" /* default */]);

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_json_formatter_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_json_formatter_js___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_json_formatter_js__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__helpers_js__ = __webpack_require__(3);


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['\n        <div class="any">\n          ', '\n\n          <span class="type type-any">&lt;any&gt;</span>\n\n          ', '\n        </div>\n      '], ['\n        <div class="any">\n          ', '\n\n          <span class="type type-any">&lt;any&gt;</span>\n\n          ', '\n        </div>\n      ']),
    _templateObject2 = _taggedTemplateLiteral(['\n            <a class="title"><span class="toggle-handle"></span>', ' </a>\n          '], ['\n            <a class="title"><span class="toggle-handle"></span>', ' </a>\n          ']),
    _templateObject3 = _taggedTemplateLiteral(['\n            <div class="inner description">', '</div>\n          '], ['\n            <div class="inner description">', '</div>\n          ']),
    _templateObject4 = _taggedTemplateLiteral(['\n        <div class="primitive">\n          ', '\n\n            <span class="type">', '</span>\n\n          ', '\n\n          ', '\n\n          ', ' \n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n           ', '\n\n          ', '\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n        </div>\n      '], ['\n        <div class="primitive">\n          ', '\n\n            <span class="type">', '</span>\n\n          ', '\n\n          ', '\n\n          ', ' \n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n          ', '\n\n           ', '\n\n          ', '\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n        </div>\n      ']),
    _templateObject5 = _taggedTemplateLiteral(['\n            <span class="required">*</span>\n          '], ['\n            <span class="required">*</span>\n          ']),
    _templateObject6 = _taggedTemplateLiteral(['\n            <span class="format">(', ')</span>\n          '], ['\n            <span class="format">(', ')</span>\n          ']),
    _templateObject7 = _taggedTemplateLiteral(['\n            <span class="default">default: ', '</span>\n          '], ['\n            <span class="default">default: ', '</span>\n          ']),
    _templateObject8 = _taggedTemplateLiteral(['\n            <span class="range minimum">minimum:', '</span>\n          '], ['\n            <span class="range minimum">minimum:', '</span>\n          ']),
    _templateObject9 = _taggedTemplateLiteral(['\n            <span class="range exclusiveMinimum">(ex)minimum:', '</span>\n          '], ['\n            <span class="range exclusiveMinimum">(ex)minimum:', '</span>\n          ']),
    _templateObject10 = _taggedTemplateLiteral(['\n            <span class="range maximum">maximum:', '</span>\n          '], ['\n            <span class="range maximum">maximum:', '</span>\n          ']),
    _templateObject11 = _taggedTemplateLiteral(['\n            <span class="range exclusiveMaximum">(ex)maximum:', '</span>\n          '], ['\n            <span class="range exclusiveMaximum">(ex)maximum:', '</span>\n          ']),
    _templateObject12 = _taggedTemplateLiteral(['\n            <span class="range minLength">minLength:', '</span>\n          '], ['\n            <span class="range minLength">minLength:', '</span>\n          ']),
    _templateObject13 = _taggedTemplateLiteral(['\n            <span class="range maxLength">maxLength:', '</span>\n          '], ['\n            <span class="range maxLength">maxLength:', '</span>\n          ']),
    _templateObject14 = _taggedTemplateLiteral(['\n            <span class="pattern">pattern:', '</span>\n          '], ['\n            <span class="pattern">pattern:', '</span>\n          ']),
    _templateObject15 = _taggedTemplateLiteral(['\n            ', '\n          '], ['\n            ', '\n          ']),
    _templateObject16 = _taggedTemplateLiteral(['', ''], ['', '']),
    _templateObject17 = _taggedTemplateLiteral(['\n        <div class="array">\n          <a class="title"><span class="toggle-handle"></span>', '<span class="opening bracket">[</span>', '</a>\n          ', '\n          <div class="inner">\n            ', '\n          </div>\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n\n          ', '\n        </div>\n      '], ['\n        <div class="array">\n          <a class="title"><span class="toggle-handle"></span>', '<span class="opening bracket">[</span>', '</a>\n          ', '\n          <div class="inner">\n            ', '\n          </div>\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n\n          ', '\n        </div>\n      ']),
    _templateObject18 = _taggedTemplateLiteral(['<span class="closing bracket">]</span>'], ['<span class="closing bracket">]</span>']),
    _templateObject19 = _taggedTemplateLiteral(['\n          <span>\n            <span title="items range">(', '..', ')</span>\n            ', '\n          </span>\n          '], ['\n          <span>\n            <span title="items range">(', '..', ')</span>\n            ', '\n          </span>\n          ']),
    _templateObject20 = _taggedTemplateLiteral(['<span title="unique" class="uniqueItems">\u2666</span>'], ['<span title="unique" class="uniqueItems">\u2666</span>']),
    _templateObject21 = _taggedTemplateLiteral(['\n              <div class="description">', '</div>\n            '], ['\n              <div class="description">', '</div>\n            ']),
    _templateObject22 = _taggedTemplateLiteral(['\n          <span class="closing bracket">]</span>\n          '], ['\n          <span class="closing bracket">]</span>\n          ']),
    _templateObject23 = _taggedTemplateLiteral(['\n        <div class="object">\n          <a class="title"><span\n            class="toggle-handle"></span>', ' <span\n            class="opening brace">{</span>', '</a>\n\n          <div class="inner">\n            ', '\n            <!-- children go here -->\n          </div>\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n\n          ', '\n        </div>\n      '], ['\n        <div class="object">\n          <a class="title"><span\n            class="toggle-handle"></span>', ' <span\n            class="opening brace">{</span>', '</a>\n\n          <div class="inner">\n            ', '\n            <!-- children go here -->\n          </div>\n\n          ', '\n\n          ', '\n          ', '\n          ', '\n\n          ', '\n        </div>\n      ']),
    _templateObject24 = _taggedTemplateLiteral(['\n              <span class="closing brace" ng-if="isCollapsed">}</span>\n          '], ['\n              <span class="closing brace" ng-if="isCollapsed">}</span>\n          ']),
    _templateObject25 = _taggedTemplateLiteral(['\n          <span class="closing brace">}</span>\n          '], ['\n          <span class="closing brace">}</span>\n          ']),
    _templateObject26 = _taggedTemplateLiteral(['\n        <div class="inner enums">\n          <b>Enum:</b>\n        </div>\n      '], ['\n        <div class="inner enums">\n          <b>Enum:</b>\n        </div>\n      ']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }




/**
 * @class JSONSchemaView
 *
 * A pure JavaScript component for rendering JSON Schema in HTML.
*/

var JSONSchemaView = function () {

  /**
   * @param {object} schema The JSON Schema object
   *
   * @param {number} [open=1] his number indicates up to how many levels the
   * rendered tree should expand. Set it to `0` to make the whole tree collapsed
   * or set it to `Infinity` to expand the tree deeply
   * @param {object} options.
   *  theme {string}: one of the following options: ['dark']
  */
  function JSONSchemaView(schema, open) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { theme: null };

    _classCallCheck(this, JSONSchemaView);

    this.schema = schema;
    this.open = open;
    this.options = options;
    this.isCollapsed = open <= 0;

    // if schema is an empty object which means any JOSN
    this.isAny = (typeof schema === 'undefined' ? 'undefined' : _typeof(schema)) === 'object' && !Array.isArray(schema) && !Object.keys(schema).filter(function (k) {
      return ['title', 'description'].indexOf(k) === -1;
    }).length;

    // Determine if a schema is an array
    this.isArray = !this.isAny && this.schema && this.schema.type === 'array';

    this.isObject = this.schema && (this.schema.type === 'object' || this.schema.properties || this.schema.anyOf || this.schema.oneOf || this.schema.allOf);

    // Determine if a schema is a primitive
    this.isPrimitive = !this.isAny && !this.isArray && !this.isObject;

    //
    this.showToggle = this.schema.description || this.schema.title || this.isPrimitive && (this.schema.minimum || this.schema.maximum || this.schema.exclusiveMinimum || this.schema.exclusiveMaximum || this.schema.format || this.schema.default || this.schema.minLength || this.schema.maxLength || this.schema.pattern || this.schema.enum);

    // populate isRequired property down to properties
    if (this.schema && Array.isArray(this.schema.required)) {
      this.schema.required.forEach(function (requiredProperty) {
        if (_typeof(_this.schema.properties[requiredProperty]) === 'object') {
          _this.schema.properties[requiredProperty].isRequired = true;
        }
      });
    }
  }

  /*
   * Returns the template with populated properties.
   * This template does not have the children
  */


  _createClass(JSONSchemaView, [{
    key: 'template',
    value: function template() {
      if (!this.schema) {
        return '';
      }

      return ('\n      <!-- Any -->\n      ' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.isAny)(_templateObject, Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.showToggle)(_templateObject2, this.schema.title || ''), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.description && !this.isCollapsed)(_templateObject3, this.schema.description)) + '\n\n      <!-- Primitive -->\n      ' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.isPrimitive)(_templateObject4, Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.showToggle)(_templateObject2, this.schema.title || ''), this.schema.type, Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.isRequired)(_templateObject5), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.format)(_templateObject6, this.schema.format), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.default)(_templateObject7, this.schema.default), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.minimum)(_templateObject8, this.schema.minimum), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.exclusiveMinimum)(_templateObject9, this.schema.exclusiveMinimum), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.maximum)(_templateObject10, this.schema.maximum), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.exclusiveMaximum)(_templateObject11, this.schema.exclusiveMaximum), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.minLength)(_templateObject12, this.schema.minLength), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.maxLength)(_templateObject13, this.schema.maxLength), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.pattern)(_templateObject14, this.schema.pattern), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.description && !this.isCollapsed)(_templateObject3, this.schema.description), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.enum)(_templateObject15, this.enum(this.schema, this.isCollapsed, this.open)), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.allOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'allOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.oneOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'oneOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.anyOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'anyOf'))) + '\n\n\n      <!-- Array -->\n      ' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.isArray)(_templateObject17, this.schema.title || '', Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.isCollapsed)(_templateObject18), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && (this.schema.uniqueItems || this.schema.minItems || this.schema.maxItems))(_templateObject19, this.schema.minItems || 0, this.schema.maxItems || '∞', Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.uniqueItems)(_templateObject20)), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.description)(_templateObject21, this.schema.description), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.enum)(_templateObject15, this.enum(this.schema, this.isCollapsed, this.open)), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.allOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'allOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.oneOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'oneOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.anyOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'anyOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed)(_templateObject22)) + '\n\n      <!-- Object -->\n      ' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isPrimitive && !this.isArray && !this.isAny)(_templateObject23, this.schema.title || '', Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.isCollapsed)(_templateObject24), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.description)(_templateObject21, this.schema.description), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed && this.schema.enum)(_templateObject15, this.enum(this.schema, this.isCollapsed, this.open)), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.allOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'allOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.oneOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'oneOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(this.schema.anyOf && !this.isCollapsed)(_templateObject16, this.xOf(this.schema, 'anyOf')), Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!this.isCollapsed)(_templateObject25)) + '\n').replace(/\s*\n/g, '\n').replace(/(<!--).+/g, '').trim();
    }

    /*
     * Template for oneOf, anyOf and allOf
    */

  }, {
    key: 'xOf',
    value: function xOf(schema, type) {
      return '\n      <div class="inner ' + type + '">\n        <b>' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["b" /* convertXOf */])(type) + ':</b>\n      </div>\n    ';
    }

    /*
     * Template for enums
    */

  }, {
    key: 'enum',
    value: function _enum(schema, isCollapsed /*, open*/) {
      return '\n      ' + Object(__WEBPACK_IMPORTED_MODULE_1__helpers_js__["a" /* _if */])(!isCollapsed && schema.enum)(_templateObject26) + '\n    ';
    }

    /*
     * Toggles the 'collapsed' state
    */

  }, {
    key: 'toggle',
    value: function toggle() {
      this.isCollapsed = !this.isCollapsed;
      this.render();
    }

    /*
     * Renders the element and returns it
    */

  }, {
    key: 'render',
    value: function render() {
      if (!this.element) {
        this.element = document.createElement('div');
        this.element.classList.add('json-schema-view');
      }

      if (this.isCollapsed) {
        this.element.classList.add('collapsed');
      } else {
        this.element.classList.remove('collapsed');
      }

      if (this.options.theme) {
        this.element.classList.add('json-schema-view-' + this.options.theme);
      }

      this.element.innerHTML = this.template();

      if (!this.schema) {
        return this.element;
      }

      if (!this.isCollapsed) {
        this.appendChildren(this.element);
      }

      // add event listener for toggling
      if (this.element.querySelector('a.title')) {
        this.element.querySelector('a.title').addEventListener('click', this.toggle.bind(this));
      }
      return this.element;
    }

    /*
     * Appends children to given element based on current schema
    */

  }, {
    key: 'appendChildren',
    value: function appendChildren(element) {
      var _this2 = this;

      var inner = element.querySelector('.inner');

      if (!inner) {
        return;
      }

      if (this.schema.enum) {
        var formatter = new __WEBPACK_IMPORTED_MODULE_0_json_formatter_js___default.a(this.schema.enum, this.open - 1);
        var formatterEl = formatter.render();
        formatterEl.classList.add('inner');
        element.querySelector('.enums.inner').appendChild(formatterEl);
      }

      if (this.isArray) {
        var view = new JSONSchemaView(this.schema.items, this.open - 1);
        inner.appendChild(view.render());
      }

      if (_typeof(this.schema.properties) === 'object') {
        Object.keys(this.schema.properties).forEach(function (propertyName) {
          var property = _this2.schema.properties[propertyName];
          var tempDiv = document.createElement('div');
          tempDiv.innerHTML = '<div class="property">\n          <span class="name">' + propertyName + ':</span>\n        </div>';
          var view = new JSONSchemaView(property, _this2.open - 1);
          tempDiv.querySelector('.property').appendChild(view.render());

          inner.appendChild(tempDiv.querySelector('.property'));
        });
      }

      if (this.schema.allOf) {
        appendXOf.call(this, 'allOf');
      }
      if (this.schema.oneOf) {
        appendXOf.call(this, 'oneOf');
      }
      if (this.schema.anyOf) {
        appendXOf.call(this, 'anyOf');
      }

      function appendXOf(type) {
        var _this3 = this;

        var innerAllOf = element.querySelector('.inner.' + type);

        this.schema[type].forEach(function (schema) {
          var inner = document.createElement('div');
          inner.classList.add('inner');
          var view = new JSONSchemaView(schema, _this3.open - 1);
          inner.appendChild(view.render());
          innerAllOf.appendChild(inner);
        });
      }
    }
  }]);

  return JSONSchemaView;
}();

/* harmony default export */ __webpack_exports__["a"] = (JSONSchemaView);

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = function(modules) {
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            i: moduleId,
            l: !1,
            exports: {}
        };
        return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__), 
        module.l = !0, module.exports;
    }
    var installedModules = {};
    return __webpack_require__.m = modules, __webpack_require__.c = installedModules, 
    __webpack_require__.i = function(value) {
        return value;
    }, __webpack_require__.d = function(exports, name, getter) {
        __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
            configurable: !1,
            enumerable: !0,
            get: getter
        });
    }, __webpack_require__.n = function(module) {
        var getter = module && module.__esModule ? function() {
            return module.default;
        } : function() {
            return module;
        };
        return __webpack_require__.d(getter, "a", getter), getter;
    }, __webpack_require__.o = function(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }, __webpack_require__.p = "dist", __webpack_require__(__webpack_require__.s = 6);
}([ function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    Object.defineProperty(__webpack_exports__, "__esModule", {
        value: !0
    });
    var __WEBPACK_IMPORTED_MODULE_0__helpers__ = __webpack_require__(5), __WEBPACK_IMPORTED_MODULE_1__style_less__ = __webpack_require__(4), DATE_STRING_REGEX = (__webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__style_less__), 
    /(^\d{1,4}[\.|\\\/|-]\d{1,2}[\.|\\\/|-]\d{1,4})(\s*(?:0?[1-9]:[0-5]|1(?=[012])\d:[0-5])\d\s*[ap]m)?$/), PARTIAL_DATE_REGEX = /\d{2}:\d{2}:\d{2} GMT-\d{4}/, JSON_DATE_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/, requestAnimationFrame = window.requestAnimationFrame || function(cb) {
        return cb(), 0;
    }, _defaultConfig = {
        hoverPreviewEnabled: !1,
        hoverPreviewArrayCount: 100,
        hoverPreviewFieldCount: 5,
        animateOpen: !0,
        animateClose: !0,
        theme: null
    }, JSONFormatter = function() {
        function JSONFormatter(json, open, config, key) {
            void 0 === open && (open = 1), void 0 === config && (config = _defaultConfig), this.json = json, 
            this.open = open, this.config = config, this.key = key, this._isOpen = null, void 0 === this.config.hoverPreviewEnabled && (this.config.hoverPreviewEnabled = _defaultConfig.hoverPreviewEnabled), 
            void 0 === this.config.hoverPreviewArrayCount && (this.config.hoverPreviewArrayCount = _defaultConfig.hoverPreviewArrayCount), 
            void 0 === this.config.hoverPreviewFieldCount && (this.config.hoverPreviewFieldCount = _defaultConfig.hoverPreviewFieldCount);
        }
        return Object.defineProperty(JSONFormatter.prototype, "isOpen", {
            get: function() {
                return null !== this._isOpen ? this._isOpen : this.open > 0;
            },
            set: function(value) {
                this._isOpen = value;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isDate", {
            get: function() {
                return "string" === this.type && (DATE_STRING_REGEX.test(this.json) || JSON_DATE_REGEX.test(this.json) || PARTIAL_DATE_REGEX.test(this.json));
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isUrl", {
            get: function() {
                return "string" === this.type && 0 === this.json.indexOf("http");
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isArray", {
            get: function() {
                return Array.isArray(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isObject", {
            get: function() {
                return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.a)(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isEmptyObject", {
            get: function() {
                return !this.keys.length && !this.isArray;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "isEmpty", {
            get: function() {
                return this.isEmptyObject || this.keys && !this.keys.length && this.isArray;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "hasKey", {
            get: function() {
                return void 0 !== this.key;
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "constructorName", {
            get: function() {
                return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.b)(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "type", {
            get: function() {
                return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.c)(this.json);
            },
            enumerable: !0,
            configurable: !0
        }), Object.defineProperty(JSONFormatter.prototype, "keys", {
            get: function() {
                return this.isObject ? Object.keys(this.json).map(function(key) {
                    return key || '""';
                }) : [];
            },
            enumerable: !0,
            configurable: !0
        }), JSONFormatter.prototype.toggleOpen = function() {
            this.isOpen = !this.isOpen, this.element && (this.isOpen ? this.appendChildren(this.config.animateOpen) : this.removeChildren(this.config.animateClose), 
            this.element.classList.toggle(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("open")));
        }, JSONFormatter.prototype.openAtDepth = function(depth) {
            void 0 === depth && (depth = 1), depth < 0 || (this.open = depth, this.isOpen = 0 !== depth, 
            this.element && (this.removeChildren(!1), 0 === depth ? this.element.classList.remove(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("open")) : (this.appendChildren(this.config.animateOpen), 
            this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("open")))));
        }, JSONFormatter.prototype.getInlinepreview = function() {
            var _this = this;
            if (this.isArray) return this.json.length > this.config.hoverPreviewArrayCount ? "Array[" + this.json.length + "]" : "[" + this.json.map(__WEBPACK_IMPORTED_MODULE_0__helpers__.e).join(", ") + "]";
            var keys = this.keys, narrowKeys = keys.slice(0, this.config.hoverPreviewFieldCount), kvs = narrowKeys.map(function(key) {
                return key + ":" + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.e)(_this.json[key]);
            }), ellipsis = keys.length >= this.config.hoverPreviewFieldCount ? "…" : "";
            return "{" + kvs.join(", ") + ellipsis + "}";
        }, JSONFormatter.prototype.render = function() {
            this.element = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("div", "row");
            var togglerLink = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("a", "toggler-link");
            if (this.isObject && togglerLink.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "toggler")), 
            this.hasKey && togglerLink.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "key", this.key + ":")), 
            this.isObject) {
                var value = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "value"), objectWrapperSpan = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span"), constructorName = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "constructor-name", this.constructorName);
                if (objectWrapperSpan.appendChild(constructorName), this.isArray) {
                    var arrayWrapperSpan = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span");
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "bracket", "[")), 
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "number", this.json.length)), 
                    arrayWrapperSpan.appendChild(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "bracket", "]")), 
                    objectWrapperSpan.appendChild(arrayWrapperSpan);
                }
                value.appendChild(objectWrapperSpan), togglerLink.appendChild(value);
            } else {
                var value = this.isUrl ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("a") : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span");
                value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)(this.type)), 
                this.isDate && value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("date")), 
                this.isUrl && (value.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("url")), 
                value.setAttribute("href", this.json));
                var valuePreview = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.g)(this.json, this.json);
                value.appendChild(document.createTextNode(valuePreview)), togglerLink.appendChild(value);
            }
            if (this.isObject && this.config.hoverPreviewEnabled) {
                var preview = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("span", "preview-text");
                preview.appendChild(document.createTextNode(this.getInlinepreview())), togglerLink.appendChild(preview);
            }
            var children = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.f)("div", "children");
            return this.isObject && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("object")), 
            this.isArray && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("array")), 
            this.isEmpty && children.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("empty")), 
            this.config && this.config.theme && this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)(this.config.theme)), 
            this.isOpen && this.element.classList.add(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("open")), 
            this.element.appendChild(togglerLink), this.element.appendChild(children), this.isObject && this.isOpen && this.appendChildren(), 
            this.isObject && togglerLink.addEventListener("click", this.toggleOpen.bind(this)), 
            this.element;
        }, JSONFormatter.prototype.appendChildren = function(animated) {
            var _this = this;
            void 0 === animated && (animated = !1);
            var children = this.element.querySelector("div." + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("children"));
            if (children && !this.isEmpty) if (animated) {
                var index_1 = 0, addAChild_1 = function() {
                    var key = _this.keys[index_1], formatter = new JSONFormatter(_this.json[key], _this.open - 1, _this.config, key);
                    children.appendChild(formatter.render()), (index_1 += 1) < _this.keys.length && (index_1 > 10 ? addAChild_1() : requestAnimationFrame(addAChild_1));
                };
                requestAnimationFrame(addAChild_1);
            } else this.keys.forEach(function(key) {
                var formatter = new JSONFormatter(_this.json[key], _this.open - 1, _this.config, key);
                children.appendChild(formatter.render());
            });
        }, JSONFormatter.prototype.removeChildren = function(animated) {
            void 0 === animated && (animated = !1);
            var childrenElement = this.element.querySelector("div." + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__helpers__.d)("children"));
            if (animated) {
                var childrenRemoved_1 = 0, removeAChild_1 = function() {
                    childrenElement && childrenElement.children.length && (childrenElement.removeChild(childrenElement.children[0]), 
                    childrenRemoved_1 += 1, childrenRemoved_1 > 10 ? removeAChild_1() : requestAnimationFrame(removeAChild_1));
                };
                requestAnimationFrame(removeAChild_1);
            } else childrenElement && (childrenElement.innerHTML = "");
        }, JSONFormatter;
    }();
    __webpack_exports__.default = JSONFormatter;
}, function(module, exports, __webpack_require__) {
    exports = module.exports = __webpack_require__(2)(), exports.push([ module.i, '.json-formatter-row {\n  font-family: monospace;\n}\n.json-formatter-row,\n.json-formatter-row a,\n.json-formatter-row a:hover {\n  color: black;\n  text-decoration: none;\n}\n.json-formatter-row .json-formatter-row {\n  margin-left: 1rem;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty {\n  opacity: 0.5;\n  margin-left: 1rem;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty:after {\n  display: none;\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {\n  content: "No properties";\n}\n.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {\n  content: "[]";\n}\n.json-formatter-row .json-formatter-string {\n  color: green;\n  white-space: pre;\n  word-wrap: break-word;\n}\n.json-formatter-row .json-formatter-number {\n  color: blue;\n}\n.json-formatter-row .json-formatter-boolean {\n  color: red;\n}\n.json-formatter-row .json-formatter-null {\n  color: #855A00;\n}\n.json-formatter-row .json-formatter-undefined {\n  color: #ca0b69;\n}\n.json-formatter-row .json-formatter-function {\n  color: #FF20ED;\n}\n.json-formatter-row .json-formatter-date {\n  background-color: rgba(0, 0, 0, 0.05);\n}\n.json-formatter-row .json-formatter-url {\n  text-decoration: underline;\n  color: blue;\n  cursor: pointer;\n}\n.json-formatter-row .json-formatter-bracket {\n  color: blue;\n}\n.json-formatter-row .json-formatter-key {\n  color: #00008B;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-row .json-formatter-constructor-name {\n  cursor: pointer;\n}\n.json-formatter-row .json-formatter-toggler {\n  line-height: 1.2rem;\n  font-size: 0.7rem;\n  vertical-align: middle;\n  opacity: 0.6;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-row .json-formatter-toggler:after {\n  display: inline-block;\n  transition: transform 100ms ease-in;\n  content: "\\25BA";\n}\n.json-formatter-row > a > .json-formatter-preview-text {\n  opacity: 0;\n  transition: opacity 0.15s ease-in;\n  font-style: italic;\n}\n.json-formatter-row:hover > a > .json-formatter-preview-text {\n  opacity: 0.6;\n}\n.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {\n  transform: rotate(90deg);\n}\n.json-formatter-row.json-formatter-open > .json-formatter-children:after {\n  display: inline-block;\n}\n.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {\n  display: none;\n}\n.json-formatter-row.json-formatter-open.json-formatter-empty:after {\n  display: block;\n}\n.json-formatter-dark.json-formatter-row {\n  font-family: monospace;\n}\n.json-formatter-dark.json-formatter-row,\n.json-formatter-dark.json-formatter-row a,\n.json-formatter-dark.json-formatter-row a:hover {\n  color: white;\n  text-decoration: none;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-row {\n  margin-left: 1rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty {\n  opacity: 0.5;\n  margin-left: 1rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty:after {\n  display: none;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-object:after {\n  content: "No properties";\n}\n.json-formatter-dark.json-formatter-row .json-formatter-children.json-formatter-empty.json-formatter-array:after {\n  content: "[]";\n}\n.json-formatter-dark.json-formatter-row .json-formatter-string {\n  color: #31F031;\n  white-space: pre;\n  word-wrap: break-word;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-number {\n  color: #66C2FF;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-boolean {\n  color: #EC4242;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-null {\n  color: #EEC97D;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-undefined {\n  color: #ef8fbe;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-function {\n  color: #FD48CB;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-date {\n  background-color: rgba(255, 255, 255, 0.05);\n}\n.json-formatter-dark.json-formatter-row .json-formatter-url {\n  text-decoration: underline;\n  color: #027BFF;\n  cursor: pointer;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-bracket {\n  color: #9494FF;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-key {\n  color: #23A0DB;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-constructor-name {\n  cursor: pointer;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-toggler {\n  line-height: 1.2rem;\n  font-size: 0.7rem;\n  vertical-align: middle;\n  opacity: 0.6;\n  cursor: pointer;\n  padding-right: 0.2rem;\n}\n.json-formatter-dark.json-formatter-row .json-formatter-toggler:after {\n  display: inline-block;\n  transition: transform 100ms ease-in;\n  content: "\\25BA";\n}\n.json-formatter-dark.json-formatter-row > a > .json-formatter-preview-text {\n  opacity: 0;\n  transition: opacity 0.15s ease-in;\n  font-style: italic;\n}\n.json-formatter-dark.json-formatter-row:hover > a > .json-formatter-preview-text {\n  opacity: 0.6;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-toggler-link .json-formatter-toggler:after {\n  transform: rotate(90deg);\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > .json-formatter-children:after {\n  display: inline-block;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open > a > .json-formatter-preview-text {\n  display: none;\n}\n.json-formatter-dark.json-formatter-row.json-formatter-open.json-formatter-empty:after {\n  display: block;\n}\n', "" ]);
}, function(module, exports) {
    module.exports = function() {
        var list = [];
        return list.toString = function() {
            for (var result = [], i = 0; i < this.length; i++) {
                var item = this[i];
                item[2] ? result.push("@media " + item[2] + "{" + item[1] + "}") : result.push(item[1]);
            }
            return result.join("");
        }, list.i = function(modules, mediaQuery) {
            "string" == typeof modules && (modules = [ [ null, modules, "" ] ]);
            for (var alreadyImportedModules = {}, i = 0; i < this.length; i++) {
                var id = this[i][0];
                "number" == typeof id && (alreadyImportedModules[id] = !0);
            }
            for (i = 0; i < modules.length; i++) {
                var item = modules[i];
                "number" == typeof item[0] && alreadyImportedModules[item[0]] || (mediaQuery && !item[2] ? item[2] = mediaQuery : mediaQuery && (item[2] = "(" + item[2] + ") and (" + mediaQuery + ")"), 
                list.push(item));
            }
        }, list;
    };
}, function(module, exports) {
    function addStylesToDom(styles, options) {
        for (var i = 0; i < styles.length; i++) {
            var item = styles[i], domStyle = stylesInDom[item.id];
            if (domStyle) {
                domStyle.refs++;
                for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j](item.parts[j]);
                for (;j < item.parts.length; j++) domStyle.parts.push(addStyle(item.parts[j], options));
            } else {
                for (var parts = [], j = 0; j < item.parts.length; j++) parts.push(addStyle(item.parts[j], options));
                stylesInDom[item.id] = {
                    id: item.id,
                    refs: 1,
                    parts: parts
                };
            }
        }
    }
    function listToStyles(list) {
        for (var styles = [], newStyles = {}, i = 0; i < list.length; i++) {
            var item = list[i], id = item[0], css = item[1], media = item[2], sourceMap = item[3], part = {
                css: css,
                media: media,
                sourceMap: sourceMap
            };
            newStyles[id] ? newStyles[id].parts.push(part) : styles.push(newStyles[id] = {
                id: id,
                parts: [ part ]
            });
        }
        return styles;
    }
    function insertStyleElement(options, styleElement) {
        var head = getHeadElement(), lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
        if ("top" === options.insertAt) lastStyleElementInsertedAtTop ? lastStyleElementInsertedAtTop.nextSibling ? head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling) : head.appendChild(styleElement) : head.insertBefore(styleElement, head.firstChild), 
        styleElementsInsertedAtTop.push(styleElement); else {
            if ("bottom" !== options.insertAt) throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
            head.appendChild(styleElement);
        }
    }
    function removeStyleElement(styleElement) {
        styleElement.parentNode.removeChild(styleElement);
        var idx = styleElementsInsertedAtTop.indexOf(styleElement);
        idx >= 0 && styleElementsInsertedAtTop.splice(idx, 1);
    }
    function createStyleElement(options) {
        var styleElement = document.createElement("style");
        return styleElement.type = "text/css", insertStyleElement(options, styleElement), 
        styleElement;
    }
    function createLinkElement(options) {
        var linkElement = document.createElement("link");
        return linkElement.rel = "stylesheet", insertStyleElement(options, linkElement), 
        linkElement;
    }
    function addStyle(obj, options) {
        var styleElement, update, remove;
        if (options.singleton) {
            var styleIndex = singletonCounter++;
            styleElement = singletonElement || (singletonElement = createStyleElement(options)), 
            update = applyToSingletonTag.bind(null, styleElement, styleIndex, !1), remove = applyToSingletonTag.bind(null, styleElement, styleIndex, !0);
        } else obj.sourceMap && "function" == typeof URL && "function" == typeof URL.createObjectURL && "function" == typeof URL.revokeObjectURL && "function" == typeof Blob && "function" == typeof btoa ? (styleElement = createLinkElement(options), 
        update = updateLink.bind(null, styleElement), remove = function() {
            removeStyleElement(styleElement), styleElement.href && URL.revokeObjectURL(styleElement.href);
        }) : (styleElement = createStyleElement(options), update = applyToTag.bind(null, styleElement), 
        remove = function() {
            removeStyleElement(styleElement);
        });
        return update(obj), function(newObj) {
            if (newObj) {
                if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) return;
                update(obj = newObj);
            } else remove();
        };
    }
    function applyToSingletonTag(styleElement, index, remove, obj) {
        var css = remove ? "" : obj.css;
        if (styleElement.styleSheet) styleElement.styleSheet.cssText = replaceText(index, css); else {
            var cssNode = document.createTextNode(css), childNodes = styleElement.childNodes;
            childNodes[index] && styleElement.removeChild(childNodes[index]), childNodes.length ? styleElement.insertBefore(cssNode, childNodes[index]) : styleElement.appendChild(cssNode);
        }
    }
    function applyToTag(styleElement, obj) {
        var css = obj.css, media = obj.media;
        if (media && styleElement.setAttribute("media", media), styleElement.styleSheet) styleElement.styleSheet.cssText = css; else {
            for (;styleElement.firstChild; ) styleElement.removeChild(styleElement.firstChild);
            styleElement.appendChild(document.createTextNode(css));
        }
    }
    function updateLink(linkElement, obj) {
        var css = obj.css, sourceMap = obj.sourceMap;
        sourceMap && (css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */");
        var blob = new Blob([ css ], {
            type: "text/css"
        }), oldSrc = linkElement.href;
        linkElement.href = URL.createObjectURL(blob), oldSrc && URL.revokeObjectURL(oldSrc);
    }
    var stylesInDom = {}, memoize = function(fn) {
        var memo;
        return function() {
            return void 0 === memo && (memo = fn.apply(this, arguments)), memo;
        };
    }, isOldIE = memoize(function() {
        return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
    }), getHeadElement = memoize(function() {
        return document.head || document.getElementsByTagName("head")[0];
    }), singletonElement = null, singletonCounter = 0, styleElementsInsertedAtTop = [];
    module.exports = function(list, options) {
        if ("undefined" != typeof DEBUG && DEBUG && "object" != typeof document) throw new Error("The style-loader cannot be used in a non-browser environment");
        options = options || {}, void 0 === options.singleton && (options.singleton = isOldIE()), 
        void 0 === options.insertAt && (options.insertAt = "bottom");
        var styles = listToStyles(list);
        return addStylesToDom(styles, options), function(newList) {
            for (var mayRemove = [], i = 0; i < styles.length; i++) {
                var item = styles[i], domStyle = stylesInDom[item.id];
                domStyle.refs--, mayRemove.push(domStyle);
            }
            if (newList) {
                addStylesToDom(listToStyles(newList), options);
            }
            for (var i = 0; i < mayRemove.length; i++) {
                var domStyle = mayRemove[i];
                if (0 === domStyle.refs) {
                    for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();
                    delete stylesInDom[domStyle.id];
                }
            }
        };
    };
    var replaceText = function() {
        var textStore = [];
        return function(index, replacement) {
            return textStore[index] = replacement, textStore.filter(Boolean).join("\n");
        };
    }();
}, function(module, exports, __webpack_require__) {
    var content = __webpack_require__(1);
    "string" == typeof content && (content = [ [ module.i, content, "" ] ]);
    __webpack_require__(3)(content, {});
    content.locals && (module.exports = content.locals);
}, function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    function escapeString(str) {
        return str.replace('"', '"');
    }
    function isObject(value) {
        var type = typeof value;
        return !!value && "object" == type;
    }
    function getObjectName(object) {
        if (void 0 === object) return "";
        if (null === object) return "Object";
        if ("object" == typeof object && !object.constructor) return "Object";
        var funcNameRegex = /function ([^(]*)/, results = funcNameRegex.exec(object.constructor.toString());
        return results && results.length > 1 ? results[1] : "";
    }
    function getType(object) {
        return null === object ? "null" : typeof object;
    }
    function getValuePreview(object, value) {
        var type = getType(object);
        return "null" === type || "undefined" === type ? type : ("string" === type && (value = '"' + escapeString(value) + '"'), 
        "function" === type ? object.toString().replace(/[\r\n]/g, "").replace(/\{.*\}/, "") + "{…}" : value);
    }
    function getPreview(object) {
        var value = "";
        return isObject(object) ? (value = getObjectName(object), Array.isArray(object) && (value += "[" + object.length + "]")) : value = getValuePreview(object, object), 
        value;
    }
    function cssClass(className) {
        return "json-formatter-" + className;
    }
    function createElement(type, className, content) {
        var el = document.createElement(type);
        return className && el.classList.add(cssClass(className)), void 0 !== content && (content instanceof Node ? el.appendChild(content) : el.appendChild(document.createTextNode(String(content)))), 
        el;
    }
    __webpack_exports__.a = isObject, __webpack_exports__.b = getObjectName, __webpack_exports__.c = getType, 
    __webpack_exports__.g = getValuePreview, __webpack_exports__.e = getPreview, __webpack_exports__.d = cssClass, 
    __webpack_exports__.f = createElement;
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(0);
} ]);


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = convertXOf;
/* harmony export (immutable) */ __webpack_exports__["a"] = _if;

/*
 * Converts anyOf, allOf and oneOf to human readable string
*/

function convertXOf(type) {
  return type.substring(0, 3) + ' of';
}

/*
 * if condition for ES6 template strings
 * to be used only in template string
 *
 * @example mystr = `Random is ${_if(Math.random() > 0.5)`greater than 0.5``
 *
 * @param {boolean} condition
 *
 * @returns {function} the template function
*/
function _if(condition) {
  return condition ? normal : empty;
}
function empty() {
  return '';
}
function normal(template) {
  for (var _len = arguments.length, expressions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    expressions[_key - 1] = arguments[_key];
  }

  return template.slice(1).reduce(function (accumulator, part, i) {
    return accumulator + expressions[i] + part;
  }, template[0]);
}

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);
});

},{}],73:[function(require,module,exports){
(function (global){
/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    undefinedTag = '[object Undefined]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = isEqual;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],74:[function(require,module,exports){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

},{}],75:[function(require,module,exports){
(function (global){
/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    undefinedTag = '[object Undefined]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined,
    getPrototype = overArg(Object.getPrototypeOf, Object),
    objectCreate = Object.create,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeMax = Math.max,
    nativeNow = Date.now;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(source, function(srcValue, key) {
    stack || (stack = new Stack);
    if (isObject(srcValue)) {
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet(object, key),
      srcValue = safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray(srcValue),
        isBuff = !isArr && isBuffer(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || isFunction(objValue)) {
        newValue = initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

/**
 * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key === 'constructor' && typeof object[key] === 'function') {
    return;
  }

  if (key == '__proto__') {
    return;
  }

  return object[key];
}

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = merge;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],76:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array ? array.length : 0,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Checks if a cache value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var splice = arrayProto.splice;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    Set = getNative(root, 'Set'),
    nativeCreate = getNative(Object, 'create');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap(values, baseUnary(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  }
  else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  }
  else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : createSet(array);
    if (set) {
      return setToArray(set);
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache;
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

/**
 * The base implementation of methods like `_.xor`, without support for
 * iteratee shorthands, that accepts an array of arrays to inspect.
 *
 * @private
 * @param {Array} arrays The arrays to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of values.
 */
function baseXor(arrays, iteratee, comparator) {
  var index = -1,
      length = arrays.length;

  while (++index < length) {
    var result = result
      ? arrayPush(
          baseDifference(result, arrays[index], iteratee, comparator),
          baseDifference(arrays[index], result, iteratee, comparator)
        )
      : arrays[index];
  }
  return (result && result.length) ? baseUniq(result, iteratee, comparator) : [];
}

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY) ? noop : function(values) {
  return new Set(values);
};

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates an array of unique values that is the
 * [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
 * of the given arrays. The order of result values is determined by the order
 * they occur in the arrays.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of filtered values.
 * @see _.difference, _.without
 * @example
 *
 * _.xor([2, 1], [2, 3]);
 * // => [1, 3]
 */
var xor = baseRest(function(arrays) {
  return baseXor(arrayFilter(arrays, isArrayLikeObject));
});

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

module.exports = xor;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],77:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;

},{"./_getNative":170,"./_root":214}],78:[function(require,module,exports){
var hashClear = require('./_hashClear'),
    hashDelete = require('./_hashDelete'),
    hashGet = require('./_hashGet'),
    hashHas = require('./_hashHas'),
    hashSet = require('./_hashSet');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"./_hashClear":179,"./_hashDelete":180,"./_hashGet":181,"./_hashHas":182,"./_hashSet":183}],79:[function(require,module,exports){
var listCacheClear = require('./_listCacheClear'),
    listCacheDelete = require('./_listCacheDelete'),
    listCacheGet = require('./_listCacheGet'),
    listCacheHas = require('./_listCacheHas'),
    listCacheSet = require('./_listCacheSet');

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"./_listCacheClear":194,"./_listCacheDelete":195,"./_listCacheGet":196,"./_listCacheHas":197,"./_listCacheSet":198}],80:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":170,"./_root":214}],81:[function(require,module,exports){
var mapCacheClear = require('./_mapCacheClear'),
    mapCacheDelete = require('./_mapCacheDelete'),
    mapCacheGet = require('./_mapCacheGet'),
    mapCacheHas = require('./_mapCacheHas'),
    mapCacheSet = require('./_mapCacheSet');

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"./_mapCacheClear":199,"./_mapCacheDelete":200,"./_mapCacheGet":201,"./_mapCacheHas":202,"./_mapCacheSet":203}],82:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;

},{"./_getNative":170,"./_root":214}],83:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;

},{"./_getNative":170,"./_root":214}],84:[function(require,module,exports){
var MapCache = require('./_MapCache'),
    setCacheAdd = require('./_setCacheAdd'),
    setCacheHas = require('./_setCacheHas');

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

module.exports = SetCache;

},{"./_MapCache":81,"./_setCacheAdd":215,"./_setCacheHas":216}],85:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    stackClear = require('./_stackClear'),
    stackDelete = require('./_stackDelete'),
    stackGet = require('./_stackGet'),
    stackHas = require('./_stackHas'),
    stackSet = require('./_stackSet');

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;

},{"./_ListCache":79,"./_stackClear":220,"./_stackDelete":221,"./_stackGet":222,"./_stackHas":223,"./_stackSet":224}],86:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":214}],87:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;

},{"./_root":214}],88:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;

},{"./_getNative":170,"./_root":214}],89:[function(require,module,exports){
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],90:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],91:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],92:[function(require,module,exports){
var baseIndexOf = require('./_baseIndexOf');

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

module.exports = arrayIncludes;

},{"./_baseIndexOf":118}],93:[function(require,module,exports){
/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

module.exports = arrayIncludesWith;

},{}],94:[function(require,module,exports){
var baseTimes = require('./_baseTimes'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isIndex = require('./_isIndex'),
    isTypedArray = require('./isTypedArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;

},{"./_baseTimes":139,"./_isIndex":188,"./isArguments":241,"./isArray":242,"./isBuffer":245,"./isTypedArray":255}],95:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],96:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],97:[function(require,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array == null ? 0 : array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],98:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],99:[function(require,module,exports){
var baseProperty = require('./_baseProperty');

/**
 * Gets the size of an ASCII `string`.
 *
 * @private
 * @param {string} string The string inspect.
 * @returns {number} Returns the string size.
 */
var asciiSize = baseProperty('length');

module.exports = asciiSize;

},{"./_baseProperty":134}],100:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    eq = require('./eq');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignValue;

},{"./_baseAssignValue":104,"./eq":234}],101:[function(require,module,exports){
var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"./eq":234}],102:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keys = require('./keys');

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

module.exports = baseAssign;

},{"./_copyObject":154,"./keys":257}],103:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keysIn = require('./keysIn');

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn(source), object);
}

module.exports = baseAssignIn;

},{"./_copyObject":154,"./keysIn":258}],104:[function(require,module,exports){
var defineProperty = require('./_defineProperty');

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

module.exports = baseAssignValue;

},{"./_defineProperty":161}],105:[function(require,module,exports){
var Stack = require('./_Stack'),
    arrayEach = require('./_arrayEach'),
    assignValue = require('./_assignValue'),
    baseAssign = require('./_baseAssign'),
    baseAssignIn = require('./_baseAssignIn'),
    cloneBuffer = require('./_cloneBuffer'),
    copyArray = require('./_copyArray'),
    copySymbols = require('./_copySymbols'),
    copySymbolsIn = require('./_copySymbolsIn'),
    getAllKeys = require('./_getAllKeys'),
    getAllKeysIn = require('./_getAllKeysIn'),
    getTag = require('./_getTag'),
    initCloneArray = require('./_initCloneArray'),
    initCloneByTag = require('./_initCloneByTag'),
    initCloneObject = require('./_initCloneObject'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isMap = require('./isMap'),
    isObject = require('./isObject'),
    isSet = require('./isSet'),
    keys = require('./keys');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
  }

  var keysFunc = isFull
    ? (isFlat ? getAllKeysIn : getAllKeys)
    : (isFlat ? keysIn : keys);

  var props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;

},{"./_Stack":85,"./_arrayEach":90,"./_assignValue":100,"./_baseAssign":102,"./_baseAssignIn":103,"./_cloneBuffer":148,"./_copyArray":153,"./_copySymbols":155,"./_copySymbolsIn":156,"./_getAllKeys":166,"./_getAllKeysIn":167,"./_getTag":175,"./_initCloneArray":184,"./_initCloneByTag":185,"./_initCloneObject":186,"./isArray":242,"./isBuffer":245,"./isMap":249,"./isObject":250,"./isSet":252,"./keys":257}],106:[function(require,module,exports){
var isObject = require('./isObject');

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

module.exports = baseCreate;

},{"./isObject":250}],107:[function(require,module,exports){
var baseForOwn = require('./_baseForOwn'),
    createBaseEach = require('./_createBaseEach');

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./_baseForOwn":112,"./_createBaseEach":158}],108:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * The base implementation of `_.filter` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"./_baseEach":107}],109:[function(require,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],110:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    isFlattenable = require('./_isFlattenable');

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"./_arrayPush":96,"./_isFlattenable":187}],111:[function(require,module,exports){
var createBaseFor = require('./_createBaseFor');

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./_createBaseFor":159}],112:[function(require,module,exports){
var baseFor = require('./_baseFor'),
    keys = require('./keys');

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"./_baseFor":111,"./keys":257}],113:[function(require,module,exports){
var castPath = require('./_castPath'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":146,"./_toKey":228}],114:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    isArray = require('./isArray');

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

},{"./_arrayPush":96,"./isArray":242}],115:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":86,"./_getRawTag":172,"./_objectToString":211}],116:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.has` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHas(object, key) {
  return object != null && hasOwnProperty.call(object, key);
}

module.exports = baseHas;

},{}],117:[function(require,module,exports){
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

module.exports = baseHasIn;

},{}],118:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIsNaN = require('./_baseIsNaN'),
    strictIndexOf = require('./_strictIndexOf');

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

module.exports = baseIndexOf;

},{"./_baseFindIndex":109,"./_baseIsNaN":124,"./_strictIndexOf":225}],119:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;

},{"./_baseGetTag":115,"./isObjectLike":251}],120:[function(require,module,exports){
var baseIsEqualDeep = require('./_baseIsEqualDeep'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

module.exports = baseIsEqual;

},{"./_baseIsEqualDeep":121,"./isObjectLike":251}],121:[function(require,module,exports){
var Stack = require('./_Stack'),
    equalArrays = require('./_equalArrays'),
    equalByTag = require('./_equalByTag'),
    equalObjects = require('./_equalObjects'),
    getTag = require('./_getTag'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isTypedArray = require('./isTypedArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

module.exports = baseIsEqualDeep;

},{"./_Stack":85,"./_equalArrays":162,"./_equalByTag":163,"./_equalObjects":164,"./_getTag":175,"./isArray":242,"./isBuffer":245,"./isTypedArray":255}],122:[function(require,module,exports){
var getTag = require('./_getTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike(value) && getTag(value) == mapTag;
}

module.exports = baseIsMap;

},{"./_getTag":175,"./isObjectLike":251}],123:[function(require,module,exports){
var Stack = require('./_Stack'),
    baseIsEqual = require('./_baseIsEqual');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./_Stack":85,"./_baseIsEqual":120}],124:[function(require,module,exports){
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

module.exports = baseIsNaN;

},{}],125:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isMasked":191,"./_toSource":229,"./isFunction":247,"./isObject":250}],126:[function(require,module,exports){
var getTag = require('./_getTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike(value) && getTag(value) == setTag;
}

module.exports = baseIsSet;

},{"./_getTag":175,"./isObjectLike":251}],127:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isLength = require('./isLength'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;

},{"./_baseGetTag":115,"./isLength":248,"./isObjectLike":251}],128:[function(require,module,exports){
var baseMatches = require('./_baseMatches'),
    baseMatchesProperty = require('./_baseMatchesProperty'),
    identity = require('./identity'),
    isArray = require('./isArray'),
    property = require('./property');

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

module.exports = baseIteratee;

},{"./_baseMatches":132,"./_baseMatchesProperty":133,"./identity":240,"./isArray":242,"./property":262}],129:[function(require,module,exports){
var isPrototype = require('./_isPrototype'),
    nativeKeys = require('./_nativeKeys');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeys;

},{"./_isPrototype":192,"./_nativeKeys":208}],130:[function(require,module,exports){
var isObject = require('./isObject'),
    isPrototype = require('./_isPrototype'),
    nativeKeysIn = require('./_nativeKeysIn');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;

},{"./_isPrototype":192,"./_nativeKeysIn":209,"./isObject":250}],131:[function(require,module,exports){
var baseEach = require('./_baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./_baseEach":107,"./isArrayLike":243}],132:[function(require,module,exports){
var baseIsMatch = require('./_baseIsMatch'),
    getMatchData = require('./_getMatchData'),
    matchesStrictComparable = require('./_matchesStrictComparable');

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

module.exports = baseMatches;

},{"./_baseIsMatch":123,"./_getMatchData":169,"./_matchesStrictComparable":205}],133:[function(require,module,exports){
var baseIsEqual = require('./_baseIsEqual'),
    get = require('./get'),
    hasIn = require('./hasIn'),
    isKey = require('./_isKey'),
    isStrictComparable = require('./_isStrictComparable'),
    matchesStrictComparable = require('./_matchesStrictComparable'),
    toKey = require('./_toKey');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

module.exports = baseMatchesProperty;

},{"./_baseIsEqual":120,"./_isKey":189,"./_isStrictComparable":193,"./_matchesStrictComparable":205,"./_toKey":228,"./get":237,"./hasIn":239}],134:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],135:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

module.exports = basePropertyDeep;

},{"./_baseGet":113}],136:[function(require,module,exports){
/**
 * The base implementation of `_.reduce` and `_.reduceRight`, without support
 * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initAccum Specify using the first or last element of
 *  `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initAccum
      ? (initAccum = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

module.exports = baseReduce;

},{}],137:[function(require,module,exports){
var identity = require('./identity'),
    overRest = require('./_overRest'),
    setToString = require('./_setToString');

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

module.exports = baseRest;

},{"./_overRest":213,"./_setToString":218,"./identity":240}],138:[function(require,module,exports){
var constant = require('./constant'),
    defineProperty = require('./_defineProperty'),
    identity = require('./identity');

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

module.exports = baseSetToString;

},{"./_defineProperty":161,"./constant":232,"./identity":240}],139:[function(require,module,exports){
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;

},{}],140:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":86,"./_arrayMap":95,"./isArray":242,"./isSymbol":254}],141:[function(require,module,exports){
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;

},{}],142:[function(require,module,exports){
var SetCache = require('./_SetCache'),
    arrayIncludes = require('./_arrayIncludes'),
    arrayIncludesWith = require('./_arrayIncludesWith'),
    cacheHas = require('./_cacheHas'),
    createSet = require('./_createSet'),
    setToArray = require('./_setToArray');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  }
  else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : createSet(array);
    if (set) {
      return setToArray(set);
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache;
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

module.exports = baseUniq;

},{"./_SetCache":84,"./_arrayIncludes":92,"./_arrayIncludesWith":93,"./_cacheHas":144,"./_createSet":160,"./_setToArray":217}],143:[function(require,module,exports){
var arrayMap = require('./_arrayMap');

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

module.exports = baseValues;

},{"./_arrayMap":95}],144:[function(require,module,exports){
/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

module.exports = cacheHas;

},{}],145:[function(require,module,exports){
var identity = require('./identity');

/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : identity;
}

module.exports = castFunction;

},{"./identity":240}],146:[function(require,module,exports){
var isArray = require('./isArray'),
    isKey = require('./_isKey'),
    stringToPath = require('./_stringToPath'),
    toString = require('./toString');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

module.exports = castPath;

},{"./_isKey":189,"./_stringToPath":227,"./isArray":242,"./toString":267}],147:[function(require,module,exports){
var Uint8Array = require('./_Uint8Array');

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;

},{"./_Uint8Array":87}],148:[function(require,module,exports){
var root = require('./_root');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

},{"./_root":214}],149:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

module.exports = cloneDataView;

},{"./_cloneArrayBuffer":147}],150:[function(require,module,exports){
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

module.exports = cloneRegExp;

},{}],151:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

module.exports = cloneSymbol;

},{"./_Symbol":86}],152:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;

},{"./_cloneArrayBuffer":147}],153:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;

},{}],154:[function(require,module,exports){
var assignValue = require('./_assignValue'),
    baseAssignValue = require('./_baseAssignValue');

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

module.exports = copyObject;

},{"./_assignValue":100,"./_baseAssignValue":104}],155:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbols = require('./_getSymbols');

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

module.exports = copySymbols;

},{"./_copyObject":154,"./_getSymbols":173}],156:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbolsIn = require('./_getSymbolsIn');

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn(source), object);
}

module.exports = copySymbolsIn;

},{"./_copyObject":154,"./_getSymbolsIn":174}],157:[function(require,module,exports){
var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":214}],158:[function(require,module,exports){
var isArrayLike = require('./isArrayLike');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./isArrayLike":243}],159:[function(require,module,exports){
/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{}],160:[function(require,module,exports){
var Set = require('./_Set'),
    noop = require('./noop'),
    setToArray = require('./_setToArray');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY) ? noop : function(values) {
  return new Set(values);
};

module.exports = createSet;

},{"./_Set":83,"./_setToArray":217,"./noop":261}],161:[function(require,module,exports){
var getNative = require('./_getNative');

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

module.exports = defineProperty;

},{"./_getNative":170}],162:[function(require,module,exports){
var SetCache = require('./_SetCache'),
    arraySome = require('./_arraySome'),
    cacheHas = require('./_cacheHas');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

module.exports = equalArrays;

},{"./_SetCache":84,"./_arraySome":98,"./_cacheHas":144}],163:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    Uint8Array = require('./_Uint8Array'),
    eq = require('./eq'),
    equalArrays = require('./_equalArrays'),
    mapToArray = require('./_mapToArray'),
    setToArray = require('./_setToArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

module.exports = equalByTag;

},{"./_Symbol":86,"./_Uint8Array":87,"./_equalArrays":162,"./_mapToArray":204,"./_setToArray":217,"./eq":234}],164:[function(require,module,exports){
var getAllKeys = require('./_getAllKeys');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

module.exports = equalObjects;

},{"./_getAllKeys":166}],165:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],166:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbols = require('./_getSymbols'),
    keys = require('./keys');

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;

},{"./_baseGetAllKeys":114,"./_getSymbols":173,"./keys":257}],167:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbolsIn = require('./_getSymbolsIn'),
    keysIn = require('./keysIn');

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn);
}

module.exports = getAllKeysIn;

},{"./_baseGetAllKeys":114,"./_getSymbolsIn":174,"./keysIn":258}],168:[function(require,module,exports){
var isKeyable = require('./_isKeyable');

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;

},{"./_isKeyable":190}],169:[function(require,module,exports){
var isStrictComparable = require('./_isStrictComparable'),
    keys = require('./keys');

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

module.exports = getMatchData;

},{"./_isStrictComparable":193,"./keys":257}],170:[function(require,module,exports){
var baseIsNative = require('./_baseIsNative'),
    getValue = require('./_getValue');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"./_baseIsNative":125,"./_getValue":176}],171:[function(require,module,exports){
var overArg = require('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":212}],172:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":86}],173:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    stubArray = require('./stubArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

module.exports = getSymbols;

},{"./_arrayFilter":91,"./stubArray":265}],174:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    getPrototype = require('./_getPrototype'),
    getSymbols = require('./_getSymbols'),
    stubArray = require('./stubArray');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;

},{"./_arrayPush":96,"./_getPrototype":171,"./_getSymbols":173,"./stubArray":265}],175:[function(require,module,exports){
var DataView = require('./_DataView'),
    Map = require('./_Map'),
    Promise = require('./_Promise'),
    Set = require('./_Set'),
    WeakMap = require('./_WeakMap'),
    baseGetTag = require('./_baseGetTag'),
    toSource = require('./_toSource');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

module.exports = getTag;

},{"./_DataView":77,"./_Map":80,"./_Promise":82,"./_Set":83,"./_WeakMap":88,"./_baseGetTag":115,"./_toSource":229}],176:[function(require,module,exports){
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],177:[function(require,module,exports){
var castPath = require('./_castPath'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isIndex = require('./_isIndex'),
    isLength = require('./isLength'),
    toKey = require('./_toKey');

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

module.exports = hasPath;

},{"./_castPath":146,"./_isIndex":188,"./_toKey":228,"./isArguments":241,"./isArray":242,"./isLength":248}],178:[function(require,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

module.exports = hasUnicode;

},{}],179:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

},{"./_nativeCreate":207}],180:[function(require,module,exports){
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

},{}],181:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"./_nativeCreate":207}],182:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"./_nativeCreate":207}],183:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":207}],184:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],185:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer'),
    cloneDataView = require('./_cloneDataView'),
    cloneRegExp = require('./_cloneRegExp'),
    cloneSymbol = require('./_cloneSymbol'),
    cloneTypedArray = require('./_cloneTypedArray');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return new Ctor;

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return new Ctor;

    case symbolTag:
      return cloneSymbol(object);
  }
}

module.exports = initCloneByTag;

},{"./_cloneArrayBuffer":147,"./_cloneDataView":149,"./_cloneRegExp":150,"./_cloneSymbol":151,"./_cloneTypedArray":152}],186:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    getPrototype = require('./_getPrototype'),
    isPrototype = require('./_isPrototype');

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;

},{"./_baseCreate":106,"./_getPrototype":171,"./_isPrototype":192}],187:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray');

/** Built-in value references. */
var spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

module.exports = isFlattenable;

},{"./_Symbol":86,"./isArguments":241,"./isArray":242}],188:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;

},{}],189:[function(require,module,exports){
var isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

module.exports = isKey;

},{"./isArray":242,"./isSymbol":254}],190:[function(require,module,exports){
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;

},{}],191:[function(require,module,exports){
var coreJsData = require('./_coreJsData');

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;

},{"./_coreJsData":157}],192:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;

},{}],193:[function(require,module,exports){
var isObject = require('./isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"./isObject":250}],194:[function(require,module,exports){
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

},{}],195:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":101}],196:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"./_assocIndexOf":101}],197:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"./_assocIndexOf":101}],198:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":101}],199:[function(require,module,exports){
var Hash = require('./_Hash'),
    ListCache = require('./_ListCache'),
    Map = require('./_Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;

},{"./_Hash":78,"./_ListCache":79,"./_Map":80}],200:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

},{"./_getMapData":168}],201:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"./_getMapData":168}],202:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"./_getMapData":168}],203:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":168}],204:[function(require,module,exports){
/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

module.exports = mapToArray;

},{}],205:[function(require,module,exports){
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

module.exports = matchesStrictComparable;

},{}],206:[function(require,module,exports){
var memoize = require('./memoize');

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

module.exports = memoizeCapped;

},{"./memoize":260}],207:[function(require,module,exports){
var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":170}],208:[function(require,module,exports){
var overArg = require('./_overArg');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

module.exports = nativeKeys;

},{"./_overArg":212}],209:[function(require,module,exports){
/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;

},{}],210:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;

},{"./_freeGlobal":165}],211:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],212:[function(require,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],213:[function(require,module,exports){
var apply = require('./_apply');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

module.exports = overRest;

},{"./_apply":89}],214:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":165}],215:[function(require,module,exports){
/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

module.exports = setCacheAdd;

},{}],216:[function(require,module,exports){
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

module.exports = setCacheHas;

},{}],217:[function(require,module,exports){
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

module.exports = setToArray;

},{}],218:[function(require,module,exports){
var baseSetToString = require('./_baseSetToString'),
    shortOut = require('./_shortOut');

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

module.exports = setToString;

},{"./_baseSetToString":138,"./_shortOut":219}],219:[function(require,module,exports){
/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

module.exports = shortOut;

},{}],220:[function(require,module,exports){
var ListCache = require('./_ListCache');

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

module.exports = stackClear;

},{"./_ListCache":79}],221:[function(require,module,exports){
/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

module.exports = stackDelete;

},{}],222:[function(require,module,exports){
/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;

},{}],223:[function(require,module,exports){
/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;

},{}],224:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    Map = require('./_Map'),
    MapCache = require('./_MapCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;

},{"./_ListCache":79,"./_Map":80,"./_MapCache":81}],225:[function(require,module,exports){
/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = strictIndexOf;

},{}],226:[function(require,module,exports){
var asciiSize = require('./_asciiSize'),
    hasUnicode = require('./_hasUnicode'),
    unicodeSize = require('./_unicodeSize');

/**
 * Gets the number of symbols in `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the string size.
 */
function stringSize(string) {
  return hasUnicode(string)
    ? unicodeSize(string)
    : asciiSize(string);
}

module.exports = stringSize;

},{"./_asciiSize":99,"./_hasUnicode":178,"./_unicodeSize":230}],227:[function(require,module,exports){
var memoizeCapped = require('./_memoizeCapped');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

module.exports = stringToPath;

},{"./_memoizeCapped":206}],228:[function(require,module,exports){
var isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toKey;

},{"./isSymbol":254}],229:[function(require,module,exports){
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],230:[function(require,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Gets the size of a Unicode `string`.
 *
 * @private
 * @param {string} string The string inspect.
 * @returns {number} Returns the string size.
 */
function unicodeSize(string) {
  var result = reUnicode.lastIndex = 0;
  while (reUnicode.test(string)) {
    ++result;
  }
  return result;
}

module.exports = unicodeSize;

},{}],231:[function(require,module,exports){
var baseClone = require('./_baseClone');

/** Used to compose bitmasks for cloning. */
var CLONE_SYMBOLS_FLAG = 4;

/**
 * Creates a shallow clone of `value`.
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
 * and supports cloning arrays, array buffers, booleans, date objects, maps,
 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
 * arrays. The own enumerable properties of `arguments` objects are cloned
 * as plain objects. An empty object is returned for uncloneable values such
 * as error objects, functions, DOM nodes, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to clone.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeep
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return baseClone(value, CLONE_SYMBOLS_FLAG);
}

module.exports = clone;

},{"./_baseClone":105}],232:[function(require,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],233:[function(require,module,exports){
module.exports = require('./forEach');

},{"./forEach":236}],234:[function(require,module,exports){
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;

},{}],235:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    baseFilter = require('./_baseFilter'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray');

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * **Note:** Unlike `_.remove`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 * @see _.reject
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * _.filter(users, function(o) { return !o.active; });
 * // => objects for ['fred']
 *
 * // The `_.matches` iteratee shorthand.
 * _.filter(users, { 'age': 36, 'active': true });
 * // => objects for ['barney']
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.filter(users, ['active', false]);
 * // => objects for ['fred']
 *
 * // The `_.property` iteratee shorthand.
 * _.filter(users, 'active');
 * // => objects for ['barney']
 */
function filter(collection, predicate) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  return func(collection, baseIteratee(predicate, 3));
}

module.exports = filter;

},{"./_arrayFilter":91,"./_baseFilter":108,"./_baseIteratee":128,"./isArray":242}],236:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    baseEach = require('./_baseEach'),
    castFunction = require('./_castFunction'),
    isArray = require('./isArray');

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _.forEach([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = isArray(collection) ? arrayEach : baseEach;
  return func(collection, castFunction(iteratee));
}

module.exports = forEach;

},{"./_arrayEach":90,"./_baseEach":107,"./_castFunction":145,"./isArray":242}],237:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"./_baseGet":113}],238:[function(require,module,exports){
var baseHas = require('./_baseHas'),
    hasPath = require('./_hasPath');

/**
 * Checks if `path` is a direct property of `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': 2 } };
 * var other = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b');
 * // => true
 *
 * _.has(object, ['a', 'b']);
 * // => true
 *
 * _.has(other, 'a');
 * // => false
 */
function has(object, path) {
  return object != null && hasPath(object, path, baseHas);
}

module.exports = has;

},{"./_baseHas":116,"./_hasPath":177}],239:[function(require,module,exports){
var baseHasIn = require('./_baseHasIn'),
    hasPath = require('./_hasPath');

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

module.exports = hasIn;

},{"./_baseHasIn":117,"./_hasPath":177}],240:[function(require,module,exports){
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],241:[function(require,module,exports){
var baseIsArguments = require('./_baseIsArguments'),
    isObjectLike = require('./isObjectLike');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

module.exports = isArguments;

},{"./_baseIsArguments":119,"./isObjectLike":251}],242:[function(require,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],243:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

},{"./isFunction":247,"./isLength":248}],244:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

module.exports = isArrayLikeObject;

},{"./isArrayLike":243,"./isObjectLike":251}],245:[function(require,module,exports){
var root = require('./_root'),
    stubFalse = require('./stubFalse');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;

},{"./_root":214,"./stubFalse":266}],246:[function(require,module,exports){
var baseKeys = require('./_baseKeys'),
    getTag = require('./_getTag'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('./isArrayLike'),
    isBuffer = require('./isBuffer'),
    isPrototype = require('./_isPrototype'),
    isTypedArray = require('./isTypedArray');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) &&
      (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer(value) || isTypedArray(value) || isArguments(value))) {
    return !value.length;
  }
  var tag = getTag(value);
  if (tag == mapTag || tag == setTag) {
    return !value.size;
  }
  if (isPrototype(value)) {
    return !baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

module.exports = isEmpty;

},{"./_baseKeys":129,"./_getTag":175,"./_isPrototype":192,"./isArguments":241,"./isArray":242,"./isArrayLike":243,"./isBuffer":245,"./isTypedArray":255}],247:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":115,"./isObject":250}],248:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],249:[function(require,module,exports){
var baseIsMap = require('./_baseIsMap'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsMap = nodeUtil && nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

module.exports = isMap;

},{"./_baseIsMap":122,"./_baseUnary":141,"./_nodeUtil":210}],250:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],251:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],252:[function(require,module,exports){
var baseIsSet = require('./_baseIsSet'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsSet = nodeUtil && nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

module.exports = isSet;

},{"./_baseIsSet":126,"./_baseUnary":141,"./_nodeUtil":210}],253:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isArray = require('./isArray'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
}

module.exports = isString;

},{"./_baseGetTag":115,"./isArray":242,"./isObjectLike":251}],254:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":115,"./isObjectLike":251}],255:[function(require,module,exports){
var baseIsTypedArray = require('./_baseIsTypedArray'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;

},{"./_baseIsTypedArray":127,"./_baseUnary":141,"./_nodeUtil":210}],256:[function(require,module,exports){
/**
 * Checks if `value` is `undefined`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * _.isUndefined(void 0);
 * // => true
 *
 * _.isUndefined(null);
 * // => false
 */
function isUndefined(value) {
  return value === undefined;
}

module.exports = isUndefined;

},{}],257:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeys = require('./_baseKeys'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

},{"./_arrayLikeKeys":94,"./_baseKeys":129,"./isArrayLike":243}],258:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeysIn = require('./_baseKeysIn'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;

},{"./_arrayLikeKeys":94,"./_baseKeysIn":130,"./isArrayLike":243}],259:[function(require,module,exports){
var arrayMap = require('./_arrayMap'),
    baseIteratee = require('./_baseIteratee'),
    baseMap = require('./_baseMap'),
    isArray = require('./isArray');

/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee) {
  var func = isArray(collection) ? arrayMap : baseMap;
  return func(collection, baseIteratee(iteratee, 3));
}

module.exports = map;

},{"./_arrayMap":95,"./_baseIteratee":128,"./_baseMap":131,"./isArray":242}],260:[function(require,module,exports){
var MapCache = require('./_MapCache');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":81}],261:[function(require,module,exports){
/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

module.exports = noop;

},{}],262:[function(require,module,exports){
var baseProperty = require('./_baseProperty'),
    basePropertyDeep = require('./_basePropertyDeep'),
    isKey = require('./_isKey'),
    toKey = require('./_toKey');

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

},{"./_baseProperty":134,"./_basePropertyDeep":135,"./_isKey":189,"./_toKey":228}],263:[function(require,module,exports){
var arrayReduce = require('./_arrayReduce'),
    baseEach = require('./_baseEach'),
    baseIteratee = require('./_baseIteratee'),
    baseReduce = require('./_baseReduce'),
    isArray = require('./isArray');

/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` thru `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not given, the first element of `collection` is used as the initial
 * value. The iteratee is invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
 * and `sortBy`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @returns {*} Returns the accumulated value.
 * @see _.reduceRight
 * @example
 *
 * _.reduce([1, 2], function(sum, n) {
 *   return sum + n;
 * }, 0);
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 *   return result;
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
 */
function reduce(collection, iteratee, accumulator) {
  var func = isArray(collection) ? arrayReduce : baseReduce,
      initAccum = arguments.length < 3;

  return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEach);
}

module.exports = reduce;

},{"./_arrayReduce":97,"./_baseEach":107,"./_baseIteratee":128,"./_baseReduce":136,"./isArray":242}],264:[function(require,module,exports){
var baseKeys = require('./_baseKeys'),
    getTag = require('./_getTag'),
    isArrayLike = require('./isArrayLike'),
    isString = require('./isString'),
    stringSize = require('./_stringSize');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/**
 * Gets the size of `collection` by returning its length for array-like
 * values or the number of own enumerable string keyed properties for objects.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @returns {number} Returns the collection size.
 * @example
 *
 * _.size([1, 2, 3]);
 * // => 3
 *
 * _.size({ 'a': 1, 'b': 2 });
 * // => 2
 *
 * _.size('pebbles');
 * // => 7
 */
function size(collection) {
  if (collection == null) {
    return 0;
  }
  if (isArrayLike(collection)) {
    return isString(collection) ? stringSize(collection) : collection.length;
  }
  var tag = getTag(collection);
  if (tag == mapTag || tag == setTag) {
    return collection.size;
  }
  return baseKeys(collection).length;
}

module.exports = size;

},{"./_baseKeys":129,"./_getTag":175,"./_stringSize":226,"./isArrayLike":243,"./isString":253}],265:[function(require,module,exports){
/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;

},{}],266:[function(require,module,exports){
/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;

},{}],267:[function(require,module,exports){
var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":140}],268:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    baseCreate = require('./_baseCreate'),
    baseForOwn = require('./_baseForOwn'),
    baseIteratee = require('./_baseIteratee'),
    getPrototype = require('./_getPrototype'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isFunction = require('./isFunction'),
    isObject = require('./isObject'),
    isTypedArray = require('./isTypedArray');

/**
 * An alternative to `_.reduce`; this method transforms `object` to a new
 * `accumulator` object which is the result of running each of its own
 * enumerable string keyed properties thru `iteratee`, with each invocation
 * potentially mutating the `accumulator` object. If `accumulator` is not
 * provided, a new object with the same `[[Prototype]]` will be used. The
 * iteratee is invoked with four arguments: (accumulator, value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 1.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The custom accumulator value.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.transform([2, 3, 4], function(result, n) {
 *   result.push(n *= n);
 *   return n % 2 == 0;
 * }, []);
 * // => [4, 9]
 *
 * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] }
 */
function transform(object, iteratee, accumulator) {
  var isArr = isArray(object),
      isArrLike = isArr || isBuffer(object) || isTypedArray(object);

  iteratee = baseIteratee(iteratee, 4);
  if (accumulator == null) {
    var Ctor = object && object.constructor;
    if (isArrLike) {
      accumulator = isArr ? new Ctor : [];
    }
    else if (isObject(object)) {
      accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
    }
    else {
      accumulator = {};
    }
  }
  (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object) {
    return iteratee(accumulator, value, index, object);
  });
  return accumulator;
}

module.exports = transform;

},{"./_arrayEach":90,"./_baseCreate":106,"./_baseForOwn":112,"./_baseIteratee":128,"./_getPrototype":171,"./isArray":242,"./isBuffer":245,"./isFunction":247,"./isObject":250,"./isTypedArray":255}],269:[function(require,module,exports){
var baseFlatten = require('./_baseFlatten'),
    baseRest = require('./_baseRest'),
    baseUniq = require('./_baseUniq'),
    isArrayLikeObject = require('./isArrayLikeObject');

/**
 * Creates an array of unique values, in order, from all given arrays using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @returns {Array} Returns the new array of combined values.
 * @example
 *
 * _.union([2], [1, 2]);
 * // => [2, 1]
 */
var union = baseRest(function(arrays) {
  return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
});

module.exports = union;

},{"./_baseFlatten":110,"./_baseRest":137,"./_baseUniq":142,"./isArrayLikeObject":244}],270:[function(require,module,exports){
var baseValues = require('./_baseValues'),
    keys = require('./keys');

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object == null ? [] : baseValues(object, keys(object));
}

module.exports = values;

},{"./_baseValues":143,"./keys":257}],271:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],272:[function(require,module,exports){
'use strict';

var isEqual = require('lodash.isequal');

var xor = require('lodash.xor');

var keys = require('lodash.keys');

var _require = require('./jsonSchemaHelpers'),
    types = _require.types,
    FORMAT_REGEXPS = _require.FORMAT_REGEXPS,
    isFormat = _require.isFormat;

var helpers = {
  stringFormats: keys(FORMAT_REGEXPS),
  isFormat: isFormat,
  typeNames: ['integer', 'number', // make sure number is after integer (for proper type detection)
  'string', 'array', 'object', 'boolean', 'null', 'date'],
  getType: function getType(val) {
    return helpers.typeNames.find(function (typeName) {
      return types[typeName](val);
    });
  },

  /**
   * Tries to find the least common schema from two supplied JSON schemas. If it is unable to find
   * such a schema, it returns null. Incompatibility in structure/types leads to returning null,
   * except when the difference is only integer/number. Than the 'number' is used instead 'int'.
   * Types/Structure incompatibility in array items only leads to schema that doesn't specify
   * items structure/type.
   * @param {object} schema1 - JSON schema
   * @param {object} schema2 - JSON schema
   * @returns {object|null}
   */
  mergeSchemaObjs: function mergeSchemaObjs(schema1, schema2) {
    var schema1Keys = keys(schema1);
    var schema2Keys = keys(schema2);

    if (!isEqual(schema1Keys, schema2Keys)) {
      if (schema1.type === 'array' && schema2.type === 'array') {
        // TODO optimize???
        if (isEqual(xor(schema1Keys, schema2Keys), ['items'])) {
          var schemaWithoutItems = schema1Keys.length > schema2Keys.length ? schema2 : schema1;
          var schemaWithItems = schema1Keys.length > schema2Keys.length ? schema1 : schema2;
          var isSame = keys(schemaWithoutItems).reduce(function (acc, current) {
            return isEqual(schemaWithoutItems[current], schemaWithItems[current]) && acc;
          }, true);

          if (isSame) {
            return schemaWithoutItems;
          }
        }
      }

      if (schema1.type !== 'object' || schema2.type !== 'object') {
        return null;
      }
    }

    var retObj = {};

    for (var i = 0, length = schema1Keys.length; i < length; i++) {
      var key = schema1Keys[i];

      if (helpers.getType(schema1[key]) === 'object') {
        var x = helpers.mergeSchemaObjs(schema1[key], schema2[key]);

        if (!x) {
          if (schema1.type === 'object' || schema2.type === 'object') {
            return {
              type: 'object'
            };
          } // special treatment for array items. If not mergeable, we can do without them


          if (key !== 'items' || schema1.type !== 'array' || schema2.type !== 'array') {
            return null;
          }
        } else {
          retObj[key] = x;
        }
      } else {
        // simple value schema properties (not defined by object)
        if (key === 'type') {
          // eslint-disable-line no-lonely-if
          if (schema1[key] !== schema2[key]) {
            if (schema1[key] === 'integer' && schema2[key] === 'number' || schema1[key] === 'number' && schema2[key] === 'integer') {
              retObj[key] = 'number';
            } else {
              return null;
            }
          } else {
            retObj[key] = schema1[key];
          }
        } else {
          if (!isEqual(schema1[key], schema2[key])) {
            // TODO Is it even possible to take this path?
            return null;
          }

          retObj[key] = schema1[key];
        }
      }
    }

    return retObj;
  }
};
module.exports = helpers;
},{"./jsonSchemaHelpers":274,"lodash.isequal":73,"lodash.keys":74,"lodash.xor":76}],273:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var merge = require('lodash.merge');

var isEqual = require('lodash.isequal');

var helpers = require('./helpers');

var defaultOptions = {
  required: false,
  postProcessFnc: null,
  strings: {
    detectFormat: true,
    preProcessFnc: null
  },
  arrays: {
    mode: 'all'
  },
  objects: {
    preProcessFnc: null,
    postProcessFnc: null,
    additionalProperties: true
  }
};
var skipReverseFind = ['hostname', 'host-name', 'alpha', 'alphanumeric', 'regex', 'regexp', 'pattern'];
var filteredFormats = helpers.stringFormats.filter(function (item) {
  return skipReverseFind.indexOf(item) < 0;
});

function getCommonTypeFromArrayOfTypes(arrOfTypes) {
  var lastVal;

  for (var i = 0, length = arrOfTypes.length; i < length; i++) {
    var currentType = arrOfTypes[i];

    if (i > 0) {
      if (currentType === 'integer' && lastVal === 'number') {
        currentType = 'number';
      } else if (currentType === 'number' && lastVal === 'integer') {
        lastVal = 'number';
      }

      if (lastVal !== currentType) return null;
    }

    lastVal = currentType;
  }

  return lastVal;
}

function getCommonArrayItemsType(arr) {
  return getCommonTypeFromArrayOfTypes(arr.map(function (item) {
    return helpers.getType(item);
  }));
}

var ToJsonSchema = /*#__PURE__*/function () {
  function ToJsonSchema(options) {
    _classCallCheck(this, ToJsonSchema);

    this.options = merge({}, defaultOptions, options);
    this.getObjectSchemaDefault = this.getObjectSchemaDefault.bind(this);
    this.getStringSchemaDefault = this.getStringSchemaDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
    this.commmonPostProcessDefault = this.commmonPostProcessDefault.bind(this);
    this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
  }
  /**
   * Tries to find the least common schema that would validate all items in the array. More details
   * helpers.mergeSchemaObjs description
   * @param {array} arr
   * @returns {object|null}
   */


  _createClass(ToJsonSchema, [{
    key: "getCommonArrayItemSchema",
    value: function getCommonArrayItemSchema(arr) {
      var _this = this;

      var schemas = arr.map(function (item) {
        return _this.getSchema(item);
      }); // schemas.forEach(schema => console.log(JSON.stringify(schema, '\t')))

      return schemas.reduce(function (acc, current) {
        return helpers.mergeSchemaObjs(acc, current);
      }, schemas.pop());
    }
  }, {
    key: "getObjectSchemaDefault",
    value: function getObjectSchemaDefault(obj) {
      var _this2 = this;

      var schema = {
        type: 'object'
      };
      var objKeys = Object.keys(obj);

      if (objKeys.length > 0) {
        schema.properties = objKeys.reduce(function (acc, propertyName) {
          acc[propertyName] = _this2.getSchema(obj[propertyName]); // eslint-disable-line no-param-reassign

          return acc;
        }, {});
      }

      return schema;
    }
  }, {
    key: "getObjectSchema",
    value: function getObjectSchema(obj) {
      if (this.options.objects.preProcessFnc) {
        return this.options.objects.preProcessFnc(obj, this.getObjectSchemaDefault);
      }

      return this.getObjectSchemaDefault(obj);
    }
  }, {
    key: "getArraySchemaMerging",
    value: function getArraySchemaMerging(arr) {
      var schema = {
        type: 'array'
      };
      var commonType = getCommonArrayItemsType(arr);

      if (commonType) {
        schema.items = {
          type: commonType
        };

        if (commonType !== 'integer' && commonType !== 'number') {
          var itemSchema = this.getCommonArrayItemSchema(arr);

          if (itemSchema) {
            schema.items = itemSchema;
          }
        } else if (this.options.required) {
          schema.items.required = true;
        }
      }

      return schema;
    }
  }, {
    key: "getArraySchemaNoMerging",
    value: function getArraySchemaNoMerging(arr) {
      var schema = {
        type: 'array'
      };

      if (arr.length > 0) {
        schema.items = this.getSchema(arr[0]);
      }

      return schema;
    }
  }, {
    key: "getArraySchemaTuple",
    value: function getArraySchemaTuple(arr) {
      var _this3 = this;

      var schema = {
        type: 'array'
      };

      if (arr.length > 0) {
        schema.items = arr.map(function (item) {
          return _this3.getSchema(item);
        });
      }

      return schema;
    }
  }, {
    key: "getArraySchemaUniform",
    value: function getArraySchemaUniform(arr) {
      var schema = this.getArraySchemaNoMerging(arr);

      if (arr.length > 1) {
        for (var i = 1; i < arr.length; i++) {
          if (!isEqual(schema.items, this.getSchema(arr[i]))) {
            throw new Error('Invalid schema, incompatible array items');
          }
        }
      }

      return schema;
    }
  }, {
    key: "getArraySchema",
    value: function getArraySchema(arr) {
      if (arr.length === 0) {
        return {
          type: 'array'
        };
      }

      switch (this.options.arrays.mode) {
        case 'all':
          return this.getArraySchemaMerging(arr);

        case 'first':
          return this.getArraySchemaNoMerging(arr);

        case 'uniform':
          return this.getArraySchemaUniform(arr);

        case 'tuple':
          return this.getArraySchemaTuple(arr);

        default:
          throw new Error("Unknown array mode option '".concat(this.options.arrays.mode, "'"));
      }
    }
  }, {
    key: "getStringSchemaDefault",
    value: function getStringSchemaDefault(value) {
      var schema = {
        type: 'string'
      };

      if (!this.options.strings.detectFormat) {
        return schema;
      }

      var index = filteredFormats.findIndex(function (item) {
        return helpers.isFormat(value, item);
      });

      if (index >= 0) {
        schema.format = filteredFormats[index];
      }

      return schema;
    }
  }, {
    key: "getStringSchema",
    value: function getStringSchema(value) {
      if (this.options.strings.preProcessFnc) {
        return this.options.strings.preProcessFnc(value, this.getStringSchemaDefault);
      }

      return this.getStringSchemaDefault(value);
    }
  }, {
    key: "commmonPostProcessDefault",
    value: function commmonPostProcessDefault(type, schema, value) {
      // eslint-disable-line no-unused-vars
      if (this.options.required) {
        return merge({}, schema, {
          required: true
        });
      }

      return schema;
    }
  }, {
    key: "objectPostProcessDefault",
    value: function objectPostProcessDefault(schema, obj) {
      if (this.options.objects.additionalProperties === false && Object.getOwnPropertyNames(obj).length > 0) {
        return merge({}, schema, {
          additionalProperties: false
        });
      }

      return schema;
    }
    /**
     * Gets JSON schema for provided value
     * @param value
     * @returns {object}
     */

  }, {
    key: "getSchema",
    value: function getSchema(value) {
      var type = helpers.getType(value);

      if (!type) {
        throw new Error("Type of value couldn't be determined");
      }

      var schema;

      switch (type) {
        case 'object':
          schema = this.getObjectSchema(value);
          break;

        case 'array':
          schema = this.getArraySchema(value);
          break;

        case 'string':
          schema = this.getStringSchema(value);
          break;

        default:
          schema = {
            type: type
          };
      }

      if (this.options.postProcessFnc) {
        schema = this.options.postProcessFnc(type, schema, value, this.commmonPostProcessDefault);
      } else {
        schema = this.commmonPostProcessDefault(type, schema, value);
      }

      if (type === 'object') {
        if (this.options.objects.postProcessFnc) {
          schema = this.options.objects.postProcessFnc(schema, value, this.objectPostProcessDefault);
        } else {
          schema = this.objectPostProcessDefault(schema, value);
        }
      }

      return schema;
    }
  }]);

  return ToJsonSchema;
}();

function toJsonSchema(value, options) {
  var tjs = new ToJsonSchema(options);
  return tjs.getSchema(value);
}

module.exports = toJsonSchema;
},{"./helpers":272,"lodash.isequal":73,"lodash.merge":75}],274:[function(require,module,exports){
'use strict'; // content of this file is extracted from jsonschema source

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var types = {
  string: function testString(instance) {
    return typeof instance === 'string';
  },
  number: function testNumber(instance) {
    // isFinite returns false for NaN, Infinity, and -Infinity
    return typeof instance === 'number' && isFinite(instance); // eslint-disable-line no-restricted-globals
  },
  integer: function testInteger(instance) {
    return typeof instance === 'number' && instance % 1 === 0;
  },
  "boolean": function testBoolean(instance) {
    return typeof instance === 'boolean';
  },
  array: function testArray(instance) {
    return instance instanceof Array;
  },
  "null": function testNull(instance) {
    return instance === null;
  },
  date: function testDate(instance) {
    return instance instanceof Date;
  },
  any:
  /* istanbul ignore next: not using this but keeping it here for sake of completeness */
  function testAny(instance) {
    // eslint-disable-line no-unused-vars
    return true;
  },
  object: function testObject(instance) {
    return instance && _typeof(instance) === 'object' && !(instance instanceof Array) && !(instance instanceof Date);
  }
};
var FORMAT_REGEXPS = {
  'date-time': /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])[tT ](2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])(\.\d+)?([zZ]|[+-]([0-5][0-9]):(60|[0-5][0-9]))$/,
  date: /^\d{4}-(?:0[0-9]{1}|1[0-2]{1})-(3[01]|0[1-9]|[12][0-9])$/,
  time: /^(2[0-4]|[01][0-9]):([0-5][0-9]):(60|[0-5][0-9])$/,
  email: /^(?:[\w!#$%&'*+-/=?^`{|}~]+\.)*[\w!#$%&'*+-/=?^`{|}~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/,
  'ip-address': /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+-.]*:[^\s]*$/,
  color: /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/,
  // hostname regex from: http://stackoverflow.com/a/1420225/5628
  hostname: /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
  'host-name': /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/,
  alpha: /^[a-zA-Z]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  'utc-millisec': function utcMillisec(input) {
    return typeof input === 'string' && parseFloat(input) === parseInt(input, 10) && !isNaN(input);
  },
  // eslint-disable-line no-restricted-globals
  regex
  /* istanbul ignore next: not supporting regex right now */
  : function regex(input) {
    // eslint-disable-line space-before-function-paren
    var result = true;

    try {
      new RegExp(input); // eslint-disable-line no-new
    } catch (e) {
      result = false;
    }

    return result;
  },
  style: /\s*(.+?):\s*([^;]+);?/g,
  phone: /^\+(?:[0-9] ?){6,14}[0-9]$/
};
FORMAT_REGEXPS.regexp = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.pattern = FORMAT_REGEXPS.regex;
FORMAT_REGEXPS.ipv4 = FORMAT_REGEXPS['ip-address'];

var isFormat = function isFormat(input, format) {
  if (typeof input === 'string' && FORMAT_REGEXPS[format] !== undefined) {
    if (FORMAT_REGEXPS[format] instanceof RegExp) {
      return FORMAT_REGEXPS[format].test(input);
    }

    if (typeof FORMAT_REGEXPS[format] === 'function') {
      return FORMAT_REGEXPS[format](input);
    }
  }

  return true;
};

module.exports = {
  types: types,
  isFormat: isFormat,
  FORMAT_REGEXPS: FORMAT_REGEXPS
};
},{}]},{},[1]);
