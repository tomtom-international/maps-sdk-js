import { MapOptions } from "maplibre-gl";
import { TomTomMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapStyleInput } from "./MapStyleInputBuilder";
import { injectCustomHeaders } from "../shared/mapUtils";

/**
 * @ignore
 * @param mapLibreOptions
 * @param tomtomMapParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, tomtomMapParams: TomTomMapParams): MapOptions => {
    return {
        ...mapLibreOptions,
        style: buildMapStyleInput(tomtomMapParams),
        attributionControl: false,
        transformRequest: injectCustomHeaders(tomtomMapParams)
    };
};
