"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDefaultValues = exports.defaultObjectForSchema = exports.defaultValuesByType = void 0;
/* eslint-disable no-use-before-define */
const fast_json_patch_1 = require("fast-json-patch");
/**
 * behaviour:
 *  - if we have an array of types where null is an option, that's our default
 *  - otherwise use the first type in the array to pick a default from the table
 *  - otherwise just use the value to lookup in the table
 */
const defaultValuesForType = {
    string: '',
    number: 0,
    boolean: false,
    array: [],
    object: {},
};
function defaultValuesByType(type) {
    if (Array.isArray(type)) {
        if (type.includes('null')) {
            return null;
        }
        return defaultValuesForType[type[0]];
    }
    return defaultValuesForType[type];
}
exports.defaultValuesByType = defaultValuesByType;
// Return a recursively filled-in default object for a given schema
function defaultObjectForSchema(schema) {
    // By setting the root to empty object,
    // we kick off a recursive process that fills in the entire thing
    const initializeRootPatch = [
        {
            op: 'add',
            path: '',
            value: {},
        },
    ];
    const defaultsPatch = addDefaultValues(initializeRootPatch, schema);
    return fast_json_patch_1.applyPatch({}, defaultsPatch).newDocument;
}
exports.defaultObjectForSchema = defaultObjectForSchema;
function addDefaultValues(patch, schema) {
    return patch
        .map((op) => {
        const isMakeMap = (op.op === 'add' || op.op === 'replace') &&
            op.value !== null &&
            typeof op.value === 'object' &&
            Object.entries(op.value).length === 0;
        if (!isMakeMap)
            return op;
        const objectProperties = getPropertiesForPath(schema, op.path);
        return [
            op,
            // fill in default values for each property on the object
            ...Object.entries(objectProperties).map(([propName, propSchema]) => {
                if (typeof propSchema !== 'object')
                    throw new Error(`Missing property ${propName}`);
                const path = `${op.path}/${propName}`;
                // Fill in a default iff:
                // 1) it's an object or array: init to empty
                // 2) it's another type and there's a default value set.
                // TODO: is this right?
                // Should we allow defaulting containers to non-empty? seems like no.
                // Should we fill in "default defaults" like empty string?
                // I think better to let the json schema explicitly define defaults
                let defaultValue;
                if (propSchema.type === 'object') {
                    defaultValue = {};
                }
                else if (propSchema.type === 'array') {
                    defaultValue = [];
                }
                else if ('default' in propSchema) {
                    defaultValue = propSchema.default;
                }
                else if (Array.isArray(propSchema.type) && propSchema.type.includes('null')) {
                    defaultValue = null;
                }
                if (defaultValue !== undefined) {
                    // todo: this is a TS hint, see if we can remove
                    if (op.op !== 'add' && op.op !== 'replace')
                        throw new Error('');
                    return addDefaultValues([Object.assign(Object.assign({}, op), { path, value: defaultValue })], schema);
                }
                return [];
            }),
        ].flat(Infinity);
    })
        .flat(Infinity);
}
exports.addDefaultValues = addDefaultValues;
// given a json schema and a json path to an object field somewhere in that schema,
// return the json schema for the object being pointed to
function getPropertiesForPath(schema, path) {
    const pathComponents = path.split('/').slice(1);
    const { properties } = pathComponents.reduce((schema, pathSegment) => {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        if (types.includes('object')) {
            const schemaForProperty = schema.properties && schema.properties[pathSegment];
            if (typeof schemaForProperty !== 'object')
                throw new Error('Expected object');
            return schemaForProperty;
        }
        if (types.includes('array')) {
            // throw away the array index, just return the schema for array items
            if (!schema.items || typeof schema.items !== 'object')
                throw new Error('Expected array items to have types');
            // todo: revisit this "as", was a huge pain to get this past TS
            return schema.items;
        }
        throw new Error('Expected object or array in schema based on JSON Pointer');
    }, schema);
    if (properties === undefined)
        return {};
    return properties;
}
//# sourceMappingURL=defaults.js.map