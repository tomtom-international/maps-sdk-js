# Traffic Reference

## Imports

```ts
import {
    TrafficFlowModule,
    TrafficIncidentsModule,
    TrafficIncidentDetailsModule,
    TrafficAreaAnalyticsModule,
} from '@tomtom-org/maps-sdk/map';
import { trafficIncidentDetails, trafficAreaAnalytics, geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
```

> **Two incident modules, two different jobs.** `TrafficIncidentsModule` is the **vector-tile overlay** — live data baked into the map style, no fetch needed; you toggle visibility and filter. `TrafficIncidentDetailsModule` is the **GeoJSON renderer for the `trafficIncidentDetails()` service** — *you* fetch a snapshot, *you* hand it to `show()`, and you can highlight a subset via `setFocus()`. Use the tile module when you just want "show me live traffic." Use the details module when you need the structured data (ids, delays, geometry) in your app *and* want to render exactly what you fetched.

> **Hidden until you show them.** The style parts the SDK adds — traffic flow, traffic incidents and the hillshade — are hidden until you show them: pass `{ visible: true }` to `get()` or call `setVisible(true)` — for `TerrainModule`, `{ hillshade: true }` or `setHillshadeVisible(true)`.

---

## Traffic flow overlay

```ts
const trafficFlow = await TrafficFlowModule.get(map, { visible: true });

trafficFlow.setVisible(false);
trafficFlow.isVisible(); // false — the setting; `false` until something shows the flow

// Filter to specific road categories
trafficFlow.updateConfig({
    filters: {
        any: [{
            roadCategories: {
                show: 'only',    // 'only' | 'all-except' (filterShowModes)
                values: ['motorway', 'trunk', 'primary'],
            },
        }],
    },
});
trafficFlow.updateConfig({ filters: undefined });  // reset

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
trafficIncidents.updateConfig({
    filters: { any: [{ magnitudes: { show: 'all-except', values: ['minor'] } }] },
});

// Filter by incident type
trafficIncidents.updateConfig({
    filters: { any: [{ incidentCategories: { show: 'only', values: ['accident', 'road-closed', 'jam'] } }] },
});

// Filter by delay
trafficIncidents.updateConfig({
    filters: { any: [{ delays: { mustHaveDelay: true, minDelayMinutes: 5 } }] },
});

trafficIncidents.updateConfig({ filters: undefined });  // reset
trafficIncidents.setIconsVisible(false);
trafficIncidents.isIconsVisible();  // false: icons.visible, else isVisible()
trafficIncidents.setVisible(false); // clears icons.visible

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

## TrafficIncidentDetailsModule — render `trafficIncidentDetails()` results

GeoJSON-source companion to the tile module. You fetch incidents yourself via the `trafficIncidentDetails()` service, hand the result to `show()`, and the module renders the same per-magnitude line + symbol style as the tile overlay — but driven by *your* snapshot, with ids, delays, and click access to the full typed feature.

```ts
const incidentDetailsModule = await TrafficIncidentDetailsModule.create(map);

// Fetch a snapshot and render it.
const result = await trafficIncidentDetails({
    bbox: map.getBBox(),
    timeValidityFilter: ['present'],
});
await incidentDetailsModule.show(result);

// Highlight a subset — wider stripe + black outline on the matched ids,
// unfocused features unchanged.
incidentDetailsModule.setFocus([result.features[0].id as string]);

// Any handler makes a hovered or clicked incident draw the same focus treatment (its
// `eventState`); `incidentDetailsModule.putEventState({ id, state: 'click' })` puts it from your own UI.
// Click handler receives the **typed** TrafficIncident (preserves Date / array / object
// properties that MapLibre would otherwise flatten to JSON strings on render).
incidentDetailsModule.events.on('click', (incident, lngLat) => {
    const { id, category, magnitudeOfDelay, delayInSeconds } = incident.properties;
    incidentDetailsModule.setFocus(typeof id === 'string' ? [id] : null);
});

// De-duplicate hit-test results when one click lands on multiple stacked incidents.
// Each incident renders across outline + inner + symbol layers, so the handler's third
// argument holds every layer hit — the same incident appears more than once. There is no
// SDK helper for this; de-duplicate on `properties.id`, which is a required string.
incidentDetailsModule.events.on('click', (_incident, _lngLat, allEventFeatures) => {
    const distinctIDs = new Set(allEventFeatures.map((incident) => incident.properties.id));
    console.log(`${distinctIDs.size} incidents at this point`);
});

