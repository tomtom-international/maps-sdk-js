import path from 'node:path';
import { defineConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config';
import { sandpackTailwindPlugin } from './src/sandpack/tailwindPlugin';

/// <reference types="vitest" />
export default defineConfig({
    ...commonVitestConfig,
    // `sandpackUtils.ts` imports `virtual:sandpack-tailwind`; the plugin needs to be active
    // during tests too or the module resolver throws at import time.
    plugins: [sandpackTailwindPlugin({ examplesDir: path.resolve(__dirname) })],
    test: {
        ...(commonVitestConfig.test || {}),
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts'],
        exclude: ['**/e2e-tests/**'],
    },
});
