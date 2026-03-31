# Traffic Reference

## Imports

```ts
import { TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import { trafficIncidentDetails, trafficAreaAnalytics, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
```

---

## Traffic flow overlay

```ts
const trafficFlow = await TrafficFlowModule.get(map, { visible: true });

trafficFlow.setVisible(false);

// Filter to specific road categories
trafficFlow.filter({
    any: [{
        roadCategories: {
            show: 'only',    // 'only' | 'all_except'
            values: ['motorway', 'trunk', 'primary'],
        },
    }],
});
trafficFlow.filter(undefined);  // reset

trafficFlow.events.on('click', (feature) => { showSpeedInfo(feature); });
trafficFlow.events.on('hover', (feature) => { });
```

Road categories: `motorway`, `motorway_link`, `trunk`, `trunk_link`, `primary`, `primary_link`, `secondary`, `secondary_link`, `tertiary`, `tertiary_link`, `street`, `service`, `track`

---

## Traffic incidents overlay

```ts
const trafficIncidents = await TrafficIncidentsModule.get(map, {
    visible: true,
    icons: { visible: true },
});

// Filter by severity
trafficIncidents.filter({
    any: [{ magnitudes: { show: 'all_except', values: ['minor'] } }],
});

// Filter by incident type
trafficIncidents.filter({
    any: [{ incidentCategories: { show: 'only', values: ['accident', 'road_closed', 'jam'] } }],
});

// Filter by delay
trafficIncidents.filter({
    any: [{ delays: { mustHaveDelay: true, minDelayMinutes: 5 } }],
});

trafficIncidents.filter(undefined);  // reset
trafficIncidents.setIconsVisible(false);
trafficIncidents.setVisible(false);

trafficIncidents.events.on('click', (feature) => {
    const { category, magnitudeOfDelay, delayInSeconds } = feature.properties;
});
```

Magnitudes: `'minor'`, `'moderate'`, `'major'`, `'indefinite'`, `'unknown'`

Incident categories: `accident`, `animals-on-road`, `broken-down-vehicle`, `danger`, `flooding`, `fog`, `frost`, `jam`, `lane-closed`, `narrow-lanes`, `other`, `rain`, `road-closed`, `roadworks`, `wind`

### Runtime reconfiguration with `applyConfig()`

Change module appearance or behavior without re-creating the module:

```ts
trafficFlow.applyConfig(newFlowConfig);
trafficIncidents.applyConfig(newIncidentsConfig);
```

---

## Map click → fetch incident details

```ts
trafficIncidents.events.on('click', async (feature) => {
    const result = await trafficIncidentDetails({ ids: [feature.properties.id] });
    const props = result.features[0]?.properties;
    if (!props) return;

    showIncidentPanel({
        type:     props.category,
        severity: props.magnitudeOfDelay,
        delay:    props.delayInSeconds,
        from:     props.from,
        to:       props.to,
        start:    props.startTime,  // Date | undefined
        end:      props.endTime,    // Date | undefined
    });
});
```

---

## trafficIncidentDetails service — query by area

```ts
// Current map viewport
const incidents = await trafficIncidentDetails({ bbox: map.getBBox() });

// A geocoded place (accepts Feature, FeatureCollection, or [w, s, e, n] tuple)
const place = await geocodeOne('Amsterdam');
const incidents = await trafficIncidentDetails({ bbox: place });

// Filtered query
const incidents = await trafficIncidentDetails({
    bbox: map.getBBox(),
    categoryFilter: ['accident', 'jam', 'road-closed'],
    timeValidityFilter: ['present'],  // 'present' | 'future'
});

incidents.features.forEach(incident => {
    const { category, magnitudeOfDelay, from, to,
        delayInSeconds, lengthInMeters, startTime, endTime } = incident.properties;
    const geometry = incident.geometry; // Point or LineString
});
```

---

## trafficAreaAnalytics — historical metrics for a region

```ts
// 1. Get city boundary
const geocodeResult = await geocodeOne('Amsterdam, Netherlands');
const boundary = await geometryData({ geometries: [geocodeResult] });

// 2. Query analytics
const analytics = await trafficAreaAnalytics({
    startDate: '2024-08-01',
    endDate:   '2024-08-07',          // max 31 days; use days: [] for non-consecutive
    dataTypes: ['SPEED', 'CONGESTION_LEVEL', 'FREE_FLOW_SPEED', 'TRAVEL_TIME'],
    functionalRoadClasses: ['MOTORWAY', 'MAJOR_ROAD', 'SECONDARY_ROAD'],  // or 'all'
    hours: [7, 8, 9, 17, 18],         // or 'all'
    geometry: boundary.features[0].geometry,
});

// 3. Access results
const region = analytics.features[0].properties;

const { speed, congestionLevel, freeFlowSpeed, travelTime } = region.baseData;

region.timedData.daily?.forEach(entry => {
    console.log(entry.date, entry.speed, entry.congestionLevel);
});
region.timedData.hourly?.forEach(entry => {
    console.log(entry.hour, entry.speed);
});

region.tiledData?.tiles.forEach(tile => {
    const [lon, lat] = tile.tileCentre;
    console.log(`[${lon}, ${lat}]: congestion=${tile.congestionLevel}%`);
});
```

