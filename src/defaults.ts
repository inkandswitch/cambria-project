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

// transforms a patch by injecting new operations that fill in default fields
export function addDefaultValues(patch: Patch, schema: JSONSchema7): Patch {
  return patch
    .map((op) => {
      const isMakeMap =
        (op.op === 'add' || op.op === 'replace') &&
        op.value !== null &&
        typeof op.value === 'object' &&
        Object.entries(op.value).length === 0

      if (!isMakeMap) return op

      const objectProperties = getPropertiesForPath(schema, op.path)

      return [
        op,
        // fill in default values for each property on the object
        ...Object.entries(objectProperties).map(([propName, propSchema]) => {
          if (typeof propSchema !== 'object') throw new Error(`Missing property ${propName}`)
          const path = `${op.path}/${propName}`

          // Fill in a default iff:
          // 1) it's an object or array: init to empty
          // 2) it's another type and there's a default value set.
          // TODO: is this right?
          // Should we allow defaulting containers to non-empty? seems like no.
          // Should we fill in "default defaults" like empty string?
          // I think better to let the json schema explicitly define defaults
          let defaultValue
          if (propSchema.type === 'object') {
            defaultValue = {}
          } else if (propSchema.type === 'array') {
            defaultValue = []
          } else if (propSchema.hasOwnProperty('default')) {
            defaultValue = propSchema.default
          }

          if (defaultValue !== undefined) {
            // todo: this is a TS hint, see if we can remove
            if (op.op !== 'add' && op.op !== 'replace') throw new Error('')
            return addDefaultValues([{ ...op, path, value: defaultValue }], schema)
          } else {
            return []
          }
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
