import { type Language, mergeFromGlobal } from '@cet/maps-sdk-js/core';
import type { BBox } from 'geojson';
import { isEqual } from 'lodash-es';
import { getRTLTextPluginStatus, Map, setRTLTextPlugin } from 'maplibre-gl';
import type { MapLibreOptions, StyleInput, TomTomMapParams } from './init';
import { buildMapOptions } from './init/buildMapOptions';
import { buildStyleInput, withPreviousStyleParts } from './init/styleInputBuilder';
import { EventsProxy } from './shared';
import { isLayerLocalizable } from './shared/localization';
import { addPinSpriteToStyle } from './shared/mapUtils';

/**
 * Handler interface for responding to map style changes.
 *
 * @remarks
 * This interface defines callbacks that are invoked when the map style changes via {@link TomTomMap.setStyle}.
 * Use this to perform cleanup or reinitialization of custom map features when styles are switched.
 *
 * **Lifecycle:**
 * 1. `onStyleAboutToChange` - Called before the new style is applied
 * 2. Style change occurs
 * 3. `onStyleChanged` - Called after the new style has been fully loaded
 *
 * **Common Use Cases:**
 * - Saving and restoring custom layers or sources
 * - Reinitializing map modules after style changes
 * - Updating UI components based on the new style
 * - Cleaning up resources tied to the previous style
 *
 * @example
 * ```typescript
 * const styleHandler: StyleChangeHandler = {
 *   onStyleAboutToChange: () => {
 *     console.log('Style changing - saving state...');
 *     // Save custom layer data
 *   },
 *   onStyleChanged: () => {
 *     console.log('Style changed - restoring state...');
 *     // Restore custom layers
 *   }
 * };
 *
 * map.addStyleChangeHandler(styleHandler);
 * ```
 *
 * @see {@link TomTomMap.addStyleChangeHandler}
 * @see {@link TomTomMap.setStyle}
 *
 * @group Map Style
 */
export type StyleChangeHandler = {
    /**
     * Callback invoked immediately before a style change begins.
     *
     * @remarks
     * Use this to perform cleanup or save state before the current style is removed.
     * This method can be synchronous or asynchronous.
     *
     * @returns void or a Promise that resolves when preparation is complete
     */
    onStyleAboutToChange: () => void | Promise<void>;
    /**
     * Callback invoked after a new style has been fully loaded.
     *
     * @remarks
     * Use this to restore state, reinitialize layers, or perform other setup
     * that depends on the new style being ready. This method can be synchronous or asynchronous.
     *
     * @returns void or a Promise that resolves when reinitialization is complete
     */
    onStyleChanged: () => void | Promise<void>;
};

/**
 * Main TomTom Map class for displaying interactive maps in web applications.
 *
 * This is the entry point for rendering TomTom maps. It wraps MapLibre GL JS and provides
 * a simplified, enhanced API for common mapping tasks.
 *
 * @remarks
 * **Key Features:**
 * - Built on MapLibre GL JS for high-performance rendering
 * - Seamless style switching without map reload
 * - Integrated event handling system
 * - Multi-language support with dynamic switching
 * - Compatible with TomTom map modules (traffic, POIs, routing, etc.)
 *
 * **Architecture:**
 * - Exposes the underlying MapLibre Map instance via {@link mapLibreMap}
 * - Manages map lifecycle and style transitions
 * - Coordinates with map modules for data visualization
 *
 * @example
 * Basic map initialization:
 * ```typescript
 * import { TomTomMap } from '@tomtom-international/maps-sdk-js/map';
 *
 * const map = new TomTomMap(
 *   {
 *     container: 'map',
 *     center: [4.9041, 52.3676],
 *     zoom: 10
 *   },
 *   {
 *     key: 'YOUR_API_KEY',
 *     style: 'standardLight'
 *   }
 * );
 * ```
 *
 * @example
 * With modules and configuration:
 * ```typescript
 * const map = new TomTomMap(
 *   { container: 'map', center: [-74.006, 40.7128], zoom: 12 },
 *   {
 *     key: 'YOUR_API_KEY',
 *     style: {
 *       type: 'standard',
 *       id: 'standardDark',
 *       include: ['trafficFlow', 'trafficIncidents']
 *     },
 *     language: 'en-US',
 *     events: {
 *       precisionMode: 'point-then-box',
 *       cursorOnHover: 'pointer'
 *     }
 *   }
 * );
 *
 * // Access MapLibre functionality directly
 * map.mapLibreMap.on('load', () => {
 *   console.log('Map loaded');
 * });
 * ```
 *
 * @group Map
 */
