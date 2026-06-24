import { resolve } from 'node:path';
import { defineConfig } from 'vite';
// The harness imports the SDK from source, so it reuses the same sandbox build pieces
// the lib build uses: the `sandbox-turf-umd` / `sandbox-h3-umd` aliases (turf's
// `exports` map blocks the UMD subpath; h3 must avoid peer-dep externalization) and
// the `virtual:sandbox-sdk-utils` plugin that `worker-libs.ts` imports. Sharing them
// keeps this config in sync with `vite.lib.config.ts`.
import { sandboxH3UmdAlias, sandboxSdkUtilsPlugin, sandboxTurfUmdAlias } from '../vite-sandbox-build';

export default defineConfig({
    root: resolve(import.meta.dirname, 'app'),
    resolve: {
        alias: [
            sandboxTurfUmdAlias,
            sandboxH3UmdAlias,
            // Monorepo `@tomtom-org/maps-sdk/*` aliases for the (type-only) core imports.
            { find: '@tomtom-org/maps-sdk/core', replacement: resolve(import.meta.dirname, '../../../core/index.ts') },
            { find: '@tomtom-org/maps-sdk/map', replacement: resolve(import.meta.dirname, '../../../map/index.ts') },
            {
                find: '@tomtom-org/maps-sdk/services',
                replacement: resolve(import.meta.dirname, '../../../services/index.ts'),
            },
        ],
    },
    plugins: [sandboxSdkUtilsPlugin()],
    // The harness imports turf/h3 UMD as `?raw` text. Vite's esbuild dep-optimizer
    // would pre-bundle those node_modules files and ignore `?raw`, handing the import
    // the module *object* (→ "[object Object]") instead of source. Disabling discovery
    // routes every import through the plugin pipeline where `?raw` is honoured. (Shipped
    // consumers use the Rollup lib build, which has no optimizer and isn't affected.)
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { port: 5191 },
});
