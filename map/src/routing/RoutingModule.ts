import type { Route, Routes, SpeedLimitSectionProps, Waypoint, Waypoints } from '@tomtom-org/maps-sdk/core';
import { isEqual } from 'lodash-es';
import type { MapGeoJSONFeature, StyleImageMetadata } from 'maplibre-gl';
import {
    AbstractDataOwnedMapModule,
    type CombinedEvents,
    GeoJSONSourceWithLayers,
    mapStyleLayerIDs,
    SVGIconStyleOptions,
    type UserEvents,
} from '../shared';
import { prefixLayerID, suffixNumber } from '../shared/layers/utils';
import { addLayers, addOrUpdateImage, updateLayersAndSource, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { COUNTRY_CROSSING_LAYER_ID, COUNTRY_CROSSING_PLAQUE_IMAGE_ID } from './layers/countryCrossingLayers';
import { INSTRUCTION_ARROW_IMAGE_ID } from './layers/guidanceLayers';
import { DESELECTED_SUMMARY_POPUP_IMAGE_ID, SELECTED_SUMMARY_POPUP_IMAGE_ID } from './layers/routeMainLineLayers';
import { isSectionVisible, sectionSignLayerID } from './layers/sectionLayers';
import {
    drawnSectionTypes,
    type GeneratedSectionType,
    generatedSectionTypes,
    postsSign,
    type SectionSourceKey,
    sectionSourceKey,
} from './layers/sectionRegistry';
import { MAJOR_DELAY_COLOR, MINOR_DELAY_LABEL_COLOR, MODERATE_DELAY_COLOR, UNKNOWN_DELAY_COLOR } from './layers/shared';
import {
    TRAFFIC_CLEAR_IMAGE_ID,
    TRAFFIC_MAJOR_IMAGE_ID,
    TRAFFIC_MINOR_IMAGE_ID,
    TRAFFIC_MODERATE_IMAGE_ID,
} from './layers/summaryBubbleLayers';
import { WAYPOINT_FINISH_IMAGE_ID, WAYPOINT_START_IMAGE_ID, WAYPOINT_STOP_IMAGE_ID } from './layers/waypointLayers';
import {
    countryCrossingPlaqueImageOptions,
    countryCrossingPlaqueImg,
    instructionArrowIconImg,
    speedLimitSignImg,
    summaryBubbleImageOptions,
    summaryMapBubbleImg,
    trafficImg,
    waypointFinishIcon,
    waypointIcon,
    waypointStartIcon,
} from './resources';
import type { CountryCrossingFeature, DisplayRouteProps, DisplayRouteSummary } from './types/displayRoutes';
import type { DisplayInstruction } from './types/guidance';
import type { PlanningWaypoint } from './types/planningWaypoint';
import type { RoutingModuleConfig, SectionDisplayConfig } from './types/routeModuleConfig';
import type {
    DisplaySpeedLimitSectionProps,
    DisplayTrafficSectionProps,
    RouteSection,
    RouteSections,
    SpeedLimitSignFace,
} from './types/routeSections';
import type { RoutingLayersSpecs, RoutingSourcesWithLayers } from './types/routingSourcesAndLayers';
import type { ShowRoutesOptions } from './types/showOptions';
import type { WaypointDisplayProps } from './types/waypointDisplayProps';
import { createLayersSpecs, routeModuleConfigWithDefaults } from './util/config';
import { type CountryCrossingColors, resolveCountryCrossingColors } from './util/countryCrossingColors';
import { toCountryCrossingEventFeature, toDisplayCountryCrossings } from './util/countryCrossings';
import { toDisplayChargingStops } from './util/displayChargingStops';
import { toDisplayTrafficSectionProps } from './util/displayTrafficSectionProps';
import { toDisplayWaypoints } from './util/displayWaypoints';
import { toDisplayInstructionArrows, toDisplayInstructions } from './util/guidance';
import { toDisplayRouteSections } from './util/routeSections';
import { showFeaturesWithRouteSelection } from './util/routeSelection';
import { toDisplayRouteSummaries, toDisplayRoutes } from './util/routes';
import { SPEED_LIMIT_IMAGE_ID_BY_FACE, toDisplaySpeedLimitSectionProps } from './util/speedLimitSigns';

/**
 * What `routing.events.on('shown-features', ...)` receives: whichever of routes or waypoints was
 * just rendered.
 *
 * @group Routing
 */
export type RoutingShownFeatures = { routes: Route | Routes } | { waypoints: PlanningWaypoint[] | Waypoints };

/**
 * Event surface of {@link RoutingModule}: the module's own events, plus one named scope per part
 * of a route it draws.
 *
 * @group Routing
 */
export type RoutingEvents = CombinedEvents<MapGeoJSONFeature, RoutingModuleConfig, RoutingShownFeatures> & {
    /** One scope per section type generated from the registry, keyed `<type>Sections`. */
    [K in SectionSourceKey<GeneratedSectionType>]: UserEvents<RouteSection>;
} & {
    /** The route lines themselves. */
    mainLines: UserEvents<Route<DisplayRouteProps>>;
    /** Origin, destination and intermediate stops. */
    waypoints: UserEvents<Waypoint<WaypointDisplayProps>>;
    /** Charging stops along an EV route. */
    chargingStops: UserEvents<RouteSection>;
    /** The summary bubbles shown against each alternative. */
    summaryBubbles: UserEvents<DisplayRouteSummary>;
    /** The border crossings along the route, each carrying the two `country` sections it joins. */
    countryCrossings: UserEvents<CountryCrossingFeature>;
    /** Traffic incidents on the route. */
    incidents: UserEvents<RouteSection<DisplayTrafficSectionProps>>;
    /** Sections the vehicle is restricted from. */
    vehicleRestricted: UserEvents<RouteSection>;
    /** Ferry sections. */
    ferries: UserEvents<RouteSection>;
    /** Toll road sections. */
    tollRoads: UserEvents<RouteSection>;
    /** Tunnel sections. */
    tunnels: UserEvents<RouteSection>;
    /** The guidance instruction lines. */
    instructionLines: UserEvents<DisplayInstruction>;
};

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
 * const routingModule = await RoutingModule.create(map, {
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
export class RoutingModule extends AbstractDataOwnedMapModule<RoutingSourcesWithLayers, RoutingModuleConfig> {
    private layersSpecs!: RoutingLayersSpecs;
    private layerIDPrefix!: string;
    private readonly shownFeaturesHandlers: ((
        features: { routes: Route | Routes } | { waypoints: PlanningWaypoint[] | Waypoints },
    ) => void)[] = [];

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     *
     * @remarks
     * **Instances:**
     * `RoutingModule` owns the sources, layers and images it adds, all suffixed per instance. Every
     * call therefore returns a **new, independent** instance, and stacking several of them on one
     * map is a supported thing to do.
     *
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
     * const routingModule = await RoutingModule.create(map);
     * ```
     *
     * @example
     * With custom configuration:
     * ```typescript
     * const routingModule = await RoutingModule.create(map, {
     *   displayUnits: 'imperial',
     *   waypointsSource: {
     *     entryPoints: 'main-when-available'
     *   }
     * });
     * ```
     */
    static async create(tomtomMap: TomTomMap, config?: RoutingModuleConfig): Promise<RoutingModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new RoutingModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: RoutingModuleConfig) {
        super(map, config);
    }

    private createSourcesWithLayers(layersSpecs: RoutingLayersSpecs): RoutingSourcesWithLayers {
        const sourcePrefix = suffixNumber('routes', this.instanceIndex);
        // One source per generated section, from the same table the layers come from.
        const generatedSectionSources = Object.fromEntries(
            generatedSectionTypes.map((type) => {
                const key = sectionSourceKey(type);
                return [
                    key,
                    new GeoJSONSourceWithLayers(this.mapLibreMap, `${sourcePrefix}-${key}`, layersSpecs[key], false),
                ];
            }),
        ) as Pick<RoutingSourcesWithLayers, SectionSourceKey<GeneratedSectionType>>;
        return {
            ...generatedSectionSources,
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
            countryCrossings: new GeoJSONSourceWithLayers(
                this.mapLibreMap,
                `${sourcePrefix}-countryCrossings`,
                layersSpecs.countryCrossings,
                false,
            ),
        };
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: RoutingModuleConfig, restore?: boolean): RoutingSourcesWithLayers {
        // `instanceIndex` is auto-assigned by AbstractMapModule; only the layerIDPrefix
        // needs to be (re)computed on first init.
        if (!restore) {
            this.layerIDPrefix = suffixNumber('routes', this.instanceIndex);
        }

        this.layersSpecs = createLayersSpecs(
            routeModuleConfigWithDefaults(
                config,
                this.layerIDPrefix,
                this.instanceIndex,
                this.tomtomMap.styleLightDarkTheme,
            ).layers,
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
        // One image per sign face, never per limit: the number rides over the face as text, so a
        // route through any country is served by the faces this loop adds once.
        for (const [face, imageID] of Object.entries(SPEED_LIMIT_IMAGE_ID_BY_FACE)) {
            this.addImageIfNotExisting(
                suffixNumber(imageID, this.instanceIndex),
                speedLimitSignImg(face as SpeedLimitSignFace),
                options,
            );
        }
        // Forgotten rather than reused: the layers are new, and the theme behind the colours may
        // have changed with the style that replaced them.
        this.appliedCrossingColors = undefined;
        this.addImageIfNotExisting(
            suffixNumber(COUNTRY_CROSSING_PLAQUE_IMAGE_ID, this.instanceIndex),
            countryCrossingPlaqueImg(this.crossingColors(this.config).plaque),
            { ...options, ...countryCrossingPlaqueImageOptions },
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
        const mergedConfig = routeModuleConfigWithDefaults(
            config,
            this.layerIDPrefix,
            this.instanceIndex,
            this.tomtomMap.styleLightDarkTheme,
        );
        const displayUnitsChanged = !isEqual(this.config?.displayUnits, mergedConfig.displayUnits);

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
            this.reshowSpeedLimitSigns(mergedConfig, displayUnitsChanged);

            // set the correct visibility if there are new layers
            listOfSources.forEach((source) => source.setLayersVisible(!!source.shownFeatures.features.length));
            this.applySectionVisibility(config);
            this.applySignPriority(config);
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

        this.applyCountryCrossingConfig(mergedConfig);

        return mergedConfig;
    }

    /**
     * Shows the speed limit sections, each carrying the sign that posts it.
     *
     * @remarks
     * `speedLimit` is the one type drawn from its own number rather than its extent, so the number,
     * the face and the numeral colour are derived here and ride on the feature. That makes the unit
     * in force an input to the data rather than to the paint, which is why a change to it re-runs
     * this instead of restyling the layer in place.
     */
    private showSpeedLimitSections(
        displayRoutes: Routes<DisplayRouteProps>,
        config: RoutingModuleConfig | undefined,
    ): void {
        this.sourcesWithLayers.speedLimitSections.show(
            toDisplayRouteSections<SpeedLimitSectionProps, DisplaySpeedLimitSectionProps>(
                displayRoutes,
                'speedLimit',
                toDisplaySpeedLimitSectionProps(this.instanceIndex, {
                    unit: config?.sections?.speedLimit?.sign?.unit,
                    displayUnits: config?.displayUnits,
                }),
            ),
        );
    }

    /** The colours the crossings draw with, which follow the map's theme unless configured. */
    private crossingColors(config: RoutingModuleConfig | undefined): CountryCrossingColors {
        return resolveCountryCrossingColors(config?.countryCrossings, this.tomtomMap.styleLightDarkTheme);
    }

    /**
     * What {@link applyCountryCrossingConfig} last painted the crossings with.
     *
     * @remarks
     * Tracked here rather than re-derived from `this.config`, because the theme is an input the
     * config cannot see: a style change moves the resolved colours while the config says the same
     * thing. Cleared when the sources are rebuilt, so a restored style repaints from scratch.
     */
    private appliedCrossingColors: CountryCrossingColors | undefined;

    /**
     * Brings the border crossings in line with a changed configuration.
     *
     * @remarks
     * The source is gated on `visible`, as the summary bubbles' is, so switching them back on
     * re-derives the features: a layer spec cannot put back data the source does not hold.
     *
     * Both colours are applied here rather than left to the layer spec: the plaque is an image, so
     * a new colour has to replace it, and the label's colour follows the map theme, which the spec
     * that built the layer cannot know about after a style change.
     */
    private applyCountryCrossingConfig(mergedConfig: RoutingModuleConfig): void {
        const crossingsVisible = mergedConfig.countryCrossings?.visible !== false;
        const visibilityChanged = !isEqual(
            this.config?.countryCrossings?.visible,
            mergedConfig.countryCrossings?.visible,
        );

        if (!crossingsVisible && visibilityChanged) {
            this.sourcesWithLayers.countryCrossings.clear();
        } else if (crossingsVisible && visibilityChanged) {
            this.sourcesWithLayers.countryCrossings.show(
                toDisplayCountryCrossings(this.sourcesWithLayers.mainLines.shownFeatures),
            );
        }

        const colors = this.crossingColors(mergedConfig);
        if (isEqual(this.appliedCrossingColors, colors)) return;

        this.appliedCrossingColors = colors;
        addOrUpdateImage(
            'add-or-update',
            suffixNumber(COUNTRY_CROSSING_PLAQUE_IMAGE_ID, this.instanceIndex),
            countryCrossingPlaqueImg(colors.plaque),
            this.mapLibreMap,
            countryCrossingPlaqueImageOptions,
        );

        const crossingLayerID = prefixLayerID(COUNTRY_CROSSING_LAYER_ID, this.layerIDPrefix);
        if (this.mapLibreMap.getLayer(crossingLayerID)) {
            this.mapLibreMap.setPaintProperty(crossingLayerID, 'text-color', colors.text, { validate: false });
        }
    }

    /**
     * Re-derives the posted signs when the unit they read in changed.
     *
     * @remarks
     * No paint property can restate a number, so `sign.unit` and `displayUnits` are the two knobs
     * that have to reach the features rather than the layers — the summary bubbles are re-shown for
     * the same reason. Runs before the visibility pass, so the re-shown source goes through it.
     */
    private reshowSpeedLimitSigns(mergedConfig: RoutingModuleConfig, displayUnitsChanged: boolean): void {
        const signUnitChanged = !isEqual(
            this.config?.sections?.speedLimit?.sign?.unit,
            mergedConfig.sections?.speedLimit?.sign?.unit,
        );
        if (!signUnitChanged && !displayUnitsChanged) return;

        if (!this.sourcesWithLayers.speedLimitSections.shownFeatures.features.length) return;

        this.showSpeedLimitSections(this.sourcesWithLayers.mainLines.shownFeatures, mergedConfig);
    }

    /**
     * Applies the `sections.<type>.visible` knob to every section type.
     *
     * @remarks
     * Every other source here follows one rule — its layers are visible whenever it holds features
     * — and for sections that rule is not enough. Almost every route has urban stretches, a tunnel
     * or a country crossing somewhere along it, so "has features" would draw all sixteen types the
     * moment a route is shown, whatever the caller asked for. This runs right after anything that
     * shows features and after any config change, in the same tick, so nothing renders in between.
     */
    private applySectionVisibility(config: RoutingModuleConfig | undefined): void {
        for (const type of drawnSectionTypes) {
            const source = this.sourcesWithLayers[sectionSourceKey(type)];
            const hasFeatures = !!source.shownFeatures.features.length;
            source.setLayersVisible(hasFeatures && isSectionVisible(type, config?.sections?.[type]));
        }
    }

    /** The id of the layer posting this type's signs, for a type that posts them. */
    private signLayerID(type: GeneratedSectionType): string | undefined {
        if (!postsSign(type)) return undefined;

        return prefixLayerID(sectionSignLayerID(type), this.layerIDPrefix);
    }

    /**
     * Settles which icons a section's signs give way to.
     *
     * @remarks
     * MapLibre resolves symbol collisions from the topmost layer down, so this is a matter of where
     * the sign layer sits — and it cannot be a `beforeID`, because the layers a sign yields to are
     * added when the features that need them are shown: a route with no waypoints shown has no
     * waypoint layer to anchor to, and an anchor that is not on the map costs the sign layer
     * itself. So the stacking is settled here instead, after each show and each config change.
     */
    private applySignPriority(config: RoutingModuleConfig | undefined): void {
        for (const type of generatedSectionTypes) {
            const signLayerID = this.signLayerID(type);
            if (!signLayerID || !this.mapLibreMap.getLayer(signLayerID)) continue;

            const sectionConfig: SectionDisplayConfig | undefined = config?.sections?.[type];
            this.mapLibreMap.moveLayer(signLayerID, this.signAnchorLayerID(signLayerID, sectionConfig));
        }
    }

    /**
     * The layer a section's signs are moved under, for what they are configured to give way to.
     *
     * @remarks
     * `aboveRouteIcons` anchors to nothing, which puts the layer on top. The other two differ only
     * in where the search starts: under the base map's labels for `belowMapLabels`, and at them for
     * `belowRouteIcons`, since a section's own icon layer is pinned below the labels and a sign
     * sent under that would give way to every place name on the way.
     */
    private signAnchorLayerID(signLayerID: string, config?: SectionDisplayConfig): string | undefined {
        const priority = config?.sign?.priority ?? 'belowRouteIcons';
        if (priority === 'aboveRouteIcons') return undefined;

        const layers = this.mapLibreMap.getStyle().layers;
        if (priority === 'belowMapLabels') return mapStyleLayerIDs.lowestLabel;

        const lowestLabelIndex = layers.findIndex((layer) => layer.id === mapStyleLayerIDs.lowestLabel);
        return layers.find(
            (layer, index) =>
                layer.type === 'symbol' &&
                layer.id !== signLayerID &&
                index > lowestLabelIndex &&
                (!this.layerIDPrefix || layer.id.startsWith(this.layerIDPrefix)),
        )?.id;
    }

    /** @ignore */
    protected discardShownData(): void {
        // Nothing to forget: this module keeps no copy of what it shows. `restoreDataAndConfigImpl`
        // reads the shown features off the sources themselves, and a clean switch rebuilds those
        // empty.
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        // Collected by key, not closed over: `initSourcesWithLayers` replaces every source before the
        // re-show below. Each source shows its own feature type, and TypeScript cannot keep a key
        // correlated with that type through an index access, so the payload stays unconstrained here
        // and `show` is what actually checks it.
        const previouslyShown = Object.fromEntries(
            Object.entries(this.sourcesWithLayers).map(([key, sourceWithLayers]) => [
                key,
                sourceWithLayers.shownFeatures,
            ]),
        ) as Record<keyof RoutingSourcesWithLayers, never>;

        this.initSourcesWithLayers(this.config, true);
        this._applyConfig(this.config);

        for (const key of Object.keys(previouslyShown) as (keyof RoutingSourcesWithLayers)[]) {
            this.sourcesWithLayers[key].show(previouslyShown[key]);
        }
        this.applySectionVisibility(this.config);
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
     * - Ferry, tunnel, and charged-road (`tollRoad`) sections
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
        // `tollRoad` is the section type that answers "does this stretch cost money to drive" — it
        // covers per-use tolls, vignette-only motorways and urban charge zones alike, where `toll`
        // covers only the first. It is also the type this overlay has always been named for. The
        // symbol still uses the toll-plaza icon: the sprite offers no generic road-charge icon, and
        // picking per-scheme icons is the job of the follow-up that gives `toll` and `tollVignette`
        // their own treatment.
        this.sourcesWithLayers.tollRoads.show(toDisplayRouteSections(displayRoutes, 'tollRoad'));
        for (const type of generatedSectionTypes) {
            if (postsSign(type)) continue;

            this.sourcesWithLayers[sectionSourceKey(type)].show(toDisplayRouteSections(displayRoutes, type));
        }
        this.showSpeedLimitSections(displayRoutes, this.config);
        this.applySectionVisibility(this.config);
        this.applySignPriority(this.config);
        this.sourcesWithLayers.instructionLines.show(toDisplayInstructions(displayRoutes));
        this.sourcesWithLayers.instructionArrows.show(toDisplayInstructionArrows(displayRoutes));
        if (this.config?.countryCrossings?.visible !== false) {
            this.sourcesWithLayers.countryCrossings.show(toDisplayCountryCrossings(displayRoutes));
        } else {
            this.sourcesWithLayers.countryCrossings.clear();
        }

        if (this.config?.summaryBubbles?.visible !== false) {
            this.sourcesWithLayers.summaryBubbles.show(
                toDisplayRouteSummaries(displayRoutes, this.config?.displayUnits),
            );
        } else {
            this.sourcesWithLayers.summaryBubbles.clear();
        }
        for (const handler of this.shownFeaturesHandlers) {
            handler({ routes });
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
        // Charging stops now carry their route index, so a selection change restyles them like
        // every other route-related source instead of regenerating the whole collection.
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.chargingStops);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.vehicleRestricted);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.incidents);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.ferries);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tollRoads);
        for (const type of generatedSectionTypes) {
            showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers[sectionSourceKey(type)]);
        }
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.tunnels);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionLines);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.instructionArrows);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.summaryBubbles);
        showFeaturesWithRouteSelection(updatedRoutes, this.sourcesWithLayers.countryCrossings);
        this.applySectionVisibility(this.config);
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
            ? toDisplayWaypoints(waypoints, this.config?.waypoints, this.instanceIndex, this.config?.displayUnits?.time)
            : // FeatureCollection expected:
              toDisplayWaypoints(
                  waypoints.features,
                  this.config?.waypoints,
                  this.instanceIndex,
                  this.config?.displayUnits?.time,
              );
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.waypoints.show(displayWaypoints);
        // The pins are new layers to give way to, so where the signs sit is settled again.
        this.applySignPriority(this.config);
        for (const handler of this.shownFeaturesHandlers) {
            handler({ waypoints });
        }
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
     * - `tollRoads`: Sections that cost money to drive — the `tollRoad` section type
     * - `tunnels`: Tunnel sections
     * - `vehicleRestricted`: Vehicle-restricted sections
     * - `instructionLines`: Turn-by-turn instruction lines
     * - `instructionArrows`: Instruction arrow markers
     * - `summaryBubbles`: Route summary popups
     * - `countryCrossings`: Border crossings along the route
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
            ...(Object.fromEntries(
                generatedSectionTypes.map((type) => [
                    sectionSourceKey(type),
                    this.sourcesWithLayers[sectionSourceKey(type)].shownFeatures,
                ]),
            ) as Record<SectionSourceKey<GeneratedSectionType>, RouteSections | undefined>),
            tunnels: this.sourcesWithLayers.tunnels.shownFeatures,
            vehicleRestricted: this.sourcesWithLayers.vehicleRestricted.shownFeatures,
            instructionLines: this.sourcesWithLayers.instructionLines.shownFeatures,
            instructionArrows: this.sourcesWithLayers.instructionArrows.shownFeatures,
            summaryBubbles: this.sourcesWithLayers.summaryBubbles.shownFeatures,
            countryCrossings: this.sourcesWithLayers.countryCrossings.shownFeatures,
        };
    }

    /**
     * Unified events interface for the routing module.
     *
     * `events` itself covers every route feature and the module's lifecycle events; the named
     * scopes below cover one part of a route each, and every one of them can be narrowed further
     * with `where()`.
     *
     * ```typescript
     * routing.events.mainLines.on('click', (route) => { ... });
     * routing.events.waypoints.on('hover', (waypoint) => { ... });
     *
     * // Only the long tunnels, with their own hover cursor:
     * routing.events.tunnels
     *     .where((section) => section.properties.lengthInMeters > 500, { cursorOnHover: 'help' })
     *     .on('click', showTunnel);
     *
     * const unsub = routing.events.on('config-change', (config) => { ... });
     * routing.events.on('shown-features', (features) => {
     *   if ('routes' in features) { ... }
     * });
     * unsub();
     * ```
     */
    get events(): RoutingEvents {
        // Every generated section gets a scoped events surface for free, and joins the module-wide
        // one alongside the bespoke sections — that is the point of registering them from one table.
        const generatedSectionScopes = Object.fromEntries(
            generatedSectionTypes.map((type) => [
                sectionSourceKey(type),
                this.userEvents<RouteSection>([sectionSourceKey(type)]),
            ]),
        ) as Record<SectionSourceKey<GeneratedSectionType>, UserEvents<RouteSection>>;

        // `instructionArrows` is deliberately absent: the arrows are a decoration drawn along the
        // instruction lines, and a caller clicking one means to click the instruction.
        return this.buildEvents(
            this.moduleEventsWithShown<MapGeoJSONFeature, RoutingShownFeatures>(
                [
                    'mainLines',
                    'waypoints',
                    'chargingStops',
                    'summaryBubbles',
                    'countryCrossings',
                    'incidents',
                    'vehicleRestricted',
                    'ferries',
                    'tollRoads',
                    'tunnels',
                    'instructionLines',
                    ...generatedSectionTypes.map(sectionSourceKey),
                ],
                this.shownFeaturesHandlers,
            ),
            {
                ...generatedSectionScopes,
                mainLines: this.userEvents<Route<DisplayRouteProps>>(['mainLines']),
                waypoints: this.userEvents<Waypoint<WaypointDisplayProps>>(['waypoints']),
                chargingStops: this.userEvents<RouteSection>(['chargingStops']),
                summaryBubbles: this.userEvents<DisplayRouteSummary>(['summaryBubbles']),
                countryCrossings: this.userEvents<CountryCrossingFeature>(['countryCrossings'], {
                    mapping: (feature) =>
                        toCountryCrossingEventFeature(feature, this.sourcesWithLayers.mainLines.shownFeatures),
                }),
                incidents: this.userEvents<RouteSection<DisplayTrafficSectionProps>>(['incidents']),
                vehicleRestricted: this.userEvents<RouteSection>(['vehicleRestricted']),
                ferries: this.userEvents<RouteSection>(['ferries']),
                tollRoads: this.userEvents<RouteSection>(['tollRoads']),
                tunnels: this.userEvents<RouteSection>(['tunnels']),
                instructionLines: this.userEvents<DisplayInstruction>(['instructionLines']),
            },
        );
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
