import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';
import { PROD_TEST_SERVER_PORT, SANDPACK_TEST_SERVER_PORT } from '../../playwright.config';
import {
    DEFAULT_MAP_LOAD_TIMEOUT,
    DEFAULT_MAP_SELECTOR,
    TAG_PROD,
    TAG_SANDPACK,
    WHOLE_PAGE_MAX_DIFF_RATIO,
} from './e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from './mapPaint';
import { checkTempUiSnapshot } from './tempUiSnapshot';

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
    /**
     * Fraction of pixels allowed to differ from the baseline (default: 0.15).
     *
     * Sized to absorb genuine map variation — traffic and incident data change between runs,
     * labels reflow, SwiftShader antialiases inconsistently — while still failing a preview that
     * rendered the wrong thing. A Sandpack error panel or an unpainted map differs from a real
     * baseline across the whole preview pane (~35% of the shot), so it can no longer slip through.
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
        maxDiffPixelRatio = WHOLE_PAGE_MAX_DIFF_RATIO,
        settleMs = 0,
        uiPinnedValues = {},
        rendersMap = true,
    } = options;

    const tags = testInfo.tags;

    if (tags.includes(TAG_SANDPACK)) {
        // Sandpack downloads deps + transpiles the example in-browser, which is far
        // slower and more variable in CI than the prebuilt prod bundle — especially for
        // the heavier agent examples. The flow below chains several waits that each may
        // run up to `mapLoadTimeout`, so a single slow-bundling step could otherwise
        // blow the default per-test timeout and get the page torn down mid-wait (the
        // observed CI flake). Give the whole test a budget comfortably larger than any
        // one step so slow-but-successful bundles still complete.
        testInfo.setTimeout(Math.max(testInfo.timeout, mapLoadTimeout * 4));

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

        // The map element being attached doesn't mean its tiles have painted. The prod
        // path gates its screenshot on `networkidle`; the Sandpack path didn't, so a
        // half-rendered preview (blank/loading map) could be snapshotted — the main
        // remaining flake for the heavier agent examples, whose preview mounts slowly.
        // Wait for the PREVIEW frame's own network to settle (tile requests) before
        // snapshotting. Best-effort: the preview iframe can be cross-origin/inaccessible
        // or keep a connection open, so fall back to the fixed settle below on timeout.
        const previewFrame = await (await page.locator('.sp-preview-iframe').elementHandle())?.contentFrame();
        await previewFrame?.waitForLoadState('networkidle', { timeout: mapLoadTimeout }).catch(() => {});

        await page.waitForTimeout(2000 + settleMs);
        await expect(page).toHaveScreenshot('upon-load-sandpack.png', {
            maxDiffPixelRatio,
            timeout: mapLoadTimeout,
        });
    }

    if (tags.includes(TAG_PROD)) {
        // Four waits run back to back below, each free to take up to `mapLoadTimeout` on its own.
        // The default per-test budget is that same figure, so the examples that mount several maps
        // used to run out of test before they ran out of any one wait. Budget for the chain.
        testInfo.setTimeout(Math.max(testInfo.timeout, mapLoadTimeout * 3));

        await enableMapReadback(page);
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/${getExampleName(testInfo)}/dist/prod`);
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
    }
};
