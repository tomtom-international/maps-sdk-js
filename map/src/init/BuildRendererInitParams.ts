import { getLngLatArray } from "@anw/go-sdk-js/core";
import { MapOptions } from "maplibre-gl";
import { MapInitParams } from "../types/MapInit";
import { buildRendererStyle } from "../style/RendererStyleBuilder";

/**
 * @ignore
 * @param sdkParams
 */
export const buildRendererInitParams = (sdkParams: MapInitParams): MapOptions => {
    const centerLngLat = sdkParams.center && (getLngLatArray(sdkParams.center) as [number, number]);
    return {
        container: sdkParams.htmlContainer,
        style: buildRendererStyle(sdkParams),
        ...(centerLngLat && { center: centerLngLat }),
        ...(sdkParams.zoom && { zoom: sdkParams.zoom }),
        ...(sdkParams.maxZoom && { maxZoom: sdkParams.maxZoom }),
        ...(sdkParams.minZoom && { minZoom: sdkParams.minZoom }),
        ...(sdkParams.maxBounds && {
            maxBounds: sdkParams.maxBounds as [number, number, number, number]
        }),
        ...(sdkParams.bearingDegrees && { bearing: sdkParams.bearingDegrees }),
        attributionControl: false
    };
};
