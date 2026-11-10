import { defineConfig } from 'vitest/config';

// Unit tests only — pure utilities under src, in node. The example's vite config is not loaded.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
    },
});
