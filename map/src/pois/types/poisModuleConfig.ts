import type { StyleModuleConfig, ValuesFilter } from '../../shared';
import type { MapStylePOICategory } from '../../places';
import type { POICategoryGroup } from '../poiCategoryGroups';
import type { MapGeoJSONFeature } from 'maplibre-gl';

/**
 * A POI classification or group which can be filtered.
 */
export type FilterablePOICategory = MapStylePOICategory | POICategoryGroup;

export type POIsModuleConfig = StyleModuleConfig & {
    filters?: {
        /**
         * By default, all categories are included in the map.
         * * use all_except show mode to hide some categories/groups,
         * * use only mode to only show some categories/groups and hide everything else
         */
        categories: ValuesFilter<FilterablePOICategory>;
    };
};

/**
 * A GeoJSON feature describing a POI vector tile on the map.
 */
export type POIsModuleFeature = Omit<MapGeoJSONFeature, 'properties'> & {
    properties: {
        /**
         * A unique Point of Interest identifier that can be used across other TomTom services.
         */
        id: string;
        /**
         * A feature name in an NGT (Neutral Ground Truth) language; the native language of each country, respectively.
         */
        name: string;
        /**
         * This property groups Points of Interest into categories that can be used for styling purposes.
         */
        category: string;
        /**
         * ID of the image for this POI within the map style's sprite.
         */
        iconID: string;
        /**
         * This property represents the broad group to which this category and other similar ones belong.
         */
        group: string;
        /**
         * This property represents a priority of the Point of Interest. The lower the value
         * of this property the more important the Point of Interest is.
         */
        priority: number;
    };
};
