// helper functions for nicer syntax
// (we might write our own parser later, but at least for now
// this avoids seeing the raw json...)

import { JSONSchema7TypeName } from 'json-schema'
import {
  LensSource,
  LensMap,
  LensIn,
  Property,
  AddProperty,
  RemoveProperty,
  RenameProperty,
  HoistProperty,
  PlungeProperty,
  WrapProperty,
  HeadProperty,
  ValueMapping,
  ConvertValue,
} from './lens-ops'

export function addProperty(property: Property): AddProperty {
  return {
    op: 'add',
    ...property,
  }
}

export function removeProperty(property: Property): RemoveProperty {
  return {
    op: 'remove',
    ...property,
  }
}

export function renameProperty(source: string, destination: string): RenameProperty {
  return {
    op: 'rename',
    source,
    destination,
  }
}

export function hoistProperty(host: string, name: string): HoistProperty {
  return {
    op: 'hoist',
    host,
    name,
  }
}

export function plungeProperty(host: string, name: string): PlungeProperty {
  return {
    op: 'plunge',
    host,
    name,
  }
}

export function wrapProperty(name: string): WrapProperty {
  return {
    op: 'wrap',
    name,
  }
}

export function headProperty(name: string): HeadProperty {
  return {
    op: 'head',
    name,
  }
}

export function inside(name: string, lens: LensSource): LensIn {
  return {
    op: 'in',
    name,
    lens,
  }
}

export function map(lens: LensSource): LensMap {
  return {
    op: 'map',
    lens,
  }
}

export function convertValue(
  name: string,
  mapping: ValueMapping,
  sourceType?: JSONSchema7TypeName,
  destinationType?: JSONSchema7TypeName
): ConvertValue {
  return {
    op: 'convert',
    name,
    mapping,
    sourceType,
    destinationType,
  }
}
