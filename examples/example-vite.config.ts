import fs from 'node:fs';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolveExampleEnv } from './exampleBuildEnv';

const workspaceYaml = fs.readFileSync(path.resolve(__dirname, '../pnpm-workspace.yaml'), 'utf-8');
const maplibreVersion = new RegExp(/maplibre-gl:\s*\^?([\d.]+)/).exec(workspaceYaml)?.[1];
if (!maplibreVersion) {
    throw new Error('Could not find maplibre-gl version in pnpm-workspace.yaml');
}

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
 */
const MAPLIBRE_IMPORT_MAP_SCRIPTS = `
    <script src="https://unpkg.com/es-module-shims@2/dist/es-module-shims.js" integrity="sha384-bu2JOhhs+024VlJUbPyr/5SY9ReRMZ1BTeZylHd9WKeTFKd2EK1bFTfOMrYe5NPo" crossorigin="anonymous" id="import-es-module-shim"></script>
    <script type="importmap" id="import-maplibre-gl">
    {
        "imports": {
            "maplibre-gl": "https://esm.sh/maplibre-gl@${maplibreVersion}"
        }
    }
    </script>
`;

// Absolute path to the Demo-BFF proxy bootstrap — the SAME file Sandpack injects
// as raw text (see sandpackUtils.ts). In proxy mode it's bundled into each standalone
// example via the inject-proxy-bootstrap plugin below.
const PROXY_BOOTSTRAP_PATH = path.resolve(__dirname, 'src/proxy/proxyBootstrap.ts');

/**
 * NOTE: This config is meant to be reused by each example.
 * All configured paths are relative to each example folder.
 */
export default defineConfig(({ mode }) => {
    // Allowlisted, proxy-redacted env shared with the Sandpack build (see
    // exampleBuildEnv.ts). Without it these standalone bundles baked the ENTIRE
    // CI environment. `proxyMode` (both DEMO_BFF_URL + HCAPTCHA_SITEKEY set)
    // also gates whether the session bootstrap is injected.
    const { define: exposedEnv, proxyMode } = resolveExampleEnv(mode, path.resolve('..'));
    // Resolved build root (= the example's ./src), captured in configResolved
    // and used to identify the entry module for the bootstrap injection below.
    let entryRoot = '';

    return {
        root: './src',
        base: './',
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
                // Proxy mode: prepend an import of the Demo-BFF session bootstrap
                // to the example's entry module so it's bundled and runs before
                // any SDK call — establishing the session + wrapping fetch, the
                // same behaviour Sandpack gets. Reuses proxyBootstrap.ts verbatim.
                // NOTE: a transformIndexHtml-injected inline <script> is NOT
                // processed by the bundler (its imports never resolve), so we
                // prepend a real import into the module graph instead. Not
                // injected outside proxy mode.
                name: 'inject-proxy-bootstrap',
                enforce: 'pre',
                configResolved(resolved) {
                    entryRoot = resolved.root;
                },
                transform(code, id) {
                    if (!proxyMode || !entryRoot) return null;
                    const file = id.split('?')[0];
                    const isEntry =
                        path.resolve(path.dirname(file)) === path.resolve(entryRoot) &&
                        /^index\.(ts|tsx)$/.test(path.basename(file));
                    return isEntry
                        ? { code: `import ${JSON.stringify(PROXY_BOOTSTRAP_PATH)};\n${code}`, map: null }
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
        },
    };
});
