import { Map } from "maplibre-gl";
import { GOSDKMap, VectorTilesHillshade, VectorTilePOIs, VectorTilesTraffic, GeoJSONPlaces, Geometry } from "map";

export type GOSDKThis = typeof globalThis & {
    // @ts-ignore
    GOSDK: typeof globalThis.GOSDK;
    goSDKMap: GOSDKMap;
    mapLibreMap: Map;
    traffic?: VectorTilesTraffic;
    pois?: VectorTilePOIs;
    hillshade?: VectorTilesHillshade;
    places?: GeoJSONPlaces;
    geometry?: Geometry;
};
