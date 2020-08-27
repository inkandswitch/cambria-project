"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadYamlLens = exports.loadLens = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const foldInOp = (lensOpJson) => {
    const opName = Object.keys(lensOpJson)[0];
    // the json format is
    // {"<opName>": {opArgs}}
    // and the internal format is
    // {op: <opName>, ...opArgs}
    const data = lensOpJson[opName];
    if (['in', 'map'].includes(opName)) {
        data.lens = data.lens.map((lensOp) => foldInOp(lensOp));
    }
    const op = Object.assign({ op: opName }, data);
    return op;
};
function loadLens(rawLens) {
    return rawLens.lens
        .filter((o) => o !== null)
        .map((lensOpJson) => foldInOp(lensOpJson));
}
exports.loadLens = loadLens;
function loadYamlLens(lensData) {
    const rawLens = js_yaml_1.default.safeLoad(lensData);
    if (!rawLens || typeof rawLens !== 'object')
        throw new Error('Error loading lens');
    if (!('lens' in rawLens))
        throw new Error(`Expected top-level key 'lens' in YAML lens file`);
    // we could have a root op to make this consistent...
    return loadLens(rawLens);
}
exports.loadYamlLens = loadYamlLens;
//# sourceMappingURL=lens-loader.js.map