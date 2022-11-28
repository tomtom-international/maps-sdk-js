import { MapOptions } from "maplibre-gl";
import { getLngLatArray } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapStyleInput } from "./MapStyleInputBuilder";

/**
 * @ignore
 * @param mapLibreOptions
 * @param goSDKParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams): MapOptions => {
    const center = goSDKParams.center && (getLngLatArray(goSDKParams.center) as [number, number]);

    return {
        ...mapLibreOptions,
        style: buildMapStyleInput(goSDKParams),
        ...(center && { center }),
        attributionControl: false
    };
};
