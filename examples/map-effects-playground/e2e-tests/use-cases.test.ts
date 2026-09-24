import { expect, type Page, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

/**
 * What each use case this playground ships actually does to the map.
 *
 * @remarks
 * The example's own `upon-load` shot is the map with every effect off, which says nothing about the
 * effects themselves — a plugin that silently stopped compositing would pass it. These shots are one
 * per use case over the identical view, so the only difference between any two of them is the
 * settings the dropdown applied.
 *
 * The tolerance is wide because an effect is a full-canvas composite: traffic tubes move through the
 * day and the whole frame shifts with them. What a shot here has to catch is an effect not landing
 * at all, which changes far more of the frame than that.
 */

/** The dropdown values, which are the keys of the `useCases` table in the example's own source. */
const USE_CASES = [
    { value: 'data-viz', shot: 'use-case-data-viz.png' },
    { value: 'night-driving', shot: 'use-case-night-driving.png' },
    { value: 'focus', shot: 'use-case-focus.png' },
] as const;

/** Enough of the frame may differ that traffic moving through the day does not fail the run. */
const SHOT_TOLERANCE = { maxDiffPixelRatio: 0.15, timeout: 30000 } as const;

/**
 * One shot per effect, each alone and turned up far enough to read.
 *
 * @remarks
 * The use cases above are what an app would ship, and they combine effects — `data-viz` is grade
 * plus tint, `focus` is vignette plus edge blur. That leaves no picture of any single effect, and
 * none at all of `fog`, which no use case includes. These are the catalogue itself: every effect
 * once, in isolation, at a setting that shows what the knob does rather than what we recommend.
 *
 * The settings are deliberately past what anyone would ship. A shot at the tasteful value is what
 * `night-driving` already demonstrated: honest, and indistinguishable from the effect not running.
 */
const ISOLATED_EFFECTS = [
    {
        shot: 'effect-grade-greyscale.png',
        knobs: [{ group: 'grade', knob: 'saturation', value: 0 }],
    },
    {
        shot: 'effect-fog.png',
        knobs: [
            { group: 'fog', knob: 'intensity', value: 1 },
            { group: 'fog', knob: 'reach', value: 0.6 },
        ],
    },
    {
        shot: 'effect-edge-blur.png',
        knobs: [{ group: 'edgeBlur', knob: 'intensity', value: 30 }],
    },
    {
        // The colour stays at its default slate; opacity is the knob that turns the effect on.
        shot: 'effect-tint.png',
        knobs: [{ group: 'tint', knob: 'opacity', value: 0.6 }],
    },
    {
        shot: 'effect-vignette.png',
        knobs: [{ group: 'vignette', knob: 'intensity', value: -1 }],
    },
] as const;

/**
 * Loads the playground and waits for the map, the traffic tubes and the first composite.
 *
 * @remarks
 * Bloom reads the canvas back, so the shot has to wait for traffic to have drawn — an empty dark
 * street map composites to something very close to itself, and the shot would say nothing.
 */
const loadPlayground = async (page: Page): Promise<string[]> => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/map-effects-playground/dist/prod/index.html`);
    await page.waitForSelector('#sdk-map canvas', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(6000);

    return consoleErrors;
};

/** Applies one use case through the dropdown the example builds its panel from. */
const applyUseCase = async (page: Page, value: string): Promise<void> => {
    await page.selectOption('#ui-useCase', value);
    // The composite runs on the next frames; the panel is rebuilt from the catalogue in between.
    await page.waitForTimeout(2500);
};

/**
 * Drags one knob's slider, found the way a reader finds it: by its effect group and its name.
 *
 * @remarks
 * The panel is generated from `effects.describe()`, so there is no stable id per knob — but the
 * grouping is the catalogue's own, which makes group plus name the honest selector.
 */
const setKnob = async (page: Page, group: string, knob: string, value: number): Promise<void> => {
    const section = page.locator('.ui-section', { has: page.locator('h4.ui-subheading', { hasText: group }) });
    const field = section.locator('.ui-form-field', {
        has: page.locator('.ui-form-label', { hasText: new RegExp(`^${knob}$`) }),
    });
    await field.locator('input[type="range"]').fill(String(value));
    await page.waitForTimeout(2500);
};

test.describe('map effects use cases', () => {
    test('every effect off is the map the other shots are compared against', { tag: TAG_PROD }, async ({ page }) => {
        const consoleErrors = await loadPlayground(page);

        await expect(page).toHaveScreenshot('use-case-none.png', SHOT_TOLERANCE);
        expect(consoleErrors).toHaveLength(0);
    });

    for (const useCase of USE_CASES) {
        test(`the ${useCase.value} use case composites over the map`, { tag: TAG_PROD }, async ({ page }) => {
            const consoleErrors = await loadPlayground(page);
            await applyUseCase(page, useCase.value);

            await expect(page).toHaveScreenshot(useCase.shot, SHOT_TOLERANCE);
            expect(consoleErrors).toHaveLength(0);
        });
    }

    for (const effect of ISOLATED_EFFECTS) {
        test(`${effect.shot.replace(/^effect-|\.png$/g, '')} alone, turned up enough to read`, {
            tag: TAG_PROD,
        }, async ({ page }) => {
            // Each test loads the playground fresh, where every effect is off, so nothing from the
            // previous one can bleed into this shot.
            const consoleErrors = await loadPlayground(page);
            for (const knob of effect.knobs) {
                await setKnob(page, knob.group, knob.knob, knob.value);
            }

            await expect(page).toHaveScreenshot(effect.shot, SHOT_TOLERANCE);
            expect(consoleErrors).toHaveLength(0);
        });
    }

    test('bloom at full strength, so the effect is legible at all', { tag: TAG_PROD }, async ({ page }) => {
        // `night-driving` ships bloom at 0.6 above a 0.55 threshold, which lights only the brightest
        // features and changes a few percent of the frame — honest, but near-invisible in a still.
        // This shot is the same effect with nothing held back, so a reviewer can see what the knob
        // does and judge the shipped setting against it.
        const consoleErrors = await loadPlayground(page);
        await setKnob(page, 'bloom', 'intensity', 1);
        await setKnob(page, 'bloom', 'threshold', 0.2);

        await expect(page).toHaveScreenshot('effect-bloom-strong.png', SHOT_TOLERANCE);
        expect(consoleErrors).toHaveLength(0);
    });
});
