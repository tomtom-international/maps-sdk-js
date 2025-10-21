import type { Place, Places } from '@cet/maps-sdk-js/core';
import type {
    CleanEventStateOptions,
    CleanEventStatesOptions,
    PutEventStateOptions,
    SymbolLayerSpecWithoutSource,
} from '../shared';
import { AbstractMapModule, EventsModule, GeoJSONSourceWithLayers, PLACES_SOURCE_PREFIX_ID } from '../shared';
import { addImageIfNotExisting, changeLayersProps, waitUntilMapIsReady } from '../shared/mapUtils';
import type { TomTomMap } from '../TomTomMap';
import { buildPlacesLayerSpecs } from './layers/placesLayers';
import { preparePlacesForDisplay } from './preparePlacesForDisplay';
import { defaultPin } from './resources';
import type { DisplayPlaceProps } from './types/placeDisplayProps';
import type { PlaceIconConfig, PlacesModuleConfig, PlaceTextConfig } from './types/placesModuleConfig';

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
 * - `poi-like`: Mimics built-in POI layer styling
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
 * const places = await PlacesModule.init(map, {
 *   iconConfig: {
 *     iconStyle: 'pin'
 *   },
 *   textConfig: {
 *     textField: (place) => place.properties.poi?.name || 'Unknown'
 *   }
 * });
 *
 * // Display places from search
 * await places.add(searchResults);
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
    private layerSpecs!: [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource];
    private sourceID!: string;
    private layerIDPrefix!: string;
    /**
     * The index of this instance, to generate unique source and layer IDs.
     * * Starts with 0 and each instance increments it by one.
     * @private
     */
    private instanceIndex = 0;

    /**
     * Make sure the map is ready before create an instance of the module and any other interaction with the map
     * @param tomtomMap The TomTomMap instance.
     * @param config  The module optional configuration
     * @returns {Promise} Returns a promise with a new instance of this module
     */
    static async init(tomtomMap: TomTomMap, config?: PlacesModuleConfig): Promise<PlacesModule> {
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
        if (!restore) {
            PlacesModule.lastInstanceIndex++;
            this.instanceIndex = PlacesModule.lastInstanceIndex;
            this.sourceID = `${PLACES_SOURCE_PREFIX_ID}-${this.instanceIndex}`;
            this.layerIDPrefix = `placesSymbols-${this.instanceIndex}`;
        }
        const layerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        this.layerSpecs = layerSpecs;

        // We ensure to add the pins sprite to the style the very first time or when we are restoring the module, and only once for all instances:
        if ((this._initializing || restore) && this.instanceIndex == 0) {
            addImageIfNotExisting(this.mapLibreMap, 'default_pin', defaultPin(), { pixelRatio: 2 });
        }

        return { places: new GeoJSONSourceWithLayers(this.mapLibreMap, this.sourceID, layerSpecs) };
    }

    /**
     * @ignore
     */
    protected _applyConfig(config: PlacesModuleConfig | undefined) {
        // TODO: update layers and data also if the new icon/text config is not there but before it was?
        if (config?.iconConfig || config?.textConfig) {
            this.updateLayersAndData(config);
        } else if (config?.extraFeatureProps) {
            this.updateData(config);
        }

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
     *   iconStyle: 'circle'
     * });
     *
     * // Add custom icons
     * places.applyIconConfig({
     *   customIcons: [
     *     { category: 'RESTAURANT', iconUrl: '/icons/food.png' }
     *   ]
     * });
     * ```
     */
    applyIconConfig(iconConfig: PlaceIconConfig): void {
        const config = { ...this.config, iconConfig };
        this.updateLayersAndData(config);
        this.config = config;
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
     *   textField: (place) => place.properties.poi?.name || 'Unknown'
     * });
     *
     * // Use MapLibre expression
     * places.applyTextConfig({
     *   textField: ['get', 'title'],
     *   textSize: 14,
     *   textColor: '#333'
     * });
     * ```
     */
    applyTextConfig(textConfig: PlaceTextConfig): void {
        const config = { ...this.config, textConfig };
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

    private updateLayersAndData(config: PlacesModuleConfig): void {
        // If we have custom icons, ensure they're added to the map style:
        for (const customIcon of config?.iconConfig?.customIcons ?? []) {
            addImageIfNotExisting(this.mapLibreMap, customIcon.category, customIcon.iconUrl, {
                pixelRatio: customIcon.pixelRatio ?? 2,
            });
        }

        const newLayerSpecs = buildPlacesLayerSpecs(config, this.layerIDPrefix, this.mapLibreMap);
        changeLayersProps(newLayerSpecs, this.layerSpecs, this.mapLibreMap);
        this.layerSpecs = newLayerSpecs;
        this.updateData(config);
    }

    private updateData(config: PlacesModuleConfig): void {
        this.sourcesWithLayers.places.source.runtimeSource?.setData(
            preparePlacesForDisplay(this.sourcesWithLayers.places.shownFeatures, this.mapLibreMap, config),
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
        this.sourcesWithLayers.places.show(preparePlacesForDisplay(places, this.mapLibreMap, this.config));
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
