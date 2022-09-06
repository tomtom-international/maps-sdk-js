import { Map as RendererMap } from "@nav/web-renderer";
import { mergeFromGlobal } from "@anw/go-sdk-js/core";
import { MapInitParams } from "./types/MapInit";
import { buildRendererInitParams } from "./init/BuildRendererInitParams";

export class Map {
    private readonly _renderer: RendererMap;

    constructor(params: MapInitParams) {
        this._renderer = new RendererMap(buildRendererInitParams(mergeFromGlobal(params)));
    }
}
