import { defineConfig, type ViteUserConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';

/// <reference types="vitest" />
export default defineConfig({
    ...(commonVitestConfig as ViteUserConfig),
    test: {
        ...((commonVitestConfig as ViteUserConfig).test || {}),
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts'],
    },
});
