import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
    return {
        test: {
            testTimeout: 10000, // We have a generous test timeout mostly for integration tests
            // For integration tests running from localhost:
            ...(!process.env.CI && { env: loadEnv(mode, '../test-config', '') }),
        },
        resolve: {
            alias: {
                '@anw/maps-sdk-js/core': 'core',
            },
        },
    };
});
