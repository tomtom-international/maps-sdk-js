import mapLibreExported, { Map } from "maplibre-gl";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions, StyleInput } from "./init/types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";
import { buildMapStyleInput } from "./init/MapStyleInputBuilder";
import { MapLanguage } from "./language/MapLanguage";

/**
 * The map object displays a live map on a web application.
 */
export class GOSDKMap {
    readonly mapLibreMap: Map;
    mapReady = false;
    private goSDKParams: GOSDKMapParams;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams?: GOSDKMapParams) {
        this.goSDKParams = mergeFromGlobal(goSDKParams);
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.goSDKParams));
        this.mapLibreMap.once("styledata", () => (this.mapReady = true));
        if (!["deferred", "loaded"].includes(mapLibreExported.getRTLTextPluginStatus())) {
            mapLibreExported.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                (error) => {
                    console.error("Something went wrong when setting RTL plugin", error);
                },
                true
            );
        }
        goSDKParams?.language && this.localizeMap(goSDKParams?.language);
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
    localizeMap(language: string) {
        new MapLanguage(this, { language });
    }
}
