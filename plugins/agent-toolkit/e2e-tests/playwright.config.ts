import { defineConfig, devices } from '@playwright/test';

// Runs the harness app (Vite dev server) and drives it from a real Chromium so the
// iframe-worker sandbox executes under genuine browser CSP / opaque-origin / Worker
// semantics — the isolation guarantees that the Node unit tests cannot exercise.
//
// Standalone (not the `examples/playwright.config.ts` factory): `plugins/` must not
// depend on `examples/`, this harness needs no map (so no WebGL/SwiftShader args) and
// runs a single server rather than the examples' prod+sandpack pair. It does mirror
// that factory's CI conventions below. Specs use `.spec.ts` (not the examples' e2e
// `.test.ts`) to stay distinct from the package's Vitest `*.test.ts` unit files.
const PORT = 5191;

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI, // fail CI if a `test.only` was left in
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'list' : 'html',
    use: {
        baseURL: `http://localhost:${PORT}`,
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        // A named package script (resolved by pnpm to the defining package and run
        // from its root) starts the harness reliably regardless of how/where Playwright
        // launches the webServer — `pnpm exec vite` / a bare `vite` fail to resolve the
        // binary because the spawn cwd (this config's dir) isn't a package. Mirrors the
        // `pnpm start-test-server` pattern in map-integration-tests.
        command: 'pnpm test:e2e:server',
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
