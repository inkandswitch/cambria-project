import { JSONSchema7TypeName } from 'json-schema'

export interface Property {
  destination: string
  type: JSONSchema7TypeName
  default?: any
  required?: boolean
  arrayItemType?: JSONSchema7TypeName // todo: is this right?
}

export interface AddProperty extends Property {
  op: 'add'
}

export interface RemoveProperty extends Property {
  op: 'remove'
}

export interface RenameProperty {
  op: 'rename'
  source: string
  destination: string
}

export interface HoistProperty {
  op: 'hoist'
  destination: string
  host: string
}

export interface PlungeProperty {
  op: 'plunge'
  destination: string
  host: string
}
export interface WrapProperty {
  op: 'wrap'
  destination: string
}

export interface HeadProperty {
  op: 'head'
  destination: string
}

export interface LensIn {
  op: 'in'
  source: string
  lens: LensSource
}

export interface LensMap {
  op: 'map'
  lens: LensSource
}

// ideally this would be a tuple, but the typechecker
// wouldn't let me assign a flipped array in the reverse lens op
export type ValueMapping = { [key: string]: any }[]

// Notes on value conversion:
// - Types are optional, only needed if the type is actually changing
// - We only support hardcoded mappings for the time being;
//   can consider further conversions later
export interface ConvertValue {
  op: 'convert'
  destination: string
  mapping: ValueMapping
  sourceType?: JSONSchema7TypeName
  destinationType?: JSONSchema7TypeName
}

export type LensOp =
  | AddProperty
  | RemoveProperty
  | RenameProperty
  | HoistProperty
  | WrapProperty
  | HeadProperty
  | PlungeProperty
  | LensIn
  | LensMap
  | ConvertValue

export type LensSource = LensOp[]
