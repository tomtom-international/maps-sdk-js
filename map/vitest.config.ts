import { defineConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';

/// <reference types="vitest" />
export default defineConfig({
    ...commonVitestConfig,
    resolve: {
        alias: {
            '@tomtom-org/maps-sdk-js/core': 'core',
        },
    },
});
