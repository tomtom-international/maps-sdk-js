import { Routes, TrafficSectionProps, Waypoints } from "@anw/go-sdk-js/core";
import { AbstractMapModule, GeoJSONSourceWithLayers } from "../core";
import { routeLineBackgroundSpec, routeLineForegroundSpec } from "./layers/routeMainLineLayers";
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
    routeIncidentsPointSymbol
} from "./layers/routeTrafficSectionLayers";
import { RoutingModuleConfig } from "./types/RouteModuleConfig";
import { buildRouteSections } from "./util/RouteSections";
import { toDisplayTrafficSectionProps } from "./util/DisplayTrafficSectionProps";
import { RouteSections } from "./types/RouteSections";

export const WAYPOINTS_SOURCE_ID = "waypoints";
export const ROUTES_SOURCE_ID = "routes";
export const ROUTE_INCIDENTS_SOURCE_ID = "routeIncidents";

const LAYER_TO_RENDER_LINES_UNDER = "TransitLabels - Ferry";
const SDK_HOSTED_IMAGES_URL_BASE = "https://plan.tomtom.com/resources/images/";
const WAYPOINT_SYMBOLS_LAYER_ID = "waypointSymbols";

/**
 * The routing module is responsible for styling and display of routes and waypoints to the map.
 * @group MapRoutes
 * @category Functions
 */
export class RoutingModule extends AbstractMapModule<RoutingModuleConfig> {
    private waypoints?: GeoJSONSourceWithLayers<Waypoints>;
    private routeLines?: GeoJSONSourceWithLayers<Routes>;
    private incidents?: GeoJSONSourceWithLayers<RouteSections<TrafficSectionProps>>;

    protected init(): void {
        this.waypoints = new GeoJSONSourceWithLayers(this.mapLibreMap, WAYPOINTS_SOURCE_ID, [
            { ...waypointSymbols, id: WAYPOINT_SYMBOLS_LAYER_ID },
            { ...waypointLabels, id: "waypointLabels" }
        ]);
        this.routeLines = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, [
            { ...routeLineBackgroundSpec, id: "routeLineBackground", beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeLineForegroundSpec, id: "routeLineForeground", beforeID: LAYER_TO_RENDER_LINES_UNDER }
        ]);
        this.incidents = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_INCIDENTS_SOURCE_ID, [
            { ...routeIncidentsBGLine, id: "routeIncidentsBackground", beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeIncidentsDashedLine, id: "routeIncidentsDashedLines", beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeIncidentsPatternLine, id: "routeIncidentsPatternLines", beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeIncidentsPointSymbol, id: "routeIncidentSymbols", beforeID: WAYPOINT_SYMBOLS_LAYER_ID }
        ]);
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
            this.incidents?.show(buildRouteSections(routes, "traffic", toDisplayTrafficSectionProps));
        });
    }

    /**
     * Clears any previously shown routes from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearRoutes() {
        this.callWhenMapReady(() => {
            this.routeLines?.clear();
            this.incidents?.clear();
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
