import { expect, type Page, test } from '@playwright/test';
import { type Routes } from 'core';
import type { Feature, LineString } from 'geojson';
import { RoutingModuleConfig } from 'map';
import ldevrTestRoutesJson from './data/RoutingModuleLDEVR.test.data.json';
import rotterdamToAmsterdamRoutesJson from './data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json';
import {
    americanSignRoute,
    britishSignRoute,
    dutchSignRoute,
    japaneseSignRoute,
    swedishSignRoute,
} from './data/RoutingModuleSpeedLimitSigns.test.data';
import { jamOnlyRoutes } from './data/RoutingModuleTrafficIncidents.test.data';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import { initRouting, waitForMapIdle } from './util/TestUtils';
import { emptyScene, expectSceneShot, frameFeatures } from './util/VisualScene';

/**
 * What a section configuration paints, compared against a baseline of it.
 *
 * @remarks
 * Every test here frames one section of a route on an empty scene — the base map hidden, the POIs
 * hidden, no summary bubbles, no other section drawn — so the only thing that can repaint the
 * canvas is the section under test. A shot then says something about section configuration rather
 * than about the map style of the day.
 *
 * The three states each test moves through are the ones the `style` knob exists for: the section
 * off, drawn `inline` over the route line, and drawn as a `halo` under it. A section that lands on
 * the wrong side of the route repaints the band along its whole length, which is far more of the
 * shot than the tolerance grants.
 */
