import type { LngLatLike, Map, MapGeoJSONFeature } from "maplibre-gl";
import type {
    BaseMapModule,
    GeometriesModule,
    HillshadeModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    SourceWithLayers,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule
} from "map";

export type MapsSDKThis = typeof globalThis & {
    // @ts-ignore
    MapsSDK: typeof globalThis.MapsSDK;
    // @ts-ignore
    MapsSDKCore: typeof globalThis.MapsSDKCore;
    tomtomMap: TomTomMap;
    mapLibreMap: Map;
    baseMap?: BaseMapModule;
    // extra base map instance that can coexist with the main one:
    baseMap2?: BaseMapModule;
    trafficIncidents?: TrafficIncidentsModule;
    trafficFlow?: TrafficFlowModule;
    pois?: POIsModule;
    hillshade?: HillshadeModule;
    places?: PlacesModule;
    places2?: PlacesModule;
    geometries?: GeometriesModule;
    routing?: RoutingModule;
    // These properties are used for testing events in a map
    // It's initialized by 0 and you can assert the count of:
    // Hovers
    _numOfHovers: number;
    _hoveredTopFeature?: unknown;
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
