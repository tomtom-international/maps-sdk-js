import { poiCategoriesToID } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { mapPOICategoriesToIDs } from '../request/requestBuildingUtils';

describe('mapPOICategoriesToIDs', () => {
    test('exact POICategory name maps to correct ID', () => {
        expect(mapPOICategoriesToIDs(['ITALIAN_RESTAURANT'])).toStrictEqual([poiCategoriesToID['ITALIAN_RESTAURANT']]);
    });

    test('multiple inputs produce IDs for all resolved categories', () => {
        const ids = mapPOICategoriesToIDs(['ITALIAN_RESTAURANT', 'ELECTRIC_VEHICLE_STATION']);
        expect(ids).toContain(poiCategoriesToID['ITALIAN_RESTAURANT']);
        expect(ids).toContain(poiCategoriesToID['ELECTRIC_VEHICLE_STATION']);
    });

    test('empty array returns empty array', () => {
        expect(mapPOICategoriesToIDs([])).toStrictEqual([]);
    });

    test('duplicate inputs produce duplicate IDs', () => {
        const ids = mapPOICategoriesToIDs(['ITALIAN_RESTAURANT', 'ITALIAN_RESTAURANT']);
        expect(ids).toStrictEqual([poiCategoriesToID['ITALIAN_RESTAURANT'], poiCategoriesToID['ITALIAN_RESTAURANT']]);
    });
});
