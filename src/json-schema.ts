import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { defaultValuesByType } from './defaults'
import {
  Property,
  LensSource,
  ConvertValue,
  LensOp,
  AddProperty,
  HeadProperty,
  WrapProperty,
} from './lens-ops'

// add a property to a schema
// note: property names are in json pointer with leading /
// (because that's how our Property types work for now)

// mutates the schema that is passed in
// (should switch to a more functional style)
function addProperty(schema: JSONSchema7, property: Property) {
  const { properties: origProperties = {}, required: origRequired = [] } = schema
  const { name, type, arrayItemType, required: isPropertyRequired } = property

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

  const properties = { ...origProperties, [name]: propertyDefinition }
  const shouldAdd = isPropertyRequired !== false && !origRequired.includes(name)
  const required = [...origRequired, ...(shouldAdd ? [name] : [])]
  return {
    ...schema,
    properties,
    required,
  }
}

function renameProperty(schema: JSONSchema7, from: string, to: string): JSONSchema7 {
  if (typeof schema !== 'object') {
    throw new Error('expected schema object')
  }
  const { properties = {}, required = [] } = schema // extract properties with default of empty
  const { [from]: propDetails, ...rest } = properties // pull out the old value

  if (propDetails === undefined) {
    throw new Error(`Rename error: missing expected property ${from}`)
  }

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

  if (!properties.hasOwnProperty(removed)) {
    throw new Error(`Attempting to remove nonexistent property: ${removed}`)
  }

  const { [removed]: discarded, ...rest } = properties

  return {
    ...schema,
    properties: rest,
    required: required.filter((e) => e !== removed),
  }
}

function inSchema(schema: JSONSchema7, name: string, lens: LensSource) {
  const { properties = {} } = schema

  const host = properties[name] as JSONSchema7

  if (host === undefined) {
    throw new Error(`Expected to find property ${name} in ${Object.keys(schema.properties || {})}`)
  }

  return {
    ...schema,
    properties: {
      ...properties,
      // XXX: This cast is WRONGBAD, remove it and figure out why we needed it
      [name]: updateSchema(host, lens),
    },
  }
}

type JSONSchema7Items = boolean | JSONSchema7 | JSONSchema7Definition[] | undefined
function validateSchemaItems(items: JSONSchema7Items) {
  if (Array.isArray(items)) {
    throw new Error('Cloudina only supports consistent types for arrays.')
  }
  if (!items || items === true) {
    throw new Error('Cloudina requires a specific items definition.')
  }
  return items
}

function mapSchema(schema: JSONSchema7, lens: LensSource) {
  return { ...schema, items: updateSchema(validateSchemaItems(schema.items), lens) }
}

function wrapProperty(schema, op: WrapProperty) {
  // create an array property, stuff the existing schema info inside the array type
  return addProperty(schema, {
    name: op.name,
    type: 'array',

    // todo: I think arrayItemType needs to take more than a string,
    // it probably needs to take a recursive schema arg of some kind?
    // seems like this will not work if array items are obbjects
    arrayItemType: schema.properties[op.name].type,
  })
}

function headProperty(schema, op: HeadProperty) {
  return {
    ...schema,
    properties: {
      ...schema.properties,
      [op.name]: schema.properties[op.name].items,
    },
  }
}

function hoistProperty(schema: JSONSchema7, host: string, name: string) {
  const { properties = {} } = schema

  const sourceSchema = properties[host] || {}
  // we can throw an error here if things are missing?
  if (sourceSchema === true || sourceSchema.properties === undefined) {
    // errrr... complain?
    return schema
  }
  const destinationProperties = sourceSchema.properties[name] || {}

  if (destinationProperties === true) {
    // this is bad too?
    return schema
  }

  // add the property to the root schema
  schema = addProperty(schema, {
    ...(destinationProperties as Property),
    name, // bleh, adding the / here is bad...
  })

  // remove it from its current parent
  // PS: ugh
  schema = inSchema(schema, host, [{ op: 'remove', name, type: 'null' }])

  return schema
}

function plungeProperty(schema: JSONSchema7, host: string, name: string) {
  // XXXX what should we do for missing child properties? error?
  const { properties = {} } = schema

  const destinationTypeProperties = properties[name] || {}
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
      name,
    },
  ])

  // remove it from its current parent
  // PS: ugh
  schema = removeProperty(schema, name)

  return schema
}

function convertValue(schema: JSONSchema7, lensOp: ConvertValue) {
  // if there's no type conversion, nothing to do on the schema
  if (!lensOp.destinationType) return schema

  return {
    ...schema,
    properties: {
      ...schema.properties,
      [lensOp.name]: {
        type: lensOp.destinationType,
        default: defaultValuesByType[lensOp.destinationType],
      },
    },
  }
}

function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`)
}

function applyLensOperation(schema: JSONSchema7, op: LensOp) {
  switch (op.op) {
    case 'add':
      return addProperty(schema, op)
    case 'remove':
      return removeProperty(schema, op.name)
    case 'rename':
      return renameProperty(schema, op.source, op.destination)
    case 'in':
      return inSchema(schema, op.name, op.lens)
    case 'map':
      return mapSchema(schema, op.lens)
    case 'wrap':
      return wrapProperty(schema, op)
    case 'head':
      return headProperty(schema, op)
    case 'hoist':
      return hoistProperty(schema, op.host, op.name)
    case 'plunge':
      return plungeProperty(schema, op.host, op.name)
    case 'convert':
      return convertValue(schema, op)

    default:
      assertNever(op) // exhaustiveness check
  }
}
export function updateSchema(schema: JSONSchema7, lens: LensSource): JSONSchema7 {
  return lens.reduce<JSONSchema7>((schema: JSONSchema7, op: LensOp) => {
    if (schema === undefined) throw new Error("Can't update undefined schema")
    return applyLensOperation(schema, op)
  }, schema as JSONSchema7)
}

export function schemaForLens(lens: LensSource) {
  const emptySchema = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object' as const,
    additionalProperties: false,
  }

  return updateSchema(emptySchema, lens)
}
