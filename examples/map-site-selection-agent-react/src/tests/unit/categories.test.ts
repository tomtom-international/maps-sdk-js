import type { POICategory } from '@tomtom-org/maps-sdk/core';
import { getPOICategories, type POICategoryResult } from '@tomtom-org/maps-sdk/services';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_CATEGORY_CODES } from '../../demographics/households';
import { lookupCategoryCandidates, resolveCategories, resolveCategoriesWithNames } from '../../tools/categories';

vi.mock('@tomtom-org/maps-sdk/services', () => ({ getPOICategories: vi.fn(), discoverPlaces: vi.fn() }));

const category = (
    code: POICategory,
    name: string,
    synonyms: string[] = [],
    childCategoryCodes: POICategory[] = [],
): POICategoryResult => ({ code, name, synonyms, childCategoryCodes });

const cafe = category('CAFE', 'Café', ['Cafe']);
const cafePub = category('CAFE_PUB', 'Café/Pub', [], ['CAFE', 'INTERNET_CAFE']);
const bar = category('BAR', 'Bar');
const carWash = category('CAR_WASH', 'Car Wash', ['Auto Wash', 'Carwash'], ['CAR_WASH']);
// Catalog entries as the POI Categories API returns them, Car Wash listed twice as it is there.
const catalog = [
    cafePub,
    cafe,
    category('INTERNET_CAFE', 'Internet Café'),
    category('TRUCK_STOP', 'Truck Stop', ['Coach & Truck Parking', 'Transport Café']),
    bar,
    carWash,
    category('CAR_WASH', 'Car Wash', ['Auto Wash', 'Carwash']),
    category('CAR_DEALER', 'Car Dealer', ['Car Dealership']),
    category('CREPERIE', 'Crêperie'),
    category('PARKING_GARAGE', 'Parking Garage'),
    category('OPEN_CAR_PARKING_AREA', 'Open Parking Area'),
    category('RESTAURANT', 'Restaurant'),
];

// What the SDK's ranked filter returns first for each term.
const rankedByTerm: Record<string, POICategoryResult[]> = { café: [cafe, cafePub], bar: [bar], 'auto wash': [carWash] };

beforeEach(() => {
    vi.mocked(getPOICategories)
        .mockReset()
        .mockImplementation(async ({ filters } = {}) => ({
            poiCategories: filters ? filters.flatMap((term) => rankedByTerm[term] ?? []) : catalog,
        }));
});

describe('resolveCategoriesWithNames', () => {
    it("resolves terms through the SDK's ranked filter, keeping its order and names", async () => {
        expect(await resolveCategoriesWithNames(['café', 'bar'])).toEqual({
            codes: ['CAFE', 'CAFE_PUB', 'BAR'],
            names: ['Café', 'Café/Pub', 'Bar'],
        });
        expect(getPOICategories).toHaveBeenCalledWith({ filters: ['café', 'bar'] });
    });
});

describe('resolveCategories', () => {
    it('returns every resolved code, past the number one Places request takes', async () => {
        vi.mocked(getPOICategories).mockResolvedValueOnce({ poiCategories: catalog });
        const codes = catalog.map((entry) => entry.code);
        expect(codes.length).toBeGreaterThan(MAX_CATEGORY_CODES);
        expect(await resolveCategories(['anything'])).toEqual(codes);
    });

    it('resolves no terms to no codes, rather than to the whole catalog', async () => {
        expect(await resolveCategories([])).toEqual([]);
        expect(getPOICategories).not.toHaveBeenCalled();
    });

    it('loads the catalog again on the next call after a failed load', async () => {
        vi.mocked(getPOICategories).mockRejectedValueOnce(new Error('503'));

        expect(await resolveCategories(['bar'])).toEqual([]);
        expect(await resolveCategories(['bar'])).toEqual(['BAR']);
    });
});

describe('lookupCategoryCandidates', () => {
    const candidateCodes = async (term: string) =>
        (await lookupCategoryCandidates([term]))[0].candidates.map(({ code }) => code);

    it('lists the ranked matches first, then the categories sharing a word', async () => {
        const codes = await candidateCodes('café');
        expect(codes.slice(0, 2)).toEqual(['CAFE', 'CAFE_PUB']);
        expect(codes).toEqual(expect.arrayContaining(['INTERNET_CAFE', 'TRUCK_STOP']));
    });

    it('lists a code the catalog repeats once', async () => {
        expect(await candidateCodes('auto wash')).toEqual(['CAR_WASH']);
    });

    it('folds accents when comparing words', async () => {
        expect(await candidateCodes('creperie')).toContain('CREPERIE');
    });

    it('lists no candidates when the catalog fails to load', async () => {
        vi.mocked(getPOICategories).mockRejectedValueOnce(new Error('503'));
        expect(await lookupCategoryCandidates(['café'])).toEqual([{ term: 'café', candidates: [] }]);
    });
});
