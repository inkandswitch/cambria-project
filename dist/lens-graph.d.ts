import { Graph } from 'graphlib';
import { LensSource } from '.';
import { JSONSchema7 } from 'json-schema';
export interface LensGraph {
    graph: Graph;
}
export declare function initLensGraph(): LensGraph;
export declare function registerLens({ graph }: LensGraph, from: string, to: string, lenses: LensSource): LensGraph;
export declare function lensGraphSchemas({ graph }: LensGraph): string[];
export declare function lensGraphSchema({ graph }: LensGraph, schema: string): JSONSchema7;
export declare function lensFromTo({ graph }: LensGraph, from: string, to: string): LensSource;
