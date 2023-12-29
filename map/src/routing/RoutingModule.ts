import { Route, Routes, Waypoint, Waypoints } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    ROUTE_EV_CHARGING_STATIONS_SOURCE_ID,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INSTRUCTIONS_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    WAYPOINTS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID
} from "../shared";
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID
} from "./layers/waypointLayers";
import { toDisplayChargingStations, toDisplayWaypoints } from "./util/waypointUtils";
import { PlanningWaypoint } from "./types/planningWaypoint";
import { RoutingLayersSpecs, RoutingModuleConfig, RoutingSourcesWithLayers } from "./types/routeModuleConfig";
import { buildDisplayRouteSections } from "./util/routeSections";
import { toDisplayTrafficSectionProps } from "./util/displayTrafficSectionProps";
import { DisplayTrafficSectionProps, RouteSection, RouteSections } from "./types/routeSections";
import { buildDisplayRoutes } from "./util/routes";
import { DisplayRouteProps } from "./types/displayRoutes";
import { ShowRoutesOptions } from "./types/showRoutesOptions";
import { addLayers, updateLayersAndSource, waitUntilMapIsReady } from "../shared/mapUtils";
import { TomTomMap } from "../TomTomMap";
import { DisplayInstruction } from "./types/guidance";
import { toDisplayInstructionArrows, toDisplayInstructions } from "./util/guidance";
import { showFeaturesWithRouteSelection } from "./util/routeSelection";
import { instructionArrowIconImg } from "./resources";
import { defaultRouteLayersConfig } from "./layers/defaultConfig";
import { createLayersSpecs, mergeConfig } from "./util/config";
import { INSTRUCTION_ARROW_IMAGE_ID } from "./layers/guidanceLayers";

