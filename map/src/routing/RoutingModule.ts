import { Route, Routes, Waypoint, Waypoints } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    WAYPOINTS_SOURCE_ID
} from "../shared";
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID
} from "./layers/waypointLayers";
import { toDisplayWaypoints } from "./util/waypointUtils";
import { PlanningWaypoint } from "./types/planningWaypoint";
import { DEFAULT_ROUTE_LAYERS_CONFIGURATION, RoutingModuleConfig } from "./types/routeModuleConfig";
import { buildDisplayRouteSections, showSectionsWithRouteSelection } from "./util/routeSections";
import { toDisplayTrafficSectionProps } from "./util/displayTrafficSectionProps";
import { DisplayTrafficSectionProps, RouteSection, RouteSections } from "./types/routeSections";
import { buildDisplayRoutes, createLayersSpecs, mergeConfig, RoutingLayersSpecs } from "./util/routes";
import { DisplayRouteProps } from "./types/displayRoutes";
import { ShowRoutesOptions } from "./types/showRoutesOptions";
import { addLayers, updateLayersAndSource, waitUntilMapIsReady } from "../shared/mapUtils";
import { TomTomMap } from "../TomTomMap";

const SDK_HOSTED_IMAGES_URL_BASE = "https://plan.tomtom.com/resources/images/";

type RoutingSourcesWithLayers = {
    waypoints: GeoJSONSourceWithLayers<Waypoints>;
    routeLines: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    // route sections:
    vehicleRestricted: GeoJSONSourceWithLayers<RouteSections>;
    incidents: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    ferries: GeoJSONSourceWithLayers<RouteSections>;
    tollRoads: GeoJSONSourceWithLayers<RouteSections>;
    tunnels: GeoJSONSourceWithLayers<RouteSections>;
};

/**
 * The routing module is responsible for styling and display of routes and waypoints to the map.
 */
