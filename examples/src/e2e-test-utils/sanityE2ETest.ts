import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import path from 'path';
import { PROD_TEST_SERVER_PORT, SANDPACK_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, DEFAULT_MAP_SELECTOR, TAG_PROD, TAG_SANDPACK } from './e2eTestConstants';

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
 * // Test production build
 * sanityE2ETest({ page, testType: 'prod' });
 *
 * // Test via Sandpack (shared test harness)
 * sanityE2ETest({ page, testType: 'sandpack', exampleDirectory: 'default-map' });
 * ```
 */
export const sanityE2ETest = async (options: SanityE2ETestOptions) => {
    const {
        page,
        testInfo,
        mapSelector = DEFAULT_MAP_SELECTOR,
        mapLoadTimeout = DEFAULT_MAP_LOAD_TIMEOUT,
        maxDiffPixelRatio = 0.2,
    } = options;

    const tags = testInfo.tags;

    if (tags.includes(TAG_SANDPACK)) {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        const url = `http://localhost:${SANDPACK_TEST_SERVER_PORT}/${getExampleName(testInfo)}/dist/sandpack/`;
        await page.goto(url);
        // Log any console errors for debugging
        await page.waitForTimeout(2000);

        await page.waitForSelector('.cm-editor', { timeout: mapLoadTimeout });
        await page.waitForTimeout(2000);
        await page.waitForSelector('.sp-loading', { state: 'hidden', timeout: mapLoadTimeout });
        await page
            .frameLocator('.sp-preview-iframe')
            .locator(mapSelector)
            .waitFor({ state: 'visible', timeout: mapLoadTimeout })
            .catch(() => {});
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot('upon-load-sandpack.png', {
            maxDiffPixelRatio,
            timeout: mapLoadTimeout,
        });
    }

    if (tags.includes(TAG_PROD)) {
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/${getExampleName(testInfo)}/dist/prod`);
        await page.waitForSelector(mapSelector, { timeout: mapLoadTimeout });
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle', { timeout: mapLoadTimeout });

        await expect(page).toHaveScreenshot('upon-load.png', {
            maxDiffPixelRatio,
            timeout: mapLoadTimeout,
        });
    }
};
