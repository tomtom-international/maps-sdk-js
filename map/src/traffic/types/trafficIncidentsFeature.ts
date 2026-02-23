import type { DelayMagnitude, TrafficIncidentCategory } from '@tomtom-org/maps-sdk/core';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { RoadCategory, RoadSubCategory } from './trafficCommonConfig';

/**
 * Likelihood of a traffic incident occurring.
 *
 * @group Traffic
 */
export type ProbabilityOfOccurrence = 'certain' | 'probable' | 'risk_of' | 'improbable';

/**
 * Whether the incident is currently active or expected in the future.
 *
 * @group Traffic
 */
export type TimeValidity = 'present' | 'future';

/**
 * Defines the structure of a traffic incident feature, which extends the basic GeoJSON feature with specific properties related to traffic incidents. This type is used to represent individual traffic incidents on the map, providing details such as the description of the incident, its severity, and the road category where it is occurring.
 */
export type TrafficIncidentsModuleFeature = Omit<MapGeoJSONFeature, 'properties'> & {
    /**
     * Properties specific to traffic incidents, extracted from the vector tile data.
     *
     * @remarks
     * These properties include a unique identifier for the incident, a description of the incident, its category, the magnitude of any resulting delay, and information about the road where the incident is occurring (including road category and subcategory). Additionally, it indicates whether the incident is in a left-hand traffic region.
     */
    properties: {
        /**
         * Unique identifier for the traffic incident, common across Traffic API services.
         */
        id: string;

        /**
         * Description of the traffic incident, providing details about the nature of the incident.
         */
        description: string;

        /**
         * Category of the traffic incident, classifying the type of incident (e.g., accident, roadworks, congestion) based on predefined categories.
         */
        category: TrafficIncidentCategory;

        /**
         * Severity of the delay.
         */
        magnitudeOfDelay: DelayMagnitude;

        /**
         * The delay caused by the incident in seconds (except in road closures). It is calculated against free-flow travel time (the travel time when the traffic is minimal, e.g., night traffic).
         */
        delayInSeconds?: number;

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
         * The date and time when the incident started.
         */
        startTime?: Date;

        /**
         * The estimated date and time when the incident will end.
         */
        endTime?: Date;

        /**
         * Likelihood assessment of the incident occurring.
         */
        probabilityOfOccurrence?: ProbabilityOfOccurrence;

        /**
         * Number of user reports for the incident.
         */
        numberOfReports?: number;

        /**
         * The date and time of the most recent user report for the incident.
         */
        lastReportTime?: Date;

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
        timeValidity?: TimeValidity;

        /**
         * Positive integer ranking the importance of the road where the incident occurs.
         */
        displayClass?: number;
    };
};
