import { coverageConfigDefaults, defaultExclude, defineConfig } from 'vitest/config';
import { getSdkVersion } from './vite.config.ts';

export default defineConfig({
    define: {
        __SDK_VERSION__: getSdkVersion(),
    },
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
                // Shader sources. `src/**/*` matches them and a `?raw` import puts them in the
                // module graph, so v8 reports one uncoverable record per file — nothing a unit test
                // could ever cover, and a file Sonar then indexes off the lcov.
                '**/*.glsl',
            ],
            include: ['src/**/*'],
            provider: 'v8',
            reportOnFailure: true,
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
        },
    },
});
