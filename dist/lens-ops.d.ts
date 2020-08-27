import { JSONSchema7TypeName } from 'json-schema';
export interface Property {
    name?: string;
    type: JSONSchema7TypeName | JSONSchema7TypeName[];
    default?: any;
    required?: boolean;
    items?: Property;
}
export interface AddProperty extends Property {
    op: 'add';
}
export interface RemoveProperty extends Property {
    op: 'remove';
}
export interface RenameProperty {
    op: 'rename';
    source: string;
    destination: string;
}
export interface HoistProperty {
    op: 'hoist';
    name: string;
    host: string;
}
export interface PlungeProperty {
    op: 'plunge';
    name: string;
    host: string;
}
export interface WrapProperty {
    op: 'wrap';
    name: string;
}
export interface HeadProperty {
    op: 'head';
    name: string;
}
export interface LensIn {
    op: 'in';
    name: string;
    lens: LensSource;
}
export interface LensMap {
    op: 'map';
    lens: LensSource;
}
export declare type ValueMapping = {
    [key: string]: any;
}[];
export interface ConvertValue {
    op: 'convert';
    name: string;
    mapping: ValueMapping;
    sourceType?: JSONSchema7TypeName;
    destinationType?: JSONSchema7TypeName;
}
export declare type LensOp = AddProperty | RemoveProperty | RenameProperty | HoistProperty | WrapProperty | HeadProperty | PlungeProperty | LensIn | LensMap | ConvertValue;
export declare type LensSource = LensOp[];
