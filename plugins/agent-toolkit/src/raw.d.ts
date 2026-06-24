// Vite `?raw` imports resolve to the file's text content. Declared here so `tsc`
// (which doesn't run Vite's resolver) treats them as string modules. Used by the
// iframe-worker sandbox to inline the turf / h3 UMD bundles as the worker's
// self-contained library source (see `sandbox/worker-libs.ts`).
declare module '*?raw' {
    const content: string;
    export default content;
}

// Build-time virtual module (see the `sandbox-sdk-utils` plugin in
// `vite-sandbox-build.ts`): the bundled SDK worker-utilities IIFE (`routeUtils`, …),
// inlined as a string into the worker source. Declared here so `tsc` treats it as a
// string module.
declare module 'virtual:sandbox-sdk-utils' {
    export const source: string;
}