export class RoutingModule extends AbstractMapModule<RoutingSourcesWithLayers, RoutingModuleConfig> {
    private layersSpecs!: RoutingLayersSpecs;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(
        tomtomMap: TomTomMap,
        config: RoutingModuleConfig = { routeLayers: DEFAULT_ROUTE_LAYERS_CONFIGURATION }
    ): Promise<RoutingModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new RoutingModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: RoutingModuleConfig) {
        super(map, config);
    }

    private createSourcesWithLayers(layersSpecs: RoutingLayersSpecs): RoutingSourcesWithLayers {
        return {
            routeLines: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, layersSpecs.routeLines, false),
            waypoints: new GeoJSONSourceWithLayers(this.mapLibreMap, WAYPOINTS_SOURCE_ID, layersSpecs.waypoints, false),
            incidents: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INCIDENTS_SOURCE_ID,
                layersSpecs.incidents,
                false
            ),
            ferries: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_FERRIES_SOURCE_ID, layersSpecs.ferries, false),
            tollRoads: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_TOLL_ROADS_SOURCE_ID,
                layersSpecs.tollRoads,
                false
            ),
            tunnels: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_TUNNELS_SOURCE_ID, layersSpecs.tunnels, false),
            vehicleRestricted: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
                layersSpecs.vehicleRestricted
            )
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig): RoutingSourcesWithLayers {
        // loading of extra assets not present in the map style:
        this.addImageIfNotExisting(WAYPOINT_START_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-start.png`);
        this.addImageIfNotExisting(WAYPOINT_STOP_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-stop.png`);
        this.addImageIfNotExisting(WAYPOINT_SOFT_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-soft.png`);
        this.addImageIfNotExisting(WAYPOINT_FINISH_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-finish.png`);

        this.layersSpecs = createLayersSpecs(mergeConfig(config).routeLayers);
        const routingSourcesWithLayers: RoutingSourcesWithLayers = this.createSourcesWithLayers(this.layersSpecs);
        addLayers(
            Object.values(routingSourcesWithLayers).flatMap((source) => source._layerSpecs),
            this.mapLibreMap
        );
        return routingSourcesWithLayers;
    }

    /**
     * @ignore
     */
    protected _applyConfig(config?: RoutingModuleConfig) {
        const mergedConfig = mergeConfig(config);

        // If there was already some config set, we must update the changes:
        if (this.config) {
            // replace existing configuration with new one
            const newLayersSpecs = createLayersSpecs(mergedConfig?.routeLayers || DEFAULT_ROUTE_LAYERS_CONFIGURATION);

            // here we assume that keys for layer specs and sources are the same, please keep it that way to simplify the logic
            Object.keys(newLayersSpecs).forEach((layersSpecs) => {
                updateLayersAndSource(
                    newLayersSpecs[layersSpecs as keyof RoutingLayersSpecs],
                    this.layersSpecs[layersSpecs as keyof RoutingLayersSpecs],
                    this.sourcesWithLayers[layersSpecs as keyof RoutingSourcesWithLayers],
                    this.mapLibreMap
                );
            });
            // we need to add layers correctly
            const listOfSources = Object.values(this.sourcesWithLayers) as GeoJSONSourceWithLayers[];
            addLayers(
                listOfSources.flatMap((source) => source._layerSpecs),
                this.mapLibreMap
            );
            //set correct visibility if there are new layers
            listOfSources.forEach((source) => source.setLayersVisible(!!source.shownFeatures.features.length));
            this.layersSpecs = newLayersSpecs;
        }
        return mergedConfig;
    }

    /**
     * @ignore
     */
    protected async restoreDataAndConfig() {
        const previouslyShown = {
            waypoints: this.sourcesWithLayers.waypoints.shownFeatures,
            routeLines: this.sourcesWithLayers.routeLines.shownFeatures,
            vehicleRestricted: this.sourcesWithLayers.vehicleRestricted.shownFeatures,
            incidents: this.sourcesWithLayers.incidents.shownFeatures,
            ferries: this.sourcesWithLayers.ferries.shownFeatures,
            tunnels: this.sourcesWithLayers.tunnels.shownFeatures,
            tollRoads: this.sourcesWithLayers.tollRoads.shownFeatures
        };

        this.initSourcesWithLayers();
        this._applyConfig(this.config);

        this.sourcesWithLayers.waypoints.show(previouslyShown.waypoints);
        this.sourcesWithLayers.routeLines.show(previouslyShown.routeLines);
        this.sourcesWithLayers.vehicleRestricted.show(previouslyShown.vehicleRestricted);
        this.sourcesWithLayers.incidents.show(previouslyShown.incidents);
        this.sourcesWithLayers.ferries.show(previouslyShown.ferries);
        this.sourcesWithLayers.tunnels.show(previouslyShown.tunnels);
        this.sourcesWithLayers.tollRoads.show(previouslyShown.tollRoads);
    }

    private addImageIfNotExisting(imageID: string, path: string) {
        if (!this.mapLibreMap.hasImage(imageID)) {
            this.mapLibreMap.loadImage(path, (_, image) => {
                // double-checking just in case of a race condition with overlapping init:
                if (!this.mapLibreMap.hasImage(imageID)) {
                    this.mapLibreMap.addImage(imageID, image as HTMLImageElement);
                }
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
        this.sourcesWithLayers.routeLines.show(displayRoutes);
        this.sourcesWithLayers.vehicleRestricted.show(buildDisplayRouteSections(displayRoutes, "vehicleRestricted"));
        this.sourcesWithLayers.incidents.show(
            buildDisplayRouteSections(displayRoutes, "traffic", toDisplayTrafficSectionProps)
        );
        this.sourcesWithLayers.ferries.show(buildDisplayRouteSections(displayRoutes, "ferry"));
        this.sourcesWithLayers.tunnels.show(buildDisplayRouteSections(displayRoutes, "tunnel"));
        this.sourcesWithLayers.tollRoads.show(buildDisplayRouteSections(displayRoutes, "tollRoad"));
    }

    /**
     * Clears any previously shown routes from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearRoutes() {
        this.sourcesWithLayers.routeLines.clear();
        this.sourcesWithLayers.vehicleRestricted.clear();
        this.sourcesWithLayers.incidents.clear();
        this.sourcesWithLayers.ferries.clear();
        this.sourcesWithLayers.tollRoads.clear();
        this.sourcesWithLayers.tunnels.clear();
    }

    /**
     * Shows the currently rendered route with the given index as selected.
     * * De-selects the previously selected route, if applicable.
     * @param index The route index to select. Must be within the existing rendered routes.
     */
    selectRoute(index: number) {
        const updatedRoutes = buildDisplayRoutes(this.sourcesWithLayers.routeLines.shownFeatures, index);

        this.sourcesWithLayers.routeLines.show(updatedRoutes);
        showSectionsWithRouteSelection(updatedRoutes, this.sourcesWithLayers.vehicleRestricted);
        showSectionsWithRouteSelection(updatedRoutes, this.sourcesWithLayers.incidents);
        showSectionsWithRouteSelection(updatedRoutes, this.sourcesWithLayers.ferries);
        showSectionsWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tollRoads);
        showSectionsWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tunnels);
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
        this.sourcesWithLayers.waypoints.show(waypoints);
    }

    /**
     * Clears any previously shown waypoints from the map.
     * * If nothing was shown before, nothing happens.
     */
    clearWaypoints() {
        this.sourcesWithLayers.waypoints.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return {
            routeLines: new EventsModule<Route<DisplayRouteProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.routeLines
            ),
            waypoints: new EventsModule<Waypoint>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.waypoints),
            vehicleRestricted: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.vehicleRestricted
            ),
            incidents: new EventsModule<RouteSections<DisplayTrafficSectionProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.incidents
            ),
            ferries: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.ferries),
            tollRoads: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tollRoads),
            tunnels: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tunnels)
        };
    }

    /**
     * Returns the map style layer under which route lines are rendered.
     * * Useful if you want to render extra layers just above the route ones but not on top of everything else.
     * * It might differ depending on the loaded style/version.
     */
    getLayerToRenderLinesUnder(): string {
        return mapStyleLayerIDs.lowestLabel;
    }
}
