/**
 * TEMPORARY: Playbook migration.
 *
 * Holds each example's current chrome still while the CSS rename lands. Delete this file, the
 * `uiPinnedValues` option in `sanityE2ETest`, its three call sites, the `ui-temp-*.png` baselines,
 * and the upload step in `e2e-tests.yml` when done.
 */

import fs from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { expect } from '@playwright/test';

/** One changed pixel fails, and `threshold: 0` counts even a one-level colour shift as changed. */
const ZERO_TOLERANCE = { maxDiffPixels: 0, threshold: 0 };

/** The single committed baseline, captured by the Linux CI container. */
const BASELINE = 'ui-temp-upon-load.png';

type TempUiSnapshotArgs = {
    page: Page;
    testInfo: TestInfo;
    mapSelector: string;
    timeout: number;
    pinnedValues: Record<string, string>;
};

/**
 * Compares the example's own chrome at zero tolerance, with the map hidden.
 *
 * The panels are siblings of the map, so dropping the map out of the paint leaves only DOM/CSS —
 * deterministic enough to catch a recoloured surface or a shifted type scale, which the tolerant
 * whole-page shot cannot.
 */
export const checkTempUiSnapshot = async ({
    page,
    testInfo,
    mapSelector,
    timeout,
    pinnedValues,
}: TempUiSnapshotArgs): Promise<void> => {
    // The baseline is a Linux capture and macOS/Windows rasterise text differently, so a local run
    // would fail on fonts alone. Regenerate through CI — see the upload step in e2e-tests.yml.
    if (!process.env.CI) {
        recordNoComparison(testInfo, 'ui-snapshot-skipped', 'Compared in CI only, against its Linux baseline.');
        return;
    }

    await pinVaryingValues(page, pinnedValues);
    const restoreMap = await hideFromPaint(page, mapSelector);

    try {
        if (await wouldCaptureBlankBaseline(page, testInfo)) {
            recordNoComparison(
                testInfo,
                'ui-snapshot-empty',
                'Nothing is painted once the map is hidden, so there is no UI to baseline. ' +
                    'Expected for a map-only example; if this example does have chrome, it failed to render.',
            );
            return;
        }

        await expect(page).toHaveScreenshot(BASELINE, { ...ZERO_TOLERANCE, timeout });
    } finally {
        await restoreMap();
    }
};

/** Surfaces a non-comparison in the report, so it reads as skipped rather than as a silent pass. */
const recordNoComparison = (testInfo: TestInfo, type: string, description: string): void => {
    testInfo.annotations.push({ type, description });
};

/**
 * Whether comparing now would only write a blank image as the baseline.
 *
 * A blank capture passes a strict check while asserting nothing, so it must never become the
 * baseline. Once a baseline exists the comparison always runs, which is what fails a panel that
 * starts rendering blank.
 */
const wouldCaptureBlankBaseline = async (page: Page, testInfo: TestInfo): Promise<boolean> => {
    const hasBaseline = fs.existsSync(testInfo.snapshotPath(BASELINE, { kind: 'screenshot' }));
    return !hasBaseline && !(await hasPaintedUi(page));
};

/**
 * Drops an element out of the paint but keeps its layout box, unlike Playwright's viewport-wide
 * `mask`. Returns the undo.
 */
const hideFromPaint = async (page: Page, selector: string): Promise<() => Promise<void>> => {
    const styleTag = await page.addStyleTag({ content: `${selector} { visibility: hidden !important; }` });
    return () => styleTag.evaluate((node: HTMLStyleElement) => node.remove());
};

/** Pins values that vary per run (a clock, a date derived from today) so only their styling is compared. */
const pinVaryingValues = (page: Page, values: Record<string, string>) =>
    page.evaluate((entries: [string, string][]) => {
        for (const [selector, text] of entries) {
            for (const element of document.querySelectorAll(selector)) {
                // Form controls render `value`; everything else renders its text.
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    element.value = text;
                } else {
                    element.textContent = text;
                }
            }
        }
    }, Object.entries(values));

/** Whether anything is still painted once the map is hidden — map-only examples leave a blank page. */
const hasPaintedUi = (page: Page): Promise<boolean> =>
    page.evaluate(() => {
        for (const element of document.body.querySelectorAll('*')) {
            if (element instanceof HTMLScriptElement || element instanceof HTMLStyleElement) continue;
            const style = getComputedStyle(element);
            // `visibility` inherits, so the hidden map's descendants are excluded with it.
            if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue;
            const { width, height } = element.getBoundingClientRect();
            if (width > 0 && height > 0) return true;
        }
        return false;
    });
