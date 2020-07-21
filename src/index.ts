// TODO: The exported surface is fairly large right now,
// partially because schema graph traversal still lives outside in Chitin.
// See how much we can narrow this.

export { updateSchema } from './json-schema'
export { compile, convertDoc, applyLensToPatch, Patch, CompiledLens } from './patch'
export { LensSource, LensOp, Property } from './lens-ops'
export { defaultObjectForSchema } from './defaults'
export { reverseLens } from './reverse'

// TODO: delete js syntax, remove these
export { addProperty, renameProperty, convertValue } from './helpers'
