import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SDKAbortError, SDKError, SDKServiceError } from '../../shared';
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

    test('rethrows a cancellation instead of skipping it like a no-road-network error', async () => {
        mockCallService
            .mockResolvedValueOnce(makeFeature(10))
            .mockRejectedValueOnce(new SDKAbortError('Reachable Range', 'superseded'));

        await expect(calculateReachableRanges([paramsFor(10), paramsFor(20), paramsFor(30)])).rejects.toBeInstanceOf(
            SDKAbortError,
        );

        // Stopped at the rejection rather than carrying on to the third budget
        expect(mockCallService).toHaveBeenCalledTimes(2);
    });

    test('resolves normally when signal is provided but never aborted', async () => {
        const controller = new AbortController();
        mockCallService.mockResolvedValueOnce(makeFeature(10)).mockResolvedValueOnce(makeFeature(20));

        const result = await calculateReachableRanges([paramsFor(10), paramsFor(20)], { signal: controller.signal });

        expect(result.features).toHaveLength(2);
    });

    test('forwards the signal into every underlying request so the in-flight one is cancelled', async () => {
        const controller = new AbortController();
        mockCallService.mockResolvedValueOnce(makeFeature(10)).mockResolvedValueOnce(makeFeature(20));

        await calculateReachableRanges([paramsFor(10), paramsFor(20)], { signal: controller.signal });

        expect(mockCallService).toHaveBeenCalledTimes(2);
        for (const [params] of mockCallService.mock.calls) {
            expect(params).toMatchObject({ signal: controller.signal });
        }
    });

    test('keeps a per-entry signal when no batch options argument is given', async () => {
        const controller = new AbortController();
        mockCallService.mockResolvedValueOnce(makeFeature(10));

        await calculateReachableRanges([{ ...paramsFor(10), signal: controller.signal }]);

        expect(mockCallService).toHaveBeenCalledWith(
            expect.objectContaining({ signal: controller.signal }),
            expect.anything(),
            expect.anything(),
        );
    });

    // Runs one batch given both a per-entry and a batch signal, and reports the signal that
    // reached the request so each test can check its own leg cancels it.
    const callGivenBothSignals = async () => {
        const perEntry = new AbortController();
        const batch = new AbortController();
        mockCallService.mockResolvedValueOnce(makeFeature(10));

        await calculateReachableRanges([{ ...paramsFor(10), signal: perEntry.signal }], { signal: batch.signal });

        const [params] = mockCallService.mock.calls[0];
        return { perEntry, batch, signal: params.signal };
    };

    test('the per-entry signal still cancels a call that also got a batch signal', async () => {
        const { perEntry, signal } = await callGivenBothSignals();

        expect(signal?.aborted).toBe(false);
        perEntry.abort();
        expect(signal?.aborted).toBe(true);
    });

    test('the batch signal cancels a call that also got a per-entry signal', async () => {
        const { batch, signal } = await callGivenBothSignals();

        expect(signal?.aborted).toBe(false);
        batch.abort();
        expect(signal?.aborted).toBe(true);
    });
});
