import { describe, expect, it } from 'vitest';
import { executeRecallPlaces } from './recall-places';

const mockState = () => {
    const places = {
        entries: [] as any[],
    };
    return { places } as any;
};

describe('recallPlaces', () => {
    it('returns empty index when no entries', async () => {
        const state = mockState();
        const result = await executeRecallPlaces({}, state);
        expect(result).toEqual({ entries: [] });
    });

    it('returns index with labels when no id given', async () => {
        const state = mockState();
        state.places.entries = [
            { id: 'places-0', timestamp: 1000, label: 'Cafe', data: {} },
            { id: 'places-1', timestamp: 2000, label: '5 places', data: {} },
        ];
        const result = await executeRecallPlaces({}, state);
        expect(result).toEqual({
            entries: [
                { id: 'places-1', label: '5 places', timestamp: 2000 },
                { id: 'places-0', label: 'Cafe', timestamp: 1000 },
            ],
        });
    });

    it('returns summarized entry when id is given', async () => {
        const state = mockState();
        state.places.entries = [
            {
                id: 'places-0',
                timestamp: 1000,
                label: 'Cafe de Jaren',
                data: [
                    {
                        properties: {
                            poi: { name: 'Cafe de Jaren' },
                            address: { freeformAddress: 'Amsterdam' },
                        },
                        geometry: { coordinates: [4.89, 52.37] },
                    },
                ],
            },
        ];
        const result = await executeRecallPlaces({ id: 'places-0' }, state);
        expect(result).toMatchObject({
            id: 'places-0',
            label: 'Cafe de Jaren',
            places: {
                count: 1,
                features: [{ name: 'Cafe de Jaren', address: 'Amsterdam', position: [4.89, 52.37] }],
            },
        });
    });

    it('returns error for unknown id', async () => {
        const state = mockState();
        state.places.entries = [];
        const result = await executeRecallPlaces({ id: 'places-99' }, state);
        expect(result).toEqual({ error: 'No entry found with id "places-99"' });
    });

    it('returns search results summary for discover entries', async () => {
        const state = mockState();
        state.places.entries = [
            {
                id: 'places-0',
                timestamp: 1000,
                label: '2 places',
                data: [
                    {
                        properties: { poi: { name: 'A' }, address: { freeformAddress: 'Addr A' } },
                        geometry: { coordinates: [1, 2] },
                    },
                    {
                        properties: { poi: { name: 'B' }, address: { freeformAddress: 'Addr B' } },
                        geometry: { coordinates: [3, 4] },
                    },
                ],
            },
        ];
        const result = await executeRecallPlaces({ id: 'places-0' }, state);
        expect(result).toMatchObject({
            id: 'places-0',
            places: {
                count: 2,
                features: [
                    { name: 'A', address: 'Addr A', position: [1, 2] },
                    { name: 'B', address: 'Addr B', position: [3, 4] },
                ],
            },
        });
    });
});
