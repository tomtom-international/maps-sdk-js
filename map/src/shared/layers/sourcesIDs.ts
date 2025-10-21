/**
 * Source identifier for POI (Point of Interest) vector tiles.
 *
 * @remarks
 * Used to reference the POI layer in the map style, which contains
 * business locations, landmarks, and other points of interest.
 *
 * @group POIs
 */
export const POI_SOURCE_ID = 'vectorTiles';

/**
 * Source identifier for hillshade terrain visualization.
 *
 * @remarks
 * References the raster source that provides terrain shading to visualize
 * elevation and topography on the map.
 *
 * @group Hillshade
 */
export const HILLSHADE_SOURCE_ID = 'hillshade';

/**
 * Source identifier prefix for places (geocoding results) features.
 *
 * @remarks
 * Combined with a unique identifier to create source IDs for place markers
 * displayed via the Places module.
 *
 * @group Places
 */
export const PLACES_SOURCE_PREFIX_ID = 'places';

/**
 * Source identifier for base map vector tiles.
 *
 * @remarks
 * References the primary vector tile source containing roads, buildings,
 * land use, water bodies, and other fundamental map features.
 *
 * @group Base Map
 */
export const BASE_MAP_SOURCE_ID = 'vectorTiles';

/**
 * Source identifier for traffic incidents vector tiles.
 *
 * @remarks
 * References the vector tile source containing real-time traffic incident data
 * such as accidents, road closures, and construction.
 *
 * @group Traffic Incidents
 */
export const TRAFFIC_INCIDENTS_SOURCE_ID = 'vectorTilesIncidents';

/**
 * Source identifier for traffic flow vector tiles.
 *
 * @remarks
 * References the vector tile source containing real-time traffic flow data
 * showing current traffic speeds and congestion levels.
 *
 * @group Traffic Flow
 */
export const TRAFFIC_FLOW_SOURCE_ID = 'vectorTilesFlow';

/* Start of Routing Source and Layer ids */

/**
 * Source identifier for route waypoints.
 *
 * @remarks
 * GeoJSON source containing waypoint features (origin, destination, and via points)
 * for displayed routes.
 *
 * @group Routing
 */
export const WAYPOINTS_SOURCE_ID = 'waypoints';

/**
 * Layer identifier for waypoint symbol markers.
 *
 * @remarks
 * Symbol layer that renders waypoint icons (e.g., start pin, end pin, intermediate stops).
 *
 * @group Routing
 */
export const WAYPOINT_SYMBOLS_LAYER_ID = 'waypointsSymbol';

/**
 * Layer identifier for waypoint text labels.
 *
 * @remarks
 * Symbol layer that displays text labels associated with waypoints.
 *
 * @group Routing
 */
export const WAYPOINT_LABELS_LAYER_ID = 'waypointsLabel';

/**
 * Source identifier for route line geometry.
 *
 * @remarks
 * GeoJSON source containing the main route line features representing
 * the calculated path between waypoints.
 *
 * @group Routing
 */
export const ROUTES_SOURCE_ID = 'routes';

/**
 * Layer identifier for route outline.
 *
 * @remarks
 * Line layer that renders the outer border of route lines, providing
 * visual separation from the map background.
 *
 * @group Routing
 */
export const ROUTE_OUTLINE_LAYER_ID = 'routesOutline';

/**
 * Layer identifier for route line.
 *
 * @remarks
 * Line layer that renders the main route path in the selected/active color.
 *
 * @group Routing
 */
export const ROUTE_LINE_LAYER_ID = 'routesLine';

/**
 * Layer identifier for route direction arrows.
 *
 * @remarks
 * Symbol layer that displays small directional arrows along route lines
 * to indicate the travel direction.
 *
 * @group Routing
 */
export const ROUTE_LINE_ARROWS_LAYER_ID = 'routeLineArrows';

