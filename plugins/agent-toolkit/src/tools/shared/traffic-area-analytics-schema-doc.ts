/**
 * @module agent-toolkit-tools
 *
 * Compact schema documentation for the `TrafficAreaAnalytics` shape, reused by every tool whose
 * LLM-authored code reads the injected `trafficAreaAnalytics` collection (`analyseData`, `processData`,
 * `clusterIncidents`). The metric numbers live under `feature.properties.baseData` — NOT directly on
 * `properties` — so without this the model reads the wrong path.
 */

/** @ignore */
export const TRAFFIC_AREA_ANALYTICS_SCHEMA_DOC =
    '`trafficAreaAnalytics` is a FeatureCollection of Polygon Features (one per analysed region). The ' +
    'aggregated metrics live under `feature.properties.baseData` (NOT directly on `properties`):\n' +
    '```ts\n' +
    'type AreaAnalyticsFeatureProperties = {\n' +
    '  name: string; timezone: string; level: number;\n' +
    '  baseData: {                 // aggregated over the whole period — the usual read\n' +
    '    speed?: number;           // avg km/h\n' +
    '    freeFlowSpeed?: number;   // avg uncongested km/h\n' +
    '    congestionLevel?: number; // % travel-time increase over free-flow\n' +
    '    travelTime?: number;      // minutes per 10 km\n' +
    '    networkLength?: number;   // meters of road network with data\n' +
    '  };\n' +
    '  timedData: { … };           // same metrics broken down by time granularity\n' +
    '  tiledData?: { tiles: Array<{ … }> }; // per-tile metrics, only when heatmap was requested\n' +
    '};\n' +
    "// the FeatureCollection's own `.properties` (collection-level):\n" +
    'type AreaAnalyticsCollectionProperties = {\n' +
    '  startDate: Date; endDate: Date;\n' +
    '  metrics: ("speed"|"freeFlowSpeed"|"congestionLevel"|"travelTime"|"networkLength")[];\n' +
    '  heatmap: boolean; frcs: number[];\n' +
    '  ranges: Partial<Record<metric, { min: number; max: number }>>; // data-driven min/max across tiles\n' +
    '};\n' +
    '```\n' +
    'Read metrics from `feature.properties.baseData.<metric>` (guard `?? 0`).';
