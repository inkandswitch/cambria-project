"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseLens = void 0;
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function reverseLens(lens) {
    return lens
        .slice()
        .reverse()
        .map((l) => reverseLensOp(l));
}
exports.reverseLens = reverseLens;
function reverseLensOp(lensOp) {
    switch (lensOp.op) {
        case 'rename':
            return Object.assign(Object.assign({}, lensOp), { source: lensOp.destination, destination: lensOp.source });
        case 'add': {
            return Object.assign(Object.assign({}, lensOp), { op: 'remove' });
        }
        case 'remove':
            return Object.assign(Object.assign({}, lensOp), { op: 'add' });
        case 'wrap':
            return Object.assign(Object.assign({}, lensOp), { op: 'head' });
        case 'head':
            return Object.assign(Object.assign({}, lensOp), { op: 'wrap' });
        case 'in':
        case 'map':
            return Object.assign(Object.assign({}, lensOp), { lens: reverseLens(lensOp.lens) });
        case 'hoist':
            return Object.assign(Object.assign({}, lensOp), { op: 'plunge' });
        case 'plunge':
            return Object.assign(Object.assign({}, lensOp), { op: 'hoist' });
        case 'convert': {
            const mapping = [lensOp.mapping[1], lensOp.mapping[0]];
            const reversed = Object.assign(Object.assign({}, lensOp), { mapping, sourceType: lensOp.destinationType, destinationType: lensOp.sourceType });
            return reversed;
        }
        default:
            return assertNever(lensOp); // exhaustiveness check
    }
}
//# sourceMappingURL=reverse.js.map