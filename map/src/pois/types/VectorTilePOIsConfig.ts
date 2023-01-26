import { VectorTileMapModuleConfig } from "../../core";
import { POIClassification } from "../../places";
import { POIClassificationGroup } from "../poiClassificationGroups";

export type FilteredPOICategories = (POIClassification | POIClassificationGroup)[];

export type POICategoriesFilterMode = "only" | "all_except";

export type CategoriesFilter = {
    /**
     * by default all categories are included in the map,
     * use all_except show mode to hide some categories/groups,
     * use only mode to only show some categories/groups and hide everything else
     */
    show: POICategoriesFilterMode;
    values: FilteredPOICategories;
};

export type VectorTilePOIsConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
     */
    interactive?: boolean;
    filters?: {
        categories: CategoriesFilter;
    };
};
