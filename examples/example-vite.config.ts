import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Scripts to inject into HTML pages to provide MapLibre GL via import map.
 * This allows examples to work without bundling MapLibre GL, which facilitates caching.
 */
const MAPLIBRE_IMPORT_MAP_SCRIPTS = `
    <script src="https://unpkg.com/es-module-shims@2/dist/es-module-shims.js" integrity="sha384-o7USlJU8I1JyeAvMeiZf+GiqEE21Wqjtr+aHZ6kGgFxtp/ZhbGQvrhwSa9bQAJWf" crossorigin="anonymous" id="import-es-module-shim"></script>
    <script type="importmap" id="import-maplibre-gl">
    {
        "imports": {
            "maplibre-gl": "https://esm.sh/maplibre-gl@5"
        }
    }
    </script>
`;

// NOTE: This config is meant to be reused by each example. Thus, any configured paths are likely relatively to each example folder.
export default defineConfig(({ mode }) => {
    return {
        root: './src',
        base: './',
        build: {
            emptyOutDir: true,
            outDir: '../dist',
            rollupOptions: {
                external: ['maplibre-gl'],
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
                          filename: 'bundle-stats.html',
                          open: false,
                          gzipSize: true,
                      }),
                  ]),
            viteSingleFile(),
        ],
        server: { port: 9022 },
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
