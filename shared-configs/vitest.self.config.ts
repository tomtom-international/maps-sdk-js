import { coverageConfigDefaults, defaultExclude, defineConfig } from 'vitest/config';

/**
 * Config for this package's *own* tests.
 *
 * `vitest.config.ts` next to it is the base the SDK packages spread into theirs, and it scopes
 * coverage to `src/**` — shared-configs keeps its sources at the package root, so it needs its
 * own include. Kept as a separate file rather than an override in the base so nothing here can
 * change what core, services, map or the plugins measure.
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: [...defaultExclude, '**/e2e-tests/**'],
        coverage: {
            // The notice generators, plus the fixture builder the tests drive them through.
            // The rest of the directory is build plumbing — config objects, vite plugins and a
            // `process.argv` entry point — exercised by `pnpm build:sdk`, not by unit tests.
            include: ['thirdPartyNotices.ts', 'thirdPartyAggregation.ts', 'tests/fixtures.ts'],
            exclude: [...coverageConfigDefaults.exclude, '**/*.test.ts'],
            provider: 'v8',
            reportOnFailure: true,
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
        },
    },
});
