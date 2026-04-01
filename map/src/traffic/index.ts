/**
 * @module map-traffic
 */

export { COLOR_SCHEMES, resolveColorStops } from './layers/areaAnalyticsLayers';
export * from './TrafficAreaAnalyticsModule';
export * from './TrafficFlowModule';
export * from './TrafficIncidentsModule';
export * from './types/trafficAreaAnalyticsConfig';
export * from './types/trafficAreaAnalyticsFeature';
export * from './types/trafficCommonConfig';
export * from './types/trafficFlowConfig';
export * from './types/trafficFlowFeature';
export * from './types/trafficIncidentsConfig';
export * from './types/trafficIncidentsFeature';
export { tilesToHexFeatures, tilesToPointFeatures, tilesToSquareFeatures } from './util/areaAnalyticsGeoJSONTiles';
