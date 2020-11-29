import { Graph, alg, json } from 'graphlib'
import { LensSource, LensOp, updateSchema, reverseLens } from '.'
import { emptySchema } from './json-schema'
import { JSONSchema7 } from 'json-schema'

export interface LensGraph {
  graph: Graph
}

export function initLensGraph(): LensGraph {
  const lensGraph: LensGraph = { graph: new Graph() }

  lensGraph.graph.setNode('mu', emptySchema)
  return lensGraph
}

// Add a new lens to the schema graph.
// If the "to" schema doesn't exist yet, registers the schema too.
// Returns a copy of the graph with the new contents.
export function registerLens(
  { graph }: LensGraph,
  from: string,
  to: string,
  lenses: LensSource
): LensGraph {
  // clone the graph to ensure this is a pure function
  graph = json.read(json.write(graph)) // (these are graphlib's jsons)

  if (!graph.node(from)) {
    throw new RangeError(`unknown schema ${from}`)
  }

  const existingLens = graph.edge({ v: from, w: to })
  if (existingLens) {
    // we could assert this? assert.deepEqual(existingLens, lenses)
    // we've already registered a lens on this edge, hope it's the same one!
    // todo: maybe warn here? seems dangerous to silently return...
    return { graph }
  }

  if (!graph.node(to)) {
    graph.setNode(to, updateSchema(graph.node(from), lenses))
  }

  graph.setEdge(from, to, lenses)
  graph.setEdge(to, from, reverseLens(lenses))

  return { graph }
}

export function lensGraphSchemas({ graph }: LensGraph): string[] {
  return graph.nodes()
}

export function lensGraphSchema({ graph }: LensGraph, schema: string): JSONSchema7 {
  return graph.node(schema)
}

export function lensFromTo({ graph }: LensGraph, from: string, to: string): LensSource {
  if (!graph.hasNode(from)) {
    throw new Error(`couldn't find schema in graph: ${from}`)
  }

  if (!graph.hasNode(to)) {
    throw new Error(`couldn't find schema in graph: ${to}`)
  }

  const migrationPaths = alg.dijkstra(graph, to)
  const lenses: LensOp[] = []
  if (migrationPaths[from].distance == Infinity) {
    throw new Error(`no path found from ${from} to ${to}`)
  }
  if (migrationPaths[from].distance == 0) {
    return []
  }
  for (let v = from; v != to; v = migrationPaths[v].predecessor) {
    const w = migrationPaths[v].predecessor
    const edge = graph.edge({ v, w })
    lenses.push(...edge)
  }
  return lenses
}
