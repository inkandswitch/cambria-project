import { deepClone } from 'fast-json-patch'
import { LensSource } from './lens-ops'
import { Patch } from './patch'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

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

      const objectProperties = getPropertiesForPath(schema, op.path)

      return [
        op,
        // fill in default values for each property on the object
        ...Object.entries(objectProperties).map(([propName, propSchema]) => {
          if (typeof propSchema !== 'object') throw new Error('expected object schema')
          const path = `${op.path}/${propName}`

          let value

          if (propSchema.hasOwnProperty('default')) {
            value = propSchema.default
          } else {
            if (typeof propSchema.type !== 'string')
              throw new Error('only support simple types, no arrays or undefined')
            value = defaultValuesByType[propSchema.type]
          }

          return { ...op, path, value }
        }),
      ]
    })
    .flat()
}

// given a json schema and a json path to an object field somewhere in that schema,
// return the json schema for the object being pointed to
function getPropertiesForPath(
  schema: JSONSchema7,
  path: string
): { [key: string]: JSONSchema7Definition } {
  const pathComponents = path.split('/').slice(1)
  const properties = pathComponents.reduce((schema: JSONSchema7, pathSegment: string) => {
    if (schema.type === 'object') {
      const schemaForProperty = schema.properties && schema.properties[pathSegment]
      if (typeof schemaForProperty !== 'object') throw new Error('Expected object')
      return schemaForProperty
    } else if (schema.type === 'array') {
      // throw away the array index, just return the schema for array items
      if (!schema.items || typeof schema.items !== 'object')
        throw new Error('Expected array items to have types')

      // todo: revisit this "as", was a huge pain to get this past TS
      return schema.items as JSONSchema7
    } else {
      throw new Error('Expected object or array in schema based on JSON Pointer')
    }
  }, schema).properties

  if (properties === undefined) return {}
  return properties
}
