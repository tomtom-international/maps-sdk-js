import type { Page } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_SELECTOR, WHOLE_PAGE_MAX_DIFF_RATIO } from './e2eTestConstants';
import { enableMapReadback, SURFACES_SETTLE_MS, waitForMapPainted } from './mapPaint';
import { recordPageErrors } from './pageErrors';

const LOAD_TIMEOUT_MS = 30_000;
const NETWORK_IDLE_MS = 10_000;

// After the map first paints: traffic tubes and signs arrive later, and an effect composites a frame after them.
const SETTLE_MS = 6000;

/** The sanity test's whole-page tolerance, on a clock sized to one shot rather than a whole load. */
export const EXTRA_SHOT_OPTIONS = { maxDiffPixelRatio: WHOLE_PAGE_MAX_DIFF_RATIO, timeout: LOAD_TIMEOUT_MS } as const;

// The longest `loadProdExample` takes: the canvas, the network going idle, the first paint and the settle.
const LOAD_MAX_MS = LOAD_TIMEOUT_MS + NETWORK_IDLE_MS + LOAD_TIMEOUT_MS + SETTLE_MS;

/**
 * A test timeout that fits `loadProdExample`, then `waits` waits for the map to hold still, each up to
 * `settleMs` ({@link SURFACES_SETTLE_MS}, as `waitForSurfacesStill` takes), and `shots` shots, each up
 * to `shotMs` ({@link EXTRA_SHOT_OPTIONS}' timeout), and 15 s for the steps between them, so a slow map
 * fails in its own words rather than as a bare timeout.
 */
export const surfacesTestTimeout = (
    waits: number,
    shots: number,
    { settleMs = SURFACES_SETTLE_MS, shotMs = EXTRA_SHOT_OPTIONS.timeout }: { settleMs?: number; shotMs?: number } = {},
): number => LOAD_MAX_MS + waits * settleMs + shots * shotMs + 15_000;

/**
 * Loads an example's prod build for the shots its sanity test does not take, and returns the errors
 * the page reports from then on, for `expectNoPageErrors`.
 *
 * @param hash - Appended after `#`, e.g. a `zoom/lat/lng` view for a map with `hash` enabled.
 */
export const loadProdExample = async (page: Page, exampleName: string, hash?: string): Promise<string[]> => {
    const pageErrors = recordPageErrors(page);

    await enableMapReadback(page);
    await page.goto(
        `http://localhost:${PROD_TEST_SERVER_PORT}/${exampleName}/dist/prod/index.html${hash ? `#${hash}` : ''}`,
    );
    await page.waitForSelector(`${DEFAULT_MAP_SELECTOR} canvas`, { timeout: LOAD_TIMEOUT_MS });
    // Best-effort: a live map can keep the page busy past it, and the paint gate is what the shot needs.
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {});
    await waitForMapPainted(page, LOAD_TIMEOUT_MS);
    await page.waitForTimeout(SETTLE_MS);

    return pageErrors;
};
