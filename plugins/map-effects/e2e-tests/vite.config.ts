import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { HARNESS_PORT } from './harnessPort';

// Serves the visual harness from source: the specs measure the plugin as it is written, so a
// change to a shader or an overlay is under test the moment it is saved, with no build in between.
export default defineConfig({
    root: resolve(import.meta.dirname, 'app'),
    resolve: {
        alias: [
            // The plugin's own type-only imports of the SDK, resolved to the monorepo sources.
            { find: '@tomtom-org/maps-sdk/core', replacement: resolve(import.meta.dirname, '../../../core/index.ts') },
            { find: '@tomtom-org/maps-sdk/map', replacement: resolve(import.meta.dirname, '../../../map/index.ts') },
            {
                find: '@tomtom-org/maps-sdk/services',
                replacement: resolve(import.meta.dirname, '../../../services/index.ts'),
            },
        ],
    },
    server: { port: HARNESS_PORT },
});
