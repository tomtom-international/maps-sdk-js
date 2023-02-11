import { MapGeoJSONFeature } from "maplibre-gl";
import { indexedMagnitudes } from "@anw/go-sdk-js/core";
import {
    incidentCategories as availableIncidentCategories,
    incidentCategoriesMapping,
    IncidentCategory,
    RoadCategory,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID,
    VectorTilesTrafficConfig
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import {
    assertTrafficVisibility,
    getVisibleLayersBySource,
    waitForTimeout,
    waitUntilRenderedFeaturesChange
} from "./util/TestUtils";

const waitForRenderedFlowChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(
        (await getVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).map((layer) => layer.id),
        previousFeaturesCount,
        10000
    );

const waitForRenderedIncidentsChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(
        (await getVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).map((layer) => layer.id),
        previousFeaturesCount,
        10000
    );

const mapIncidentCategories = (categories: IncidentCategory[]): number[] =>
    categories.map((category) => incidentCategoriesMapping[category]);

const getByIncidentCategories = (
    renderedIncidents: MapGeoJSONFeature[],
    incidentCategories: IncidentCategory[]
): MapGeoJSONFeature[] =>
    renderedIncidents.filter((incident) =>
        mapIncidentCategories(incidentCategories).includes(incident.properties["icon_category_0"])
    );

const getByRoadCategories = (renderedItems: MapGeoJSONFeature[], roadCategories: RoadCategory[]): MapGeoJSONFeature[] =>
    renderedItems.filter((incident) => roadCategories.includes(incident.properties["road_category"]));

const initTraffic = async (config?: VectorTilesTrafficConfig) =>
    page.evaluate(async (inputConfig?) => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, inputConfig);
    }, config as VectorTilesTrafficConfig);

