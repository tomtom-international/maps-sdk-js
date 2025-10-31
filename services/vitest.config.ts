import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';

/// <reference types="vitest" />
export default defineConfig(({ mode }) => ({
    ...commonVitestConfig,
    test: {
        ...commonVitestConfig.test,
        // For integration tests running from localhost:
        ...(!process.env.CI && { env: loadEnv(mode, '../shared-configs', '') }),
    },
    resolve: {
        alias: {
            '@tomtom-org/maps-sdk/core': 'core',
        },
    },
}));