/**
 * Layer identifier for deselected route outline.
 *
 * @remarks
 * Line layer that renders the outer border for routes that are not currently selected,
 * typically shown in a muted color when multiple route alternatives are displayed.
 *
 * @group Routing
 */
export const ROUTE_DESELECTED_OUTLINE_LAYER_ID = 'routesDeselectedOutline';

/**
 * Layer identifier for deselected route line.
 *
 * @remarks
 * Line layer that renders alternative routes that are not currently selected,
 * shown in a dimmed color to distinguish from the active route.
 *
 * @group Routing
 */
export const ROUTE_DESELECTED_LINE_LAYER_ID = 'routesDeselectedLine';

/**
 * Source identifier for vehicle-restricted road segments.
 *
 * @remarks
 * GeoJSON source containing route segments with vehicle access restrictions
 * (e.g., weight limits, height restrictions).
 *
 * @group Routing
 */
export const ROUTE_VEHICLE_RESTRICTED_SOURCE_ID = 'routeVehicleRestricted';

/**
 * Layer identifier for vehicle-restricted segment background.
 *
 * @remarks
 * Line layer that renders the background pattern for vehicle-restricted
 * portions of the route.
 *
 * @group Routing
 */
export const ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID = 'routeVehicleRestrictedBackground';

/**
 * Layer identifier for vehicle-restricted segment foreground.
 *
 * @remarks
 * Line layer that renders the foreground pattern or overlay for vehicle-restricted
 * portions of the route.
 *
 * @group Routing
 */
export const ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID = 'routeVehicleRestrictedForeground';

/**
 * Source identifier for traffic incidents along the route.
 *
 * @remarks
 * GeoJSON source containing traffic incident features that occur along
 * the calculated route path.
 *
 * @group Routing
 */
export const ROUTE_INCIDENTS_SOURCE_ID = 'routeIncidents';

/**
 * Layer identifier for route incident background.
 *
 * @remarks
 * Line layer that renders the background for incident-affected route segments.
 *
 * @group Routing
 */
export const ROUTE_INCIDENTS_BACKGROUND_LAYER_ID = 'routeIncidentsBackground';

/**
 * Layer identifier for route incident pattern line.
 *
 * @remarks
 * Line layer that displays a pattern (e.g., diagonal stripes) to indicate
 * incident-affected portions of the route.
 *
 * @group Routing
 */
export const ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID = 'routeIncidentsPatternLine';

/**
 * Layer identifier for route incident dashed line.
 *
 * @remarks
 * Line layer that renders dashed lines to highlight incident-affected
 * route segments.
 *
 * @group Routing
 */
export const ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID = 'routeIncidentsDashedLine';

/**
 * Layer identifier for route incident symbols.
 *
 * @remarks
 * Symbol layer that displays incident icons along affected route segments.
 *
 * @group Routing
 */
export const ROUTE_INCIDENTS_SYMBOL_LAYER_ID = 'routeIncidentsSymbol';

/**
 * Source identifier for ferry crossing segments.
 *
 * @remarks
 * GeoJSON source containing route segments that involve ferry transportation.
 *
 * @group Routing
 */
export const ROUTE_FERRIES_SOURCE_ID = 'routeFerries';

/**
 * Layer identifier for ferry segment line.
 *
 * @remarks
 * Line layer that renders ferry crossings with a distinct style
 * (typically dashed or dotted) to differentiate from road segments.
 *
 * @group Routing
 */
export const ROUTE_FERRIES_LINE_LAYER_ID = 'routeFerriesLine';

/**
 * Layer identifier for ferry segment symbols.
 *
 * @remarks
 * Symbol layer that displays ferry icons along ferry crossing segments.
 *
 * @group Routing
 */
export const ROUTE_FERRIES_SYMBOL_LAYER_ID = 'routeFerriesSymbol';

/**
 * Source identifier for toll road segments.
 *
 * @remarks
 * GeoJSON source containing route segments that require toll payments.
 *
 * @group Routing
 */
