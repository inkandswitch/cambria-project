import { JSONSchema7 } from 'json-schema';
import { Patch } from './patch';
import { LensSource } from './lens-ops';
/**
 * importDoc - convert any Plain Old Javascript Object into an implied JSON Schema and
 *             a JSON Patch that sets every value in that document.
 * @param inputDoc a document to convert into a big JSON patch describing its full contents
 */
export declare function importDoc(inputDoc: any): [JSONSchema7, Patch];
/**
 * applyLensToDoc - converts a full document through a lens.
 * Under the hood, we convert your input doc into a big patch and the apply it to the targetDoc.
 * This allows merging data back and forth with other omitted values.
 * @property lensSource: the lens specification to apply to the document
 * @property inputDoc: the Plain Old Javascript Object to convert
 * @property inputSchema: (default: inferred from inputDoc) a JSON schema defining the input
 * @property targetDoc: (default: {}) a document to apply the contents of this document to as a patch
 */
export declare function applyLensToDoc(lensSource: LensSource, inputDoc: any, inputSchema?: JSONSchema7, targetDoc?: any): any;
