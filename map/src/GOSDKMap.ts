import mapLibreExported, { Map } from "maplibre-gl";
import { BBox } from "geojson";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions, StyleInput } from "./init/types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";
import { buildMapStyleInput } from "./init/MapStyleInputBuilder";
import { MapLanguage } from "./language";
import { EventProxy } from "./core";

/**
 * The map object displays a live map on a web application.
 */
export class GOSDKMap {
    mapReady = false;
    readonly mapLibreMap: Map;
    private goSDKParams: GOSDKMapParams;
    _eventsProxy: EventProxy;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams?: GOSDKMapParams) {
        this.goSDKParams = mergeFromGlobal(goSDKParams);
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.goSDKParams));
        this.mapLibreMap.once("styledata", () => (this.mapReady = true));
        this._eventsProxy = new EventProxy(this.mapLibreMap);
        if (!["deferred", "loaded"].includes(mapLibreExported.getRTLTextPluginStatus())) {
            mapLibreExported.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                (error) => {
                    console.error("Something went wrong when setting RTL plugin", error);
                },
                true
            );
        }
        goSDKParams?.language && this.setLanguage(goSDKParams?.language);
    }

    setStyle = (style: StyleInput): void => {
        this.goSDKParams = { ...this.goSDKParams, style };
        this.mapReady = false;
        this.mapLibreMap.once("styledata", () => (this.mapReady = true));
        this.mapLibreMap.setStyle(buildMapStyleInput(this.goSDKParams));
    };

    /**
     * Change the map language.
     * @param language The language to be used in map translations.
     * @see List of supported languages: https://developer.tomtom.com/map-display-api/documentation/vector/content-v2#list-of-supported-languages
     */
    setLanguage(language: string) {
        MapLanguage.setLanguage(this, { language });
    }

    getBounds(): BBox {
        return this.mapLibreMap.getBounds().toArray().flat() as BBox;
    }
}
