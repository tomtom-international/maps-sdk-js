import { MapOptions } from "maplibre-gl";
import { MapLibreOptions, TomTomMapParams } from "./types/mapInit";
import { buildStyleInput } from "./styleInputBuilder";
import { injectTomTomHeaders } from "../shared/mapUtils";

/**
 * @ignore
 * @param mapLibreOptions
 * @param tomtomMapParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, tomtomMapParams: TomTomMapParams): MapOptions => {
    return {
        ...mapLibreOptions,
        style: buildStyleInput(tomtomMapParams),
        attributionControl: false,
        validateStyle: false,
        maxTileCacheZoomLevels: 22,
        transformRequest: injectTomTomHeaders(tomtomMapParams)
    };
};