incidentDetailsModule.setFocus(null);     // clear focus
incidentDetailsModule.setVisible(false);  // hide all layers
incidentDetailsModule.isVisible();        // the visible setting, not whether incidents are drawn
await incidentDetailsModule.clear();      // drop rendered data (source kept, can show() again)

incidentDetailsModule.updateConfig({ beforeLayerConfig: 'top' });         // pin above every layer
incidentDetailsModule.updateConfig({ beforeLayerConfig: 'lowestLabel' }); // default — below labels
```

### Focus styling — override or take over

```ts
// Override the default treatment (outline color + width multiplier).
// widthFactor: default 1.6, clamped to INCIDENT_FOCUS_WIDTH_FACTOR_RANGE (1–1.8).
const incidentDetailsModule = await TrafficIncidentDetailsModule.create(map, {
    focus: { outlineColor: '#0052a5', widthFactor: 1.8 },
});
// `focus` also changes live — its fields, or `false` — repainting the focused incidents in place.
incidentDetailsModule.updateConfig({ focus: { outlineColor: '#c2185b', widthFactor: 1.2 } });

// Disable the built-in visual treatment — for focused, hovered and clicked incidents —
// but keep feature-state writing: drive your own styling off `feature-state.focused`
// and `['get', 'eventState']`.
const incidentDetailsModule = await TrafficIncidentDetailsModule.create(map, { focus: false });
```

### Colours follow the incident knobs

The details module draws each magnitude in the colour the style gives its incident tiles, so the `traffic.incidents.*Color` knobs recolour it live. No other knob reaches it (`map-styling.md` § Borrowed looks).

### When to hide the tile module first

The vector-tile `TrafficIncidentsModule` is hidden in the default style, so the details module renders on its own. If you've explicitly enabled the tile module elsewhere in the app, hide it before showing fetched incidents to avoid double-rendering:

```ts
const tileIncidents = await TrafficIncidentsModule.get(map);
tileIncidents.setVisible(false);

