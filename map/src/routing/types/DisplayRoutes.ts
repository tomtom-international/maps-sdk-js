import { RouteProps } from "@anw/go-sdk-js/core";

export type RouteStyleProps = {
    routeStyle: "selected" | "deselected";
};

export type DisplayRouteProps = RouteProps & RouteStyleProps;
