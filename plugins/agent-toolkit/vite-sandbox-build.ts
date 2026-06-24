import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Alias, type Plugin, build as viteBuild } from 'vite';

// Shared Vite build pieces for the iframe-worker sandbox, used by BOTH the library
// build (`vite.lib.config.ts`) and the e2e harness (`e2e-tests/vite.config.ts`).
// The harness imports the SDK from source, so `worker-libs.ts` resolves the same
// `sandbox-turf-umd` alias and `virtual:sandbox-sdk-utils` module the lib build
// uses — keeping them in one place stops the two configs from drifting.

// turf's `exports` map blocks importing `@turf/turf/turf.min.js` directly, so we
// alias a stable id to its absolute path (resolved via the always-exported
// package.json). The iframe-worker sandbox `?raw`-imports this UMD as the worker's
// library source. The regex form also matches the `?raw` query suffix; `$1`
// preserves the query so Vite still reads the file as raw text.
const require = createRequire(import.meta.url);
const turfUmdPath = join(dirname(require.resolve('@turf/turf/package.json')), 'turf.min.js');
const h3UmdPath = join(dirname(require.resolve('h3-js/package.json')), 'dist/h3-js.umd.js');

/** Alias resolving the `sandbox-turf-umd` id (with optional `?raw`) to turf's UMD bundle. */
export const sandboxTurfUmdAlias: Alias = { find: /^sandbox-turf-umd(\?.*)?$/, replacement: `${turfUmdPath}$1` };

// h3-js is a peer dependency, so the lib build externalizes it — which means a direct
// `h3-js/...?raw` import is NOT inlined as text but kept as a runtime import resolving
// to the h3 *module object* (rendering as "[object Object]" when concatenated). Alias
// it to its absolute UMD path (like turf) so `?raw` reads the file as raw text and the
// bundler inlines the string instead of externalizing the package.
/** Alias resolving the `sandbox-h3-umd` id (with optional `?raw`) to h3-js's UMD bundle. */
export const sandboxH3UmdAlias: Alias = { find: /^sandbox-h3-umd(\?.*)?$/, replacement: `${h3UmdPath}$1` };

// Build-time bundle of the SDK worker utilities (`routeUtils`, and any future groups)
// for the iframe-worker sandbox. The worker needs them as a self-contained IIFE string
// (it can't `import` SDK modules across the worker boundary), so we bundle
// `sdk-utils-worker-entry.ts` here and expose the result as the virtual module
// `virtual:sandbox-sdk-utils`, which `worker-libs.ts` concatenates after the turf/h3
// UMD. `@turf/turf` is externalised to the worker's already-loaded `self.turf` global,
// so turf is NOT bundled twice; the only other deps (pure SDK helpers) are tree-shaken
// in. Adding a new utility group is an edit to the entry file — this plugin is generic.
const SDK_UTILS_VIRTUAL_ID = 'virtual:sandbox-sdk-utils';
const RESOLVED_SDK_UTILS_ID = `\0${SDK_UTILS_VIRTUAL_ID}`;
const sdkUtilsEntry = fileURLToPath(new URL('./src/tools/shared/sandbox/sdk-utils-worker-entry.ts', import.meta.url));

/** Vite plugin exposing the bundled SDK worker-utilities IIFE as `virtual:sandbox-sdk-utils`. */
export const sandboxSdkUtilsPlugin = (): Plugin => {
    let cachedSource: string | null = null;
    return {
        name: 'sandbox-sdk-utils',
        resolveId(id) {
            if (id === SDK_UTILS_VIRTUAL_ID) return RESOLVED_SDK_UTILS_ID;
            return undefined;
        },
        async load(id) {
            if (id !== RESOLVED_SDK_UTILS_ID) return undefined;
            if (cachedSource === null) {
                const result = await viteBuild({
                    configFile: false,
                    logLevel: 'silent',
                    build: {
                        write: false,
                        minify: true,
                        lib: {
                            entry: sdkUtilsEntry,
                            formats: ['iife'],
                            name: '__sandboxSdkUtils', // unused; the entry assigns self.<group>
                            fileName: () => 'sdk-utils.iife.js',
                        },
                        // Externalise turf → the worker's `self.turf`, so it isn't bundled again.
                        rollupOptions: { external: ['@turf/turf'], output: { globals: { '@turf/turf': 'self.turf' } } },
                    },
                });
                const output = Array.isArray(result) ? result[0] : result;
                const chunk = 'output' in output ? output.output.find((o) => o.type === 'chunk') : undefined;
                if (chunk?.type !== 'chunk') {
                    throw new Error('sandbox-sdk-utils: sdk-utils worker bundle produced no chunk');
                }
                cachedSource = String(chunk.code);
            }
            // Named export (not default): a `export default "<code>"` string is subject to
            // default-import interop, which in some bundler paths hands the importer the
            // module namespace object (stringifying to "[object Object]") instead of the
            // string. A named binding resolves unambiguously to the string in every path.
            return `export const source = ${JSON.stringify(cachedSource)};`;
        },
    };
};
