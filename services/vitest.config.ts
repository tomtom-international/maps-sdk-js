import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import commonVitestConfig from '../shared-configs/vitest.config.ts';

/// <reference types="vitest" />
export default defineConfig(({ mode }) => ({
    ...commonVitestConfig,
    test: {
        ...commonVitestConfig.test,
        // For integration tests running from localhost:
        ...(!process.env.CI && { env: loadEnv(mode, '../shared-configs', '') }),
        // Raises the timeout for the live-API suites — see the file.
        setupFiles: ['./liveApiTestSetup.ts'],
        // For those same suites: a throttled or dropped call should not fail the build. Set here
        // rather than per-file because `retry` is a config option, not a runtime one. It cannot
        // mask a defect in the mocked unit tests this also covers — those are deterministic, so a
        // real break fails all three attempts.
        retry: 2,
    },
    resolve: {
        alias: {
            '@tomtom-org/maps-sdk/core': 'core',
        },
    },
}));
