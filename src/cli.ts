// A CLI document conversion tool for cloudina

import { program } from 'commander'
import { readFileSync } from 'fs'
import YAML from 'js-yaml'
import { convertDoc } from './cloudina'
import { LensSource, LensOp } from './lens-ops'
import { reverseLens } from './reverse'

interface YAMLLens {
  lens: LensSource
}

// copied from migrationRunner.ts; should probably migrate into cloudina
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

program
  .requiredOption('-l, --lens <filename>', 'lens source as yaml')
  .option('-i, --input <filename>', 'input document filename')
  .option('-b, --base <filename>', 'base document filename')
  .option('-r, --reverse', 'run the lens in reverse')

program.parse(process.argv)

// read doc from stdin if no input specified
const input = readFileSync(program.input || 0, 'utf-8')
const baseDoc = program.base ? JSON.parse(readFileSync(program.base, 'utf-8')) : {}
const doc = JSON.parse(input)
const rawLens = YAML.safeLoad(readFileSync(program.lens, 'utf-8')) as YAMLLens

if (!rawLens || typeof rawLens !== 'object') throw new Error('Error loading lens')
if (!('lens' in rawLens)) throw new Error(`Expected top-level key 'lens' in YAML lens file`)

let lens = (rawLens.lens as LensSource).map((lensOpJson) => foldInOp(lensOpJson))
if (program.reverse) {
  lens = reverseLens(lens)
}

const newDoc = convertDoc(doc, lens, baseDoc)

console.log(JSON.stringify(newDoc, null, 4))
