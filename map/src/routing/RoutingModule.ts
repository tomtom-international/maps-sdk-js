import type { Route, Routes, Waypoint, Waypoints } from '@cet/maps-sdk-js/core';
import { isEqual } from 'lodash-es';
import type { StyleImageMetadata } from 'maplibre-gl';
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
    WAYPOINTS_SOURCE_ID,
} from '../shared';
import { addImageIfNotExisting, addLayers, updateLayersAndSource, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { defaultRouteLayersConfig } from './layers/defaultConfig';
import { INSTRUCTION_ARROW_IMAGE_ID } from './layers/guidanceLayers';
import { DESELECTED_SUMMARY_POPUP_IMAGE_ID, SELECTED_SUMMARY_POPUP_IMAGE_ID } from './layers/routeMainLineLayers';
import { MAJOR_DELAY_COLOR, MINOR_DELAY_LABEL_COLOR, MODERATE_DELAY_COLOR, UNKNOWN_DELAY_COLOR } from './layers/shared';
import {
    TRAFFIC_CLEAR_IMAGE_ID,
    TRAFFIC_MAJOR_IMAGE_ID,
    TRAFFIC_MINOR_IMAGE_ID,
    TRAFFIC_MODERATE_IMAGE_ID,
} from './layers/summaryBubbleLayers';
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID,
} from './layers/waypointLayers';
import {
    instructionArrowIconImg,
    softWaypointIcon,
    summaryBubbleImageOptions,
    summaryMapBubbleImg,
    trafficImg,
    waypointFinishIcon,
    waypointIcon,
    waypointStartIcon,
} from './resources';
import type { DisplayRouteProps, DisplayRouteSummary } from './types/displayRoutes';
import type { DisplayInstruction } from './types/guidance';
import type { PlanningWaypoint } from './types/planningWaypoint';
import type { RoutingLayersSpecs, RoutingModuleConfig, RoutingSourcesWithLayers } from './types/routeModuleConfig';
import type { DisplayTrafficSectionProps, RouteSection, RouteSections } from './types/routeSections';
import type { ShowRoutesOptions } from './types/showOptions';
import type { WaypointDisplayProps } from './types/waypointDisplayProps';
import { createLayersSpecs, withDefaults } from './util/config';
import { toDisplayTrafficSectionProps } from './util/displayTrafficSectionProps';
import { toDisplayInstructionArrows, toDisplayInstructions } from './util/guidance';
import { toDisplayRouteSections } from './util/routeSections';
import { showFeaturesWithRouteSelection } from './util/routeSelection';
import { toDisplayRouteSummaries, toDisplayRoutes } from './util/routes';
import { toDisplayChargingStations, toDisplayWaypoints } from './util/waypointUtils';

/**
 * Routing Module for displaying routes and waypoints on the map.
 *
 * This module visualizes routing data from TomTom Routing API with full styling control
 * for route lines, waypoints, traffic sections, and turn-by-turn guidance.
 *
 * @remarks
 * **Features:**
 * - Display single or multiple routes with selection
 * - Customizable route styling (colors, widths, patterns)
 * - Waypoint markers (start, stops, destination)
 * - Route sections (ferries, tolls, tunnels, traffic)
 * - Turn-by-turn guidance visualization
 * - Route summary bubbles with distance/time
 * - EV charging station markers
 * - Interactive route selection
 *
 * **Data Sources:**
 * - Compatible with TomTom Routing API responses
 * - Supports custom route data matching the Routes interface
 * - Multiple route visualization for alternatives
 *
 * @example
 * Basic route display:
 * ```typescript
 * import { RoutingModule } from '@tomtom-international/maps-sdk-js/map';
 * import { calculateRoute } from '@tomtom-international/maps-sdk-js/services';
 *
 * // Calculate route
 * const result = await calculateRoute({
 *   key: 'your-api-key',
 *   geoInputs: [
 *     [4.9041, 52.3676],  // Amsterdam
 *     [4.4777, 51.9244]   // Rotterdam
 *   ]
 * });
 *
 * // Display on map
 * const routing = await RoutingModule.init(map);
 * await routing.showRoutes(result);
 * await routing.showWaypoints(result.routes[0].legs[0].points);
 * ```
 *
 * @example
 * Multiple routes with interaction:
 * ```typescript
 * // Calculate route with alternatives
 * const result = await calculateRoute({
 *   key: 'your-api-key',
 *   geoInputs: [[4.9, 52.3], [4.5, 51.9]],
 *   maxAlternatives: 2
 * });
 *
 * const routing = await RoutingModule.init(map);
 * await routing.showRoutes(result);
 *
 * // Handle route clicks to switch selection
 * routing.events.mainLines.on('click', async (feature) => {
 *   const routeIndex = feature.properties.routeIndex;
 *   await routing.selectRoute(routeIndex);
 * });
 * ```
 *
 * @example
 * Custom styling:
 * ```typescript
 * import { defaultRouteLayersConfig } from '@tomtom-international/maps-sdk-js/map';
 *
 * const routing = await RoutingModule.init(map, {
 *   layers: {
 *     ...defaultRouteLayersConfig,
 *     mainLines: {
 *       ...defaultRouteLayersConfig.mainLines,
 *       selected: {
 *         ...defaultRouteLayersConfig.mainLines.selected,
 *         lineColor: '#FF5733',
 *         lineWidth: 8
 *       }
 *     }
 *   }
 * });
 *
 * await routing.showRoutes(result);
 * ```
 *
 * @see [Routes Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/routes)
 *
 * @group Map Modules
 * @category Routing
 */
