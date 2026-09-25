import { defineConfig, devices } from '@playwright/test';
import { HARNESS_PORT } from './harnessPort';

// The visual suite: the plugin's effects over a synthetic map, in a real Chromium.
//
// A browser is not a convenience here. `backdrop-filter` and `mix-blend-mode` are compositor
// properties and appear in no element's own pixels, and the depth of field is a WebGL pass — so
// neither half of this plugin can be measured in jsdom, and both are photographed rather than read
// back off a canvas.
//
// Standalone (not the `examples/playwright.config.ts` factory): `plugins/` must not depend on
// `examples/`, and this harness serves one page of its own rather than the examples' prod/sandpack
// pair. Specs use `.spec.ts` to stay distinct from the package's Vitest `*.test.ts` unit files.

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI, // fail CI if a `test.only` was left in
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'list' : 'html',
    use: {
        baseURL: `http://localhost:${HARNESS_PORT}`,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // A device ratio of 1, so a length in the catalogue's CSS pixels is a length in the
                // shot's pixels and a measurement in rows is a measurement in rows.
                deviceScaleFactor: 1,
                launchOptions: {
                    // SwiftShader rather than a GPU, as every other Playwright project here: it is
                    // what makes the depth-of-field pass render at all in a headless container, and
                    // what makes it render the same picture on every machine.
                    args: ['--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
                },
            },
        },
    ],
    webServer: {
        // A named package script, so pnpm resolves the binary from the package root however
        // Playwright spawns it — the pattern the other suites here use.
        command: 'pnpm test:e2e:server',
        url: `http://localhost:${HARNESS_PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
