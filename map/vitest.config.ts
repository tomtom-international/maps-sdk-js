import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
    return {
        test: {
            testTimeout: 10000,
        },
        resolve: {
            alias: {
                '@anw/maps-sdk-js/core': 'core',
            },
        },
    };
});
