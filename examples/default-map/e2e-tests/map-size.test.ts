import { expect, test } from '@playwright/test';
import { crossBrowserE2ETest } from '../../src/e2e-test-utils/crossBrowserE2ETest';
import { DEFAULT_MAP_SELECTOR, TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

// Playwright hides scrollbars by default; a styled one takes layout space, as on Windows. A file of its
// own, as a launch option applies to a whole worker.
test.use({
    launchOptions: async ({ launchOptions }, use) =>
        use({ ...launchOptions, ignoreDefaultArgs: ['--hide-scrollbars'] }),
});

test('the map fills the page when scrollbars take up layout space', { tag: TAG_PROD }, async ({ page }) => {
    // At `interactive`, before the example's module script builds the map.
    await page.addInitScript(() =>
        document.addEventListener('readystatechange', () => {
            if (document.readyState !== 'interactive') return;

            const style = document.createElement('style');
            style.textContent = '::-webkit-scrollbar { width: 15px; height: 15px; }';
            document.head.append(style);
        }),
    );
    await crossBrowserE2ETest({ page, testInfo: test.info() });

    const container = page.locator(DEFAULT_MAP_SELECTOR);
    expect(await container.locator('.maplibregl-canvas').boundingBox()).toEqual(await container.boundingBox());
});
