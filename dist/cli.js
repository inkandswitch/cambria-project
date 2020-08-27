"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = require("fs");
const reverse_1 = require("./reverse");
const doc_1 = require("./doc");
const lens_loader_1 = require("./lens-loader");
commander_1.program
    .description('// A CLI document conversion tool for cambria')
    .requiredOption('-l, --lens <filename>', 'lens source as yaml')
    .option('-i, --input <filename>', 'input document filename')
    .option('-s, --schema <schema>', 'json schema for input document')
    .option('-b, --base <filename>', 'base document filename')
    .option('-r, --reverse', 'run the lens in reverse');
commander_1.program.parse(process.argv);
// read doc from stdin if no input specified
const input = fs_1.readFileSync(commander_1.program.input || 0, 'utf-8');
const baseDoc = commander_1.program.base ? JSON.parse(fs_1.readFileSync(commander_1.program.base, 'utf-8')) : {};
const doc = JSON.parse(input);
const lensData = fs_1.readFileSync(commander_1.program.lens, 'utf-8');
let lens = lens_loader_1.loadYamlLens(lensData);
if (commander_1.program.reverse) {
    lens = reverse_1.reverseLens(lens);
}
const newDoc = doc_1.applyLensToDoc(lens, doc, commander_1.program.schema, baseDoc);
console.log(JSON.stringify(newDoc, null, 4));
//# sourceMappingURL=cli.js.map