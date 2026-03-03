import type { LineString } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { TrafficFlowModuleFeature } from '../types/trafficFlowFeature';

/**
 * @ignore
 */
export const FLOW_TAGS = [
    'road_category',
    'road_subcategory',
    'relative_speed',
    'left_hand_traffic',
    'road_closure',
    'absolute_speed',
    'part_of_two_way_road',
    'openlr',
    'display_class',
] as const;

/**
 * @ignore
 */
export const trafficFlowMapping = (feature: MapGeoJSONFeature): TrafficFlowModuleFeature => {
    const { properties } = feature;
    return {
        id: feature.id,
        type: feature.type,
        geometry: feature.geometry as LineString,
        properties: {
            roadCategory: properties?.road_category,
            leftHandTraffic: Boolean(properties?.left_hand_traffic),
            roadClosure: Boolean(properties?.road_closure),
            relativeSpeed: properties?.relative_speed,
            ...(properties?.road_subcategory && { roadSubcategory: properties.road_subcategory }),
            ...(properties?.absolute_speed && { absoluteSpeed: properties.absolute_speed }),
            ...(properties?.part_of_two_way_road && { partOfTwoWayRoad: Boolean(properties.part_of_two_way_road) }),
            ...(properties?.openlr && { openlr: properties.openlr }),
            ...(properties?.display_class && { displayClass: properties.display_class }),
        },
    };
};
