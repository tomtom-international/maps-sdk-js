import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, DEFAULT_MAP_SELECTOR, WHOLE_PAGE_MAX_DIFF_RATIO } from './e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from './mapPaint';
import { expectNoPageErrors, recordPageErrors } from './pageErrors';
import { checkTempUiSnapshot } from './tempUiSnapshot';

export const getExampleName = (testInfo: TestInfo): string => {
    const testFilePath = testInfo.file;
    const exampleDir = path.dirname(path.dirname(testFilePath)); // from e2e-tests/sanity.test.ts to example/
    return path.basename(exampleDir);
};

/** Where the test server serves the example's `dist/prod` build. */
export const getExampleURL = (testInfo: TestInfo): string =>
    `http://localhost:${PROD_TEST_SERVER_PORT}/${getExampleName(testInfo)}/dist/prod`;

export type SanityE2ETestOptions = {
    page: Page;
    testInfo: TestInfo;
    /** Custom selector for the map element (default: #sdk-map) */
    mapSelector?: string;
    /** Custom timeout for map loading (default: 10000ms) */
    mapLoadTimeout?: number;
    /**
     * Fraction of pixels allowed to differ from the baseline (default: 0.15).
     *
     * Sized to absorb genuine map variation — traffic and incident data change between runs,
     * labels reflow, SwiftShader antialiases inconsistently — while still failing a page that
     * rendered the wrong thing: an unpainted map differs from a real baseline across its whole area.
     */
    maxDiffPixelRatio?: number;
    /**
     * Extra time to settle after the network has gone quiet, in milliseconds (default: 0).
     *
     * For the examples whose subject is *built* from what the network delivered rather than drawn
     * by it: 3D terrain meshes its elevation tiles after they arrive, and under SwiftShader that
     * takes seconds — so the shot otherwise lands on a map that is flat, which is the one thing a
     * terrain example must not be photographed as.
     */
    settleMs?: number;
    /** TEMPORARY: selector → fixed value, for elements whose content changes between runs. */
    uiPinnedValues?: Record<string, string>;
    /**
     * Whether the example draws a map at all (default: true).
     *
     * Set it false only for an example that renders no map, so the shot is not gated on one ever
     * painting. An example that does draw a map must leave it alone: a missing canvas is how a map
     * that failed to load presents itself.
     */
    rendersMap?: boolean;
};

/**
 * The standard sanity test of an example: its `dist/prod` build, shot as `upon-load.png`.
 *
 * @example
 * ```ts
 * test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
 *     await sanityE2ETest({ page, testInfo: test.info() });
 * });
 * ```
 */
export const sanityE2ETest = async (options: SanityE2ETestOptions) => {
    const {
        page,
        testInfo,
        mapSelector = DEFAULT_MAP_SELECTOR,
        mapLoadTimeout = DEFAULT_MAP_LOAD_TIMEOUT,
        maxDiffPixelRatio = WHOLE_PAGE_MAX_DIFF_RATIO,
        settleMs = 0,
        uiPinnedValues = {},
        rendersMap = true,
    } = options;

    const pageErrors = recordPageErrors(page);

    // Four waits run back to back below, each free to take up to `mapLoadTimeout` on its own.
    // The default per-test budget is that same figure, so the examples that mount several maps
    // used to run out of test before they ran out of any one wait. Budget for the chain.
    testInfo.setTimeout(Math.max(testInfo.timeout, mapLoadTimeout * 3));

    await enableMapReadback(page);
    await page.goto(getExampleURL(testInfo));
    await page.waitForSelector(mapSelector, { timeout: mapLoadTimeout });
    await page.waitForLoadState('networkidle', { timeout: mapLoadTimeout });
    if (rendersMap) await waitForMapPainted(page, mapLoadTimeout);
    // After the paint gate, not instead of it: a map that painted can still be showing a flat
    // mesh, which is what `settleMs` waits out.
    if (settleMs) await page.waitForTimeout(settleMs);

    await expect(page).toHaveScreenshot('upon-load.png', {
        maxDiffPixelRatio,
        timeout: mapLoadTimeout,
    });

    await checkTempUiSnapshot({
        page,
        testInfo,
        mapSelector,
        timeout: mapLoadTimeout,
        pinnedValues: uiPinnedValues,
    });

    expectNoPageErrors(pageErrors);
};
