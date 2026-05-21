import fs from 'node:fs';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
 * - Used for E2E testing of production-like builds
 * - Available in TT npm in case they can be used directly as demos elsewhere in TT.
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

/**
 * NOTE: This config is meant to be reused by each example.
 * All configured paths are relative to each example folder.
 */
export default defineConfig(({ mode }) => {
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
            'process.env': JSON.stringify(loadEnv(mode, path.resolve('..'), '')),
        },
    };
});
