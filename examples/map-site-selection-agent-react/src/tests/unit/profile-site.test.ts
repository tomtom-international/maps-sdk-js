import { rangesOf, type ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import * as turf from '@turf/turf';
import { describe, expect, it, vi } from 'vitest';
import { drawCatchment } from '../../tools/profile-site';

vi.mock('../../config', () => ({}));
vi.mock('../../viz/site-visuals', () => ({
    clearRankedPins: vi.fn(),
    clearSiteMarker: vi.fn(),
    fitBesidePanel: vi.fn(),
    styleCatchment: vi.fn(),
    withColor: (feature: { properties: object }, color: string) => ({
        ...feature,
        properties: { ...feature.properties, color },
    }),
}));

const fakeState = () => {
    const ranges = {
        datasets: [{ id: 'previous' }],
        removeDataset: vi.fn(),
        addDataset: vi.fn(async () => 'ranges-1'),
        getDatasetGeometriesModule: vi.fn(),
        showDataset: vi.fn(),
    };
    return { state: { ranges } as unknown as ToolState, ranges };
};

describe('drawCatchment', () => {
    it('stores each catchment as a range polygon tagged with its origin, budget and colour', async () => {
        const { state, ranges } = fakeState();
        const budget = { type: 'timeMinutes', value: 10 } as const;

        const id = await drawCatchment(
            state,
            'Ranked sites',
            [
                {
                    origin: { query: '#1 Site A', position: [-115.2, 36.17] },
                    budget,
                    polygon: turf.circle([-115.2, 36.17], 1),
                },
                { origin: { position: [-115.1, 36.18] }, budget, polygon: turf.circle([-115.1, 36.18], 1) },
            ],
            false,
            false,
            ['#00ff00', '#ff0000'],
        );

        expect(id).toBe('ranges-1');
        expect(ranges.removeDataset).toHaveBeenCalledWith('previous');
        const [{ data }] = ranges.addDataset.mock.calls[0] as unknown as [{ data: Parameters<typeof rangesOf>[0] }];
        expect(data.features.map((feature) => feature.properties)).toEqual([
            expect.objectContaining({ origin: [-115.2, 36.17], budget, originQuery: '#1 Site A', color: '#00ff00' }),
            expect.objectContaining({ origin: [-115.1, 36.18], budget, color: '#ff0000' }),
        ]);
        expect(data.features[1].properties).not.toHaveProperty('originQuery');
        expect(rangesOf(data).map((range) => range.origin)).toEqual([
            { query: '#1 Site A', position: [-115.2, 36.17] },
            { position: [-115.1, 36.18] },
        ]);
        expect(ranges.showDataset).toHaveBeenCalledWith('ranges-1', { polygons: 'none', originPins: false });
    });
});
