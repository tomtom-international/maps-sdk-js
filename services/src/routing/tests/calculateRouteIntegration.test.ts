import type {
    BBox,
    Guidance,
    LegSectionProps,
    Route,
    SectionProps,
    SectionsProps,
    SectionType,
    SummaryBase,
} from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import type { ElectricVehicleParamsWithChargingStops } from '../../shared';
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

// When no sectionTypes param is passed, the SDK requests every section type and applies no
// client-side filtering (default behaviour), so the response carries all section types the route
// traverses rather than a filtered subset. Beyond the always-present `leg`, two types show up on
// every live route regardless of geography, proving the default returned the full, unfiltered set:
//  - `leg`: every route has at least one leg (also checked with an exact count at each call site).
//  - `country`: you always drive through at least one country, so a single section spanning the
//    route is returned even for same-country trips.
//  - `urban`: any A-B route between populated places crosses urban roads.
//  - `speedLimit`: every drivable road has a known speed limit, so car routes always carry these.
// Other types — `motorway`, `traffic`, `tunnel`, `ferry`, `pedestrian`, `toll`, etc. — are
// route-dependent and only appear when the route actually traverses them, so they are intentionally
// not asserted here. The EXPLICIT types (`tollVignette`, `roadShields`, `importantRoadStretch`,
// `lanes`) are also requested by a default call — `buildAttributesHeader` treats an omitted
// `sectionTypes` as "everything" — but they are route-dependent too, and `lanes` additionally
// requires guidance, so they are asserted at the call sites that actually provoke them rather than
// here.
const assertDefaultSectionsReturnsAll = (sections: SectionsProps): void => {
    expect(Object.keys(sections).length).toBeGreaterThan(1);
    expect(sections.leg.length).toBeGreaterThan(0);
    expect(sections.country?.length).toBeGreaterThan(0);
    expect(sections.urban?.length).toBeGreaterThan(0);
    expect(sections.speedLimit?.length).toBeGreaterThan(0);
};

// How far a maneuver point may sit outside the bbox of the path it belongs to — about 100 m.
const BBOX_MARGIN_DEGREES = 0.001;

// What guidance has to carry to be usable at all, asserted against the live response rather than a
// fixture: a fixture only proves the parser agrees with whatever shape we wrote down last, and the
// shape of a point in this response has already changed once under us.
const assertGuidanceBasics = (guidance: Guidance | undefined, route: Route): void => {
    expect(guidance?.instructions.length).toBeGreaterThan(1);
    const instructions = guidance?.instructions ?? [];

    // Coordinates, not a pair of undefineds — and in [longitude, latitude] order, within reach of
    // the route they belong to. The margin is for the junction the router names sitting a few
    // metres off the sampled path (8 m on Roses to Olot); a swapped axis or an unread point misses
    // by degrees.
    const bbox = bboxFromGeoJSON(route);
    if (!bbox) throw new Error('the route came back with no geometry to place its maneuver points against');

    const [west, south, east, north] = bbox;
    const offRoute = instructions
        .map(({ maneuverPoint }) => maneuverPoint)
        .filter(
            ([longitude, latitude]) =>
                !(
                    longitude >= west - BBOX_MARGIN_DEGREES &&
                    longitude <= east + BBOX_MARGIN_DEGREES &&
                    latitude >= south - BBOX_MARGIN_DEGREES &&
                    latitude <= north + BBOX_MARGIN_DEGREES
                ),
        );
    expect(offRoute).toEqual([]);

    // Each instruction sits further along the route than the one before it, and is located on the
    // route path — an index every instruction shares is the tell that the point was not read.
    const offsets = instructions.map((instruction) => instruction.routeOffsetInMeters);
    expect(offsets.every((offset, index) => index === 0 || offset >= offsets[index - 1])).toBe(true);
    expect(new Set(instructions.map((instruction) => instruction.pathPointIndex)).size).toBeGreaterThan(1);
    expect(instructions.at(-1)?.pathPointIndex).toBeLessThan(route.geometry.coordinates.length);

    for (const { point } of instructions.flatMap((instruction) => instruction.routePath)) {
        expect(point.every(Number.isFinite)).toBe(true);
    }
};

