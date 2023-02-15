import { HasBBox, Places } from "@anw/go-sdk-js/core";
import { PlaceDisplayProps, PlaceIconConfig, PlaceModuleConfig, PLACES_SOURCE_ID } from "map";
import { MapGeoJSONFeature } from "maplibre-gl";
import sortBy from "lodash/sortBy";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import placesTestData from "./GeoJSONPlaces.test.data.json";
import { GOSDKThis } from "./types/GOSDKThis";
import {
    getNumVisibleLayersBySource,
    queryRenderedFeatures,
    waitForMapIdle,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import expectedCustomIcon from "./GeoJSONPlacesCustomIcon.test.data.json";
import expectedPOILikeFeatureProps from "./GeoJSONPlacesPOILikeProps.test.data.json";

const initPlaces = async (config?: PlaceModuleConfig) =>
    page.evaluate(async (inputConfig) => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.places = await goSDKThis.GOSDK.GeoJSONPlaces.init(goSDKThis.goSDKMap, inputConfig);
    }, config as never);

const applyIconConfig = async (iconConfig?: PlaceIconConfig) =>
    page.evaluate(
        async (inputConfig) => (globalThis as GOSDKThis).places?.applyIconConfig(inputConfig),
        iconConfig as never
    );

const showPlaces = async (places: Places) =>
    page.evaluate((inputPlaces: Places) => {
        (globalThis as GOSDKThis).places?.show(inputPlaces);
        // @ts-ignore
    }, places);

const getBBox = async (places: HasBBox) =>
    page.evaluate(
        (inputPlaces) => (globalThis as GOSDKThis).GOSDKCore.bboxFromGeoJSON(inputPlaces),
        // @ts-ignore
        places
    );

const clearPlaces = async () => page.evaluate(() => (globalThis as GOSDKThis).places?.clear());

const waitForRenderedPlaces = async (numPlaces: number) =>
    waitUntilRenderedFeatures(["placesSymbols"], numPlaces, 10000);

const getNumVisibleLayers = async () => getNumVisibleLayersBySource(PLACES_SOURCE_ID);

const compareToExpectedDisplayProps = (places: MapGeoJSONFeature[], expectedDisplayProps: PlaceDisplayProps[]) =>
    expect(
        sortBy(
            places.map((place) => ({ title: place.properties.title, iconID: place.properties.iconID })),
            "title"
        )
    ).toEqual(sortBy(expectedDisplayProps, "title"));

const compareToExpectedPOILikeDisplayProps = (
    places: MapGeoJSONFeature[],
    expectedDisplayProps: PlaceDisplayProps[]
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

            // once more, reloading the map and this time showing places before waiting for it to load:
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            await showPlaces(testPlaces);
            renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
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
            _expectedDisplayProps: PlaceDisplayProps[],
            expectedDisplayCustomProps: PlaceDisplayProps[]
        ) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces({ iconConfig: { iconStyle: "circle" } });
            await showPlaces(testPlaces);
            const numTestPlaces = testPlaces.features.length;
            const renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
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
            _expectedDisplayProps: PlaceDisplayProps[],
            expectedDisplayCustomProps: PlaceDisplayProps[]
        ) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            await showPlaces(testPlaces);

            const numTestPlaces = testPlaces.features.length;
            await applyIconConfig({ iconStyle: "circle" });
            await waitForMapIdle();
            let renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayCustomProps);

            await applyIconConfig({
                customIcons: [{ category: "PARKING_GARAGE", iconUrl: "https://dummyimage.com/30x20/4137ce/fff" }]
            });
            await waitForMapIdle();
            renderedPlaces = await waitForRenderedPlaces(numTestPlaces);
            compareToExpectedDisplayProps(renderedPlaces, expectedCustomIcon[name as never]);

            await applyIconConfig({ iconStyle: "poi-like" });
            await waitForMapIdle();
            // poi-like places avoid collisions, thus likely resulting in less num of rendered features:
            renderedPlaces = await queryRenderedFeatures(["placesSymbols"]);
            compareToExpectedPOILikeDisplayProps(renderedPlaces, expectedPOILikeFeatureProps[name as never]);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
