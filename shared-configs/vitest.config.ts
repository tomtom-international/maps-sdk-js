import { coverageConfigDefaults, defaultExclude, defineConfig } from 'vitest/config';

/// <reference types="vitest" />
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        passWithNoTests: true,
        testTimeout: 10000,
        exclude: [...defaultExclude, '**/e2e-tests/**'],
        coverage: {
            exclude: [
                ...coverageConfigDefaults.exclude,
                '**/*.test.ts',
                '**/*.test.js',
                '**/*.data.ts',
                '**/node_modules/**',
                '**/dist/**',
                '**/vite.*',
            ],
            include: ['src/**/*'],
            provider: 'v8',
            enabled: true,
            reportOnFailure: true,
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
        },
    },
});
