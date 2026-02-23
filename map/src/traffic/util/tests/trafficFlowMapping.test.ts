import { describe, expect, test } from 'vitest';
import { trafficFlowMapping } from '../trafficFlowMapping';

const makeFeature = (properties: Record<string, unknown>, id?: string | number): any => ({
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: [
            [4.9, 52.37],
            [4.91, 52.38],
        ],
    },
    id,
    properties,
    source: 'traffic-flow',
    sourceLayer: 'flow',
    layer: { id: 'traffic-flow-layer', type: 'line', source: 'traffic-flow' },
    state: {},
});

describe('trafficFlowMapping', () => {
    test('maps all tile properties to typed feature properties', () => {
        const result = trafficFlowMapping(
            makeFeature({
                road_category: 'motorway',
                road_subcategory: 'connecting',
                relative_speed: 0.6,
                left_hand_traffic: false,
                road_closure: false,
                absolute_speed: 80,
                part_of_two_way_road: true,
                openlr: 'CwRbWyNG9RpsCQCb/EkbAQ==',
                display_class: 1,
            }),
        );

        expect(result.properties).toEqual({
            roadCategory: 'motorway',
            roadSubcategory: 'connecting',
            relativeSpeed: 0.6,
            leftHandTraffic: false,
            roadClosure: false,
            absoluteSpeed: 80,
            partOfTwoWayRoad: true,
            openlr: 'CwRbWyNG9RpsCQCb/EkbAQ==',
            displayClass: 1,
        });
    });

    test('coerces leftHandTraffic to boolean', () => {
        const base = { road_category: 'motorway', relative_speed: 0.5, road_closure: false };

        expect(trafficFlowMapping(makeFeature({ ...base, left_hand_traffic: true })).properties.leftHandTraffic).toBe(
            true,
        );
        expect(trafficFlowMapping(makeFeature({ ...base, left_hand_traffic: 1 })).properties.leftHandTraffic).toBe(
            true,
        );
        expect(trafficFlowMapping(makeFeature({ ...base, left_hand_traffic: false })).properties.leftHandTraffic).toBe(
            false,
        );
        expect(trafficFlowMapping(makeFeature({ ...base, left_hand_traffic: 0 })).properties.leftHandTraffic).toBe(
            false,
        );
        expect(trafficFlowMapping(makeFeature({ ...base })).properties.leftHandTraffic).toBe(false);
    });

    test('coerces roadClosure to boolean', () => {
        const base = { road_category: 'motorway', relative_speed: 0.5, left_hand_traffic: false };

        expect(trafficFlowMapping(makeFeature({ ...base, road_closure: true })).properties.roadClosure).toBe(true);
        expect(trafficFlowMapping(makeFeature({ ...base, road_closure: 1 })).properties.roadClosure).toBe(true);
        expect(trafficFlowMapping(makeFeature({ ...base, road_closure: false })).properties.roadClosure).toBe(false);
        expect(trafficFlowMapping(makeFeature({ ...base, road_closure: 0 })).properties.roadClosure).toBe(false);
        expect(trafficFlowMapping(makeFeature({ ...base })).properties.roadClosure).toBe(false);
    });

    test('omits optional properties when absent', () => {
        const result = trafficFlowMapping(
            makeFeature({ road_category: 'motorway', relative_speed: 0.5, left_hand_traffic: false }),
        );

        expect(result.properties).not.toHaveProperty('roadSubcategory');
        expect(result.properties).not.toHaveProperty('absoluteSpeed');
        expect(result.properties).not.toHaveProperty('partOfTwoWayRoad');
        expect(result.properties).not.toHaveProperty('openlr');
        expect(result.properties).not.toHaveProperty('displayClass');
    });

    test('preserves non-properties fields from the source feature', () => {
        const result = trafficFlowMapping(makeFeature({ road_category: 'motorway', relative_speed: 0.5 }, 'flow-42'));

        expect(result.geometry).toEqual({
            type: 'LineString',
            coordinates: [
                [4.9, 52.37],
                [4.91, 52.38],
            ],
        });
        expect(result.id).toBe('flow-42');
        expect(result).not.toHaveProperty('properties.road_category');
        expect(result).not.toHaveProperty('properties.relative_speed');
    });
});
