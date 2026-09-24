import { fullTrafficIncidentCategories, trafficIncidentToIconCategory } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { trafficIncidentMapping } from '../trafficIncidentMapping';

const makeFeature = (properties: Record<string, unknown>, id?: string | number): any => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [4.9, 52.37] },
    id,
    properties,
    source: 'traffic-incidents',
    sourceLayer: 'incidents',
    layer: { id: 'traffic-incidents-layer', type: 'symbol', source: 'traffic-incidents' },
    state: {},
});

describe('trafficIncidentMapping', () => {
    test('maps all tile properties to typed feature properties', () => {
        const result = trafficIncidentMapping(
            makeFeature({
                id: 'inc-123',
                description_0: 'Road closed ahead',
                icon_category_0: 8, // road-closed
                magnitude_of_delay: 4, // indefinite
                road_category: 'motorway',
                road_subcategory: 'connecting',
                left_hand_traffic: false,
            }),
        );

        expect(result.properties).toEqual({
            id: 'inc-123',
            description: 'Road closed ahead',
            category: 'road-closed',
            magnitudeOfDelay: 'indefinite',
            roadCategory: 'motorway',
            roadSubcategory: 'connecting',
            leftHandTraffic: false,
        });
    });

    test('maps all icon category codes to the correct category name', () => {
        fullTrafficIncidentCategories.forEach((category) => {
            const result = trafficIncidentMapping(
                makeFeature({
                    id: 'test',
                    icon_category_0: trafficIncidentToIconCategory(category),
                    magnitude_of_delay: 0,
                }),
            );
            expect(result.properties.category).toBe(category);
        });
    });

    test('maps magnitude codes to delay magnitude names', () => {
        const cases = [
            [0, 'unknown'],
            [1, 'minor'],
            [2, 'moderate'],
            [3, 'major'],
            [4, 'indefinite'],
        ] as const;

        cases.forEach(([code, expected]) => {
            const result = trafficIncidentMapping(
                makeFeature({ id: 'test', icon_category_0: 1, magnitude_of_delay: code }),
            );
            expect(result.properties.magnitudeOfDelay).toBe(expected);
        });
    });

    test('coerces left_hand_traffic to boolean', () => {
        const base = { id: 'test', icon_category_0: 1, magnitude_of_delay: 0 };

        expect(
            trafficIncidentMapping(makeFeature({ ...base, left_hand_traffic: true })).properties.leftHandTraffic,
        ).toBe(true);
        expect(trafficIncidentMapping(makeFeature({ ...base, left_hand_traffic: 1 })).properties.leftHandTraffic).toBe(
            true,
        );
        expect(
            trafficIncidentMapping(makeFeature({ ...base, left_hand_traffic: false })).properties.leftHandTraffic,
        ).toBe(false);
        expect(trafficIncidentMapping(makeFeature({ ...base, left_hand_traffic: 0 })).properties.leftHandTraffic).toBe(
            false,
        );
        expect(trafficIncidentMapping(makeFeature({ ...base })).properties.leftHandTraffic).toBe(false);
    });

    test('falls back to empty string when description_0 is missing', () => {
        const result = trafficIncidentMapping(makeFeature({ id: 'test', icon_category_0: 1, magnitude_of_delay: 0 }));
        expect(result.properties.description).toBe('');
    });

    test('generates an id when properties.id is missing', () => {
        const result = trafficIncidentMapping(makeFeature({ icon_category_0: 1, magnitude_of_delay: 0 }));
        expect(result.properties.id).toBeTruthy();
    });

    test('preserves non-properties fields from the source feature', () => {
        const result = trafficIncidentMapping(makeFeature({ id: 'test', icon_category_0: 1, magnitude_of_delay: 0 }));

        expect(result.geometry).toEqual({ type: 'Point', coordinates: [4.9, 52.37] });
        expect(result).not.toHaveProperty('properties.icon_category_0');
        expect(result).not.toHaveProperty('properties.magnitude_of_delay');
    });
});
