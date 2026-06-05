import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import { createToolState } from '../../../state';
import type { ToolState } from '../../../types';
import { executeAnalyseData } from '../analyse-data';

const mockMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

// A small disputed-areas-style collection: each feature carries an `ADMIN` property so the
// sandbox code can group by it — mirrors the "distribution of ADMIN" analysis from the demo.
const disputedAreas: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0, 0]]] }, properties: { ADMIN: 'India' } },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[1, 1]]] }, properties: { ADMIN: 'India' } },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[2, 2]]] }, properties: { ADMIN: 'China' } },
    ],
};

describe('analyseData — byod', () => {
    it('attaches the analysis to the byod entry and reports it as affected', async () => {
        const state: ToolState = createToolState(mockMap);
        const id = await state.byod.addEntry(disputedAreas, 'Natural Earth 50m disputed areas');

        const out = await executeAnalyseData(
            {
                byodEntryIDs: [id],
                name: 'admin-distribution',
                description: 'Disputed polygons per ADMIN value',
                code: `
                    const counts = {};
                    for (const f of byod.features) {
                        const key = f.properties.ADMIN;
                        counts[key] = (counts[key] ?? 0) + 1;
                    }
                    return counts;
                `,
            },
            state,
        );

        if ('error' in out) throw new Error(out.error);
        // Reported back to the chat...
        expect(out.affectedEntries).toEqual([{ kind: 'byod', id }]);
        expect(out.analysis).toEqual({ India: 2, China: 1 });
        // ...AND persisted on the entry, so the side panel's details view can render it.
        const entry = state.byod.entries.find((e) => e.id === id);
        expect(entry?._analysis).toHaveLength(1);
        expect(entry?._analysis?.[0]).toMatchObject({
            name: 'admin-distribution',
            description: 'Disputed polygons per ADMIN value',
            outputFormat: 'json',
            data: { India: 2, China: 1 },
        });
    });

    it('exposes byod entries separately via byodByEntry in the sandbox', async () => {
        const state: ToolState = createToolState(mockMap);
        const first = await state.byod.addEntry(disputedAreas, 'first');
        const second = await state.byod.addEntry(
            { type: 'FeatureCollection', features: disputedAreas.features.slice(0, 1) },
            'second',
        );

        const out = await executeAnalyseData(
            {
                byodEntryIDs: [first, second],
                name: 'per-entry-counts',
                code: 'return Object.fromEntries(Object.entries(byodByEntry).map(([id, collection]) => [id, collection.features.length]));',
            },
            state,
        );

        if ('error' in out) throw new Error(out.error);
        expect(out.analysis).toEqual({ [first]: 3, [second]: 1 });
        // The analysis is attached to every contributing entry.
        expect(out.affectedEntries).toEqual([
            { kind: 'byod', id: first },
            { kind: 'byod', id: second },
        ]);
    });
});
