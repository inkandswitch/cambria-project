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

export function hoistProperty(host: string, destination: string): HoistProperty {
  return {
    op: 'hoist',
    host,
    destination,
  }
}

export function plungeProperty(host: string, destination: string): PlungeProperty {
  return {
    op: 'plunge',
    host,
    destination,
  }
}

export function wrapProperty(destination: string): WrapProperty {
  return {
    op: 'wrap',
    destination,
  }
}

export function headProperty(destination: string): HeadProperty {
  return {
    op: 'head',
    destination,
  }
}

export function inside(source: string, lens: LensSource): LensIn {
  return {
    op: 'in',
    source,
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
  destination: string,
  mapping: ValueMapping,
  sourceType?: JSONSchema7TypeName,
  destinationType?: JSONSchema7TypeName
): ConvertValue {
  return {
    op: 'convert',
    destination,
    mapping,
    sourceType,
    destinationType,
  }
}
