import { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import type { CalculateRouteParams } from '..';
import { parseCalculateRouteResponse } from '../responseParser';
import { parseRoutingResponseError } from '../routingResponseErrorParser';
import type { CalculateRouteResponseAPI } from '../types/apiResponseTypes';
import { apiAndParsedResponses } from './responseParser.data';
import { errorResponses } from './responseParserError.data';
import { longApiResponse } from './responseParserPerf.data';

describe('Calculate Route response parsing functional tests', () => {
    // Functional tests:
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: CalculateRouteResponseAPI, params: CalculateRouteParams, expectedResponse: Routes) => {
        // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
        // (We reparse the objects to compare them ignoring the order of properties)
        const actual = parseCalculateRouteResponse(apiResponse, params);
        expect(actual).toMatchObject(expectedResponse);
    });
});

describe('Calculate Route response parsing performance tests', () => {
    test('Parsing a long API response', () => {
        const [apiResponse, params] = longApiResponse;
        expect(bestExecutionTimeMS(() => parseCalculateRouteResponse(apiResponse, params), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.responseParsing,
        );
    });
});

describe('Routing - error response parsing tests', () => {
    test.each(errorResponses)("'%s'", async (_name, apiResponseError, expectedSdkError) => {
        const sdkRoutingResponseError = parseRoutingResponseError(apiResponseError, 'Routing');
        expect(sdkRoutingResponseError).toMatchObject(expectedSdkError);
    });
});

describe('Routing - no section from api response', () => {
    test('Route with undefined api sections', async () => {
        const apiRoute = apiAndParsedResponses[0][1] as unknown as CalculateRouteResponseAPI;

        for (const route of apiRoute.routes) {
            if (route.sections) {
                // @ts-ignore
                route.sections = undefined;
            }
        }

        expect(() => parseCalculateRouteResponse(apiRoute, {} as CalculateRouteParams)).not.toThrow();
    });
});

describe('sectionTypes client-side filtering', () => {
    const MINIMAL_LEG = {
        summary: {
            lengthInMeters: 100,
            travelDurationInSeconds: 10,
            trafficDelayDurationInSeconds: 0,
            trafficLengthInMeters: 0,
            departureDateTime: '2024-01-01T10:00:00+00:00',
            arrivalDateTime: '2024-01-01T10:00:10+00:00',
            noTrafficTravelTimeInSeconds: 10,
            historicTrafficTravelTimeInSeconds: 10,
            liveTrafficIncidentsTravelTimeInSeconds: 10,
        },
        path: {
            type: 'LineString' as const,
            coordinates: [
                [0, 0],
                [1, 1],
            ],
        },
    };

    const API_RESPONSE_WITH_SECTIONS: CalculateRouteResponseAPI = {
        routes: [
            {
                summary: MINIMAL_LEG.summary,
                legs: [MINIMAL_LEG],
                sections: {
                    traffic: [
                        {
                            startPathIndex: 0,
                            endPathIndex: 1,
                            effectiveSpeedInKilometersPerHour: 5,
                            delayDurationInSeconds: 5,
                            delayMagnitude: 'minor',
                        },
                    ],
                    toll: [{ startPathIndex: 0, endPathIndex: 1 }],
                    tunnel: [{ startPathIndex: 0, endPathIndex: 1 }],
                },
            },
        ],
    };

    const BASE_PARAMS: CalculateRouteParams = {
        apiKey: 'KEY',
        locations: [
            [0, 0],
            [1, 1],
        ],
    };

    test('returns all parsed sections when sectionTypes is undefined', () => {
        const result = parseCalculateRouteResponse(API_RESPONSE_WITH_SECTIONS, BASE_PARAMS);
        const sections = result.features[0].properties.sections;
        expect(sections).toHaveProperty('traffic');
        expect(sections).toHaveProperty('toll');
        expect(sections).toHaveProperty('tunnel');
        expect(sections).toHaveProperty('leg');
    });

    test('returns only requested section types when sectionTypes is specified', () => {
        const result = parseCalculateRouteResponse(API_RESPONSE_WITH_SECTIONS, {
            ...BASE_PARAMS,
            sectionTypes: ['traffic'],
        });
        const sections = result.features[0].properties.sections;
        expect(sections).toHaveProperty('traffic');
        expect(sections).toHaveProperty('leg');
        expect(sections).not.toHaveProperty('toll');
        expect(sections).not.toHaveProperty('tunnel');
    });

    test('returns only leg when sectionTypes requests a type V3 never returns (e.g. lanes)', () => {
        const result = parseCalculateRouteResponse(API_RESPONSE_WITH_SECTIONS, {
            ...BASE_PARAMS,
            sectionTypes: ['lanes'],
        });
        const sections = result.features[0].properties.sections;
        expect(Object.keys(sections)).toEqual(['leg']);
    });

    test('returns only leg when sectionTypes is empty array (no sections requested)', () => {
        const result = parseCalculateRouteResponse(API_RESPONSE_WITH_SECTIONS, {
            ...BASE_PARAMS,
            sectionTypes: [],
        });
        const sections = result.features[0].properties.sections;
        expect(Object.keys(sections)).toEqual(['leg']);
    });

    test('vehicleRestricted section is filtered correctly when not requested', () => {
        const responseWithTravelMode: CalculateRouteResponseAPI = {
            routes: [
                {
                    summary: MINIMAL_LEG.summary,
                    legs: [MINIMAL_LEG],
                    sections: {
                        travelMode: [{ startPathIndex: 0, endPathIndex: 1, travelMode: 'other' }],
                        toll: [{ startPathIndex: 0, endPathIndex: 1 }],
                    },
                },
            ],
        };
        const result = parseCalculateRouteResponse(responseWithTravelMode, {
            ...BASE_PARAMS,
            sectionTypes: ['toll'],
        });
        const sections = result.features[0].properties.sections;
        expect(sections).toHaveProperty('toll');
        expect(sections).not.toHaveProperty('vehicleRestricted');
    });

    test('vehicleRestricted section is kept when requested', () => {
        const responseWithTravelMode: CalculateRouteResponseAPI = {
            routes: [
                {
                    summary: MINIMAL_LEG.summary,
                    legs: [MINIMAL_LEG],
                    sections: {
                        travelMode: [{ startPathIndex: 0, endPathIndex: 1, travelMode: 'other' }],
                    },
                },
            ],
        };
        const result = parseCalculateRouteResponse(responseWithTravelMode, {
            ...BASE_PARAMS,
            sectionTypes: ['vehicleRestricted'],
        });
        const sections = result.features[0].properties.sections;
        expect(sections).toHaveProperty('vehicleRestricted');
        expect(sections).toHaveProperty('leg');
    });
});

describe('V3 → SDK guidance/section conversions', () => {
    const SUMMARY = {
        lengthInMeters: 100,
        travelDurationInSeconds: 10,
        departureDateTime: '2024-01-01T10:00:00+00:00',
        arrivalDateTime: '2024-01-01T10:00:10+00:00',
    };
    const LEG = {
        summary: SUMMARY,
        path: {
            type: 'LineString' as const,
            coordinates: [
                [0, 0],
                [1, 1],
            ],
        },
    };
    const PARAMS: CalculateRouteParams = {
        apiKey: 'K',
        locations: [
            [0, 0],
            [1, 1],
        ],
    };

    const RESPONSE: CalculateRouteResponseAPI = {
        roadShieldAtlasReference: 'https://shields.example/atlas',
        routes: [
            {
                summary: SUMMARY,
                legs: [LEG],
                sections: {
                    speedLimit: [
                        {
                            startPathIndex: 0,
                            endPathIndex: 1,
                            speedRestrictions: [
                                { type: 'minimum', inKilometersPerHour: 30 },
                                { type: 'maximum', inKilometersPerHour: 100 },
                            ],
                        },
                        // no maximum restriction → dropped
                        {
                            startPathIndex: 1,
                            endPathIndex: 2,
                            speedRestrictions: [{ type: 'minimum', inKilometersPerHour: 20 }],
                        },
                    ],
                    lanes: [
                        {
                            startPathIndex: 0,
                            endPathIndex: 1,
                            lanes: [{ directions: ['slightRight', 'straight'], follow: 'slightRight' }],
                            laneSeparators: ['longDashed', 'physicalDividerLessThan3m'],
                            properties: ['IS_MANEUVER'],
                        },
                    ],
                },
                instructions: [
                    {
                        routeOffsetInMeters: 0,
                        maneuver: 'passTollgate',
                        maneuverPoint: { latitude: 0, longitude: 0 },
                        drivingSide: 'left',
                        landmark: 'atTrafficLight',
                        distanceToPreviousTrafficLightInMeters: 12,
                        ambiguousExitOffsetFromManeuverInMeters: 34,
                        tollgateName: { text: 'Gate', phonetic: { ipa: 'geɪt' }, phoneticLanguageCode: 'en' },
                        tollPaymentTypes: ['cashCoinsAndBills', 'etcTransponder'],
                        countryCrossingFromName: { text: 'Spain' },
                        countryCrossingFromCodeIso2: 'ES',
                        countryCrossingToName: { text: 'France' },
                        countryCrossingToCodeIso2: 'FR',
                        signpost: {
                            exitName: { text: 'A1' },
                            exitNumber: { text: '12' },
                            towardName: { text: 'Paris' },
                            exitIconReference: { reference: 'ref-sign' },
                        },
                        nextRoadInformation: {
                            properties: ['controlledAccess'],
                            roadNames: [
                                {
                                    identifier: {
                                        text: 'Main St',
                                        phonetic: { lhp: 'meɪn' },
                                        phoneticLanguageCode: 'en',
                                    },
                                },
                            ],
                            roadShields: [
                                {
                                    roadNumber: { text: 'A1' },
                                    countryCodeIso2: 'ES',
                                    countrySubdivisionCodeIso: 'CT',
                                    iconReference: { reference: 'ref-1', shieldContent: 'A1' },
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    };

    const instruction = () => {
        const { guidance } = parseCalculateRouteResponse(RESPONSE, PARAMS).features[0].properties;
        if (!guidance) throw new Error('expected guidance to be present');
        return guidance.instructions[0];
    };

    test('converts maneuver, drivingSide, landmark and toll payment casings', () => {
        expect(instruction()).toMatchObject({
            maneuver: 'TOLLGATE',
            maneuverPoint: [0, 0],
            drivingSide: 'LEFT',
            landmark: 'AT_TRAFFIC_LIGHT',
            tollPaymentTypes: ['CASH_COINS_AND_BILLS', 'ETC_TRANSPONDER'],
        });
    });

    test('renames trafficLight/ambiguousExit offsets and converts country crossing codes to ISO3', () => {
        expect(instruction()).toMatchObject({
            trafficLightOffsetInMeters: 12,
            offsetOfAmbiguousExitFromManeuverInMeters: 34,
            countryCrossingFromCode: 'ESP',
            countryCrossingToCode: 'FRA',
            tollgateName: { text: 'Gate', phonetic: 'geɪt', phoneticLanguageCode: 'en' },
        });
    });

    test('maps road info, road shields and atlas/signpost references', () => {
        expect(instruction()).toMatchObject({
            roadShieldAtlasReference: 'https://shields.example/atlas',
            signpost: { exitName: { text: 'A1' }, exitNumber: { text: '12' }, towardName: { text: 'Paris' } },
            signpostRoadShieldReferences: [{ reference: 'ref-sign' }],
            roadShieldReferences: [{ reference: 'ref-1', shieldContent: 'A1' }],
            nextRoadInfo: {
                properties: ['CONTROLLED_ACCESS'],
                streetName: { text: 'Main St', phonetic: 'meɪn' },
                roadShields: [
                    {
                        roadNumber: { text: 'A1' },
                        countryCode: 'ESP',
                        stateCode: 'CT',
                        roadShieldReference: { reference: 'ref-1', shieldContent: 'A1' },
                    },
                ],
            },
        });
    });

    test('speedLimit uses the maximum restriction and drops sections without one', () => {
        const speedLimit = parseCalculateRouteResponse(RESPONSE, PARAMS).features[0].properties.sections.speedLimit;
        expect(speedLimit).toEqual([
            expect.objectContaining({ startPointIndex: 0, endPointIndex: 1, maxSpeedLimitInKmh: 100 }),
        ]);
    });

    test('lane directions and separators are mapped to UPPER_SNAKE enums', () => {
        const lanes = parseCalculateRouteResponse(RESPONSE, PARAMS).features[0].properties.sections.lanes;
        expect(lanes).toEqual([
            expect.objectContaining({
                lanes: [{ directions: ['SLIGHT_RIGHT', 'STRAIGHT'], follow: 'SLIGHT_RIGHT' }],
                laneSeparators: ['LONG_DASHED', 'PHYSICAL_DIVIDER_LESS_THAN_3M'],
                properties: ['IS_MANEUVER'],
            }),
        ]);
    });
});
