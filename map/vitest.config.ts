import { defineConfig, type ViteUserConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';

/// <reference types="vitest" />
export default defineConfig({
    ...(commonVitestConfig as ViteUserConfig),
    resolve: {
        alias: {
            '@tomtom-org/maps-sdk/core': 'core',
        },
    },
});
