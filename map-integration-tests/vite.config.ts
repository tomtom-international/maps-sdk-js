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
            // We ensure to locally alias imports from @cet/maps-sdk-js/core from the SDK code itself to the locally built core package.
            // (This is for target code running on the test browser)
            '@cet/maps-sdk-js/core': path.resolve('../core/dist/core.es.js'),
        },
    },
});
