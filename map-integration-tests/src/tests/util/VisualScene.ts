import { expect, type Page } from '@playwright/test';
import { bboxFromGeoJSON } from 'core';
import type { GeoJSON } from 'geojson';
import { MapsSDKThis } from '../types/MapsSDKThis';
import { initBasemap, initPOIs } from './TestUtils';

/**
 * A scene holding one module's data and nothing else, shot and compared against a baseline.
 *
 * @remarks
 * What makes a screenshot worth asserting on is what is *not* in it: with the base map gone, the
 * only thing that can repaint the canvas is the module under test, so a shot changes when its
 * drawing changes and at no other time. The style of the day, a new POI icon or a label moving a
 * pixel cannot reach these baselines.
 *
 * Any data-owned module can be tested this way:
 *
 * ```typescript
 * await emptyScene(page);
 * await initPlaces(page);
 * await showPlaces(page, places);
 * await frameFeatures(page, places);
 * await expectSceneShot(page, ['places', 'markers.png']);
 * ```
 */

/** The canvas the map draws on, and so the only part of the page a shot covers. */
const MAP_CANVAS = '#map canvas';

/**
 * How much of a shot may differ before it counts as a change.
 *
 * @remarks
 * An emptied scene puts the two apart by a wide margin: repeated runs of one scene came out
 * pixel-identical, while a route section landing on the wrong side of the route line — the
 * regression `RouteSectionVisuals` was written for — moved 2% of the shot, twice what is granted
 * here. The slack is for the edge pixels a GPU antialiases its own way, which is what lets the
 * baselines carry no platform in their names.
 */
const SHOT_TOLERANCE = { maxDiffPixelRatio: 0.01 } as const;

/** Room around framed features, so what draws beside them is in the shot as well. */
const DEFAULT_PADDING_PIXELS = 80;

/**
 * Hides everything the map style draws, leaving the modules under test alone on the canvas.
 *
 * @remarks
 * The base map and the POIs are two modules, so emptying the scene takes both.
 */
export const emptyScene = async (page: Page): Promise<void> => {
    await initBasemap(page, { visible: false });
    await initPOIs(page, { visible: false });
};

/**
 * Frames the given features, without animating, so what follows shoots a settled canvas.
 *
 * @remarks
 * Takes whatever GeoJSON the module was given or hands back, so a test frames the thing it is
 * about rather than a viewport someone guessed.
 */
export const frameFeatures = async (page: Page, features: GeoJSON, paddingPixels = DEFAULT_PADDING_PIXELS) => {
    const bbox = bboxFromGeoJSON(features);
    if (!bbox) throw new Error('The features to frame have no extent.');

    return page.evaluate(
        ({ inputBBox, inputPadding }) => {
            (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.fitBounds(inputBBox as [number, number, number, number], {
                padding: inputPadding,
                animate: false,
            });
        },
        { inputBBox: bbox, inputPadding: paddingPixels },
    );
};

/**
 * Waits for the map to draw one more frame and go quiet after it.
 *
 * @remarks
 * The map may have gone idle before the change being tested reached it, so a settled scene is one
 * asked for a frame and then idle again. Both happen in the page, because the listener has to be
 * on before the frame is asked for — across two calls the idle can land in between, and the wait
 * then sits out its timeout.
 */
const settle = (page: Page): Promise<void> =>
    page.evaluate(
        () =>
            new Promise<void>((resolve) => {
                const map = (globalThis as MapsSDKThis).tomtomMap.mapLibreMap;
                map.once('idle', () => resolve());
                map.triggerRepaint();
            }),
    );

/**
 * Shoots the map canvas and compares it against the baseline of the given name.
 *
 * @remarks
 * The name comes in parts, which is how Playwright nests a baseline — `['routing', 'halo.png']`
 * keeps one feature's shots together under `snapshots/routing/`, where a `/` inside a single part
 * would be flattened to a `-` instead.
 */
export const expectSceneShot = async (page: Page, shot: string[]): Promise<void> => {
    await settle(page);
    await expect(page.locator(MAP_CANVAS)).toHaveScreenshot(shot, SHOT_TOLERANCE);
};
