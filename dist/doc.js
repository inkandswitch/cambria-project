"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyLensToDoc = exports.importDoc = void 0;
const fast_json_patch_1 = require("fast-json-patch");
const to_json_schema_1 = __importDefault(require("to-json-schema"));
const defaults_1 = require("./defaults");
const patch_1 = require("./patch");
const json_schema_1 = require("./json-schema");
/**
 * importDoc - convert any Plain Old Javascript Object into an implied JSON Schema and
 *             a JSON Patch that sets every value in that document.
 * @param inputDoc a document to convert into a big JSON patch describing its full contents
 */
function importDoc(inputDoc) {
    const options = {
        postProcessFnc: (type, schema, obj, defaultFnc) => (Object.assign({}, defaultFnc(type, schema, obj))),
        objects: {
            postProcessFnc: (schema, obj, defaultFnc) => (Object.assign(Object.assign({}, defaultFnc(schema, obj)), { required: Object.getOwnPropertyNames(obj) })),
        },
    };
    const schema = to_json_schema_1.default(inputDoc, options);
    const patch = fast_json_patch_1.compare({}, inputDoc);
    // console.log('patch------->', patch)
    return [schema, patch];
}
exports.importDoc = importDoc;
/**
 * applyLensToDoc - converts a full document through a lens.
 * Under the hood, we convert your input doc into a big patch and the apply it to the targetDoc.
 * This allows merging data back and forth with other omitted values.
 * @property lensSource: the lens specification to apply to the document
 * @property inputDoc: the Plain Old Javascript Object to convert
 * @property inputSchema: (default: inferred from inputDoc) a JSON schema defining the input
 * @property targetDoc: (default: {}) a document to apply the contents of this document to as a patch
 */
function applyLensToDoc(lensSource, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
inputDoc, inputSchema, 
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
targetDoc) {
    const [impliedSchema, patchForOriginalDoc] = importDoc(inputDoc);
    if (inputSchema === undefined || inputSchema === null) {
        inputSchema = impliedSchema;
    }
    // construct the "base" upon which we will apply the patches from doc.
    // We start with the default object for the output schema,
    // then we add in any existing fields on the target doc.
    // TODO: I think we need to deep merge here, can't just shallow merge?
    const outputSchema = json_schema_1.updateSchema(inputSchema, lensSource);
    console.log('outputSchema------>', outputSchema);
    const base = Object.assign(defaults_1.defaultObjectForSchema(outputSchema), targetDoc || {});
    // return a doc based on the converted patch.
    // (start with either a specified baseDoc, or just empty doc)
    // convert the patch through the lens
    const outputPatch = patch_1.applyLensToPatch(lensSource, patchForOriginalDoc, inputSchema);
    return fast_json_patch_1.applyPatch(base, outputPatch).newDocument;
}
exports.applyLensToDoc = applyLensToDoc;
//# sourceMappingURL=doc.js.map