export class TomTomMap {
    /**
     * Indicates whether the map style has been fully loaded and is ready for interaction.
     *
     * @remarks
     * - `true` when the style is loaded and modules can be safely initialized
     * - `false` during map construction or style changes
     * - Check this before performing style-dependent operations
     *
     * @example
     * ```typescript
     * if (map.mapReady) {
     *   // Safe to initialize modules
     *   const trafficModule = await TrafficFlowModule.get(map);
     * }
     * ```
     */
    mapReady = false;

    /**
     * The underlying MapLibre GL JS Map instance.
     *
     * @remarks
     * **When to Use:**
     * - Access advanced MapLibre functionality not exposed by TomTomMap
     * - Add custom layers, sources, or controls
     * - Listen to MapLibre-specific events
     * - Integrate third-party MapLibre plugins
     *
     * **Important:**
     * - Available immediately after TomTomMap construction
     * - Direct modifications may affect SDK module behavior
     * - Coordinate with SDK modules to avoid conflicts
     *
     * @example
     * Add custom layer:
     * ```typescript
     * map.mapLibreMap.addLayer({
     *   id: 'custom-layer',
     *   type: 'circle',
     *   source: 'my-data',
     *   paint: {
     *     'circle-radius': 6,
     *     'circle-color': '#ff0000'
     *   }
     * });
     * ```
     *
     * @example
     * Listen to events:
     * ```typescript
     * map.mapLibreMap.on('moveend', () => {
     *   console.log('Camera position:', map.mapLibreMap.getCenter());
     * });
     * ```
     *
     * @see {@link https://maplibre.org/maplibre-gl-js-docs/api/map/ | MapLibre Map Documentation}
     */
    readonly mapLibreMap: Map;
    /**
     * @ignore
     */
    _eventsProxy: EventsProxy;
    /**
     * @ignore
     */
    _params: TomTomMapParams;
    private readonly styleChangeHandlers: StyleChangeHandler[] = [];

