"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaForLens = exports.updateSchema = exports.emptySchema = void 0;
const util_1 = require("util");
const defaults_1 = require("./defaults");
exports.emptySchema = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    additionalProperties: false,
};
function deepInspect(object) {
    return util_1.inspect(object, false, null, true);
}
// add a property to a schema
// note: property names are in json pointer with leading /
// (because that's how our Property types work for now)
// mutates the schema that is passed in
// (should switch to a more functional style)
function addProperty(schema, property) {
    const { properties: origProperties = {}, required: origRequired = [] } = schema;
    const { name, items, required: isPropertyRequired } = property;
    let { type } = property;
    if (!name || !type) {
        throw new Error(`Missing property name in addProperty.\nFound:\n${JSON.stringify(property)}`);
    }
    if (Array.isArray(type)) {
        type = type.map((t) => (t === null ? 'null' : t));
    }
    const arraylessPropertyDefinition = {
        type,
        default: property.default || defaults_1.defaultValuesByType(type),
    };
    // this is kludgey but you should see the crazy syntax for the alternative
    const propertyDefinition = type === 'array' && items
        ? Object.assign(Object.assign({}, arraylessPropertyDefinition), { items: { type: items.type, default: items.default || defaults_1.defaultValuesByType(items.type) } }) : arraylessPropertyDefinition;
    const properties = Object.assign(Object.assign({}, origProperties), { [name]: propertyDefinition });
    const shouldAdd = isPropertyRequired !== false && !origRequired.includes(name);
    const required = [...origRequired, ...(shouldAdd ? [name] : [])];
    return Object.assign(Object.assign({}, schema), { properties,
        required });
}
function withNullable(schema, fn) {
    if (schema.anyOf) {
        if (schema.anyOf.length !== 2) {
            throw new Error('We only support this operation on schemas with one type or a nullable type');
        }
        return Object.assign(Object.assign({}, schema), { anyOf: schema.anyOf.map(db).map((s) => (s.type === 'null' ? s : fn(s))) });
    }
    else {
        return fn(schema);
    }
}
function renameProperty(_schema, from, to) {
    return withNullable(_schema, (schema) => {
        if (typeof schema !== 'object' || typeof schema.properties !== 'object') {
            throw new Error(`expected schema object, got ${JSON.stringify(schema)}`);
        }
        if (!from) {
            throw new Error("Rename property requires a 'source' to rename.");
        }
        if (!schema.properties[from]) {
            throw new Error(`Cannot rename property '${from}' because it does not exist among ${Object.keys(schema.properties)}.`);
        }
        if (!to) {
            throw new Error(`Need a 'destination' to rename ${from} to.`);
        }
        const { properties = {}, required = [] } = schema; // extract properties with default of empty
        const _a = properties, _b = from, propDetails = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]); // pull out the old value
        if (propDetails === undefined) {
            throw new Error(`Rename error: missing expected property ${from}`);
        }
        return Object.assign(Object.assign({}, schema), { properties: Object.assign({ [to]: propDetails }, rest), required: [...required.filter((r) => r !== from), to] }); // assign it to the new one
    });
}
// remove a property from a schema
// property name is _not_ in JSON Pointer, no leading slash here.
// (yes, that's inconsistent with addPropertyToSchema, which is bad)
function removeProperty(schema, removedPointer) {
    const { properties = {}, required = [] } = schema;
    const removed = removedPointer;
    // we don't care about the `discarded` variable...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (!(removed in properties)) {
        throw new Error(`Attempting to remove nonexistent property: ${removed}`);
    }
    // no way to discard the
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _a = properties, _b = removed, discarded = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return Object.assign(Object.assign({}, schema), { properties: rest, required: required.filter((e) => e !== removed) });
}
function schemaSupportsType(typeValue, type) {
    if (!typeValue) {
        return false;
    }
    if (!Array.isArray(typeValue)) {
        typeValue = [typeValue];
    }
    return typeValue.includes(type);
}
/** db
 * removes the horrible, obnoxious, and annoying case where JSON schemas can just be
 * "true" or "false" meaning the below definitions and screwing up my type checker
 */
