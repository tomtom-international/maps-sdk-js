import type { CountrySectionProps, DelayMagnitude, RouteProps } from '@tomtom-org/maps-sdk/core';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { SupportsEvents } from '../../shared';

/**
 * Specific props relating to a displayed route's visual style.
 *
 * Controls whether a route appears selected (highlighted) or deselected (dimmed).
 * The SDK manages these styles automatically based on user interaction.
 *
 * @remarks
 * **Style States:**
 * - `selected`: Primary route with full color saturation and emphasis
 * - `deselected`: Alternative routes shown dimmed/grayed out
 *
 * @example
 * ```typescript
 * // Main selected route
 * const selectedStyle: RouteStateProps = {
 *   routeState: 'selected'
 * };
 *
 * // Alternative route
 * const alternativeStyle: RouteStateProps = {
 *   routeState: 'deselected'
 * };
 * ```
 *
 * @group Routing
 */
export type RouteStateProps = {
    /**
     * Visual state-related style of the route.
     *
     * @remarks
     * Determines the state in which the route is rendered on the map:
     * - `selected`: Full color, more prominent (typically the chosen route)
     * - `deselected`: Reduced opacity, less prominent (alternative routes)
     */
    routeState: 'selected' | 'deselected';
};

/**
 * Route properties combined with styling and index information.
 *
 * Associates route data with its position in a multi-route result and its visual state.
 *
 * @remarks
 * Used internally by the routing module to track and style multiple routes.
 * The `routeIndex` corresponds to the route's position in the original routes array.
 *
 * @example
 * ```typescript
 * const routeProps: DisplayRouteRelatedProps = {
 *   routeState: 'selected',
 *   routeIndex: 0  // First route in the array
 * };
 * ```
 *
 * @group Routing
 */
export type DisplayRouteRelatedProps = RouteStateProps & {
    /**
     * Unique identifier for the object to ensure it can be displayed on MapLibre.
     *
     * @remarks
     * This id es expected to become the main feature id by MapLibre via the 'promotedId' property.
     */
    id: string;

    /**
     * Zero-based index of this route in the routes array.
     *
     * @remarks
     * Used to identify which route this data belongs to when displaying
     * multiple alternative routes.
     */
    routeIndex: number;
};

/**
 * Display-ready properties for a route summary bubble.
 *
 * Contains pre-formatted strings for displaying route information in UI elements
 * such as summary cards, tooltips, or info bubbles.
 *
 * @remarks
 * **Use Cases:**
 * - Route comparison cards
 * - Summary bubbles on the map
 * - Route selection UI
 * - Mobile route panels
 *
 * All formatting (units, duration format) is handled by the SDK based on
 * the configured display settings.
 *
 * @example
 * ```typescript
 * const summary: DisplayRouteSummaryProps = {
 *   routeIndex: 0,
 *   routeState: 'selected',
 *   formattedDistance: '15.3 km',
 *   formattedDuration: '22 min',
 *   formattedTraffic: '5 min delay',
 *   magnitudeOfDelay: 'moderate'
 * };
 * ```
 *
 * @group Routing
 */
export type DisplayRouteSummaryProps = DisplayRouteRelatedProps & {
    /**
     * Formatted distance of the route in the chosen units.
     *
     * @remarks
     * Automatically formatted based on the display units configuration:
     * - Metric: "15.3 km" or "500 m"
     * - Imperial: "9.5 mi" or "1,640 ft"
     *
     * @example
     * ```typescript
     * formattedDistance: '15.3 km'
     * formattedDistance: '9.5 mi'
     * ```
     */
    formattedDistance?: string;

    /**
     * Formatted duration of the route.
     *
     * @remarks
     * Human-readable travel time with appropriate units:
     * - Short: "15 min"
     * - Medium: "1 h 30 min"
     * - Long: "2 h 15 min"
     *
     * Includes traffic considerations if traffic data is enabled.
     *
     * @example
     * ```typescript
     * formattedDuration: '22 min'
     * formattedDuration: '1 h 45 min'
     * ```
     */
    formattedDuration?: string;

    /**
     * Formatted traffic delay of the route.
     *
     * @remarks
     * Shows the additional time due to current traffic conditions.
     * Only present when there is a delay and traffic data is available.
     *
     * @example
     * ```typescript
     * formattedTraffic: '5 min delay'
     * formattedTraffic: '15 min delay'
     * formattedTraffic: undefined  // No delay
     * ```
     */
    formattedTraffic?: string;

    /**
     * Overall delay magnitude for the route.
     *
     * @remarks
     * Categorizes the severity of traffic delays:
     * - `minor`: Small delays (typically < 5 minutes)
     * - `moderate`: Noticeable delays (typically 5-15 minutes)
     * - `major`: Significant delays (typically > 15 minutes)
     * - `undefined`: No delay or no traffic data
     *
     * Useful for color-coding or visual indicators in UI.
     *
     * @example
     * ```typescript
     * magnitudeOfDelay: 'moderate'
     * ```
     */
    magnitudeOfDelay?: DelayMagnitude;
};

