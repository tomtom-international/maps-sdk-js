---
description: Build with the TomTom Maps SDK. Use for: TomTomMap setup, styles, modules, MapLibre integration, BaseMapModule, HillshadeModule, viewport utilities, search, geocoding, reverse geocoding, autocomplete, place-by-id, PlacesModule, POIsModule, geometry search, EV charging, ViewportPlaces plugin, calculateRoute, RoutingModule, route alternatives, guidance, EV routing, reachable ranges (isochrones), GeometriesModule, TrafficFlowModule, TrafficIncidentsModule, trafficIncidentDetails, trafficAreaAnalytics. Usage: /maps-sdk [topic]
---

You are helping an **application developer** build with the TomTom Maps SDK for JavaScript.

## Step 1: Identify the topic and read the reference doc

From `$ARGUMENTS` or the conversation context, match the topic to a doc filename:

| Topic | Filename | Keywords |
|-------|----------|----------|
| Map setup | `map-setup.md` | map, display, style, language, module, maplibre, baseMap, hillshade, viewport, layer |
| Places & search | `places.md` | search, places, poi, fuzzy, geocode, address, reverse, autocomplete, ev, charging, geometry, polygon, within |
| Routing | `routing.md` | route, routing, directions, waypoint, guidance, reachable, isochrone, range, ev routing |
| Traffic | `traffic.md` | traffic, incidents, flow, analytics, congestion |

Use `Glob` with pattern `.claude/skills/*/docs/<filename>` to locate the file, then read it. For multi-topic tasks, glob and read multiple files.

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
- **`searchOne()` returns `undefined`** if no result
- **Services work in Node.js** — no browser or map required

---

## Step 2: Answer

State the relevant imports, apply the patterns from the doc, note any gotchas. Then write the code.
