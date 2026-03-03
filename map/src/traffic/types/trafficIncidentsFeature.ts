import type { TrafficIncidentBaseProperties, TrafficIncidentTimeValidity } from '@tomtom-org/maps-sdk/core';
import type { Feature, Geometry } from 'geojson';
import type { RoadCategory, RoadSubCategory } from './trafficCommonConfig';

/**
 * Defines the structure of a traffic incident feature, which extends the basic GeoJSON feature with specific properties related to traffic incidents. This type is used to represent individual traffic incidents on the map, providing details such as the description of the incident, its severity, and the road category where it is occurring.
 */
export type TrafficIncidentsModuleFeature = Feature<
    Geometry,
    TrafficIncidentBaseProperties & {
        /**
         * Description of the traffic incident, providing details about the nature of the incident.
         */
        description: string;

        /**
         * Road hierarchy category type.
         */
        roadCategory: RoadCategory;

        /**
         * Road hierarchy subcategory type, providing more specific classification of the road where the incident is occurring.
         */
        roadSubcategory: RoadSubCategory;

        /**
         * Indicates whether the traffic incident is occurring in a left-hand traffic region.
         */
        leftHandTraffic: boolean;

        /**
         * Indicates whether the incident covers different directional geometries (i.e. both directions of a two-way road).
         */
        partOfTwoWayRoad?: boolean;

        /**
         * Average speed within the incident area, in km/h.
         */
        averageSpeedKmph?: number;

        /**
         * OpenLR code describing the location of the incident.
         */
        openlr?: string;

        /**
         * Whether the incident is currently active or expected in the future.
         */
        timeValidity?: TrafficIncidentTimeValidity;

        /**
         * Positive integer ranking the importance of the road where the incident occurs.
         */
        displayClass?: number;
    }
>;
