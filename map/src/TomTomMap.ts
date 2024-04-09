import { getRTLTextPluginStatus, Map, setRTLTextPlugin } from "maplibre-gl";
import type { BBox } from "geojson";
import type { Language } from "@anw/maps-sdk-js/core";
import { mergeFromGlobal } from "@anw/maps-sdk-js/core";
import isEqual from "lodash/isEqual";
import type { MapLibreOptions, StyleInput, TomTomMapParams } from "./init";
import { buildMapOptions } from "./init/buildMapOptions";
import { buildStyleInput, withPreviousStyleParts } from "./init/styleInputBuilder";
import { EventsProxy } from "./shared";
import { isLayerLocalizable } from "./shared/localization";

/**
 * The TomTom Map object is the entry point to display the TomTom live map on your web application.
 *
 * * It uses [MapLibre GL JS](https://maplibre.org/maplibre-gl-js-docs/api/) and exposes its
 * [Map instance](https://maplibre.org/maplibre-gl-js-docs/api/map/#map-instance-members) via the
 * {@link mapLibreMap} property.
 */
export class TomTomMap {
    /**
     * Whether the map style has been loaded.
     */
    mapReady = false;
    /**
     * The MapLibre Map [instance](https://maplibre.org/maplibre-gl-js-docs/api/map/#map-instance-members).
     * * Once the SDK Map is constructed, this object is ready to be used.
     * * Use it whenever you want to leverage MapLibre's power directly.
     */
    readonly mapLibreMap: Map;
    /**
     * @ignore
     */
    _eventsProxy: EventsProxy;
    private params: TomTomMapParams;
    private styleChangeHandlers: (() => void)[] = [];

    /**
     * This constructor is the main entry point to create a TomTom Map with the SDK.
     *
     * It builds the MapLibre map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of
     * [MapLibre Map options](https://maplibre.org/maplibre-gl-js-docs/api/map/#map-parameters)
     * for its map initialization.
     * @param mapParams The TomTom parameters to initialize map.
     * They will be merged from the {@link core!TomTomConfig global config}.
     * Therefore, you must have the mandatory parameters either already set via global config, or directly set here.
     */
    constructor(mapLibreOptions: MapLibreOptions, mapParams?: Partial<TomTomMapParams>) {
        this.params = mergeFromGlobal(mapParams) as TomTomMapParams;
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.params));
        this.mapLibreMap.once("styledata", () => this.handleStyleData(false));
        this._eventsProxy = new EventsProxy(this.mapLibreMap, this.params?.events);
        // deferred (just in case), lazy loading of the RTL plugin:
        setTimeout(() => {
            if (!["deferred", "loaded"].includes(getRTLTextPluginStatus())) {
                setRTLTextPlugin(
                    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                    true
                ).catch((error) => console.error("Something went wrong when setting RTL plugin", error));
            }
        });
    }

    /**
     * Changes the map style on the fly, without reloading the map.
     * * You can use this method to change the style at runtime.
     * * To set the style upon {@link constructor initialization}, you can better do it via {@link TomTomMapParams}.
     * @param style The new style to set.
     * @param options Additional options for behavior upon style change.
     * @param options.keepState Whether to restore previous SDK rendered items and configurations. Defaults to true.
     */
    setStyle = (style: StyleInput, options: { keepState?: boolean } = { keepState: true }): void => {
        this.mapReady = false;
        const effectiveStyle = options.keepState ? withPreviousStyleParts(style, this.params.style) : style;
        this.params = { ...this.params, style: effectiveStyle };
        this.mapLibreMap.once("styledata", () => {
            // We only handle the style data change if the applied style is still the same as the one we set,
            // to prevent race conditions when handling stale styles applied quickly in succession.
            // (If the current style parameters are different, there's likely a new style being set, which will trigger the handler soon after)
            if (!this.mapReady && isEqual(effectiveStyle, this.params.style)) {
                this.handleStyleData(options.keepState || true);
            }
        });
        this.mapLibreMap.setStyle(buildStyleInput(this.params));
    };

    /**
     * Returns the current style of the map.
     */
    getStyle = (): StyleInput | undefined => {
        return this.params.style;
    };

    private _setLanguage(language: Language) {
        this.params = { ...this.params, language };
        const mapLanguage = language?.includes("-") ? language.split("-")[0] : language;
        this.mapLibreMap.getStyle().layers.forEach((layer) => {
            if (layer.type == "symbol" && isLayerLocalizable(layer)) {
                const textFieldValue = mapLanguage
                    ? ["coalesce", ["get", `name_${mapLanguage}`], ["get", "name"]]
                    : ["get", "name"];
                this.mapLibreMap.setLayoutProperty(layer.id, "text-field", textFieldValue, { validate: false });
            }
        });
    }

    /**
     * Changes the language of the map.
     * * You can use this method to change the language at runtime.
     * * To set the language upon initialization, you can better do it via {@link core!TomTomConfig global config}
     * or {@link TomTomMapParams}.
     * @param language The language to be used in map translations.
     */
    setLanguage(language: Language) {
        if (this.mapReady) {
            this._setLanguage(language);
        } else {
            this.mapLibreMap.once("styledata", () => this.setLanguage(language));
        }
    }

    /**
     * Get the current bounding box in a BBox type
     * * This method returns a GeoJSON format bounding box coordinates.
     * @returns BBox
     */
    getBBox(): BBox {
        return this.mapLibreMap.getBounds().toArray().flat() as BBox;
    }

    private handleStyleData(keepState: boolean) {
        this.mapReady = true;
        if (keepState) {
            for (const handler of this.styleChangeHandlers) {
                try {
                    handler();
                } catch (e) {
                    console.error(e);
                }
            }
        }
        this.params.language && this._setLanguage(this.params.language);
    }

    /**
     * Adds a handler function to style changes done to this map via the "setStyle" method.
     * @param handler The handler function, which will be called when "setStyle" was called.
     */
    addStyleChangeHandler(handler: () => void): void {
        this.styleChangeHandlers.push(handler);
    }
}
