import { ValuesFilter, VectorTileMapModuleConfig } from "../../core";
import { POIClassification } from "../../places";
import { POIClassificationGroup } from "../poiClassificationGroups";

/**
 * A POI classification or group which can be filtered.
 */
export type FilterablePOICategory = POIClassification | POIClassificationGroup;

export type VectorTilePOIsConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
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
