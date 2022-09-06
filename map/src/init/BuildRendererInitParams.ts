import { getLngLatArray } from "@anw/go-sdk-js/core";
import { MapOptions } from "@nav/web-renderer";
import { MapInitParams } from "../types/MapInit";
import { buildRendererStyle } from "../style/RendererStyleBuilder";

/**
 * @ignore
 * @param sdkParams
 */
export const buildRendererInitParams = (sdkParams: MapInitParams): MapOptions => {
    const centerLngLat = sdkParams.center && getLngLatArray(sdkParams.center);
    return {
        // @deprecated (key):
        key: sdkParams.apiKey as string,
        container: sdkParams.htmlContainer,
        style: buildRendererStyle(sdkParams),
        ...(centerLngLat && { latitude: centerLngLat[1], longitude: centerLngLat[0] }),
        ...(sdkParams.zoom && { zoom: sdkParams.zoom }),
        ...(sdkParams.maxZoom && { maxZoom: sdkParams.maxZoom }),
        ...(sdkParams.minZoom && { minZoom: sdkParams.minZoom }),
        ...(sdkParams.maxBounds && {
            maxBounds: [
                [sdkParams.maxBounds[0], sdkParams.maxBounds[1]],
                [sdkParams.maxBounds[2], sdkParams.maxBounds[3]]
            ]
        }),
        ...(sdkParams.bearingDegrees && { rotation: (sdkParams.bearingDegrees * Math.PI) / 180 }),
        ...(sdkParams.projection && { projection: sdkParams.projection })
    };
};
