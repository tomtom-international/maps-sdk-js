import { LngLatLike, Map, MapGeoJSONFeature } from "maplibre-gl";
import {
    GeoJSONPlaces,
    GeometryModule,
    TomTomMap,
    RoutingModule,
    SourceWithLayers,
    VectorTilePOIs,
    VectorTilesHillshade,
    VectorTilesTraffic
} from "map";

export type MapsSDKThis = typeof globalThis & {
    // @ts-ignore
    MapsSDK: typeof globalThis.MapsSDK;
    // @ts-ignore
    MapsSDKCore: typeof globalThis.MapsSDKCore;
    tomtomMap: TomTomMap;
    mapLibreMap: Map;
    traffic?: VectorTilesTraffic;
    pois?: VectorTilePOIs;
    hillshade?: VectorTilesHillshade;
    places?: GeoJSONPlaces;
    geometry?: GeometryModule;
    routing?: RoutingModule;
    // These properties are used for testing events in a map
    // It's initialized by 0 and you can assert the count of:
    // Hovers
    _numOfHovers: number;
    // Clicks
    _numOfClicks: number;
    // Right click
    _numOfContextmenuClicks: number;
    // Long-hover (The cursor stops for long period at the same layer)
    _numOfLongHovers: number;
    // These properties are used for testing the parameters returned
    // to the callback handler
    _clickedLngLat?: LngLatLike;
    _clickedTopFeature?: unknown;
    _clickedFeatures?: MapGeoJSONFeature[];
    _clickedSourceWithLayers?: SourceWithLayers;
};
