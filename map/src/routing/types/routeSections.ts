import type { SectionProps, TrafficSectionProps } from '@cet/maps-sdk-js/core';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { DisplayRouteRelatedProps } from './displayRoutes';

/**
 * Display-ready section properties combining base section data with route context.
 *
 * Extends section information with routing module display properties, allowing
 * sections to be rendered with proper styling and route association.
 *
 * @remarks
 * Used for rendering special route segments like ferry crossings, tolls, tunnels, etc.
 *
 * @example
 * ```typescript
 * const sectionProps: DisplaySectionProps = {
 *   ...sectionData,
 *   routeIndex: 0,
 *   routeStyle: 'selected'
 * };
 * ```
 *
 * @group Routing
 * @category Types
 */
export type DisplaySectionProps = SectionProps & DisplayRouteRelatedProps;

/**
 * GeoJSON feature representing a route section of a certain type.
 *
 * Represents a specific segment of a route with special characteristics
 * (e.g., ferry, toll road, tunnel, traffic incident, EV charging stop).
 *
 * @typeParam S - The section properties type, defaults to DisplaySectionProps
 *
 * @remarks
 * **Common Section Types:**
 * - Ferry crossings
 * - Toll roads
 * - Tunnels
 * - Traffic incidents
 * - Vehicle restrictions
 * - EV charging stops
 *
 * Each section has a start and end point along the route, represented as
 * a LineString geometry.
 *
 * @example
 * ```typescript
 * // Ferry section
 * const ferrySection: RouteSection = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[4.9, 52.3], [4.95, 52.35]]
 *   },
 *   properties: {
 *     sectionType: 'ferry',
 *     routeIndex: 0,
 *     routeStyle: 'selected'
 *   }
 * };
 *
 * // Toll road section
 * const tollSection: RouteSection = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[5.1, 52.4], [5.2, 52.5]]
 *   },
 *   properties: {
 *     sectionType: 'tollRoad',
 *     routeIndex: 0,
 *     routeStyle: 'selected'
 *   }
 * };
 * ```
 *
 * @group Routing
 * @category Types
 */
export type RouteSection<S extends DisplaySectionProps = DisplaySectionProps> = Feature<LineString, S>;

/**
 * GeoJSON feature collection representing route sections of a certain type.
 *
 * Collection of all sections of a specific type (e.g., all ferry crossings,
 * all toll roads) across one or more routes.
 *
 * @typeParam S - The section properties type, defaults to DisplaySectionProps
 *
 * @remarks
 * Used to group and render similar section types together, allowing for
 * consistent styling and filtering.
 *
 * @example
 * ```typescript
 * // Collection of all ferry sections
 * const ferrySections: RouteSections = {
 *   type: 'FeatureCollection',
 *   features: [
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'LineString', coordinates: [[4.9, 52.3], [4.95, 52.35]] },
 *       properties: { sectionType: 'ferry', routeIndex: 0, routeStyle: 'selected' }
 *     },
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'LineString', coordinates: [[5.0, 52.4], [5.05, 52.45]] },
 *       properties: { sectionType: 'ferry', routeIndex: 1, routeStyle: 'deselected' }
 *     }
 *   ]
 * };
 * ```
 *
 * @group Routing
 * @category Types
 */
export type RouteSections<S extends DisplaySectionProps = DisplaySectionProps> = FeatureCollection<LineString, S>;

/**
 * Display properties for traffic-related route sections.
 *
 * Extends display section properties with traffic-specific information including
 * incident details and visual elements for rendering.
 *
 * @remarks
 * Traffic sections highlight areas of congestion, incidents, or delays along
 * the route. They include additional properties for displaying icons and titles
 * in the UI.
 *
 * @example
 * ```typescript
 * const trafficSection: DisplayTrafficSectionProps = {
 *   sectionType: 'traffic',
 *   routeIndex: 0,
 *   routeStyle: 'selected',
 *   simpleCategory: 'jam',
 *   magnitudeOfDelay: 'moderate',
 *   iconID: 'traffic-jam-icon',
 *   title: '5 min delay due to traffic jam'
 * };
 * ```
 *
 * @group Routing
 * @category Types
 * @ignore
 */
export type DisplayTrafficSectionProps = DisplaySectionProps &
    TrafficSectionProps & {
        /**
         * Icon ID for the section leading icon.
         *
         * @remarks
         * References an icon in the map style sprite, used to visually
         * represent the type of traffic incident or delay.
         *
         * @example
         * ```typescript
         * iconID: 'traffic-jam'
         * iconID: 'accident'
         * iconID: 'road-closure'
         * ```
         */
        iconID?: string;

        /**
         * Title for the traffic section.
         *
         * @remarks
         * By default consists of the incident delay if any, but can be
         * customized to provide more detailed information.
         *
         * @example
         * ```typescript
         * title: '5 min delay'
         * title: 'Accident ahead - 10 min delay'
         * title: 'Heavy traffic'
         * ```
         */
        title?: string;
    };
