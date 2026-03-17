---
name: tomtom-maps-sdk-js
description: Build with the TomTom Maps SDK — TomTomMap setup, styles, modules, MapLibre integration, BaseMapModule, HillshadeModule, viewport utilities, search, geocoding, reverse geocoding, autocomplete, place-by-id, PlacesModule, POIsModule, fuzzy search, geometry search, along-route search, EV charging, ViewportPlaces plugin, calculateRoute, RoutingModule, route alternatives, guidance, EV routing, reachable ranges (isochrones), GeometriesModule, TrafficFlowModule, TrafficIncidentsModule, trafficIncidentDetails, trafficAreaAnalytics, Place and Route types, bboxFromGeoJSON, getPosition, formatDistance, formatDuration, route progress utilities, service config and validation, customizeService
allowed-tools: Read, Glob
---

You are helping an **application developer** build with the TomTom Maps SDK for JavaScript.

## Step 1: Identify the topic and read the reference doc

From `$ARGUMENTS` or the conversation context, match the topic to a doc filename:

| Topic | Filename | Keywords |
|-------|----------|----------|
| Map setup | `map-setup.md` | map, display, style, language, module, maplibre, baseMap, hillshade, viewport, layer, event, click, hover |
| Places & search | `places.md` | search, places, poi, fuzzy, geocode, address, reverse, autocomplete, ev, charging, geometry, polygon, within, along route, route search, detour, viewportplaces |
| Routing | `routing.md` | route, routing, directions, waypoint, guidance, reachable, isochrone, range, ev routing, alternatives, vehicle |
| Traffic | `traffic.md` | traffic, incidents, flow, analytics, congestion, speed, incident details |
| Core types | `core-types.md` | place type, route type, properties, summary, sections, address, poi, entry points, traffic types, delaymagnitude, typescript types |
| Core utilities | `core-utilities.md` | bbox, bboxFromGeoJSON, polygonFromBBox, getPosition, formatDistance, formatDuration, progress, waypoint insertion, route progress, snap |
| Services config | `services-config.md` | config, api key, language, timeout, validation, validateRequest, error, customizeService, hooks, onAPIRequest, onAPIResponse |
| MapLibre direct access | `maplibre.md` | mapLibreMap, addSource, addLayer, removeLayer, geojson, vector tiles, raster, pmtiles, tile source, paint, layout, queryRenderedFeatures, querySourceFeatures, z-order, symbol layer |

Use `Glob` with pattern `.claude/skills/tomtom-maps-sdk-js/docs/<filename>` to locate the file, then read it. For multi-topic tasks, glob and read multiple files.

---

## Base setup

```bash
npm i @tomtom-org/maps-sdk
```

```ts
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';

TomTomConfig.instance.put({ apiKey: 'YOUR_API_KEY' });
```

---

## Global conventions

- **Coordinates**: `[longitude, latitude]` — longitude first (GeoJSON order)
- **All service outputs are GeoJSON**: `Place = Feature<Point>`, `Places = FeatureCollection<Point>`
- **Map modules are async**: always `await Module.get(map)` before any method
- **`geocodeOne()` throws** if no result — use `geocode()` when uncertain
- **`searchOne()` throws** if no result — use `search()` when uncertain
- **Services work in Node.js** — no browser or map required
- **Map container CSS**: The map div AND `html, body` all need explicit height (`height: 100%` or `100vh`) and `margin: 0` — without this the map renders with zero height. Always include a complete HTML + CSS boilerplate in your answer, not just the TypeScript.
- **Provide visible UI feedback** for event handlers (toasts, panels, info bars) — not just `console.log`. Build real, functional UI that the user can see and interact with.

---

## Step 2: Answer

State the relevant imports, apply the patterns from the doc, note any gotchas. Then write the code. Include complete HTML, CSS, and TypeScript — not just the TypeScript.
