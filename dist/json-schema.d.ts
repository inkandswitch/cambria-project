import { JSONSchema7 } from 'json-schema';
import { LensSource } from './lens-ops';
export declare const emptySchema: {
    $schema: string;
    type: "object";
    additionalProperties: boolean;
};
export declare function updateSchema(schema: JSONSchema7, lens: LensSource): JSONSchema7;
export declare function schemaForLens(lens: LensSource): JSONSchema7;
