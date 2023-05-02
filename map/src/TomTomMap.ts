import mapLibreExported, { Map } from "maplibre-gl";
import { BBox } from "geojson";
import { Language, mergeFromGlobal } from "@anw/maps-sdk-js/core";
import { MapLibreOptions, StyleInput, TomTomMapParams } from "./init";
import { buildMapOptions } from "./init/buildMapOptions";
import { buildMapStyleInput } from "./init/mapStyleInputBuilder";
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
        if (!["deferred", "loaded"].includes(mapLibreExported.getRTLTextPluginStatus())) {
            mapLibreExported.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                (error) => console.error("Something went wrong when setting RTL plugin", error),
                true
            );
        }
        this.params?.language && this.setLanguage(this.params?.language);
    }

    /**
     * Changes the map style on the fly, without reloading the map.
     * * You can use this method to change the style at runtime.
     * * To set the style upon {@link constructor initialization}, you can better do it via {@link TomTomMapParams}.
     * @param style The new style to set.
     * @param keepState Whether to restore previous SDK rendered items and configurations. Defaults to true.
     */
    setStyle = (style: StyleInput, keepState = true): void => {
        this.params = { ...this.params, style };
        this.mapReady = false;
        this.mapLibreMap.once("styledata", () => this.handleStyleData(keepState));
        this.mapLibreMap.setStyle(buildMapStyleInput(this.params));
    };

    /**
     * Returns the current style of the map.
     */
    getStyle = (): StyleInput | undefined => {
        return this.params.style;
    };
    private _setLanguage(language: Language) {
        this.params = { ...this.params, language };
        this.mapLibreMap.getStyle().layers.forEach((layer) => {
            if (layer.type == "symbol" && isLayerLocalizable(layer)) {
                const textFieldValue = language
                    ? ["coalesce", ["get", `name_${language}`], ["get", "name"]]
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
        if (this.mapReady || this.mapLibreMap.isStyleLoaded()) {
            this._setLanguage(language);
        } else {
            this.mapLibreMap.once("styledata", () => this._setLanguage(language));
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
        // (We use setTimeout to compensate for a MapLibre glitch where symbol layers can't get added right after
        // a styledata event. With this setTimeout, we wait just a tiny bit more which mitigates the issue)
        keepState && setTimeout(() => this.styleChangeHandlers.forEach((handler) => handler()));
        this.params.language && this._setLanguage(this.params.language);
        // This solution is a workaround since the base map style still comes with some POIs when excluded as part of map style:
        const style = this.params?.style;
        console.log("handleStyleData");
        if (!(typeof style === "object" && style.type == "published" && style.include?.includes("poi"))) {
            console.log("handleStyleData, pois shouldn't be shown");
            this.mapLibreMap.setLayoutProperty("POI", "visibility", "none", { validate: false });
        }
    }

    /**
     * @ignore
     */
    _addStyleChangeHandler(handler: () => void): void {
        this.styleChangeHandlers.push(handler);
    }
}
