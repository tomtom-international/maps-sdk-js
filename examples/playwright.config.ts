import { defineConfig, PlaywrightTestConfig } from '@playwright/test';
import { browserProjects } from '@testing/core-utils';

export const PROD_TEST_SERVER_PORT = 9050;

/**
 * Builds the Playwright test configuration with optional overrides.
 *
 * @param overrides Partial configuration to override defaults
 * @returns Complete PlaywrightTestConfig object
 */

export const buildPlaywrightConfig = (overrides: Partial<PlaywrightTestConfig> = {}): PlaywrightTestConfig => {
    return defineConfig({
        timeout: 60 * 1000,
        testMatch: '**/e2e-tests/**/*.test.ts',
        // Disable eval tests by default (not mature enough for CI)
        testIgnore: ['**/node_modules/**', '**/eval/**'],

        /* Fail the build on CI if you accidentally left test.only in the source code. */
        forbidOnly: !!process.env.CI,
        /* Retry on CI only */
        retries: process.env.CI ? 3 : 0,
        fullyParallel: true,
        workers: 5,
        reporter: process.env.CI ? 'list' : 'html',

        use: {
            headless: true,
            screenshot: 'only-on-failure',
            /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
            trace: 'on-first-retry',
        },

        projects: browserProjects(),

        // Keep snapshots next to test files
        snapshotPathTemplate: '{testDir}/{testFileDir}/snapshots/{arg}{ext}',

        webServer: [
            {
                command: 'pnpm start-test-server:prod',
                port: PROD_TEST_SERVER_PORT,
                reuseExistingServer: true,
                ignoreHTTPSErrors: true,
            },
        ],

        ...overrides,
    });
};

export default buildPlaywrightConfig();
