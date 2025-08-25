import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

/**
 * Read environment variables from file if we're in localhost.
 * https://github.com/motdotla/dotenv
 */
if (!process.env.CI) {
    dotenv.config({ path: '../test-config/.env' });
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    timeout: 60 * 1000,
    testDir: './src/tests',
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    fullyParallel: true,
    workers: 2,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? 'list' : 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        ignoreHTTPSErrors: true,
        headless: true,
        screenshot: 'only-on-failure',
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'https://localhost:9001/',
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

    /* Run your local dev server before starting the tests */
    webServer: {
        ignoreHTTPSErrors: true,
        command: 'pnpm start-webpack-dev-server',
        url: 'https://localhost:9001/',
        reuseExistingServer: true,
    },
});
