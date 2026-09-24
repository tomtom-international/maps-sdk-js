import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import type { FetchInput, VehicleParameters } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildCalculateRouteRequest } from '../requestBuilder';
import type { CalculateRoutePOSTDataAPI } from '../types/apiRequestTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';
import { sdkAndAPIRequests } from './requestBuilder.data';
import { routeRequestParams, shortRouteRequestParams } from './requestBuilderPerf.data';

describe('Calculate Route request building functional tests', () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (_name: string, params: CalculateRouteParams, apiRequest: FetchInput<CalculateRoutePOSTDataAPI>) => {
            // Reparse via JSON to compare structure ignoring URL prototype identity and key order.
            // NOSONAR: structuredClone cannot clone URL objects; JSON round-trip is intentional here.
            expect(JSON.parse(JSON.stringify(buildCalculateRouteRequest(params)))).toEqual(
                JSON.parse(JSON.stringify(apiRequest)),
            ); // NOSONAR
        },
    );
});

// Each of these builds a request the API rejects by name, so the builder rejects it first with a
// message naming the actual cause. Each rejection was probed against the live API first.
describe('Calculate Route request building rejections', () => {
    const baseParams = {
        apiKey: 'GLOBAL_API_KEY',
        apiVersion: 3,
        commonBaseURL: 'https://api.tomtom.com',
    };

    test('A pause on an intermediate stop is accepted', () => {
        const params: CalculateRouteParams = {
            ...baseParams,
            locations: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.7, 52.25] },
                    properties: { pauseDurationSeconds: 300 },
                },
                [4.49015, 52.16109],
            ],
        };

        expect(buildCalculateRouteRequest(params)).toMatchObject({
            data: { legs: [{ routeStop: { pauseDurationInSeconds: 300 } }, {}] },
        });
    });

    // The type forbids this pairing outright; the cast stands in for an untyped JavaScript caller,
    // whom the builder still has to stop before the API rejects the request.
    test('A vehicle model ID without charging preferences is rejected, since only LDEVR takes it', () => {
        const params: CalculateRouteParams = {
            ...baseParams,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            vehicle: { model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' } } as VehicleParameters,
        };

        expect(() => buildCalculateRouteRequest(params)).toThrow(/variantId is only supported for EV routes/);
    });

    test('Charging preferences without a charging model are rejected, since LDEVR requires one', () => {
        const params: CalculateRouteParams = {
            ...baseParams,
            locations: [
                [13.492, 52.507],
                [8.624, 50.104],
            ],
            vehicle: {
                engineType: 'electric',
                model: {
                    engine: {
                        consumption: { speedsToConsumptionsKWH: [{ speedKMH: 90, consumptionUnitsPer100KM: 18 }] },
                    },
                },
                preferences: {
                    chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
                },
            },
        };

        expect(() => buildCalculateRouteRequest(params)).toThrow(/Charging preferences require a charging model/);
    });
});

describe('Calculate Route request building performance tests', () => {
    test('Calculate route request with many waypoints, mandatory & optional params', () => {
        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(shortRouteRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding,
        );

        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(routeRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding,
        );
    });
});
