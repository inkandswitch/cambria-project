"use strict";
// helper functions for nicer syntax
// (we might write our own parser later, but at least for now
// this avoids seeing the raw json...)
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertValue = exports.map = exports.inside = exports.headProperty = exports.wrapProperty = exports.plungeProperty = exports.hoistProperty = exports.renameProperty = exports.removeProperty = exports.addProperty = void 0;
function addProperty(property) {
    return Object.assign({ op: 'add' }, property);
}
exports.addProperty = addProperty;
function removeProperty(property) {
    return Object.assign({ op: 'remove' }, property);
}
exports.removeProperty = removeProperty;
function renameProperty(source, destination) {
    return {
        op: 'rename',
        source,
        destination,
    };
}
exports.renameProperty = renameProperty;
function hoistProperty(host, name) {
    return {
        op: 'hoist',
        host,
        name,
    };
}
exports.hoistProperty = hoistProperty;
function plungeProperty(host, name) {
    return {
        op: 'plunge',
        host,
        name,
    };
}
exports.plungeProperty = plungeProperty;
function wrapProperty(name) {
    return {
        op: 'wrap',
        name,
    };
}
exports.wrapProperty = wrapProperty;
function headProperty(name) {
    return {
        op: 'head',
        name,
    };
}
exports.headProperty = headProperty;
function inside(name, lens) {
    return {
        op: 'in',
        name,
        lens,
    };
}
exports.inside = inside;
function map(lens) {
    return {
        op: 'map',
        lens,
    };
}
exports.map = map;
function convertValue(name, mapping, sourceType, destinationType) {
    return {
        op: 'convert',
        name,
        mapping,
        sourceType,
        destinationType,
    };
}
exports.convertValue = convertValue;
//# sourceMappingURL=helpers.js.map