import { RouteProps } from "@anw/maps-sdk-js/core";
import { SupportsEvents } from "../../shared";

/**
 * Specific props relating to a displayed route.
 */
export type RouteStyleProps = {
    /**
     * Style of the route.
     */
    routeStyle: "selected" | "deselected";
};

export type DisplayRouteRelatedProps = RouteStyleProps & { routeIndex: number };

export type DisplayRouteProps = RouteProps & RouteStyleProps & SupportsEvents;
