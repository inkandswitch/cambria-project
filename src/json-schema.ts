import { JSONSchema7 } from 'json-schema'
import { defaultValuesByType } from './cloudina'
import { Property, LensSource, ConvertValue } from './lens-ops'

// add a property to a schema
// note: property names are in json pointer with leading /
// (because that's how our Property types work for now)

// mutates the schema that is passed in
// (should switch to a more functional style)
function addProperty(schema: JSONSchema7, property: Property) {
  const { properties: origProperties = {}, required: origRequired = [] } = schema
  const { destination, type, arrayItemType, required: isPropertyRequired } = property

  const arraylessPropertyDefinition = {
    type,
    default: property.default || defaultValuesByType[type], // default is a reserved keyword
  }
  // this is kludgey but you should see the crazy syntax for the alternative
  const propertyDefinition =
    type === 'array' && arrayItemType
      ? {
          ...arraylessPropertyDefinition,
          items: { type: arrayItemType },
        }
      : arraylessPropertyDefinition

  const properties = { ...origProperties, [destination]: propertyDefinition }
  const shouldAdd = isPropertyRequired !== false && !origRequired.includes(destination)
  const required = [...origRequired, ...(shouldAdd ? [destination] : [])]
  return {
    ...schema,
    properties,
    required,
  }
}

function renameProperty(schema: JSONSchema7, from: string, to: string): JSONSchema7 {
  const { properties = {}, required = [] } = schema // extract properties with default of empty
  const { [from]: propDetails, ...rest } = properties // pull out the old value

  return {
    ...schema,
    properties: { [to]: propDetails, ...rest },
    required: [...required.filter((r) => r !== from), to],
  } // assign it to the new one
}

// remove a property from a schema
// property name is _not_ in JSON Pointer, no leading slash here.
// (yes, that's inconsistent with addPropertyToSchema, which is bad)
function removeProperty(schema: JSONSchema7, removedPointer: string): JSONSchema7 {
  const { properties = {}, required = [] } = schema
  const removed = removedPointer
  // we don't care about the `discarded` variable...
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [removed]: discarded, ...rest } = properties
  return { ...schema, properties: rest, required: required.filter((e) => e !== removed) }
}

function inSchema(schema: JSONSchema7, name: string, lens: LensSource) {
  const { properties = {} } = schema
  return {
    ...schema,
    properties: {
      ...properties,
      // XXX: This cast is WRONGBAD, remove it and figure out why we needed it
      [name]: updateSchema(properties[name] as JSONSchema7, lens),
    },
  }
}

function hoistProperty(schema: JSONSchema7, host: string, destination: string) {
  const { properties = {} } = schema

  const sourceSchema = properties[host] || {}
  // we can throw an error here if things are missing?
  if (sourceSchema === true || sourceSchema.properties === undefined) {
    // errrr... complain?
    return schema
  }
  const destinationProperties = sourceSchema.properties[destination] || {}

  if (destinationProperties === true) {
    // this is bad too?
    return schema
  }

  // add the property to the root schema
  schema = addProperty(schema, {
    ...(destinationProperties as Property),
    destination, // bleh, adding the / here is bad...
  })

  // remove it from its current parent
  // PS: ugh
  schema = inSchema(schema, host, [{ op: 'remove', destination, type: 'null' }])

  return schema
}

function plungeProperty(schema: JSONSchema7, host: string, destination: string) {
  // XXXX what should we do for missing child properties? error?
  const { properties = {} } = schema

  const destinationTypeProperties = properties[destination] || {}
  // we can throw an error here if things are missing?
  if (destinationTypeProperties === true) {
    // errrr... complain?
    return schema
  }

  // add the property to the root schema
  schema = inSchema(schema, host, [
    {
      op: 'add',
      ...(destinationTypeProperties as Property),
      destination,
    },
  ])

  // remove it from its current parent
  // PS: ugh
  schema = removeProperty(schema, destination)

  return schema
}

function convertValue(schema: JSONSchema7, lensOp: ConvertValue) {
  // if there's no type conversion, nothing to do on the schema
  if (!lensOp.destinationType) return schema

  return {
    ...schema,
    properties: {
      ...schema.properties,
      [lensOp.destination]: {
        type: lensOp.destinationType,
        default: defaultValuesByType[lensOp.destinationType],
      },
    },
  }
}

function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`)
}

export function updateSchema(schema: JSONSchema7, lens: LensSource): JSONSchema7 {
  // todo: we iterate over lens ops and mutate the schema;
  // should change to reduce over the lens ops and treat schema as immutable
  lens.forEach((op) => {
    switch (op.op) {
      case 'add': {
        schema = addProperty(schema, op)
        break
      }
      case 'remove': {
        schema = removeProperty(schema, op.destination)
        break
      }

      case 'rename': {
        schema = renameProperty(schema, op.source, op.destination)
        break
      }

      case 'in':
        schema = inSchema(schema, op.source, op.lens)
        break

      case 'map':
        // recursively update the items schema with the provided lens
        schema.items = updateSchema(schema.items, op.lens)
        break

      case 'wrap':
        // create an array property, stuff the existing schema info inside the array type
        schema = addProperty(schema, {
          destination: op.destination,
          type: 'array',

          // todo: I think arrayItemType needs to take more than a string,
          // it probably needs to take a recursive schema arg of some kind?
          // seems like this will not work if array items are obbjects
          arrayItemType: schema.properties[op.destination].type,
        })

        break

      case 'head':
        schema = addProperty(schema, {
          destination: op.destination,
          ...schema.properties[op.destination].items,
        })
        break

      case 'hoist':
        schema = hoistProperty(schema, op.host, op.destination)
        break

      case 'plunge':
        schema = plungeProperty(schema, op.host, op.destination)
        break

      case 'convert':
        schema = convertValue(schema, op)
        break

      default:
        assertNever(op) // exhaustiveness check
    }
  })

  return schema
}