const SDK_HOSTED_IMAGES_URL_BASE = "https://plan.tomtom.com/resources/images/";

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
        config: RoutingModuleConfig = { routeLayers: defaultRouteLayersConfig }
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
            evChargingStations: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_EV_CHARGING_STATIONS_SOURCE_ID,
                layersSpecs.evChargingStations,
                false
            ),
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
                layersSpecs.vehicleRestricted,
                false
            ),
            instructionLines: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INSTRUCTIONS_SOURCE_ID,
                layersSpecs.instructionLines,
                false
            ),
            instructionArrows: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID,
                layersSpecs.instructionArrows,
                false
            )
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig): RoutingSourcesWithLayers {
        // TODO: displaying traffic and EV stops require traffic and poi assets in the style. Should we at least verify their existence and log a warning if not present?

        // loading of extra assets if not present in the map style:
        // TODO: bring waypoint assets into SDK as lightweight SVGs which we can add to style and personalize a bit (coloring)
        this.addImageIfNotExisting(WAYPOINT_START_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-start.png`);
        this.addImageIfNotExisting(WAYPOINT_STOP_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-stop.png`);
        this.addImageIfNotExisting(WAYPOINT_SOFT_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-soft.png`);
        this.addImageIfNotExisting(WAYPOINT_FINISH_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-finish.png`);

        this.addImageIfNotExisting(INSTRUCTION_ARROW_IMAGE_ID, instructionArrowIconImg);

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
            const newLayersSpecs = createLayersSpecs(mergedConfig?.routeLayers || defaultRouteLayersConfig);

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
            // set the correct visibility if there are new layers
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
            evChargingStations: this.sourcesWithLayers.evChargingStations.shownFeatures,
            tunnels: this.sourcesWithLayers.tunnels.shownFeatures,
            tollRoads: this.sourcesWithLayers.tollRoads.shownFeatures,
            instructionLines: this.sourcesWithLayers.instructionLines.shownFeatures,
            instructionArrows: this.sourcesWithLayers.instructionArrows.shownFeatures
        };

        this.initSourcesWithLayers();
        this._applyConfig(this.config);

        this.sourcesWithLayers.waypoints.show(previouslyShown.waypoints);
        this.sourcesWithLayers.routeLines.show(previouslyShown.routeLines);
        this.sourcesWithLayers.vehicleRestricted.show(previouslyShown.vehicleRestricted);
        this.sourcesWithLayers.incidents.show(previouslyShown.incidents);
        this.sourcesWithLayers.ferries.show(previouslyShown.ferries);
        this.sourcesWithLayers.evChargingStations.show(previouslyShown.evChargingStations);
        this.sourcesWithLayers.tunnels.show(previouslyShown.tunnels);
        this.sourcesWithLayers.tollRoads.show(previouslyShown.tollRoads);
        this.sourcesWithLayers.instructionLines.show(previouslyShown.instructionLines);
        this.sourcesWithLayers.instructionArrows.show(previouslyShown.instructionArrows);
    }

    private addImageIfNotExisting(imageID: string, image: string | HTMLImageElement) {
        if (!this.mapLibreMap.hasImage(imageID)) {
            if (typeof image === "string") {
                this.mapLibreMap.loadImage(image, (_, image) => {
                    // double-checking just in case of a race condition with overlapping init:
                    if (!this.mapLibreMap.hasImage(imageID)) {
                        this.mapLibreMap.addImage(imageID, image as HTMLImageElement);
                    }
                });
            } else {
                this.mapLibreMap.addImage(imageID, image);
            }
        }
    }

    /**
     * Shows the given routes on the map.
     * @param routes The routes to show.
     * @param options An optional selected index from the array of routes. Will make that route appear selected. Defaults to 0 (first/recommended route).
     */
    showRoutes(routes: Routes, options?: ShowRoutesOptions) {
        const displayRoutes = buildDisplayRoutes(routes, options?.selectedIndex);
        this.sourcesWithLayers.routeLines.show(displayRoutes);
        this.sourcesWithLayers.vehicleRestricted.show(buildDisplayRouteSections(displayRoutes, "vehicleRestricted"));
        this.sourcesWithLayers.incidents.show(
            buildDisplayRouteSections(displayRoutes, "traffic", toDisplayTrafficSectionProps)
        );
        this.sourcesWithLayers.evChargingStations.show(toDisplayChargingStations(displayRoutes));
        this.sourcesWithLayers.ferries.show(buildDisplayRouteSections(displayRoutes, "ferry"));
        this.sourcesWithLayers.tunnels.show(buildDisplayRouteSections(displayRoutes, "tunnel"));
        this.sourcesWithLayers.tollRoads.show(buildDisplayRouteSections(displayRoutes, "tollRoad"));
        this.sourcesWithLayers.instructionLines.show(toDisplayInstructions(displayRoutes));
        this.sourcesWithLayers.instructionArrows.show(toDisplayInstructionArrows(displayRoutes));
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
        this.sourcesWithLayers.evChargingStations.clear();
        this.sourcesWithLayers.tollRoads.clear();
        this.sourcesWithLayers.tunnels.clear();
        this.sourcesWithLayers.instructionLines.clear();
        this.sourcesWithLayers.instructionArrows.clear();
    }

    /**
     * Shows the currently rendered route with the given index as selected.
     * * De-selects the previously selected route, if applicable.
     * @param index The route index to select. Must be within the existing rendered routes.
     */
    selectRoute(index: number) {
        const updatedRoutes = buildDisplayRoutes(this.sourcesWithLayers.routeLines.shownFeatures, index);

        this.sourcesWithLayers.routeLines.show(updatedRoutes);
        // TODO: simply update route style instead of regenerating EV stations again
        this.sourcesWithLayers.evChargingStations.show(toDisplayChargingStations(updatedRoutes));
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.vehicleRestricted);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.incidents);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.ferries);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tollRoads);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tunnels);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionLines);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionArrows);
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
            evChargingStations: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.evChargingStations
            ),
            tollRoads: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tollRoads),
            tunnels: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tunnels),
            instructionLines: new EventsModule<DisplayInstruction>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.instructionLines
            )
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
