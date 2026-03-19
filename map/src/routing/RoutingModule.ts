import type { Route, Routes, Waypoint, Waypoints } from '@tomtom-org/maps-sdk/core';
import { isEqual } from 'lodash-es';
import type { StyleImageMetadata } from 'maplibre-gl';
import {
    AbstractMapModule,
    EventsModule,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    SVGIconStyleOptions,
} from '../shared';
import { suffixNumber } from '../shared/layers/utils';
import { addLayers, addOrUpdateImage, updateLayersAndSource, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
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
import type { RoutingModuleConfig } from './types/routeModuleConfig';
import type { DisplayTrafficSectionProps, RouteSection } from './types/routeSections';
import type { RoutingLayersSpecs, RoutingSourcesWithLayers } from './types/routingSourcesAndLayers';
import type { ShowRoutesOptions } from './types/showOptions';
import type { WaypointDisplayProps } from './types/waypointDisplayProps';
import { createLayersSpecs, routeModuleConfigWithDefaults } from './util/config';
import { toDisplayChargingStops } from './util/displayChargingStops';
import { toDisplayTrafficSectionProps } from './util/displayTrafficSectionProps';
import { toDisplayWaypoints } from './util/displayWaypoints';
import { toDisplayInstructionArrows, toDisplayInstructions } from './util/guidance';
import { toDisplayRouteSections } from './util/routeSections';
import { showFeaturesWithRouteSelection } from './util/routeSelection';
import { toDisplayRouteSummaries, toDisplayRoutes } from './util/routes';

/**
 * Map module for displaying and managing route visualizations.
 *
 * The RoutingModule provides comprehensive functionality for displaying routes on the map,
 * including route lines, alternative routes, turn-by-turn guidance, and interactive waypoints.
 * It integrates seamlessly with the TomTom Routing API.
 *
 * @remarks
 * **Features:**
 * - Display route lines with customizable styling
 * - Show alternative routes with different styling
 * - Interactive waypoint markers (drag, add, remove)
 * - Turn-by-turn guidance instructions
 * - Route section highlighting
 * - Distance and duration information
 * - Support for multiple routes simultaneously
 *
 * **Common Use Cases:**
 * - Turn-by-turn navigation displays
 * - Route planning and comparison
 * - Multi-stop route optimization
 * - Interactive route editing
 * - Fleet management route visualization
 *
 * @example
 * ```typescript
 * // Create the module
 * const routingModule = await RoutingModule.getInstance(map, {
 *   displayUnits: {
 *     distance: { type: 'metric' }
 *   }
 * });
 *
 * // Calculate and display a route
 * const result = await calculateRoute({
 *   key: 'your-api-key',
 *   locations: [
 *     [4.9041, 52.3676],  // Amsterdam
 *     [4.4777, 51.9244]   // Rotterdam
 *   ],
 *   routeOptions: {
 *     travelMode: 'car',
 *     routeType: 'fastest'
 *   }
 * });
 *
 * await routingModule.showRoutes(result);
 * ```
 *
 * @see [Routing Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/routing)
 *
 * @group Routing
 */
export class RoutingModule extends AbstractMapModule<RoutingSourcesWithLayers, RoutingModuleConfig> {
    private static lastInstanceIndex = -1;
    private layersSpecs!: RoutingLayersSpecs;
    private layerIDPrefix!: string;
    /**
     * The index of this instance, to generate unique source and layer IDs.
     * * Starts with 0 and each instance increments it by one.
     * @private
     */
    private instanceIndex!: number;

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
     * If no custom layers are provided, uses {@link defaultRoutingLayers}.
     *
     * @example
     * Default initialization:
     * ```typescript
     * const routingModule = await RoutingModule.get(map);
     * ```
     *
     * @example
     * With custom configuration:
     * ```typescript
     * const routingModule = await RoutingModule.get(map, {
     *   displayUnits: 'imperial',
     *   waypointsSource: {
     *     entryPoints: 'main-when-available'
     *   }
     * });
     * ```
     */
    static async get(tomtomMap: TomTomMap, config?: RoutingModuleConfig): Promise<RoutingModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new RoutingModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: RoutingModuleConfig) {
        super('geojson', map, config);
    }

    private createSourcesWithLayers(layersSpecs: RoutingLayersSpecs): RoutingSourcesWithLayers {
        const sourcePrefix = suffixNumber('routes', this.instanceIndex);
        return {
            mainLines: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-mainLines`,
                layersSpecs.mainLines,
                false,
            ),
            waypoints: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-waypoints`,
                layersSpecs.waypoints,
                false,
            ),
            incidents: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-incidents`,
                layersSpecs.incidents,
                false,
            ),
            ferries: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-ferries`,
                layersSpecs.ferries,
                false,
            ),
            chargingStops: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-chargingStops`,
                layersSpecs.chargingStops,
                false,
            ),
            tollRoads: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-tollRoads`,
                layersSpecs.tollRoads,
                false,
            ),
            tunnels: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-tunnels`,
                layersSpecs.tunnels,
                false,
            ),
            vehicleRestricted: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-vehicleRestricted`,
                layersSpecs.vehicleRestricted,
                false,
            ),
            instructionLines: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-instructionLines`,
                layersSpecs.instructionLines,
                false,
            ),
            instructionArrows: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-instructionArrows`,
                layersSpecs.instructionArrows,
                false,
            ),
            summaryBubbles: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-summaryBubbles`,
                layersSpecs.summaryBubbles,
                false,
            ),
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig, restore?: boolean): RoutingSourcesWithLayers {
        // Only increment the instance index for new instances, not for restore operations
        if (!restore) {
            RoutingModule.lastInstanceIndex++;
            this.instanceIndex = RoutingModule.lastInstanceIndex;
            this.layerIDPrefix = suffixNumber('routes', this.instanceIndex);
        }

        this.layersSpecs = createLayersSpecs(
            routeModuleConfigWithDefaults(config, this.layerIDPrefix, this.instanceIndex).layers,
            this.layerIDPrefix,
        );
        const routingSourcesWithLayers: RoutingSourcesWithLayers = this.createSourcesWithLayers(this.layersSpecs);
        addLayers(
            Object.values(routingSourcesWithLayers).flatMap((source) => source._layerSpecs),
            this.mapLibreMap,
        );

        const svgIconOptions: SVGIconStyleOptions = {
            // first comes the main theme fill color, if any:
            fillColor: config?.theme?.mainColor,
            // then come any icon style configs for the waypoint icons, if any:
            ...config?.waypoints?.icon?.style,
        };
        const options: Partial<StyleImageMetadata> = { pixelRatio: 2 };

        // Generate instance-specific image IDs to support multiple RoutingModule instances
        const waypointStartImageId = suffixNumber(WAYPOINT_START_IMAGE_ID, this.instanceIndex);
        const waypointStopImageId = suffixNumber(WAYPOINT_STOP_IMAGE_ID, this.instanceIndex);
        const waypointSoftImageId = suffixNumber(WAYPOINT_SOFT_IMAGE_ID, this.instanceIndex);
        const waypointFinishImageId = suffixNumber(WAYPOINT_FINISH_IMAGE_ID, this.instanceIndex);
        const instructionArrowImageId = suffixNumber(INSTRUCTION_ARROW_IMAGE_ID, this.instanceIndex);
        const selectedSummaryPopupImageId = suffixNumber(SELECTED_SUMMARY_POPUP_IMAGE_ID, this.instanceIndex);
        const deselectedSummaryPopupImageId = suffixNumber(DESELECTED_SUMMARY_POPUP_IMAGE_ID, this.instanceIndex);
        const trafficClearImageId = suffixNumber(TRAFFIC_CLEAR_IMAGE_ID, this.instanceIndex);
        const trafficMajorImageId = suffixNumber(TRAFFIC_MAJOR_IMAGE_ID, this.instanceIndex);
        const trafficModerateImageId = suffixNumber(TRAFFIC_MODERATE_IMAGE_ID, this.instanceIndex);
        const trafficMinorImageId = suffixNumber(TRAFFIC_MINOR_IMAGE_ID, this.instanceIndex);

        // loading of extra assets if not present in the map style:
        this.addImageIfNotExisting(waypointStartImageId, waypointStartIcon(svgIconOptions), options);
        this.addImageIfNotExisting(waypointStopImageId, waypointIcon(undefined, svgIconOptions), options);
        this.addImageIfNotExisting(waypointSoftImageId, softWaypointIcon(), options);
        this.addImageIfNotExisting(waypointFinishImageId, waypointFinishIcon(svgIconOptions), options);
        this.addImageIfNotExisting(instructionArrowImageId, instructionArrowIconImg, options);
        this.addImageIfNotExisting(
            selectedSummaryPopupImageId,
            summaryMapBubbleImg('white'),
            summaryBubbleImageOptions,
        );
        this.addImageIfNotExisting(
            deselectedSummaryPopupImageId,
            summaryMapBubbleImg('#EEEEEE'),
            summaryBubbleImageOptions,
        );
        this.addImageIfNotExisting(trafficClearImageId, trafficImg(UNKNOWN_DELAY_COLOR), options);
        this.addImageIfNotExisting(trafficMajorImageId, trafficImg(MAJOR_DELAY_COLOR), options);
        this.addImageIfNotExisting(trafficModerateImageId, trafficImg(MODERATE_DELAY_COLOR), options);
        this.addImageIfNotExisting(trafficMinorImageId, trafficImg(MINOR_DELAY_LABEL_COLOR), options);

        // If we have custom icons, ensure they're added to the map style:
        for (const customChargingStopIcon of config?.chargingStops?.icon?.customIcons ?? []) {
            this.addImageIfNotExisting(customChargingStopIcon.id, customChargingStopIcon.image as string, {
                pixelRatio: customChargingStopIcon.pixelRatio ?? 2,
            });
        }

        return routingSourcesWithLayers;
    }

    /**
     * @ignore
     */
    protected _applyConfig(config?: RoutingModuleConfig) {
        const mergedConfig = routeModuleConfigWithDefaults(config, this.layerIDPrefix, this.instanceIndex);

        // If there was already some config set, we must update the changes:
        if (this.config) {
            // replace existing configuration with new one
            const newLayersSpecs = createLayersSpecs(mergedConfig.layers, this.layerIDPrefix);

            // here we assume that keys for layer specs and sources are the same, please keep it that way to simplify the logic
            Object.keys(newLayersSpecs).forEach((layersSpecID) => {
                const id = layersSpecID as keyof RoutingSourcesWithLayers;
                updateLayersAndSource(
                    newLayersSpecs[id],
                    this.layersSpecs[id],
                    this.sourcesWithLayers[id],
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

        // Update waypoint icon images if mainColor changed
        const mainColorChanged = config?.theme?.mainColor !== this.config?.theme?.mainColor;
        if (mainColorChanged) {
            const svgIconOptions: SVGIconStyleOptions = {
                fillColor: config?.theme?.mainColor,
                ...config?.waypoints?.icon?.style,
            };
            const options: Partial<StyleImageMetadata> = { pixelRatio: 2 };
            addOrUpdateImage(
                'add-or-update',
                suffixNumber(WAYPOINT_START_IMAGE_ID, this.instanceIndex),
                waypointStartIcon(svgIconOptions),
                this.mapLibreMap,
                options,
            );
            addOrUpdateImage(
                'add-or-update',
                suffixNumber(WAYPOINT_STOP_IMAGE_ID, this.instanceIndex),
                waypointIcon(undefined, svgIconOptions),
                this.mapLibreMap,
                options,
            );
            addOrUpdateImage(
                'add-or-update',
                suffixNumber(WAYPOINT_FINISH_IMAGE_ID, this.instanceIndex),
                waypointFinishIcon(svgIconOptions),
                this.mapLibreMap,
                options,
            );
        }

        // Summary bubbles have dedicated sources and contain distance-units dependent text ...
        // ... so we need to re-show or clear them if relevant config parts changed:
        const summaryBubblesVisible = mergedConfig.summaryBubbles?.visible !== false;
        const visibilityChanged = !isEqual(this.config?.summaryBubbles?.visible, mergedConfig.summaryBubbles?.visible);
        const displayUnitsChanged = !isEqual(this.config?.displayUnits, mergedConfig.displayUnits);
        const hasSummaryBubbles = this.sourcesWithLayers.summaryBubbles.shownFeatures.features.length > 0;
        const hasRoutes = this.sourcesWithLayers.mainLines.shownFeatures.features.length > 0;

        if (!summaryBubblesVisible && visibilityChanged) {
            this.sourcesWithLayers.summaryBubbles.clear();
        } else if (
            summaryBubblesVisible &&
            ((visibilityChanged && hasRoutes) || (displayUnitsChanged && hasSummaryBubbles))
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
    protected restoreDataAndConfigImpl() {
        const previouslyShown = Object.entries(this.sourcesWithLayers)
            .map((entry) => ({
                [entry[0]]: entry[1].shownFeatures,
            }))
            .reduce((acc, item) => ({ ...acc, ...item }), {}) as Record<keyof RoutingSourcesWithLayers, any>;

        this.initSourcesWithLayers(this.config, true);
        this._applyConfig(this.config);

        for (const key of Object.keys(previouslyShown) as (keyof RoutingSourcesWithLayers)[]) {
            this.sourcesWithLayers[key].show(previouslyShown[key]);
        }
    }

    private addImageIfNotExisting(
        imageId: string,
        image: string | HTMLImageElement,
        options: Partial<StyleImageMetadata> | undefined,
    ) {
        addOrUpdateImage('if-not-in-sprite', imageId, image, this.mapLibreMap, options);
    }

    /**
     * Displays the given routes on the map.
     *
     * @param routes - Route data from Routing API or custom routes.
     * @param options - Optional configuration for route selection and display.
     * @param options.selectedIndex - Index of the route to display as selected (default: 0).
     *
     * @remarks
     * **Waypoints are NOT shown by this method.**
     * Route lines are drawn but start/stop/destination markers are not. To display waypoint
     * markers, call {@link showWaypoints} separately. Alternatively, use
     * {@link PlacesModule} to display waypoints as fully customizable place markers.
     *
     * **Behavior:**
     * - Replaces any previously shown routes
     * - Shows all route-related features: lines, sections, summaries, guidance
     * - First route is selected by default (appears more prominent)
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
     * Show a route (no waypoint markers):
     * ```typescript
     * await routing.showRoutes(response.routes);
     * // Waypoint markers are NOT shown — call showWaypoints() to add them
     * ```
     *
     * @example
     * Show routes and waypoint markers:
     * ```typescript
     * const locations = [[4.9, 52.4], [4.5, 51.9]];
     * const response = await calculateRoute({ locations });
     * await routing.showRoutes(response.routes);
     * await routing.showWaypoints(locations); // Show start/destination markers separately
     * ```
     *
     * @example
     * Show multiple routes with specific selection:
     * ```typescript
     * await routing.showRoutes(response.routes, { selectedIndex: 1 });
     * ```
     */
    async showRoutes(routes: Route | Routes, options?: ShowRoutesOptions) {
        const displayRoutes = toDisplayRoutes(routes, options?.selectedIndex);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.mainLines.show(displayRoutes);
        this.sourcesWithLayers.vehicleRestricted.show(toDisplayRouteSections(displayRoutes, 'vehicleRestricted'));
        this.sourcesWithLayers.incidents.show(
            toDisplayRouteSections(displayRoutes, 'traffic', toDisplayTrafficSectionProps),
        );
        this.sourcesWithLayers.chargingStops.show(toDisplayChargingStops(displayRoutes, this.config));
        this.sourcesWithLayers.ferries.show(toDisplayRouteSections(displayRoutes, 'ferry'));
        this.sourcesWithLayers.tunnels.show(toDisplayRouteSections(displayRoutes, 'tunnel'));
        this.sourcesWithLayers.tollRoads.show(toDisplayRouteSections(displayRoutes, 'toll'));
        this.sourcesWithLayers.instructionLines.show(toDisplayInstructions(displayRoutes));
        this.sourcesWithLayers.instructionArrows.show(toDisplayInstructionArrows(displayRoutes));
        if (this.config?.summaryBubbles?.visible !== false) {
            this.sourcesWithLayers.summaryBubbles.show(
                toDisplayRouteSummaries(displayRoutes, this.config?.displayUnits),
            );
        } else {
            this.sourcesWithLayers.summaryBubbles.clear();
        }
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
     * await routingModule.showRoutes(routes);
     *
     * // User clicks alternative route
     * await routingModule.selectRoute(1);
     *
     * // Switch back to first route
     * await routingModule.selectRoute(0);
     * ```
     */
    async selectRoute(index: number) {
        const updatedRoutes = toDisplayRoutes(this.sourcesWithLayers.mainLines.shownFeatures, index);

        await this.waitUntilModuleReady();
        this.sourcesWithLayers.mainLines.show(updatedRoutes);
        // TODO: simply update route style instead of regenerating EV stations again
        this.sourcesWithLayers.chargingStops.show(toDisplayChargingStops(updatedRoutes, this.config));
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
     * Displays waypoint markers (start, stop, and destination pins) on the map.
     *
     * @param waypoints - An array of planning waypoints or a `Waypoints` FeatureCollection.
     *
     * @remarks
     * Waypoint markers are **not** shown by {@link showRoutes} — this method must be called
     * separately to display them. For more control over marker appearance and behavior,
     * consider using {@link PlacesModule} to render waypoints as place markers instead.
     *
     * @example
     * Show routes and then waypoints:
     * ```typescript
     * const locations = [[4.9041, 52.3676], [4.4777, 51.9244]];
     * const response = await calculateRoute({ locations });
     * await routingModule.showRoutes(response.routes);
     * await routingModule.showWaypoints(locations); // Must be called separately
     * ```
     */
    async showWaypoints(waypoints: PlanningWaypoint[] | Waypoints) {
        const displayWaypoints = Array.isArray(waypoints)
            ? toDisplayWaypoints(waypoints, this.config?.waypoints, this.instanceIndex)
            : // FeatureCollection expected:
              toDisplayWaypoints(waypoints.features as PlanningWaypoint[], this.config?.waypoints, this.instanceIndex);
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.show(displayWaypoints);
    }

    /**
     * Clears any previously shown waypoints from the map.
     * If nothing was shown before, nothing happens.
     */
    async clearWaypoints() {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.clear();
    }

    /**
     * Returns the currently shown routes and waypoints.
     *
     * @returns An object containing all currently displayed routing data.
     *
     * @remarks
     * Returns the exact data that was passed to the `showRoutes()` and `showWaypoints()` methods.
     *
     * **Returned Data:**
     * - `mainLines`: Main route lines (selected and alternative)
     * - `waypoints`: Route waypoints (start, stops, finish)
     * - `incidents`: Traffic incidents on routes
     * - `ferries`: Ferry sections
     * - `chargingStops`: EV charging stations
     * - `tollRoads`: Toll road sections
     * - `tunnels`: Tunnel sections
     * - `vehicleRestricted`: Vehicle-restricted sections
     * - `instructionLines`: Turn-by-turn instruction lines
     * - `instructionArrows`: Instruction arrow markers
     * - `summaryBubbles`: Route summary popups
     *
     * @example
     * ```typescript
     * const shown = routingModule.getShown();
     * console.log(`Showing ${shown.mainLines.features.length} routes`);
     * console.log(`Showing ${shown.waypoints.features.length} waypoints`);
     * console.log(`Showing ${shown.chargingStops.features.length} charging stops`);
     * ```
     *
     * @example
     * Check if any routes are displayed:
     * ```typescript
     * const shown = routingModule.getShown();
     * if (shown.mainLines.features.length > 0) {
     *   console.log('Routes are displayed');
     * } else {
     *   console.log('No routes displayed');
     * }
     * ```
     */
    getShown() {
        return {
            mainLines: this.sourcesWithLayers.mainLines.shownFeatures,
            waypoints: this.sourcesWithLayers.waypoints.shownFeatures,
            incidents: this.sourcesWithLayers.incidents.shownFeatures,
            ferries: this.sourcesWithLayers.ferries.shownFeatures,
            chargingStops: this.sourcesWithLayers.chargingStops.shownFeatures,
            tollRoads: this.sourcesWithLayers.tollRoads.shownFeatures,
            tunnels: this.sourcesWithLayers.tunnels.shownFeatures,
            vehicleRestricted: this.sourcesWithLayers.vehicleRestricted.shownFeatures,
            instructionLines: this.sourcesWithLayers.instructionLines.shownFeatures,
            instructionArrows: this.sourcesWithLayers.instructionArrows.shownFeatures,
            summaryBubbles: this.sourcesWithLayers.summaryBubbles.shownFeatures,
        };
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
                this.config?.events,
            ),
            waypoints: new EventsModule<Waypoint<WaypointDisplayProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.waypoints,
                this.config?.events,
            ),
            chargingStops: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.chargingStops,
                this.config?.events,
            ),
            summaryBubbles: new EventsModule<DisplayRouteSummary>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.summaryBubbles,
                this.config?.events,
            ),
            incidents: new EventsModule<RouteSection<DisplayTrafficSectionProps>>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.incidents,
                this.config?.events,
            ),
            vehicleRestricted: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.vehicleRestricted,
                this.config?.events,
            ),
            ferries: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.ferries,
                this.config?.events,
            ),
            tollRoads: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.tollRoads,
                this.config?.events,
            ),
            tunnels: new EventsModule<RouteSection>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.tunnels,
                this.config?.events,
            ),
            instructionLines: new EventsModule<DisplayInstruction>(
                this.tomtomMap._eventsProxy,
                this.sourcesWithLayers.instructionLines,
                this.config?.events,
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
