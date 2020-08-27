"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandPatch = exports.applyLensToPatchOp = exports.applyLensToPatch = exports.compile = void 0;
const reverse_1 = require("./reverse");
const defaults_1 = require("./defaults");
const json_schema_1 = require("./json-schema");
function assertNever(x) {
    throw new Error(`Unexpected object: ${x}`);
}
function noNulls(items) {
    return items.filter((x) => x !== null);
}
// Provide curried functions that incorporate the lenses internally;
// this is useful for exposing a pre-baked converter function to developers
// without them needing to access the lens themselves
// TODO: the public interface could just be runLens and reverseLens
// ... maybe also composeLens?
function compile(lensSource) {
    return {
        right: (patch, targetDoc) => applyLensToPatch(lensSource, patch, targetDoc),
        left: (patch, targetDoc) => applyLensToPatch(reverse_1.reverseLens(lensSource), patch, targetDoc),
    };
}
exports.compile = compile;
// given a patch, returns a new patch that has had the lens applied to it.
function applyLensToPatch(lensSource, patch, patchSchema // the json schema for the doc the patch was operating on
) {
    // expand patches that set nested objects into scalar patches
    const expandedPatch = patch.map((op) => expandPatch(op)).flat();
    // send everything through the lens
    const lensedPatch = noNulls(expandedPatch.map((patchOp) => applyLensToPatchOp(lensSource, patchOp)));
    // add in default values needed (based on the new schema after lensing)
    const readerSchema = json_schema_1.updateSchema(patchSchema, lensSource);
    const lensedPatchWithDefaults = defaults_1.addDefaultValues(lensedPatch, readerSchema);
    return lensedPatchWithDefaults;
}
exports.applyLensToPatch = applyLensToPatch;
// todo: remove destinationDoc entirely
function applyLensToPatchOp(lensSource, patchOp) {
    return lensSource.reduce((prevPatch, lensOp) => {
        return runLensOp(lensOp, prevPatch);
    }, patchOp);
}
exports.applyLensToPatchOp = applyLensToPatchOp;
function runLensOp(lensOp, patchOp) {
    if (patchOp === null) {
        return null;
    }
    switch (lensOp.op) {
        case 'rename':
            if (
            // TODO: what about other JSON patch op types?
            // (consider other parts of JSON patch: move / copy / test / remove ?)
            (patchOp.op === 'replace' || patchOp.op === 'add') &&
                patchOp.path.split('/')[1] === lensOp.source) {
                const path = patchOp.path.replace(lensOp.source, lensOp.destination);
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        case 'hoist': {
            // leading slash needs trimming
            const pathElements = patchOp.path.substr(1).split('/');
            const [possibleSource, possibleDestination, ...rest] = pathElements;
            if (possibleSource === lensOp.host && possibleDestination === lensOp.name) {
                const path = ['', lensOp.name, ...rest].join('/');
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'plunge': {
            const pathElements = patchOp.path.substr(1).split('/');
            const [head] = pathElements;
            if (head === lensOp.name) {
                const path = ['', lensOp.host, pathElements].join('/');
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'wrap': {
            const pathComponent = new RegExp(`^/(${lensOp.name})(.*)`);
            const match = patchOp.path.match(pathComponent);
            if (match) {
                const path = `/${match[1]}/0${match[2]}`;
                if ((patchOp.op === 'add' || patchOp.op === 'replace') &&
                    patchOp.value === null &&
                    match[2] === '') {
                    return { op: 'remove', path };
                }
                return Object.assign(Object.assign({}, patchOp), { path });
            }
            break;
        }
        case 'head': {
            // break early if we're not handling a write to the array handled by this lens
            const arrayMatch = patchOp.path.split('/')[1] === lensOp.name;
            if (!arrayMatch)
                break;
            // We only care about writes to the head element, nothing else matters
            const headMatch = patchOp.path.match(new RegExp(`^/${lensOp.name}/0(.*)`));
            if (!headMatch)
                return null;
            if (patchOp.op === 'add' || patchOp.op === 'replace') {
                // If the write is to the first array element, write to the scalar
                return {
                    op: patchOp.op,
                    path: `/${lensOp.name}${headMatch[1] || ''}`,
                    value: patchOp.value,
                };
            }
            if (patchOp.op === 'remove') {
                if (headMatch[1] === '') {
                    return {
                        op: 'replace',
                        path: `/${lensOp.name}${headMatch[1] || ''}`,
                        value: null,
                    };
                }
                else {
                    return Object.assign(Object.assign({}, patchOp), { path: `/${lensOp.name}${headMatch[1] || ''}` });
                }
            }
            break;
        }
        case 'add':
            // hmm, what do we do here? perhaps write the default value if there's nothing
            // already written into the doc there?
            // (could be a good use case for destinationDoc)
            break;
        case 'remove':
            if (patchOp.path.split('/')[1] === lensOp.name)
                return null;
            break;
        case 'in': {
            // Run the inner body in a context where the path has been narrowed down...
            const pathComponent = new RegExp(`^/${lensOp.name}`);
            if (patchOp.path.match(pathComponent)) {
                const childPatch = applyLensToPatchOp(lensOp.lens, Object.assign(Object.assign({}, patchOp), { path: patchOp.path.replace(pathComponent, '') }));
                if (childPatch) {
                    return Object.assign(Object.assign({}, childPatch), { path: `/${lensOp.name}${childPatch.path}` });
                }
            }
            break;
        }
        case 'map': {
            const arrayIndexMatch = patchOp.path.match(/\/([0-9]+)\//);
            if (!arrayIndexMatch)
                break;
            const arrayIndex = arrayIndexMatch[1];
            const itemPatch = applyLensToPatchOp(lensOp.lens, Object.assign(Object.assign({}, patchOp), { path: patchOp.path.replace(/\/[0-9]+\//, '/') }));
            if (itemPatch) {
                return Object.assign(Object.assign({}, itemPatch), { path: `/${arrayIndex}${itemPatch.path}` });
            }
            break;
        }
        case 'convert': {
            if (patchOp.op !== 'add' && patchOp.op !== 'replace')
                break;
            if (`/${lensOp.name}` !== patchOp.path)
                break;
            const stringifiedValue = String(patchOp.value);
            // todo: should we add in support for fallback/default conversions
            if (!Object.keys(lensOp.mapping[0]).includes(stringifiedValue)) {
                throw new Error(`No mapping for value: ${stringifiedValue}`);
            }
            return Object.assign(Object.assign({}, patchOp), { value: lensOp.mapping[0][stringifiedValue] });
        }
        default:
            assertNever(lensOp); // exhaustiveness check
    }
    return patchOp;
}
function expandPatch(patchOp) {
    // this only applies for add and replace ops; no expansion to do otherwise
    // todo: check the whole list of json patch verbs
    if (patchOp.op !== 'add' && patchOp.op !== 'replace')
        return [patchOp];
    if (patchOp.value && typeof patchOp.value === 'object') {
        let result = [
            {
                op: patchOp.op,
                path: patchOp.path,
                value: Array.isArray(patchOp.value) ? [] : {},
            },
        ];
        result = result.concat(Object.entries(patchOp.value).map(([key, value]) => {
            return expandPatch({
                op: patchOp.op,
                path: `${patchOp.path}/${key}`,
                value,
            });
        }));
        return result.flat(Infinity);
    }
    return [patchOp];
}
exports.expandPatch = expandPatch;
//# sourceMappingURL=patch.js.map