export class RoutingModule extends AbstractMapModule<RoutingSourcesWithLayers, RoutingModuleConfig> {
    private layersSpecs!: RoutingLayersSpecs;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     *
     * @remarks
     * **Configuration Options:**
     * - `displayUnits`: Distance units (metric/imperial)
     * - `waypointsSource`: Waypoint entry point options
     * - `layers`: Complete layer styling configuration
     *
     * **Default Styling:**
     * If no custom layers are provided, uses {@link defaultRouteLayersConfig}
     *
     * @example
     * Default initialization:
     * ```typescript
     * const routing = await RoutingModule.init(map);
     * ```
     *
     * @example
     * With custom configuration:
     * ```typescript
     * const routing = await RoutingModule.init(map, {
     *   displayUnits: 'imperial',
     *   waypointsSource: {
     *     entryPoints: 'main-when-available'
     *   }
     * });
     * ```
     */
    static async init(
        tomtomMap: TomTomMap,
        config: RoutingModuleConfig = { layers: defaultRouteLayersConfig },
    ): Promise<RoutingModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new RoutingModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: RoutingModuleConfig) {
        super('geojson', map, config);
    }

    private createSourcesWithLayers(layersSpecs: RoutingLayersSpecs): RoutingSourcesWithLayers {
        return {
            mainLines: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTES_SOURCE_ID, layersSpecs.mainLines, false),
            waypoints: new GeoJSONSourceWithLayers(this.mapLibreMap, WAYPOINTS_SOURCE_ID, layersSpecs.waypoints, false),
            incidents: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INCIDENTS_SOURCE_ID,
                layersSpecs.incidents,
                false,
            ),
            ferries: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_FERRIES_SOURCE_ID, layersSpecs.ferries, false),
            evChargingStations: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_EV_CHARGING_STATIONS_SOURCE_ID,
                layersSpecs.evChargingStations,
                false,
            ),
            tollRoads: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_TOLL_ROADS_SOURCE_ID,
                layersSpecs.tollRoads,
                false,
            ),
            tunnels: new GeoJSONSourceWithLayers(this.mapLibreMap, ROUTE_TUNNELS_SOURCE_ID, layersSpecs.tunnels, false),
            vehicleRestricted: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
                layersSpecs.vehicleRestricted,
                false,
            ),
            instructionLines: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INSTRUCTIONS_SOURCE_ID,
                layersSpecs.instructionLines,
                false,
            ),
            instructionArrows: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID,
                layersSpecs.instructionArrows,
                false,
            ),
            summaryBubbles: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID,
                layersSpecs.summaryBubbles,
                false,
            ),
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig): RoutingSourcesWithLayers {
        // TODO: displaying traffic requires traffic in the style. Should we at least verify their existence and log a warning if not present?

        this.layersSpecs = createLayersSpecs(withDefaults(config).layers);
        const routingSourcesWithLayers: RoutingSourcesWithLayers = this.createSourcesWithLayers(this.layersSpecs);
        addLayers(
            Object.values(routingSourcesWithLayers).flatMap((source) => source._layerSpecs),
            this.mapLibreMap,
        );

        const options: Partial<StyleImageMetadata> = { pixelRatio: 2 };

        // loading of extra assets if not present in the map style:
        this.addImageIfNotExisting(WAYPOINT_START_IMAGE_ID, waypointStartIcon(), options);
        this.addImageIfNotExisting(WAYPOINT_STOP_IMAGE_ID, waypointIcon(), options);
        this.addImageIfNotExisting(WAYPOINT_SOFT_IMAGE_ID, softWaypointIcon(), options);
        this.addImageIfNotExisting(WAYPOINT_FINISH_IMAGE_ID, waypointFinishIcon(), options);
        this.addImageIfNotExisting(INSTRUCTION_ARROW_IMAGE_ID, instructionArrowIconImg, options);
        this.addImageIfNotExisting(
            SELECTED_SUMMARY_POPUP_IMAGE_ID,
            summaryMapBubbleImg('white'),
            summaryBubbleImageOptions,
        );
        this.addImageIfNotExisting(
            DESELECTED_SUMMARY_POPUP_IMAGE_ID,
            summaryMapBubbleImg('#EEEEEE'),
            summaryBubbleImageOptions,
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
            const newLayersSpecs = createLayersSpecs(mergedConfig?.layers ?? defaultRouteLayersConfig);

            // here we assume that keys for layer specs and sources are the same, please keep it that way to simplify the logic
            Object.keys(newLayersSpecs).forEach((layersSpecs) => {
                updateLayersAndSource(
                    newLayersSpecs[layersSpecs as keyof RoutingLayersSpecs],
                    this.layersSpecs[layersSpecs as keyof RoutingLayersSpecs],
                    this.sourcesWithLayers[layersSpecs as keyof RoutingSourcesWithLayers],
                    this.mapLibreMap,
                );
            });
            // we need to add layers correctly
            const listOfSources = Object.values(this.sourcesWithLayers) as GeoJSONSourceWithLayers[];
            addLayers(
                listOfSources.flatMap((source) => source._layerSpecs),
                this.mapLibreMap,
            );
            // set the correct visibility if there are new layers
            listOfSources.forEach((source) => source.setLayersVisible(!!source.shownFeatures.features.length));
            this.layersSpecs = newLayersSpecs;
        }

        // Summary bubbles have dedicated sources and contain distance-units dependent text ...
        // ... so we need to re-show them if that config part changed:
        if (
            !isEqual(this.config?.displayUnits, mergedConfig.displayUnits) &&
            this.sourcesWithLayers.summaryBubbles.shownFeatures.features.length
        ) {
            this.sourcesWithLayers.summaryBubbles.show(
                toDisplayRouteSummaries(this.sourcesWithLayers.mainLines.shownFeatures, mergedConfig.displayUnits),
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
                [entry[0]]: entry[1].shownFeatures,
            }))
            .reduce((acc, item) => ({ ...acc, ...item }), {}) as Record<keyof RoutingSourcesWithLayers, any>;

        this.initSourcesWithLayers();
        this._applyConfig(this.config);

        for (const key of Object.keys(previouslyShown) as (keyof RoutingSourcesWithLayers)[]) {
            this.sourcesWithLayers[key].show(previouslyShown[key]);
        }
    }

    private addImageIfNotExisting(
        imageId: string,
        image: string | HTMLImageElement,
        options?: Partial<StyleImageMetadata>,
    ) {
        addImageIfNotExisting(this.mapLibreMap, imageId, image, options);
    }

    /**
     * Displays the given routes on the map.
     *
     * @param routes - Route data from Routing API or custom routes.
     * @param options - Optional configuration for route selection and display.
     * @param options.selectedIndex - Index of the route to display as selected (default: 0).
     *
     * @remarks
     * **Behavior:**
     * - Replaces any previously shown routes
     * - Shows all route-related features: lines, sections, summaries, guidance
     * - First route is selected by default (appears more prominent)
     * - Waypoints are NOT shown automatically (use {@link showWaypoints})
     *
     * **Route Features:**
     * - Main route lines (selected and deselected styles)
     * - Traffic sections with delays
     * - Ferry, tunnel, and toll sections
     * - EV charging stations (for EV routes)
     * - Turn-by-turn instruction lines and arrows
     * - Summary bubbles with distance/time/traffic info
     *
     * @example
     * Show single route:
     * ```typescript
     * await routing.showRoutes(response.routes);
     * ```
     *
     * @example
     * Show multiple routes with specific selection:
     * ```typescript
     * await routing.showRoutes(response.routes, { selectedIndex: 1 });
     * ```
     *
     * @example
     * Complete routing workflow:
     * ```typescript
     * import { routing as routingAPI } from '@tomtom-international/maps-sdk-js/services';
     *
     * // Calculate route
     * const response = await routingAPI.calculateRoute({
     *   locations: [[4.9, 52.4], [4.5, 51.9]],
     *   traffic: true,
     *   travelMode: 'car'
     * });
     *
     * // Display on map
     * const routing = await RoutingModule.init(map);
     * await routing.showRoutes(response.routes);
     * await routing.showWaypoints(response.routes[0].legs[0].points);
     * ```
     */
    async showRoutes(routes: Routes, options?: ShowRoutesOptions) {
        const displayRoutes = toDisplayRoutes(routes, options?.selectedIndex);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.mainLines.show(displayRoutes);
        this.sourcesWithLayers.vehicleRestricted.show(toDisplayRouteSections(displayRoutes, 'vehicleRestricted'));
        this.sourcesWithLayers.incidents.show(
            toDisplayRouteSections(displayRoutes, 'traffic', toDisplayTrafficSectionProps),
        );
        this.sourcesWithLayers.evChargingStations.show(toDisplayChargingStations(displayRoutes));
        this.sourcesWithLayers.ferries.show(toDisplayRouteSections(displayRoutes, 'ferry'));
        this.sourcesWithLayers.tunnels.show(toDisplayRouteSections(displayRoutes, 'tunnel'));
        this.sourcesWithLayers.tollRoads.show(toDisplayRouteSections(displayRoutes, 'toll'));
        this.sourcesWithLayers.instructionLines.show(toDisplayInstructions(displayRoutes));
        this.sourcesWithLayers.instructionArrows.show(toDisplayInstructionArrows(displayRoutes));
        this.sourcesWithLayers.summaryBubbles.show(toDisplayRouteSummaries(displayRoutes, this.config?.displayUnits));
    }

    /**
     * Clears any previously shown routes from the map.
     *
     * @remarks
     * - Clears all route-related layers (lines, sections, guidance, summaries)
     * - Does NOT clear waypoints (use {@link clearWaypoints})
     * - Module remains initialized and ready for new routes
     *
     * @example
     * ```typescript
     * await routing.clearRoutes();
     * ```
     */
    async clearRoutes() {
        await this.waitUntilModuleReady();
        for (const key of Object.keys(this.sourcesWithLayers) as (keyof RoutingSourcesWithLayers)[]) {
            if (key !== 'waypoints') {
                this.sourcesWithLayers[key as keyof RoutingSourcesWithLayers].clear();
            }
        }
    }

    /**
     * Changes which route appears as selected.
     *
     * @param index - Zero-based index of the route to select.
     *
     * @remarks
     * **Visual Changes:**
     * - Selected route appears more prominent (thicker, brighter)
     * - Previously selected route becomes deselected style
     * - Updates all route-related features (sections, guidance)
     *
     * **Requirements:**
     * - Route must already be displayed via {@link showRoutes}
     * - Index must be within range of displayed routes
     *
     * @example
     * ```typescript
     * // Show multiple routes
     * await routing.showRoutes(routes);
     *
     * // User clicks alternative route
     * await routing.selectRoute(1);
     *
     * // Switch back to first route
     * await routing.selectRoute(0);
     * ```
     */
    async selectRoute(index: number) {
        const updatedRoutes = toDisplayRoutes(this.sourcesWithLayers.mainLines.shownFeatures, index);

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
     * @param waypoints The waypoint-like inputs to show.
     */
    async showWaypoints(waypoints: PlanningWaypoint[] | Waypoints) {
        const displayWaypoints = Array.isArray(waypoints)
            ? toDisplayWaypoints(waypoints, this.config?.waypointsSource)
            : // FeatureCollection expected:
              toDisplayWaypoints(waypoints.features as PlanningWaypoint[], this.config?.waypointsSource);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.show(displayWaypoints);
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
                this.sourcesWithLayers.mainLines,
            ),
            waypoints: new EventsModule<Waypoint<WaypointDisplayProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.waypoints,
            ),
            vehicleRestricted: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.vehicleRestricted,
            ),
            incidents: new EventsModule<RouteSections<DisplayTrafficSectionProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.incidents,
            ),
            ferries: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.ferries),
            evChargingStations: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.evChargingStations,
            ),
            tollRoads: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tollRoads),
            tunnels: new EventsModule<RouteSection>(this.tomtomMap._eventsProxy, this.sourcesWithLayers.tunnels),
            instructionLines: new EventsModule<DisplayInstruction>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.instructionLines,
            ),
            summaryBubbles: new EventsModule<DisplayRouteSummary>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.summaryBubbles,
            ),
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
