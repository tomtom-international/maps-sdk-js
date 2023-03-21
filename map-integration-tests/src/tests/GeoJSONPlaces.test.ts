import { HasBBox, Places } from "@anw/maps-sdk-js/core";
import { LocationDisplayProps, PlaceIconConfig } from "map";
import { MapGeoJSONFeature } from "maplibre-gl";
import sortBy from "lodash/sortBy";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import placesTestData from "./GeoJSONPlaces.test.data.json";
import { MapsSDKThis } from "./types/MapsSDKThis";
import {
    getNumVisibleLayersBySource,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    queryRenderedFeatures,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import expectedCustomIcon from "./GeoJSONPlacesCustomIcon.test.data.json";
import expectedPOILikeFeatureProps from "./GeoJSONPlacesPOILikeProps.test.data.json";

const applyIconConfig = async (iconConfig?: PlaceIconConfig) =>
    page.evaluate(
        async (inputConfig) => (globalThis as MapsSDKThis).places?.applyIconConfig(inputConfig),
        iconConfig as never
    );

const getBBox = async (places: HasBBox) =>
    page.evaluate(
        (inputPlaces) => (globalThis as MapsSDKThis).MapsSDKCore.bboxFromGeoJSON(inputPlaces),
        // @ts-ignore
        places
    );

const clearPlaces = async () => page.evaluate(() => (globalThis as MapsSDKThis).places?.clear());

const getNumVisibleLayers = async (sourceID: string) => getNumVisibleLayersBySource(sourceID);

const compareToExpectedDisplayProps = (places: MapGeoJSONFeature[], expectedDisplayProps: LocationDisplayProps[]) =>
    expect(
        sortBy(
            places.map((place) => ({ title: place.properties.title, iconID: place.properties.iconID })),
            "title"
        )
    ).toEqual(sortBy(expectedDisplayProps, "title"));

const compareToExpectedPOILikeDisplayProps = (
    places: MapGeoJSONFeature[],
    expectedDisplayProps: LocationDisplayProps[]
) => {
    for (const place of places) {
        const expectedDisplayProp = expectedDisplayProps.find((props) => props.title == place.properties.title);
        expect({
            title: place.properties.title,
            iconID: place.properties.iconID,
            category: place.properties.category
        }).toEqual(expectedDisplayProp);
    }
};

describe("GeoJSON Places tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test.each(placesTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, testPlaces: Places, expectedDisplayProps: PlaceDisplayProps[]) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs();
            expect(await getNumVisibleLayers(sourceID)).toStrictEqual(0);

            await showPlaces(testPlaces);
            const numTestPlaces = testPlaces.features.length;
            let renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(sourceID)).toStrictEqual(2);
            // once more:
            await showPlaces(testPlaces);
            renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(sourceID)).toStrictEqual(2);

            await clearPlaces();
            renderedPlaces = await waitUntilRenderedFeatures(layerIDs, 0, 10000);
            expect(renderedPlaces).toHaveLength(0);
            expect(await getNumVisibleLayers(sourceID)).toStrictEqual(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);

            // once more, reloading the map and this time showing places before waiting for it to load:
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            const { layerIDs: nextLayerIDs } = await getPlacesSourceAndLayerIDs();
            await showPlaces(testPlaces);
            renderedPlaces = await waitUntilRenderedFeatures(nextLayerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});

describe("GeoJSON Places with init config tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test.each(placesTestData)(
        `'%s`,
        // @ts-ignore
        async (
            _name: string,
            testPlaces: Places,
            _expectedDisplayProps: LocationDisplayProps[],
            expectedDisplayCustomProps: LocationDisplayProps[]
        ) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces({ iconConfig: { iconStyle: "circle" } });
            const { layerIDs } = await getPlacesSourceAndLayerIDs();
            await showPlaces(testPlaces);
            const numTestPlaces = testPlaces.features.length;
            const renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayCustomProps);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});

describe("GeoJSON Places apply icon config tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test.each(placesTestData)(
        `'%s`,
        // @ts-ignore
        async (
            name: string,
            testPlaces: Places,
            _expectedDisplayProps: LocationDisplayProps[],
            expectedDisplayCustomProps: LocationDisplayProps[]
        ) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            const { layerIDs } = await getPlacesSourceAndLayerIDs();
            await showPlaces(testPlaces);

            const numTestPlaces = testPlaces.features.length;
            await applyIconConfig({ iconStyle: "circle" });
            await waitForMapIdle();
            let renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayCustomProps);

            await applyIconConfig({
                customIcons: [{ category: "PARKING_GARAGE", iconUrl: "https://dummyimage.com/30x20/4137ce/fff" }]
            });
            await waitForMapIdle();
            renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedCustomIcon[name as never]);

            await applyIconConfig({ iconStyle: "poi-like" });
            await waitForMapIdle();
            // poi-like places avoid collisions, thus likely resulting in less num of rendered features:
            renderedPlaces = await queryRenderedFeatures(layerIDs);
            compareToExpectedPOILikeDisplayProps(renderedPlaces, expectedPOILikeFeatureProps[name as never]);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