describe("Map vector tile traffic module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Failing to initialize if fully excluded from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394],
                zoom: 15
            },
            {
                exclude: ["traffic_incidents", "traffic_flow"]
            }
        );

        await expect(initTraffic()).rejects.toBeDefined();
    });

    test("Vector tiles traffic visibility changes in different ways", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, { visible: false });
        });
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: false });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(true));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(false));
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: false });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setIncidentIconsVisible(true));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: false });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setFlowVisible(true));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setIncidentIconsVisible(false));
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.applyConfig({ visible: true }));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setIncidentIconsVisible(false));
        await assertTrafficVisibility({ incidents: true, incidentIcons: false, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.resetConfig());
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.applyConfig({ incidents: { visible: false } }));
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: true });

        await page.evaluate(() =>
            (globalThis as GOSDKThis).traffic?.applyConfig({ incidents: { icons: { visible: false } } })
        );
        await assertTrafficVisibility({ incidents: true, incidentIcons: false, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.applyConfig({ flow: { visible: false } }));
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: false });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.resetConfig());
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.resetConfig());
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic incidents filtering with config changes", async () => {
        await mapEnv.loadMap(
            {
                // London:
                zoom: 12,
                center: [-0.12621, 51.50394]
            },
            {
                exclude: ["traffic_flow", "hillshade", "poi"]
            }
        );
        await initTraffic();
        await waitForTimeout(3000);

        const defaultIncidents = await waitForRenderedIncidentsChange(0);
        expect(defaultIncidents.length).toBeGreaterThan(4);
        expect(getByIncidentCategories(defaultIncidents, ["road_closed"]).length).toBeGreaterThan(0);

        // Showing road closures only:
        await page.evaluate(async () =>
            (globalThis as GOSDKThis).traffic?.applyConfig({
                incidents: {
                    filters: {
                        any: [
                            {
                                incidentCategories: {
                                    show: "only",
                                    values: ["road_closed"]
                                }
                            }
                        ]
                    }
                }
            })
        );

        const roadClosedIncidents = await waitForRenderedIncidentsChange(defaultIncidents.length);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ["road_closed"])).toHaveLength(roadClosedIncidents.length);
        expect(
            getByIncidentCategories(
                roadClosedIncidents,
                availableIncidentCategories.filter((category) => category != "road_closed")
            )
        ).toHaveLength(0);

        // Changing filter to show road closures and major roads:
        await page.evaluate(async () =>
            (globalThis as GOSDKThis).traffic?.applyConfig({
                incidents: {
                    filters: {
                        any: [
                            {
                                incidentCategories: {
                                    show: "only",
                                    values: ["road_closed"]
                                }
                            },
                            {
                                roadCategories: {
                                    show: "only",
                                    values: ["motorway", "trunk", "primary"]
                                }
                            }
                        ]
                    }
                }
            })
        );

        const roadClosedAndMajorRoadIncidents = await waitForRenderedIncidentsChange(roadClosedIncidents.length);
        expect(roadClosedAndMajorRoadIncidents.length).toBeLessThan(defaultIncidents.length);
        // The addition of major road and road_closed incidents should be greater or equal than the total
        // (since there can be overlap due to the "any"/"or" filter)
        expect(
            getByRoadCategories(roadClosedAndMajorRoadIncidents, ["motorway", "trunk", "primary"]).length +
                getByIncidentCategories(roadClosedAndMajorRoadIncidents, ["road_closed"]).length
        ).toBeGreaterThanOrEqual(roadClosedAndMajorRoadIncidents.length);

        // We reset the config and assert that we have the same amount of incidents as the beginning:
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.resetConfig());
        const resetIncidents = await waitForRenderedIncidentsChange(roadClosedAndMajorRoadIncidents.length);
        expect(resetIncidents).toHaveLength(defaultIncidents.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic flow filtering with initial config", async () => {
        await mapEnv.loadMap(
            {
                zoom: 12,
                center: [2.37327, 48.85903]
            },
            {
                exclude: ["traffic_incidents", "hillshade", "poi"]
            }
        );

        await initTraffic({
            flow: {
                filters: {
                    any: [
                        {
                            roadCategories: {
                                show: "only",
                                values: ["motorway"]
                            },
                            showRoadClosures: "all_except"
                        }
                    ]
                }
            }
        });

        await waitForTimeout(3000);
        // (incidents excluded above)
        await assertTrafficVisibility({ incidents: false, incidentIcons: false, flow: true });
        const renderedFlowSegments = await waitForRenderedFlowChange(0);

        // We only show for: "motorway", "trunk":
        expect(getByRoadCategories(renderedFlowSegments, ["motorway"])).toHaveLength(renderedFlowSegments.length);
        expect(renderedFlowSegments.filter((segment) => segment.properties["road_closure"] === true)).toHaveLength(0);

        // Showing flow in road closures only:
        await page.evaluate(async () =>
            (globalThis as GOSDKThis).traffic?.filterFlow({
                any: [
                    {
                        showRoadClosures: "only"
                    }
                ]
            })
        );

        const renderedRoadClosures = await waitForRenderedFlowChange(renderedFlowSegments.length);
        expect(renderedRoadClosures.filter((segment) => segment.properties["road_closure"] === true)).toHaveLength(
            renderedRoadClosures.length
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic incidents and flow filtering with complex initial config", async () => {
        await mapEnv.loadMap(
            {
                zoom: 13,
                center: [-0.12621, 51.50394]
            },
            {
                exclude: ["hillshade"]
            }
        );

        await initTraffic({
            incidents: {
                filters: {
                    any: [
                        {
                            magnitudes: {
                                show: "only",
                                values: ["moderate", "major"]
                            },
                            delays: {
                                minDelayMinutes: 5
                            }
                        },
                        {
                            incidentCategories: {
                                show: "only",
                                values: ["road_closed"]
                            }
                        }
                    ]
                }
            },
            flow: {
                filters: {
                    any: [
                        {
                            roadCategories: {
                                show: "only",
                                values: ["motorway", "trunk", "primary"]
                            },
                            showRoadClosures: "all_except"
                        }
                    ]
                }
            }
        });

        await waitForTimeout(3000);

        // INCIDENTS assertions:
        const renderedIncidents = await waitForRenderedIncidentsChange(0);
        expect(renderedIncidents.length).toBeGreaterThan(5);

        // There should be no incidents that have delays, and such delays are less than 5 min:
        expect(
            renderedIncidents.filter((incident) => incident.properties.delay && incident.properties.delay < 300)
        ).toHaveLength(0);

        expect(getByIncidentCategories(renderedIncidents, ["road_closed"]).length).toBeGreaterThan(0);

        // We only allow for moderate, major and indefinite (because of road closures) magnitudes:
        expect(
            renderedIncidents.filter((incident) =>
                [indexedMagnitudes.indexOf("unknown"), indexedMagnitudes.indexOf("minor")].includes(
                    incident.properties.magnitude
                )
            )
        ).toHaveLength(0);

        // FLOW assertions:
        const renderedFlowSegments = await waitForRenderedFlowChange(0);
        expect(renderedFlowSegments.length).toBeGreaterThan(5);

        // We only show for: "motorway", "trunk", "primary"
        expect(getByRoadCategories(renderedFlowSegments, ["motorway", "trunk", "primary"])).toHaveLength(
            renderedFlowSegments.length
        );
        expect(getByRoadCategories(renderedFlowSegments, ["secondary", "tertiary", "street"])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // (We'll verify that using dedicated methods for filtering and visibility do not affect each other)
    test("Traffic visibility and filtering with dedicated methods", async () => {
        await mapEnv.loadMap(
            {
                // London:
                zoom: 12,
                center: [-0.12621, 51.50394]
            },
            {
                exclude: ["hillshade", "poi"]
            }
        );

        await initTraffic();

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setFlowVisible(false));
        // Showing road closures only:
        await page.evaluate(async () =>
            (globalThis as GOSDKThis).traffic?.filterIncidents({
                any: [
                    {
                        incidentCategories: {
                            show: "only",
                            values: ["road_closed"]
                        }
                    }
                ]
            })
        );
        await waitForTimeout(3000);

        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: false });
        const roadClosedIncidents = await waitForRenderedIncidentsChange(0);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ["road_closed"])).toHaveLength(roadClosedIncidents.length);
        // (changing incidents filter directly shouldn't affect flow visibility):
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: false });

        // Showing flow in primary roads only:
        await page.evaluate(async () =>
            (globalThis as GOSDKThis).traffic?.filterFlow({
                any: [
                    {
                        roadCategories: {
                            show: "only",
                            values: ["primary"]
                        }
                    }
                ]
            })
        );

        // (changing flow filter directly shouldn't affect flow visibility):
        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: false });
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setFlowVisible(true));
        await waitForTimeout(3000);

        await assertTrafficVisibility({ incidents: true, incidentIcons: true, flow: true });
    });
});
