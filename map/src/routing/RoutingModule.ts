import { Routes, TrafficSectionProps, Waypoints } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers } from "../core";
import { routeOutline, routeMainLine } from "./layers/routeMainLineLayers";
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID,
    waypointLabels,
    waypointSymbols
} from "./layers/waypointLayers";
import { toDisplayWaypoints } from "./util/WaypointUtils";
import { PlanningWaypoint } from "./types/PlanningWaypoint";
import {
    routeIncidentsBGLine,
    routeIncidentsDashedLine,
    routeIncidentsPatternLine,
    routeIncidentsSymbol
} from "./layers/routeTrafficSectionLayers";
import { RoutingModuleConfig } from "./types/RouteModuleConfig";
import { buildRouteSections } from "./util/RouteSections";
import { toDisplayTrafficSectionProps } from "./util/DisplayTrafficSectionProps";
import { RouteSections } from "./types/RouteSections";
import { routeFerriesLine, routeFerriesSymbol } from "./layers/routeFerrySectionLayers";
import { routeTunnelsLine } from "./layers/routeTunnelSectionLayers";
import { routeTollRoadsOutline, routeTollRoadsSymbol } from "./layers/routeTollRoadLayers";
import {
    routeVehicleRestrictedBackgroundLine,
    routeVehicleRestrictedDottedLine
} from "./layers/routeVehicleRestrictedLayers";

export const WAYPOINTS_SOURCE_ID = "waypoints";
export const WAYPOINT_SYMBOLS_LAYER_ID = "waypointsSymbol";
export const WAYPOINT_LABELS_LAYER_ID = "waypointsLabel";

export const ROUTES_SOURCE_ID = "routes";
export const ROUTE_OUTLINE_LAYER_ID = "routeOutline";
export const ROUTE_FOREGROUND_LAYER_ID = "routesLineForeground";

export const ROUTE_VEHICLE_RESTRICTED_SOURCE_ID = "routeVehicleRestricted";
export const ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID = "routeVehicleRestrictedBackground";
export const ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID = "routeVehicleRestrictedForeground";

export const ROUTE_INCIDENTS_SOURCE_ID = "routeIncidents";
export const ROUTE_INCIDENTS_BACKGROUND_LAYER_ID = "routeIncidentsBackground";
export const ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID = "routeIncidentsPatternLine";
export const ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID = "routeIncidentsDashedLine";
export const ROUTE_INCIDENTS_SYMBOL_LAYER_ID = "routeIncidentsSymbol";

export const ROUTE_FERRIES_SOURCE_ID = "routeFerries";
export const ROUTE_FERRIES_LINE_LAYER_ID = "routeFerriesLine";
export const ROUTE_FERRIES_SYMBOL_LAYER_ID = "routeFerriesSymbol";

export const ROUTE_TOLL_ROADS_SOURCE_ID = "routeTollRoads";
export const ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID = "routeTollRoadsOutline";
export const ROUTE_TOLL_ROADS_SYMBOL = "routeTollRoadsSymbol";

export const ROUTE_TUNNELS_SOURCE_ID = "routeTunnels";
export const ROUTE_TUNNELS_LINE_LAYER_ID = "routeTunnelsLine";

const LAYER_TO_RENDER_LINES_UNDER = "TransitLabels - Ferry";
const SDK_HOSTED_IMAGES_URL_BASE = "https://plan.tomtom.com/resources/images/";

/**
 * The routing module is responsible for styling and display of routes and waypoints to the map.
 * @group MapRoutes
 * @category Functions
 */
export class RoutingModule extends AbstractMapModule<RoutingModuleConfig> {
    private waypoints?: GeoJSONSourceWithLayers<Waypoints>;
    private routeLines?: GeoJSONSourceWithLayers<Routes>;
    // route sections:
    private vehicleRestricted?: GeoJSONSourceWithLayers<RouteSections>;
    private incidents?: GeoJSONSourceWithLayers<RouteSections<TrafficSectionProps>>;
    private ferries?: GeoJSONSourceWithLayers<RouteSections>;
    private tollRoads?: GeoJSONSourceWithLayers<RouteSections>;
    private tunnels?: GeoJSONSourceWithLayers<RouteSections>;

