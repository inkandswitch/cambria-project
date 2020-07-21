import { deepClone, applyPatch } from 'fast-json-patch'
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

// Return a recursively filled-in default object for a given schema
export function defaultObjectForSchema(schema: JSONSchema7) {
  // By setting the root to empty object,
  // we kick off a recursive process that fills in the entire thing
  const initializeRootPatch = [
    {
      op: 'add' as const,
      path: '',
      value: {},
    },
  ]
  const defaultsPatch = addDefaultValues(initializeRootPatch, schema)

  return applyPatch({}, defaultsPatch).newDocument
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

            // TODO: actually, seems like we shouldn't do this --
            // we should only fill in defaults if they are in the json schema.
            // (should we also only fill in for required fields?)
            value = defaultValuesByType[propSchema.type]
          }

          // todo: how can we remove this type assertion?
          // we already know this at this point, but typescript forgets it.
          if (op.op !== 'add' && op.op !== 'replace') throw new Error('')
          return addDefaultValues([{ ...op, path, value }], schema)
        }),
      ].flat(Infinity)
    })
    .flat(Infinity) as Patch
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
