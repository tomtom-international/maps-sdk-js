import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Polygon } from 'geojson';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RangeState } from '../../../state';
import { makeMockRanges, makeMockState } from '../../../tests/constants';
import { executeRecallRanges } from '../recall-ranges';

const polygon: Polygon = {
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
};

describe('executeRecallRanges', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('lists entries with an origin count when no id is given', async () => {
        const { ranges, rangeId } = await makeMockRanges(polygon);

        const result = await executeRecallRanges({}, makeMockState({ ranges }));
        if (!('entries' in result)) expect.fail('expected an index result');

        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]).toMatchObject({ id: rangeId, originCount: 1 });
    });

    it('errors on an unknown id', async () => {
        const { ranges } = await makeMockRanges(polygon);
        const result = await executeRecallRanges({ id: 'ranges-9' }, makeMockState({ ranges }));
        expect(result).toEqual({ error: 'No entry found with id "ranges-9"' });
    });

    it('returns detail with origin position as a tuple and budgets echoed back', async () => {
        const { ranges, rangeId } = await makeMockRanges(polygon);

        const result = await executeRecallRanges({ id: rangeId }, makeMockState({ ranges }));
        if (!('ranges' in result)) expect.fail('expected a detail result');

        expect(result.id).toBe(rangeId);
        expect(result.ranges[0].origin.position).toEqual([4.9, 52.4]);
        expect(result.ranges[0].budgets).toEqual([]);
    });

    // The tool description says "multi-origin entries surface every origin under `ranges`" — a
    // single findReachableAreas call with several origins produces ONE entry whose `data` holds
    // multiple ReachableRange groups. makeMockRanges only ever builds a single-origin entry, so this
    // constructs one directly via RangeState to cover the multi-origin case the description promises.
    it('surfaces every origin when the entry holds multiple ranges (multi-origin findReachableAreas call)', async () => {
        const ranges = new RangeState({} as TomTomMap);
        const rangeId = await ranges.addEntry({
            label: 'multi-origin range',
            data: [
                {
                    origin: { position: [4.9, 52.4] },
                    budgets: [{ type: 'timeMinutes', value: 10 }],
                    polygon: {
                        type: 'FeatureCollection',
                        features: [{ type: 'Feature', geometry: polygon, properties: {}, bbox: [0, 0, 1, 1] }],
                    },
                },
                {
                    origin: { position: [2.35, 48.85] },
                    budgets: [{ type: 'timeMinutes', value: 15 }],
                    polygon: {
                        type: 'FeatureCollection',
                        features: [{ type: 'Feature', geometry: polygon, properties: {}, bbox: [0, 0, 1, 1] }],
                    },
                },
            ],
        });

        const indexResult = await executeRecallRanges({}, makeMockState({ ranges }));
        if (!('entries' in indexResult)) expect.fail('expected an index result');
        expect(indexResult.entries[0]).toMatchObject({ id: rangeId, originCount: 2 });

        const detailResult = await executeRecallRanges({ id: rangeId }, makeMockState({ ranges }));
        if (!('ranges' in detailResult)) expect.fail('expected a detail result');

        expect(detailResult.ranges).toHaveLength(2);
        expect(detailResult.ranges.map((r) => r.origin.position)).toEqual([
            [4.9, 52.4],
            [2.35, 48.85],
        ]);
        expect(detailResult.ranges.map((r) => r.budgets)).toEqual([
            [{ type: 'timeMinutes', value: 10 }],
            [{ type: 'timeMinutes', value: 15 }],
        ]);
    });
});
