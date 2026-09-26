import type { Feature, FeatureCollection, Point } from 'geojson';
import type {
    BaseMapEventScope,
    BaseMapModule,
    CustomGeoJSONModule,
    GeometriesModule,
    PlacesModule,
    POIsModule,
    RoutingModule,
    SourceWithLayers,
    StylingModule,
    TerrainModule,
    TomTomMap,
    TrafficAreaAnalyticsModule,
    TrafficFlowModule,
    TrafficIncidentOverlayModule,
    TrafficIncidentsModule,
    UserEvents,
} from 'map';
import type { LngLatLike, Map, MapGeoJSONFeature } from 'maplibre-gl';

/**
 * Extension of globalThis with convenient SDK properties for testing.
 */
export type MapsSDKThis = typeof globalThis & {
    // @ts-ignore
    MapsSDK: typeof globalThis.MapsSDK;
    // @ts-ignore
    MapsSDKCore: typeof globalThis.MapsSDKCore;
    tomtomMap: TomTomMap;
    mapLibreMap: Map;
    baseMap?: BaseMapModule;
    // The base map is shared per map, so two independently-handled parts of it are two scopes of
    // the one module rather than two instances.
    baseMapScope?: UserEvents<MapGeoJSONFeature, BaseMapEventScope>;
    baseMapScope2?: UserEvents<MapGeoJSONFeature, BaseMapEventScope>;
    trafficIncidents?: TrafficIncidentsModule;
    trafficIncidentOverlay?: TrafficIncidentOverlayModule;
    trafficFlow?: TrafficFlowModule;
    pois?: POIsModule;
    styling?: StylingModule;
    terrain?: TerrainModule;
    places?: PlacesModule;
    places2?: PlacesModule;
    geometries?: GeometriesModule;
    customGeoJSON?: CustomGeoJSONModule<{ points: FeatureCollection<Point> }>;
    makeIcon: (color: string) => ImageData;
    trafficAreaAnalytics?: TrafficAreaAnalyticsModule;
    routing?: RoutingModule;
    routing2?: RoutingModule;
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
    _clickedFeatures?: Feature[];
    _clickedSourceWithLayers?: SourceWithLayers;
    // These properties are used for testing module events (config-change, shown-features)
    _configChangeResult: unknown;
    _configChangeCount: number;
    _configChangeUnsub?: () => void;
    _shownFeaturesResult: unknown;
    _shownFeaturesCount: number;
    _shownFeaturesUnsub?: () => void;
    // The `map` parameter of every style MapLibre has applied since the recorder was installed, in
    // the order it applied them
    _appliedStyles: string[];
};
