import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { ReachableRangeParams } from '@tomtom-org/maps-sdk/services';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState, RangeState } from '../../../state';
import { makeMockState } from '../../../tests/constants';
import { executeFindReachableAreas } from '../find-reachable-areas';

// A non-empty reachable-range FeatureCollection — the tool only checks features.length.
const makeRangePolygon = (): PolygonFeatures<ReachableRangeParams> =>
    ({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 1],
                            [0, 0],
                        ],
                    ],
                },
                properties: {},
            },
        ],
    }) as PolygonFeatures<ReachableRangeParams>;

describe('executeFindReachableAreas', () => {
    const ranges = new RangeState({} as TomTomMap);
    const places = new PlacesState({} as TomTomMap);

    afterEach(() => {
        ranges.reset();
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // One origin fails to resolve (unknown placeId) → it lands under `skipped`, and the other
    // origin is still processed into a real ranges entry.
    it('skips an unresolvable origin but still processes the others', async () => {
        const spy = vi.spyOn(sdkServices, 'calculateReachableRanges').mockResolvedValue(makeRangePolygon());

        const result = await executeFindReachableAreas(
            {
                origins: [{ placeIdOrEntryId: 'missing-id' }, { position: [4.9, 52.4] }],
                budgets: [{ type: 'timeMinutes', value: 15 }],
                showOnMap: false,
                showOriginPin: false,
            },
            makeMockState({ ranges, places }),
        );
        if ('error' in result || 'status' in result) {
            expect.fail('expected executeFindReachableAreas to return ranges');
        }

        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.skipped).toEqual([{ origin: 'missing-id', reason: 'origin not found' }]);
        expect(result.ranges).toHaveLength(1);
        expect(ranges.entries).toHaveLength(1);
        expect(ranges.entries[0].id).toBe(result.rangesId);
    });

    // The other per-origin failure: the origin resolves fine, but the service returns no
    // geometry for it. That origin is skipped with its resolved name, and the call still
    // succeeds on the rest — the resilience the tool description promises.
    it('skips an origin the service returns no geometry for', async () => {
        vi.spyOn(sdkServices, 'calculateReachableRanges')
            .mockResolvedValueOnce({ type: 'FeatureCollection', features: [] })
            .mockResolvedValueOnce(makeRangePolygon());

        const result = await executeFindReachableAreas(
            {
                origins: [{ position: [4.9, 52.4] }, { position: [4.8, 52.3] }],
                budgets: [{ type: 'timeMinutes', value: 15 }],
                showOnMap: false,
                showOriginPin: false,
            },
            makeMockState({ ranges, places }),
        );
        if ('error' in result || 'status' in result) {
            expect.fail('expected executeFindReachableAreas to return ranges');
        }

        expect(result.skipped).toEqual([{ origin: '[4.9, 52.4]', reason: 'no reachable area returned' }]);
        expect(result.ranges).toHaveLength(1);
    });

    // Every origin fails → `no_results` status and no entry written to state.ranges.
    it('returns no_results and writes no entry when all origins fail', async () => {
        const spy = vi.spyOn(sdkServices, 'calculateReachableRanges');

        const result = await executeFindReachableAreas(
            {
                origins: [{ placeIdOrEntryId: 'missing-a' }, { placeIdOrEntryId: 'missing-b' }],
                budgets: [{ type: 'timeMinutes', value: 15 }],
                showOnMap: false,
                showOriginPin: false,
            },
            makeMockState({ ranges, places }),
        );

        expect(result).toEqual({ status: 'no_results' });
        expect(spy).not.toHaveBeenCalled();
        expect(ranges.entries).toHaveLength(0);
    });

    // A valid origin with multiple budgets → calculateReachableRanges receives them sorted
    // descending by value, and a real ranges entry is written.
    it('calls the service with budgets sorted descending and writes an entry', async () => {
        const spy = vi.spyOn(sdkServices, 'calculateReachableRanges').mockResolvedValue(makeRangePolygon());

        const result = await executeFindReachableAreas(
            {
                origins: [{ position: [4.9, 52.4] }],
                budgets: [
                    { type: 'timeMinutes', value: 10 },
                    { type: 'timeMinutes', value: 30 },
                    { type: 'timeMinutes', value: 20 },
                ],
                showOnMap: false,
                showOriginPin: false,
            },
            makeMockState({ ranges, places }),
        );
        if ('error' in result || 'status' in result) {
            expect.fail('expected executeFindReachableAreas to return ranges');
        }

        // The second argument is the batch signal form: the service checks it between iterations,
        // so an abort skips the budgets still queued, not just the one in flight.
        expect(spy).toHaveBeenCalledWith(
            [
                expect.objectContaining({ origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 30 } }),
                expect.objectContaining({ origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 20 } }),
                expect.objectContaining({ origin: [4.9, 52.4], budget: { type: 'timeMinutes', value: 10 } }),
            ],
            { signal: undefined },
        );
        expect(result.ranges[0].budgets.map((b) => b.value)).toEqual([30, 20, 10]);
        expect(ranges.entries).toHaveLength(1);
        expect(ranges.entries[0].id).toBe(result.rangesId);
    });
});
