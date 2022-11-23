import { MapOptions } from "maplibre-gl";
import isEmpty from "lodash/isEmpty";
import { bboxFromGeoJSON, getLngLatArray } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapStyleInput, removeHiddenStyleOptions } from "./MapStyleInputBuilder";

type MapLibreBBox = [number, number, number, number];

/**
 * @ignore
 * @param mapLibreOptions
 * @param goSDKParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams): MapOptions => {
    const center = goSDKParams.center && (getLngLatArray(goSDKParams.center) as [number, number]);
    const mapStyleInput = buildMapStyleInput(goSDKParams);

    return {
        ...mapLibreOptions,
        style: isEmpty(goSDKParams.hide)
            ? mapStyleInput
            : removeHiddenStyleOptions(mapStyleInput as string, goSDKParams.hide),
        ...(center && { center }),
        ...(goSDKParams.bounds && {
            bounds: bboxFromGeoJSON(goSDKParams.bounds) as MapLibreBBox
        }),
        ...(goSDKParams.maxBounds && {
            maxBounds: bboxFromGeoJSON(goSDKParams.maxBounds) as MapLibreBBox
        }),
        attributionControl: false
    };
};
