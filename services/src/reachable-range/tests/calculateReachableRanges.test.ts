import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SDKError, SDKServiceError } from '../../shared/errors';
import { calculateReachableRanges } from '../calculateReachableRange';
import type { ReachableRangeParams } from '../types/reachableRangeParams';

vi.mock('../../shared/serviceTemplate', () => ({ callService: vi.fn() }));

const { callService } = await import('../../shared/serviceTemplate');
const mockCallService = vi.mocked(callService);

const makeFeature = (value: number): PolygonFeature<ReachableRangeParams> => ({
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
            ],
        ],
    },
    bbox: [0, 0, 1, 1],
    properties: { origin: [0, 0], budget: { type: 'timeMinutes', value } } as ReachableRangeParams,
});

const paramsFor = (value: number): ReachableRangeParams => ({
    origin: [4.9, 52.3],
    budget: { type: 'timeMinutes', value },
});

afterEach(() => mockCallService.mockReset());

describe('calculateReachableRanges', () => {
    test('returns all features when all requests succeed', async () => {
        mockCallService.mockResolvedValueOnce(makeFeature(10)).mockResolvedValueOnce(makeFeature(20));

        const result = await calculateReachableRanges([paramsFor(10), paramsFor(20)]);

        expect(result.features).toHaveLength(2);
    });

    test('silently skips API errors (e.g. no road network) and returns partial results', async () => {
        mockCallService
            .mockResolvedValueOnce(makeFeature(10))
            .mockRejectedValueOnce(new SDKServiceError('No reachable range', 'Reachable Range', 400))
            .mockResolvedValueOnce(makeFeature(30));

        const result = await calculateReachableRanges([paramsFor(10), paramsFor(20), paramsFor(30)]);

        expect(result.features).toHaveLength(2);
        expect(result.features[0].properties.budget.value).toBe(10);
        expect(result.features[1].properties.budget.value).toBe(30);
    });

    test('returns empty FeatureCollection when all budgets fail with API errors', async () => {
        mockCallService.mockRejectedValue(new SDKServiceError('No reachable range', 'Reachable Range', 400));

        const result = await calculateReachableRanges([paramsFor(10), paramsFor(20)]);

        expect(result.features).toHaveLength(0);
        expect(result.type).toBe('FeatureCollection');
    });

    test('re-throws validation (non-API)', async () => {
        mockCallService
            .mockResolvedValueOnce(makeFeature(10))
            .mockRejectedValueOnce(new SDKError('Invalid params', 'Reachable Range'));

        await expect(calculateReachableRanges([paramsFor(10), paramsFor(20)])).rejects.toBeInstanceOf(SDKError);
    });

    test('re-throws 403 Forbidden errors', async () => {
        mockCallService.mockRejectedValue(new SDKServiceError('Forbidden', 'Reachable Range', 403));

        await expect(calculateReachableRanges([paramsFor(10), paramsFor(20)])).rejects.toMatchObject({ status: 403 });
    });

    test('re-throws 429 Too Many Requests errors', async () => {
        mockCallService.mockRejectedValue(new SDKServiceError('Too Many Requests', 'Reachable Range', 429));

        await expect(calculateReachableRanges([paramsFor(10), paramsFor(20)])).rejects.toMatchObject({ status: 429 });
    });

    test('rejects with AbortError and skips remaining requests when signal fires mid-sequence', async () => {
        const controller = new AbortController();

        // Abort during the first request — the second should never start
        mockCallService.mockImplementationOnce(async () => {
            controller.abort();
            return makeFeature(10);
        });

        await expect(
            calculateReachableRanges([paramsFor(10), paramsFor(20)], { signal: controller.signal }),
        ).rejects.toMatchObject({ name: 'AbortError' });

        expect(mockCallService).toHaveBeenCalledTimes(1);
    });

    test('resolves normally when signal is provided but never aborted', async () => {
        const controller = new AbortController();
        mockCallService.mockResolvedValueOnce(makeFeature(10)).mockResolvedValueOnce(makeFeature(20));

        const result = await calculateReachableRanges([paramsFor(10), paramsFor(20)], { signal: controller.signal });

        expect(result.features).toHaveLength(2);
    });

    test('rejects immediately when signal is already aborted before the call', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(calculateReachableRanges([paramsFor(10)], { signal: controller.signal })).rejects.toMatchObject({
            name: 'AbortError',
        });

        expect(mockCallService).not.toHaveBeenCalled();
    });
});
