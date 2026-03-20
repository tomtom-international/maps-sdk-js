import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Using customize obj', () => {
    test('reachable range request building tests using customize obj', () => {
        expect(
            customizeService.reachableRange.buildReachableRangeRequest({
                apiKey: 'GLOBAL_API_KEY',
                apiVersion: 3,
                commonBaseURL: 'https://api.tomtom.com',
                origin: [10.123, 20.567],
                budget: { type: 'timeMinutes', value: 30 },
            }),
        ).toEqual({
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateReachableRange/20.567,10.123/json?apiVersion=3&key=GLOBAL_API_KEY&timeBudgetInSec=1800&smoothing=strong',
            ),
        });
    });
});
