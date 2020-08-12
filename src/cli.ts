import { program } from 'commander'
import { readFileSync } from 'fs'

import { reverseLens } from './reverse'
import { applyLensToDoc } from './doc'
import { loadYamlLens } from './lens-loader'

program
  .description('// A CLI document conversion tool for cambria')
  .requiredOption('-l, --lens <filename>', 'lens source as yaml')
  .option('-i, --input <filename>', 'input document filename')
  .option('-s, --schema <schema>', 'json schema for input document')
  .option('-b, --base <filename>', 'base document filename')
  .option('-r, --reverse', 'run the lens in reverse')

program.parse(process.argv)

// read doc from stdin if no input specified
const input = readFileSync(program.input || 0, 'utf-8')
const baseDoc = program.base ? JSON.parse(readFileSync(program.base, 'utf-8')) : {}
const doc = JSON.parse(input)
const lensData = readFileSync(program.lens, 'utf-8')

let lens = loadYamlLens(lensData)

if (program.reverse) {
  lens = reverseLens(lens)
}

const newDoc = applyLensToDoc(lens, doc, program.schema, baseDoc)

console.log(JSON.stringify(newDoc, null, 4))
