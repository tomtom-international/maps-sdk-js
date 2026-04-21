import type { POICategory } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { mapDisplayPoiCategoryMappings, toBaseMapPOICategory, toBaseMapPOIGroup } from '../util/poiCategoryMapping';

describe('toBaseMapPOICategory', () => {
    test('maps a direct-mapping category', () => {
        expect(toBaseMapPOICategory('RESTAURANT')).toBe('restaurant');
        expect(toBaseMapPOICategory('PARKING_GARAGE')).toBe('parking_facility');
        expect(toBaseMapPOICategory('ELECTRIC_VEHICLE_STATION')).toBe('charging_location');
    });

    test('maps an extended subtype category (via completeMapDisplayPoiCategoryMappings)', () => {
        // Cuisine-specific restaurants all collapse to the `restaurant` base-map category.
        expect(toBaseMapPOICategory('ITALIAN_RESTAURANT')).toBe('restaurant');
        expect(toBaseMapPOICategory('SUSHI_RESTAURANT')).toBe('restaurant');
        // Subway/streetcar stops collapse under `public_transport_stop`.
        expect(toBaseMapPOICategory('SUBWAY_STATION')).toBe('public_transport_stop');
        // Hotel subtypes collapse under `hotel_or_motel`.
        expect(toBaseMapPOICategory('HOSTEL')).toBe('hotel_or_motel');
    });

    test('collapses multiple source categories to a single base-map value (many-to-one)', () => {
        // Both airport-adjacent codes map to the same output.
        expect(toBaseMapPOICategory('AIRPORT')).toBe('airport');
        expect(toBaseMapPOICategory('PUBLIC_AIRPORT')).toBe('airport');
        expect(toBaseMapPOICategory('PRIVATE_AIRPORT')).toBe('airport');
        // Parking variants share a single facility group.
        expect(toBaseMapPOICategory('OPEN_PARKING_AREA')).toBe('parking_facility');
        expect(toBaseMapPOICategory('OPEN_CAR_PARKING_AREA')).toBe('parking_facility');
        expect(toBaseMapPOICategory('PARKING_GARAGE')).toBe('parking_facility');
    });

    test('returns undefined for categories without any mapping', () => {
        // `BOAT_FERRY` is a real POICategory but is not listed in either mapping table.
        expect(toBaseMapPOICategory('BOAT_FERRY' as POICategory)).toBeUndefined();
        // Totally synthetic category string should also not resolve.
        expect(toBaseMapPOICategory('NOT_A_REAL_CATEGORY' as POICategory)).toBeUndefined();
    });
});

describe('toBaseMapPOIGroup', () => {
    test('resolves a category through the base-map category into a style group', () => {
        expect(toBaseMapPOIGroup('RESTAURANT')).toBe('eat_and_drink');
        expect(toBaseMapPOIGroup('HOTEL_MOTEL')).toBe('lodging');
        expect(toBaseMapPOIGroup('ELECTRIC_VEHICLE_STATION')).toBe('driving');
        expect(toBaseMapPOIGroup('PARKING_GARAGE')).toBe('parking');
        expect(toBaseMapPOIGroup('HOSPITAL')).toBe('healthcare');
        expect(toBaseMapPOIGroup('MUSEUM')).toBe('cultural');
    });

    test('resolves extended subtype categories consistently with their base-map category', () => {
        // Subtypes should end up in the same group as their parent base-map category.
        expect(toBaseMapPOIGroup('ITALIAN_RESTAURANT')).toBe('eat_and_drink');
        expect(toBaseMapPOIGroup('HOSTEL')).toBe('lodging');
        expect(toBaseMapPOIGroup('SUBWAY_STATION')).toBe('transport');
    });

    test('returns undefined when the source category has no base-map mapping', () => {
        expect(toBaseMapPOIGroup('BOAT_FERRY' as POICategory)).toBeUndefined();
    });
});

describe('mapDisplayPoiCategoryMappings table', () => {
    test('every entry value is a non-empty string', () => {
        for (const [key, value] of Object.entries(mapDisplayPoiCategoryMappings)) {
            expect(typeof value).toBe('string');
            expect(value.length).toBeGreaterThan(0);
            // Keys are POICategory enum names — they should all be SCREAMING_SNAKE_CASE.
            expect(key).toMatch(/^[A-Z0-9_]+$/);
        }
    });

    test('every base-map category value resolves to a group through toBaseMapPOIGroup', () => {
        // Round-trip guard: if we add a new entry whose value is not in
        // `baseMapCategoryToGroup`, this will flag it so we don't silently lose styling.
        for (const sourceCategory of Object.keys(mapDisplayPoiCategoryMappings) as POICategory[]) {
            const group = toBaseMapPOIGroup(sourceCategory);
            expect(group).toBeTruthy();
        }
    });
});
