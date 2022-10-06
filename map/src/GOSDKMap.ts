import { Map } from "maplibre-gl";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { GOSDKMapParams, MapLibreOptions } from "./types/MapInit";
import { buildMapOptions } from "./init/BuildMapOptions";

/**
 * The map object displays a live map on a web application.
 */
export class GOSDKMap {
    public readonly map: Map;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param mapLibreOptions A subset of MapLibre options for MapLibre initialization.
     * @param goSDKParams The parameters to initialize the GO SDK map.
     */
    constructor(mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams) {
        this.map = new Map(buildMapOptions(mapLibreOptions, mergeFromGlobal(goSDKParams)));
    }
}
