import type { Route, Routes, Waypoint, Waypoints } from "@anw/maps-sdk-js/core";
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    ROUTE_EV_CHARGING_STATIONS_SOURCE_ID,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_SOURCE_ID,
    ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID,
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
import { toDisplayChargingStations, toDisplayWaypoints } from "./util/waypointUtils";
import type { PlanningWaypoint } from "./types/planningWaypoint";
import type { RoutingLayersSpecs, RoutingModuleConfig, RoutingSourcesWithLayers } from "./types/routeModuleConfig";
import { buildDisplayRouteSections } from "./util/routeSections";
import { toDisplayTrafficSectionProps } from "./util/displayTrafficSectionProps";
import type { DisplayTrafficSectionProps, RouteSection, RouteSections } from "./types/routeSections";
import { buildDisplayRoutes, buildDisplayRouteSummaries } from "./util/routes";
import type { DisplayRouteProps, DisplayRouteSummaryProps } from "./types/displayRoutes";
import type { ShowRoutesOptions } from "./types/showRoutesOptions";
import { addImageIfNotExisting, addLayers, updateLayersAndSource, waitUntilMapIsReady } from "../shared/mapUtils";
import type { TomTomMap } from "../TomTomMap";
import type { DisplayInstruction } from "./types/guidance";
import { toDisplayInstructionArrows, toDisplayInstructions } from "./util/guidance";
import { showFeaturesWithRouteSelection } from "./util/routeSelection";
import { instructionArrowIconImg, summaryBubbleImageOptions, summaryMapBubbleImg, trafficImg } from "./resources";
import { defaultRouteLayersConfig } from "./layers/defaultConfig";
import { createLayersSpecs, withDefaults } from "./util/config";
import { INSTRUCTION_ARROW_IMAGE_ID } from "./layers/guidanceLayers";
import { DESELECTED_SUMMARY_POPUP_IMAGE_ID, SELECTED_SUMMARY_POPUP_IMAGE_ID } from "./layers/routeMainLineLayers";
import type { StyleImageMetadata } from "maplibre-gl";
import {
    DESELECTED_FOREGROUND_COLOR,
    MAJOR_DELAY_COLOR,
    MINOR_DELAY_LABEL_COLOR,
    MODERATE_DELAY_COLOR,
    UNKNOWN_DELAY_COLOR
} from "./layers/shared";
import {
    TRAFFIC_CLEAR_IMAGE_ID,
    TRAFFIC_MAJOR_IMAGE_ID,
    TRAFFIC_MINOR_IMAGE_ID,
    TRAFFIC_MODERATE_IMAGE_ID
} from "./layers/summaryBubbleLayers";

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
        super("geojson", map, config);
    }

    private createSourcesWithLayers(layersSpecs: RoutingLayersSpecs): RoutingSourcesWithLayers {
        return {
            mainLines: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, layersSpecs.mainLines, false),
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
            ),
            summaryBubbles: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID,
                layersSpecs.summaryBubbles,
                false
            )
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig): RoutingSourcesWithLayers {
        // TODO: displaying traffic requires traffic in the style. Should we at least verify their existence and log a warning if not present?

        this.layersSpecs = createLayersSpecs(withDefaults(config).routeLayers);
        const routingSourcesWithLayers: RoutingSourcesWithLayers = this.createSourcesWithLayers(this.layersSpecs);
        addLayers(
            Object.values(routingSourcesWithLayers).flatMap((source) => source._layerSpecs),
            this.mapLibreMap
        );

        const options = { pixelRatio: 2 };

        // loading of extra assets if not present in the map style:
        // TODO: bring waypoint assets into SDK as lightweight SVGs which we can add to style and personalize a bit (coloring)
        this.addImageIfNotExisting(WAYPOINT_START_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-start.png`, options);
        this.addImageIfNotExisting(WAYPOINT_STOP_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-stop.png`, options);
        this.addImageIfNotExisting(WAYPOINT_SOFT_IMAGE_ID, `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-soft.png`, options);
        this.addImageIfNotExisting(
            WAYPOINT_FINISH_IMAGE_ID,
            `${SDK_HOSTED_IMAGES_URL_BASE}waypoint-finish.png`,
            options
        );
        this.addImageIfNotExisting(INSTRUCTION_ARROW_IMAGE_ID, instructionArrowIconImg, options);
        this.addImageIfNotExisting(
            SELECTED_SUMMARY_POPUP_IMAGE_ID,
            summaryMapBubbleImg(/*FOREGROUND_COLOR*/ "white"),
            summaryBubbleImageOptions
        );
        this.addImageIfNotExisting(
            DESELECTED_SUMMARY_POPUP_IMAGE_ID,
            summaryMapBubbleImg(DESELECTED_FOREGROUND_COLOR),
            summaryBubbleImageOptions
        );
        this.addImageIfNotExisting(TRAFFIC_CLEAR_IMAGE_ID, trafficImg(UNKNOWN_DELAY_COLOR), options);
        this.addImageIfNotExisting(TRAFFIC_MAJOR_IMAGE_ID, trafficImg(MAJOR_DELAY_COLOR), options);
        this.addImageIfNotExisting(TRAFFIC_MODERATE_IMAGE_ID, trafficImg(MODERATE_DELAY_COLOR), options);
        this.addImageIfNotExisting(TRAFFIC_MINOR_IMAGE_ID, trafficImg(MINOR_DELAY_LABEL_COLOR), options);

        return routingSourcesWithLayers;
    }

    /**
     * @ignore
     */
    protected _applyConfig(config?: RoutingModuleConfig) {
        const mergedConfig = withDefaults(config);

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

        // Summary bubbles have dedicated sources and contain distance-units dependent text ...
        // ... so we need to re-show them if that config part changed:
        if (
            this.config?.distanceUnits != mergedConfig.distanceUnits &&
            this.sourcesWithLayers.summaryBubbles.shownFeatures.features.length
        ) {
            this.sourcesWithLayers.summaryBubbles.show(
                buildDisplayRouteSummaries(this.sourcesWithLayers.mainLines.shownFeatures, mergedConfig.distanceUnits!)
            );
        }

        return mergedConfig;
    }

    /**
     * @ignore
     */
    protected async restoreDataAndConfigImpl() {
        const previouslyShown = Object.entries(this.sourcesWithLayers)
            .map((entry) => ({
                [entry[0]]: entry[1].shownFeatures
            }))
            .reduce((acc, item) => ({ ...acc, ...item }), {}) as Record<keyof RoutingSourcesWithLayers, any>;

        this.initSourcesWithLayers();
        this._applyConfig(this.config);

        for (const key of Object.keys(previouslyShown) as (keyof RoutingSourcesWithLayers)[]) {
            this.sourcesWithLayers[key].show(previouslyShown[key]);
        }
    }

    private addImageIfNotExisting(
        imageID: string,
        image: string | HTMLImageElement,
        options?: Partial<StyleImageMetadata>
    ) {
        addImageIfNotExisting(this.mapLibreMap, imageID, image, options);
    }

    /**
     * Shows the given routes on the map.
     * @param routes The routes to show.
     * @param options An optional selected index from the array of routes. Will make that route appear selected. Defaults to 0 (first/recommended route).
     */
    async showRoutes(routes: Routes, options?: ShowRoutesOptions) {
        const displayRoutes = buildDisplayRoutes(routes, options?.selectedIndex);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.mainLines.show(displayRoutes);
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
        this.sourcesWithLayers.summaryBubbles.show(
            buildDisplayRouteSummaries(displayRoutes, this.config!.distanceUnits!)
        );
    }

    /**
     * Clears any previously shown routes from the map.
     * * If nothing was shown before, nothing happens.
     */
    async clearRoutes() {
        await this.waitUntilModuleReady();
        for (const key of Object.keys(this.sourcesWithLayers) as (keyof RoutingSourcesWithLayers)[]) {
            if (key !== "waypoints") {
                this.sourcesWithLayers[key as keyof RoutingSourcesWithLayers].clear();
            }
        }
    }

    /**
     * Shows the currently rendered route with the given index as selected.
     * * De-selects the previously selected route, if applicable.
     * @param index The route index to select. Must be within the existing rendered routes.
     */
    async selectRoute(index: number) {
        const updatedRoutes = buildDisplayRoutes(this.sourcesWithLayers.mainLines.shownFeatures, index);

        await this.waitUntilModuleReady();
        this.sourcesWithLayers.mainLines.show(updatedRoutes);
        // TODO: simply update route style instead of regenerating EV stations again
        this.sourcesWithLayers.evChargingStations.show(toDisplayChargingStations(updatedRoutes));
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.vehicleRestricted);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.incidents);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.ferries);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tollRoads);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tunnels);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionLines);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionArrows);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.summaryBubbles);
    }

    /**
     * Shows the given waypoints on the map.
     * @param waypointsLike The waypoint-like inputs to show.
     */
    async showWaypoints(waypointsLike: PlanningWaypoint[] | Waypoints) {
        const waypoints = Array.isArray(waypointsLike)
            ? toDisplayWaypoints(waypointsLike)
            : // FeatureCollection expected:
              toDisplayWaypoints(waypointsLike.features as PlanningWaypoint[]);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.show(waypoints);
    }

    /**
     * Clears any previously shown waypoints from the map.
     * * If nothing was shown before, nothing happens.
     */
    async clearWaypoints() {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.clear();
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return {
            mainLines: new EventsModule<Route<DisplayRouteProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.mainLines
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
            ),
            summaryBubbles: new EventsModule<DisplayRouteSummaryProps>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.summaryBubbles
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
