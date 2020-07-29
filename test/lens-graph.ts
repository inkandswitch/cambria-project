import assert from 'assert'
import { JSONSchema7 } from 'json-schema'
import { updateSchema } from '../src/json-schema'
import {
  addProperty,
  inside,
  map,
  headProperty,
  wrapProperty,
  hoistProperty,
  plungeProperty,
  renameProperty,
  convertValue,
  removeProperty,
} from '../src/helpers'

import {
  LensGraph,
  initLensGraph,
  registerLens,
  lensGraphSchemas,
  lensFromTo,
} from '../src/lens-graph'

const LensMutoV1 = [addProperty({ name: 'title', type: 'string' })]
const LensV1toV2 = [
  addProperty({ name: 'metadata', type: 'object' }),
  inside('metadata', [
    addProperty({ name: 'createdAt', type: 'number' }),
    addProperty({ name: 'updatedAt', type: 'number' }),
  ]),
]
const LensV2toV3 = [
  hoistProperty('metadata', 'createdAt'),
  addProperty({ name: 'metadata', type: 'object' }),
]

const Lenses = [
  { from: 'mu', to: 'V1', lens: LensMutoV1 },
  { from: 'V1', to: 'V2', lens: LensV1toV2 },
  { from: 'V2', to: 'V3', lens: LensV2toV3 },
]

describe('registering lenses', () => {
  it('should be able to create a graph', () => {
    const graph = initLensGraph()
    assert.deepEqual(lensGraphSchemas(graph), ['mu'])
  })

  it('should be able to register some lenses', () => {
    const graph = Lenses.reduce<LensGraph>((graph, { from, to, lens }) => {
      return registerLens(graph, from, to, lens)
    }, initLensGraph())
    assert.deepEqual(lensGraphSchemas(graph), ['mu', 'V1', 'V2', 'V3'])
  })

  it('should compose a lens from a path', () => {
    const graph = Lenses.reduce<LensGraph>(
      (graph, { from, to, lens }) => registerLens(graph, from, to, lens),
      initLensGraph()
    )

    const lens = lensFromTo(graph, 'V1', 'V3')
    assert.deepEqual(lens, [...LensV1toV2, ...LensV2toV3])
  })
})
