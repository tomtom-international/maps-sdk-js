import { expect, type Page, test } from '@playwright/test';
import { EFFECT_CASES } from './app/cases';
import type { ShotMetrics } from './app/measure';

/**
 * What each effect does to a picture, measured — over a synthetic map (`app/subject.ts`) so a case
 * needs no tile, no network call and no API key, and is the same picture on every machine.
 *
 * **The snapshots are half of it and the measurements are the other half.** A baseline recorded
 * from a broken build locks the bug in, and a snapshot cannot state the claim anyway: "the near
 * ground stayed sharp and the far ground did not" is the whole of what a depth of field promises,
 * and it is a relation between two parts of one picture rather than a picture. So every effect is
 * also asserted to move the frame the way its name says.
 *
 * The example's `map-effects-playground` shots are the companion to this, and the division is
 * deliberate: they photograph the effects over a real map, where the subject moves with the traffic
 * and the tolerance has to be wide enough to let it. The claims live here, where it does not.
 */

const CASE = '#case';

/** Mounts a case and photographs it. Base64 because the measurements run back in the page. */
const shoot = async (page: Page, caseId: string): Promise<string> => {
    await page.evaluate((id) => globalThis.mapEffectsHarness.mount(id), caseId);
    return (await page.locator(CASE).screenshot()).toString('base64');
};

const metricsOf = async (page: Page, caseId: string): Promise<ShotMetrics> => {
    const shot = await shoot(page, caseId);
    return page.evaluate((encoded) => globalThis.mapEffectsHarness.metricsOf(encoded), shot);
};

/** How far a case differs from the plain map on the optical axis and in the corners. */
const rimDifferenceFrom = async (page: Page, caseId: string) => {
    const [plain, rimmed] = [await shoot(page, 'plain'), await shoot(page, caseId)];
    return page.evaluate(([one, two]) => globalThis.mapEffectsHarness.rimDifference(one, two), [plain, rimmed]);
};

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean(globalThis.mapEffectsHarness));
});