const incidentDetailsModule = await TrafficIncidentDetailsModule.create(map);
await incidentDetailsModule.show(await trafficIncidentDetails({ bbox: map.getBBox() }));
```

### Differences vs. `TrafficIncidentsModule` (the tile module)

| Aspect | `TrafficIncidentsModule` | `TrafficIncidentDetailsModule` |
|---|---|---|
| Source type | Vector tiles (`style`) | GeoJSON you fetch (`geojson`) |
| Data acquisition | Built into the map style | `await trafficIncidentDetails(...)` then `incidentDetailsModule.show(result)` |
| Click payload | Tile feature (properties only) | Typed `TrafficIncident` with `Date` / array / object fields preserved |
| Filtering | `filter({ magnitudes, incidentCategories, delays })` | Filter the service request (`categoryFilter`, `timeValidityFilter`) before `show()` |
| Highlight subset | — | `setFocus(ids)` — wider stripe + outline, MapLibre `feature-state.focused`; a hovered or clicked incident draws the same |
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
        congestionLevel: { palette: 'trafficLight' },
        speed: { palette: 'heat' },
    },
});

// 3. Fetch and display
const analytics = await trafficAreaAnalytics({ ... });
await analyticsModule.show(analytics);

// Dynamic updates
analyticsModule.updateConfig({ displayMode: 'hexgrid-2d' }); // switch visualization mode
analyticsModule.updateConfig({ activeMetric: 'speed' });     // switch active metric
analyticsModule.setPalette('heat');                   // palette for all metrics
analyticsModule.setPalette('heat', ['speed', 'freeFlowSpeed']); // palette for specific metrics
analyticsModule.setColorStops(                        // custom stops for all metrics; win over the palette
    { valueType: 'raw', stops: [{ value: 0, color: '#00ff00' }, { value: 100, color: '#ff0000' }] },
);
analyticsModule.setColorStops(undefined);             // clear the stops: back to the palette
analyticsModule.setPalette(undefined);                // clear the palette: 'trafficLight'
analyticsModule.setHeight({ maxHeightMeters: 200 });  // height for all metrics (predefinedRange default)
analyticsModule.setHeight({ scaleMode: 'currentRange', maxHeightMeters: 500 }, ['speed']); // specific metrics
analyticsModule.setHeight({ scaleMode: 'raw', metersPerUnit: 10 });  // raw: metric value × metersPerUnit metres
analyticsModule.setFilters({ min: 20, max: 80 });     // filter tiles by value range (all metrics)
analyticsModule.setFilters({ min: 50 }, ['congestionLevel']); // filter specific metric
analyticsModule.setFilters(undefined);                // clear all filters
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

// Layer ordering — one target for every display mode, or a record keyed by display mode
// ('heatmap' | 'hexgrid-2d' | 'hexgrid-3d' | 'square-2d' | 'square-3d') plus `all` for the rest.
const analyticsModule = await TrafficAreaAnalyticsModule.create(map, {
    beforeLayerConfig: { all: 'lowestLabel', 'hexgrid-3d': 'lowestPlaceLabel', 'square-3d': 'lowestPlaceLabel' },
});
analyticsModule.updateConfig({ beforeLayerConfig: { 'hexgrid-3d': 'top' } }); // a mode it leaves out goes back to its default

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

Metrics: `'congestionLevel'`, `'speed'`, `'travelTime'`, `'freeFlowSpeed'`, `'networkLength'` (road length per tile in metres — road density indicator; its palette spans the loaded range)
Modes: `'hexgrid-3d'` (default), `'hexgrid-2d'`, `'square-3d'`, `'square-2d'`, `'heatmap'`
Palettes (`areaAnalyticsPalettes`, type `AreaAnalyticsPalette`), good → bad: `'trafficLight'` (default), `'heat'`, `'monochrome'`, `'viridis'`, `'plasma'`. A palette spans the metric's predefined range (`networkLength`: the loaded range), reversed for `speed` / `freeFlowSpeed`; `getConfig()` keeps the name. `colorStops` wins over `palette` and is used as given, never reversed. Each setter writes only its own field.
`colorStops.valueType`: `'raw'` (default) — actual metric values; `'relativeToPredefinedRangePCT'` — 0–100% of SDK predefined range; `'relativeToActualRangePCT'` — 0–100% of live data range
Height scaleMode: `'predefinedRange'` (default) / `'currentRange'` — use `maxHeightMeters`; `'raw'` — use `metersPerUnit` (metres per unit of the metric, default 1)

---

## Every knob as data — the traffic knob catalogues

Each traffic module's plain-valued settings, static and readable with no map: kind (`toggle` /
`factor` / `number` / `color` / `enum` / `enums`), `range` or `options`, and `default` where one value
holds everywhere. The id is the setting's path in the module's config; each `…KnobIds` array lists
the ids in catalogue order, `…KnobId` is their union and `…KnobValueOf<ID>` the plain value one takes.

```ts
import { trafficAreaAnalyticsKnobCatalogue, type TrafficAreaAnalyticsKnobValueOf } from '@tomtom-org/maps-sdk/map';

