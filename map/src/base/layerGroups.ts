import { BaseMapLayerGroupName } from "./types/baseMapModuleConfig";
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
        layerIDMatches: ["landuse -", "landcover"],
        layerTypes: ["fill", "line"]
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

/**
 * @ignore
 */
export const getLayerGroupFilter = (names?: BaseMapLayerGroupName[]): LayerSpecFilter | undefined =>
    names?.length
        ? (layer: LayerSpecification) => {
              const id = layer.id.toLowerCase();
              return names.some((name) => {
                  const mapping = layerGroupMappings[name];
                  return (
                      mapping.layerIDMatches.some((part) => id.includes(part)) &&
                      mapping.layerTypes.includes(layer.type)
                  );
              });
          }
        : undefined;
