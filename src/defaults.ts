import { deepClone } from 'fast-json-patch'
import { LensSource } from './lens-ops'

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
          return { ...acc, [op.name]: defaultValue }
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
        return { ...acc, [op.name]: deepClone(defaultValuesByType[op.destinationType]) }
      case 'remove': {
        const { [op.name]: _discard, ...rest } = acc
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
