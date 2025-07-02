import type { StyleModuleConfig } from '../../shared';

export const baseMapLayerGroupNames = [
    'land',
    'water',
    'borders',
    'buildings2D',
    'buildings3D',
    'houseNumbers',
    'roadLines',
    'roadLabels',
    'roadShields',
    'placeLabels',
    'smallerTownLabels',
    'cityLabels',
    'capitalLabels',
    'stateLabels',
    'countryLabels',
] as const;

/**
 * Name of a base map layer group
 */
export type BaseMapLayerGroupName = (typeof baseMapLayerGroupNames)[number];

export type BaseMapLayerGroupsVisibility = BaseMapLayerGroups & { visible: boolean };

/**
 * Layer groups to include for a base map configuration rule.
 * * They can be expressed as explicit inclusions or exclusions (all layers minus the ones specified).
 */
export type BaseMapLayerGroups = {
    /**
     * Whether the groups are to be:
     * * included: only the specified groups are considered
     * * excluded: all the base map groups except the specified ones are considered
     */
    mode: 'include' | 'exclude';
    /**
     * The names for the groups to be included or excluded.
     */
    names: BaseMapLayerGroupName[];
};

/**
 * Init or runtime configuration for a Base Map module.
 */
export type BaseMapModuleConfig = StyleModuleConfig & {
    /**
     * Optional visibility for layer groups for this base map module.
     * * The layer groups expressed here should be all included in this base map module (not excluded by layerGroupsFilter).
     */
    layerGroupsVisibility?: BaseMapLayerGroupsVisibility;
};

/**
 * Init configuration for a Base Map module.
 */
export type BaseMapModuleInitConfig = BaseMapModuleConfig & {
    /**
     * Optional layer groups with which to initialize the base map module.
     */
    layerGroupsFilter?: BaseMapLayerGroups;
};
