import { describe, expect, test } from 'vitest';
import { parseCalculateRouteResponse } from '../responseParser';
import type { CalculateRouteResponseAPI, InstructionAPI, LegAPI } from '../types/apiResponseTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';

const LEG: LegAPI = {
    summary: {
        lengthInMeters: 100,
        travelDurationInSeconds: 10,
        trafficDelayDurationInSeconds: 0,
        trafficLengthInMeters: 0,
        departureDateTime: '2024-01-01T10:00:00+00:00',
        arrivalDateTime: '2024-01-01T10:00:10+00:00',
    },
    path: {
        type: 'LineString',
        coordinates: [
            [0, 0],
            [1, 1],
        ],
    },
};

const BASE_PARAMS: CalculateRouteParams = {
    apiKey: 'KEY',
    locations: [
        [0, 0],
        [1, 1],
    ],
    guidance: { type: 'coded' },
};

const INSTRUCTION: InstructionAPI = {
    routeOffsetInMeters: 0,
    maneuver: 'turnRight',
    maneuverPoint: { latitude: 0, longitude: 0 },
};

const responseWith = (instructions: InstructionAPI[]): CalculateRouteResponseAPI => ({
    routes: [{ summary: LEG.summary, legs: [LEG], instructions }],
});

const parseFirstInstruction = (instruction: InstructionAPI, params: CalculateRouteParams = BASE_PARAMS) => {
    const routes = parseCalculateRouteResponse(responseWith([instruction]), params);
    const guidance = routes.features[0].properties.guidance;
    if (!guidance) throw new Error('expected guidance to be parsed');

    return guidance.instructions[0];
};

describe('instruction message', () => {
    test('carries the generated, localised instruction text through unchanged', () => {
        const instruction = parseFirstInstruction({ ...INSTRUCTION, message: 'Turn right onto Damrak.' });
        expect(instruction.message).toBe('Turn right onto Damrak.');
    });

    test('is absent when the API omits it', () => {
        expect(parseFirstInstruction(INSTRUCTION).message).toBeUndefined();
    });
});

describe('maneuverView', () => {
    // The API reports relative directions ("slightLeft"), not degrees — a fact the plan had wrong
    // until it was probed.
    test('maps the on-route and off-route directions to the SDK vocabulary', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            maneuverView: { onRouteAngle: 'slightLeft', offRouteAngles: ['straight', 'sharpRight', 'back'] },
        });
        expect(instruction.maneuverView).toEqual({
            onRouteAngle: 'SLIGHT_LEFT',
            offRouteAngles: ['STRAIGHT', 'SHARP_RIGHT', 'BACK'],
        });
    });

    test('keeps an empty off-route list, which is what a plain junction returns', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            maneuverView: { onRouteAngle: 'right', offRouteAngles: [] },
        });
        expect(instruction.maneuverView).toEqual({ onRouteAngle: 'RIGHT', offRouteAngles: [] });
    });

    test('omits onRouteAngle when the API does not report one', () => {
        const instruction = parseFirstInstruction({ ...INSTRUCTION, maneuverView: { offRouteAngles: ['left'] } });
        expect(instruction.maneuverView).toEqual({ offRouteAngles: ['LEFT'] });
    });
});

describe('roundaboutType', () => {
    test.each([
        ['regular', 'REGULAR'],
        ['small', 'SMALL'],
    ])('maps %s to %s', (apiValue, expected) => {
        expect(parseFirstInstruction({ ...INSTRUCTION, roundaboutType: apiValue }).roundaboutType).toBe(expected);
    });

    test('passes an unmapped value through rather than dropping the instruction', () => {
        expect(parseFirstInstruction({ ...INSTRUCTION, roundaboutType: 'turbo' }).roundaboutType).toBe('turbo');
    });
});

