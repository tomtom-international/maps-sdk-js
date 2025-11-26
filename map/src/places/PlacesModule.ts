import type { Place, Places } from '@tomtom-org/maps-sdk/core';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    PutEventStateOptions,
    SymbolLayerSpecWithoutSource,
} from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, PLACES_SOURCE_PREFIX_ID } from '../shared';
import { DEFAULT_PLACE_ICON_ID } from '../shared/layers/symbolLayers';
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
import { imageIDWithInstanceSuffix, preparePlacesForDisplay } from './utils/preparePlacesForDisplay';

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
 *
 * **Marker Styles:**
 * - `pin`: Traditional teardrop-shaped map pins
 * - `circle`: Simple circular markers
 * - `base-map`: Mimics built-in POI layer styling
 *
 * **Common Use Cases:**
 * - Search result visualization
 * - Custom location markers
 * - Store locators
 * - Delivery/pickup points
 * - Saved locations display
 *
 * @example
 * ```typescript
 * // Create places module with pin markers
 * const places = await PlacesModule.get(map, {
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
 * await places.show(searchResults);
 *
 * // Handle clicks
 * places.events.on('click', (feature) => {
 *   console.log('Clicked:', feature.properties);
 * });
 *
 * places.events.on('hover', (feature) => {
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
            this.sourceID = `${PLACES_SOURCE_PREFIX_ID}-${this.instanceIndex}`;
            this.layerIDPrefix = `places-${this.instanceIndex}`;
            this.defaultPlaceIconID = imageIDWithInstanceSuffix(DEFAULT_PLACE_ICON_ID, this.instanceIndex);
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
     * places.applyTheme('pin');
     *
     * // Use simple circles
     * places.applyTheme('circle');
     *
     * // Match map's POI style (ideal to blend in)
     * places.applyTheme('base-map');
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
     * places.applyIconConfig({
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
     * places.applyTextConfig({
     *   field: (place) => place.properties.poi?.name || 'Unknown'
     * });
     *
     * // Use MapLibre expression
     * places.applyTextConfig({
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
     * places.applyExtraFeatureProps({
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
        console.log('setupImages', this.defaultPlaceIconID);
        if (config?.icon) {
            // If we have custom icons, ensure they're added to the map style:
            for (const customIcon of config.icon.categoryIcons ?? []) {
                addOrUpdateImage(
                    'if-not-in-sprite',
                    imageIDWithInstanceSuffix(customIcon.id, this.instanceIndex),
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
            console.log('Adding default pin icon for places module', this.defaultPlaceIconID);
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
     * const results = await search.search({ query: 'coffee' });
     * await places.show(results.results);
     * ```
     *
     * @example
     * Display single place:
     * ```typescript
     * await places.show({
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
     * await places.show([place1, place2, place3]);
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
     * await places.clear();
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
     * places.putEventState({
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
     * places.cleanEventState({ index: 0 });
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
     * places.cleanEventStates();
     *
     * // Remove only hover states
     * places.cleanEventStates({ states: ['hover'] });
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
        return new EventsModule<Place<DisplayPlaceProps>>(this.eventsProxy, this.sourcesWithLayers.places);
    }
}
