import fs from 'node:fs';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolveExampleEnv } from './exampleBuildEnv.ts';

const workspaceYaml = fs.readFileSync(path.resolve(import.meta.dirname, '../pnpm-workspace.yaml'), 'utf-8');
const maplibreVersion = new RegExp(/maplibre-gl:\s*\^?([\d.]+)/).exec(workspaceYaml)?.[1];
if (!maplibreVersion) {
    throw new Error('Could not find maplibre-gl version in pnpm-workspace.yaml');
}

// Pinned to an exact version: unpkg resolves a floating `@2` to the newest 2.x, so any
// 2.x release invalidates the `integrity` hash and the browser blocks the shim (the map
// still renders — browsers support import maps natively — but the console fills with SRI
// errors and older browsers lose the fallback). Bump both together; the hash is
// `openssl dgst -sha384 -binary dist/es-module-shims.js | openssl base64 -A`.
const ES_MODULE_SHIMS_VERSION = '2.8.4';
const ES_MODULE_SHIMS_INTEGRITY = 'sha384-XCYz0V79m/Nex83lKvfhMD2R7JHcINUuKrEt+xEoNmakEsh354CNM0h2mNT7xJqq';

/**
 * Vite configuration for building production example applications.
 *
 * This builds standalone, minified, single-file HTML applications for each
 * example in dist/prod/. These are:
 * - Deployable demo applications
 * - The bundles the docs portal renders for each example page
 * - Used for E2E testing of production-like builds
 *
 * These builds are fully optimized with minification for production use.
 * They use import maps to externalize MapLibre GL for better caching.
 */

/**
 * Scripts to inject into HTML pages to provide MapLibre GL via import map.
 * This allows examples to work without bundling MapLibre GL, which facilitates caching.
 *
 * The map target must be the package's published `dist/maplibre-gl.mjs` served verbatim,
 * NOT a re-bundling CDN such as esm.sh. v6 splits its web worker into a sibling
 * `dist/maplibre-gl-worker.mjs` that it locates at runtime through `import.meta.url`;
 * esm.sh serves the entry from a rewritten path (`/es2022/maplibre-gl.mjs`) where that
 * sibling doesn't exist, so the worker 404s and the map paints a blank background.
 * jsDelivr mirrors the tarball as-is, so both the worker and the shared chunk resolve.
 */
const MAPLIBRE_IMPORT_MAP_SCRIPTS = `
    <script src="https://unpkg.com/es-module-shims@${ES_MODULE_SHIMS_VERSION}/dist/es-module-shims.js" integrity="${ES_MODULE_SHIMS_INTEGRITY}" crossorigin="anonymous" id="import-es-module-shim"></script>
    <script type="importmap" id="import-maplibre-gl">
    {
        "imports": {
            "maplibre-gl": "https://cdn.jsdelivr.net/npm/maplibre-gl@${maplibreVersion}/dist/maplibre-gl.mjs"
        }
    }
    </script>
`;

// The demos-proxy session bootstrap — the SAME file Sandpack mounts as raw text
// (see injectDemosProxyBootstrap in src/sandpack/sandpackUtils.ts); here it is
// bundled from source by the inject-demos-proxy-bootstrap plugin below.
const DEMOS_PROXY_BOOTSTRAP_PATH = path.resolve(import.meta.dirname, 'src/demos-proxy/demosProxyBootstrap.ts');

/**
 * NOTE: This config is meant to be reused by each example.
 * All configured paths are relative to each example folder.
 */
export default defineConfig(({ mode }) => {
    // Allowlisted, secret-redacted env shared with the Sandpack build (see
    // exampleBuildEnv.ts) — without it these bundles baked the ENTIRE CI
    // environment. `demosProxyMode` (both DEMOS_PROXY_URL + HCAPTCHA_SITEKEY set)
    // gates the bootstrap injection below, and `define` bakes the bootstrap's own
    // `process.env` reads into literals.
    const { define: exposedEnv, demosProxyMode } = resolveExampleEnv(mode, path.resolve('..'));
    // Resolved build root (= the example's ./src), captured in configResolved
    // and used to identify the entry module for the bootstrap injection below.
    let entryRoot = '';

    return {
        root: './src',
        base: './',
        // `develop` serves maplibre-gl from node_modules (the import map above only takes
        // effect in the built bundles, where maplibre-gl is external). v6 loads its web
        // worker as a separate module (maplibre-gl-worker.mjs) that Vite's pre-bundler
        // doesn't emit into .vite/deps, so the worker fails and the map never finishes
        // initializing — a blank map. Same exclusion as map-integration-tests.
        optimizeDeps: {
            exclude: ['maplibre-gl'],
        },
        build: {
            emptyOutDir: true,
            outDir: '../dist/prod',
            minify: 'terser',
            rolldownOptions: {
                external: ['maplibre-gl'],
                onLog: (level, log, defaultHandler) => {
                    // Suppress warnings about pure annotations, which are used in the SDK codebase and have no significant impact here.
                    if (log.message.includes('/* @__PURE__ */')) {
                        return;
                    }
                    defaultHandler(level, log);
                },
                output: {
                    globals: {
                        'maplibre-gl': 'maplibregl',
                    },
                },
            },
        },

        plugins: [
            {
                name: 'inject-maplibre-import-map',
                transformIndexHtml(html) {
                    return html.replace('</head>', `${MAPLIBRE_IMPORT_MAP_SCRIPTS}</head>`);
                },
            },
            {
                // Demos-proxy mode: prepend a bare side-effect import of the
                // demos-proxy session bootstrap to the example's ENTRY module, so
                // it runs before anything else in that graph (Sandpack anchors on
                // config.ts instead, see injectDemosProxyBootstrap). A real
                // import, because a transformIndexHtml <script> is not bundled
                // and an injected `install()` call would run too late.
                name: 'inject-demos-proxy-bootstrap',
                enforce: 'pre',
                configResolved(resolved) {
                    entryRoot = resolved.root;
                },
                transform(code, id) {
                    if (!demosProxyMode || !entryRoot) return null;
                    const file = id.split('?')[0];
                    const isEntry =
                        path.resolve(path.dirname(file)) === path.resolve(entryRoot) &&
                        /^index\.(ts|tsx)$/.test(path.basename(file));
                    return isEntry
                        ? { code: `import ${JSON.stringify(DEMOS_PROXY_BOOTSTRAP_PATH)};\n${code}`, map: null }
                        : null;
                },
            },
            ...(process.env.CI
                ? []
                : [
                      visualizer({
                          filename: 'bundle-stats-prod.html',
                          open: false,
                          gzipSize: true,
                      }),
                  ]),
            viteSingleFile({ removeViteModuleLoader: true }),
        ],
        resolve: {
            alias: {
                // We ensure to locally alias imports from @tomtom-org/maps-sdk/core from the SDK code itself to the locally built core package.
                '@tomtom-org/maps-sdk/core': path.resolve('../../core/dist/core.es.js'),
            },
        },
        define: {
            'process.env': JSON.stringify(exposedEnv),
            global: 'globalThis',
        },
    };
});
