import type { Routes, Waypoints } from '@tomtom-org/maps-sdk/core';
import type { GeoJSONSourceWithLayers, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import type { DisplayRouteProps, DisplayRouteSummaries } from './displayRoutes';
import type { DisplayInstructionArrows, DisplayInstructions } from './guidance';
import type { DisplayTrafficSectionProps, RouteSections } from './routeSections';
import type { WaypointDisplayProps } from './waypointDisplayProps';

/**
 * @ignore
 */
export type RoutingSourcesWithLayers = {
    mainLines: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    waypoints: GeoJSONSourceWithLayers<Waypoints<WaypointDisplayProps>>;
    // route sections:
    vehicleRestricted: GeoJSONSourceWithLayers<RouteSections>;
    incidents: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    ferries: GeoJSONSourceWithLayers<RouteSections>;
    chargingStops: GeoJSONSourceWithLayers<Waypoints>;
    tollRoads: GeoJSONSourceWithLayers<RouteSections>;
    tunnels: GeoJSONSourceWithLayers<RouteSections>;
    instructionLines: GeoJSONSourceWithLayers<DisplayInstructions>;
    instructionArrows: GeoJSONSourceWithLayers<DisplayInstructionArrows>;
    summaryBubbles: GeoJSONSourceWithLayers<DisplayRouteSummaries>;
};

/**
 * @ignore
 */
export type RoutingLayersSpecs = Record<keyof RoutingSourcesWithLayers, ToBeAddedLayerSpecWithoutSource[]>;
