import path from 'node:path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

/**
 * This is the configuration to run the server for the map integration tests.
 * * This server hosts the actual target code (with SDK) to be tested.
 * * See index.html
 */
export default defineConfig({
    server: {
        port: 9001,
        open: false,
    },
    plugins: [basicSsl()],
    resolve: {
        alias: {
            // We ensure to locally alias imports from @tomtom-org/maps-sdk/core from the SDK code itself to the locally built core package.
            // (This is for target code running on the test browser)
            '@tomtom-org/maps-sdk/core': path.resolve('../core/dist/core.es.js'),
        },
    },
    // maplibre-gl v6 loads its web worker as a separate module (maplibre-gl-worker.mjs).
    // Vite's dependency pre-bundler doesn't emit that worker into .vite/deps, so the
    // worker fails to load and the map never finishes initializing. Excluding
    // maplibre-gl from optimization lets it load from its own package where the
    // worker resolves correctly.
    optimizeDeps: {
        exclude: ['maplibre-gl'],
    },
});
