import { BaseMapLayerGroupName, BaseMapLayerGroups } from "./types/baseMapModuleConfig";
import { LayerSpecification } from "maplibre-gl";
import { LayerSpecFilter } from "../shared";

type LayerGroupMapping = {
    layerIDMatches: string[];
    layerTypes: (
        | "symbol"
        | "fill"
        | "line"
        | "circle"
        | "fill-extrusion"
        | "heatmap"
        | "raster"
        | "hillshade"
        | "background"
    )[];
};

const layerGroupMappings: Record<BaseMapLayerGroupName, LayerGroupMapping> = {
    land: {
        layerIDMatches: ["lulc"],
        layerTypes: ["fill"]
    },
    borders: {
        layerIDMatches: ["borders"],
        layerTypes: ["line"]
    },
    water: {
        layerIDMatches: ["water"],
        layerTypes: ["fill", "line"]
    },
    buildings2D: {
        layerIDMatches: ["building"],
        layerTypes: ["fill", "line"]
    },
    buildings3D: {
        layerIDMatches: ["building"],
        layerTypes: ["fill-extrusion"]
    },
    houseNumbers: {
        layerIDMatches: ["house number"],
        layerTypes: ["symbol"]
    },
    roadLines: {
        layerIDMatches: ["road", "tunnel", "bridge", "surface"],
        layerTypes: ["fill", "line"]
    },
    roadLabels: {
        layerIDMatches: ["road", "tunnel", "bridge", "surface"],
        layerTypes: ["symbol"]
    },
    roadShields: {
        layerIDMatches: ["shield"],
        layerTypes: ["symbol"]
    },
    placeLabels: {
        layerIDMatches: ["places"],
        layerTypes: ["symbol"]
    },
    smallerTownLabels: {
        layerIDMatches: ["town", "village", "neighbourhood"],
        layerTypes: ["symbol"]
    },
    cityLabels: {
        layerIDMatches: ["city", "capital"],
        layerTypes: ["symbol"]
    },
    capitalLabels: {
        layerIDMatches: ["capital"],
        layerTypes: ["symbol"]
    },
    stateLabels: {
        layerIDMatches: ["state"],
        layerTypes: ["symbol"]
    },
    countryLabels: {
        layerIDMatches: ["places - country"],
        layerTypes: ["symbol"]
    }
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
export const buildLayerGroupFilter = (layerGroups?: BaseMapLayerGroups): LayerSpecFilter | undefined => {
    const mode = layerGroups?.mode;
    const groups = layerGroups?.names;
    if (mode && groups?.length) {
        if (mode == "include") {
            return (layer) => groups.some((group) => isMatching(group, layer));
        } else if (mode == "exclude") {
            return (layer) => !groups.some((group) => isMatching(group, layer));
        }
    }
    return undefined;
};

/**
 * @ignore
 */
export const filterLayerByGroups = (layer: LayerSpecification, layerGroups?: BaseMapLayerGroups): boolean => {
    const mode = layerGroups?.mode;
    const groups = layerGroups?.names;
    if (mode && groups?.length) {
        if (mode == "include") {
            return groups.some((group) => isMatching(group, layer));
        } else if (mode == "exclude") {
            return !groups.some((group) => isMatching(group, layer));
        }
    }
    return true;
};
