import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 9001,
        open: false,
    },
    plugins: [basicSsl()],
    resolve: {
        alias: {
            // We ensure to locally alias imports from @cet/maps-sdk-js/core from the SDK code itself to the locally built core package.
            '@cet/maps-sdk-js/core': path.resolve('../core/dist/core.es.js'),
        },
    },
});
