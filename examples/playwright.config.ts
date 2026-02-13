import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';

export const buildPlaywrightConfig = (overrides: Partial<PlaywrightTestConfig> = {}): PlaywrightTestConfig => {
    return defineConfig({
        timeout: 60 * 1000,
        testMatch: '**/e2e-tests/**',
        testIgnore: ['**/node_modules/**'],

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

        projects: [
            {
                name: 'chromium',
                use: {
                    ...devices['Desktop Chrome'],
                    launchOptions: {
                        // Maps use WebGL, which requires GPU access. In headless mode there's no real GPU,
                        // so we force SwiftShader (a CPU-based WebGL renderer) and disable the GPU sandbox
                        // (which can block SwiftShader from initializing).
                        // This became necessary after Playwright v1.57 switched from Chromium to Chrome for
                        // Testing builds, which no longer enable SwiftShader by default in headless mode.
                        // See: https://github.com/microsoft/playwright/releases/tag/v1.57.0
                        // See: https://github.com/microsoft/playwright/pull/39129
                        args: ['--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
                    },
                },
            },
        ],

        // Keep snapshots next to test files
        snapshotPathTemplate: '{testDir}/{testFileDir}/snapshots/{arg}{ext}',

        webServer: {
            ignoreHTTPSErrors: true,
            command: 'pnpm start-test-server',
            port: 9050,
            reuseExistingServer: true,
        },

        ...overrides,
    });
};

export default buildPlaywrightConfig();
