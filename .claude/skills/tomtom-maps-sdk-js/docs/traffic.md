# Traffic Reference

## Imports

```ts
import {
    TrafficFlowModule,
    TrafficIncidentsModule,
    TrafficIncidentOverlayModule,
    TrafficAreaAnalyticsModule,
} from '@tomtom-org/maps-sdk/map';
import { trafficIncidentDetails, trafficAreaAnalytics, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
```

> **Two incident modules, two different jobs.** `TrafficIncidentsModule` is the **vector-tile overlay** — live data baked into the map style, no fetch needed; you toggle visibility and filter. `TrafficIncidentOverlayModule` is the **GeoJSON renderer for the `trafficIncidentDetails()` service** — *you* fetch a snapshot, *you* hand it to `show()`, and you can highlight a subset via `setFocus()`. Use the tile module when you just want "show me live traffic." Use the overlay module when you need the structured data (ids, delays, geometry) in your app *and* want to render exactly what you fetched.

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

## TrafficIncidentOverlayModule — render `trafficIncidentDetails()` results

GeoJSON-source companion to the tile module. You fetch incidents yourself via the `trafficIncidentDetails()` service, hand the result to `show()`, and the module renders the same per-magnitude line + symbol style as the tile overlay — but driven by *your* snapshot, with ids, delays, and click access to the full typed feature.

```ts
const overlay = await TrafficIncidentOverlayModule.get(map);

// Fetch a snapshot and render it.
const result = await trafficIncidentDetails({
    bbox: map.getBBox(),
    timeValidityFilter: ['present'],
});
await overlay.show(result);

// Highlight a subset — wider stripe + black outline on the matched ids,
// unfocused features unchanged.
overlay.setFocus([result.features[0].id as string]);

// Click handler receives the **typed** TrafficIncident (preserves Date / array / object
// properties that MapLibre would otherwise flatten to JSON strings on render).
overlay.events.on('click', (incident, lngLat) => {
    const { id, category, magnitudeOfDelay, delayInSeconds } = incident.properties;
    overlay.setFocus(typeof id === 'string' ? [id] : null);
});

// De-duplicate hit-test results when one click lands on multiple stacked incidents
// (each incident renders across outline + inner + symbol layers — `allFeatures`
// contains every layer hit).
overlay.events.on('click', (_incident, _lngLat, allFeatures) => {
    const distinct = overlay.distinctIncidents(allFeatures);
    console.log(`${distinct.length} incidents at this point`);
});

overlay.setFocus(null);     // clear focus
overlay.setVisible(false);  // hide all layers
await overlay.clear();      // drop rendered data (source kept, can show() again)

overlay.moveBeforeLayer('top');         // pin above every layer
overlay.moveBeforeLayer('lowestLabel'); // default — below labels
```

### Focus styling — override or take over

```ts
// Override the default treatment (outline color + width multiplier).
const overlay = await TrafficIncidentOverlayModule.get(map, {
    focus: { outlineColor: '#0052a5', widthScale: 2 },
});

// Disable the built-in visual treatment but keep feature-state writing —
// drive your own styling off `feature-state.focused`.
const overlay = await TrafficIncidentOverlayModule.get(map, { focus: false });
```

### When to hide the tile module first

The vector-tile `TrafficIncidentsModule` is hidden in the default style, so the overlay renders on its own. If you've explicitly enabled the tile module elsewhere in the app, hide it before showing the overlay to avoid double-rendering:

```ts
const tileIncidents = await TrafficIncidentsModule.get(map);
tileIncidents.setVisible(false);

const overlay = await TrafficIncidentOverlayModule.get(map);
await overlay.show(await trafficIncidentDetails({ bbox: map.getBBox() }));
```

### Differences vs. `TrafficIncidentsModule` (the tile module)

