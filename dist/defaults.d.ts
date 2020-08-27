import { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import { Patch } from './patch';
export declare function defaultValuesByType(type: JSONSchema7TypeName | JSONSchema7TypeName[]): JSONSchema7['default'];
export declare function defaultObjectForSchema(schema: JSONSchema7): JSONSchema7;
export declare function addDefaultValues(patch: Patch, schema: JSONSchema7): Patch;
