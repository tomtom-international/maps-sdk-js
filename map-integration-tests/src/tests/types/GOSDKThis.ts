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
    goSDKMap: GOSDKMap;
    mapLibreMap: Map;
    traffic?: VectorTilesTraffic;
    pois?: VectorTilePOIs;
    hillshade?: VectorTilesHillshade;
    places?: GeoJSONPlaces;
    geometry?: GeometryModule;
    routing?: RoutingModule;
};
