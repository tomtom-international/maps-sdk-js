import { expect, vi } from 'vitest';

/**
 * A longer timeout for the `*Integration.test.ts` suites, which call the live TomTom API rather
 * than a mock. Their variable is the network, not the code: locally each request takes 0.7–3s, but
 * a CI runner sharing bandwidth — or the API itself queueing — pushes some past the 10s default and
 * fails the build for reasons no change in this repo can influence.
 *
 * Keyed on the filename so a new integration suite inherits it without anyone remembering to.
 * Retries are set alongside, in `vitest.config.ts`: `vi.setConfig` accepts `retry` at runtime but
 * does not type it, and silently losing retries to a vitest upgrade is exactly the kind of
 * regression this is meant to prevent.
 */
if (expect.getState().testPath?.includes('Integration.test.ts')) {
    vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });
}
