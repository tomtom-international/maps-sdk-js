import { ValuesFilter, VectorTileMapModuleConfig } from "../../shared";
import { MapStylePOIClassification } from "../../places";
import { POIClassificationGroup } from "../poiClassificationGroups";
import { MapGeoJSONFeature } from "maplibre-gl";
import { Language } from "@anw/go-sdk-js/core";

/**
 * A POI classification or group which can be filtered.
 */
export type FilterablePOICategory = MapStylePOIClassification | POIClassificationGroup;

export type VectorTilePOIsConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default true
     */
    interactive?: boolean;
    filters?: {
        /**
         * By default, all categories are included in the map.
         * * use all_except show mode to hide some categories/groups,
         * * use only mode to only show some categories/groups and hide everything else
         */
        categories: ValuesFilter<FilterablePOICategory>;
    };
};

type PrependName<U> = U extends string ? `name_${U}` : never;

/**
 * Feature names in a language specified in the format "name_\[language\]", where language is one of the supported languages.
 */
type FeatureNamesByLanguage = Partial<Record<PrependName<Language>, string>>;

/**
 * A GeoJSON feature describing a POI vector tile on the map.
 */
export type VectorTilePOIsFeature = Omit<MapGeoJSONFeature, "properties"> & {
    properties: FeatureNamesByLanguage & {
        /**
         * A unique Point of Interest identifier that can be used across other TomTom services.
         */
        id?: string;
        /**
         * A feature name in an NGT (Neutral Ground Truth) language; the native language of each country, respectively.
         */
        name: string;
        /**
         * This property groups Points of Interest into broad categories that can be used for styling purposes.
         */
        category: string;
        /**
         * This property narrows down the category values allowing fine-grained styling and provides a distinction between places in the same category.
         */
        subcategory?: string;
        /**
         * An identifier representing category. Either 4 digits integer for Points of Interest without subcategory or 7
         * digits integer for Points of Interest with subcategory (where the first 4 digits identify a category).
         * It can be used across other TomTom services.
         */
        category_id: number;
        /**
         * The identifier of the icon asset in the TomTom styles that should be used for the visualization purpose of the Point of Interest.
         */
        icon: number;
        /**
         * This property represents a priority of the Point of Interest. The lower the value
         * of this property the more important the Point of Interest is.
         */
        priority: number;
    };
};
