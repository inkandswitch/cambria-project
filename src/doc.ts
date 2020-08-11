import { JSONSchema7 } from 'json-schema'
import { compare, applyPatch } from 'fast-json-patch'
import GenerateSchema from 'generate-schema'

import { defaultObjectForSchema } from './defaults'
import { Patch, applyLensToPatch } from './patch'
import { LensSource } from './lens-ops'
import { updateSchema } from './json-schema'

export function importDoc(inputDoc: any): [JSONSchema7, Patch] {
  const schema = GenerateSchema.json(inputDoc) as JSONSchema7
  const patch = compare({}, inputDoc)

  return [schema, patch]
}

// utility function: converts a document (rather than a patch) through a lens
export function applyLensToDoc(
  lensSource: LensSource,
  inputDoc: any,
  inputSchema?: JSONSchema7,
  targetDoc?: any
) {
  const [impliedSchema, patchForOriginalDoc] = importDoc(inputDoc)

  if (inputSchema === undefined || inputSchema === null) {
    inputSchema = impliedSchema
  }

  // construct the "base" upon which we will apply the patches from doc.
  // We start with the default object for the output schema,
  // then we add in any existing fields on the target doc.
  // TODO: I think we need to deep merge here, can't just shallow merge?
  const outputSchema = updateSchema(inputSchema, lensSource)
  const base = Object.assign(defaultObjectForSchema(outputSchema), targetDoc || {})

  // return a doc based on the converted patch.
  // (start with either a specified baseDoc, or just empty doc)
  // convert the patch through the lens
  const outputPatch = applyLensToPatch(lensSource, patchForOriginalDoc, inputSchema)
  return applyPatch(base, outputPatch).newDocument
}
