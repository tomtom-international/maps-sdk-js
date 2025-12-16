import { defineConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';

/// <reference types="vitest" />
export default defineConfig({
    ...commonVitestConfig,
    test: {
        ...(commonVitestConfig.test || {}),
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts'],
    },
});
