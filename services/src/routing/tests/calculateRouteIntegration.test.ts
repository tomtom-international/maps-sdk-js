import type { LegSectionProps, SectionProps, SectionsProps, SectionType, SummaryBase } from '@cet/maps-sdk-js/core';
import { inputSectionTypes } from '@cet/maps-sdk-js/core';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { calculateRoute } from '../calculateRoute';
import type { CalculateRouteRequestAPI } from '../types/apiRequestTypes';
import type { CalculateRouteResponseAPI } from '../types/apiResponseTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';

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

describe('Calculate route integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    test('Default A-B route', async () => {
        const result = await calculateRoute({
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211],
            ],
        });

        expect(result?.features?.length).toEqual(1);
        for (const routeFeature of result.features) {
            expect(routeFeature).toBeDefined();
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            expect(routeProperties.guidance).toBeUndefined();
            expect(routeProperties.progress?.length).toBeGreaterThan(0);
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

    test('Route from Kandersteg to Dover with minimal vehicle dimensions', async () => {
        const result = await calculateRoute({
            locations: [
                [7.675106, 46.490793], // Kandersteg
                [1.32248, 51.111645], // Dover
            ],
            vehicle: {
                model: {
                    dimensions: { weightKG: 1500 },
                },
            },
        });

        expect(result?.features?.length).toEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        assertSummaryBasics(routeProperties.summary);
        const sections = routeProperties.sections;
        expect(sections.leg).toHaveLength(1);
        assertLegSectionBasics(sections.leg[0]);
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    });

    test(
        'Route from Kandersteg to Dover via Lötschen Pass with specified ' +
            'sectionTypes and combustion vehicle parameters',
        async () => {
            const testInputSectionTypes: SectionType[] = ['carTrain', 'motorway', 'toll', 'urban'];

            const result = await calculateRoute({
                locations: [
                    [7.675106, 46.490793],
                    [7.74328, 46.403849],
                    [1.32248, 51.111645],
                ],
                language: undefined, // we ensure no language param is sent
                costModel: { traffic: 'live', avoid: ['tunnels', 'lowEmissionZones'], routeType: 'efficient' },
                sectionTypes: testInputSectionTypes,
                vehicle: {
                    engineType: 'combustion',
                    model: {
                        dimensions: { weightKG: 1500 },
                        engine: {
                            consumption: {
                                speedsToConsumptionsLiters: [
                                    { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                                    { speedKMH: 130, consumptionUnitsPer100KM: 11.5 },
                                ],
                                auxiliaryPowerInLitersPerHour: 0.2,
                                fuelEnergyDensityInMJoulesPerLiter: 34.2,
                                efficiency: {
                                    acceleration: 0.33,
                                    deceleration: 0.83,
                                    uphill: 0.27,
                                    downhill: 0.51,
                                },
                            },
                        },
                    },
                    state: {
                        currentFuelInLiters: 50,
                    },
                },
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
                (sectionType) => !['leg', ...testInputSectionTypes].includes(sectionType),
            )) {
                expect(routeProperties.sections[inputSectionType]).toBeUndefined();
            }
            expect(routeProperties.progress?.length).toBeGreaterThan(0);
        },
    );

    test('Amsterdam to Leiden to Rotterdam with electric vehicle parameters (non - LDEVR)', async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
                // TODO soft waypoints not working with Orbis, so I commented them out
                // Dragged point in Pijnacker
                // {
                //     type: "Feature",
                //     geometry: {
                //         type: "Point",
                //         coordinates: [4.42788, 52.01833]
                //     },
                //     properties: { radiusMeters: 20 }
                // },
                [4.47059, 51.92291],
            ],
            vehicle: {
                engineType: 'electric',
                model: {
                    dimensions: {
                        weightKG: 3500,
                    },
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInkW: 1.7,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                        charging: { maxChargeKWH: 85 },
                    },
                },
                state: {
                    currentChargePCT: 50,
                },
            },
        });
        expect(result?.features?.length).toEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        assertSummaryBasics(routeProperties.summary);
        expect(routeProperties.summary.batteryConsumptionInkWh).toBeGreaterThan(0);
        const sections = routeProperties.sections;
        expect(sections.leg).toHaveLength(2);
        assertLegSectionBasics(sections.leg[0]);
        expect(sections.leg[0].summary.batteryConsumptionInkWh).toBeGreaterThan(0);
        // Expected PCT available because we defined maxChargeKWH in vehicle model:
        expect(sections.leg[0].summary.batteryConsumptionInPCT).toBeGreaterThan(0);
        assertLegSectionBasics(sections.leg[1]);
        expect(sections.leg[1].summary.batteryConsumptionInkWh).toBeGreaterThan(0);
        // Expected PCT available because we defined maxChargeKWH in vehicle model:
        expect(sections.leg[0].summary.batteryConsumptionInPCT).toBeGreaterThan(0);
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    });

    test('LDEVR with explicit vehicle params and an alternative', async () => {
        const params: CalculateRouteParams = {
            locations: [
                [2.1734, 41.3851], // barcelona
                [2.8214, 41.9794], // girona
            ],
            maxAlternatives: 0,
            vehicle: {
                engineType: 'electric',
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 32, consumptionUnitsPer100KM: 10.87 },
                                { speedKMH: 77, consumptionUnitsPer100KM: 18.01 },
                            ],
                        },
                        charging: {
                            maxChargeKWH: 40,
                            batteryCurve: [
                                { stateOfChargeInkWh: 50, maxPowerInkW: 200 },
                                { stateOfChargeInkWh: 70, maxPowerInkW: 100 },
                                { stateOfChargeInkWh: 80, maxPowerInkW: 40 },
                            ],
                            chargingConnectors: [
                                {
                                    currentType: 'AC3',
                                    plugTypes: [
                                        'IEC_62196_Type_2_Outlet',
                                        'IEC_62196_Type_2_Connector_Cable_Attached',
                                        'Combo_to_IEC_62196_Type_2_Base',
                                    ],
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2,
                                    maxPowerInkW: 11,
                                },
                                {
                                    currentType: 'DC',
                                    plugTypes: [
                                        'IEC_62196_Type_2_Outlet',
                                        'IEC_62196_Type_2_Connector_Cable_Attached',
                                        'Combo_to_IEC_62196_Type_2_Base',
                                    ],
                                    voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2,
                                    maxPowerInkW: 150,
                                },
                                {
                                    currentType: 'DC',
                                    plugTypes: [
                                        'IEC_62196_Type_2_Outlet',
                                        'IEC_62196_Type_2_Connector_Cable_Attached',
                                        'Combo_to_IEC_62196_Type_2_Base',
                                    ],
                                    voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
                                    efficiency: 0.9,
                                    baseLoadInkW: 0.2,
                                },
                            ],
                            chargingTimeOffsetInSec: 60,
                        },
                    },
                },
                state: { currentChargePCT: 80 },
                preferences: {
                    chargingPreferences: { minChargeAtDestinationPCT: 50, minChargeAtChargingStopsPCT: 10 },
                },
            },
            guidance: { type: 'coded' },
        };

        const result = await calculateRoute(params);
        expect(result?.features?.length).toBeGreaterThanOrEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        const legs = routeProperties.sections.leg;
        // with charging stops we must have more than 1 leg generated:
        expect(legs.length).toBeGreaterThan(1);
        const routeSummary = routeProperties.summary;
        assertSummaryBasics(routeSummary);
        // asserting summary properties relevant to ldevr:
        expect(routeSummary.totalChargingTimeInSeconds).toBeGreaterThan(100);
        // Expected PCT available because we defined maxChargeKWH in vehicle model:
        expect(routeSummary.remainingChargeAtArrivalInPCT).toBeGreaterThan(0);
        expect(routeSummary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
        // param is min 50% at arrival:
        expect(routeSummary.batteryConsumptionInkWh).toBeGreaterThan(10);

        // we assert the legs excluding the last one:
        for (let i = 0; i < legs.length - 1; i++) {
            const leg = legs[i];
            assertSummaryBasics(leg.summary);
            expect(leg.summary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
            // Expected PCT available because we defined maxChargeKWH in vehicle model:
            expect(leg.summary.remainingChargeAtArrivalInPCT).toBeGreaterThan(0);
            expect(leg.summary.chargingInformationAtEndOfLeg).toBeDefined();
            // Expected PCT available because we defined maxChargeKWH in vehicle model:
            // param is min 10% at stops:
            expect(leg.summary.chargingInformationAtEndOfLeg?.properties.targetChargeInPCT).toBeGreaterThanOrEqual(10);
        }

        // the last leg has some particularities
        const lastLeg = legs[legs.length - 1];
        assertSummaryBasics(lastLeg.summary);
        expect(lastLeg.summary.remainingChargeAtArrivalInkWh).toEqual(routeSummary.remainingChargeAtArrivalInkWh);
        // Expected PCT available because we defined maxChargeKWH in vehicle model:
        expect(lastLeg.summary.remainingChargeAtArrivalInPCT).toEqual(routeSummary.remainingChargeAtArrivalInPCT);
        // arriving at destination, not a charging stop:
        expect(lastLeg.summary.chargingInformationAtEndOfLeg).toBeUndefined();
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    }, 20000);

    test('LDEVR with vehicle model ID and guidance', async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317], // Amsterdam
                [2.3522, 48.8566], // Paris
            ],
            vehicle: {
                engineType: 'electric',
                model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
                state: { currentChargeInkWh: 45 },
                preferences: {
                    chargingPreferences: {
                        minChargeAtChargingStopsInkWh: 5,
                        minChargeAtDestinationInkWh: 10,
                    },
                },
            },
            maxAlternatives: 0,
            guidance: { type: 'coded' },
        });

        expect(result?.features?.length).toBeGreaterThanOrEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
        const routeProperties = routeFeature.properties;
        const legs = routeProperties.sections.leg;

        // with charging stops we should have more than 1 leg generated:
        expect(legs.length).toBeGreaterThan(1);

        const routeSummary = routeProperties.summary;
        assertSummaryBasics(routeSummary);

        // asserting summary properties relevant to ldevr:
        expect(routeSummary.totalChargingTimeInSeconds).toBeGreaterThan(0);
        expect(routeSummary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
        expect(routeSummary.batteryConsumptionInkWh).toBeGreaterThan(0);

        // we assert the legs excluding the last one (charging stops):
        for (let i = 0; i < legs.length - 1; i++) {
            const leg = legs[i];
            assertLegSectionBasics(leg);
            expect(leg.summary.remainingChargeAtArrivalInkWh).toBeGreaterThan(0);
            expect(leg.summary.chargingInformationAtEndOfLeg).toBeDefined();
            expect(leg.summary.chargingInformationAtEndOfLeg?.properties.targetChargeInkWh).toBeGreaterThanOrEqual(4);
        }

        // the last leg has some particularities
        const lastLeg = legs[legs.length - 1];
        assertLegSectionBasics(lastLeg);
        expect(lastLeg.summary.remainingChargeAtArrivalInkWh).toEqual(routeSummary.remainingChargeAtArrivalInkWh);
        // arriving at destination, not a charging stop:
        expect(lastLeg.summary.chargingInformationAtEndOfLeg).toBeUndefined();
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    }, 20000);

    test('Roses to Olot thrilling route with alternatives', async () => {
        const result = await calculateRoute({
            language: 'es-ES',
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211],
            ],
            costModel: {
                avoid: ['carpools', 'ferries', 'carTrains'],
                traffic: 'historical',
                routeType: 'thrilling',
                // TODO no trhilling params with Orbis, so I commented them out
                // thrillingParams: {
                //     hilliness: 'low',
                //     windingness: 'high',
                // },
            },
            computeAdditionalTravelTimeFor: 'all',
            guidance: {
                type: 'coded',
                version: 2,
                phonetics: 'IPA',
                roadShieldReferences: 'all',
            },
            maxAlternatives: 2,
            sectionTypes: ['traffic', 'ferry', 'toll', 'lanes', 'speedLimit', 'roadShields'],
            travelMode: 'car',
            // TODO no travel mode motorcycle with Orbis, so I commented it out
            // travelMode: 'motorcycle',
            when: {
                option: 'arriveBy',
                date: new Date(),
            },
        });

        expect(result?.features?.length).toBeGreaterThan(1);
        for (const routeFeature of result.features) {
            expect(routeFeature).toBeDefined();
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            expect(routeProperties.guidance).toBeDefined();
            expect(routeProperties.progress?.length).toBeGreaterThan(0);
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

    test('Route reconstruction flows', async () => {
        const firstRoute = (
            await calculateRoute({
                // Amsterdam to Leiden to Rotterdam
                locations: [
                    [4.89066, 52.37317],
                    [4.49015, 52.16109],
                    [4.47059, 51.92291],
                ],
            })
        ).features[0];

        const firstRouteCoords = firstRoute.geometry.coordinates;
        expect(firstRouteCoords.length).toBeGreaterThan(1000);

        const reconstructedRouteResponse = await calculateRoute({ locations: [firstRoute] });
        expect(reconstructedRouteResponse?.features?.length).toEqual(1);
        const reconstructedRoute = reconstructedRouteResponse.features[0];
        const reconstructedRouteCoords = reconstructedRoute.geometry.coordinates;

        // checking that the first and reconstructed routes have a similar amount of points:
        expect(Math.abs(reconstructedRouteCoords.length - firstRouteCoords.length)).toBeLessThan(50);

        // checking that the first and reconstructed routes have the same origin and destination points:
        expect(firstRouteCoords[0]).toStrictEqual(reconstructedRouteCoords[0]);
        expect(firstRouteCoords[firstRouteCoords.length - 1]).toStrictEqual(
            reconstructedRouteCoords[reconstructedRouteCoords.length - 1],
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
                locations: [[4.82409, 52.43924], reconstructedRoute, [4.6684, 51.81111]],
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
            reconstructedRouteSections.urban?.length ?? 0,
        );

        expect(reconstructedRoute.properties.progress?.length).toBeGreaterThan(0);
    });

    test('Calculate route with API request and response callbacks', async () => {
        const locations = [
            [7.675106, 51.490793],
            [7.74328, 51.403849],
        ];
        const onApiRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const onApiResponse = vi.fn() as (
            request: CalculateRouteRequestAPI,
            response: CalculateRouteResponseAPI,
        ) => void;
        const result = await calculateRoute({ locations, onAPIRequest: onApiRequest, onAPIResponse: onApiResponse });
        expect(result).toBeDefined();
        const expectedApiRequest = { method: 'GET', url: expect.any(URL) };
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.anything());
    });

    test('Calculate route with API request and error response callbacks', async () => {
        const locations = [
            [7.675106, 51.490793],
            [0, 0],
        ];
        const onApiRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const onApiResponse = vi.fn() as (
            request: CalculateRouteRequestAPI,
            response: CalculateRouteResponseAPI,
        ) => void;
        await expect(() =>
            calculateRoute({ locations, onAPIRequest: onApiRequest, onAPIResponse: onApiResponse }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        const expectedApiRequest = { method: 'GET', url: expect.any(URL) };
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.objectContaining({ status: 400 }));
    });
});
