import { Graph, alg, json } from 'graphlib'
import { LensSource, LensOp, updateSchema, reverseLens, applyLensToPatch } from '.'
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

export function registerLens({ graph }: LensGraph, from: string, to: string, lenses: LensSource) {
  // clone the graph to ensure this is a pure function
  graph = json.read(json.write(graph)) // (these are graphlib's jsons)

  if (!graph.node(from)) {
    throw new RangeError(`unknown schema ${from}`)
  }

  if (graph.node(to)) {
    throw new RangeError(`already have a schema named ${to}`)
  }

  graph.setEdge(from, to, lenses)
  graph.setEdge(to, from, reverseLens(lenses))
  graph.setNode(to, updateSchema(graph.node(from), lenses))

  return { graph }
}

export function lensGraphSchemas({ graph }: LensGraph): string[] {
  return graph.nodes()
}

export function lensGraphSchema({ graph }: LensGraph, schema: string): JSONSchema7 {
  return graph.node(schema)
}

export function lensFromTo({ graph }: LensGraph, from: string, to: string): LensSource {
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
