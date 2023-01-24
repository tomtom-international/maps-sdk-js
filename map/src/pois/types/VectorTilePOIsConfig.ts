import { VectorTileMapModuleConfig } from "../../core";
import { POIClassification } from "../../places";
import { POIClassificationGroup } from "../poiClassificationGroups";

export type FilteredPOICategories = (POIClassification | POIClassificationGroup)[];

export type POICategoriesFilterMode = "include" | "exclude";

export type CategoriesFilter = {
    /**
     * by default all categories are included in the map,
     * use exclude mode to hide some categories/groups,
     * use include mode to only include some categories/groups and hide everything else
     */
    mode: POICategoriesFilterMode;
    categories: FilteredPOICategories;
};

export type VectorTilePOIsConfig = VectorTileMapModuleConfig & {
    /**
     * Whether the layers for this module are to be interactive.
     * * The user can interact with the layers from this module.
     * @default false
     */
    interactive?: boolean;
    categoriesFilter?: CategoriesFilter;
};
