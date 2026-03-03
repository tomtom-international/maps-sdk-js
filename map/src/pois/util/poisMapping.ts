import type { Point } from 'geojson';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { POIsModuleFeature } from '../types/poisModuleFeature';

/**
 * @ignore
 */
export const poisMapping = (feature: MapGeoJSONFeature): POIsModuleFeature => {
    const { properties } = feature;
    return {
        id: feature.id,
        type: feature.type,
        geometry: feature.geometry as Point,
        properties: {
            id: String(properties?.id),
            name: properties?.name,
            category: properties?.category,
            group: properties?.group,
            priority: properties?.priority,
        },
    };
};
