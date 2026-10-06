import type { Page } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_SELECTOR, WHOLE_PAGE_MAX_DIFF_RATIO } from './e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from './mapPaint';

const LOAD_TIMEOUT_MS = 30_000;
const NETWORK_IDLE_MS = 10_000;

// After the map first paints: traffic tubes and signs arrive later, and an effect composites a frame after them.
const SETTLE_MS = 6000;

/** The sanity test's whole-page tolerance, on a clock sized to one shot rather than a whole load. */
export const EXTRA_SHOT_OPTIONS = { maxDiffPixelRatio: WHOLE_PAGE_MAX_DIFF_RATIO, timeout: LOAD_TIMEOUT_MS } as const;

/**
 * Loads an example's prod build for the shots its sanity test does not take, and returns the console
 * errors it logs from then on.
 *
 * @param hash - Appended after `#`, e.g. a `zoom/lat/lng` view for a map with `hash` enabled.
 */
export const loadProdExample = async (page: Page, exampleName: string, hash?: string): Promise<string[]> => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await enableMapReadback(page);
    await page.goto(
        `http://localhost:${PROD_TEST_SERVER_PORT}/${exampleName}/dist/prod/index.html${hash ? `#${hash}` : ''}`,
    );
    await page.waitForSelector(`${DEFAULT_MAP_SELECTOR} canvas`, { timeout: LOAD_TIMEOUT_MS });
    // Best-effort: a live map can keep the page busy past it, and the paint gate is what the shot needs.
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {});
    await waitForMapPainted(page, LOAD_TIMEOUT_MS);
    await page.waitForTimeout(SETTLE_MS);

    return consoleErrors;
};
