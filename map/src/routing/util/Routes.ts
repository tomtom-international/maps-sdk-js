import { Routes } from "@anw/go-sdk-js/core";
import { DisplayRouteProps } from "../types/DisplayRoutes";

/**
 * Builds map display-ready routes, applying default style props.
 * @ignore
 */
export const buildDisplayRoutes = (routes: Routes): Routes<DisplayRouteProps> => ({
    ...routes,
    features: routes.features.map((feature, index) => ({
        ...feature,
        properties: {
            ...feature.properties,
            routeStyle: index === 0 ? "selected" : "deselected"
        }
    }))
});
