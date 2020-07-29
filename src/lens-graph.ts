import { Graph, alg } from 'graphlib'
import { LensSource, LensOp, updateSchema, reverseLens, applyLensToPatch } from '.'
import { emptySchema } from './json-schema'

export interface LensGraph {
  graph: Graph
}

export function initLensGraph(): LensGraph {
  const lensGraph: LensGraph = { graph: new Graph() }

  lensGraph.graph.setNode('mu', emptySchema)
  return lensGraph
}

export function registerLens({ graph }: LensGraph, from: string, to: string, lenses: LensSource) {
  if (!graph.node(from)) {
    throw new RangeError(`unknown schema ${from}`)
  }

  if (graph.node(to)) {
    throw new RangeError(`already have a schema named ${to}`)
  }

  // if there's already a lens between two schemas, don't add this new one
  // if (this.graph.edge({ v: lens.source, w: lens.destination })) return

  graph.setEdge(from, to, lenses)
  graph.setEdge(to, from, reverseLens(lenses))
  graph.setNode(to, updateSchema(graph.node(from), lenses))

  /* !!!!
    for (const change of this.history) {
      for (const op of change.ops) {
        this.lensOpToSchemaAndApply(op, to)
      }
    } 
    */
  return { graph }
}

export function lensGraphSchemas({ graph }: LensGraph): string[] {
  return graph.nodes()
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
