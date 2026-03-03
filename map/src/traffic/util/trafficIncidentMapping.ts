import {
    generateId,
    iconToTrafficIncidentCategory,
    indexedMagnitudes,
    type TrafficIncidentCategory,
} from '@tomtom-org/maps-sdk/core';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { TrafficIncidentsModuleFeature } from '../types/trafficIncidentsFeature';

/**
 * @ignore
 */
export const INCIDENT_TAGS = [
    'icon_category',
    'left_hand_traffic',
    'magnitude_of_delay',
    'road_category',
    'road_subcategory',
    'id',
    'description',
    'delay',
    'part_of_two_way_road',
    'start_time',
    'end_time',
    'probability_of_occurrence',
    'number_of_reports',
    'last_report_time',
    'average_speed_kmph',
    'openlr',
    'time_validity',
    'display_class',
] as const;

/**
 * @ignore
 */
export const incidentToIconCategoryMapping: Record<TrafficIncidentCategory, number> = {
    other: 0,
    accident: 1,
    fog: 2,
    danger: 3,
    rain: 4,
    frost: 5,
    jam: 6,
    'lane-closed': 7,
    'road-closed': 8,
    roadworks: 9,
    wind: 10,
    flooding: 11,
    'animals-on-road': 12,
    'narrow-lanes': 13,
    'broken-down-vehicle': 14,
} as const;

/**
 * @ignore
 */
export const trafficIncidentMapping = (feature: MapGeoJSONFeature): TrafficIncidentsModuleFeature => {
    const { properties } = feature;
    return {
        id: feature.id,
        type: feature.type,
        geometry: feature.geometry,
        properties: {
            id: properties.id ?? generateId(), // generateID is a failsafe but properties.id should always be present in the vector tile data
            description: properties?.description_0 ?? '',
            category: iconToTrafficIncidentCategory(properties?.icon_category_0),
            magnitudeOfDelay: indexedMagnitudes[properties?.magnitude_of_delay],
            roadCategory: properties?.road_category,
            roadSubcategory: properties?.road_subcategory,
            leftHandTraffic: Boolean(properties?.left_hand_traffic),
            ...(properties?.delay && { delayInSeconds: properties.delay }),
            ...(properties?.part_of_two_way_road && { partOfTwoWayRoad: Boolean(properties.part_of_two_way_road) }),
            ...(properties?.start_time && { startTime: new Date(properties.start_time) }),
            ...(properties?.end_time && { endTime: new Date(properties.end_time) }),
            ...(properties?.probability_of_occurrence && {
                probabilityOfOccurrence: properties.probability_of_occurrence,
            }),
            ...(properties?.number_of_reports && { numberOfReports: properties.number_of_reports }),
            ...(properties?.last_report_time && { lastReportTime: new Date(properties.last_report_time) }),
            ...(properties?.average_speed_kmph && { averageSpeedKmph: properties.average_speed_kmph }),
            ...(properties?.openlr && { openlr: properties.openlr }),
            ...(properties?.time_validity && { timeValidity: properties.time_validity }),
            ...(properties?.display_class && { displayClass: properties.display_class }),
            ...(properties?.point_type && { pointType: properties.point_type }),
        },
    };
};
