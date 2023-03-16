import { RouteProps } from "@anw/go-sdk-js/core";
import { SupportsEvents } from "../../shared";

export type RouteStyleProps = {
    routeStyle: "selected" | "deselected";
};

export type DisplayRouteProps = RouteProps & RouteStyleProps & SupportsEvents;
