import { Map } from "maplibre-gl";
import { GOSDKMap, VectorTilesHillshade, VectorTilePOIs, VectorTilesTraffic } from "map";

export type GOSDKThis = typeof globalThis & {
    // @ts-ignore
    GOSDK: typeof globalThis.GOSDK;
    goSDKMap: GOSDKMap;
    mapLibreMap: Map;
    traffic?: VectorTilesTraffic;
    pois?: VectorTilePOIs;
    hillshade?: VectorTilesHillshade;
};
