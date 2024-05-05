import type { MapOptions } from "maplibre-gl";
import type { MapLibreOptions, TomTomMapParams } from "./types/mapInit";
import { buildStyleInput } from "./styleInputBuilder";
import { injectTomTomHeaders } from "../shared/mapUtils";

/**
 * @ignore
 * @param mapLibreOptions
 * @param tomtomMapParams
 */
export const buildMapOptions = (mapLibreOptions: MapLibreOptions, tomtomMapParams: TomTomMapParams): MapOptions => {
    return {
        // defaults (can be overwritten by given options)
        validateStyle: false,
        maxTileCacheZoomLevels: 22,
        cancelPendingTileRequestsWhileZooming: false,
        // given options:
        ...mapLibreOptions,
        // SDK overrides (won't have any effect via given options):
        style: buildStyleInput(tomtomMapParams),
        attributionControl: { compact: false },
        transformRequest: injectTomTomHeaders(tomtomMapParams)
    };
};
