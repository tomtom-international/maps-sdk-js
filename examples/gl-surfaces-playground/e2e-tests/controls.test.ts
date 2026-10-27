import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

// Still wind, so the map draws a frame per change rather than every frame for the whole walk, which
// would starve the examples tested beside it.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// Half the pixels of the default viewport to draw each frame in, the panel still laid out for a desktop.
test.use({ viewport: { width: 800, height: 560 } });

// The wind speed slider would set the wind blowing again, and the map-effects playground walks the
// effect knobs.
const SKIPPED = ['#ui-wind .ui-form-field:last-child input', '#ui-effects *'];

// Each knob redraws the surfaces, their fields and the trees, which a software renderer takes seconds a
// frame to draw: the panel's sections and the surfaces' own details are walked in two tests, side by side.
test('every control of the panel sections can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    test.setTimeout(360_000);
    await controlsE2ETest({
        page,
        testInfo: test.info(),
        // The panel's own sections, opened; the surfaces' details within them stay closed.
        reveal: (revealed) =>
            revealed.evaluate(() => {
                for (const section of document.querySelectorAll<HTMLDetailsElement>('.ui-panel-content > details')) {
                    section.open = true;
                }
            }),
        skip: SKIPPED,
    });
});

test("every surface's own control can be moved without an error", { tag: TAG_PROD }, async ({ page }) => {
    test.setTimeout(360_000);
    await controlsE2ETest({
        page,
        testInfo: test.info(),
        // Every section and every surface's details within them, opened.
        reveal: (revealed) =>
            revealed.evaluate(() => {
                for (const section of document.querySelectorAll<HTMLDetailsElement>('.ui-panel-content details')) {
                    section.open = true;
                }
            }),
        // The first test walks the sections' own controls.
        skip: [...SKIPPED, ':not(details details *)'],
    });
});
