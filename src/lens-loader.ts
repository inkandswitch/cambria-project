import YAML from 'js-yaml'
import { LensSource, LensOp } from './lens-ops'

interface YAMLLens {
  lens: LensSource
}

const foldInOp = (lensOpJson): LensOp => {
  const opName = Object.keys(lensOpJson)[0]

  // the json format is
  // {"<opName>": {opArgs}}
  // and the internal format is
  // {op: <opName>, ...opArgs}
  const data = lensOpJson[opName]
  if (['in', 'map'].includes(opName)) {
    data.lens = data.lens.map((lensOp) => foldInOp(lensOp))
  }

  const op = { op: opName, ...data }
  return op
}

export function loadLens(rawLens: YAMLLens): LensSource {
  return (rawLens.lens as LensSource)
    .filter((o) => o !== null)
    .map((lensOpJson) => foldInOp(lensOpJson))
}

export function loadYamlLens(lensData: string): LensSource {
  const rawLens = YAML.safeLoad(lensData) as YAMLLens
  if (!rawLens || typeof rawLens !== 'object') throw new Error('Error loading lens')
  if (!('lens' in rawLens)) throw new Error(`Expected top-level key 'lens' in YAML lens file`)

  // we could have a root op to make this consistent...
  return loadLens(rawLens)
}
