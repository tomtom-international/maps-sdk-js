import { SectionProps, TrafficSectionProps } from "@anw/go-sdk-js/core";
import { FeatureCollection, LineString } from "geojson";

/**
 * GeoJSON feature collection representing route sections of a certain type.
 */
export type RouteSections<S extends SectionProps = SectionProps> = FeatureCollection<LineString, S>;

/**
 * @ignore
 */
export type DisplayTrafficSectionProps = TrafficSectionProps & {
    /**
     * Icon ID for the section leading icon.
     */
    iconID?: string;

    /**
     * Title for the traffic section (by default it consists of the incident delay, if any).
     */
    title?: string;
};