export const ROUTE_TOLL_ROADS_SOURCE_ID = 'routeTollRoads';

/**
 * Layer identifier for toll road segment outline.
 *
 * @remarks
 * Line layer that renders the outline for toll road segments,
 * highlighting areas where tolls are required.
 *
 * @group Routing
 */
export const ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID = 'routeTollRoadsOutline';

/**
 * Layer identifier for toll road segment symbols.
 *
 * @remarks
 * Symbol layer that displays toll icons along toll road segments.
 *
 * @group Routing
 */
export const ROUTE_TOLL_ROADS_SYMBOL = 'routeTollRoadsSymbol';

/**
 * Source identifier for tunnel segments.
 *
 * @remarks
 * GeoJSON source containing route segments that pass through tunnels.
 *
 * @group Routing
 */
export const ROUTE_TUNNELS_SOURCE_ID = 'routeTunnels';

/**
 * Layer identifier for tunnel segment line.
 *
 * @remarks
 * Line layer that renders tunnel segments with a distinct style
 * (typically dashed or faded) to indicate underground passage.
 *
 * @group Routing
 */
export const ROUTE_TUNNELS_LINE_LAYER_ID = 'routeTunnelsLine';

/**
 * Source identifier for EV charging station waypoints.
 *
 * @remarks
 * GeoJSON source containing electric vehicle charging station locations
 * along routes calculated for EVs.
 *
 * @group Routing
 */
export const ROUTE_EV_CHARGING_STATIONS_SOURCE_ID = 'evChargingStations';

/**
 * Layer identifier for EV charging station symbols.
 *
 * @remarks
 * Symbol layer that displays charging station icons at planned
 * charging stops along EV routes.
 *
 * @group Routing
 */
export const ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID = 'evChargingStationsSymbol';

/**
 * Source identifier for turn-by-turn guidance instructions.
 *
 * @remarks
 * GeoJSON source containing line segments representing individual
 * maneuver instructions along the route.
 *
 * @group Routing
 */
export const ROUTE_INSTRUCTIONS_SOURCE_ID = 'routeInstructions';

/**
 * Layer identifier for instruction segment foreground line.
 *
 * @remarks
 * Line layer that renders the main line for highlighted instruction segments
 * in turn-by-turn guidance.
 *
 * @group Routing
 */
export const ROUTE_INSTRUCTIONS_LINE_LAYER_ID = 'instructionLine';

/**
 * Layer identifier for instruction segment outline.
 *
 * @remarks
 * Line layer that renders the background outline for instruction segments,
 * providing visual emphasis for the current maneuver.
 *
 * @group Routing
 */
export const ROUTE_INSTRUCTIONS_OUTLINE_LAYER_ID = 'instructionOutline';

/**
 * Source identifier for instruction directional arrows.
 *
 * @remarks
 * GeoJSON source containing arrow tip features that indicate the
 * direction of travel for each guidance instruction.
 *
 * @group Routing
 */
export const ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID = 'routeInstructionArrows';

/**
 * Layer identifier for instruction arrow symbols.
 *
 * @remarks
 * Symbol layer that renders directional arrow icons at the end of
 * each instruction segment.
 *
 * @group Routing
 */
export const ROUTE_INSTRUCTIONS_ARROW_LAYER_ID = 'instructionArrowSymbol';

/**
 * Source identifier for route summary information bubbles.
 *
 * @remarks
 * GeoJSON source containing point features for displaying route summary
 * information (distance, duration, arrival time).
 *
 * @group Routing
 */
export const ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID = 'routeSummaryBubbles';

/**
 * Layer identifier for route summary bubble symbols.
 *
 * @remarks
 * Symbol layer that renders summary information bubbles along the route,
 * typically near the destination or at key waypoints.
 *
 * @group Routing
 */
export const ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID = 'routeSummaryBubbleSymbol';

/* End of Routing Source ids */
