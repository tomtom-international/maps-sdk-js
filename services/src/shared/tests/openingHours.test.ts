import type { OpeningHours } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { parseOpeningHours } from '../searchResultParsing';

describe('Parse API Opening Hours tests', () => {
    test('Parse API Opening Hours always open', () => {
        expect(
            parseOpeningHours({
                mode: 'nextSevenDays',
                timeRanges: [
                    {
                        startTime: { date: '2023-12-20', hour: 0, minute: 0 },
                        endTime: { date: '2023-12-27', hour: 0, minute: 0 },
                    },
                ],
            }),
        ).toEqual<OpeningHours>({
            mode: 'nextSevenDays',
            timeRanges: [
                {
                    start: {
                        date: new Date(2023, 11, 20, 0, 0),
                        dateYYYYMMDD: '2023-12-20',
                        year: 2023,
                        month: 12,
                        day: 20,
                        hour: 0,
                        minute: 0,
                    },
                    end: {
                        date: new Date(2023, 11, 27, 0, 0),
                        dateYYYYMMDD: '2023-12-27',
                        year: 2023,
                        month: 12,
                        day: 27,
                        hour: 0,
                        minute: 0,
                    },
                },
            ],
            alwaysOpenThisPeriod: true,
        });
    });

    test('Parse API Opening Hours only open some the mornings', () => {
        expect(
            parseOpeningHours({
                mode: 'nextSevenDays',
                timeRanges: [
                    {
                        startTime: { date: '2023-12-20', hour: 7, minute: 0 },
                        endTime: { date: '2023-12-20', hour: 13, minute: 0 },
                    },
                    {
                        startTime: { date: '2023-12-21', hour: 7, minute: 30 },
                        endTime: { date: '2023-12-21', hour: 13, minute: 0 },
                    },
                    {
                        startTime: { date: '2023-12-23', hour: 8, minute: 15 },
                        endTime: { date: '2023-12-23', hour: 14, minute: 0 },
                    },
                ],
            }),
        ).toEqual<OpeningHours>({
            mode: 'nextSevenDays',
            timeRanges: [
                {
                    start: {
                        date: new Date(2023, 11, 20, 7, 0),
                        dateYYYYMMDD: '2023-12-20',
                        year: 2023,
                        month: 12,
                        day: 20,
                        hour: 7,
                        minute: 0,
                    },
                    end: {
                        date: new Date(2023, 11, 20, 13, 0),
                        dateYYYYMMDD: '2023-12-20',
                        year: 2023,
                        month: 12,
                        day: 20,
                        hour: 13,
                        minute: 0,
                    },
                },
                {
                    start: {
                        date: new Date(2023, 11, 21, 7, 30),
                        dateYYYYMMDD: '2023-12-21',
                        year: 2023,
                        month: 12,
                        day: 21,
                        hour: 7,
                        minute: 30,
                    },
                    end: {
                        date: new Date(2023, 11, 21, 13, 0),
                        dateYYYYMMDD: '2023-12-21',
                        year: 2023,
                        month: 12,
                        day: 21,
                        hour: 13,
                        minute: 0,
                    },
                },
                {
                    start: {
                        date: new Date(2023, 11, 23, 8, 15),
                        dateYYYYMMDD: '2023-12-23',
                        year: 2023,
                        month: 12,
                        day: 23,
                        hour: 8,
                        minute: 15,
                    },
                    end: {
                        date: new Date(2023, 11, 23, 14, 0),
                        dateYYYYMMDD: '2023-12-23',
                        year: 2023,
                        month: 12,
                        day: 23,
                        hour: 14,
                        minute: 0,
                    },
                },
            ],
            alwaysOpenThisPeriod: false,
        });
    });
});
