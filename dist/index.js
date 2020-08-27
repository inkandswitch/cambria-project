"use strict";
// TODO: The exported surface is fairly large right now,
// See how much we can narrow this.
Object.defineProperty(exports, "__esModule", { value: true });
var json_schema_1 = require("./json-schema");
Object.defineProperty(exports, "updateSchema", { enumerable: true, get: function () { return json_schema_1.updateSchema; } });
Object.defineProperty(exports, "schemaForLens", { enumerable: true, get: function () { return json_schema_1.schemaForLens; } });
var patch_1 = require("./patch");
Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return patch_1.compile; } });
Object.defineProperty(exports, "applyLensToPatch", { enumerable: true, get: function () { return patch_1.applyLensToPatch; } });
var doc_1 = require("./doc");
Object.defineProperty(exports, "applyLensToDoc", { enumerable: true, get: function () { return doc_1.applyLensToDoc; } });
Object.defineProperty(exports, "importDoc", { enumerable: true, get: function () { return doc_1.importDoc; } });
var defaults_1 = require("./defaults");
Object.defineProperty(exports, "defaultObjectForSchema", { enumerable: true, get: function () { return defaults_1.defaultObjectForSchema; } });
var reverse_1 = require("./reverse");
Object.defineProperty(exports, "reverseLens", { enumerable: true, get: function () { return reverse_1.reverseLens; } });
var lens_graph_1 = require("./lens-graph");
Object.defineProperty(exports, "initLensGraph", { enumerable: true, get: function () { return lens_graph_1.initLensGraph; } });
Object.defineProperty(exports, "registerLens", { enumerable: true, get: function () { return lens_graph_1.registerLens; } });
Object.defineProperty(exports, "lensGraphSchema", { enumerable: true, get: function () { return lens_graph_1.lensGraphSchema; } });
Object.defineProperty(exports, "lensFromTo", { enumerable: true, get: function () { return lens_graph_1.lensFromTo; } });
var helpers_1 = require("./helpers");
Object.defineProperty(exports, "addProperty", { enumerable: true, get: function () { return helpers_1.addProperty; } });
Object.defineProperty(exports, "removeProperty", { enumerable: true, get: function () { return helpers_1.removeProperty; } });
Object.defineProperty(exports, "renameProperty", { enumerable: true, get: function () { return helpers_1.renameProperty; } });
Object.defineProperty(exports, "hoistProperty", { enumerable: true, get: function () { return helpers_1.hoistProperty; } });
Object.defineProperty(exports, "plungeProperty", { enumerable: true, get: function () { return helpers_1.plungeProperty; } });
Object.defineProperty(exports, "wrapProperty", { enumerable: true, get: function () { return helpers_1.wrapProperty; } });
Object.defineProperty(exports, "headProperty", { enumerable: true, get: function () { return helpers_1.headProperty; } });
Object.defineProperty(exports, "inside", { enumerable: true, get: function () { return helpers_1.inside; } });
Object.defineProperty(exports, "map", { enumerable: true, get: function () { return helpers_1.map; } });
Object.defineProperty(exports, "convertValue", { enumerable: true, get: function () { return helpers_1.convertValue; } });
var lens_loader_1 = require("./lens-loader");
Object.defineProperty(exports, "loadYamlLens", { enumerable: true, get: function () { return lens_loader_1.loadYamlLens; } });
//# sourceMappingURL=index.js.map