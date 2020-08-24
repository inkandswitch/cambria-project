/* eslint-disable no-use-before-define */
import { JSONSchema7, JSONSchema7Definition, JSONSchema7TypeName } from 'json-schema'
import { inspect } from 'util'
import { defaultValuesByType } from './defaults'
import {
  Property,
  LensSource,
  ConvertValue,
  LensOp,
  HeadProperty,
  WrapProperty,
  LensIn,
} from './lens-ops'

export const emptySchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  type: 'object' as const,
  additionalProperties: false,
}

function deepInspect(object: any) {
  return inspect(object, false, null, true)
}

// add a property to a schema
// note: property names are in json pointer with leading /
// (because that's how our Property types work for now)

// mutates the schema that is passed in
// (should switch to a more functional style)
function addProperty(schema: JSONSchema7, property: Property): JSONSchema7 {
  const { properties: origProperties = {}, required: origRequired = [] } = schema
  const { name, items, required: isPropertyRequired } = property
  let { type } = property

  if (!name || !type) {
    throw new Error(`Missing property name in addProperty.\nFound:\n${JSON.stringify(property)}`)
  }

  if (Array.isArray(type)) {
    type = type.map((t) => (t === null ? 'null' : t))
  }

  const arraylessPropertyDefinition = {
    type,
    default: property.default || defaultValuesByType(type), // default is a reserved keyword
  }
  // this is kludgey but you should see the crazy syntax for the alternative
  const propertyDefinition =
    type === 'array' && items
      ? {
          ...arraylessPropertyDefinition,
          items: { type: items.type, default: items.default },
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
  if (typeof schema !== 'object' || typeof schema.properties !== 'object') {
    throw new Error(`expected schema object, got ${JSON.stringify(schema)}`)
  }
  if (!from) {
    throw new Error("Rename property requires a 'source' to rename.")
  }
  if (!schema.properties[from]) {
    throw new Error(
      `Cannot rename property '${from}' because it does not exist among ${Object.keys(
        schema.properties
      )}.`
    )
  }
  if (!to) {
    throw new Error(`Need a 'destination' to rename ${from} to.`)
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

function schemaSupportsType(
  typeValue: JSONSchema7TypeName | JSONSchema7TypeName[] | undefined,
  type: JSONSchema7TypeName
): boolean {
  if (!typeValue) {
    return false
  }
  if (!Array.isArray(typeValue)) {
    typeValue = [typeValue]
  }

  return typeValue.includes(type)
}

/** db
 * removes the horrible, obnoxious, and annoying case where JSON schemas can just be
 * "true" or "false" meaning the below definitions and screwing up my type checker
 */
function db(s: JSONSchema7Definition): JSONSchema7 {
  if (s === true) {
    return {}
  }
  if (s === false) {
    return { not: {} }
  }
  return s
}

function supportsNull(schema: JSONSchema7): boolean {
  return (
    schemaSupportsType(schema.type, 'null') ||
    !!schema.anyOf?.some((subSchema) => schemaSupportsType(db(subSchema).type, 'null'))
  )
}

function findHost(schema: JSONSchema7, name: string): JSONSchema7 {
  if (schema.anyOf) {
    console.log('anyof')
    const maybeSchema = schema.anyOf?.find((t) => typeof t === 'object' && t.properties)
    if (typeof maybeSchema === 'object' && typeof maybeSchema.properties === 'object') {
      const maybeHost = maybeSchema.properties[name]
      console.log('maybe', maybeHost)
      if (maybeHost !== false && maybeHost !== true) {
        return maybeHost
      }
    }
  } else if (schema.properties && schema.properties[name]) {
    const maybeHost = schema.properties[name]
    if (maybeHost !== false && maybeHost !== true) {
      return maybeHost
    }
  }
  throw new Error("Coudln't find the host for this data.")
}

function inSchema(schema: JSONSchema7, op: LensIn): JSONSchema7 {
  const properties: JSONSchema7 = schema.properties
    ? schema.properties
    : (schema.anyOf?.find((t) => typeof t === 'object' && t.properties) as any).properties

  if (!properties) {
    throw new Error("Cannot look 'in' an object that doesn't have properties.")
  }

  const { name, lens } = op

  if (!name) {
    throw new Error(`Expected to find property ${name} in ${Object.keys(op || {})}`)
  }

  const host = findHost(schema, name)

  console.log('HOST IS', deepInspect(host))

  if (host === undefined) {
    throw new Error(`Expected to find property ${name} in ${Object.keys(properties || {})}`)
  }

  const newProperties: JSONSchema7 = {
    ...properties,
    [name]: updateSchema(host, lens),
  }

  return {
    ...schema,
    properties: newProperties,
  } as JSONSchema7
}

type JSONSchema7Items = boolean | JSONSchema7 | JSONSchema7Definition[] | undefined
function validateSchemaItems(items: JSONSchema7Items) {
  if (Array.isArray(items)) {
    throw new Error('Cambria only supports consistent types for arrays.')
  }
  if (!items || items === true) {
    throw new Error(`Cambria requires a specific items definition, found ${items}.`)
  }
  return items
}

function mapSchema(schema: JSONSchema7, lens: LensSource) {
  if (!lens) {
    throw new Error('Map requires a `lens` to map over the array.')
  }
  if (!schema.items) {
    throw new Error(`Map requires a schema with items to map over, ${deepInspect(schema)}`)
  }
  return { ...schema, items: updateSchema(validateSchemaItems(schema.items), lens) }
}

function filterScalarOrArray<T>(v: T | T[], cb: (t: T) => boolean) {
  if (!Array.isArray(v)) {
    v = [v]
  }
  v = v.filter(cb)
  if (v.length === 1) {
    return v[0]
  }
  return v
}

function removeNullSupport(prop: JSONSchema7): JSONSchema7 | null {
  if (!supportsNull(prop)) {
    return prop
  }
  if (prop.type) {
    if (prop.type === 'null') {
      return null
    }

    prop = { ...prop, type: filterScalarOrArray(prop.type, (t) => t === 'null') }
  }
  if (prop.anyOf) {
    const newAnyOf = prop.anyOf.reduce((acc: JSONSchema7[], s) => {
      const clean = removeNullSupport(db(s))
      return clean ? [...acc, clean] : acc
    }, [])
    if (newAnyOf.length === 1) {
      return newAnyOf[0]
    }
    prop = { ...prop, anyOf: newAnyOf }
  }
  return prop
}

function wrapProperty(schema: JSONSchema7, op: WrapProperty): JSONSchema7 {
  if (!op.name) {
    throw new Error('Wrap property requires a `name` to identify what to wrap.')
  }

  if (!schema.properties) {
    throw new Error('Cannot wrap a property here. There are no properties.')
  }

  const prop = db(schema.properties[op.name])
  if (!prop) {
    throw new Error(`Cannot wrap property '${op.name}' because it does not exist.`)
  }

  if (!supportsNull(prop)) {
    throw new Error(`Cannot wrap property '${op.name}' because it does not allow nulls.`)
  }

  return {
    ...schema,
    properties: {
      ...schema.properties,
      [op.name]: {
        type: 'array',
        items: removeNullSupport(prop) || { not: {} },
      },
    },
  }
}

function headProperty(schema, op: HeadProperty) {
  if (!op.name) {
    throw new Error('Head requires a `name` to identify what to take head from.')
  }
  if (!schema.properties[op.name]) {
    throw new Error(`Cannot head property '${op.name}' because it does not exist.`)
  }

  return {
    ...schema,
    properties: {
      ...schema.properties,
      [op.name]: { anyOf: [{ type: 'null' }, schema.properties[op.name].items] },
    },
  }
}

function hoistProperty(schema: JSONSchema7, host: string, name: string) {
  if (schema.properties === undefined) {
    throw new Error(`Can't hoist when root schema isn't an object`)
  }

  const hostSchema = schema.properties[host]

  if (!host) {
    throw new Error(`Need a \`host\` property to hoist from.`)
  }

  if (hostSchema === undefined) {
    throw new Error(`Can't hoist out of nonexistent host property: ${host}`)
  }
  if (!name) {
    throw new Error(`Need to provide a \`name\` to hoist up`)
  }

  if (
    typeof hostSchema === 'boolean' ||
    hostSchema === undefined ||
    hostSchema.properties === undefined ||
    hostSchema.properties[name] === undefined
  ) {
    throw new Error(`Can't hoist nonexistent property: ${host}/${name}`)
  }

  const { properties = {} } = schema

  if (!properties.hasOwnProperty(host)) throw new Error(`Missing property to hoist: ${host}`)
  const sourceSchema = properties[host] || {}

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
  schema = {
    ...schema,
    properties: {
      ...schema.properties,
      [name]: sourceSchema.properties[name],
    },
  }

  // remove it from its current parent
  // PS: ugh

  schema = inSchema(schema, { op: 'in', name: host, lens: [{ op: 'remove', name, type: 'null' }] })

  return schema
}

function plungeProperty(schema: JSONSchema7, host: string, name: string) {
  // XXXX what should we do for missing child properties? error?
  const { properties = {} } = schema

  if (!host) {
    throw new Error(`Need a \`host\` property to plunge into`)
  }

  if (!name) {
    throw new Error(`Need to provide a \`name\` to plunge`)
  }

  const destinationTypeProperties = properties[name]

  if (!destinationTypeProperties) {
    throw new Error(`Could not find a property called ${name} among ${Object.keys(properties)}`)
  }

  // we can throw an error here if things are missing?
  if (destinationTypeProperties === true) {
    // errrr... complain?
    return schema
  }

  // add the property to the root schema
  schema = inSchema(schema, {
    op: 'in',
    name: host,
    lens: [
      {
        op: 'add',
        ...(destinationTypeProperties as Property),
        name,
      },
    ],
  })

  // remove it from its current parent
  // PS: ugh
  schema = removeProperty(schema, name)

  return schema
}

function convertValue(schema: JSONSchema7, lensOp: ConvertValue) {
  const { name, destinationType, mapping } = lensOp
  if (!destinationType) {
    return schema
  }
  if (!name) {
    throw new Error(`Missing property name in 'convert'.\nFound:\n${JSON.stringify(lensOp)}`)
  }
  if (!mapping) {
    throw new Error(`Missing mapping for 'convert'.\nFound:\n${JSON.stringify(lensOp)}`)
  }

  return {
    ...schema,
    properties: {
      ...schema.properties,
      [name]: {
        type: destinationType,
        default: defaultValuesByType(destinationType),
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
      return inSchema(schema, op)
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
      return null
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