| Aspect | `TrafficIncidentsModule` | `TrafficIncidentOverlayModule` |
|---|---|---|
| Source type | Vector tiles (`style`) | GeoJSON you fetch (`geojson`) |
| Data acquisition | Built into the map style | `await trafficIncidentDetails(...)` then `overlay.show(result)` |
| Click payload | Tile feature (properties only) | Typed `TrafficIncident` with `Date` / array / object fields preserved |
| Filtering | `filter({ magnitudes, incidentCategories, delays })` | Filter the service request (`categoryFilter`, `timeValidityFilter`) before `show()` |
| Highlight subset | — | `setFocus(ids)` — wider stripe + outline, MapLibre `feature-state.focused` |
| Per-road-class width / offset | Yes (road-classification tags in tiles) | No — uniform stripe (REST API has no `road_category`) |
| Use when | "Just show me live traffic" | App needs the structured data (ids, delays, geometry) and renders exactly that |

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
    metrics: ['speed', 'congestionLevel', 'freeFlowSpeed', 'travelTime'],  // or 'all'
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

Metrics (`metrics`): `'speed'` (km/h), `'freeFlowSpeed'` (km/h), `'congestionLevel'` (%), `'travelTime'` (min/10km), `'networkLength'` (m), or `'all'` for all five

Functional road classes: `'MOTORWAY'`, `'MAJOR_ROAD'`, `'OTHER_MAJOR_ROAD'`, `'SECONDARY_ROAD'`, `'LOCAL_CONNECTING_ROAD'`, `'LOCAL_ROAD_HIGH_IMPORTANCE'`, `'LOCAL_ROAD'`, `'LOCAL_ROAD_MINOR_IMPORTANCE'`, `'OTHER_ROAD'`

---

## TrafficAreaAnalyticsModule — map visualization

Renders the `trafficAreaAnalytics` response on the map. Five modes: `'hexgrid-3d'` (default), `'hexgrid-2d'`, `'square-3d'`, `'square-2d'`, `'heatmap'`. `show()` renders **all** features in the analytics response.

```ts
import { TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { trafficAreaAnalytics, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';

// 1. Get region boundary
const place = await geocodeOne('Amsterdam, Netherlands');
const boundary = await geometryData({ geometries: [place] });

// 2. Create module
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    displayMode: 'hexgrid-3d',        // 'hexgrid-3d' | 'hexgrid-2d' | 'square-3d' | 'square-2d' | 'heatmap'
    activeMetric: 'congestionLevel',  // which metric drives color + height
    metricConfig: {
        congestionLevel: { color: 'trafficLight' },
        speed: { color: 'heat' },
    },
});

// 3. Fetch and display
const analytics = await trafficAreaAnalytics({ ... });
await analyticsModule.show(analytics);

// Dynamic updates
analyticsModule.setMode('hexgrid-2d');                // switch visualization mode
analyticsModule.setMetric('speed');                   // switch active metric
analyticsModule.setColor('heat');                     // color preset for all metrics
analyticsModule.setColor('heat', ['speed', 'freeFlowSpeed']); // color preset for specific metrics
analyticsModule.setColor(                             // custom stops for all metrics
    { valueType: 'raw', stops: [{ value: 0, color: '#00ff00' }, { value: 100, color: '#ff0000' }] },
);
analyticsModule.setColor(undefined);                  // clear color override (reverts to defaults)
analyticsModule.setHeight({ maxHeightMeters: 200 });  // height for all metrics (predefinedRange default)
analyticsModule.setHeight({ scaleMode: 'currentRange', maxHeightMeters: 500 }, ['speed']); // specific metrics
analyticsModule.setHeight({ scaleMode: 'raw', scaleFactor: 10 });  // raw: scaleFactor × metric value
analyticsModule.filter({ min: 20, max: 80 });         // filter tiles by value range (all metrics)
analyticsModule.filter({ min: 50 }, ['congestionLevel']); // filter specific metric
analyticsModule.clearFilter();                        // clear all filters
analyticsModule.setVisible(false);
analyticsModule.isVisible();               // boolean
await analyticsModule.clear();

// Region boundary appearance (always shown alongside analytics cells)
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    regionPolygon: { color: '#0052a5', fillOpacity: 0.08, outlineOpacity: 1, outlineWidth: 3 },
});

// Layer ordering — per-layer-type positioning
const analyticsModule = await TrafficAreaAnalyticsModule.get(map, {
    beforeLayerConfig: {
        heatmap: 'lowestLabel',
        hexgrid: { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
        square:  { flat2D: 'lowestLabel', extrusion3D: 'lowestPlaceLabel' },
    },
});
analyticsModule.moveBeforeLayer({ hexgrid: { flat2D: 'top', extrusion3D: 'top' } });

// Events — fire for hexgrid and square cells (whichever mode is active)
analyticsModule.events.on('click', (feature, lngLat) => {
    console.log(feature.properties.congestionLevel, feature.properties.speed);
});
analyticsModule.events.on('hover', (feature) => { });
analyticsModule.events.on('configChange', (config) => {
    console.log('Active metric:', config?.activeMetric);
});
analyticsModule.events.off('click');

// Query shown data
const { heatmap, hexgrid, square } = analyticsModule.getShown();
```