Data types: `'SPEED'` (km/h), `'FREE_FLOW_SPEED'` (km/h), `'CONGESTION_LEVEL'` (%), `'TRAVEL_TIME'` (min/10km), `'NETWORK_LENGTH'` (m)

Functional road classes: `'MOTORWAY'`, `'MAJOR_ROAD'`, `'OTHER_MAJOR_ROAD'`, `'SECONDARY_ROAD'`, `'LOCAL_CONNECTING_ROAD'`, `'LOCAL_ROAD_HIGH_IMPORTANCE'`, `'LOCAL_ROAD'`, `'LOCAL_ROAD_MINOR_IMPORTANCE'`, `'OTHER_ROAD'`

---

## TrafficAreaAnalyticsModule — map visualization

Renders the `trafficAreaAnalytics` response on the map. Five modes: `'hexgrid'` (3D, default), `'hexgrid-flat'`, `'square-3d'`, `'square-flat'`, `'heatmap'`. `show()` renders **all** features in the analytics response.

```ts
import { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { trafficAreaAnalytics, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';

// 1. Get region boundary
const place = await geocodeOne('Amsterdam, Netherlands');
const boundary = await geometryData({ geometries: [place] });

// 2. Create module — mode and color preset both live inside `theme`
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    theme: { mode: 'hexgrid', color: 'congestion' }, // mode + color preset inside theme
    metric: 'congestionLevel',
});

// 3. Fetch and display
const analytics = await trafficAreaAnalytics({ ... });
await analyticsModule.show(analytics);

// Dynamic updates
analyticsModule.setMode('hexgrid-flat');              // switch visualization mode
analyticsModule.setMetric('speed');                   // switch metric
analyticsModule.setTheme({ color: 'thermal' });       // switch color preset (merges with existing theme)
analyticsModule.setColorStops([                       // custom stops — override color preset
    { value: 0, color: '#00ff00' },
    { value: 0.5, color: '#ffff00' },
    { value: 1, color: '#ff0000' },
]);
analyticsModule.setColorStops(undefined);             // clear custom stops, revert to theme.color
analyticsModule.setVisible(false);
analyticsModule.isVisible();               // boolean
await analyticsModule.clear();

// Region boundary appearance (always shown alongside analytics cells)
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    region: { color: '#0052a5', fillOpacity: 0.08, outlineOpacity: 1, outlineWidth: 3 },
});

// Layer ordering (same pattern as GeometriesModule)
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    beforeLayerConfig: 'lowestLabel', // 'top' | MapStyleLayerID
});
analyticsModule.moveBeforeLayer('top');

// Events — fire for both hexgrid and square cells (whichever mode is active)
analyticsModule.events.on('click', (feature, lngLat) => {
    console.log(feature.properties.congestionLevel, feature.properties.speed);
});
analyticsModule.events.on('hover', (feature) => { });
analyticsModule.events.off('click');

// Query shown data
const { heatmap, hexgrid, square } = analyticsModule.getShown();
```

Metrics: `'congestionLevel'`, `'speed'`, `'travelTime'`
Modes: `'hexgrid'`, `'hexgrid-flat'`, `'square-3d'`, `'square-flat'`, `'heatmap'`
Color themes (`theme.color`): `'congestion'` (default), `'thermal'`, `'monochrome'`
Color stops: `ColorStop[] = Array<{ value: number; color: string }>` — value is 0–1 normalized; takes precedence over `theme.color`

---

## When to use which option

| | Data | Use case |
|---|---|---|
| `TrafficFlowModule` | Real-time speed overlay | Visual speed conditions on map |
| `TrafficIncidentsModule` | Real-time incident markers | Show/filter live events on map |
| `trafficIncidentDetails` | Structured incident data | Programmatic queries, click-to-details |
| `trafficAreaAnalytics` | Historical aggregates | Dashboards, reports, trend analysis |
| `TrafficAreaAnalyticsModule` | Historical aggregates on map | Visualize region analytics with hex/square/heatmap |

---

## Gotchas

- `filter(undefined)` resets any active filter
- Magnitude and category filters can be combined within the same `any: [{ ... }]` block
- `trafficIncidentDetails` bbox accepts `[w, s, e, n]`, a GeoJSON Feature, or a FeatureCollection
- `trafficAreaAnalytics` requires either `startDate`/`endDate` or `days` — not both; max 31 days
- `trafficAreaAnalytics` `endDate` must be at least 2 days before today (e.g., if today is `2024-03-18`, latest valid `endDate` is `'2024-03-16'`)
- `trafficAreaAnalytics` requires a **Move Portal API key** (different from standard TomTom API key). Override per-call: `trafficAreaAnalytics({ apiKey: MOVE_PORTAL_KEY, ... })` — see `docs/services-config.md` for per-call override details
- In the browser, `trafficAreaAnalytics` may hit CORS preflight failures due to the SDK's `tomtom-user-agent` header. Workaround: route requests through a proxy (Vite: `server.proxy`) or your own backend
