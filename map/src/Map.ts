import { Map as MapRenderer } from "maplibre-gl";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { MapInitParams } from "./types/MapInit";
import { buildRendererInitParams } from "./init/BuildRendererInitParams";

/**
 * The map object displays a live map on a web application.
 */
export class Map {
    private readonly _renderer: MapRenderer;

    /**
     * Builds the map object and attaches it to an element of the web application.
     * @param params The parameters necessary to initialize the map.
     */
    constructor(params: MapInitParams) {
        this._renderer = new MapRenderer(buildRendererInitParams(mergeFromGlobal(params)));
    }
}
