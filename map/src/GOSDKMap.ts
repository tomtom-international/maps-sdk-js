import mapLibreExported, { Map } from "maplibre-gl";
import { BBox } from "geojson";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions, StyleInput } from "./init/types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";
import { buildMapStyleInput } from "./init/MapStyleInputBuilder";
import { EventsProxy } from "./shared";
import { isLayerLocalizable } from "./shared/localization";

/**
 * The map object displays the TomTom live map on a web application and allows to easily integrate its services on it.
 * * It uses MapLibre and exposes its Map instance via a "mapLibreMap" property.
 */
export class GOSDKMap {
    mapReady = false;
    /**
     * The MapLibre Map instance.
     * * Once the SDK Map is constructed, this object is ready to be used.
     * * Use it whenever you want to leverage MapLibre's power directly.
     * @see https://maplibre.org/maplibre-gl-js-docs/api/map/#map-instance-members
     */
    readonly mapLibreMap: Map;
    private goSDKParams: GOSDKMapParams;
    _eventsProxy: EventsProxy;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams?: GOSDKMapParams) {
        this.goSDKParams = mergeFromGlobal(goSDKParams);
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.goSDKParams));
        this.mapLibreMap.once("styledata", () => this.handleStyleData());
        this._eventsProxy = new EventsProxy(this.mapLibreMap, goSDKParams?.events);
        if (!["deferred", "loaded"].includes(mapLibreExported.getRTLTextPluginStatus())) {
            mapLibreExported.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                (error) => console.error("Something went wrong when setting RTL plugin", error),
                true
            );
        }
        goSDKParams?.language && this.setLanguage(goSDKParams?.language);
    }

    /**
     * Changes the map style on the fly, without reloading the map.
     * @param style The new style to set.
     */
    setStyle = (style: StyleInput): void => {
        this.goSDKParams = { ...this.goSDKParams, style };
        this.mapReady = false;
        this.mapLibreMap.once("styledata", () => this.handleStyleData());
        this.mapLibreMap.setStyle(buildMapStyleInput(this.goSDKParams));
    };

    private updateMapLanguage(language: string) {
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
     * Change the map language.
     * @param language The language to be used in map translations.
     * @see List of supported languages: https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages
     */
    setLanguage(language: string) {
        if (this.mapReady || this.mapLibreMap.isStyleLoaded()) {
            this.updateMapLanguage(language);
        } else {
            this.mapLibreMap.once("styledata", () => this.updateMapLanguage(language));
        }
    }

    getBounds(): BBox {
        return this.mapLibreMap.getBounds().toArray().flat() as BBox;
    }

    private handleStyleData() {
        this.mapReady = true;
        /**
         * This solution is a workaround since the base map style still comes with some POIs when excluded as part of map style
         */
        if (this.goSDKParams?.exclude?.includes("poi")) {
            this.mapLibreMap.setLayoutProperty("POI", "visibility", "none", { validate: false });
        }
    }
}
