import { StyleModuleConfig } from "../../shared";

export const baseMapLayerGroupNames = [
    "land",
    "water",
    "borders",
    "buildings2D",
    "buildings3D",
    "houseNumbers",
    "roadLines",
    "roadLabels",
    "roadShields",
    "placeLabels",
    "smallerTownLabels",
    "cityLabels",
    "capitalLabels",
    "stateLabels",
    "countryLabels"
] as const;

/**
 * Name of a base map layer group
 */
export type BaseMapLayerGroupName = (typeof baseMapLayerGroupNames)[number];

/**
 * Layer groups for the base map.
 */
export type BaseMapLayerGroups = {
    /**
     * Whether the groups are to be:
     * * included: only the specified groups are considered
     * * excluded: all the base map groups except the specified ones are considered
     */
    mode: "include" | "exclude";
    /**
     * The names for the groups to be included or excluded.
     */
    names: BaseMapLayerGroupName[];
};

/**
 * Configuration for a Base Map module.
 */
export type BaseMapModuleConfig = StyleModuleConfig & {
    /**
     * Optional layer groups with which to initialize the base map module.
     */
    layerGroups?: BaseMapLayerGroups;
};
