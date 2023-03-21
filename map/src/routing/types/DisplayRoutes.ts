import { RouteProps } from "@anw/maps-sdk-js/core";
import { SupportsEvents } from "../../shared";

export type RouteStyleProps = {
    routeStyle: "selected" | "deselected";
};

export type DisplayRouteProps = RouteProps & RouteStyleProps & SupportsEvents;
