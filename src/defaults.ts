import { deepClone } from 'fast-json-patch'
import { LensSource } from './lens-ops'
import { Patch } from './patch'
import { JSONSchema7 } from 'json-schema'

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
// todo: this is outdated, should be changed to use addDefaultValues
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

export function addDefaultValues(patch: Patch, schema: JSONSchema7): Patch {
  return patch
    .map((op) => {
      const isMakeMap =
        (op.op === 'add' || op.op === 'replace') &&
        typeof op.value === 'object' &&
        Object.entries(op.value).length === 0

      if (!isMakeMap) return op

      return [
        op,
        // fill in default values for each property on the object
        ...Object.entries(getPropertiesForPath(schema, op.path)).map(([propName, propSchema]) => {
          const path = `${op.path}/${propName}`
          const value = propSchema.hasOwnProperty('default')
            ? propSchema.default
            : defaultValuesByType[propSchema.type]

          return { ...op, path, value }
        }),
      ]
    })
    .flat()
}

// given a json schema and a json path to an object field somewhere in that schema,
// return the json schema for the object being pointed to
function getPropertiesForPath(schema: JSONSchema7, path: string): JSONSchema7 {
  const pathComponents = path.split('/').slice(1)
  return pathComponents.reduce((schema, pathSegment) => {
    if (schema.type === 'object') {
      return schema[pathSegment]
    } else if (schema.type === 'array') {
      // throw away the array index, just return the schema for array items
      return schema.items
    } else {
      throw new Error('Expected object or array in schema based on JSON Pointer')
    }
  }, schema)
}
