import {
    inputSectionTypes,
    LegSectionProps,
    SummaryBase,
    SectionProps,
    SectionsProps,
    SectionType
} from "@anw/maps-sdk-js/core";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { calculateRoute } from "../CalculateRoute";
import { CalculateRouteParams } from "../types/CalculateRouteParams";

const assertSummaryBasics = (summary: SummaryBase): void => {
    expect(summary).toBeDefined();
    expect(summary.lengthInMeters).toBeDefined();
    expect(summary.travelTimeInSeconds).toBeDefined();
    expect(summary.trafficDelayInSeconds).toBeDefined();
    expect(summary.trafficLengthInMeters).toBeDefined();
    expect(summary.departureTime).toBeDefined();
    expect(summary.arrivalTime).toBeDefined();
};

const assertLegSectionBasics = (section: LegSectionProps): void => {
    expect(section.startPointIndex).toBeDefined();
    expect(section.endPointIndex).toBeDefined();
    assertSummaryBasics(section.summary);
};

const assertSectionBasics = (section: SectionProps): void => {
    expect(section.startPointIndex).toBeDefined();
    expect(section.endPointIndex).toBeDefined();
};

describe("Calculate route integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    test(
        "Route from Kandersteg to Dover via Lötschen Pass with specified " +
            "sectionTypes and combustion vehicle parameters",
        async () => {
            const testInputSectionTypes: SectionType[] = ["carTrain", "motorway", "tollRoad", "tollVignette", "urban"];

            const result = await calculateRoute({
                geoInputs: [
                    [7.675106, 46.490793],
                    [7.74328, 46.403849],
                    [1.32248, 51.111645]
                ],
                sectionTypes: testInputSectionTypes,
                vehicle: {
                    dimensions: { weightKG: 1500 },
                    engine: {
                        type: "combustion",
                        currentFuelInLiters: 50,
                        model: {
                            consumption: {
                                speedsToConsumptionsLiters: [
                                    { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                                    { speedKMH: 130, consumptionUnitsPer100KM: 11.5 }
                                ],
                                auxiliaryPowerInLitersPerHour: 0.2,
                                fuelEnergyDensityInMJoulesPerLiter: 34.2,
                                efficiency: {
                                    acceleration: 0.33,
                                    deceleration: 0.83,
                                    uphill: 0.27,
                                    downhill: 0.51
                                }
                            }
                        }
                    }
                }
            });

            expect(result?.features?.length).toEqual(1);
            const routeFeature = result.features[0];
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            expect(routeProperties.summary.fuelConsumptionInLiters).toBeDefined();
            const sections = routeProperties.sections;
            expect(sections.leg).toHaveLength(2);
            assertLegSectionBasics(sections.leg[0]);
            expect(sections.leg[0].summary.fuelConsumptionInLiters).toBeDefined();
            assertLegSectionBasics(sections.leg[1]);
            expect(sections.leg[1].summary.fuelConsumptionInLiters).toBeDefined();
            // Asserting the existence of sections in response:
            for (const inputSectionType of testInputSectionTypes) {
                expect(routeProperties.sections[inputSectionType]?.length).toBeGreaterThan(0);
                for (const section of routeProperties.sections[inputSectionType] || []) {
                    assertSectionBasics(section as SectionProps);
                }
            }
            // Asserting the lack of unrequested sections in the response:
            for (const inputSectionType of inputSectionTypes.filter(
                (sectionType) => !["leg", ...testInputSectionTypes].includes(sectionType)
            )) {
                expect(routeProperties.sections[inputSectionType]).toBeUndefined();
            }
        }
    );

    test("Amsterdam to Leiden to Rotterdam with electric vehicle parameters (non - LDEVR)", async () => {
        const result = await calculateRoute({
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
                // Dragged point in Pijnacker
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.42788, 52.01833]
                    },
                    properties: { radiusMeters: 20 }
                },
                [4.47059, 51.92291]
            ],
            vehicle: {
                dimensions: {
                    weightKG: 3500
                },
                engine: {
                    type: "electric",
                    model: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
                            ],
                            auxiliaryPowerInkW: 1.7,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73
                            }
                        },
                        charging: {
                            maxChargeKWH: 85
                        }
                    },
                    currentChargePCT: 50
                }
            }
        });
        expect(result?.features?.length).toEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        assertSummaryBasics(routeProperties.summary);
        expect(routeProperties.summary.batteryConsumptionInkWh).toBeDefined();
        const sections = routeProperties.sections;
        expect(sections.leg).toHaveLength(2);
        assertLegSectionBasics(sections.leg[0]);
        expect(sections.leg[0].summary.batteryConsumptionInkWh).toBeDefined();
        assertLegSectionBasics(sections.leg[1]);
        expect(sections.leg[1].summary.batteryConsumptionInkWh).toBeDefined();
    });

    test("LDEVR: Cologne to Berlin", async () => {
        const params: CalculateRouteParams = {
            geoInputs: [
                [6.90852, 50.9542],
                [13.45686, 52.50825]
            ],
            vehicle: {
                engine: {
                    type: "electric",
                    currentChargePCT: 80,
                    chargingPreferences: {
                        minChargeAtDestinationPCT: 50,
                        minChargeAtChargingStopsPCT: 10
                    },
                    model: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 32, consumptionUnitsPer100KM: 10.87 },
                                { speedKMH: 77, consumptionUnitsPer100KM: 18.01 }
                            ]
                        },
                        charging: {
                            maxChargeKWH: 40,
                            batteryCurve: [
                                {
                                    stateOfChargeInkWh: 50,
                                    maxPowerInkW: 200
                                },
                                {
                                    stateOfChargeInkWh: 70,
                                    maxPowerInkW: 100
                                },
                                {
                                    stateOfChargeInkWh: 80,
                                    maxPowerInkW: 40
                                }
                            ],
                            chargingConnectors: [
                                {
                                    currentType: "AC3",
                                    plugTypes: [
                                        "IEC_62196_Type_2_Outlet",
                                        "IEC_62196_Type_2_Connector_Cable_Attached",
                                        "Combo_to_IEC_62196_Type_2_Base"
                                    ],
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2,
                                    maxPowerInkW: 11
                                },
                                {
                                    currentType: "DC",
                                    plugTypes: [
                                        "IEC_62196_Type_2_Outlet",
                                        "IEC_62196_Type_2_Connector_Cable_Attached",
                                        "Combo_to_IEC_62196_Type_2_Base"
                                    ],
                                    voltageRange: {
                                        minVoltageInV: 0,
                                        maxVoltageInV: 500
                                    },
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2,
                                    maxPowerInkW: 150
                                },
                                {
                                    currentType: "DC",
                                    plugTypes: [
                                        "IEC_62196_Type_2_Outlet",
                                        "IEC_62196_Type_2_Connector_Cable_Attached",
                                        "Combo_to_IEC_62196_Type_2_Base"
                                    ],
                                    voltageRange: {
                                        minVoltageInV: 500,
                                        maxVoltageInV: 2000
                                    },
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2
                                }
                            ],
                            chargingTimeOffsetInSec: 60
                        }
                    }
                }
            }
        };

        const result = await calculateRoute(params);
        expect(result?.features?.length).toEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        const legs = routeProperties.sections.leg;
        // with charging stops we must have more than 1 leg generated:
        expect(legs.length).toBeGreaterThan(1);
        const routeSummary = routeProperties.summary;
        assertSummaryBasics(routeSummary);
        // asserting summary properties relevant to ldevr:
        expect(routeSummary.totalChargingTimeInSeconds).toBeGreaterThan(1000);
        expect(routeSummary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
        // param is min 50% at arrival:
        expect(routeSummary.remainingChargeAtArrivalInPCT).toBeGreaterThan(40);
        expect(routeSummary.remainingChargeAtArrivalInPCT).toBeLessThan(100);
        expect(routeSummary.batteryConsumptionInkWh).toBeGreaterThan(100);
        expect(routeSummary.batteryConsumptionInPCT).toBeGreaterThan(100);

        // we assert the legs excluding the last one:
        for (let i = 0; i < legs.length - 1; i++) {
            const leg = legs[i];
            assertSummaryBasics(leg.summary);
            expect(leg.summary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
            // param is min 10% at stops:
            expect(leg.summary.remainingChargeAtArrivalInPCT).toBeGreaterThan(8);
            expect(leg.summary.chargingInformationAtEndOfLeg).toBeDefined();
        }

        // the last leg has some particularities
        const lastLeg = legs[legs.length - 1];
        assertSummaryBasics(lastLeg.summary);
        expect(lastLeg.summary.remainingChargeAtArrivalInkWh).toEqual(routeSummary.remainingChargeAtArrivalInkWh);
        expect(lastLeg.summary.remainingChargeAtArrivalInPCT).toEqual(routeSummary.remainingChargeAtArrivalInPCT);
        // arriving at destination, not a charging stop:
        expect(lastLeg.summary.chargingInformationAtEndOfLeg).toBeUndefined();
    });

    test("Roses to Olot thrilling route with alternatives", async () => {
        const result = await calculateRoute({
            language: "es-ES",
            geoInputs: [
                [3.1748, 42.26297],
                [2.48819, 42.18211]
            ],
            costModel: {
                avoid: ["carpools", "ferries"],
                considerTraffic: false,
                routeType: "thrilling",
                thrillingParams: {
                    hilliness: "low",
                    windingness: "high"
                }
            },
            computeAdditionalTravelTimeFor: "all",
            instructionsType: "tagged",
            maxAlternatives: 2,
            sectionTypes: ["traffic", "ferry", "tollRoad"],
            travelMode: "motorcycle",
            when: {
                option: "arriveBy",
                date: new Date()
            }
        });

        expect(result?.features?.length).toEqual(3);
        for (const routeFeature of result.features) {
            expect(routeFeature).toBeDefined();
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            expect(routeProperties.guidance).toBeDefined();
            const sections: SectionsProps = routeProperties.sections;
            expect(sections.leg).toHaveLength(1);
            assertLegSectionBasics(sections.leg[0]);
            for (const sectionArray of Object.values(sections)) {
                for (const section of sectionArray) {
                    assertSectionBasics(section as SectionProps);
                }
            }
        }
    });

    test("Route reconstruction flows", async () => {
        const firstRoute = (
            await calculateRoute({
                // Amsterdam to Leiden to Rotterdam
                geoInputs: [
                    [4.89066, 52.37317],
                    [4.49015, 52.16109],
                    [4.47059, 51.92291]
                ]
            })
        ).features[0];

        const firstRouteCoords = firstRoute.geometry.coordinates;
        expect(firstRouteCoords.length).toBeGreaterThan(1000);

        const reconstructedRouteResponse = await calculateRoute({ geoInputs: [firstRoute] });
        expect(reconstructedRouteResponse?.features?.length).toEqual(1);
        const reconstructedRoute = reconstructedRouteResponse.features[0];
        const reconstructedRouteCoords = reconstructedRoute.geometry.coordinates;

        // checking that the first and reconstructed routes have a similar amount of points:
        expect(Math.abs(reconstructedRouteCoords.length - firstRouteCoords.length)).toBeLessThan(50);

        // checking that the first and reconstructed routes have the same origin and destination points:
        expect(firstRouteCoords[0]).toStrictEqual(reconstructedRouteCoords[0]);
        expect(firstRouteCoords[firstRouteCoords.length - 1]).toStrictEqual(
            reconstructedRouteCoords[reconstructedRouteCoords.length - 1]
        );

        // comparing sections (the amount of sections for each type should be the same):
        const firstRouteSections = firstRoute.properties.sections;
        const reconstructedRouteSections = reconstructedRoute.properties.sections;
        expect(reconstructedRouteSections.leg).toHaveLength(firstRouteSections.leg.length);
        expect(reconstructedRouteSections.urban).toHaveLength(firstRouteSections.urban?.length || 0);
        expect(reconstructedRouteSections.motorway).toHaveLength(firstRouteSections.motorway?.length || 0);
        expect(reconstructedRouteSections.ferry).toBeUndefined();

        // appending the entire reconstructed route into a larger context
        // with new origin in Zaandam and new destination in Dordrecht
        const routeWithEmbeddedRoute = (
            await calculateRoute({
                geoInputs: [[4.82409, 52.43924], reconstructedRoute, [4.6684, 51.81111]]
            })
        ).features[0];

        const routeWithEmbeddedRouteCoords = routeWithEmbeddedRoute.geometry.coordinates;
        // the new route should be significantly longer:
        expect(routeWithEmbeddedRouteCoords.length).toBeGreaterThan(reconstructedRouteCoords.length + 500);

        const routeWithEmbeddedRouteSections = routeWithEmbeddedRoute.properties.sections;

        // comparing sections (the amount of sections for the new expanded route should be higher)
        // 2 more legs expected before and after the embedded route:
        expect(routeWithEmbeddedRouteSections.leg).toHaveLength(reconstructedRouteSections.leg.length + 2);
        expect(routeWithEmbeddedRouteSections.urban?.length).toBeGreaterThan(
            reconstructedRouteSections.urban?.length || 0
        );
    });
});
