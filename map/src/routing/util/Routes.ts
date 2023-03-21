import { Routes } from "@anw/maps-sdk-js/core";
import { DisplayRouteProps } from "../types/DisplayRoutes";

/**
 * Builds map display-ready routes, applying default style props.
 * @ignore
 */
export const buildDisplayRoutes = (routes: Routes, selectedIndex = 0): Routes<DisplayRouteProps> => ({
    ...routes,
    features: routes.features.map((route, index) => ({
        ...route,
        properties: {
            ...route.properties,
            routeStyle: index === selectedIndex ? "selected" : "deselected"
        }
    }))
});
