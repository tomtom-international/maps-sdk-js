import { describe, expect, it } from 'vitest';
import { Analyses, type EntryAnalysis, makeAnalysisId } from '../../../state';
import { executeRecallPlaces } from '../recall-places';

// Seed the top-level analyses store with results for one entry — mirrors how the slice attaches
// analyses at runtime (one record per name, keyed by analysisId, attached to the entry).
const seedAnalyses = (store: Analyses, entryId: string, ...results: EntryAnalysis[]): void => {
    for (const result of results) {
        const analysisId = makeAnalysisId(result.name, [entryId]);
        store.register({
            analysisId,
            name: result.name,
            description: result.description,
            outputFormat: result.outputFormat,
            affectedEntryIds: [entryId],
        });
        store.attachResult(analysisId, result);
    }
};

type FakeEntry = {
    id: string;
    timestamp: number;
    label: string;
    data: any[];
};

const mockState = (entries: FakeEntry[] = [], shownIds: readonly string[] = [], analyses = new Analyses()) =>
    ({
        places: {
            entries,
            shownEntryIds: new Set(shownIds),
            getShownMarkerType: () => undefined,
        },
        analyses,
    }) as any;

describe('recallPlaces', () => {
    it('returns empty index when no entries', async () => {
        const state = mockState();
        const result = await executeRecallPlaces({}, state);
        expect(result).toEqual({ entries: [] });
    });

    it('returns index with labels when no id given, sorted newest first', async () => {
        const state = mockState([
            { id: 'places-0', timestamp: 1000, label: 'Cafe', data: [{}] },
            { id: 'places-1', timestamp: 2000, label: '5 places', data: [{}, {}, {}, {}, {}] },
        ]);
        const result = await executeRecallPlaces({}, state);
        expect(result).toEqual({
            entries: [
                { id: 'places-1', label: '5 places', timestamp: 2000, featureCount: 5, shown: false },
                { id: 'places-0', label: 'Cafe', timestamp: 1000, featureCount: 1, shown: false },
            ],
        });
    });

    it('surfaces attached analyses in the index', async () => {
        const analyses = new Analyses();
        seedAnalyses(
            analyses,
            'places-0',
            {
                name: 'by-category',
                timestamp: 1500,
                outputFormat: 'json',
                description: 'counts per category',
                data: {},
            },
            { name: 'top-brands-bar', timestamp: 1800, outputFormat: 'chart', data: {} },
        );
        const state = mockState(
            [{ id: 'places-0', timestamp: 1000, label: '3 places', data: [{}, {}, {}] }],
            [],
            analyses,
        );
        const result = await executeRecallPlaces({}, state);
        expect(result).toEqual({
            entries: [
                {
                    id: 'places-0',
                    label: '3 places',
                    timestamp: 1000,
                    featureCount: 3,
                    shown: false,
                    analyses: [
                        {
                            name: 'by-category',
                            outputFormat: 'json',
                            timestamp: 1500,
                            description: 'counts per category',
                        },
                        { name: 'top-brands-bar', outputFormat: 'chart', timestamp: 1800 },
                    ],
                },
            ],
        });
    });

    it('returns summarized entry when id is given', async () => {
        const state = mockState([
            {
                id: 'places-0',
                timestamp: 1000,
                label: 'Cafe de Jaren',
                data: [
                    {
                        id: 'feat-1',
                        properties: {
                            poi: { name: 'Cafe de Jaren' },
                            address: { freeformAddress: 'Amsterdam' },
                        },
                        geometry: { coordinates: [4.89, 52.37] },
                    },
                ],
            },
        ]);
        const result = await executeRecallPlaces({ id: 'places-0' }, state);
        expect(result).toMatchObject({
            id: 'places-0',
            label: 'Cafe de Jaren',
            places: {
                count: 1,
                features: [{ id: 'feat-1', name: 'Cafe de Jaren', address: 'Amsterdam' }],
            },
        });
    });

    it('returns error for unknown id', async () => {
        const state = mockState();
        const result = await executeRecallPlaces({ id: 'places-99' }, state);
        expect(result).toEqual({ error: 'No entry found with id "places-99"' });
    });

    it('returns search results summary for discover entries', async () => {
        const state = mockState([
            {
                id: 'places-0',
                timestamp: 1000,
                label: '2 places',
                data: [
                    {
                        id: 'feat-A',
                        properties: { poi: { name: 'A' }, address: { freeformAddress: 'Addr A' } },
                        geometry: { coordinates: [1, 2] },
                    },
                    {
                        id: 'feat-B',
                        properties: { poi: { name: 'B' }, address: { freeformAddress: 'Addr B' } },
                        geometry: { coordinates: [3, 4] },
                    },
                ],
            },
        ]);
        const result = await executeRecallPlaces({ id: 'places-0' }, state);
        expect(result).toMatchObject({
            id: 'places-0',
            places: {
                count: 2,
                features: [
                    { id: 'feat-A', name: 'A', address: 'Addr A' },
                    { id: 'feat-B', name: 'B', address: 'Addr B' },
                ],
            },
        });
    });
});
