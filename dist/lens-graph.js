"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lensFromTo = exports.lensGraphSchema = exports.lensGraphSchemas = exports.registerLens = exports.initLensGraph = void 0;
const graphlib_1 = require("graphlib");
const _1 = require(".");
const json_schema_1 = require("./json-schema");
function initLensGraph() {
    const lensGraph = { graph: new graphlib_1.Graph() };
    lensGraph.graph.setNode('mu', json_schema_1.emptySchema);
    return lensGraph;
}
exports.initLensGraph = initLensGraph;
// Add a new lens to the schema graph.
// If the "to" schema doesn't exist yet, registers the schema too.
// Returns a copy of the graph with the new contents.
function registerLens({ graph }, from, to, lenses) {
    // clone the graph to ensure this is a pure function
    graph = graphlib_1.json.read(graphlib_1.json.write(graph)); // (these are graphlib's jsons)
    if (!graph.node(from)) {
        throw new RangeError(`unknown schema ${from}`);
    }
    const existingLens = graph.edge({ v: from, w: to });
    if (existingLens) {
        // we could assert this? assert.deepEqual(existingLens, lenses)
        // we've already registered a lens on this edge, hope it's the same one!
        // todo: maybe warn here? seems dangerous to silently return...
        return { graph };
    }
    if (!graph.node(to)) {
        graph.setNode(to, _1.updateSchema(graph.node(from), lenses));
    }
    graph.setEdge(from, to, lenses);
    graph.setEdge(to, from, _1.reverseLens(lenses));
    return { graph };
}
exports.registerLens = registerLens;
function lensGraphSchemas({ graph }) {
    return graph.nodes();
}
exports.lensGraphSchemas = lensGraphSchemas;
function lensGraphSchema({ graph }, schema) {
    return graph.node(schema);
}
exports.lensGraphSchema = lensGraphSchema;
function lensFromTo({ graph }, from, to) {
    if (!graph.hasNode(from)) {
        throw new Error(`couldn't find schema in graph: ${from}`);
    }
    if (!graph.hasNode(to)) {
        throw new Error(`couldn't find schema in graph: ${to}`);
    }
    const migrationPaths = graphlib_1.alg.dijkstra(graph, to);
    const lenses = [];
    if (migrationPaths[from].distance == Infinity) {
        throw new Error(`no path found from ${from} to ${to}`);
    }
    if (migrationPaths[from].distance == 0) {
        return [];
    }
    for (let v = from; v != to; v = migrationPaths[v].predecessor) {
        const w = migrationPaths[v].predecessor;
        const edge = graph.edge({ v, w });
        lenses.push(...edge);
    }
    return lenses;
}
exports.lensFromTo = lensFromTo;
//# sourceMappingURL=lens-graph.js.map