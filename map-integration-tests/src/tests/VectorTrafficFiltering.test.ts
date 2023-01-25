import { MapGeoJSONFeature } from "maplibre-gl";
import { indexedMagnitudes } from "@anw/go-sdk-js/core";
import {
    incidentCategories as availableIncidentCategories,
    incidentCategoriesMapping,
    IncidentCategory,
    RoadCategory,
    VECTOR_TILES_INCIDENTS_SOURCE_ID,
    VectorTilesTrafficConfig,
    VECTOR_TILES_FLOW_SOURCE_ID
} from "map";
import {
    getVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitUntilRenderedFeaturesChange
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";

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
    page.evaluate(async (inputConfig) => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, inputConfig);
    }, config as VectorTilesTrafficConfig);

describe("Map vector tile traffic config tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Traffic incidents filtering with config changes", async () => {
        await mapEnv.loadMap(
            {
                zoom: 12,
                center: [-0.12621, 51.50394]
            },
            {
                exclude: ["traffic_flow", "hillshade", "poi"]
            }
        );
        await initTraffic();

        const originalRenderedIncidents = await waitForRenderedIncidentsChange(0);
        expect(originalRenderedIncidents.length).toBeGreaterThan(5);
        expect(getByIncidentCategories(originalRenderedIncidents, ["road_closed"]).length).toBeGreaterThan(0);

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

        const originalIncidentsCount = originalRenderedIncidents.length;
        const roadClosedIncidents = await waitForRenderedIncidentsChange(originalIncidentsCount);

        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ["road_closed"])).toHaveLength(roadClosedIncidents.length);
        expect(
            getByIncidentCategories(
                roadClosedIncidents,
                availableIncidentCategories.filter((category) => category != "road_closed")
            )
        ).toHaveLength(0);

        // Changing filter to show road_closures, or major/trunk roads:
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
                                    values: ["motorway", "trunk"]
                                }
                            }
                        ]
                    }
                }
            })
        );

        const roadClosedOrMajorRoadsIncidents = await waitForRenderedIncidentsChange(originalIncidentsCount);
        // The addition of motorway-trunk and road_closed incidents should be greater or equal than the total
        // (since there can be overlap due to the "any"/"or" filter)
        expect(
            getByRoadCategories(roadClosedOrMajorRoadsIncidents, ["motorway", "trunk"]).length +
                getByIncidentCategories(roadClosedOrMajorRoadsIncidents, ["road_closed"]).length
        ).toBeGreaterThanOrEqual(roadClosedOrMajorRoadsIncidents.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic incidents and flow filtering with initial config", async () => {
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
        expect(getByRoadCategories(renderedFlowSegments, ["motorway", "trunk", "primary"]).length).toBeGreaterThan(0);
        expect(getByRoadCategories(renderedFlowSegments, ["secondary", "tertiary", "street"])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
