import { Routes, Waypoints } from "@anw/go-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    ROUTE_DESELECTED_LINE_LAYER_ID,
    ROUTE_DESELECTED_OUTLINE_LAYER_ID,
    ROUTE_FERRIES_LINE_LAYER_ID,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_FERRIES_SYMBOL_LAYER_ID,
    ROUTE_INCIDENTS_BACKGROUND_LAYER_ID,
    ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID,
    ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_INCIDENTS_SYMBOL_LAYER_ID,
    ROUTE_LINE_LAYER_ID,
    ROUTE_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TOLL_ROADS_SYMBOL,
    ROUTE_TUNNELS_LINE_LAYER_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    WAYPOINT_LABELS_LAYER_ID,
    WAYPOINT_SYMBOLS_LAYER_ID,
    WAYPOINTS_SOURCE_ID
} from "../core";
import { routeDeselectedLine, routeDeselectedOutline, routeMainLine, routeOutline } from "./layers/routeMainLineLayers";
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
import { buildDisplayRouteSections, showSectionsWithRouteSelection } from "./util/RouteSections";
import { toDisplayTrafficSectionProps } from "./util/DisplayTrafficSectionProps";
import { DisplayTrafficSectionProps, RouteSections } from "./types/RouteSections";
import { routeFerriesLine, routeFerriesSymbol } from "./layers/routeFerrySectionLayers";
import { routeTunnelsLine } from "./layers/routeTunnelSectionLayers";
import { routeTollRoadsOutline, routeTollRoadsSymbol } from "./layers/routeTollRoadLayers";
import {
    routeVehicleRestrictedBackgroundLine,
    routeVehicleRestrictedDottedLine
} from "./layers/routeVehicleRestrictedLayers";
import { buildDisplayRoutes } from "./util/Routes";
import { DisplayRouteProps } from "./types/DisplayRoutes";
import { ShowRoutesOptions } from "./types/ShowRoutesOptions";
import { waitUntilMapIsReady } from "../utils/mapUtils";
import { GOSDKMap } from "../GOSDKMap";

const LAYER_TO_RENDER_LINES_UNDER = "TransitLabels - Ferry";
const SDK_HOSTED_IMAGES_URL_BASE = "https://plan.tomtom.com/resources/images/";

/**
 * The routing module is responsible for styling and display of routes and waypoints to the map.
 * @group MapRoutes
 * @category Functions
 */
export class RoutingModule extends AbstractMapModule<RoutingModuleConfig> {
    private waypoints!: GeoJSONSourceWithLayers<Waypoints>;
    private routeLines!: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    // route sections:
    private vehicleRestricted!: GeoJSONSourceWithLayers<RouteSections>;
    private incidents!: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    private ferries!: GeoJSONSourceWithLayers<RouteSections>;
    private tollRoads!: GeoJSONSourceWithLayers<RouteSections>;
    private tunnels!: GeoJSONSourceWithLayers<RouteSections>;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param goSDKMap The GOSDKMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(goSDKMap: GOSDKMap, config?: RoutingModuleConfig): Promise<RoutingModule> {
        await waitUntilMapIsReady(goSDKMap);
        return new RoutingModule(goSDKMap, config);
    }

    protected initSourcesWithLayers() {
        this.waypoints = new GeoJSONSourceWithLayers(this.mapLibreMap, WAYPOINTS_SOURCE_ID, [
            { ...waypointSymbols, id: WAYPOINT_SYMBOLS_LAYER_ID },
            { ...waypointLabels, id: WAYPOINT_LABELS_LAYER_ID }
        ]);
        this.routeLines = new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, [
            { ...routeDeselectedOutline, id: ROUTE_DESELECTED_OUTLINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeDeselectedLine, id: ROUTE_DESELECTED_LINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeOutline, id: ROUTE_OUTLINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER },
            { ...routeMainLine, id: ROUTE_LINE_LAYER_ID, beforeID: LAYER_TO_RENDER_LINES_UNDER }
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
                beforeID: ROUTE_DESELECTED_OUTLINE_LAYER_ID
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

    protected _applyConfig(config: RoutingModuleConfig | undefined): void {
        // If interactive set, we add all layers to be interactive
        if (config?.interactive) {
            const routingSourcesWithLayers = [
                this.waypoints,
                this.routeLines,
                this.vehicleRestricted,
                this.incidents,
                this.ferries,
                this.tollRoads,
                this.tunnels
            ];

            for (const sourceWithLayers of routingSourcesWithLayers) {
                this.goSDKMap._eventsProxy.ensureAdded(sourceWithLayers);
            }
        }
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
     * @param options An optional selected index from the array of routes. Will make that route appear selected.
     * Defaults to 0 (first/recommended route).
     */
    showRoutes(routes: Routes, options?: ShowRoutesOptions) {
        const displayRoutes = buildDisplayRoutes(routes, options?.selectedIndex);
        this.routeLines.show(displayRoutes);
        this.vehicleRestricted.show(buildDisplayRouteSections(displayRoutes, "vehicleRestricted"));
        this.incidents.show(buildDisplayRouteSections(displayRoutes, "traffic", toDisplayTrafficSectionProps));
        this.ferries.show(buildDisplayRouteSections(displayRoutes, "ferry"));
        this.tunnels.show(buildDisplayRouteSections(displayRoutes, "tunnel"));
        this.tollRoads.show(buildDisplayRouteSections(displayRoutes, "tollRoad"));
    }

    /**
     * Clears any previously shown routes from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearRoutes() {
        this.routeLines.clear();
        this.vehicleRestricted.clear();
        this.incidents.clear();
        this.ferries.clear();
        this.tollRoads.clear();
        this.tunnels.clear();
    }

    /**
     * Shows the currently rendered route with the given index as selected.
     * * De-selects the previously selected route, if applicable.
     * @param index The route index to select. Must be within the existing rendered routes.
     */
    selectRoute(index: number) {
        const updatedRoutes = buildDisplayRoutes(this.routeLines.shownFeatures, index);

        this.routeLines.show(updatedRoutes);
        showSectionsWithRouteSelection(updatedRoutes, this.vehicleRestricted);
        showSectionsWithRouteSelection(updatedRoutes, this.incidents);
        showSectionsWithRouteSelection(updatedRoutes, this.ferries);
        showSectionsWithRouteSelection(updatedRoutes, this.tollRoads);
        showSectionsWithRouteSelection(updatedRoutes, this.tunnels);
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
        this.waypoints.show(waypoints);
    }

    /**
     * Clears any previously shown waypoints from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearWaypoints() {
        this.waypoints.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return {
            routeLines: new EventsModule(this.goSDKMap._eventsProxy, this.routeLines),
            waypoints: new EventsModule(this.goSDKMap._eventsProxy, this.waypoints),
            vehicleRestricted: new EventsModule(this.goSDKMap._eventsProxy, this.vehicleRestricted),
            incidents: new EventsModule(this.goSDKMap._eventsProxy, this.incidents),
            ferries: new EventsModule(this.goSDKMap._eventsProxy, this.ferries),
            tollRoads: new EventsModule(this.goSDKMap._eventsProxy, this.tollRoads),
            tunnels: new EventsModule(this.goSDKMap._eventsProxy, this.tunnels)
        };
    }

    /**
     * Returns the map style layer under which route lines are rendered.
     * * Useful if you want to render extra layers just above the route ones but not on top of everything else.
     * * It might differ depending on the loaded style/version.
     */
    getLayerToRenderLinesUnder(): string {
        return LAYER_TO_RENDER_LINES_UNDER;
    }
}
