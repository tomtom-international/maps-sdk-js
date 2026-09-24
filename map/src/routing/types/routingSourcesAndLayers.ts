import type { Routes, Waypoints } from '@tomtom-org/maps-sdk/core';
import type { GeoJSONSourceWithLayers, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import type { GeneratedSectionType, SectionSourceKey } from '../layers/sectionRegistry';
import type { DisplayChargingStops } from '../util/displayChargingStops';
import type { DisplayCountryCrossings, DisplayRouteProps, DisplayRouteSummaries } from './displayRoutes';
import type { DisplayInstructionArrows, DisplayInstructions } from './guidance';
import type { DisplayTrafficSectionProps, RouteSections } from './routeSections';
import type { WaypointDisplayProps } from './waypointDisplayProps';

/**
 * @ignore
 */
export type RoutingSourcesWithLayers = {
    [K in SectionSourceKey<GeneratedSectionType>]: GeoJSONSourceWithLayers<RouteSections>;
} & {
    mainLines: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    waypoints: GeoJSONSourceWithLayers<Waypoints<WaypointDisplayProps>>;
    // route sections:
    vehicleRestricted: GeoJSONSourceWithLayers<RouteSections>;
    incidents: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    ferries: GeoJSONSourceWithLayers<RouteSections>;
    chargingStops: GeoJSONSourceWithLayers<DisplayChargingStops>;
    tollRoads: GeoJSONSourceWithLayers<RouteSections>;
    tunnels: GeoJSONSourceWithLayers<RouteSections>;
    instructionLines: GeoJSONSourceWithLayers<DisplayInstructions>;
    instructionArrows: GeoJSONSourceWithLayers<DisplayInstructionArrows>;
    summaryBubbles: GeoJSONSourceWithLayers<DisplayRouteSummaries>;
    countryCrossings: GeoJSONSourceWithLayers<DisplayCountryCrossings>;
};

/**
 * @ignore
 */
export type RoutingLayersSpecs = Record<keyof RoutingSourcesWithLayers, ToBeAddedLayerSpecWithoutSource[]>;