    protected init(): void {
        this.waypoints = new GeoJSONSourceWithLayers(this.mapLibreMap, WAYPOINTS_SOURCE_ID, [
            { ...waypointSymbols, id: WAYPOINT_SYMBOLS_LAYER_ID },
            { ...waypointLabels, id: WAYPOINT_LABELS_LAYER_ID }
        ]);
        this.routeLines = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, [
            { ...routeOutline, id: ROUTE_OUTLINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeMainLine, id: ROUTE_FOREGROUND_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER }
        ]);
        this.vehicleRestricted = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_VEHICLE_RESTRICTED_SOURCE_ID, [
            {
                ...routeVehicleRestrictedBackgroundLine,
                id: ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
                beforeID: LAYER_TO_RENDER_LINES_UNDER
            },
            {
                ...routeVehicleRestrictedDottedLine,
                id: ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
                beforeID: LAYER_TO_RENDER_LINES_UNDER
            }
        ]);
        this.incidents = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_INCIDENTS_SOURCE_ID, [
            { ...routeIncidentsBGLine, id: ROUTE_INCIDENTS_BACKGROUND_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER },
            {
                ...routeIncidentsDashedLine,
                id: ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID,
                beforeID: LAYER_TO_RENDER_LINES_UNDER
            },
            {
                ...routeIncidentsPatternLine,
                id: ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID,
                beforeID: LAYER_TO_RENDER_LINES_UNDER
            },
            { ...routeIncidentsSymbol, id: ROUTE_INCIDENTS_SYMBOL_LAYER_ID, beforeID: WAYPOINT_SYMBOLS_LAYER_ID }
        ]);
        this.ferries = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_FERRIES_SOURCE_ID, [
            { ...routeFerriesLine, id: ROUTE_FERRIES_LINE_LAYER_ID, beforeID: ROUTE_INCIDENTS_BACKGROUND_LAYER_ID },
            { ...routeFerriesSymbol, id: ROUTE_FERRIES_SYMBOL_LAYER_ID, beforeID: ROUTE_INCIDENTS_SYMBOL_LAYER_ID }
        ]);
        this.tollRoads = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_TOLL_ROADS_SOURCE_ID, [
            {
                ...routeTollRoadsOutline,
                id: ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
                beforeID: ROUTE_OUTLINE_LAYER_ID
            },
            { ...routeTollRoadsSymbol, id: ROUTE_TOLL_ROADS_SYMBOL, beforeID: WAYPOINT_SYMBOLS_LAYER_ID }
        ]);
        this.tunnels = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_TUNNELS_SOURCE_ID, [
            { ...routeTunnelsLine, id: ROUTE_TUNNELS_LINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER }
        ]);

        // loading of extra assets not present in the map style:
        this.addImageIfNotExisting(WAYPOINT_START_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-start.png`);
        this.addImageIfNotExisting(WAYPOINT_STOP_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-stop.png`);
        this.addImageIfNotExisting(WAYPOINT_SOFT_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-soft.png`);
        this.addImageIfNotExisting(WAYPOINT_FINISH_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-finish.png`);
    }

    private addImageIfNotExisting(imageID: string, path: string) {
        if (!this.mapLibreMap.hasImage(imageID)) {
            this.mapLibreMap.loadImage(path, (_, image) => {
                this.mapLibreMap.addImage(imageID, image as HTMLImageElement);
            });
        }
    }

    /**
     * Shows the given routes on the map.
     * @param routes The routes to show.
     */
    showRoutes(routes: Routes) {
        this.callWhenMapReady(() => {
            this.routeLines?.show(routes);
            this.vehicleRestricted?.show(buildRouteSections(routes, "vehicleRestricted"));
            this.incidents?.show(buildRouteSections(routes, "traffic", toDisplayTrafficSectionProps));
            this.ferries?.show(buildRouteSections(routes, "ferry"));
            this.tollRoads?.show(buildRouteSections(routes, "tollRoad"));
            this.tunnels?.show(buildRouteSections(routes, "tunnel"));
        });
    }

    /**
     * Clears any previously shown routes from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearRoutes() {
        this.callWhenMapReady(() => {
            this.routeLines?.clear();
            this.vehicleRestricted?.clear();
            this.incidents?.clear();
            this.ferries?.clear();
            this.tollRoads?.clear();
            this.tunnels?.clear();
        });
    }

    /**
     * Shows the given waypoints on the map.
     * @param waypointsLike The waypoint-like inputs to show.
     */
    showWaypoints(waypointsLike: PlanningWaypoint[] | Waypoints) {
        const waypoints = Array.isArray(waypointsLike)
            ? toDisplayWaypoints(waypointsLike)
            : // FeatureCollection expected:
              toDisplayWaypoints(waypointsLike.features as PlanningWaypoint[]);
        this.callWhenMapReady(() => this.waypoints?.show(waypoints));
    }

    /**
     * Clears any previously shown waypoints from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearWaypoints() {
        this.callWhenMapReady(() => this.waypoints?.clear());
    }
}
