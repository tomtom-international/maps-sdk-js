import { generateId, Place, Places } from '@tomtom-org/maps-sdk/core';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { PlaceConnectionDisplay, PlacesModuleConfig } from '../types/placesModuleConfig';

/**
 * Properties carried by each connection feature once it is on the map.
 * @ignore
 */
export type ConnectionFeatureProps = {
    id: string;
    fromId?: string;
    toId?: string;
    label: string;
};

/**
 * @ignore
 */
export type ConnectionFeatureCollection = FeatureCollection<LineString, ConnectionFeatureProps>;

// Looks up an endpoint: a full Place is used directly, a string is resolved against
// the module's currently shown places. Unknown ids return `undefined` and the whole
// connection is dropped in `prepareConnectionsForDisplay`.
const resolveEndpoint = (endpoint: Place | string, shownPlaces: Places): Place | undefined => {
    if (typeof endpoint !== 'string') return endpoint;
    return shownPlaces.features.find((p) => p.id === endpoint);
};

/**
 * Turns a list of {@link PlaceConnectionDisplay} into a GeoJSON FeatureCollection of
 * LineStrings, resolving id references against the module's currently shown places and
 * applying the optional label function.
 * @ignore
 */
export const prepareConnectionsForDisplay = (
    connections: PlaceConnectionDisplay[],
    shownPlaces: Places,
    config: PlacesModuleConfig = {},
): ConnectionFeatureCollection => {
    const labelFn = config.connections?.label;
    const features: Feature<LineString, ConnectionFeatureProps>[] = [];

    for (const connection of connections) {
        const from = resolveEndpoint(connection.from, shownPlaces);
        const to = resolveEndpoint(connection.to, shownPlaces);
        if (!from || !to) continue;

        const id = connection.id ?? generateId();
        const label = labelFn ? labelFn(connection) : '';

        features.push({
            type: 'Feature',
            id,
            geometry: {
                type: 'LineString',
                coordinates: [from.geometry.coordinates, to.geometry.coordinates],
            },
            properties: {
                id,
                fromId: typeof connection.from === 'string' ? connection.from : from.id,
                toId: typeof connection.to === 'string' ? connection.to : to.id,
                label,
            },
        });
    }

    return { type: 'FeatureCollection', features };
};
