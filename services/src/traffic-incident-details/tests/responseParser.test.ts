import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseTrafficIncidentDetailsResponse } from '../responseParser';
import { apiAndParsedResponses } from './responseParser.data';

describe('parseTrafficIncidentDetailsResponse', () => {
    test.each(apiAndParsedResponses)('%s', (_name, apiResponse, expected) => {
        expect(parseTrafficIncidentDetailsResponse(apiResponse)).toMatchObject(expected);
    });

    test('converts ISO date strings to Date objects', () => {
        const result = parseTrafficIncidentDetailsResponse({
            incidents: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9, 52.3] },
                    properties: {
                        id: 'date-test',
                        iconCategory: 6,
                        magnitudeOfDelay: 2,
                        events: [],
                        startTime: '2024-06-01T12:00:00Z',
                        lastReportTime: '2024-06-01T14:30:00Z',
                        timeValidity: 'present',
                    },
                },
            ],
        });

        const props = result.features[0].properties;
        expect(props.startTime).toBeInstanceOf(Date);
        expect(props.lastReportTime).toBeInstanceOf(Date);
        expect(props.startTime?.toISOString()).toBe('2024-06-01T12:00:00.000Z');
    });

    test('omits optional fields when absent in API response', () => {
        const result = parseTrafficIncidentDetailsResponse({
            incidents: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {
                        id: 'minimal',
                        iconCategory: 0,
                        magnitudeOfDelay: 0,
                        events: [],
                        timeValidity: 'present',
                    },
                },
            ],
        });

        const props = result.features[0].properties;
        expect(props.startTime).toBeUndefined();
        expect(props.endTime).toBeUndefined();
        expect(props.from).toBeUndefined();
        expect(props.to).toBeUndefined();
        expect(props.lengthInMeters).toBeUndefined();
        expect(props.delayInSeconds).toBeUndefined();
        expect(props.roadNumbers).toBeUndefined();
        expect(props.probabilityOfOccurrence).toBeUndefined();
        expect(props.numberOfReports).toBeUndefined();
        expect(props.lastReportTime).toBeUndefined();
        expect(props.tmc).toBeUndefined();
    });
});

describe('parseTrafficIncidentDetailsResponse — performance', () => {
    test('parses within time budget', () => {
        const largeResponse = {
            incidents: Array.from({ length: 50 }, (_, i) => ({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [4.9 + i * 0.001, 52.3] },
                properties: {
                    id: `inc-${i}`,
                    iconCategory: i % 12,
                    magnitudeOfDelay: i % 5,
                    events: [{ description: 'Event', code: i, iconCategory: 1 }],
                    timeValidity: 'present',
                    from: 'Start',
                    to: 'End',
                    length: 500,
                    delay: 60,
                    roadNumbers: ['A1'],
                },
            })),
        };

        expect(bestExecutionTimeMS(() => parseTrafficIncidentDetailsResponse(largeResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.trafficIncidentDetails.responseParsing,
        );
    });
});
