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

> **Hidden until you show them.** The style parts the SDK adds — traffic flow, traffic incidents and the hillshade — are hidden until you show them: pass `{ visible: true }` to `get()` or call `setVisible(true)` — for `TerrainModule`, `{ hillshade: true }` or `setHillshadeVisible(true)`.

---

## Traffic flow overlay

```ts
const trafficFlow = await TrafficFlowModule.get(map, { visible: true });

trafficFlow.setVisible(false);

// Filter to specific road categories
trafficFlow.filter({
    any: [{
        roadCategories: {
            show: 'only',    // 'only' | 'all-except' (filterShowModes)
            values: ['motorway', 'trunk', 'primary'],
        },
    }],
});
trafficFlow.filter(undefined);  // reset

trafficFlow.events.on('click', (feature) => { showSpeedInfo(feature); });
trafficFlow.events.on('hover', (feature) => { });
```

Road categories: `motorway`, `motorway_link`, `trunk`, `trunk_link`, `primary`, `primary_link`, `secondary`, `secondary_link`, `tertiary`, `tertiary_link`, `street`, `service`, `track`

### Flow as data — what you can and cannot get

> **Orbis flow is vector tiles only.** No service returns live flow for a road, a point or an area: `getShown()` over the current viewport is the whole of flow as data.

```ts
const { trafficFlow: segments } = trafficFlow.getShown();
for (const segment of segments) {
    const { roadCategory, relativeSpeed, roadClosure } = segment.properties;
    // relativeSpeed: 0..1 relative to free flow (always present)
}
```

- **Available:** `relativeSpeed`, `roadCategory`, `roadSubcategory`, `roadClosure`, `leftHandTraffic`, `displayClass`.
- **`undefined` with the standard styles:** `absoluteSpeed`, `partOfTwoWayRoad`, `openlr` — their flow source does not request those tile tags; only a custom style's can. Do not read `absoluteSpeed` expecting km/h.
- **Not available anywhere on Orbis:** free-flow speed, travel time, delay in seconds, confidence. Do not promise them.
- Viewport-bound and zoom-dependent; a segment crossing a tile boundary comes back once per tile, so de-duplicate on geometry if you export.
- "Export traffic for an area" or "speed per road class" is a **historical** question: use `trafficAreaAnalytics()` (see below), not the flow tiles.

---

## Traffic incidents overlay

```ts
const trafficIncidents = await TrafficIncidentsModule.get(map, {
    visible: true,
    icons: { visible: true },
});

// Filter by severity
trafficIncidents.filter({
    any: [{ magnitudes: { show: 'all-except', values: ['minor'] } }],
});

// Filter by incident type
trafficIncidents.filter({
    any: [{ incidentCategories: { show: 'only', values: ['accident', 'road-closed', 'jam'] } }],
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
const overlay = await TrafficIncidentOverlayModule.create(map);

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

// De-duplicate hit-test results when one click lands on multiple stacked incidents.
// Each incident renders across outline + inner + symbol layers, so the handler's third
// argument holds every layer hit — the same incident appears more than once. There is no
// SDK helper for this; de-duplicate on `properties.id`, which is a required string.
overlay.events.on('click', (_incident, _lngLat, allEventFeatures) => {
    const distinctIDs = new Set(allEventFeatures.map((incident) => incident.properties.id));
    console.log(`${distinctIDs.size} incidents at this point`);
});

overlay.setFocus(null);     // clear focus
overlay.setVisible(false);  // hide all layers
overlay.isVisible();        // the visible setting, not whether incidents are drawn
await overlay.clear();      // drop rendered data (source kept, can show() again)

overlay.moveBeforeLayer('top');         // pin above every layer
overlay.moveBeforeLayer('lowestLabel'); // default — below labels
```

### Focus styling — override or take over

```ts
// Override the default treatment (outline color + width multiplier).
// widthFactor: default 1.6, clamped to INCIDENT_FOCUS_WIDTH_FACTOR_RANGE (1–1.8).
const overlay = await TrafficIncidentOverlayModule.create(map, {
    focus: { outlineColor: '#0052a5', widthFactor: 1.8 },
});

// Disable the built-in visual treatment but keep feature-state writing —
// drive your own styling off `feature-state.focused`.
const overlay = await TrafficIncidentOverlayModule.create(map, { focus: false });
```

### When to hide the tile module first

The vector-tile `TrafficIncidentsModule` is hidden in the default style, so the overlay renders on its own. If you've explicitly enabled the tile module elsewhere in the app, hide it before showing the overlay to avoid double-rendering:

```ts
const tileIncidents = await TrafficIncidentsModule.get(map);
tileIncidents.setVisible(false);

const overlay = await TrafficIncidentOverlayModule.create(map);
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

// Within a city boundary rather than its bounding box: the request covers the polygon's bbox and
// the response keeps only the incidents that intersect the polygon
const place = await geocodeOne('Amsterdam');
const incidents = await trafficIncidentDetails({ polygon: await geometryData({ geometries: [place] }) });

incidents.features.forEach(incident => {
    const { category, magnitudeOfDelay, from, to,
        delayInSeconds, lengthInMeters, startTime, endTime } = incident.properties;
    const geometry = incident.geometry; // Point or LineString
});
```

---

## trafficAreaAnalytics — historical metrics for a region

