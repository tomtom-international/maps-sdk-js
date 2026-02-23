import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { RoadCategory, RoadSubCategory } from './trafficCommonConfig';

/**
 * Defines the structure of a traffic flow feature, which extends the basic GeoJSON feature
 * with properties extracted from the traffic flow vector tiles.
 *
 * @group Traffic Flow
 */
export type TrafficFlowModuleFeature = Omit<MapGeoJSONFeature, 'properties'> & {
    properties: {
        /**
         * Road hierarchy category type.
         */
        roadCategory: RoadCategory;

        /**
         * Road hierarchy subcategory type. Only present for `street` and `service` road categories.
         */
        roadSubcategory?: RoadSubCategory;

        /**
         * Speed relative to free-flow traffic, ranging from 0.00 (standstill) to 1.00 (free flow).
         */
        relativeSpeed: number;

        /**
         * Indicates whether the road segment is in a left-hand traffic region.
         */
        leftHandTraffic: boolean;

        /**
         * Indicates whether the road segment is closed to traffic.
         */
        roadClosure: boolean;

        /**
         * Absolute speed in kilometers per hour.
         */
        absoluteSpeed?: number;

        /**
         * Indicates whether the flow covers different directional geometries (i.e. both directions of a two-way road).
         */
        partOfTwoWayRoad?: boolean;

        /**
         * OpenLR code describing the location of the flow section.
         */
        openlr?: string;

        /**
         * Positive integer ranking the importance of the road segment.
         */
        displayClass?: number;
    };
};