test.describe('map effects', () => {
    /**
     * The one claim about the substrate that no effect can make on its own, because the plugin
     * ships a single pass: a stage reads what the stage before it wrote, rather than the source.
     *
     * The probe's two shaders are arranged so the answer names the fault: the first takes the green
     * out of a `rgb(80, 120, 40)` field and the second rotates the channels into it, so a chain
     * that ran both passes over the source — or dropped one — hands back the green it should have
     * destroyed. See `chainProbe` in `app/main.ts`.
     */
    test('a pass reads what the pass before it wrote', async ({ page }) => {
        const [red, green, blue] = await page.evaluate(() => globalThis.mapEffectsHarness.chainProbe());

        expect(red, 'the second pass must read the first one, which left no green to rotate into red').toBeLessThan(4);
        expect(green, "and must have rotated the source's blue into green").toBeGreaterThan(30);
        expect(blue, "and the source's red into blue").toBeGreaterThan(70);
    });

    /**
     * **The lens is the camera's, not the frame's** — the claim that separates a depth of field
     * from the edge blur, and the one thing about this effect a snapshot cannot state.
     *
     * All four assertions are about *where* the sharpness went, which is what "driven by distance"
     * means, and all four count marks rather than compare pixels — so they survive a renderer that
     * rounds a float the other way.
     *
     * The subject carries the same detail at every height by construction, so the plain map reads
     * 26.7 / 26.7 / 25.9 reversals per row near to far and every gap below is the lens' own.
     */
    test('the lens is the camera and not the frame', async ({ page }) => {
        // Focused on the nearest ground: the bottom of a tilted frame keeps its detail and the top
        // loses it, because the top is where the ground has run away from the lens.
        // Measured: 27.4 / 20.9 / 18.4.
        const near = (await metricsOf(page, 'depth-of-field-near')).sharpness;
        expect(near.near, 'the nearest ground must stay the sharpest').toBeGreaterThan(near.middle);
        expect(near.middle, 'and detail must keep falling with distance').toBeGreaterThan(near.far);

        // The same lens aimed the other way round, so the foreground is the part that goes. A mask
        // over the top of the frame could not do this.
        const far = (await metricsOf(page, 'depth-of-field-far')).sharpness;
        expect(far.far, 'focused far, the distance must be the sharp part').toBeGreaterThan(far.near);

        // The tilt-shift: a band held in the middle with both ends falling away, which is the shape
        // no single ramp has. Measured: 21.6 / 27.2 / 22.0.
        const band = (await metricsOf(page, 'depth-of-field-band')).sharpness;
        expect(band.middle, 'the focused band must beat the near ground').toBeGreaterThan(band.near);
        expect(band.middle, 'and the far ground too').toBeGreaterThan(band.far);

        // The same lens, the same knobs, a level camera — and the plain map back. This is the pair
        // that says the effect is geometry rather than a gradient: nothing switches it off, the
        // depth ramp is simply zero when every part of the ground is the same distance away.
        const plain = await metricsOf(page, 'plain');
        const level = await metricsOf(page, 'depth-of-field-level');
        expect(level.mean, 'a level camera has no depth to be shallow in').toBeCloseTo(plain.mean, 1);
        expect(level.sharpness.far, 'and so must lose no detail at all').toBeCloseTo(plain.sharpness.far, 0);
    });

    /**
     * **Bokeh is brighter than the blur it replaces, and it has to be.**
     *
     * A lens does not average the light it cannot resolve, it spreads it — so an out-of-focus
     * street lamp arrives as a disc at its own brightness rather than as a slightly lighter patch
     * of the road behind it. The two cases differ in nothing but whether a bright sample outweighs
     * a dull one, and the reading is taken in the far third, which is the part this aperture
     * actually defocuses.
     *
     * Normalising the weighting away would leave a blur, and the failure is silent: the picture
     * stays plausible, the snapshots stay stable, and the map quietly loses its lights.
     */
    test('an out-of-focus highlight keeps its light', async ({ page }) => {
        const averaged = await metricsOf(page, 'depth-of-field-averaged');
        const spread = await metricsOf(page, 'depth-of-field-bokeh');

        expect(spread.brightness.far, 'weighting the highlights must brighten the defocused end').toBeGreaterThan(
            averaged.brightness.far,
        );
    });

    /**
     * Bloom only ever adds light — and it adds it to whatever the chain left, which is the ordering
     * that puts the GPU pass under the overlays rather than over them.
     */
    test('bloom adds light, and adds it to what the lens caught', async ({ page }) => {
        const plain = await metricsOf(page, 'plain');
        const bloom = await metricsOf(page, 'bloom');
        expect(bloom.mean, 'bloom must add light').toBeGreaterThan(plain.mean);

        // A higher cut keeps less of the picture, so it adds less — but it still only ever adds.
        const highCut = await metricsOf(page, 'bloom-high-cut');
        expect(highCut.mean).toBeGreaterThanOrEqual(plain.mean);
        expect(highCut.mean).toBeLessThan(bloom.mean);

        // The pair that catches a blend mode reading the wrong backdrop: with a rim effect stacked
        // over it, bloom must still add rather than subtract.
        const fog = await metricsOf(page, 'fog');
        const bloomAndFog = await metricsOf(page, 'bloom-and-fog');
        expect(bloomAndFog.mean, 'bloom under fog must still add light').toBeGreaterThan(fog.mean);

        // And the ordering: the glow is made of the defocused picture, not of the sharp one under
        // it. Reversed, bloom would read the map the lens has already thrown away.
        const lens = await metricsOf(page, 'depth-of-field-near');
        const lensAndBloom = await metricsOf(page, 'depth-of-field-and-bloom');
        expect(lensAndBloom.mean, 'bloom must light what the lens captured').toBeGreaterThan(lens.mean);
    });

    /**
     * **A scope keeps the glow on the colours it names.**
     *
     * - Each scope keys a subset of the one above it, so the light added shrinks scope by scope.
     * - A level alone would pass an even dimming, so the hue is asserted too: the major-jam knob
     *   keys the red cross streets and must add far less blue than the `traffic` group.
     * - A CSS colour must key exactly what the knob wearing it keys.
     */
    test('a bloom scope lights only the colours it names', async ({ page }) => {
        const plain = await metricsOf(page, 'plain');
        const everything = await metricsOf(page, 'bloom');
        const traffic = await metricsOf(page, 'bloom-scope-traffic');
        const major = await metricsOf(page, 'bloom-scope-major');
        const literal = await metricsOf(page, 'bloom-scope-literal');

        expect(everything.mean, 'the lamps are in no scope, so scoping to traffic must drop them').toBeGreaterThan(
            traffic.mean,
        );
        expect(traffic.mean, 'one knob must light less than its whole group').toBeGreaterThan(major.mean);
        expect(major.mean, 'but still light something').toBeGreaterThan(plain.mean);

        expect(major.red - plain.red, 'the major-jam knob must light the cross streets').toBeGreaterThan(1);
        expect(major.blue - plain.blue, 'and keep the cyan streets out of the glow').toBeLessThan(
            (traffic.blue - plain.blue) / 2,
        );

        expect(literal.mean, 'a CSS colour must key what the knob wearing it keys').toBeCloseTo(major.mean, 1);
    });

    /**
     * The grade's three terms, each measured in the statistic it moves: brightness the level,
     * contrast the spread, saturation the chroma. A mean would miss two of the three — a picture
     * can lose all its colour without changing level at all.
     */
    test('the grade moves the level, the contrast the spread and the saturation the colour', async ({ page }) => {
        const plain = await metricsOf(page, 'plain');

        expect((await metricsOf(page, 'grade-brighter')).mean).toBeGreaterThan(plain.mean);
        expect((await metricsOf(page, 'grade-darker')).mean).toBeLessThan(plain.mean);
        expect((await metricsOf(page, 'grade-harder')).spread).toBeGreaterThan(plain.spread);
        expect((await metricsOf(page, 'grade-softer')).spread).toBeLessThan(plain.spread);

        const greyscale = await metricsOf(page, 'grade-greyscale');
        expect(greyscale.chroma, 'saturation 0 must leave no colour at all').toBeLessThan(2);

        // A warm tint has to warm the picture, which is a claim about the channels rather than the
        // level: an orange laid over the map at half opacity lifts red far more than blue.
        const tint = await metricsOf(page, 'tint');
        expect(tint.red - tint.blue, 'a warm tint must warm the map').toBeGreaterThan(plain.red - plain.blue);
    });

    /**
     * **A rim effect is a rim effect**: it has to leave the middle of the frame alone.
     *
     * The assertion that separates the vignette and the edge blur from a filter laid over the whole
     * picture — which is what both become the moment their mask is dropped, and which no mean,
     * spread or sharpness count would notice.
     */
    test('a rim effect leaves the middle of the frame alone', async ({ page }) => {
        for (const rimmed of ['vignette', 'edge-blur']) {
            const { axis, corners } = await rimDifferenceFrom(page, rimmed);

            expect(corners, `${rimmed} must bite in the corners`).toBeGreaterThan(8);
            expect(axis, `${rimmed} must leave the optical axis nearly untouched`).toBeLessThan(corners / 5);
        }
    });

    /**
     * The picture itself, one committed baseline per case, so a drift names the effect that moved.
     *
     * A tolerance rather than an exact match: the subject is drawn and the renderer is SwiftShader
     * on every machine here, but a `backdrop-filter` blur is the browser's own and rounds
     * differently on another platform. The measurements above are what hold the claims; these hold
     * the look.
     */
    for (const entry of EFFECT_CASES) {
        test(`${entry.id} matches its snapshot`, async ({ page }) => {
            await page.evaluate((id) => globalThis.mapEffectsHarness.mount(id), entry.id);

            await expect(page.locator(CASE)).toHaveScreenshot(`${entry.id}.png`, { maxDiffPixelRatio: 0.02 });
        });
    }
});