describe('sideRoads', () => {
    // The API side is lowercase while the SDK type is UPPER_SNAKE. The parser used to forward the
    // API objects untouched, so the emitted value did not match the declared type.
    test('maps the side to the SDK casing and carries isDrivable', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            sideRoads: [
                { side: 'left', offsetFromManeuverInMeters: 177, isDrivable: true },
                { side: 'right', offsetFromManeuverInMeters: 90, isDrivable: false },
            ],
        });
        expect(instruction.sideRoads).toEqual([
            { side: 'LEFT', offsetFromManeuverInMeters: 177, isDrivable: true },
            { side: 'RIGHT', offsetFromManeuverInMeters: 90, isDrivable: false },
        ]);
    });

    test('omits isDrivable when the API does not report it', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            sideRoads: [{ side: 'leftAndRight', offsetFromManeuverInMeters: 10 }],
        });
        expect(instruction.sideRoads).toEqual([{ side: 'LEFT_AND_RIGHT', offsetFromManeuverInMeters: 10 }]);
    });
});

describe('road information country code', () => {
    test('converts the ISO2 country code to the SDK ISO3 convention', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            nextRoadInformation: { countryCodeIso2: 'ES' },
        });
        expect(instruction.nextRoadInfo.countryCode).toBe('ESP');
    });
});

describe('phonetics', () => {
    // The API returns `phonetic` as a flat string, already transcribed in the alphabet the request asked
    // for. The parser used to read it as `{ lhp, ipa }`, so every value resolved to undefined and
    // was silently dropped — the SDK exposed no phonetics at all.
    test('carries the transcription the API sent', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            nextRoadInformation: {
                roadNames: [
                    {
                        identifier: {
                            text: 'Calle de la Canuda',
                            phonetic: 'ˈkæ.je ˈdə ˈlæ',
                            phoneticLanguageCode: 'en-GB',
                        },
                    },
                ],
            },
        });
        expect(instruction.nextRoadInfo.streetName).toEqual({
            text: 'Calle de la Canuda',
            phonetic: 'ˈkæ.je ˈdə ˈlæ',
            phoneticLanguageCode: 'en-GB',
        });
    });

    test('omits the phonetic when the API sends none', () => {
        const instruction = parseFirstInstruction({
            ...INSTRUCTION,
            nextRoadInformation: { roadNames: [{ identifier: { text: 'Rusland' } }] },
        });
        expect(instruction.nextRoadInfo.streetName).toEqual({ text: 'Rusland' });
    });
});

describe('section additions', () => {
    test('carries the traffic section eventId, the join key to the incident service', () => {
        const response: CalculateRouteResponseAPI = {
            routes: [
                {
                    summary: LEG.summary,
                    legs: [LEG],
                    sections: {
                        traffic: [{ startPathIndex: 0, endPathIndex: 1, eventId: 'TTL43867052628041000' }],
                    },
                },
            ],
        };
        const sections = parseCalculateRouteResponse(response, BASE_PARAMS).features[0].properties.sections;
        expect(sections.traffic?.[0].eventId).toBe('TTL43867052628041000');
    });

    test('parses tollRoad, which is distinct from toll', () => {
        const response: CalculateRouteResponseAPI = {
            routes: [
                {
                    summary: LEG.summary,
                    legs: [LEG],
                    sections: {
                        toll: [{ startPathIndex: 5, endPathIndex: 6 }],
                        tollRoad: [{ startPathIndex: 0, endPathIndex: 4 }],
                    },
                },
            ],
        };
        const sections = parseCalculateRouteResponse(response, BASE_PARAMS).features[0].properties.sections;
        expect(sections.tollRoad).toMatchObject([{ startPointIndex: 0, endPointIndex: 4 }]);
        expect(sections.toll).toMatchObject([{ startPointIndex: 5, endPointIndex: 6 }]);
    });

    test('honours a sectionTypes request for tollRoad only', () => {
        const response: CalculateRouteResponseAPI = {
            routes: [
                {
                    summary: LEG.summary,
                    legs: [LEG],
                    sections: {
                        toll: [{ startPathIndex: 5, endPathIndex: 6 }],
                        tollRoad: [{ startPathIndex: 0, endPathIndex: 4 }],
                    },
                },
            ],
        };
        const sections = parseCalculateRouteResponse(response, {
            ...BASE_PARAMS,
            sectionTypes: ['tollRoad'],
        }).features[0].properties.sections;
        expect(sections).toHaveProperty('tollRoad');
        expect(sections).not.toHaveProperty('toll');
    });
});
