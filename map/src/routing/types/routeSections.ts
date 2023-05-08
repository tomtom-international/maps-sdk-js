import { SectionProps, TrafficSectionProps } from "@anw/maps-sdk-js/core";
import { Feature, FeatureCollection, LineString } from "geojson";
import { RouteStyleProps } from "./displayRoutes";

export type DisplaySectionProps = SectionProps & RouteStyleProps & { routeIndex?: number };

/**
 * GeoJSON feature representing a route section of a certain type.
 */
export type RouteSection<S extends DisplaySectionProps = DisplaySectionProps> = Feature<LineString, S>;

/**
 * GeoJSON feature collection representing route sections of a certain type.
 */
export type RouteSections<S extends DisplaySectionProps = DisplaySectionProps> = FeatureCollection<LineString, S>;

/**
 * @ignore
 */
export type DisplayTrafficSectionProps = DisplaySectionProps &
    TrafficSectionProps & {
        /**
         * Icon ID for the section leading icon.
         */
        iconID?: string;

        /**
         * Title for the traffic section (by default it consists of the incident delay, if any).
         */
        title?: string;
    };
