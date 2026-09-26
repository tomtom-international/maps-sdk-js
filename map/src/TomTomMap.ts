import { type BBox, type Language, mergeFromGlobal } from '@tomtom-org/maps-sdk/core';
import { isEqual } from 'lodash-es';
import type { ErrorEvent, ExpressionSpecification, StyleSpecification } from 'maplibre-gl';
import { getRTLTextPluginStatus, getVersion, Map, setRTLTextPlugin, setWorkerCount } from 'maplibre-gl';
import type { InternalTomTomMapParams, MapLibreOptions, StyleInput, TomTomMapParams } from './init';
import { buildMapOptions } from './init/buildMapOptions';
import { buildStyleInput, DEFAULT_STANDARD_STYLE_ID, withPreviousStyleParts } from './init/styleInputBuilder';
import {
    EventsProxy,
    filterLayersBySources,
    HILLSHADE_SOURCE_ID,
    LightDark,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from './shared';
import { isLayerLocalizable } from './shared/localization';
import {
    addPinCategoriesSpriteToStyle,
    detectStyleLightDarkTheme,
    getDeclaredLightDarkTheme,
    getStyleLightDarkTheme,
    isCustomStyle,
    transformRequest,
} from './shared/mapUtils';

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
 * const unsubscribe = map.addStyleChangeHandler(styleHandler);
 * // Call unsubscribe() when the handler's owner is torn down.
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
     * This method can be synchronous or asynchronous: the SDK awaits it before handing the new
     * style to MapLibre, so nothing of the old style is torn down while it runs.
     *
     * @param context - What kind of switch is happening; see {@link StyleChangeContext}.
     * @returns void or a Promise that resolves when preparation is complete
     */
    onStyleAboutToChange?: (context: StyleChangeContext) => void | Promise<void>;
    /**
     * Callback invoked after a new style has been fully loaded.
     *
     * @remarks
     * Use this to restore state, reinitialize layers, or perform other setup
     * that depends on the new style being ready. This method can be synchronous or asynchronous:
     * handlers run one after the other, in registration order, and the promise returned by
     * {@link TomTomMap.setStyle} resolves only once the last one has finished.
     *
     * @param context - What kind of switch is happening; see {@link StyleChangeContext}.
     * @returns void or a Promise that resolves when reinitialization is complete
     */
    onStyleChanged?: (context: StyleChangeContext) => void | Promise<void>;
    /**
     * Where this handler runs relative to the others: lower values run first, equal values run in
     * registration order. Defaults to `0`, which is also what the SDK's data and visibility modules
     * use; the SDK's {@link StylingModule} runs at `100` so semantic styling always lands on top of
     * whatever the modules restored.
     *
     * @default 0
     */
    priority?: number;
};

/**
 * What a {@link StyleChangeHandler} is told about the style switch it is reacting to.
 *
 * @remarks
 * The SDK's own modules read `resetState` to decide between restoring themselves (data, config,
 * filters) onto the new style, or re-binding to it with defaults and nothing shown. Your handlers
 * get the same information, so a custom overlay can make the same choice.
 *
 * @example
 * ```typescript
 * map.addStyleChangeHandler({
 *   onStyleChanged: ({ resetState }) => {
 *     if (resetState) dropCustomLayers();
 *     else reattachCustomLayers();
 *   },
 * });
 * ```
 *
 * @group Map Style
 */
export type StyleChangeContext = {
    /**
     * `true` for a clean switch (`setStyle(style, { resetState: true })`), `false` when the switch
     * carries SDK state over (`setStyle(style)` or `setStyle(style, { resetState: false })`).
     */
    resetState: boolean;
};

/**
 * Options accepted by {@link TomTomMap.setStyle}.
 *
 * @group Map Style
 */
