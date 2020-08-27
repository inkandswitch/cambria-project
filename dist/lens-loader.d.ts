import { LensSource } from './lens-ops';
interface YAMLLens {
    lens: LensSource;
}
export declare function loadLens(rawLens: YAMLLens): LensSource;
export declare function loadYamlLens(lensData: string): LensSource;
export {};
