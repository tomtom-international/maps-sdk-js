import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { CustomGeometriesDataset, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it } from 'vitest';
import { replaceGeometriesByOperation } from '../../agent/custom-geometries';

const square: PolygonFeature = {
    type: 'Feature',
    bbox: [0, 0, 1, 1],
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
    properties: {},
};

// The two slice calls the helper makes, over an in-memory history.
const stubSlice = () => {
    let added = 0;
    const slice = {
        datasets: [] as CustomGeometriesDataset[],
        findById: (id: string) => slice.datasets.find((dataset) => dataset.id === id),
        removeDataset: async (id: string) => {
            slice.datasets = slice.datasets.filter((dataset) => dataset.id !== id);
        },
        addDataset: async (input: Omit<CustomGeometriesDataset, 'id' | 'timestamp'>) => {
            const id = `customGeometries-${added++}`;
            slice.datasets.push({ ...input, id, timestamp: 0 });
            return id;
        },
    };
    return slice;
};

const setup = async () => {
    const customGeometries = stubSlice();
    const state = { customGeometries } as unknown as ToolState;
    await replaceGeometriesByOperation(state, 'hexes', 'Hexes', [square]);
    await replaceGeometriesByOperation(state, 'catchment', 'Catchment', [square]);
    return { customGeometries, state };
};

describe('replaceGeometriesByOperation', () => {
    it('replaces only the datasets produced by that operation', async () => {
        const { customGeometries, state } = await setup();

        const id = await replaceGeometriesByOperation(state, 'hexes', 'New hexes', [square]);

        expect(customGeometries.datasets.map((dataset) => [dataset.label, dataset.producedFrom.operation])).toEqual([
            ['Catchment', 'catchment'],
            ['New hexes', 'hexes'],
        ]);
        expect(customGeometries.findById(id ?? '')?.data.features).toEqual([square]);
    });

    it('only removes them when there are no features, returning undefined', async () => {
        const { customGeometries, state } = await setup();

        expect(await replaceGeometriesByOperation(state, 'hexes', 'Hexes', [])).toBeUndefined();

        expect(customGeometries.datasets.map((dataset) => dataset.label)).toEqual(['Catchment']);
    });
});
