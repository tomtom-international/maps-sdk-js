import { readFileSync } from 'node:fs';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Get MapLibre GL version from pnpm-workspace.yaml catalog
const workspaceYaml = readFileSync(path.resolve(__dirname, '../pnpm-workspace.yaml'), 'utf-8');
const maplibreVersionMatch = workspaceYaml.match(/maplibre-gl:\s*\^?(\d+\.\d+\.\d+)/);
const maplibreVersion = maplibreVersionMatch ? maplibreVersionMatch[1] : '5.12.0';

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
            ...(process.env.CI
                ? []
                : [
                      visualizer({
                          filename: 'bundle-stats.html',
                          open: false,
                          gzipSize: true,
                      }),
                  ]),
            /*
              For docs portal: load MapLibre GL from CDN for caching in browser as all examples can resuse the cached maplibre.
              This only affects the built dist/index.html - local development uses node_modules as usual.
            */

            {
                name: 'inject-importmap-to-dist',
                transformIndexHtml(html: string) {
                    const importMap = `<script
                        src="https://unpkg.com/es-module-shims@2.6.2/dist/es-module-shims.js"
                        integrity="sha384-o7USlJU8I1JyeAvMeiZf+GiqEE21Wqjtr+aHZ6kGgFxtp/ZhbGQvrhwSa9bQAJWf"
                        crossorigin="anonymous">
                      </script>
                      <script type="importmap">
                        {
                          "imports": {
                            "maplibre-gl": "https://esm.sh/maplibre-gl@${maplibreVersion}"
                          }
                        }
                      </script>`;

                    // Inject in the dist/index.html
                    return html.replace('</head>', `${importMap}\n</head>`);
                },
            },
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
