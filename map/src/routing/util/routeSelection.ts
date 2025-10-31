import type { Routes } from '@tomtom-org/maps-sdk/core';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeoJSONSourceWithLayers } from '../../shared';
import type { DisplayRouteProps, DisplayRouteRelatedProps } from '../types/displayRoutes';

/**
 * Rebuilds route-related display features such as sections or instructions, with the updated route selection based on the given routes.
 * @ignore
 */
export const rebuildFeaturesWithRouteSelection = <T extends FeatureCollection<Geometry, DisplayRouteRelatedProps>>(
    routes: Routes<DisplayRouteProps>,
    featureCollection: T,
): T => ({
    ...featureCollection,
    features: featureCollection.features.map((features) => ({
        ...features,
        properties: {
            ...features.properties,
            routeState: routes.features[features.properties.routeIndex || 0].properties.routeState,
        },
    })),
});

/**
 * @ignore
 */
export const showFeaturesWithRouteSelection = <T extends FeatureCollection<Geometry, DisplayRouteRelatedProps>>(
    routesWithSelection: Routes<DisplayRouteProps>,
    sourceWithLayers: GeoJSONSourceWithLayers<T>,
): void =>
    sourceWithLayers.show(rebuildFeaturesWithRouteSelection(routesWithSelection, sourceWithLayers.shownFeatures));
