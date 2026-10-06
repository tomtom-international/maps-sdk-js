import fs from 'node:fs';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type Plugin } from 'vite';
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
const MAPLIBRE_CDN_DIST = `https://cdn.jsdelivr.net/npm/maplibre-gl@${maplibreVersion}/dist`;
const MAPLIBRE_IMPORT_MAP_SCRIPTS = `
    <script src="https://unpkg.com/es-module-shims@${ES_MODULE_SHIMS_VERSION}/dist/es-module-shims.js" integrity="${ES_MODULE_SHIMS_INTEGRITY}" crossorigin="anonymous" id="import-es-module-shim"></script>
    <script type="importmap" id="import-maplibre-gl">
    {
        "imports": {
            "maplibre-gl": "${MAPLIBRE_CDN_DIST}/maplibre-gl.mjs"
        }
    }
    </script>
`;

// The demos-proxy session bootstrap, bundled from source by the
// inject-demos-proxy-bootstrap plugin below. The live-editor build mounts the
// SAME file as raw text (see injectDemosProxyBootstrap).
const DEMOS_PROXY_BOOTSTRAP_PATH = path.resolve(import.meta.dirname, 'src/demos-proxy/demosProxyBootstrap.ts');

/**
 * The MapLibre worker Vite builds from the entry the SDK hands it (`registerMapLibreWorker`) is a file of its own,
 * which viteSingleFile leaves beside the page; a blob URL of its source keeps the page one file, its worker resolving
 * wherever the page is served.
 */
const inlineMapLibreWorker = (): Plugin => ({
    name: 'inline-maplibre-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
        for (const worker of Object.values(bundle)) {
            if (worker.type !== 'asset' || !/^maplibre-gl-worker-[\w-]+\.js$/.test(worker.fileName)) {
                continue;
            }
            const source = typeof worker.source === 'string' ? worker.source : new TextDecoder().decode(worker.source);
            const blobUrl = `URL.createObjectURL(new Blob([${JSON.stringify(source)}],{type:"text/javascript"}))`;
            for (const chunk of Object.values(bundle)) {
                if (chunk.type === 'chunk') {
                    chunk.code = chunk.code.replaceAll(JSON.stringify(worker.fileName), blobUrl);
                }
            }
            delete bundle[worker.fileName];
        }
    },
});

/**
 * NOTE: This config is meant to be reused by each example.
 * All configured paths are relative to each example folder.
 */
export default defineConfig(({ mode }) => {
    // Allowlisted, secret-redacted env shared with the live-editor build (see
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
        // The SDK's worker entry imports MapLibre's worker from the CDN (alias below), which only an ES worker keeps.
        worker: { format: 'es' },
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
            inlineMapLibreWorker(),
            {
                // Demos-proxy mode: prepend a bare side-effect import of the
                // demos-proxy session bootstrap to the example's ENTRY module, so
                // it runs before anything else in that graph (the live editor anchors on
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
                // The SDK's worker entry loads MapLibre's worker from the import map's CDN copy, not node_modules.
                'maplibre-gl/dist/maplibre-gl-worker.mjs': `${MAPLIBRE_CDN_DIST}/maplibre-gl-worker.mjs`,
            },
        },
        define: {
            'process.env': JSON.stringify(exposedEnv),
            global: 'globalThis',
        },
    };
});