function db(s) {
    if (s === true) {
        return {};
    }
    if (s === false) {
        return { not: {} };
    }
    return s;
}
function supportsNull(schema) {
    var _a;
    return (schemaSupportsType(schema.type, 'null') ||
        !!((_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.some((subSchema) => schemaSupportsType(db(subSchema).type, 'null'))));
}
function findHost(schema, name) {
    var _a;
    if (schema.anyOf) {
        const maybeSchema = (_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.find((t) => typeof t === 'object' && t.properties);
        if (typeof maybeSchema === 'object' && typeof maybeSchema.properties === 'object') {
            const maybeHost = maybeSchema.properties[name];
            if (maybeHost !== false && maybeHost !== true) {
                return maybeHost;
            }
        }
    }
    else if (schema.properties && schema.properties[name]) {
        const maybeHost = schema.properties[name];
        if (maybeHost !== false && maybeHost !== true) {
            return maybeHost;
        }
    }
    throw new Error("Coudln't find the host for this data.");
}
function inSchema(schema, op) {
    var _a;
    const properties = schema.properties
        ? schema.properties
        : ((_a = schema.anyOf) === null || _a === void 0 ? void 0 : _a.find((t) => typeof t === 'object' && t.properties)).properties;
    if (!properties) {
        throw new Error("Cannot look 'in' an object that doesn't have properties.");
    }
    const { name, lens } = op;
    if (!name) {
        throw new Error(`Expected to find property ${name} in ${Object.keys(op || {})}`);
    }
    const host = findHost(schema, name);
    if (host === undefined) {
        throw new Error(`Expected to find property ${name} in ${Object.keys(properties || {})}`);
    }
    const newProperties = Object.assign(Object.assign({}, properties), { [name]: updateSchema(host, lens) });
    return Object.assign(Object.assign({}, schema), { properties: newProperties });
}
function validateSchemaItems(items) {
    if (Array.isArray(items)) {
        throw new Error('Cambria only supports consistent types for arrays.');
    }
    if (!items || items === true) {
        throw new Error(`Cambria requires a specific items definition, found ${items}.`);
    }
    return items;
}
function mapSchema(schema, lens) {
    if (!lens) {
        throw new Error('Map requires a `lens` to map over the array.');
    }
    if (!schema.items) {
        throw new Error(`Map requires a schema with items to map over, ${deepInspect(schema)}`);
    }
    return Object.assign(Object.assign({}, schema), { items: updateSchema(validateSchemaItems(schema.items), lens) });
}
function filterScalarOrArray(v, cb) {
    if (!Array.isArray(v)) {
        v = [v];
    }
    v = v.filter(cb);
    if (v.length === 1) {
        return v[0];
    }
    return v;
}
// XXX: THIS SHOULD REMOVE DEFAULT: NULL
function removeNullSupport(prop) {
    if (!supportsNull(prop)) {
        return prop;
    }
    if (prop.type) {
        if (prop.type === 'null') {
            return null;
        }
        prop = Object.assign(Object.assign({}, prop), { type: filterScalarOrArray(prop.type, (t) => t !== 'null') });
        if (prop.default === null) {
            prop.default = defaults_1.defaultValuesByType(prop.type); // the above always assigns a legal type
        }
    }
    if (prop.anyOf) {
        const newAnyOf = prop.anyOf.reduce((acc, s) => {
            const clean = removeNullSupport(db(s));
            return clean ? [...acc, clean] : acc;
        }, []);
        if (newAnyOf.length === 1) {
            return newAnyOf[0];
        }
        prop = Object.assign(Object.assign({}, prop), { anyOf: newAnyOf });
    }
    return prop;
}
function wrapProperty(schema, op) {
    if (!op.name) {
        throw new Error('Wrap property requires a `name` to identify what to wrap.');
    }
    if (!schema.properties) {
        throw new Error('Cannot wrap a property here. There are no properties.');
    }
    const prop = db(schema.properties[op.name]);
    if (!prop) {
        throw new Error(`Cannot wrap property '${op.name}' because it does not exist.`);
    }
    if (!supportsNull(prop)) {
        throw new Error(`Cannot wrap property '${op.name}' because it does not allow nulls, found ${deepInspect(schema)}`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [op.name]: {
                type: 'array',
                default: [],
                items: removeNullSupport(prop) || { not: {} },
            } }) });
}
function headProperty(schema, op) {
    if (!op.name) {
        throw new Error('Head requires a `name` to identify what to take head from.');
    }
    if (!schema.properties[op.name]) {
        throw new Error(`Cannot head property '${op.name}' because it does not exist.`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [op.name]: { anyOf: [{ type: 'null' }, schema.properties[op.name].items] } }) });
}
function hoistProperty(_schema, host, name) {
    return withNullable(_schema, (schema) => {
        if (schema.properties === undefined) {
            throw new Error(`Can't hoist when root schema isn't an object`);
        }
        if (!host) {
            throw new Error(`Need a \`host\` property to hoist from.`);
        }
        if (!name) {
            throw new Error(`Need to provide a \`name\` to hoist up`);
        }
        const { properties } = schema;
        if (!(host in properties)) {
            throw new Error(`Can't hoist anything from ${host}, it does not exist here. (Found properties ${Object.keys(properties)})`);
        }
        const hoistedPropertySchema = withNullable(db(properties[host]), (hostSchema) => {
            const hostProperties = hostSchema.properties;
            const hostRequired = hostSchema.required || [];
            if (!hostProperties) {
                throw new Error(`There are no properties to hoist out of ${host}, found ${Object.keys(hostSchema)}`);
            }
            if (!(name in hostProperties)) {
                throw new Error(`Can't hoist anything from ${host}, it does not exist here. (Found properties ${Object.keys(properties)})`);
            }
            const _a = hostProperties, _b = name, target = _a[_b], remainingProperties = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            return Object.assign(Object.assign({}, hostSchema), { properties: remainingProperties, required: hostRequired.filter((e) => e !== name) });
        });
        const childObject = withNullable(db(properties[host]), (hostSchema) => {
            const hostProperties = hostSchema.properties;
            const { [name]: target } = hostProperties;
            return db(target);
        });
        return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [host]: hoistedPropertySchema, [name]: childObject }), required: [...(schema.required || []), name] });
    });
}
function plungeProperty(schema, host, name) {
    // XXXX what should we do for missing child properties? error?
    const { properties = {} } = schema;
    if (!host) {
        throw new Error(`Need a \`host\` property to plunge into`);
    }
    if (!name) {
        throw new Error(`Need to provide a \`name\` to plunge`);
    }
    const destinationTypeProperties = properties[name];
    if (!destinationTypeProperties) {
        throw new Error(`Could not find a property called ${name} among ${Object.keys(properties)}`);
    }
    // we can throw an error here if things are missing?
    if (destinationTypeProperties === true) {
        // errrr... complain?
        return schema;
    }
    // add the property to the root schema
    schema = inSchema(schema, {
        op: 'in',
        name: host,
        lens: [
            Object.assign(Object.assign({ op: 'add' }, destinationTypeProperties), { name }),
        ],
    });
    // remove it from its current parent
    // PS: ugh
    schema = removeProperty(schema, name);
    return schema;
}
function convertValue(schema, lensOp) {
    const { name, destinationType, mapping } = lensOp;
    if (!destinationType) {
        return schema;
    }
    if (!name) {
        throw new Error(`Missing property name in 'convert'.\nFound:\n${JSON.stringify(lensOp)}`);
    }
    if (!mapping) {
        throw new Error(`Missing mapping for 'convert'.\nFound:\n${JSON.stringify(lensOp)}`);
    }
    return Object.assign(Object.assign({}, schema), { properties: Object.assign(Object.assign({}, schema.properties), { [name]: {
                type: destinationType,
                default: defaults_1.defaultValuesByType(destinationType),
            } }) });
}
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function applyLensOperation(schema, op) {
    switch (op.op) {
        case 'add':
            return addProperty(schema, op);
        case 'remove':
            return removeProperty(schema, op.name || '');
        case 'rename':
            return renameProperty(schema, op.source, op.destination);
        case 'in':
            return inSchema(schema, op);
        case 'map':
            return mapSchema(schema, op.lens);
        case 'wrap':
            return wrapProperty(schema, op);
        case 'head':
            return headProperty(schema, op);
        case 'hoist':
            return hoistProperty(schema, op.host, op.name);
        case 'plunge':
            return plungeProperty(schema, op.host, op.name);
        case 'convert':
            return convertValue(schema, op);
        default:
            assertNever(op); // exhaustiveness check
            return null;
    }
}
function updateSchema(schema, lens) {
    return lens.reduce((schema, op) => {
        if (schema === undefined)
            throw new Error("Can't update undefined schema");
        return applyLensOperation(schema, op);
    }, schema);
}
exports.updateSchema = updateSchema;
function schemaForLens(lens) {
    const emptySchema = {
        $schema: 'http://json-schema.org/draft-07/schema',
        type: 'object',
        additionalProperties: false,
    };
    return updateSchema(emptySchema, lens);
}
exports.schemaForLens = schemaForLens;
//# sourceMappingURL=json-schema.js.map