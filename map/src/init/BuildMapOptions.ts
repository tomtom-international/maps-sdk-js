import { MapOptions } from "maplibre-gl";
import { GOSDKMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapStyleInput } from "./MapStyleInputBuilder";

/**
 * @ignore
 * @param mapLibreOptions
 * @param goSDKParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams): MapOptions => {
    return {
        ...mapLibreOptions,
        style: buildMapStyleInput(goSDKParams),
        attributionControl: false
    };
};
