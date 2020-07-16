import { compare, applyPatch, deepClone, MoveOperation } from 'fast-json-patch'
import { LensSource } from './lens-ops'
import { applyLensToPatch, Patch } from './patch'
import { reverseLens } from './reverse'

export type CompiledLens = (patch: Patch, targetDoc: any) => Patch

// Provide curried functions that incorporate the lenses internally;
// this is useful for exposing a pre-baked converter function to developers
// without them needing to access the lens themselves
// TODO: the public interface could just be runLens and reverseLens
// ... maybe also composeLens?
export function compile(lensSource: LensSource): { right: CompiledLens; left: CompiledLens } {
  return {
    right: (patch: Patch, targetDoc: any) => applyLensToPatch(lensSource, patch, targetDoc),
    left: (patch: Patch, targetDoc: any) =>
      applyLensToPatch(reverseLens(lensSource), patch, targetDoc),
  }
}

// utility function: converts a document (rather than a patch) through a lens
export function convertDoc(doc: any, lensSource: LensSource, baseDoc?: any) {
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

// XXX: ... do we want to keep this?
export const defaultValuesByType = {
  string: '',
  number: 0,
  boolean: false,
  array: [],
  object: {},
}

function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`)
}

// Given a lens, return a JSON patch that fills in any necessary default values
// related to applying that lens.
// Why does this use JSON patch?
export function defaultObjectForLens(lens: LensSource): any {
  return lens.reduce((acc, op) => {
    // todo: could some of this be shared with logic in schemaMigrations for manipulating
    // json schemas?
    switch (op.op) {
      case 'add':
        if (op.required !== false) {
          // do a copy to avoid accidentally sharing a mutable default value
          const defaultValue = deepClone(op.default || defaultValuesByType[op.type])
          return { ...acc, [op.destination]: defaultValue }
        }
        break
      case 'rename': {
        if (!Object.keys(acc).includes(op.source))
          // if we can't find the property on the existing default object,
          // that means we're renaming a property that wasn't added.
          // makes sense to throw in the arthropod case;
          // in the github demo case i'm ignoring this for the moment,
          // since we don't have a json schema for the github side,
          // but the better solution may be to have a json schema for the github side?
          // (or we can have a mode where we're lenient or strict here?)
          break
        // throw new Error(`Expected property on default object: ${op.source}`)
        const { [op.source]: fromValue, ...rest } = acc
        return { ...rest, [op.destination]: fromValue }
      }
      case 'convert':
        if (!op.destinationType) break // there was no type conversion
        return { ...acc, [op.destination]: deepClone(defaultValuesByType[op.destinationType]) }
      case 'remove': {
        const { [op.destination]: _discard, ...rest } = acc
        return { ...rest }
      }

      // todo: lots more cases to cover here!
      default:
        return acc

      // default:
      //   assertNever(op)
    }
    return acc
  }, {} as any)
}
