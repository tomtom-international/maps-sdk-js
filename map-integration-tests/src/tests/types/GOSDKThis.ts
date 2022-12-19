import { Map } from "maplibre-gl";
import {
    GeoJSONPlaces,
    GeometryModule,
    GOSDKMap,
    RoutingModule,
    VectorTilePOIs,
    VectorTilesHillshade,
    VectorTilesTraffic
} from "map";

export type GOSDKThis = typeof globalThis & {
    // @ts-ignore
    GOSDK: typeof globalThis.GOSDK;
    // @ts-ignore
    GOSDKCore: typeof globalThis.GOSDKCore;
    goSDKMap: GOSDKMap;
    mapLibreMap: Map;
    traffic?: VectorTilesTraffic;
    pois?: VectorTilePOIs;
    hillshade?: VectorTilesHillshade;
    places?: GeoJSONPlaces;
    geometry?: GeometryModule;
    routing?: RoutingModule;
    _numOfHovers: number;
    _numOfClicks: number;
    _numOfContextmenuClicks: number;
    _numOfLongHovers: number;
};
