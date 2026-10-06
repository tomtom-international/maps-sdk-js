import type { Page, TestInfo } from '@playwright/test';
import { DEFAULT_MAP_LOAD_TIMEOUT, DEFAULT_MAP_SELECTOR } from './e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from './mapPaint';
import { expectNoPageErrors, recordPageErrors } from './pageErrors';
import { getExampleURL } from './sanityE2ETest';

/**
 * Asserts that the example's map loads and draws, in whichever browser the project runs.
 *
 * No snapshot: the sanity test's baselines are Chromium captures, and other engines rasterise text
 * and antialias edges their own way. A painted canvas and a clean console are what tell a map that
 * loaded from one that did not, in every engine alike.
 */
export const crossBrowserE2ETest = async ({ page, testInfo }: { page: Page; testInfo: TestInfo }) => {
    // Room for both waits to time out on their own, so a failed wait reports the page's errors below.
    testInfo.setTimeout(Math.max(testInfo.timeout, DEFAULT_MAP_LOAD_TIMEOUT * 3));
    const pageErrors = recordPageErrors(page);
    // A map that never appears usually threw while constructing (no WebGL2, say), which names the cause.
    const failWithPageErrors = (error: unknown): never => {
        expectNoPageErrors(pageErrors);
        throw error;
    };
    await enableMapReadback(page);

    await page.goto(getExampleURL(testInfo));
    await page
        .waitForSelector(`${DEFAULT_MAP_SELECTOR} canvas`, { timeout: DEFAULT_MAP_LOAD_TIMEOUT })
        .catch(failWithPageErrors);
    await waitForMapPainted(page, DEFAULT_MAP_LOAD_TIMEOUT).catch(failWithPageErrors);

    expectNoPageErrors(pageErrors);
};
