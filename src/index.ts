// TODO: The exported surface is fairly large right now,
// See how much we can narrow this.

export { updateSchema, schemaForLens } from './json-schema'
export { compile, applyLensToDoc, applyLensToPatch, Patch, CompiledLens } from './patch'
export { LensSource, LensOp, Property } from './lens-ops'
export { defaultObjectForSchema } from './defaults'
export { reverseLens } from './reverse'
export { LensGraph, initLensGraph, registerLens, lensGraphSchema, lensFromTo } from './lens-graph'

// TODO: delete js syntax, remove these
export { addProperty, renameProperty, convertValue } from './helpers'

export { loadYamlLens } from './lens-loader'