describe('Calculate route integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    test('Default A-B route', async () => {
        const beforeRequest = Date.now();
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
            // No `when` passed: the route departs ~now. Allow for request latency and clock skew.
            expect(Math.abs(routeProperties.summary.departureTime.getTime() - beforeRequest)).toBeLessThan(10_000);
            expect(routeProperties.guidance).toBeUndefined();
            expect(routeProperties.progress?.length).toBeGreaterThan(0);
            const sections: SectionsProps = routeProperties.sections;
            expect(sections.leg).toHaveLength(1);
            assertLegSectionBasics(sections.leg[0]);
            // No sectionTypes passed: default behaviour returns all available section types.
            assertDefaultSectionsReturnsAll(sections);
            // No guidance requested: the guidance-gated `lanes` section is never returned.
            expect(sections.lanes).toBeUndefined();
            for (const sectionArray of Object.values(sections)) {
                for (const section of sectionArray) {
                    assertSectionBasics(section as SectionProps);
                }
            }
        }
    });

    test('Empty extendedRouteRepresentations drops progress points from the response', async () => {
        const result = await calculateRoute({
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211],
            ],
            extendedRouteRepresentations: [],
        });

        // There is no per-representation selector, so an empty array is an opt-out: `progressPoints`
        // is left out of the Attributes header and the route comes back without per-point progress.
        // This is the payload saving the empty array buys, and the only thing it changes.
        expect(result.features[0].geometry.coordinates.length).toBeGreaterThan(1000);
        expect(result.features[0].properties.progress).toBeUndefined();
    });

    test('Route with departAt returns a departure time matching the input', async () => {
        // Realistic departAt: tomorrow at the current time of day.
        const departAt = new Date();
        departAt.setDate(departAt.getDate() + 1);
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            when: { option: 'departAt', date: departAt },
        });

        const summary = result.features[0].properties.summary;
        assertSummaryBasics(summary);
        // departAt was requested: the returned departure time is the requested time. The response
        // carries second precision, so the only possible difference is the dropped sub-second
        // fraction of the input — i.e. strictly under 1s.
        expect(Math.abs(summary.departureTime.getTime() - departAt.getTime())).toBeLessThan(1_000);
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
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(sections);
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    });

    test('Route from Kandersteg to Dover via Visp with specified sectionTypes and combustion vehicle parameters', async () => {
        const testInputSectionTypes: SectionType[] = ['carTrain', 'motorway', 'toll', 'urban'];

        // Kandersteg is a road dead-end: the only way south is the Lötschberg car train, so an
        // intermediate waypoint anywhere in the Rhône valley forces a `carTrain` section on the
        // first leg whatever else the cost model asks for. That is what makes this route, and
        // not the geography, the stable way to provoke `carTrain`.
        //
        // The waypoint must also be a point the router can *leave*. The previous one
        // ([7.74328, 46.403849], up by the Lötschen Pass) snapped to a segment with no onward
        // route: the API reached it happily but answered `NO_ROUTE_FOUND: route search failed
        // between waypoint 1 and destination` for the second leg, with or without any
        // avoidance. Visp is a Rhône-valley through-town on the A9, so both legs route.
        const result = await calculateRoute({
            locations: [
                [7.675106, 46.490793], // Kandersteg
                [7.8828, 46.2947], // Visp
                [1.32248, 51.111645], // Dover
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
        // Note: all non-EXPLICIT section types come back when sections is requested.
        // EXPLICIT types (tollVignette, roadShields, importantRoadStretch, lanes) require
        // explicit opt-in via sectionTypes; client-side filtering is applied after parsing.
        // sectionTypes was specified without 'lanes' and no guidance was requested, so the
        // guidance-gated `lanes` section must be absent.
        expect(sections.lanes).toBeUndefined();
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    });

    test('Amsterdam to Leiden to Rotterdam with electric vehicle parameters (non - LDEVR)', async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
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
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(sections);
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
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(routeProperties.sections);
        // Guidance requested with default sectionTypes: the guidance-gated `lanes` section is present.
        expect(routeProperties.sections.lanes?.length).toBeGreaterThan(0);
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    }, 40000);

    test('LDEVR with vehicle model ID and guidance', async () => {
        const result = await calculateRoute({
            locations: [
                [4.89066, 52.37317], // Amsterdam
                [4.3517, 50.8503], // Brussels:
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
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(routeProperties.sections);
        // Guidance requested with default sectionTypes: the guidance-gated `lanes` section is present.
        expect(routeProperties.sections.lanes?.length).toBeGreaterThan(0);
        expect(routeProperties.progress?.length).toBeGreaterThan(0);
    }, 40000);

    test('Route from Roses to Olot with avoidAreas around Figueres', async () => {
        // Figueres sits on the direct Roses → Olot path; avoiding it should force a detour.
        const avoidBBox: BBox = [2.93, 42.25, 3, 42.31];
        const result = await calculateRoute({
            locations: [
                [3.1748, 42.26297], // Roses
                [2.48819, 42.18211], // Olot
            ],
            costModel: { avoidAreas: [avoidBBox] },
        });

        expect(result?.features?.length).toEqual(1);
        const routeFeature = result.features[0];
        expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(0);
        assertSummaryBasics(routeFeature.properties.summary);
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(routeFeature.properties.sections);

        // No coordinate should fall inside the avoided bbox.
        const [west, south, east, north] = avoidBBox;
        for (const [lng, lat] of routeFeature.geometry.coordinates) {
            expect(lng >= west && lng <= east && lat >= south && lat <= north).toBe(false);
        }
    });

    test('Roses to Olot thrilling route with alternatives', async () => {
        // Realistic arriveBy: tomorrow at the current time of day.
        const arriveBy = new Date();
        arriveBy.setDate(arriveBy.getDate() + 1);
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
            },
            computeTravelTimeFor: 'all',
            guidance: {
                type: 'coded',
                phonetics: 'IPA',
            },
            maxAlternatives: 2,
            sectionTypes: ['traffic', 'ferry', 'toll', 'lanes', 'speedLimit', 'roadShields', 'importantRoadStretch'],
            travelMode: 'car',
            // TODO no travel mode motorcycle with Orbis, so I commented it out
            // travelMode: 'motorcycle',
            when: {
                option: 'arriveBy',
                date: arriveBy,
            },
        });

        expect(result?.features?.length).toBeGreaterThan(1);
        for (const routeFeature of result.features) {
            expect(routeFeature).toBeDefined();
            expect(routeFeature.geometry.coordinates.length).toBeGreaterThan(1000);
            const routeProperties = routeFeature.properties;
            assertSummaryBasics(routeProperties.summary);
            // arriveBy was requested: the returned arrival time is anchored to it. The API used to
            // echo the requested time to the second; since 2026-09-05 it returns a recomputed
            // arrival that drifts by up to ~30s per alternative (observed 15.7-29.3s, CI runs
            // 33909493115 and 33939841975). Two minutes still proves arriveBy reached the API and
            // shaped the plan - ignoring it entirely would put the arrival a day off.
            expect(Math.abs(routeProperties.summary.arrivalTime.getTime() - arriveBy.getTime())).toBeLessThan(120_000);
            expect(routeProperties.guidance).toBeDefined();
            assertGuidanceBasics(routeProperties.guidance, routeFeature);
            expect(routeProperties.progress?.length).toBeGreaterThan(0);
            // computeTravelTimeFor: 'all' was requested, so the three traffic variant
            // times must come back. The v2->v3 migration guide claims `computeTravelTimeFor` and
            // these fields were dropped in Orbis; they are not, and this is what proves it.
            const summary = routeProperties.summary;
            expect(summary.noTrafficTravelTimeInSeconds).toBeGreaterThan(0);
            expect(summary.historicTrafficTravelTimeInSeconds).toBeGreaterThan(0);
            expect(summary.liveTrafficIncidentsTravelTimeInSeconds).toBeGreaterThan(0);
            const sections: SectionsProps = routeProperties.sections;
            expect(sections.leg).toHaveLength(1);
            assertLegSectionBasics(sections.leg[0]);
            for (const sectionArray of Object.values(sections)) {
                for (const section of sectionArray) {
                    assertSectionBasics(section as SectionProps);
                }
            }
        }
        // Guidance was requested (and `lanes` listed in sectionTypes): the guidance-specific `lanes`
        // section is gated on guidance in the request builder, so it must be present in the response.
        expect(result.features[0].properties.sections.lanes?.length).toBeGreaterThan(0);
        // The remaining EXPLICIT section types listed in sectionTypes. The migration guide claims
        // road shield sections do not exist in Orbis; this route returns them on every alternative.
        for (const routeFeature of result.features) {
            const sections = routeFeature.properties.sections;
            expect(sections.roadShields?.length).toBeGreaterThan(0);
            expect(sections.importantRoadStretch?.length).toBeGreaterThan(0);
        }
        // The road shield chain the request builder goes out of its way to ask for: the atlas base
        // URL lands on every instruction, and the icon references resolve onto the ones that carry a
        // shield. Nothing renders these yet, so only this test would catch them disappearing.
        const instructions = result.features[0].properties.guidance?.instructions ?? [];
        expect(instructions.length).toBeGreaterThan(0);
        expect(instructions.every((instruction) => instruction.roadShieldAtlasReference)).toBe(true);
        const shieldReferences = instructions.flatMap((instruction) => instruction.roadShieldReferences ?? []);
        expect(shieldReferences.length).toBeGreaterThan(0);
        expect(shieldReferences[0].reference).toEqual(expect.any(String));
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
        // No sectionTypes passed: default behaviour returns all available section types.
        assertDefaultSectionsReturnsAll(firstRouteSections);
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

    test('Route with arrivalSide and a toll transponder is accepted and reaches the wire', async () => {
        const onAPIRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const result = await calculateRoute({
            locations: [
                [2.1734, 41.3851], // Barcelona
                [2.8214, 41.9794], // Girona
            ],
            arrivalSide: 'curb',
            vehicle: { restrictions: { tollTransponder: 'none' } },
            onAPIRequest,
        });

        assertSummaryBasics(result.features[0].properties.summary);
        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    arrivalSidePreference: 'curbSide',
                    vehicleHasElectronicTollCollectionTransponder: 'none',
                }),
            }),
        );
    }, 30000);

    test('A pause at an intermediate stop pushes the arrival time out by that pause', async () => {
        const locations = (pauseDurationSeconds?: number) => [
            [2.1734, 41.3851], // Barcelona
            {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [2.4467, 41.5381] }, // Mataró
                properties: pauseDurationSeconds ? { pauseDurationSeconds } : {},
            },
            [2.8214, 41.9794], // Girona
        ];
        const pauseSeconds = 1800;

        const withoutPause = await calculateRoute({ locations: locations() });
        const withPause = await calculateRoute({ locations: locations(pauseSeconds) });

        const travelTimeOf = (route: Awaited<ReturnType<typeof calculateRoute>>) =>
            route.features[0].properties.summary.travelTimeInSeconds;
        const arrivalOf = (route: Awaited<ReturnType<typeof calculateRoute>>) =>
            route.features[0].properties.summary.arrivalTime.getTime();

        // Live behaviour: the pause counts into travelTimeInSeconds, not only into the arrival
        // time — a stop that waits 30 minutes is reported as a 30-minutes-longer journey.
        const travelTimeIncrease = travelTimeOf(withPause) - travelTimeOf(withoutPause);
        expect(travelTimeIncrease).toBeGreaterThan(pauseSeconds * 0.8);
        expect(travelTimeIncrease).toBeLessThan(pauseSeconds * 1.2);
        expect(arrivalOf(withPause) - arrivalOf(withoutPause)).toBeGreaterThanOrEqual(pauseSeconds * 1000 * 0.8);

        // The pause comes back as time spent at the stop on the leg that arrives there, derived
        // from the gap to the next leg's departure, and the legs' own travel times stay
        // driving-only.
        //
        // Both checks allow a second either way. The stop time is the difference of two timestamps
        // the service reports to the second, and the identity below is the difference of durations
        // it rounds independently — live runs land on 1799 as often as 1800. A wrong implementation
        // would be out by a leg or by a charging time, not by a second.
        const legs = withPause.features[0].properties.sections.leg;
        expect(legs[0].summary.stopTimeInSeconds).toBeGreaterThanOrEqual(pauseSeconds - 1);
        expect(legs[0].summary.stopTimeInSeconds).toBeLessThanOrEqual(pauseSeconds + 1);
        expect(legs[1].summary.stopTimeInSeconds).toBeUndefined();
        const drivingSeconds = legs.reduce((total, leg) => total + leg.summary.travelTimeInSeconds, 0);
        expect(Math.abs(travelTimeOf(withPause) - drivingSeconds - pauseSeconds)).toBeLessThanOrEqual(1);
    }, 40000);

    test('A per-stop legCostModel changes only the leg arriving at that stop', async () => {
        const onAPIRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const result = await calculateRoute({
            locations: [
                [2.1734, 41.3851], // Barcelona
                {
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: [2.4467, 41.5381] }, // Mataró
                    properties: { legCostModel: { routeType: 'short' as const, avoid: ['motorways' as const] } },
                },
                [2.8214, 41.9794], // Girona
            ],
            sectionTypes: ['motorway'],
            onAPIRequest,
        });

        // Per-leg `avoids` takes objects, unlike the route-level string array.
        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    legs: [{ routeType: 'short', avoids: [{ name: 'motorways' }] }, {}],
                }),
            }),
        );

        const routeProperties = result.features[0].properties;
        const legs = routeProperties.sections.leg;
        expect(legs).toHaveLength(2);
        // Motorways are avoided only up to the middle stop, so any motorway section that remains
        // has to start after the first leg ends.
        const firstLegEnd = legs[0].endPointIndex ?? 0;
        for (const motorwaySection of routeProperties.sections.motorway ?? []) {
            expect(motorwaySection.startPointIndex).toBeGreaterThanOrEqual(firstLegEnd);
        }
    }, 40000);

    test('Candidate entry points are accepted for an intermediate stop', async () => {
        const onAPIRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const result = await calculateRoute({
            locations: [
                [2.1734, 41.3851], // Barcelona
                {
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: [2.4467, 41.5381] }, // Mataró
                    properties: {
                        candidateEntryPoints: [
                            [2.4467, 41.5381],
                            [2.4479, 41.5372],
                        ],
                        preferredEntryPointIndex: 1,
                    },
                },
                [2.8214, 41.9794], // Girona
            ],
            onAPIRequest,
        });

        assertSummaryBasics(result.features[0].properties.summary);
        // The API takes candidates as a MultiPoint; an array of Points is rejected.
        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    legs: [
                        {
                            routeStop: {
                                entryPoints: {
                                    type: 'MultiPoint',
                                    coordinates: [
                                        [2.4467, 41.5381],
                                        [2.4479, 41.5372],
                                    ],
                                },
                                preferredEntryPointIndex: 1,
                            },
                        },
                        {},
                    ],
                }),
            }),
        );
    }, 40000);

    test('LDEVR receives maxSpeedKMH, which changes the planned charging time', async () => {
        const evVehicle = (maxSpeedKMH?: number): CalculateRouteParams['vehicle'] => ({
            engineType: 'electric' as const,
            model: {
                engine: {
                    consumption: {
                        speedsToConsumptionsKWH: [
                            { speedKMH: 50, consumptionUnitsPer100KM: 15 },
                            { speedKMH: 90, consumptionUnitsPer100KM: 18 },
                            { speedKMH: 120, consumptionUnitsPer100KM: 23 },
                        ],
                    },
                    charging: {
                        maxChargeKWH: 40,
                        batteryCurve: [
                            { stateOfChargeInkWh: 10, maxPowerInkW: 150 },
                            { stateOfChargeInkWh: 30, maxPowerInkW: 80 },
                            { stateOfChargeInkWh: 38, maxPowerInkW: 40 },
                        ],
                        chargingConnectors: [
                            {
                                currentType: 'DC' as const,
                                plugTypes: [
                                    'IEC_62196_Type_2_Outlet' as const,
                                    'IEC_62196_Type_2_Connector_Cable_Attached' as const,
                                    'Combo_to_IEC_62196_Type_2_Base' as const,
                                ],
                                voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                                efficiency: 0.9,
                                baseLoadInkW: 0.2,
                                maxPowerInkW: 150,
                            },
                        ],
                    },
                },
            },
            state: { currentChargePCT: 80 },
            ...(maxSpeedKMH && { restrictions: { maxSpeedKMH } }),
            preferences: {
                chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 },
            },
        });

        const locations = [
            [13.405, 52.52], // Berlin
            [8.6821, 50.1109], // Frankfurt
        ];
        const onAPIRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;

        const unrestricted = await calculateRoute({ locations, vehicle: evVehicle() });
        const speedLimited = await calculateRoute({ locations, vehicle: evVehicle(90), onAPIRequest });

        // The shared vehicle body reaches this endpoint, which acts on the speed cap.
        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ vehicleMaxSpeedInKilometersPerHour: 90 }),
            }),
        );

        const chargingTimeOf = (route: Awaited<ReturnType<typeof calculateRoute>>) =>
            route.features[0].properties.summary.totalChargingTimeInSeconds;
        expect(chargingTimeOf(unrestricted)).toBeGreaterThan(0);
        expect(chargingTimeOf(speedLimited)).toBeGreaterThan(0);
        // Capping the speed changes consumption, and so the charging the route has to plan.
        expect(chargingTimeOf(speedLimited)).not.toEqual(chargingTimeOf(unrestricted));

        // Charging is time at the stop too, and on this route it is all of it: no wait was asked
        // for anywhere, so each charging stop's time is exactly its charging time.
        const chargingLegs = unrestricted.features[0].properties.sections.leg;
        expect(chargingLegs.length).toBeGreaterThan(1);
        const chargingSeconds = chargingLegs[0].summary.chargingInformationAtEndOfLeg?.properties
            .chargingTimeInSeconds as number;
        expect(chargingSeconds).toBeGreaterThan(0);
        expect(Math.abs((chargingLegs[0].summary.stopTimeInSeconds as number) - chargingSeconds)).toBeLessThanOrEqual(
            1,
        );
    }, 60000);

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
        const expectedApiRequest = expect.objectContaining({ method: 'POST', url: expect.any(URL) });
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.anything());
    });

    // Every field below was probed against the live API on 2026-09-03 before it was typed.

    test('Guidance instructions carry the generated message, junction view and side roads', async () => {
        const result = await calculateRoute({
            locations: [
                [2.1734, 41.3851],
                [2.8214, 41.9794],
            ],
            guidance: { type: 'coded' },
            language: 'en-GB',
        });

        const guidance = result.features[0].properties.guidance;
        expect(guidance).toBeDefined();
        assertGuidanceBasics(guidance, result.features[0]);
        const instructions = guidance?.instructions ?? [];
        expect(instructions.length).toBeGreaterThan(5);

        // `message` is the localised turn text. Present on every instruction, so anyone building a
        // turn list no longer needs their own translation table.
        for (const instruction of instructions) {
            expect(typeof instruction.message).toBe('string');
            expect(instruction.message?.length).toBeGreaterThan(0);
        }

        // The junction view reports relative directions, not degrees.
        const withView = instructions.filter((instruction) => instruction.maneuverView);
        expect(withView.length).toBeGreaterThan(0);
        for (const instruction of withView) {
            expect(Array.isArray(instruction.maneuverView?.offRouteAngles)).toBe(true);
            for (const angle of instruction.maneuverView?.offRouteAngles ?? []) {
                expect(angle).toEqual(angle.toUpperCase());
            }
            if (instruction.maneuverView?.onRouteAngle) {
                expect(instruction.maneuverView.onRouteAngle).toEqual(
                    instruction.maneuverView.onRouteAngle.toUpperCase(),
                );
            }
        }

        // Side roads: the API sends a lowercase side and an isDrivable flag; both must land mapped.
        const withSideRoads = instructions.filter((instruction) => instruction.sideRoads?.length);
        expect(withSideRoads.length).toBeGreaterThan(0);
        for (const instruction of withSideRoads) {
            for (const sideRoad of instruction.sideRoads ?? []) {
                expect(['LEFT', 'RIGHT', 'LEFT_AND_RIGHT']).toContain(sideRoad.side);
                expect(typeof sideRoad.isDrivable).toBe('boolean');
            }
        }

        // Road information carries the country, converted to the SDK's ISO3 convention.
        const countryCodes = instructions
            .map((instruction) => instruction.nextRoadInfo.countryCode)
            .filter((code): code is string => !!code);
        expect(countryCodes.length).toBeGreaterThan(0);
        expect(countryCodes).toContain('ESP');
    });

    test('Phonetic transcriptions arrive, in the alphabet that was requested', async () => {
        const locations = [
            [2.1734, 41.3851],
            [2.8214, 41.9794],
        ];
        const withIpa = await calculateRoute({
            locations,
            guidance: { type: 'coded', phonetics: 'IPA' },
            language: 'en-GB',
        });
        const withLhp = await calculateRoute({
            locations,
            guidance: { type: 'coded', phonetics: 'LHP' },
            language: 'en-GB',
        });

        const phonetics = (routes: typeof withIpa): string[] =>
            (routes.features[0].properties.guidance?.instructions ?? [])
                .map((instruction) => instruction.nextRoadInfo.streetName?.phonetic)
                .filter((phonetic): phonetic is string => !!phonetic);

        const ipa = phonetics(withIpa);
        const lhp = phonetics(withLhp);
        // The bug this guards: the API sends `phonetic` as a flat string, but the parser read it as
        // `{ lhp, ipa }`, so every transcription resolved to undefined and none of them arrived.
        expect(ipa.length).toBeGreaterThan(0);
        expect(lhp.length).toBeGreaterThan(0);
        // Different alphabets, so the same street transcribes differently.
        expect(ipa[0]).not.toEqual(lhp[0]);
    });

    test('Traffic sections carry the eventId that joins back to the incident service', async () => {
        const result = await calculateRoute({
            locations: [
                [2.3522, 48.8566],
                [4.8357, 45.764],
            ],
            sectionTypes: ['traffic'],
        });

        const traffic = result.features[0].properties.sections.traffic ?? [];
        expect(traffic.length).toBeGreaterThan(0);
        const withEventId = traffic.filter((section) => section.eventId);
        expect(withEventId.length).toBeGreaterThan(0);
    });

    // `toll` and `tollRoad` are two section types, and the difference between them is what the two
    // tests below pin down. Probed across nine European routes on 2026-09-08: `tollRoad` reported
    // every stretch `toll` did, on all nine, and reported more on four of them. What it adds is the
    // charging schemes that are not a per-use toll — the Austrian motorway vignette, and the London,
    // Milan and Stockholm urban charge zones.
    test('tollRoad reports every stretch toll does, on a ticket motorway', async () => {
        const result = await calculateRoute({
            locations: [
                [2.3522, 48.8566],
                [4.8357, 45.764],
            ],
            sectionTypes: ['tollRoad', 'toll'],
        });

        const sections = result.features[0].properties.sections;
        // Requesting tollRoad is what makes it arrive: it is an EXPLICIT sub-attribute, so it was
        // invisible to the SDK until it was added to the Attributes header.
        expect(sections.tollRoad?.length).toBeGreaterThan(0);
        for (const section of sections.tollRoad ?? []) {
            assertSectionBasics(section);
        }

        // Paris -> Lyon runs on the A6, a ticket motorway, so every toll stretch is a tolled road.
        expect(sections.toll?.length).toBeGreaterThan(0);
        for (const toll of sections.toll ?? []) {
            const covering = (sections.tollRoad ?? []).some(
                (tollRoad) =>
                    tollRoad.startPointIndex <= toll.startPointIndex && tollRoad.endPointIndex >= toll.endPointIndex,
            );
            expect(covering).toBe(true);
        }
    });

    test('tollRoad also reports a charge that is not a per-use toll, where toll reports nothing', async () => {
        const result = await calculateRoute({
            // Munich -> Salzburg: the Austrian motorway needs a vignette, which costs money to
            // drive but collects no toll per use.
            locations: [
                [11.582, 48.1351],
                [13.055, 47.8095],
            ],
            sectionTypes: ['tollRoad', 'toll'],
        });

        const sections = result.features[0].properties.sections;
        expect(sections.tollRoad?.length).toBeGreaterThan(0);
        expect(sections.toll).toBeUndefined();
    });

    test('chargingStopsStrategy is honoured on an EV route, and required to pair with preferences', async () => {
        const vehicle: ElectricVehicleParamsWithChargingStops = {
            engineType: 'electric',
            state: { currentChargePCT: 80 },
            preferences: { chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 } },
            model: {
                engine: {
                    charging: {
                        maxChargeKWH: 40,
                        batteryCurve: [
                            { stateOfChargeInkWh: 10, maxPowerInkW: 150 },
                            { stateOfChargeInkWh: 30, maxPowerInkW: 100 },
                            { stateOfChargeInkWh: 38, maxPowerInkW: 40 },
                        ],
                        chargingConnectors: [
                            {
                                currentType: 'DC',
                                plugTypes: ['IEC_62196_Type_2_Outlet'],
                                efficiency: 0.9,
                                baseLoadInkW: 0.2,
                                maxPowerInkW: 150,
                            },
                        ],
                    },
                    consumption: {
                        speedsToConsumptionsKWH: [
                            { speedKMH: 32, consumptionUnitsPer100KM: 10.87 },
                            { speedKMH: 77, consumptionUnitsPer100KM: 18.01 },
                        ],
                    },
                },
            },
        };
        const locations = [
            [2.3522, 48.8566],
            [4.8952, 52.3702],
        ];

        // `manualFastest` tells the service to plan no charging stops of its own.
        const manual = await calculateRoute({ locations, vehicle, chargingStopsStrategy: 'manualFastest' });
        assertSummaryBasics(manual.features[0].properties.summary);

        // Rejected by name, before the network call, because the endpoint also needs a minimum
        // charge at the destination and only the preferences supply it.
        // The type forbids this pairing; the cast stands in for an untyped JavaScript caller, whom
        // the request schema still has to stop.
        await expect(() =>
            calculateRoute({
                locations,
                vehicle: { engineType: 'electric', state: { currentChargePCT: 80 } },
                chargingStopsStrategy: 'automaticFastest',
            } as CalculateRouteParams),
        ).rejects.toThrow(/chargingStopsStrategy/);
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
        const expectedApiRequest = expect.objectContaining({ method: 'POST', url: expect.any(URL) });
        expect(onApiRequest).toHaveBeenCalledWith(expectedApiRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedApiRequest, expect.objectContaining({ status: 400 }));
    });

    test('An intermediate waypoint reaches the wire as a bare point, and ends a leg', async () => {
        const onAPIRequest = vi.fn() as (request: CalculateRouteRequestAPI) => void;
        const result = await calculateRoute({
            locations: [
                [2.1734, 41.3851], // Barcelona
                [2.4467, 41.5381], // Mataró
                [2.8214, 41.9794], // Girona
            ],
            onAPIRequest,
        });

        // There is nothing to send but the position. Every radius spelling the SDK used to imply
        // was rejected with `Unknown JSON field '.routePlanningLocations.waypoints.<name>'`, so the
        // API has no circle waypoint to ask for.
        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    routePlanningLocations: expect.objectContaining({
                        waypoints: { type: 'MultiPoint', coordinates: [[2.4467, 41.5381]] },
                    }),
                }),
            }),
        );
        // And so the route stops there: two legs, not one.
        expect(result.features[0].properties.sections?.leg).toHaveLength(2);
    }, 40000);
});
