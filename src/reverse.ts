import { LensSource, LensOp } from './lens-ops'

function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${x}`)
}

export function reverseLens(lens: LensSource): LensSource {
  return lens
    .slice()
    .reverse()
    .map((l) => reverseLensOp(l))
}

function reverseLensOp(lensOp: LensOp): LensOp {
  switch (lensOp.op) {
    case 'rename':
      return {
        ...lensOp,
        source: lensOp.destination,
        destination: lensOp.source,
      }

    case 'add': {
      return {
        ...lensOp,
        op: 'remove',
      }
    }

    case 'remove':
      return {
        ...lensOp,
        op: 'add',
      }

    case 'wrap':
      return {
        ...lensOp,
        op: 'head',
      }
    case 'head':
      return {
        ...lensOp,
        op: 'wrap',
      }

    case 'in':
    case 'map':
      return { ...lensOp, lens: reverseLens(lensOp.lens) }

    case 'hoist':
      return {
        ...lensOp,
        op: 'plunge',
      }
    case 'plunge':
      return {
        ...lensOp,
        op: 'hoist',
      }
    case 'convert': {
      const mapping = [lensOp.mapping[1], lensOp.mapping[0]]
      const reversed = {
        ...lensOp,
        mapping,
        sourceType: lensOp.destinationType,
        destinationType: lensOp.sourceType,
      }

      return reversed
    }

    default:
      return assertNever(lensOp) // exhaustiveness check
  }
}
