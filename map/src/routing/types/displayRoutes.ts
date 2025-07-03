import type { DelayMagnitude, RouteProps } from '@anw/maps-sdk-js/core';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { SupportsEvents } from '../../shared';

/**
 * Specific props relating to a displayed route.
 */
export type RouteStyleProps = {
    /**
     * Style of the route.
     */
    routeStyle: 'selected' | 'deselected';
};

export type DisplayRouteRelatedProps = RouteStyleProps & { routeIndex: number };

/**
 * Display summary props for a route.
 */
export type DisplayRouteSummaryProps = DisplayRouteRelatedProps & {
    /**
     * Formatted distance of the route in the chosen units.
     */
    formattedDistance?: string;
    /**
     * Formatted duration of the route.
     */
    formattedDuration?: string;
    /**
     * Formatted traffic delay of the route.
     */
    formattedTraffic?: string;
    /**
     * Overall delay magnitude for the route.
     */
    magnitudeOfDelay?: DelayMagnitude;
};

/**
 * Display props focused on route lines.
 */
export type DisplayRouteProps = RouteProps & RouteStyleProps & SupportsEvents;

/**
 * GeoJSON feature of a point with display-ready route summary props, focused on a summary bubble.
 */
export type DisplayRouteSummary = Feature<Point, DisplayRouteSummaryProps>;

/**
 * GeoJSON feature collection of points with display-ready route summary props, focused on summary bubbles.
 */
export type DisplayRouteSummaries = FeatureCollection<Point, DisplayRouteSummaryProps>;
