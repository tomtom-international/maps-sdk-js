import type { Place, Places } from '@tomtom-org/maps-sdk/core';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    PutEventStateOptions,
    SymbolLayerSpecWithoutSource,
} from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers } from '../shared';
import { DEFAULT_PLACE_ICON_ID } from '../shared/layers/symbolLayers';
import { suffixNumber } from '../shared/layers/utils';
import { addOrUpdateImage, changeLayersProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { buildPlacesLayerSpecs } from './layers/placesLayers';
import { defaultPin } from './resources';
import type { DisplayPlaceProps } from './types/placeDisplayProps';
import {
    PlaceIconConfig,
    PlaceLayerName,
    PlacesModuleConfig,
    PlacesTheme,
    PlaceTextConfig,
} from './types/placesModuleConfig';
import { preparePlacesForDisplay } from './utils/preparePlacesForDisplay';

type PlacesSourcesAndLayers = {
    /**
     * Places source id with corresponding layers ids.
     */
    places: GeoJSONSourceWithLayers<Places<DisplayPlaceProps>>;
};

/**
 * Map module for displaying and managing place markers.
 *
 * The PlacesModule provides functionality to display location markers (pins) on the map
 * for points of interest, search results, or custom locations. It supports various marker
 * styles, custom icons, text labels, and interactive events.
 *
 * @remarks
 * **Features:**
 * - Multiple marker styles (pin, circle, POI-like)
 * - Custom icons per POI category
 * - Text labels with styling options
 * - Data-driven styling via MapLibre expressions
 * - Interactive events (click, hover, etc.)
 * - Support for custom feature properties
 * - EV charging station availability display (opt-in)
 *
 * **Marker Styles:**
 * - `pin`: Traditional teardrop-shaped map pins
 * - `circle`: Simple circular markers
 * - `base-map`: Mimics built-in POI layer styling
 *
 * **EV Charging Station Availability:**
 * When displaying EV charging stations with availability data from
 * {@link getPlacesWithEVAvailability}, the module can:
 * - Show available/total charging points (e.g., "3/10")
 * - Color-code availability (green = good, orange = limited, red = none/low)
 * - Display as formatted text within the station's label
 *
 * This feature is disabled by default. To enable it, set `evAvailability.enabled` to `true`
 * in the configuration.
 *
 * **Common Use Cases:**
 * - Search result visualization
 * - Custom location markers
 * - Store locators
 * - EV charging station maps with real-time availability
 * - Delivery/pickup points
 * - Saved locations display
 *
 * @example
 * ```typescript
 * // Create places module with pin markers
 * const placesModule = await PlacesModule.get(map, {
 *   icon: {
 *     categoryIcons: []
 *   },
 *   text: {
 *     field: (place) => place.properties.poi?.name || 'Unknown'
 *   },
 *   theme: 'pin'
 * });
 *
 * // Display places from search
 * await placesModule.show(searchResults);
 *
 * // EV Charging Stations - Opt-in to availability display
 * const evStations = await PlacesModule.get(map, {
 *   evAvailability: { enabled: true }
 * });
 * const results = await search({ poiCategories: ['ELECTRIC_VEHICLE_STATION'] });
 * evStations.show(await getPlacesWithEVAvailability(results)); // Shows availability
 *
 * // Granular control: Enable for searched stations only, background stations without
 * const bgStations = await PlacesModule.get(map); // EV availability disabled
 * const searched = await PlacesModule.get(map, {
 *   evAvailability: { enabled: true }
 * });
 *
 * // Handle clicks
 * placesModule.events.on('click', (feature) => {
 *   console.log('Clicked:', feature.properties);
 * });
 *
 * placesModule.events.on('hover', (feature) => {
 *   showTooltip(feature.properties.poi?.name);
 * });
 * ```
 *
 * @see [Places Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/places)
 *
 * @group Places
 */
export class PlacesModule extends AbstractMapModule<PlacesSourcesAndLayers, PlacesModuleConfig> {
    private static lastInstanceIndex = -1;
    private layerSpecs!: Record<PlaceLayerName, SymbolLayerSpecWithoutSource>;
    private sourceID!: string;
    private layerIDPrefix!: string;
    /**
     * The index of this instance, to generate unique source and layer IDs.
     * * Starts with 0 and each instance increments it by one.
     * @private
     */
    private instanceIndex!: number;
    private defaultPlaceIconID!: string;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async get(tomtomMap: TomTomMap, config?: PlacesModuleConfig): Promise<PlacesModule> {
        await waitUntilMapIsReady(tomtomMap);
        return new PlacesModule(tomtomMap, config);
    }

    private constructor(map: TomTomMap, config?: PlacesModuleConfig) {
        super('geojson', map, config);
    }

    /**
     * @ignore
     */
    protected _initSourcesWithLayers(config?: PlacesModuleConfig, restore?: boolean): PlacesSourcesAndLayers {
        // Only increment the instance index for new instances, not for restore operations
        if (!restore) {
            PlacesModule.lastInstanceIndex++;
            this.instanceIndex = PlacesModule.lastInstanceIndex;
            this.sourceID = `places-${this.instanceIndex}`;
            this.layerIDPrefix = this.sourceID;
            this.defaultPlaceIconID = suffixNumber(DEFAULT_PLACE_ICON_ID, this.instanceIndex);
        }

        // Update each layer id with the instance-specific prefix
        this.layerSpecs = this.buildLayerSpecs(config);

        return {
            places: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, [
                this.layerSpecs.main,
                this.layerSpecs.selected,
            ]),
        };
    }

    private buildLayerSpecs(config?: PlacesModuleConfig) {
        const layerSpecTemplates = buildPlacesLayerSpecs(config, this.mapLibreMap);

        // Update each layer id with the instance-specific prefix
        return Object.fromEntries(
            Object.entries(layerSpecTemplates).map(([key, spec]) => [
                key,
                { ...spec, id: `${this.layerIDPrefix}-${key}` },
            ]),
        ) as Record<PlaceLayerName, SymbolLayerSpecWithoutSource>;
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: PlacesModuleConfig | undefined) {
        this.updateLayersAndData(config);
        return config;
    }

    /**
     * @ignore
     */
    protected restoreDataAndConfigImpl() {
        const previousShownFeatures = this.sourcesWithLayers.places.shownFeatures;
        this.initSourcesWithLayers(this.config, true);
        this.config && this._applyConfig(this.config);
        this.show(previousShownFeatures);
    }

    /**
     * Updates the visual theme for displayed places.
     *
     * @param theme - The theme style to apply to place markers.
     *
     * @remarks
     * **Available Themes:**
     * - `pin`: Traditional teardrop-shaped map pins
     * - `circle`: Simple circular markers
     * - `base-map`: Mimics the map's built-in POI layer style with category icons
     *
     * Changes apply immediately to all currently shown places. Other configuration
     * properties (icon config, text config) remain unchanged.
     *
     * @example
     * ```typescript
     * // Switch to pin markers
     * placesModule.applyTheme('pin');
     *
     * // Use simple circles
     * placesModule.applyTheme('circle');
     *
     * // Match map's POI style (ideal to blend in)
     * placesModule.applyTheme('base-map');
     * ```
     */
    applyTheme(theme: PlacesTheme): void {
        this.applyConfigPart({ theme });
    }

    /**
     * Updates the icon configuration for displayed places.
     *
     * @param iconConfig - New icon configuration settings.
     *
     * @remarks
     * - Changes apply immediately to currently shown places
     * - Custom icons are loaded if not already in style
     * - Other configuration properties remain unchanged
     *
     * @example
     * ```typescript
     * placesModule.applyIconConfig({
     *   categoryIcons: [
     *     { category: 'RESTAURANT', id: 'restaurant-icon', image: '/icons/food.png' }
     *   ]
     * });
     * ```
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        this.applyConfigPart({ icon: iconConfig });
    }

    /**
     * Updates the text/label configuration for displayed places.
     *
     * @param textConfig - New text configuration settings.
     *
     * @remarks
     * Supports both functions and MapLibre expressions for dynamic text.
     *
     * @example
     * ```typescript
     * // Use function
     * placesModule.applyTextConfig({
     *   field: (place) => place.properties.poi?.name || 'Unknown'
     * });
     *
     * // Use MapLibre expression
     * placesModule.applyTextConfig({
     *   field: ['get', 'title'],
     *   size: 14,
     *   color: '#333'
     * });
     * ```
     */
    applyTextConfig(textConfig: PlaceTextConfig): void {
        this.applyConfigPart({ text: textConfig });
    }

    private applyConfigPart(partialConfig: Partial<PlacesModuleConfig>): void {
        const config = { ...this.config, ...partialConfig };
        this.updateLayersAndData(config);
        this.config = config;
    }

    /**
     * Applies additional feature properties to displayed places.
     *
     * @param extraFeatureProps - Object mapping property names to values or functions.
     *
     * @remarks
     * Useful for adding computed properties or metadata for styling/filtering.
     *
     * @example
     * ```typescript
     * placesModule.applyExtraFeatureProps({
     *   category: (place) => place.properties.poi?.categories?.[0],
     *   rating: (place) => place.properties.poi?.rating || 0,
     *   isOpen: true
     * });
     * ```
     */
    applyExtraFeatureProps(extraFeatureProps: { [key: string]: any }): void {
        const config = { ...this.config, extraFeatureProps };
        this.updateData(config);
        this.config = config;
    }

    private updateLayersAndData(config: PlacesModuleConfig | undefined): void {
        this.setupImages(config);
        const newLayerSpecs = this.buildLayerSpecs(config);
        // Convert layerSpecs objects to arrays for changeLayersProps
        const newLayerSpecsArray = [newLayerSpecs.main, newLayerSpecs.selected];
        const oldLayerSpecsArray = [this.layerSpecs.main, this.layerSpecs.selected];
        changeLayersProps(newLayerSpecsArray, oldLayerSpecsArray, this.mapLibreMap);
        this.layerSpecs = newLayerSpecs;
        this.updateData(config);
    }

    private setupImages(config: PlacesModuleConfig | undefined): void {
        // Ensure default pin is added:
        if (config?.icon) {
            // If we have custom icons, ensure they're added to the map style:
            for (const customIcon of config.icon.categoryIcons ?? []) {
                addOrUpdateImage(
                    'if-not-in-sprite',
                    suffixNumber(customIcon.id, this.instanceIndex),
                    customIcon.image as string | HTMLImageElement,
                    this.mapLibreMap,
                    {
                        pixelRatio: customIcon.pixelRatio ?? 2,
                    },
                );
            }

            if (config.icon.default) {
                if (config.icon.default.image) {
                    addOrUpdateImage(
                        'if-not-in-sprite',
                        this.defaultPlaceIconID,
                        config.icon.default.image.image as string | HTMLImageElement,
                        this.mapLibreMap,
                        {
                            pixelRatio: config.icon.default.image.pixelRatio ?? 2,
                        },
                    );
                }
                if (config.icon.default.style) {
                    addOrUpdateImage(
                        'if-not-in-sprite',
                        this.defaultPlaceIconID,
                        defaultPin(config.icon.default.style),
                        this.mapLibreMap,
                        { pixelRatio: 2 },
                    );
                }
            }
        } else {
            // Ensure default pin is added:
            addOrUpdateImage('if-not-in-sprite', this.defaultPlaceIconID, defaultPin(), this.mapLibreMap, {
                pixelRatio: 2,
            });
        }
    }

    private updateData(config: PlacesModuleConfig | undefined): void {
        this.sourcesWithLayers.places.source.runtimeSource?.setData(
            preparePlacesForDisplay(this.sourcesWithLayers.places.shownFeatures, this.instanceIndex, config),
        );
    }

    /**
     * Displays the given places on the map.
     *
     * @param places - Place data to display. Can be a single Place, array of Places,
     * or a Places FeatureCollection.
     *
     * @remarks
     * **Behavior:**
     * - Replaces any previously shown places
     * - Applies current module styling configuration
     * - Automatically generates labels if text config is set
     * - Waits for module to be ready before displaying
     *
     * **Data Sources:**
     * - TomTom Search API results
     * - Custom place objects matching the Place interface
     * - GeoJSON Point features
     *
     * @example
     * Display search results:
     * ```typescript
     * import { search } from '@tomtom-international/maps-sdk-js/services';
     *
     * const results = await search({ query: 'coffee' });
     * await placesModule.show(results);
     * ```
     *
     * @example
     * Display single place:
     * ```typescript
     * await placesModule.show({
     *   type: 'Feature',
     *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
     *   properties: {
     *     address: { freeformAddress: 'Amsterdam' },
     *     poi: { name: 'Amsterdam Central' }
     *   }
     * });
     * ```
     *
     * @example
     * Display multiple places:
     * ```typescript
     * await placesModule.show([place1, place2, place3]);
     * ```
     */
    async show(places: Place | Place[] | Places) {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.places.show(preparePlacesForDisplay(places, this.instanceIndex, this.config));
    }

    /**
     * Removes all places from the map.
     *
     * @remarks
     * - Clears all displayed places
     * - Does not reset styling configuration
     * - Module remains initialized and ready for new data
     *
     * @example
     * ```typescript
     * await placesModule.clear();
     * ```
     */
    async clear() {
        await this.waitUntilModuleReady();
        this.sourcesWithLayers.places.clear();
    }

    /**
     * Programmatically sets an event state on a specific place.
     *
     * @param options - Configuration for the event state to apply.
     *
     * @remarks
     * Use this to make places appear clicked or hovered programmatically.
     *
     * @example
     * ```typescript
     * // Make first place appear clicked
     * placesModule.putEventState({
     *   index: 0,
     *   state: 'click',
     *   mode: 'put'
     * });
     * ```
     */
    putEventState(options: PutEventStateOptions) {
        this.sourcesWithLayers.places.putEventState(options);
    }

    /**
     * Removes an event state from a specific place.
     *
     * @param options - Configuration for which event state to remove.
     *
     * @example
     * ```typescript
     * placesModule.cleanEventState({ index: 0 });
     * ```
     */
    cleanEventState(options: CleanEventStateOptions): void {
        this.sourcesWithLayers.places.cleanEventState(options);
    }

    /**
     * Removes event states from multiple places.
     *
     * @param options - Optional filter for which states to remove.
     *
     * @example
     * ```typescript
     * // Remove all event states
     * placesModule.cleanEventStates();
     *
     * // Remove only hover states
     * placesModule.cleanEventStates({ states: ['hover'] });
     * ```
     */
    cleanEventStates(options?: CleanEventStatesOptions) {
        this.sourcesWithLayers.places.cleanEventStates(options);
    }

    /**
     * Create the events on/off for this module
     * @returns An instance of EventsModule
     */
    get events() {
        return new EventsModule<Place<DisplayPlaceProps>>(
            this.eventsProxy,
            this.sourcesWithLayers.places,
            this.config?.events,
        );
    }
}