    /**
     * Constructs a new TomTom Map instance and attaches it to a DOM element.
     *
     * @param mapLibreOptions - MapLibre map configuration for viewport, controls, and rendering.
     * Includes properties like `container`, `center`, `zoom`, `bearing`, `pitch`, etc.
     * See {@link MapLibreOptions} for all available options.
     *
     * @param mapParams - TomTom-specific parameters including API key, style, and events.
     * Can be partially specified here if already set via global configuration.
     * See {@link TomTomMapParams} for all available parameters.
     *
     * @remarks
     * **Initialization Process:**
     * 1. Merges `mapParams` with global configuration
     * 2. Creates underlying MapLibre map instance
     * 3. Loads specified style asynchronously
     * 4. Sets `mapReady` to `true` when complete
     *
     * **Configuration Priority:**
     * - Parameters passed here override global configuration
     * - Allows per-map customization while sharing common settings
     *
     * @example
     * Minimal initialization:
     * ```typescript
     * const map = new TomTomMap(
     *   { container: 'map', center: [0, 0], zoom: 2 },
     *   { key: 'YOUR_API_KEY' }
     * );
     * ```
     *
     * @example
     * Full configuration:
     * ```typescript
     * const map = new TomTomMap(
     *   {
     *     container: 'map',
     *     center: [-122.4194, 37.7749],
     *     zoom: 13,
     *     pitch: 45,
     *     bearing: -17.6,
     *     antialias: true,
     *     maxZoom: 18,
     *     minZoom: 8
     *   },
     *   {
     *     key: 'YOUR_API_KEY',
     *     style: {
     *       type: 'standard',
     *       id: 'standardLight',
     *       include: ['trafficFlow', 'hillshade']
     *     },
     *     language: 'en-US',
     *     events: {
     *       precisionMode: 'point-then-box',
     *       paddingBoxPx: 10
     *     }
     *   }
     * );
     * ```
     *
     * @throws Will log errors if RTL text plugin fails to load (non-blocking)
     *
     * @see {@link MapLibreOptions}
     * @see {@link TomTomMapParams}
     * @see {@link https://maplibre.org/maplibre-gl-js-docs/api/map/ | MapLibre Map Parameters}
     * @see [Map Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)
     * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/map-styles)
     * @see [User Events Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/user-events)
     */
    constructor(mapLibreOptions: MapLibreOptions, mapParams?: Partial<TomTomMapParams>) {
        this._params = mergeFromGlobal(mapParams) as TomTomMapParams;
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this._params));
        this.mapLibreMap.once('styledata', () => this.handleStyleData(false));
        this._eventsProxy = new EventsProxy(this.mapLibreMap, this._params?.events);
        // deferred (just in case), lazy loading of the RTL plugin:
        setTimeout(() => {
            if (!['deferred', 'loaded'].includes(getRTLTextPluginStatus())) {
                setRTLTextPlugin(
                    'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',
                    true,
                ).catch((error) => console.error('Something went wrong when setting RTL plugin', error));
            }
        });
    }

    /**
     * Changes the map style dynamically without reloading the entire map.
     *
     * @param style - The new style to apply. Can be a string ID or a detailed style configuration.
     * @param options - Configuration options for the style change behavior.
     * @param options.keepState - Whether to preserve SDK-rendered items and configurations when changing styles.
     * When `true` (default), maintains traffic layers, routes, markers, and other SDK features.
     * When `false`, performs a clean style switch without preserving previous state.
     *
     * @remarks
     * **Behavior:**
     * - Temporarily sets {@link mapReady} to `false` during the transition
     * - Triggers all registered {@link StyleChangeHandler} callbacks
     * - Resets {@link mapReady} to `true` when the new style is fully loaded
     *
     * **State Preservation (keepState: true):**
     * - Merges style parts from the previous style with the new one
     * - Maintains SDK module layers (traffic, routes, POIs, etc.)
     * - Preserves language settings
     *
     * **Clean Switch (keepState: false):**
     * - Applies the new style without merging previous configuration
     * - Removes all SDK module layers
     * - Useful for complete style resets
     *
     * @example
     * Simple style change:
     * ```typescript
     * // Switch to dark mode
     * map.setStyle('standardDark');
     * ```
     *
     * @example
     * Style change with detailed configuration:
     * ```typescript
     * map.setStyle({
     *   type: 'standard',
     *   id: 'standardLight',
     *   include: ['trafficFlow', 'hillshade']
     * });
     * ```
     *
     * @example
     * Clean style switch without state preservation:
     * ```typescript
     * // Complete reset - removes all SDK layers and modules
     * map.setStyle('standardDark', { keepState: false });
     * ```
     *
     * @example
     * With style change handlers:
     * ```typescript
     * map.addStyleChangeHandler({
     *   onStyleAboutToChange: () => {
     *     console.log('Preparing for style change...');
     *   },
     *   onStyleChanged: () => {
     *     console.log('New style applied!');
     *   }
     * });
     *
     * map.setStyle('standardDark');
     * ```
     *
     * @see {@link TomTomMapParams.style} - For setting style during initialization
     * @see {@link StyleChangeHandler} - For handling style change events
     * @see {@link getStyle} - For retrieving the current style
     * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/map-styles)
     */
    setStyle = (style: StyleInput, options: { keepState?: boolean } = { keepState: true }): void => {
        this.mapReady = false;
        for (const handler of this.styleChangeHandlers) {
            try {
                handler.onStyleAboutToChange();
            } catch (e) {
                console.error(e);
            }
        }
        const effectiveStyle = options.keepState ? withPreviousStyleParts(style, this._params.style) : style;
        this._params = { ...this._params, style: effectiveStyle };
        this.mapLibreMap.once('styledata', () => {
            // We only handle the style data change if the applied style is still the same as the one we set,
            // to prevent race conditions when handling stale styles applied quickly in succession.
            // (If the current style parameters are different, there's likely a new style being set, which will trigger the handler soon after)
            if (!this.mapReady && isEqual(effectiveStyle, this._params.style)) {
                this.handleStyleData(options.keepState || true);
            }
        });
        this.mapLibreMap.setStyle(buildStyleInput(this._params));
    };

    /**
     * Retrieves the current style configuration of the map.
     *
     * @returns The current {@link StyleInput} configuration, or `undefined` if no style is set.
     *
     * @remarks
     * Returns the style configuration as it was set, not the fully resolved MapLibre style object.
     * Use this to inspect or store the current style configuration for later restoration.
     *
     * **Return Value:**
     * - String ID (e.g., `'standardLight'`) for simple style configurations
     * - Style object with `type`, `id`, and optional `include` properties for detailed configurations
     * - `undefined` if no style has been explicitly set
     *
     * @example
     * ```typescript
     * const currentStyle = map.getStyle();
     * console.log('Current style:', currentStyle);
     *
     * // Save style for later
     * const savedStyle = map.getStyle();
     *
     * // Later, restore it
     * if (savedStyle) {
     *   map.setStyle(savedStyle);
     * }
     * ```
     *
     * @example
     * Conditional logic based on current style:
     * ```typescript
     * const style = map.getStyle();
     * if (typeof style === 'string' && style.includes('Dark')) {
     *   console.log('Dark mode is active');
     * }
     * ```
     *
     * @see {@link setStyle} - For changing the map style
     * @see {@link StyleInput} - For available style configuration options
     */
    getStyle = (): StyleInput | undefined => {
        return this._params.style;
    };

    private _setLanguage(language: Language) {
        this._params = { ...this._params, language };
        const mapLanguage = language?.includes('-') ? language.split('-')[0] : language;
        this.mapLibreMap.getStyle().layers.forEach((layer) => {
            if (layer.type === 'symbol' && isLayerLocalizable(layer)) {
                const textFieldValue = mapLanguage
                    ? ['coalesce', ['get', `name_${mapLanguage}`], ['get', 'name']]
                    : ['get', 'name'];
                this.mapLibreMap.setLayoutProperty(layer.id, 'text-field', textFieldValue, { validate: false });
            }
        });
    }

    /**
     * Changes the language of the map.
     * * You can use this method to change the language at runtime.
     * * To set the language upon initialization, you can better do it via {@link core!TomTomConfig global config}
     * or {@link TomTomMapParams}.
     * @param language The language to be used in map translations.
     *
     * @remarks
     * **Behavior:**
     * - Updates all localizable map labels to the specified language
     * - Falls back to the default label name if the requested language is unavailable
     * - Can be called before or after the map is fully loaded
     * - If called before map is ready, will apply once the style loads
     *
     * **Language Format:**
     * - Simple language codes: `'en'`, `'fr'`, `'de'`, `'ja'`, `'zh'`
     * - Locale-specific codes: `'en-US'`, `'en-GB'`, `'zh-CN'`, `'pt-BR'`
     * - When using locale codes (with `-`), only the language portion is used for labels
     *
     * **Persistence:**
     * - Language setting persists across style changes (when `keepState: true`)
     * - Set during initialization via {@link TomTomMapParams.language} for immediate application
     *
     * @example
     * Change language at runtime:
     * ```typescript
     * // Switch to French
     * map.setLanguage('fr');
     * ```
     *
     * @example
     * Use locale-specific codes:
     * ```typescript
     * // Use Simplified Chinese
     * map.setLanguage('zh-CN');
     *
     * // Use Brazilian Portuguese
     * map.setLanguage('pt-BR');
     * ```
     *
     * @example
     * Language switcher UI:
     * ```typescript
     * const languageSelector = document.getElementById('lang-select');
     * languageSelector.addEventListener('change', (e) => {
     *   map.setLanguage(e.target.value);
     * });
     * ```
     *
     * @see {@link TomTomMapParams.language} - For setting language during initialization
     * @see {@link https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes | ISO 639-1 Language Codes}
     */
    setLanguage(language: Language) {
        if (this.mapReady) {
            this._setLanguage(language);
        } else {
            this.mapLibreMap.once('styledata', () => this.setLanguage(language));
        }
    }

    /**
     * Retrieves the current visible map area as a GeoJSON bounding box.
     *
     * @returns A {@link https://tools.ietf.org/html/rfc7946#section-5 | GeoJSON BBox} array
     * in the format `[west, south, east, north]` representing the map's current viewport bounds.
     *
     * @remarks
     * **Return Format:**
     * - Array of four numbers: `[minLongitude, minLatitude, maxLongitude, maxLatitude]`
     * - Coordinates are in WGS84 decimal degrees
     * - West/East values range from -180 to 180
     * - South/North values range from -90 to 90
     *
     * **Use Cases:**
     * - Performing spatial queries within the visible area
     * - Saving and restoring map view state
     * - Filtering data to display only what's visible
     * - Analytics and tracking of viewed regions
     *
     * @example
     * Get current bounds:
     * ```typescript
     * const bbox = map.getBBox();
     * console.log('Bounds:', bbox);
     * // Output: [-122.5, 37.7, -122.3, 37.8]
     * // [west, south, east, north]
     * ```
     *
     * @example
     * Use bounds for spatial query:
     * ```typescript
     * const bbox = map.getBBox();
     * const results = await searchAPI.searchInBoundingBox({
     *   bbox: bbox,
     *   query: 'restaurants'
     * });
     * ```
     *
     * @example
     * Save and restore map view:
     * ```typescript
     * // Save current view
     * const savedBounds = map.getBBox();
     * const savedZoom = map.mapLibreMap.getZoom();
     *
     * // Later, restore the view
     * const [west, south, east, north] = savedBounds;
     * map.mapLibreMap.fitBounds([[west, south], [east, north]]);
     * ```
     *
     * @see {@link https://tools.ietf.org/html/rfc7946#section-5 | GeoJSON BBox Specification}
     * @see {@link https://maplibre.org/maplibre-gl-js-docs/api/geography/#lnglatbounds | MapLibre LngLatBounds}
     */
    getBBox(): BBox {
        return this.mapLibreMap.getBounds().toArray().flat() as BBox;
    }

    private handleStyleData(keepState: boolean) {
        this.mapReady = true;
        if (keepState) {
            for (const handler of this.styleChangeHandlers) {
                try {
                    handler.onStyleChanged();
                } catch (e) {
                    console.error(e);
                }
            }
        }
        this._params.language && this._setLanguage(this._params.language);
        // For most use cases we'll need to have pins available (places, routing...) so we add them by default:
        // (subsequent loads for the same sprite should be cached)
        addPinSpriteToStyle(this._params, this.mapLibreMap);
    }

    /**
     * Registers a handler to be notified when the map style changes.
     *
     * @param handler - A {@link StyleChangeHandler} object with callbacks for style change events.
     *
     * @remarks
     * **When to Use:**
     * - You have custom layers or sources that need to be recreated after style changes
     * - Your application needs to respond to style switches (e.g., light/dark mode transitions)
     * - You need to save and restore state during style changes
     * - Map modules need to reinitialize when styles change
     *
     * **Handler Lifecycle:**
     * 1. `onStyleAboutToChange()` - Called before the style change begins
     * 2. Style change occurs
     * 3. `onStyleChanged()` - Called after the new style has been fully loaded
     *
     * **Multiple Handlers:**
     * - Multiple handlers can be registered and will all be called in registration order
     * - Each handler's errors are caught independently and logged to the console
     * - One failing handler won't prevent others from executing
     *
     * **Important Notes:**
     * - Handlers are only triggered by {@link setStyle} calls, not initial map construction
     * - Only called when `keepState: true` in {@link setStyle} options
     * - Handlers persist for the lifetime of the TomTomMap instance
     *
     * @example
     * Basic usage:
     * ```typescript
     * map.addStyleChangeHandler({
     *   onStyleAboutToChange: () => {
     *     console.log('Style is changing...');
     *   },
     *   onStyleChanged: () => {
     *     console.log('Style changed successfully!');
     *   }
     * });
     *
     * // Later trigger the handlers
     * map.setStyle('standardDark');
     * ```
     *
     * @example
     * Preserve custom layers across style changes:
     * ```typescript
     * let customLayerData = null;
     *
     * map.addStyleChangeHandler({
     *   onStyleAboutToChange: () => {
     *     // Save custom layer data before style changes
     *     if (map.mapLibreMap.getLayer('my-custom-layer')) {
     *       customLayerData = map.mapLibreMap.getSource('my-data')._data;
     *       map.mapLibreMap.removeLayer('my-custom-layer');
     *       map.mapLibreMap.removeSource('my-data');
     *     }
     *   },
     *   onStyleChanged: () => {
     *     // Restore custom layer after new style is loaded
     *     if (customLayerData) {
     *       map.mapLibreMap.addSource('my-data', {
     *         type: 'geojson',
     *         data: customLayerData
     *       });
     *       map.mapLibreMap.addLayer({
     *         id: 'my-custom-layer',
     *         type: 'circle',
     *         source: 'my-data',
     *         paint: { 'circle-radius': 6, 'circle-color': '#007cbf' }
     *       });
     *     }
     *   }
     * });
     * ```
     *
     * @example
     * Async handler for external API calls:
     * ```typescript
     * map.addStyleChangeHandler({
     *   onStyleAboutToChange: async () => {
     *     await saveStateToAPI(map.getStyle());
     *   },
     *   onStyleChanged: async () => {
     *     await loadStateFromAPI();
     *   }
     * });
     * ```
     *
     * @example
     * Update UI based on style:
     * ```typescript
     * map.addStyleChangeHandler({
     *   onStyleAboutToChange: () => {
     *     document.body.classList.add('style-changing');
     *   },
     *   onStyleChanged: () => {
     *     document.body.classList.remove('style-changing');
     *     const style = map.getStyle();
     *     if (typeof style === 'string' && style.includes('Dark')) {
     *       document.body.classList.add('dark-mode');
     *     } else {
     *       document.body.classList.remove('dark-mode');
     *     }
     *   }
     * });
     * ```
     *
     * @see {@link StyleChangeHandler} - Handler interface definition
     * @see {@link setStyle} - Method that triggers the handlers
     */
    addStyleChangeHandler(handler: StyleChangeHandler): void {
        this.styleChangeHandlers.push(handler);
    }
}
