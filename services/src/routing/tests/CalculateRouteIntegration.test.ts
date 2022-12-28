import {
    inputSectionTypes,
    LegSectionProps,
    SectionProps,
    SectionsProps,
    SectionType,
    Summary
} from "@anw/go-sdk-js/core";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { calculateRoute } from "../CalculateRoute";

const assertSummaryBasics = (summary: Summary): void => {
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
                locations: [
                    [7.675106, 46.490793],
                    [7.74328, 46.403849],
                    [1.32248, 51.111645]
                ],
                sectionTypes: testInputSectionTypes,
                vehicle: {
                    dimensions: {
                        weightKG: 1500
                    },
                    consumption: {
                        speedsToConsumptionsLiters: [
                            { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                            { speedKMH: 130, consumptionUnitsPer100KM: 11.5 }
                        ],
                        auxiliaryPowerInLitersPerHour: 0.2,
                        currentFuelLiters: 55,
                        fuelEnergyDensityInMJoulesPerLiter: 34.2,
                        efficiency: {
                            acceleration: 0.33,
                            deceleration: 0.83,
                            uphill: 0.27,
                            downhill: 0.51
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

    test("Amsterdam to Leiden to Rotterdam with electric vehicle parameters", async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
                // Dragged point in Pijnacker
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.42788, 52.01833]
                    },
                    properties: {
                        radiusMeters: 20
                    }
                },
                [4.47059, 51.92291]
            ],
            vehicle: {
                dimensions: {
                    weightKG: 3500
                },
                consumption: {
                    engineType: "electric",
                    speedsToConsumptionsKWH: [
                        { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                        { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
                    ],
                    auxiliaryPowerInkW: 1.7,
                    currentChargeKWH: 43,
                    maxChargeKWH: 85,
                    efficiency: {
                        acceleration: 0.66,
                        deceleration: 0.91,
                        uphill: 0.74,
                        downhill: 0.73
                    }
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

    test("Roses to Olot thrilling route with alternatives", async () => {
        const result = await calculateRoute({
            language: "es-ES",
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211]
            ],
            avoid: ["carpools", "ferries"],
            computeAdditionalTravelTimeFor: "all",
            considerTraffic: false,
            instructionsType: "tagged",
            maxAlternatives: 2,
            routeType: "thrilling",
            sectionTypes: ["traffic", "ferry", "tollRoad"],
            travelMode: "motorcycle",
            thrillingParams: {
                hilliness: "low",
                windingness: "high"
            },
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
});
