import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import path from 'path';
import { DEFAULT_MAP_LOAD_TIMEOUT, DEFAULT_MAP_SELECTOR } from './e2eTestConstants';

const getExampleName = (testInfo: TestInfo): string => {
    const testFilePath = testInfo.file;
    const exampleDir = path.dirname(path.dirname(testFilePath)); // from e2e-tests/sanity.test.ts to example/
    return path.basename(exampleDir);
};

export type SanityE2ETestOptions = {
    page: Page;
    testInfo: TestInfo;
    /** Custom selector for the map element (default: #sdk-map) */
    mapSelector?: string;
    /** Custom timeout for map loading (default: 10000ms) */
    mapLoadTimeout?: number;
    maxDiffPixelRatio?: number;
};

/**
 * Creates a standard sanity test for an example.
 * This is the main function to use when creating tests for individual examples.
 *
 * @example
 * ```ts
 * // In examples/default-map/e2e-tests/sanity.spec.ts
 * import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';
 *
 * // No hard-coded name: the helper will infer the example directory from the test file path
 * sanityE2ETest({});
 * ```
 */
export const sanityE2ETest = async (options: SanityE2ETestOptions) => {
    const {
        page,
        testInfo,
        mapSelector = DEFAULT_MAP_SELECTOR,
        mapLoadTimeout = DEFAULT_MAP_LOAD_TIMEOUT,
        maxDiffPixelRatio = 0.1,
    } = options;

    await page.goto(`/${getExampleName(testInfo)}/dist`);
    await page.waitForLoadState('networkidle', { timeout: mapLoadTimeout });
    await page.waitForSelector(mapSelector, { timeout: mapLoadTimeout });
    await page.waitForTimeout(1000); // Allow time for map tiles to load

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('upon-load.png', {
        maxDiffPixelRatio,
        timeout: mapLoadTimeout,
    });
};
