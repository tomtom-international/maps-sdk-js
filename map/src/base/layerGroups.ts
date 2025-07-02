import type { BaseMapLayerGroupName, BaseMapLayerGroups } from './types/baseMapModuleConfig';
import type { LayerSpecification } from 'maplibre-gl';
import type { LayerSpecFilter } from '../shared';
import { poiLayerIDs } from '../pois';

type LayerGroupMapping = {
    layerIDMatches: string[];
    layerTypes: LayerSpecification['type'][];
};

const layerGroupMappings: Record<BaseMapLayerGroupName, LayerGroupMapping> = {
    land: {
        layerIDMatches: ['lulc'],
        layerTypes: ['fill'],
    },
    borders: {
        layerIDMatches: ['borders'],
        layerTypes: ['line'],
    },
    water: {
        layerIDMatches: ['water'],
        layerTypes: ['fill', 'line'],
    },
    buildings2D: {
        layerIDMatches: ['building'],
        layerTypes: ['fill', 'line'],
    },
    buildings3D: {
        layerIDMatches: ['building'],
        layerTypes: ['fill-extrusion'],
    },
    houseNumbers: {
        layerIDMatches: ['house number'],
        layerTypes: ['symbol'],
    },
    roadLines: {
        layerIDMatches: ['road', 'tunnel', 'bridge', 'surface'],
        layerTypes: ['fill', 'line'],
    },
    roadLabels: {
        layerIDMatches: ['road', 'tunnel', 'bridge', 'surface'],
        layerTypes: ['symbol'],
    },
    roadShields: {
        layerIDMatches: ['shield'],
        layerTypes: ['symbol'],
    },
    placeLabels: {
        layerIDMatches: ['places'],
        layerTypes: ['symbol'],
    },
    smallerTownLabels: {
        layerIDMatches: ['town', 'village', 'neighbourhood'],
        layerTypes: ['symbol'],
    },
    cityLabels: {
        layerIDMatches: ['city', 'capital'],
        layerTypes: ['symbol'],
    },
    capitalLabels: {
        layerIDMatches: ['capital'],
        layerTypes: ['symbol'],
    },
    stateLabels: {
        layerIDMatches: ['state'],
        layerTypes: ['symbol'],
    },
    countryLabels: {
        layerIDMatches: ['places - country'],
        layerTypes: ['symbol'],
    },
};

const isMatching = (group: BaseMapLayerGroupName, layer: LayerSpecification) => {
    const mapping = layerGroupMappings[group];
    return (
        mapping.layerIDMatches.some((part) => layer.id.toLowerCase().includes(part)) &&
        mapping.layerTypes.includes(layer.type)
    );
};

/**
 * @ignore
 */
export const buildLayerGroupFilter = (layerGroups: BaseMapLayerGroups): LayerSpecFilter => {
    const mode = layerGroups.mode;
    const groups = layerGroups.names;
    if (mode === 'include') {
        return (layer) => groups.some((group) => isMatching(group, layer));
    }
    if (mode === 'exclude') {
        return (layer) => !groups.some((group) => isMatching(group, layer));
    }
    // No filtering if we don't recognize the mode:
    console.error('Unrecognized layer group mode:', mode);
    return () => true;
};

/**
 * @ignore
 */
export const filterLayerByGroups = (layer: LayerSpecification, layerGroups?: BaseMapLayerGroups): boolean => {
    const mode = layerGroups?.mode;
    const groups = layerGroups?.names;
    if (mode && groups?.length) {
        if (mode === 'include') {
            return groups.some((group) => isMatching(group, layer));
        }
        if (mode === 'exclude') {
            return !groups.some((group) => isMatching(group, layer));
        }
    }
    return true;
};

/**
 * @ignore
 */
export const buildBaseMapLayerGroupFilter =
    (layerGroupsFilter?: BaseMapLayerGroups): LayerSpecFilter =>
    (layer: LayerSpecification): boolean =>
        (!layerGroupsFilter || filterLayerByGroups(layer, layerGroupsFilter)) && !poiLayerIDs.includes(layer.id);