Metrics: `'congestionLevel'`, `'speed'`, `'travelTime'`, `'freeFlowSpeed'`, `'networkLength'` (road length per tile in metres — road density indicator; defaults to `relativeToActualRangePCT` color scaling)
Modes: `'hexgrid-3d'` (default), `'hexgrid-2d'`, `'square-3d'`, `'square-2d'`, `'heatmap'`
Color themes: `'trafficLight'` (default), `'heat'`, `'monochrome'`, `'viridis'`, `'plasma'`
Color stops valueType: `'raw'` (default) — actual metric values; `'relativeToPredefinedRangePCT'` — 0–100% of SDK predefined range; `'relativeToActualRangePCT'` — 0–100% of live data range
Height scaleMode: `'predefinedRange'` (default) / `'currentRange'` — use `maxHeightMeters`; `'raw'` — use `scaleFactor`

---

## When to use which option

| API | Data | Use case |
|---|---|---|
| `TrafficFlowModule` | Real-time speed overlay (vector tiles) | Visual speed conditions on map |
| `TrafficIncidentsModule` | Real-time incident markers (vector tiles) | Toggle / filter live events; no fetch needed |
| `trafficIncidentDetails` | Structured incident data (REST) | Programmatic queries; full typed feature in your app |
| `TrafficIncidentOverlayModule` | Renders a `trafficIncidentDetails()` result | Render exactly what you fetched, with `setFocus()` highlight and typed click payloads |
| `trafficAreaAnalytics` | Historical aggregates | Dashboards, reports, trend analysis |
| `TrafficAreaAnalyticsModule` | Historical aggregates on map | Visualize region analytics with hex/square/heatmap |

---

## Gotchas

- `filter(undefined)` resets any active filter (tile `TrafficIncidentsModule` only — the overlay has no `filter()`; filter the service request instead)
- Magnitude and category filters can be combined within the same `any: [{ ... }]` block
- `trafficIncidentDetails` bbox accepts `[w, s, e, n]`, a GeoJSON Feature, or a FeatureCollection
- `TrafficIncidentOverlayModule` and `TrafficIncidentsModule` both draw incidents. The tile module is hidden in the default style, so they don't collide by default — but if you've enabled the tile module explicitly, hide it (`tileIncidents.setVisible(false)`) before showing the overlay
- `TrafficIncidentOverlayModule.setFocus(null)` clears the focused subset; `setFocus([])` does the same
- `TrafficIncidentOverlayModule` click handlers receive the *typed* `TrafficIncident` (Date / array / object properties preserved) — not the flattened MapLibre feature
- Stacked incidents on the overlay: MapLibre's symbol collision keeps only the highest-sort-key feature visible, so hover/click can't reach the others. Query the `FeatureCollection` you passed to `show()` directly when you need every incident at a point
- `trafficAreaAnalytics` requires either `startDate`/`endDate` or `days` — not both; max 31 days
- `trafficAreaAnalytics` `endDate` must be at least 2 days before today (e.g., if today is `2024-03-18`, latest valid `endDate` is `'2024-03-16'`)
- `trafficAreaAnalytics` requires a **Move Portal API key** (different from standard TomTom API key). Override per-call: `trafficAreaAnalytics({ apiKey: MOVE_PORTAL_KEY, ... })` — see `docs/services-config.md` for per-call override details
- In the browser, `trafficAreaAnalytics` may hit CORS preflight failures due to the SDK's `tomtom-user-agent` header. Workaround: route requests through a proxy (Vite: `server.proxy`) or your own backend
