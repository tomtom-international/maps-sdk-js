import { buildMapLibreFlowFilters, buildMapLibreIncidentFilters } from "../trafficFilters";

describe("Traffic filter tests", () => {
    test("build MapLibre incident filters: empty filters", () => {
        expect(buildMapLibreIncidentFilters(undefined as never)).toBeNull();
        expect(buildMapLibreIncidentFilters({} as never)).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [] })).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [{}] })).toBeNull();
        expect(buildMapLibreIncidentFilters({ any: [{ delays: {} }] })).toBeNull();
    });

    test("build MapLibre incident filters: simple filters", () => {
        expect(
            buildMapLibreIncidentFilters({ any: [{ incidentCategories: { show: "only", values: ["jam"] } }] })
        ).toStrictEqual({
            expression: ["==", ["get", "icon_category_0"], 6],
            legacy: ["==", "icon_category_0", 6]
        });
        expect(
            buildMapLibreIncidentFilters({ any: [{ roadCategories: { show: "only", values: ["motorway"] } }] })
        ).toStrictEqual({
            expression: ["==", ["get", "road_category"], "motorway"],
            legacy: ["==", "road_category", "motorway"]
        });
        expect(
            buildMapLibreIncidentFilters({ any: [{ roadSubCategories: { show: "only", values: ["major_local"] } }] })
        ).toStrictEqual({
            expression: ["==", ["get", "road_subcategory"], "major_local"],
            legacy: ["==", "road_subcategory", "major_local"]
        });
        expect(
            buildMapLibreIncidentFilters({
                any: [{ roadCategories: { show: "all_except", values: ["secondary", "tertiary"] } }]
            })
        ).toStrictEqual({
            expression: ["!", ["in", ["get", "road_category"], ["literal", ["secondary", "tertiary"]]]],
            legacy: ["!in", "road_category", "secondary", "tertiary"]
        });
        expect(
            buildMapLibreIncidentFilters({ any: [{ magnitudes: { show: "only", values: ["major"] } }] })
        ).toStrictEqual({
            expression: ["==", ["get", "magnitude"], 3],
            legacy: ["==", "magnitude", 3]
        });
        expect(
            buildMapLibreIncidentFilters({ any: [{ magnitudes: { show: "only", values: ["moderate", "major"] } }] })
        ).toStrictEqual({
            expression: ["in", ["get", "magnitude"], ["literal", [2, 3]]],
            legacy: ["in", "magnitude", 2, 3]
        });
        expect(buildMapLibreIncidentFilters({ any: [{ delays: { mustHaveDelay: true } }] })).toStrictEqual({
            expression: [">", ["get", "delay"], 0],
            legacy: [">", "delay", 0]
        });
        expect(
            buildMapLibreIncidentFilters({ any: [{ delays: { mustHaveDelay: true, minDelayMinutes: 10 } }] })
        ).toStrictEqual({
            expression: [">=", ["get", "delay"], 600],
            legacy: [">=", "delay", 600]
        });
        expect(buildMapLibreIncidentFilters({ any: [{ delays: { minDelayMinutes: 10 } }] })).toStrictEqual({
            expression: ["any", ["!", ["has", "delay"]], ["==", ["get", "delay"], 0], [">=", ["get", "delay"], 600]],
            legacy: ["any", ["!has", "delay"], ["==", "delay", 0], [">=", "delay", 600]]
        });
    });

    test("build MapLibre incident filters: complex filters", () => {
        expect(
            buildMapLibreIncidentFilters({
                any: [
                    {
                        incidentCategories: {
                            show: "only",
                            values: ["jam", "accident", "dangerous_conditions"]
                        },
                        roadCategories: {
                            show: "all_except",
                            values: ["secondary", "tertiary"]
                        },
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
            })
        ).toStrictEqual({
            expression: [
                "any",
                [
                    "all",
                    ["!", ["in", ["get", "road_category"], ["literal", ["secondary", "tertiary"]]]],
                    ["in", ["get", "icon_category_0"], ["literal", [6, 1, 3]]],
                    ["in", ["get", "magnitude"], ["literal", [2, 3]]],
                    ["any", ["!", ["has", "delay"]], ["==", ["get", "delay"], 0], [">=", ["get", "delay"], 300]]
                ],
                ["==", ["get", "icon_category_0"], 8]
            ],
            legacy: [
                "any",
                [
                    "all",
                    ["!in", "road_category", "secondary", "tertiary"],
                    ["in", "icon_category_0", 6, 1, 3],
                    ["in", "magnitude", 2, 3],
                    ["any", ["!has", "delay"], ["==", "delay", 0], [">=", "delay", 300]]
                ],
                ["==", "icon_category_0", 8]
            ]
        });
    });

    test("build MapLibre flow filters: empty filters", () => {
        expect(buildMapLibreFlowFilters(undefined as never)).toBeNull();
        expect(buildMapLibreFlowFilters({} as never)).toBeNull();
        expect(buildMapLibreFlowFilters({ any: [] })).toBeNull();
        expect(buildMapLibreFlowFilters({ any: [{}] })).toBeNull();
    });

    test("build MapLibre flow filters: simple filters", () => {
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadCategories: {
                            show: "only",
                            values: ["motorway", "trunk"]
                        }
                    }
                ]
            })
        ).toStrictEqual({
            expression: ["in", ["get", "road_category"], ["literal", ["motorway", "trunk"]]],
            legacy: ["in", "road_category", "motorway", "trunk"]
        });
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadSubCategories: {
                            show: "all_except",
                            values: ["minor_local", "connecting"]
                        }
                    }
                ]
            })
        ).toStrictEqual({
            expression: ["!", ["in", ["get", "road_subcategory"], ["literal", ["minor_local", "connecting"]]]],
            legacy: ["!in", "road_subcategory", "minor_local", "connecting"]
        });
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        showRoadClosures: "only"
                    }
                ]
            })
        ).toStrictEqual({
            expression: ["==", ["get", "road_closure"], true],
            legacy: ["==", "road_closure", true]
        });
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        showRoadClosures: "all_except"
                    }
                ]
            })
        ).toStrictEqual({
            expression: ["!=", ["get", "road_closure"], true],
            legacy: ["!=", "road_closure", true]
        });
    });

    test("build MapLibre flow filters: complex filters", () => {
        expect(
            buildMapLibreFlowFilters({
                any: [
                    {
                        roadCategories: {
                            show: "only",
                            values: ["motorway", "trunk", "primary"]
                        },
                        roadSubCategories: {
                            show: "only",
                            values: ["major_local"]
                        }
                    },
                    {
                        showRoadClosures: "only"
                    }
                ]
            })
        ).toStrictEqual({
            expression: [
                "any",
                [
                    "all",
                    ["in", ["get", "road_category"], ["literal", ["motorway", "trunk", "primary"]]],
                    ["==", ["get", "road_subcategory"], "major_local"]
                ],
                ["==", ["get", "road_closure"], true]
            ],
            legacy: [
                "any",
                [
                    "all",
                    ["in", "road_category", "motorway", "trunk", "primary"],
                    ["==", "road_subcategory", "major_local"]
                ],
                ["==", "road_closure", true]
            ]
        });
    });
});
