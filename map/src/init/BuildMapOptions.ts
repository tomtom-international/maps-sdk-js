import { MapOptions } from "maplibre-gl";
import { GOSDKMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapStyleInput } from "./MapStyleInputBuilder";
import { injectCustomHeaders } from "../shared/mapUtils";

/**
 * @ignore
 * @param mapLibreOptions
 * @param goSDKParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams): MapOptions => {
    return {
        ...mapLibreOptions,
        style: buildMapStyleInput(goSDKParams),
        attributionControl: false,
        transformRequest: injectCustomHeaders(goSDKParams)
    };
};
