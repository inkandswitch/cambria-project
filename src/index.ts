// TODO: The exported surface is fairly large right now,
// See how much we can narrow this.

export { updateSchema, schemaForLens } from './json-schema'
export { compile, applyLensToPatch, Patch, CompiledLens } from './patch'
export { applyLensToDoc, importDoc } from './doc'
export { LensSource, LensOp, Property } from './lens-ops'
export { defaultObjectForSchema } from './defaults'
export { reverseLens } from './reverse'
export { LensGraph, initLensGraph, registerLens, lensGraphSchema, lensFromTo } from './lens-graph'

export {
  addProperty,
  removeProperty,
  renameProperty,
  hoistProperty,
  plungeProperty,
  wrapProperty,
  headProperty,
  inside,
  map,
  convertValue,
} from './helpers'

export { loadYamlLens } from './lens-loader'
