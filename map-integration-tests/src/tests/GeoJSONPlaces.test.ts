import { Places } from "@anw/go-sdk-js/core";
import { DisplayProps } from "map";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapToLoad,
    waitUntilRenderedFeatures
} from "./util/MapIntegrationTestEnv";
import placesTestData from "./GeoJSONPlaces.test.data.json";
import { GOSDKThis } from "./types/GOSDKThis";
import { MapGeoJSONFeature } from "maplibre-gl";
import sortBy from "lodash/sortBy";

const initPlaces = async () =>
    page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.places = new goSDKThis.GOSDK.GeoJSONPlaces(goSDKThis.goSDKMap);
    });

const showPlaces = async (places: Places) =>
    page.evaluate((inputPlaces: Places) => {
        (globalThis as GOSDKThis).places?.show(inputPlaces);
    }, places);

const clearPlaces = async () => page.evaluate(() => (globalThis as GOSDKThis).places?.clear());

const waitForRenderedPlaces = async (numPlaces: number) => waitUntilRenderedFeatures("placesSymbols", numPlaces, 5000);

const getNumVisibleLayers = async () => getNumVisibleLayersBySource("places");

const compareToExpectedDisplayProps = (places: MapGeoJSONFeature[], expectedDisplayProps: DisplayProps[]) =>
    expect(
        sortBy(
            places.map((place) => ({ title: place.properties.title, iconID: place.properties.iconID })),
            "title"
        )
    ).toEqual(sortBy(expectedDisplayProps, "title"));

describe("GeoJSON Places tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test.each(placesTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, testPlaces: Places, expectedDisplayProps: DisplayProps[]) => {
            await mapEnv.loadMap({}, { bounds: testPlaces });
            await initPlaces();
            await waitForMapToLoad();
            expect(await getNumVisibleLayers()).toStrictEqual(0);

            await showPlaces(testPlaces);
            const numTestPlaces = testPlaces.features.length;
            let renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers()).toStrictEqual(1);
            // once more:
            await showPlaces(testPlaces);
            renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers()).toStrictEqual(1);

            await clearPlaces();
            renderedPlaces = await waitForRenderedPlaces(0);
            expect(renderedPlaces).toHaveLength(0);
            expect(await getNumVisibleLayers()).toStrictEqual(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