> Gated — unavailable on Freemium and Pay As You Grow (PAYG); the developer requests access from TomTom Sales, and calls it with a Move Portal API key (see [Gotchas](#gotchas)).

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
    hours: [5, 6, 7, 15, 16],         // UTC: Amsterdam's rush hours in summer time (UTC+2), or 'all'
    geometry: boundary.features[0].geometry,
});

// 3. Access results
const region = analytics.features[0].properties;

const { speed, congestionLevel, freeFlowSpeed, travelTime } = region.baseData;

// Each granularity has its own entry type (AreaAnalyticsDailyEntry, AreaAnalyticsHourlyEntry, ...) with its time
// identifiers always set. `date` is midnight UTC; `hourly` spans every day of the range, so read `date` with `hour`.
region.timedData.daily?.forEach(entry => {
    console.log(entry.date.toISOString().slice(0, 10), entry.speed, entry.congestionLevel);
});
region.timedData.hourly?.forEach(entry => {
    console.log(entry.date.toISOString().slice(0, 10), entry.hour, entry.speed);
});
// Average week, Monday first: day 1 (Monday)–7 (Sunday) and hour 0–23 per entry, in UTC. Only buckets with
// data appear (fewer than 168 for a short range or an `hours` filter), so filter on day/hour, never index.
region.timedData.average?.forEach(entry => {
    console.log(entry.day, entry.hour, entry.congestionLevel);
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
const analyticsModule = await TrafficAreaAnalyticsModule.create(map, {
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
analyticsModule.isVisible();                          // the visible setting, not whether tiles are drawn
await analyticsModule.clear();

// Whole-config changes
analyticsModule.applyConfig({ displayMode: 'heatmap' }); // replaces: everything omitted back to its default
analyticsModule.updateConfig({ activeMetric: 'speed' }); // keeps the rest; a metricConfig passed replaces the whole record

// Region boundary appearance (always shown alongside analytics cells)
const analyticsModule = await TrafficAreaAnalyticsModule.create(map, {
    regionPolygon: { color: '#0052a5', fillOpacity: 0.08, outlineOpacity: 1, outlineWidth: 3 },
});

// Layer ordering — per-layer-type positioning
const analyticsModule = await TrafficAreaAnalyticsModule.create(map, {
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
analyticsModule.events.on('config-change', (config) => {
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
- `TrafficIncidentsModule` filters narrow the incident lines and their icons alike; `icons` only decides whether the icons show (`icons: { visible }`, `setIconsVisible`)
- `trafficIncidentDetails` bbox accepts `[w, s, e, n]`, a GeoJSON Feature, or a FeatureCollection
- `trafficIncidentDetails` takes exactly one of `bbox`, `polygon` or `ids`. `polygon` accepts a `Polygon`/`MultiPolygon`, a `Feature` or a `FeatureCollection` of them (what `geometryData` returns); a `LineString` incident crossing the boundary is kept, and the 10,000 km² limit applies to the polygon's bbox
- `TrafficIncidentOverlayModule` and `TrafficIncidentsModule` both draw incidents. The tile module is hidden in the default style, so they don't collide by default — but if you've enabled the tile module explicitly, hide it (`tileIncidents.setVisible(false)`) before showing the overlay
- `isVisible()` on `TrafficIncidentOverlayModule` and `TrafficAreaAnalyticsModule` reports the `visible` setting: `true` on a module showing nothing. To know whether data is drawn, read `getShown()`
- `TrafficIncidentOverlayModule.setFocus(null)` clears the focused subset; `setFocus([])` does the same
- `TrafficIncidentOverlayModule` click handlers receive the *typed* `TrafficIncident` (Date / array / object properties preserved) — not the flattened MapLibre feature
- Stacked incidents on the overlay: MapLibre's symbol collision keeps only the highest-sort-key feature visible, so hover/click can't reach the others. Query the `FeatureCollection` you passed to `show()` directly when you need every incident at a point
- `TrafficAreaAnalyticsModule.applyConfig` replaces the configuration, and `updateConfig({ metricConfig })` replaces the whole per-metric record — to change one metric and keep the others, use `setColor` / `setHeight` / `filter` with that metric (`setColor('heat', ['speed'])`)
- `trafficAreaAnalytics` requires either `startDate`/`endDate` or `days` — not both; a range spans 1 to 31 UTC calendar days, so `startDate` equal to `endDate` fails validation
- `trafficAreaAnalytics` `timedData.weekly` entries count `week` in the ISO 8601 year, which `year` holds: the week from Monday 30 December 2024 is `{ year: 2025, week: 1 }`
- `trafficAreaAnalytics` `anomalies` is keyed by metric (`anomalies.speed`); each anomaly is a run of UTC hours whose `endDate` is the hour after the last one, and its `labels` are the names of the public holidays it overlaps. It is currently always empty: the service detects anomalies only over 35 days or more, beyond a request's 31-day limit
- `trafficAreaAnalytics` `endDate` must be at least 2 days before today (e.g., if today is `2024-03-18`, latest valid `endDate` is `'2024-03-16'`), and defaults to 3 days before today, the latest date that always has data, when omitted
- `trafficAreaAnalytics` requires a **Move Portal API key** (different from standard TomTom API key); a `401`/`403` on this service means the Maps key went out. Keep the Maps key in `TomTomConfig` and override per-call: `trafficAreaAnalytics({ apiKey: MOVE_PORTAL_KEY, ... })` — see `docs/services-config.md` for per-call override details
