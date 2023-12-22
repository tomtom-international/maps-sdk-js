import { FeatureCollection, Geometry } from "geojson";
import { DisplayRouteProps, DisplayRouteRelatedProps } from "../types/displayRoutes";
import { Routes } from "@anw/maps-sdk-js/core";
import { GeoJSONSourceWithLayers } from "../../shared";

/**
 * Rebuilds route-related display features such as sections or instructions, with the updated route selection based on the given routes.
 * @ignore
 */
export const rebuildFeaturesWithRouteSelection = <T extends FeatureCollection<Geometry, DisplayRouteRelatedProps>>(
    routes: Routes<DisplayRouteProps>,
    featureCollection: T
): T => ({
    ...featureCollection,
    features: featureCollection.features.map((features) => ({
        ...features,
        properties: {
            ...features.properties,
            routeStyle: routes.features[features.properties.routeIndex || 0].properties.routeStyle
        }
    }))
});

/**
 * @ignore
 */
export const showFeaturesWithRouteSelection = <T extends FeatureCollection<Geometry, DisplayRouteRelatedProps>>(
    routesWithSelection: Routes<DisplayRouteProps>,
    sourceWithLayers: GeoJSONSourceWithLayers<T>
): void =>
    sourceWithLayers.show(rebuildFeaturesWithRouteSelection(routesWithSelection, sourceWithLayers.shownFeatures));
