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

export type BaseMapModuleConfig = StyleModuleConfig & {
    /**
     * Optional layer groups with which to initialize the base map module.
     */
    layerGroups?: BaseMapLayerGroupName[];
};
