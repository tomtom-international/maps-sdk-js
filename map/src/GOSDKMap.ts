import mapLibreExported, { Map } from "maplibre-gl";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions, StyleInput } from "./init/types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";
import { buildMapStyleInput } from "./init/MapStyleInputBuilder";
import { localizeMap } from "./utils/localization";

/**
 * The map object displays a live map on a web application.
 */
export class GOSDKMap {
    readonly mapLibreMap: Map;
    private goSDKParams: GOSDKMapParams;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams?: GOSDKMapParams) {
        this.goSDKParams = mergeFromGlobal(goSDKParams);
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.goSDKParams));
        if (!["deferred", "loaded"].includes(mapLibreExported.getRTLTextPluginStatus())) {
            mapLibreExported.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
                (error) => {
                    console.log("Something went wrong when setting RTL plugin", error);
                },
                true
            );
        }
    }

    setStyle = (style: StyleInput): void => {
        this.goSDKParams = { ...this.goSDKParams, style };
        this.mapLibreMap.setStyle(buildMapStyleInput(this.goSDKParams));
    };

    public localizeMap(locale: string) {
        localizeMap(this.mapLibreMap, locale);
    }
}
