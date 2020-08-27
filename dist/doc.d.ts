import { JSONSchema7 } from 'json-schema';
import { Patch } from './patch';
import { LensSource } from './lens-ops';
export declare function importDoc(inputDoc: any): [JSONSchema7, Patch];
export declare function applyLensToDoc(lensSource: LensSource, inputDoc: any, inputSchema?: JSONSchema7, targetDoc?: any): any;