export type SetStyleOptions = {
    /**
     * Whether to drop the SDK state instead of carrying it over to the new style.
     *
     * - `false` (default): module data and configuration, filters and the style parts of the
     *   previous style (traffic, hillshade) are restored onto the new style.
     * - `true`: a clean switch. Modules re-bind to the new style with default configuration and
     *   nothing shown, and only the style parts named in the new style input are loaded.
     *
     * The map language is not SDK state: it is re-applied in both cases, and only
     * {@link TomTomMap.setLanguage} changes it.
     *
     * Registered {@link StyleChangeHandler}s run in both cases and receive the value in their
     * {@link StyleChangeContext}.
     *
     * @default false
     */
    resetState?: boolean;
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
 * import { TomTomMap } from '@tomtom-org/maps-sdk/map';
 *
 * const map = new TomTomMap({
 *   key: 'YOUR_API_KEY',
 *   style: 'standardLight',
 *   mapLibre: {
 *     container: 'map',
 *     center: [4.9041, 52.3676],
 *     zoom: 10
 *   }
 * });
 * ```
 *
 * @example
 * With modules and configuration:
 * ```typescript
 * const map = new TomTomMap({
 *   key: 'YOUR_API_KEY',
 *   style: {
 *     type: 'standard',
 *     id: 'standardDark',
 *     include: ['trafficFlow', 'trafficIncidents']
 *   },
 *   language: 'en-US',
 *   events: {
 *     precisionMode: 'point-then-box',
 *     cursorOnHover: 'pointer'
 *   },
 *   mapLibre: {
 *     container: 'map',
 *     center: [-74.006, 40.7128],
 *     zoom: 12
 *   }
 * });
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
     *   const trafficFlowModule = await TrafficFlowModule.get(map);
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
     * @see {@link https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ | MapLibre Map Documentation}
     */
    readonly mapLibreMap: Map;
    /**
     * @ignore
     */
    readonly _eventsProxy: EventsProxy;
    /**
     * @ignore
     */
    _params: InternalTomTomMapParams;

    /**
     * Whether the loaded style draws a light or a dark map.
     *
     * @remarks
     * The SDK's own overlays read it to pick text and halo colours that stay legible over the
     * base map, and it is the property to bind your own UI to rather than parsing the style ID.
     *
     * A standard style is classified from its ID. A custom style reads `'light'` until it has
     * loaded — nothing about it is known before that — and is then classified from the colour its
     * `background` layer paints the canvas with; a custom style with no readable background colour
     * stays `'light'`. So read it inside an
     * {@link TomTomMap.addStyleChangeHandler | onStyleChanged} handler, or after awaiting
     * {@link setStyle}, rather than right after calling it.
     *
     * @example
     * ```typescript
     * await map.setStyle({ type: 'custom', url: 'https://example.com/my-style.json' });
     * document.body.classList.toggle('dark-mode', map.styleLightDarkTheme === 'dark');
     * ```
     */
    get styleLightDarkTheme(): LightDark {
        return this._styleLightDarkTheme;
    }

    private _styleLightDarkTheme: LightDark;

    private readonly styleChangeHandlers: StyleChangeHandler[] = [];

    // The exact style value last handed to MapLibre, so `loadIntoMapLibre` can tell when it is
    // being asked for the style MapLibre already holds.
    private styleGivenToMapLibre: StyleSpecification | string;

    // Incremented by every setStyle call. A call whose number is no longer current has been
    // superseded by a newer one and steps aside instead of applying a stale style.
    private styleRequestSequence = 0;

    // The MapLibre style load currently in flight, so the next one can wait for it: see
    // `applyStyle` for why two of them must not overlap.
    private styleLoadInFlight: Promise<void> | undefined;

    /**
     * Constructs a new TomTom Map instance and attaches it to a DOM element.
     *
     * @param mapParams - Combined TomTom and MapLibre parameters for map initialization.
     * Includes API key, style, events, and MapLibre options like container, center, zoom, etc.
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
     * const map = new TomTomMap({
     *   key: 'YOUR_API_KEY',
     *   mapLibre: {
     *     container: 'map',
     *     center: [0, 0],
     *     zoom: 2
     *   }
     * });
     * ```
     *
     * @example
     * Full configuration:
     * ```typescript
     * const map = new TomTomMap({
     *   key: 'YOUR_API_KEY',
     *   style: {
     *     type: 'standard',
     *     id: 'standardLight',
     *     include: ['trafficFlow', 'hillshade']
     *   },
     *   language: 'en-US',
     *   events: {
     *     precisionMode: 'point-then-box',
     *     paddingBoxPx: 10
     *   },
     *   mapLibre: {
     *     container: 'map',
     *     center: [-122.4194, 37.7749],
     *     zoom: 13,
     *     pitch: 45,
     *     bearing: -17.6,
     *     maxZoom: 18,
     *     minZoom: 8
     *   }
     * });
     * ```
     *
     * @throws Will log errors if RTL text plugin fails to load (non-blocking)
     *
     * @see {@link MapLibreOptions}
     * @see {@link TomTomMapParams}
     * @see {@link https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ | MapLibre Map Parameters}
     * @see [Map Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/quickstart)
     * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/styles)
     * @see [User Interaction Events Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/user-events)
     */
    constructor(mapParams: TomTomMapParams) {
        this._params = mergeFromGlobal(mapParams);
        if (this._params.style === undefined) {
            this._params = { ...this._params, style: DEFAULT_STANDARD_STYLE_ID };
        }
        this._styleLightDarkTheme = getStyleLightDarkTheme(this._params.style);
        this.ensureMapLibreCSSLoaded();

        // Set worker count before creating the Map instance.
        // MapLibre defaults to 1 worker (3 on Safari). 4 workers gives smooth
        // tile-by-tile transitions during style changes without starving the main thread.
        setWorkerCount(4);

        this.styleGivenToMapLibre = buildStyleInput(this._params);
        this.mapLibreMap = new Map(buildMapOptions(this._params));
        // Use `style.load` (fires once after style is fully parsed and all layers are created)
        // rather than `styledata` (fires repeatedly mid-load) — see setStyle for the reasoning.
        this.mapLibreMap.once('style.load', () => {
            void this.handleStyleData();
        });
        this._eventsProxy = new EventsProxy(this.mapLibreMap, this._params?.events);

        this.loadRTLTextPlugin();
    }

    private loadRTLTextPlugin(): void {
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
     * Dynamically loads the MapLibre CSS stylesheet from CDN.
     */
    private ensureMapLibreCSSLoaded(): void {
        if (typeof document === 'undefined') {
            return;
        }
        // Check if the CSS is already loaded to avoid duplicates:
        const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).some((element) =>
            element.textContent?.includes('.maplibregl-map'),
        );
        if (existingLink) {
            return;
        }

        // Create and inject a link tag to load CSS from unpkg CDN. The version comes from
        // maplibre's own `getVersion()` rather than a `maplibre-gl/package.json` import: that
        // import is a JSON module without an import attribute, which Node's ESM loader rejects
        // (ERR_IMPORT_ATTRIBUTE_MISSING), making the published bundle unimportable outside a
        // bundler. getVersion() also reports the maplibre actually loaded, which is what the
        // stylesheet has to match when the page brings its own copy via an import map.
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://unpkg.com/maplibre-gl@${getVersion()}/dist/maplibre-gl.css`;
        document.head.appendChild(link);
    }

    /**
     * Changes the map style dynamically without reloading the entire map.
     *
     * @param style - The new style to apply. Can be a string ID or a detailed style configuration.
     * @param options - Configuration options for the style change behavior, see {@link SetStyleOptions}.
     * @returns A promise that resolves once the new style is loaded and every registered
     * {@link StyleChangeHandler} has finished — including the SDK modules restoring themselves.
     * Awaiting it is optional; it is the moment after which the map is safe to read and draw on again.
     * @throws If the style itself fails to load, leaving {@link mapReady} `false` and the map on
     * the style it had. A tile or source that fails to load does not fail the switch.
     *
     * @remarks
     * **Carried-over state (the default):**
     * - Merges style parts from the previous style with the new one
     * - Restores SDK module data and configuration (traffic, routes, POIs, etc.)
     *
     * **Clean switch (resetState: true):**
     * - Applies exactly the style you passed, without merging previous style parts
     * - SDK modules re-bind to the new style with default configuration and nothing shown
     * - Useful for complete style resets
     *
     * Both keep the map language: it is configuration, not state, and it survives every style
     * change until {@link setLanguage} changes it.
     *
     * **Behavior:**
     * - Sets {@link mapReady} to `false` for the duration of the transition
     * - Awaits every `onStyleAboutToChange` handler, then hands the new style to MapLibre
     * - Once the style has loaded, sets {@link mapReady} back to `true` and awaits every
     *   `onStyleChanged` handler in registration order
     * - A `setStyle` call made while another one is still in flight supersedes it: the older
     *   call's style is never applied and its promise resolves as soon as that is known
     * - Passing the style already loaded runs the whole lifecycle without reloading it, which is
     *   how `resetState: true` doubles as a reset of the SDK modules over the current style
     * @example
     * Simple style change:
     * ```typescript
     * // Switch to dark mode
     * map.setStyle('standardDark');
     * ```
     *
     * @example
     * Wait for the switch to complete before drawing on the map:
     * ```typescript
     * await map.setStyle('standardDark');
     * // modules have restored themselves; map.mapReady is true again
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
     * map.setStyle('standardDark', { resetState: true });
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
     * @see [Map Styles Guide](https://docs.tomtom.com/maps-sdk-js/guides/map/styles)
     */
    setStyle = (style: StyleInput, options: SetStyleOptions = {}): Promise<void> => {
        const context: StyleChangeContext = { resetState: options.resetState ?? false };
        this.mapReady = false;
        const requestNumber = ++this.styleRequestSequence;

        // The new style is recorded synchronously so `getStyle()` answers with it right away, and
        // so a second call arriving while handlers run sees what it is superseding.
        const effectiveStyle = context.resetState ? style : withPreviousStyleParts(style, this._params.style);
        this._params = { ...this._params, style: effectiveStyle };
        this._styleLightDarkTheme = getStyleLightDarkTheme(effectiveStyle);
        return this.applyStyle(context, requestNumber);
    };

    private async applyStyle(context: StyleChangeContext, requestNumber: number): Promise<void> {
        // Modules mark themselves as not ready here; custom handlers save what they need to.
        await this.notifyHandlers('onStyleAboutToChange', context);
        if (this.isSuperseded(requestNumber)) return;

        // One load at a time. MapLibre aborts the request of a style it is asked to replace, but a
        // response that had already arrived is applied regardless, so two overlapping loads can
        // land in either order and leave the superseded style on the map. Waiting for the load in
        // flight — however it ends — keeps the last style asked for the last one applied.
        await this.styleLoadInFlight?.catch(() => undefined);
        if (this.isSuperseded(requestNumber)) return;

        const styleLoad = this.loadIntoMapLibre();
        this.styleLoadInFlight = styleLoad;
        try {
            await styleLoad;
        } finally {
            if (this.styleLoadInFlight === styleLoad) {
                this.styleLoadInFlight = undefined;
            }
        }
        // A newer setStyle call owns the style that just loaded (or is about to load).
        if (this.isSuperseded(requestNumber)) return;

        try {
            await this.handleStyleData(context);
        } catch (error) {
            console.error(error);
        }
    }

    // Hands the style built from the current params to MapLibre and resolves once it has loaded,
    // or rejects if the style itself fails to arrive.
    //
    // Resolves right away when that style is the one MapLibre already holds: MapLibre diffs it to
    // no operations, does no work and never fires `style.load`, so waiting for that event would
    // hang forever. The switch still has to run on the SDK's side — re-applying the loaded style
    // with `resetState: true` is how a caller asks the modules to reset.
    private async loadIntoMapLibre(): Promise<void> {
        const style = buildStyleInput(this._params);
        if (isEqual(style, this.styleGivenToMapLibre)) return;
        const previousStyle = this.styleGivenToMapLibre;
        this.styleGivenToMapLibre = style;

        // `style.load` fires once after MapLibre finishes applying all diff operations from the
        // new style — at that point every new layer exists in `map.getStyle().layers`, which is
        // what the module-restoration snapshot needs. Using `styledata` here would race because
        // it fires repeatedly during the diff and may run `handleStyleData` before all layers
        // are present.
        await new Promise<void>((resolve, reject) => {
            const onStyleLoad = () => {
                this.mapLibreMap.off('error', onError);
                resolve();
            };
            const onError = (event: ErrorEvent) => {
                // A tile or source failure carries the source's id and is not fatal. One without
                // it, before `style.load`, is the style itself failing: no load will ever follow.
                if ('sourceId' in event) return;
                this.mapLibreMap.off('style.load', onStyleLoad);
                this.mapLibreMap.off('error', onError);
                // MapLibre still holds the previous style, so a retry is a switch, not a no-op.
                this.styleGivenToMapLibre = previousStyle;
                // MapLibre only promises an object with a message, so a `catch` gets a real Error.
                reject(event.error instanceof Error ? event.error : new Error(event.error.message));
            };
            this.mapLibreMap.once('style.load', onStyleLoad);
            this.mapLibreMap.on('error', onError);
            this.mapLibreMap.setStyle(style, { validate: false });
        });
    }

    private isSuperseded(requestNumber: number): boolean {
        return requestNumber !== this.styleRequestSequence;
    }

    // Runs one lifecycle callback on every handler, one after the other, by ascending priority and
    // then registration order (sort is stable). Iterates a snapshot so a handler that unsubscribes
    // itself (or another) during the callback doesn't shift the live array out from under the
    // loop. A failing handler is logged and does not stop the others.
    private async notifyHandlers(
        callback: 'onStyleAboutToChange' | 'onStyleChanged',
        context: StyleChangeContext,
    ): Promise<void> {
        const handlers = [...this.styleChangeHandlers].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
        for (const handler of handlers) {
            try {
                await handler[callback]?.(context);
            } catch (error) {
                console.error(error);
            }
        }
    }

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

    /**
     * Re-tags the `tomtom-user-agent` header this map sends on its MapLibre requests (style, tiles,
     * sprites, glyphs), letting a product embedding the SDK count the traffic under its own name,
     * by convention as `<Name>/<version>`. Prefer setting it on the global config when the identity
     * is known before the map exists.
     *
     * Takes effect from the next request; anything already fetched or cached keeps its old tag.
     *
     * @ignore
     */
    _setTomTomUserAgent(userAgent: string): void {
        // Written through a cast: the key is deliberately absent from the params types.
        this._params = { ...this._params, 'tomtom-user-agent': userAgent } as InternalTomTomMapParams;
        // MapLibre only accepts a `transformRequest` at construction, so re-install it.
        this.mapLibreMap.setTransformRequest(transformRequest(this._params));
    }

    private _setLanguage(language: Language) {
        this._params = { ...this._params, language };
        const mapLanguage = language?.includes('-') ? language.split('-')[0] : language;
        this.mapLibreMap.getStyle().layers.forEach((layer) => {
            if (layer.type === 'symbol' && isLayerLocalizable(layer)) {
                const textFieldValue: ExpressionSpecification = mapLanguage
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
     * - The language persists across every style change, a clean switch
     *   ({@link SetStyleOptions.resetState}) included: it is map configuration rather than SDK
     *   state, and this method is the only thing that changes it
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
     * @returns A {@link https://datatracker.ietf.org/doc/html/rfc7946#section-5 | GeoJSON BBox} array
     * in the format `[west, south, east, north]` representing the map's current viewport bounds.
     *
     * @remarks
     * **Return Format:**
     * - Array of four numbers: `[minLongitude, minLatitude, maxLongitude, maxLatitude]`
     * - Coordinates are in WGS84 decimal degrees
     * - West/East values range from -180 to 180
     * - South/North values range from -90 to 90
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
     * @see {@link https://datatracker.ietf.org/doc/html/rfc7946#section-5 | GeoJSON BBox Specification}
     * @see {@link https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLatBounds/ | MapLibre LngLatBounds}
     */
    getBBox(): BBox {
        return this.mapLibreMap.getBounds().toArray().flat() as BBox;
    }

    // Finishes a style load: the initial one (no context) or a `setStyle` switch (its context).
    private async handleStyleData(context?: StyleChangeContext): Promise<void> {
        // We ensure to make traffic and hillshade hidden by default (even if right after the modules bring it back to visible state)
        // This way we ensure such layers are invisible even of their related SDK modules are not used.
        for (const layer of filterLayersBySources(this.mapLibreMap, [
            TRAFFIC_INCIDENTS_SOURCE_ID,
            TRAFFIC_FLOW_SOURCE_ID,
            HILLSHADE_SOURCE_ID,
        ])) {
            this.mapLibreMap.setLayoutProperty(layer.id, 'visibility', 'none', { validate: false });
        }

        // A custom style that declares no theme tells us nothing about it until it is loaded; now
        // that it is, read the theme off the style itself so overlays (places, routes) pick text
        // colours that stay legible. A declared theme is already in place and is left alone.
        if (isCustomStyle(this._params.style) && !getDeclaredLightDarkTheme(this._params.style)) {
            this._styleLightDarkTheme =
                detectStyleLightDarkTheme(this.mapLibreMap.getStyle()) ?? this._styleLightDarkTheme;
        }

        // For most use cases we'll need to have pins available (places, routing...) so we add them by default:
        // (subsequent loads for the same sprite should be cached)
        addPinCategoriesSpriteToStyle(this._params, this._styleLightDarkTheme, this.mapLibreMap);
        // The language is map configuration, not carried-over state, so it is re-applied on every
        // style load, a clean switch included: a new style resets the `text-field` of every layer.
        // Only `setLanguage` changes it.
        this._params.language && this._setLanguage(this._params.language);

        this.mapReady = true;
        if (context) {
            // Modules restore (or reset) themselves here, then custom handlers run, all in order.
            await this.notifyHandlers('onStyleChanged', context);
        }
    }

    /**
     * Registers a handler to be notified when the map style changes.
     *
     * @param handler - A {@link StyleChangeHandler} object with callbacks for style change events.
     *
     * @returns An unsubscribe function that removes this handler. Call it when the
     * handler's owner (e.g. a custom overlay) is torn down — otherwise the handler,
     * and everything it closes over, lives for the lifetime of the map. Mirrors the
     * disposer returned by module event handlers (`module.events.on(...)`).
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
     * - Async callbacks are awaited one after the other; the promise returned by {@link setStyle}
     *   resolves once the last one has finished
     * - Each handler's errors are caught independently and logged to the console
     * - One failing handler won't prevent others from executing
     *
     * **Important Notes:**
     * - Handlers are only triggered by {@link setStyle} calls, not initial map construction
     * - Handlers run for a clean switch as well as for one that carries state over, and receive
     *   which one it is in their {@link StyleChangeContext}
     * - Handlers persist for the lifetime of the TomTomMap instance unless unsubscribed
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
     * Unsubscribe when the owner is torn down:
     * ```typescript
     * const unsubscribe = map.addStyleChangeHandler({
     *   onStyleChanged: () => reattachCustomLayers(),
     * });
     *
     * // Later, when the overlay is removed:
     * unsubscribe();
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
    addStyleChangeHandler(handler: StyleChangeHandler): () => void {
        this.styleChangeHandlers.push(handler);
        let disposed = false;
        return () => {
            if (disposed) return;
            disposed = true;
            const index = this.styleChangeHandlers.indexOf(handler);
            if (index !== -1) this.styleChangeHandlers.splice(index, 1);
        };
    }
}