test.describe('Route section visuals', () => {
    // (The fixtures are serialized routes, so the copy is what carries the `Routes` shape):
    const rotterdamToAmsterdamRoutes = structuredClone(rotterdamToAmsterdamRoutesJson as unknown as Routes);
    // The Rotterdam route carries no speed limit sections; this one does.
    const ldevrTestRoutes = structuredClone(ldevrTestRoutesJson as unknown as Routes);

    /** The feature these baselines belong to, and so the folder they sit in under `snapshots/`. */
    const SHOT_FOLDER = 'routing';

    /**
     * The scene as a whole configuration, with the given sections drawn and no other.
     *
     * @remarks
     * `applyConfig` takes the configuration of the module as a whole rather than merging into what
     * is already there, so every state a test moves through has to spell the scene out again. A
     * section left on would draw its own band exactly where the test looks for a halo.
     *
     * The sections are drawn at their widest, so what the shot has to show is unmistakable.
     */
    const sceneConfig = (sections: RoutingModuleConfig['sections']): RoutingModuleConfig => ({
        summaryBubbles: { visible: false },
        sections: {
            ferry: { visible: false },
            tollRoad: { visible: false },
            traffic: { visible: false },
            tunnel: { visible: false },
            vehicleRestricted: { visible: false },
            ...sections,
        },
    });

    /**
     * The longest line of the selected route the given routing source holds — `tunnels`,
     * `incidents`, `motorwaySections` and the rest of what `getShown()` returns.
     *
     * @remarks
     * Sections come out of the route in whatever number and length the road network gives them.
     * The longest one is the one worth framing: on its own it fills the viewport, where the others
     * would be a handful of pixels of a country-wide route. Only the selected route draws its
     * sections, so a section of an alternative is no use here.
     */
    const longestSectionLine = async (page: Page, sourceKey: string): Promise<Feature<LineString>> => {
        const lines = await page.evaluate((inputSourceKey) => {
            const shown = (globalThis as MapsSDKThis).routing?.getShown() as unknown as
                | Record<string, { features: Feature[] } | undefined>
                | undefined;
            return (shown?.[inputSourceKey]?.features ?? []).filter(
                (feature) => feature.geometry.type === 'LineString' && feature.properties?.routeState === 'selected',
            );
        }, sourceKey);
        const longest = (lines as Feature<LineString>[]).reduce<Feature<LineString> | undefined>(
            (widest, line) =>
                !widest || line.geometry.coordinates.length > widest.geometry.coordinates.length ? line : widest,
            undefined,
        );
        if (!longest) throw new Error(`The ${sourceKey} source shows no lines to look at.`);

        return longest;
    };

    /**
     * The middle of a line, as a line of its own.
     *
     * @remarks
     * A section can run for most of a route, and framing all of it would zoom the map out until
     * the section is a diagonal thread. Its middle frames close enough to read, and keeps clear of
     * both ends, where what draws belongs to the neighbouring section as much as to this one.
     */
    const middleStretch = (line: Feature<LineString>, keep = 0.4): Feature<LineString> => {
        const { coordinates } = line.geometry;
        if (coordinates.length < 4) return line;

        const margin = Math.floor((coordinates.length * (1 - keep)) / 2);
        return {
            type: 'Feature',
            properties: line.properties,
            geometry: { type: 'LineString', coordinates: coordinates.slice(margin, coordinates.length - margin) },
        };
    };

    /**
     * Shows the given routes on an empty scene, frames the longest section of the given kind, and
     * hands back a way to shoot that framing under whatever section configuration.
     */
    const frameSectionAlone = async (page: Page, routes: Routes, sourceKey: string, keepOfSection = 0.4) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: routes.bbox });
        await emptyScene(page);
        await initRouting(page, sceneConfig({}));
        await page.evaluate(
            (inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes),
            routes,
        );
        await waitForMapIdle(page);

        // A section holds its features whether or not it draws them, so the stretch to frame is
        // there even while the section is turned off.
        await frameFeatures(page, middleStretch(await longestSectionLine(page, sourceKey), keepOfSection));

        const shoot = async (sections: RoutingModuleConfig['sections'], shot: string): Promise<void> => {
            await page.evaluate(
                (inputConfig) => (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig),
                sceneConfig(sections),
            );
            await expectSceneShot(page, [SHOT_FOLDER, shot]);
        };

        return { mapEnv, shoot };
    };

    test('A tunnel takes the route line over drawn inline, and bands it from underneath as a halo', async ({
        page,
    }) => {
        const { mapEnv, shoot } = await frameSectionAlone(page, rotterdamToAmsterdamRoutes, 'tunnels');

        await shoot({ tunnel: { visible: false } }, 'tunnel-off.png');
        await shoot({ tunnel: { visible: true, style: 'inline', width: 'l' } }, 'tunnel-inline.png');
        await shoot({ tunnel: { visible: true, style: 'halo', width: 'l' } }, 'tunnel-halo.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Traffic takes the route line over drawn inline, and bands it from underneath as a halo', async ({ page }) => {
        // Traffic draws two lines, the colour of the delay under a dashed line. Only the dashed
        // one is pinned to the route, so a halo that moved that one alone would leave the colour
        // over the route and shoot as an inline section.
        const { mapEnv, shoot } = await frameSectionAlone(page, jamOnlyRoutes, 'incidents');

        await shoot({ traffic: { visible: false } }, 'traffic-off.png');
        await shoot({ traffic: { visible: true, style: 'inline', width: 'l' } }, 'traffic-inline.png');
        await shoot({ traffic: { visible: true, style: 'halo', width: 'l' } }, 'traffic-halo.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A section asked for draws both ways round, in the colour it was asked for', async ({ page }) => {
        // A generated type: off until asked for, and drawn here in a colour of the test's own so
        // the shots say which line is the section.
        const asked = { visible: true, color: '#B026FF', opacity: 1, width: 'l' } as const;
        const { mapEnv, shoot } = await frameSectionAlone(page, rotterdamToAmsterdamRoutes, 'motorwaySections');

        await shoot({ motorway: { visible: false } }, 'motorway-off.png');
        await shoot({ motorway: { ...asked, style: 'inline' } }, 'motorway-inline.png');
        await shoot({ motorway: { ...asked, style: 'halo' } }, 'motorway-halo.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    /**
     * What one country's speed limit signs look like.
     *
     * @remarks
     * Every other test here frames a section and shoots the line it paints. A sign paints an image
     * with a number over it, so what can go wrong is different in kind: the face fails to
     * rasterise, the number lands on the words already printed on it, the wrong face is chosen for
     * the country, or the conversion posts a number no sign carries. One shot per face is what
     * catches those — the fixtures are straight lines so the framing is identical between them,
     * and the difference in a shot is the sign and nothing else.
     */
    const shootSignsOf = async (page: Page, routes: Routes, shot: string) => {
        const { mapEnv, shoot } = await frameSectionAlone(page, routes, 'speedLimitSections', 1);
        await shoot({}, shot);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    };

    test('The white disc reads the km/h most of Europe posts', async ({ page }) => {
        await shootSignsOf(page, dutchSignRoute, 'speed-limit-disc-kmh.png');
    });

    test('The same disc reads mph where mph is posted', async ({ page }) => {
        // 112 km/h and 48 km/h are a 70 and a 30 sign. A shot of "112" would mean the conversion
        // never ran; "69" would mean it did not round to the step signs come in.
        await shootSignsOf(page, britishSignRoute, 'speed-limit-disc-mph.png');
    });

    test('The Nordic disc is yellow', async ({ page }) => {
        await shootSignsOf(page, swedishSignRoute, 'speed-limit-yellow-disc.png');
    });

    test('The American plaque prints its number under its own words', async ({ page }) => {
        // The face carries "SPEED LIMIT" across the top, so a number centred on it collides.
        await shootSignsOf(page, americanSignRoute, 'speed-limit-plaque-mph.png');
    });

    test('Japanese numerals are blue', async ({ page }) => {
        await shootSignsOf(page, japaneseSignRoute, 'speed-limit-blue-numerals.png');
    });

    test('A speed limit is posted on a sign face, which the number has to land on', async ({ page }) => {
        // The one type drawn from a number rather than an extent, and the only section whose
        // appearance is an image: these shots are what says the face rasterised and the number
        // landed on it, which no assertion about layers or properties can.
        //
        // The whole section is framed rather than its middle, because the sign sits where MapLibre
        // anchors a symbol on the line rather than where the test would put it.
        const { mapEnv, shoot } = await frameSectionAlone(page, ldevrTestRoutes, 'speedLimitSections', 1);

        await shoot({ speedLimit: { visible: false } }, 'speed-limit-off.png');
        await shoot({ speedLimit: {} }, 'speed-limit-sign.png');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
