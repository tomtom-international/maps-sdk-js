import { type POICategory, poiCategories } from '@tomtom-org/maps-sdk/core';
import { type DiscoverPlacesResponse, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import type { Polygon } from 'geojson';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_CATEGORY_CODES, type SearchFeature, searchInGeometry } from '../../demographics/households';

vi.mock('@tomtom-org/maps-sdk/services', () => ({ discoverPlaces: vi.fn() }));
const discoverPlacesMock = vi.mocked(discoverPlaces);

const area: Polygon = {
    type: 'Polygon',
    coordinates: [
        [
            [-115.15, 36.16],
            [-115.13, 36.16],
            [-115.13, 36.18],
            [-115.15, 36.16],
        ],
    ],
};
const categories = (count: number): POICategory[] => poiCategories.slice(0, count);
const poi = (id: string) => ({ id }) as SearchFeature;
const respondWith = (...features: SearchFeature[]) =>
    ({ type: 'FeatureCollection', features }) as unknown as DiscoverPlacesResponse;
const requestedCategories = (): POICategory[][] =>
    discoverPlacesMock.mock.calls.map(([request]) => request.filters?.poiCategories ?? []);

describe('searchInGeometry', () => {
    beforeEach(() => {
        discoverPlacesMock.mockReset();
        discoverPlacesMock.mockResolvedValue(respondWith());
    });

    it('sends up to the category limit in a single request', async () => {
        await searchInGeometry(area, { poiCategories: categories(MAX_CATEGORY_CODES) });
        expect(requestedCategories()).toEqual([categories(MAX_CATEGORY_CODES)]);
    });

    it('splits a longer category list into batches within the limit', async () => {
        const codes = categories(19);
        await searchInGeometry(area, { poiCategories: codes });
        expect(requestedCategories()).toEqual([codes.slice(0, 10), codes.slice(10)]);
    });

    it('merges the batches, dropping a POI returned twice', async () => {
        discoverPlacesMock
            .mockResolvedValueOnce(respondWith(poi('a'), poi('b')))
            .mockResolvedValueOnce(respondWith(poi('b'), poi('c')));
        const { features } = await searchInGeometry(area, { poiCategories: categories(12) });
        expect(features.map((feature) => feature.id)).toEqual(['a', 'b', 'c']);
    });

    it('keeps every batch when one fills the limit, and marks the result capped', async () => {
        discoverPlacesMock
            .mockResolvedValueOnce(respondWith(poi('a'), poi('b')))
            .mockResolvedValueOnce(respondWith(poi('c')));
        const { features, capped } = await searchInGeometry(area, { poiCategories: categories(12), limit: 2 });
        expect(features.map((feature) => feature.id)).toEqual(['a', 'b', 'c']);
        expect(capped).toBe(true);
    });

    it('is not capped when every batch comes back under the limit', async () => {
        discoverPlacesMock.mockResolvedValueOnce(respondWith(poi('a'))).mockResolvedValueOnce(respondWith(poi('b')));
        const { features, capped } = await searchInGeometry(area, { poiCategories: categories(12), limit: 2 });
        expect(features).toHaveLength(2);
        expect(capped).toBe(false);
    });

    it('rejects when a batch fails, rather than reading as no places', async () => {
        discoverPlacesMock.mockResolvedValueOnce(respondWith(poi('a'))).mockRejectedValueOnce(new Error('400'));
        await expect(searchInGeometry(area, { poiCategories: categories(12) })).rejects.toThrow('400');
    });

    it('asks for POI time zones only when the caller does', async () => {
        await searchInGeometry(area, { poiCategories: categories(12), timeZone: 'iana' });
        await searchInGeometry(area, { query: 'gym' });
        expect(discoverPlacesMock.mock.calls.map(([request]) => request.timeZone)).toEqual(['iana', 'iana', undefined]);
    });

    it('falls back to a free-text search when no category resolved', async () => {
        await searchInGeometry(area, { poiCategories: [], query: 'gym' });
        expect(discoverPlacesMock).toHaveBeenCalledOnce();
        expect(discoverPlacesMock.mock.calls[0]?.[0]).toMatchObject({ query: 'gym' });
    });
});
