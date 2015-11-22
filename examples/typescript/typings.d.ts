/**
 * A Divergent ChunkID to Divergent Label map.
 */
declare var __webpack_divergent_labels__: { [label: string]: number };


declare var __webpack_chunk_load__: {
    (chunkId: number, callback: Function): void;
};

declare var __webpack_require__: {
    <T>(moduleId: number): T;
};

declare var require: {
    <T>(path: string): T;

    ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;

    diverge<T>(base: any, divergeMap: { [level:string]: any}, options?: any): T;
    diverge<T>(divergeMap: { [level:string]: any}, options?: any): T;
};