/**
 * Display props focused on route lines.
 *
 * Combines complete route information with styling and event handling capabilities.
 * Used for rendering the actual route geometry on the map.
 *
 * @remarks
 * This type extends the base route properties with display-specific information
 * needed for rendering and interaction.
 *
 * @example
 * ```typescript
 * const displayRoute: DisplayRouteProps = {
 *   ...routeData,
 *   routeState: 'selected',
 *   eventState: 'hover'
 * };
 * ```
 *
 * @group Routing
 */
export type DisplayRouteProps = RouteProps & RouteStateProps & SupportsEvents;

/**
 * GeoJSON feature of a point with display-ready route summary props.
 *
 * Represents a single route summary bubble on the map, typically shown at the
 * end point or along the route path.
 *
 * @remarks
 * **Use Cases:**
 * - End-point summary bubbles
 * - Midpoint information markers
 * - Interactive route details
 *
 * @example
 * ```typescript
 * const summaryFeature: DisplayRouteSummary = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Point',
 *     coordinates: [4.9, 52.3]
 *   },
 *   properties: {
 *     routeIndex: 0,
 *     routeState: 'selected',
 *     formattedDistance: '15.3 km',
 *     formattedDuration: '22 min'
 *   }
 * };
 * ```
 *
 * @group Routing
 */
export type DisplayRouteSummary = Feature<Point, DisplayRouteSummaryProps>;

/**
 * GeoJSON feature collection of points with display-ready route summary props.
 *
 * Collection of all route summary bubbles for multiple routes, used when displaying
 * route alternatives with summary information.
 *
 * @remarks
 * Typically contains one summary per route, but can include multiple summaries
 * per route for detailed displays.
 *
 * @example
 * ```typescript
 * const summaries: DisplayRouteSummaries = {
 *   type: 'FeatureCollection',
 *   features: [
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Point', coordinates: [4.9, 52.3] },
 *       properties: {
 *         routeIndex: 0,
 *         routeState: 'selected',
 *         formattedDistance: '15.3 km',
 *         formattedDuration: '22 min'
 *       }
 *     },
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Point', coordinates: [4.85, 52.35] },
 *       properties: {
 *         routeIndex: 1,
 *         routeState: 'deselected',
 *         formattedDistance: '18.7 km',
 *         formattedDuration: '25 min'
 *       }
 *     }
 *   ]
 * };
 * ```
 *
 * @group Routing
 */
export type DisplayRouteSummaries = FeatureCollection<Point, DisplayRouteSummaryProps>;

/**
 * Display-ready props of one border crossing.
 *
 * @group Routing
 */
export type DisplayCountryCrossingProps = DisplayRouteRelatedProps & {
    /** ISO 3166-1 alpha-2 code of the country the route leaves. */
    fromCountryCode: string;

    /** ISO 3166-1 alpha-2 code of the country the route enters. */
    toCountryCode: string;

    /** The label the plaque is stretched around — `'ES → FR'`. */
    label: string;

    /**
     * Bearing of the route where it crosses, in degrees clockwise from north.
     *
     * @remarks
     * What `alignment: 'route'` turns the plaque by. Present whatever the alignment, so switching
     * it is a restyle rather than a re-derive.
     */
    bearing: number;

    /**
     * `startPointIndex` of the `country` section the route leaves, which identifies that section
     * on {@link RouteProps.sections} even when the route enters the same country twice.
     */
    fromSectionStartPointIndex: number;

    /** `startPointIndex` of the `country` section the route enters. */
    toSectionStartPointIndex: number;
};

/**
 * GeoJSON feature of one border crossing, placed where the route enters the second country.
 *
 * @group Routing
 */
export type DisplayCountryCrossing = Feature<Point, DisplayCountryCrossingProps>;

/**
 * A border crossing as an event hands it over: the drawn feature, plus the two `country` sections
 * it joins.
 *
 * @remarks
 * The sections are looked up on the route the crossing belongs to, so they are the same objects
 * `route.properties.sections.country` holds rather than copies. They are absent only when the route
 * that carried them is no longer shown.
 *
 * @group Routing
 */
export type CountryCrossingFeature = Feature<
    Point,
    DisplayCountryCrossingProps & {
        /** The `country` section the route leaves. */
        fromSection?: CountrySectionProps;
        /** The `country` section the route enters. */
        toSection?: CountrySectionProps;
    }
>;

/**
 * GeoJSON feature collection of the border crossings along the shown routes.
 *
 * @group Routing
 */
export type DisplayCountryCrossings = FeatureCollection<Point, DisplayCountryCrossingProps>;