const knob = trafficAreaAnalyticsKnobCatalogue.find(({ id }) => id === 'displayMode');
// { id: 'displayMode', kind: 'enum', description: '…', options: ['hexgrid-3d', …, 'heatmap'], default: 'hexgrid-3d' }
const mode: TrafficAreaAnalyticsKnobValueOf<'displayMode'> = 'heatmap';
```

- The flow and incident catalogues hold only what those modules own — visibility and filters. How
  flow and incidents look is `StylingModule`'s `traffic.flow.*` / `traffic.incidents.*` knobs
  (`map-styling.md`).
- Their `filters.any.0.…` knobs set the first of the `filters.any` alternatives (combined with OR);
  further alternatives are config only. Each `….show` (`only` / `all-except`) goes with its
  `….values`; neither has a default — unset, nothing is filtered.
- Entry shape and kinds: `map-setup.md` § Every setting as data.

### `trafficFlowKnobCatalogue`

| Id | Kind | Default |
|---|---|---|
| `visible` | toggle | `false` |
| `filters.any.0.roadCategories.show` | enum, `only` / `all-except` | — |
| `filters.any.0.roadCategories.values` | enums, `roadCategories` | — |
| `filters.any.0.roadSubCategories.show` | enum, `only` / `all-except` | — |
| `filters.any.0.roadSubCategories.values` | enums, `streetRoadSubCategories` then `serviceRoadSubCategories` | — |
| `filters.any.0.showRoadClosures` | enum, `only` / `all-except` | — |

### `trafficIncidentsKnobCatalogue`

| Id | Kind | Default |
|---|---|---|
| `visible` | toggle | `false` |
| `icons.visible` | toggle | unset follows `visible` |
| `filters.any.0.roadCategories.show`, `filters.any.0.roadCategories.values` | as on flow | — |
| `filters.any.0.roadSubCategories.show`, `filters.any.0.roadSubCategories.values` | as on flow | — |
| `filters.any.0.incidentCategories.show` | enum, `only` / `all-except` | — |
| `filters.any.0.incidentCategories.values` | enums, `fullTrafficIncidentCategories` | — |
| `filters.any.0.magnitudes.show` | enum, `only` / `all-except` | — |
| `filters.any.0.magnitudes.values` | enums, `unknown` / `minor` / `moderate` / `major` / `indefinite` | — |
| `filters.any.0.delays.mustHaveDelay` | toggle | `false` |
| `filters.any.0.delays.minDelayMinutes` | number, 0–120 | — |

### `trafficIncidentDetailsKnobCatalogue`

| Id | Kind | Default |
|---|---|---|
| `visible` | toggle | `true` |
| `focus.outlineColor` | color | black on light styles, white on dark |
| `focus.widthFactor` | factor, 1–1.8 | `1.6` |

Not in it: `beforeLayerConfig`, and `focus: false`, which turns the focus treatment off. The
incident lines take the style's incident colours, which `StylingModule`'s `traffic.incidents.*`
knobs set.

### `trafficAreaAnalyticsKnobCatalogue`

Module-wide knobs first, then the same seven for each metric (`<metric>` is any of
`areaAnalyticsMetricKeys`).

| Id | Kind | Default |
|---|---|---|
| `visible` | toggle | `true` |
| `displayMode` | enum | `'hexgrid-3d'` |
| `activeMetric` | enum, `areaAnalyticsMetricKeys` | `'congestionLevel'` |
| `regionPolygon.color` | color | black on light styles, white on dark |
| `regionPolygon.fillOpacity` | number, 0–1 | `0` |
| `regionPolygon.outlineOpacity` | number, 0–1 | `0.5` |
| `regionPolygon.outlineWidth` | number, 0–10 px | `2` |
| `regionPolygon.inverted` | toggle | `false` |
| `metricConfig.<metric>.palette` | enum, `areaAnalyticsPalettes` | `'trafficLight'` |
| `metricConfig.<metric>.height.scaleMode` | enum | `'predefinedRange'`; `'currentRange'` for `networkLength` |
| `metricConfig.<metric>.height.maxHeightMeters` | number, 0–5000 m | `1000` |
| `metricConfig.<metric>.height.minHeightMeters` | number, 0–5000 m | `0` |
| `metricConfig.<metric>.height.metersPerUnit` | number, 0–100 m per unit, `raw` scale mode only | `1` |
| `metricConfig.<metric>.filters.min` | number, the metric's predefined range | — |
| `metricConfig.<metric>.filters.max` | number, the metric's predefined range | — |

A metric's filters hide cells only while it is the `activeMetric`, and never in the heatmap. Their
range is the one the module scales colours and heights over, not a bound on the data: real values
can exceed it.

`maxHeightMeters` applies in the `predefinedRange` and `currentRange` scale modes, `metersPerUnit`
(metres per unit of the metric) in `raw`. Heights, `metersPerUnit`, outline width and the filters have
`hard-min` ranges (map-setup.md): a larger value than `max` still applies.

Not in it: `colorStops` (set them through `setColorStops` or the config) and `beforeLayerConfig`.

---

## When to use which option

| API | Data | Use case |
|---|---|---|
| `TrafficFlowModule` | Real-time speed overlay (vector tiles) | Visual speed conditions on map |
| `TrafficIncidentsModule` | Real-time incident markers (vector tiles) | Toggle / filter live events; no fetch needed |
| `trafficIncidentDetails` | Structured incident data (REST) | Programmatic queries; full typed feature in your app |
| `TrafficIncidentDetailsModule` | Renders a `trafficIncidentDetails()` result | Render exactly what you fetched, with `setFocus()` highlight and typed click payloads |
| `trafficAreaAnalytics` | Historical aggregates | Dashboards, reports, trend analysis |
| `TrafficAreaAnalyticsModule` | Historical aggregates on map | Visualize region analytics with hex/square/heatmap |

---

## Gotchas

- `filter(undefined)` resets any active filter (tile `TrafficIncidentsModule` only — `TrafficIncidentDetailsModule` has no `filter()`; filter the service request instead)
- Magnitude and category filters can be combined within the same `any: [{ ... }]` block
- `TrafficIncidentsModule` filters narrow the incident lines and their icons alike; `icons` only decides whether the icons show (`icons: { visible }`, `setIconsVisible`, read back with `isIconsVisible()`, which is `isVisible()` while `icons.visible` is unset)
- `TrafficIncidentsModule.setVisible()` clears `icons.visible`, so the icons follow `visible` again. Icons alone are `{ visible: false, icons: { visible: true } }`, or `setVisible(false)` and then `setIconsVisible(true)` — in the other order the icons hide again
- `trafficIncidentDetails` bbox accepts `[w, s, e, n]`, a GeoJSON Feature, or a FeatureCollection
- `trafficIncidentDetails` takes exactly one of `bbox`, `polygon` or `ids`. `polygon` accepts a `Polygon`/`MultiPolygon`, a `Feature` or a `FeatureCollection` of them (what `geometryData` returns); a `LineString` incident crossing the boundary is kept, and the 10,000 km² limit applies to the polygon's bbox
- `TrafficIncidentDetailsModule` and `TrafficIncidentsModule` both draw incidents. The tile module is hidden in the default style, so they don't collide by default — but if you've enabled the tile module explicitly, hide it (`tileIncidents.setVisible(false)`) before showing fetched incidents
- `isVisible()` on every traffic module reports the `visible` setting: `true` on a `TrafficIncidentDetailsModule` or Area Analytics module showing nothing, and `false` on `TrafficIncidentsModule` set hidden with `icons: { visible: true }`, whose icons still draw (`isIconsVisible()` reads their setting, `true` there). To know whether data is drawn, read `getShown()`; for a layer itself, `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')`
- `TrafficIncidentDetailsModule.setFocus(null)` clears the focused subset; `setFocus([])` does the same
- `TrafficIncidentDetailsModule` click handlers receive the *typed* `TrafficIncident` (Date / array / object properties preserved) — not the flattened MapLibre feature
- Stacked incidents on `TrafficIncidentDetailsModule`: MapLibre's symbol collision keeps only the highest-sort-key feature visible, so hover/click can't reach the others. Query the `FeatureCollection` you passed to `show()` directly when you need every incident at a point
- `TrafficAreaAnalyticsModule.applyConfig` replaces the configuration, and `updateConfig({ metricConfig })` replaces the whole per-metric record — to change one metric and keep the others, use `setPalette` / `setColorStops` / `setHeight` / `setFilters` with that metric (`setPalette('heat', ['speed'])`)
- `trafficAreaAnalytics` requires either `startDate`/`endDate` or `days` — not both; a range spans 1 to 31 UTC calendar days, so `startDate` equal to `endDate` fails validation
- `trafficAreaAnalytics` `timedData.weekly` entries count `week` in the ISO 8601 year, which `year` holds: the week from Monday 30 December 2024 is `{ year: 2025, week: 1 }`
- `trafficAreaAnalytics` `anomalies` is keyed by metric (`anomalies.speed`); each anomaly is a run of UTC hours whose `endDate` is the hour after the last one, and its `labels` are the names of the public holidays it overlaps. It is currently always empty: the service detects anomalies only over 35 days or more, beyond a request's 31-day limit
- `trafficAreaAnalytics` `endDate` must be at least 2 days before today (e.g., if today is `2024-03-18`, latest valid `endDate` is `'2024-03-16'`), and defaults to 3 days before today, the latest date that always has data, when omitted
- `trafficAreaAnalytics` requires a **Move Portal API key** (different from standard TomTom API key); a `401`/`403` on this service means the Maps key went out. Keep the Maps key in `TomTomConfig` and override per-call: `trafficAreaAnalytics({ apiKey: MOVE_PORTAL_KEY, ... })` — see `docs/services-config.md` for per-call override details
