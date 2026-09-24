import { expect, type Page, test } from '@playwright/test';
import { type Routes } from 'core';
import type { RoutingModuleConfig } from 'map';
import { franceToBelgiumToNetherlandsRoute, spainToFranceRoute } from './data/RoutingModuleCountryCrossings.test.data';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { initRouting, waitForMapIdle } from './util/TestUtils';
import { emptyScene, expectSceneShot, frameFeatures } from './util/VisualScene';

/**
 * What a border crossing paints.
 *
 * @remarks
 * The failures here are the ones no layer assertion reaches: the plaque not stretching around its
 * label, the arrow drawing as a tofu box, or the two codes reading in the wrong order. The scene is
 * emptied first, so the only thing that can repaint the canvas is the crossing itself.
 */
test.describe('Country crossing visuals', () => {
    const SHOT_FOLDER = 'routing';

    /** No section drawn and no bubble, so the plaque is alone on the canvas. */
    const sceneConfig = (countryCrossings?: RoutingModuleConfig['countryCrossings']): RoutingModuleConfig => ({
        summaryBubbles: { visible: false },
        sections: {
            ferry: { visible: false },
            tollRoad: { visible: false },
            traffic: { visible: false },
            tunnel: { visible: false },
            vehicleRestricted: { visible: false },
            speedLimit: { visible: false },
        },
        ...(countryCrossings && { countryCrossings }),
    });

    const frameCrossings = async (page: Page, routes: Routes) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: routes.bbox });
        await emptyScene(page);
        await initRouting(page, sceneConfig());
        await page.evaluate(
            (inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes),
            routes,
        );
        await waitForMapIdle(page);
        await frameFeatures(page, routes);

        const shoot = async (
            countryCrossings: RoutingModuleConfig['countryCrossings'],
            shot: string,
        ): Promise<void> => {
            await page.evaluate(
                (inputConfig) => (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig),
                sceneConfig(countryCrossings),
            );
            await expectSceneShot(page, [SHOT_FOLDER, shot]);
        };

        return { mapEnv, shoot };
    };

    test('A crossing names both countries in the direction of travel', async ({ page }) => {
        // The shot that says the arrow has a glyph: `ES → FR` is unreadable as a tofu box.
        const { mapEnv, shoot } = await frameCrossings(page, spainToFranceRoute);

        await shoot({ visible: false }, 'country-crossing-off.png');
        await shoot(undefined, 'country-crossing-es-fr.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Two crossings on one route both draw, and the plaque colour is configurable', async ({ page }) => {
        const { mapEnv, shoot } = await frameCrossings(page, franceToBelgiumToNetherlandsRoute);

        await shoot(undefined, 'country-crossing-two.png');
        // A recolour replaces the plaque image rather than restyling the layer, so only a shot says
        // the new image reached the map.
        await shoot({ color: '#0B5FA5' }, 'country-crossing-recoloured.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
