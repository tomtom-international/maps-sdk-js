import { MapOptions } from "maplibre-gl";
import { MapLibreOptions, TomTomMapParams } from "./types/mapInit";
import { buildMapStyleInput } from "./mapStyleInputBuilder";
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
