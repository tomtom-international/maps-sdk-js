import type { MapOptions } from 'maplibre-gl';
import { injectTomTomHeaders } from '../shared/mapUtils';
import { buildStyleInput } from './styleInputBuilder';
import type { InternalTomTomMapParams } from './types/mapInit';

/**
 * @ignore
 * @param tomtomMapParams
 */
export const buildMapOptions = (tomtomMapParams: InternalTomTomMapParams): MapOptions => {
    return {
        // defaults (can be overwritten by given options)
        validateStyle: false,
        maxTileCacheZoomLevels: 22,
        cancelPendingTileRequestsWhileZooming: false,
        // given options:
        ...tomtomMapParams.mapLibre,
        // SDK overrides (won't have any effect via given options):
        style: buildStyleInput(tomtomMapParams),
        attributionControl: { compact: false },
        transformRequest: injectTomTomHeaders(tomtomMapParams),
    };
};
