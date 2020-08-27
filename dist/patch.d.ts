import { Operation } from 'fast-json-patch';
import { JSONSchema7 } from 'json-schema';
import { LensSource } from './lens-ops';
export declare type PatchOp = Operation;
declare type MaybePatchOp = PatchOp | null;
export declare type Patch = Operation[];
export declare type CompiledLens = (patch: Patch, targetDoc: any) => Patch;
export declare function compile(lensSource: LensSource): {
    right: CompiledLens;
    left: CompiledLens;
};
export declare function applyLensToPatch(lensSource: LensSource, patch: Patch, patchSchema: JSONSchema7): Patch;
export declare function applyLensToPatchOp(lensSource: LensSource, patchOp: MaybePatchOp): MaybePatchOp;
export declare function expandPatch(patchOp: PatchOp): PatchOp[];
export {};
