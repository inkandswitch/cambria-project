import { compare, applyPatch } from 'fast-json-patch'
import { LensSource } from './lens-ops'
import { applyLensToPatch, Patch } from './patch'
import { reverseLens } from './reverse'
import { defaultObjectForLens } from './defaults'
import { updateSchema } from './json-schema'

export type CompiledLens = (patch: Patch, targetDoc: any) => Patch

// Provide curried functions that incorporate the lenses internally;
// this is useful for exposing a pre-baked converter function to developers
// without them needing to access the lens themselves
// TODO: the public interface could just be runLens and reverseLens
// ... maybe also composeLens?
function compile(lensSource: LensSource): { right: CompiledLens; left: CompiledLens } {
  return {
    right: (patch: Patch, targetDoc: any) => applyLensToPatch(lensSource, patch, targetDoc),
    left: (patch: Patch, targetDoc: any) =>
      applyLensToPatch(reverseLens(lensSource), patch, targetDoc),
  }
}

// utility function: converts a document (rather than a patch) through a lens
function convertDoc(doc: any, lensSource: LensSource, baseDoc?: any) {
  // build up a patch that creates the document
  const patchForOriginalDoc = compare({}, doc)

  // convert the patch through the lens
  const convertedPatch = applyLensToPatch(lensSource, patchForOriginalDoc, {})

  // construct the "base" upon which we will apply the patches from doc.
  // it's a combination of default fields for the lens,
  // and an existing "base doc" which we merge the converted doc into.
  // base doc is helpful in cases where, for example, doc doesn't have all the fields in the
  // target schema, so baseDoc needs to define those missing fields.
  const base = Object.assign(defaultObjectForLens(lensSource), baseDoc || {})

  // return a doc based on the converted patch.
  // (start with either a specified baseDoc, or just empty doc)
  return applyPatch(base, convertedPatch).newDocument
}

module.exports = {
  compile,
  convertDoc,
  updateSchema,
}
