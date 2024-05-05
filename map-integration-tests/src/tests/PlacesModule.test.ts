import type { HasBBox, Place, Places } from "@anw/maps-sdk-js/core";
import type { LocationDisplayProps, PlaceIconConfig } from "map";
import type { MapGeoJSONFeature } from "maplibre-gl";
import sortBy from "lodash/sortBy";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import type { MapsSDKThis } from "./types/MapsSDKThis";
import {
    getNumVisibleLayersBySource,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    initTrafficIncidents,
    queryRenderedFeatures,
    setStyle,
    showPlaces,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import placesTestData from "./data/PlacesModule.test.data.json";
import expectedCustomIcon from "./data/PlacesModuleCustomIcon.test.data.json";
import expectedPOILikeFeatureProps from "./data/PlacesModulePOILikeProps.test.data.json";

const applyIconConfig = async (iconConfig?: PlaceIconConfig) =>
    page.evaluate(
        async (inputConfig) => (globalThis as MapsSDKThis).places?.applyIconConfig(inputConfig),
        iconConfig as PlaceIconConfig
    );

const getBBox = async (places: HasBBox) =>
    page.evaluate((inputPlaces) => (globalThis as MapsSDKThis).MapsSDKCore.bboxFromGeoJSON(inputPlaces), places);

const clearPlaces = async () => page.evaluate(() => (globalThis as MapsSDKThis).places?.clear());

const getNumVisibleLayers = async (sourceID: string) => getNumVisibleLayersBySource(sourceID);

const compareToExpectedDisplayProps = (places: MapGeoJSONFeature[], expectedDisplayProps: LocationDisplayProps[]) =>
    expect(
        sortBy(
            places.map((place) => ({
                id: place.properties.id,
                title: place.properties.title,
                iconID: place.properties.iconID
            })),
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

describe("PlacesModule tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Rendering a single place", async () => {
        await mapEnv.loadMap({ center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces();
        await showPlaces({
            id: "placeID",
            type: "Feature",
            geometry: { type: "Point", coordinates: [-75.43974, 39.82295] },
            properties: { address: { freeformAddress: "Test Address" } }
        } as Place);

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs();
        expect(await getNumVisibleLayers(sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: "placeID", iconID: "default_pin", title: "Test Address" }
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Rendering a place right after changing the style", async () => {
        await mapEnv.loadMap({ center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces();
        await setStyle("standardDark");
        await showPlaces({
            id: "placeID2",
            type: "Feature",
            geometry: { type: "Point", coordinates: [-75.43974, 39.82295] },
            properties: { address: { freeformAddress: "Test Address" } }
        } as Place);

        await waitForMapIdle();

        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs();
        expect(await getNumVisibleLayers(sourceID)).toEqual(2);

        const renderedPlaces = await waitUntilRenderedFeatures(layerIDs, 1, 10000);
        compareToExpectedDisplayProps(renderedPlaces, [
            { id: "placeID2", iconID: "default_pin", title: "Test Address" }
        ]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test.each(placesTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, testPlaces: Places, expectedDisplayProps: PlaceDisplayProps[]) => {
            const bounds = await getBBox(testPlaces);
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs();
            expect(await getNumVisibleLayers(sourceID)).toBe(0);

            await showPlaces(testPlaces);
            const numTestPlaces = testPlaces.features.length;
            let renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(sourceID)).toBe(2);

            // once more, this time inputting the array of features, should yield same results:
            await showPlaces(testPlaces.features);
            await waitForMapIdle();
            renderedPlaces = await waitUntilRenderedFeatures(layerIDs, numTestPlaces, 5000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);
            expect(await getNumVisibleLayers(sourceID)).toBe(2);

            await clearPlaces();
            renderedPlaces = await waitUntilRenderedFeatures(layerIDs, 0, 5000);
            expect(renderedPlaces).toHaveLength(0);
            expect(await getNumVisibleLayers(sourceID)).toBe(0);

            expect(mapEnv.consoleErrors).toHaveLength(0);

            // once more, reloading the map, showing the same again:
            await mapEnv.loadMap({ bounds });
            await initPlaces();
            const { layerIDs: nextLayerIDs } = await getPlacesSourceAndLayerIDs();
            await showPlaces(testPlaces);
            renderedPlaces = await waitUntilRenderedFeatures(nextLayerIDs, numTestPlaces, 10000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            // adding traffic incidents to the style: verifying the places are still shown (state restoration):
            await initTrafficIncidents({ ensureAddedToStyle: true });
            await waitForMapIdle();
            renderedPlaces = await waitUntilRenderedFeatures(nextLayerIDs, numTestPlaces, 5000);
            compareToExpectedDisplayProps(renderedPlaces, expectedDisplayProps);

            // changing the map style: verifying the places are still shown (state restoration):
            await setStyle("standardDark");
            await waitForMapIdle();
            renderedPlaces = await waitUntilRenderedFeatures(nextLayerIDs, numTestPlaces, 5000);
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
            await mapEnv.loadMap(
                { bounds },
                { style: { type: "published", include: ["trafficIncidents", "trafficFlow", "hillshade"] } }
            );
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
            await mapEnv.loadMap(
                { bounds },
                { style: { type: "published", include: ["trafficIncidents", "trafficFlow", "hillshade"] } }
            );
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

describe("Places module programmatic event state tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("putEventState and cleanEventStates", async () => {
        await mapEnv.loadMap({ center: [-75.43974, 39.82295], zoom: 10 });
        await initPlaces();
        await showPlaces([
            {
                type: "Feature",
                id: "A",
                geometry: { type: "Point", coordinates: [-75.43974, 39.82295] },
                properties: { address: { freeformAddress: "Test Address 1" } }
            } as Place,
            {
                type: "Feature",
                id: "B",
                geometry: { type: "Point", coordinates: [-75.44974, 39.82295] },
                properties: { address: { freeformAddress: "Test Address 2" } }
            } as Place
        ]);

        const { layerIDs } = await getPlacesSourceAndLayerIDs();

        // we put event state on the first place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: "hover" }));
        await waitForTimeout(1000);
        let renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 10000), "id");
        expect(renderedPlaces[0].properties.eventState).toBe("hover");
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        // we put event state on the second place without showing yet:
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.putEventState({ index: 1, state: "hover", show: false })
        );
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 5000), "id");
        expect(renderedPlaces[0].properties.eventState).toBe("hover");
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        // we put event state on the second place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 1, state: "hover" }));
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 5000), "id");
        expect(renderedPlaces[0].properties.eventState).toBeUndefined();
        expect(renderedPlaces[1].properties.eventState).toBe("hover");

        // we add event state on the first place:
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: "hover", mode: "add" })
        );
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 5000), "id");
        expect(renderedPlaces[0].properties.eventState).toBe("hover");
        expect(renderedPlaces[1].properties.eventState).toBe("hover");

        // we put click event state on the first place:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.putEventState({ index: 0, state: "click" }));
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 5000), "id");
        expect(renderedPlaces[0].properties.eventState).toBe("click");
        expect(renderedPlaces[1].properties.eventState).toBe("hover");

        // we clean event states:
        await page.evaluate(() => (globalThis as MapsSDKThis).places?.cleanEventStates());
        await waitForTimeout(1000);
        renderedPlaces = sortBy(await waitUntilRenderedFeatures(layerIDs, 2, 5000), "id");
        expect(renderedPlaces[0].properties.eventState).toBeUndefined();
        expect(renderedPlaces[1].properties.eventState).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
