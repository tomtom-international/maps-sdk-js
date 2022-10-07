import { Map } from "maplibre-gl";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions, StyleInput } from "./init/types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";
import { buildMapStyleInput } from "./init/MapStyleInputBuilder";

/**
 * The map object displays a live map on a web application.
 */
export class GOSDKMap {
    public readonly mapLibreMap: Map;
    private goSDKParams: GOSDKMapParams;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams?: GOSDKMapParams) {
        this.goSDKParams = mergeFromGlobal(goSDKParams);
        this.mapLibreMap = new Map(buildMapOptions(mapLibreOptions, this.goSDKParams));
    }

    public setStyle(style: StyleInput) {
        this.goSDKParams = { ...this.goSDKParams, style };
        this.mapLibreMap.setStyle(buildMapStyleInput(this.goSDKParams));
    }
}
