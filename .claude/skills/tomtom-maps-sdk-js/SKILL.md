---
name: tomtom-maps-sdk-js
description: Build apps with the TomTom Maps SDK for JavaScript (@tomtom-org/maps-sdk). Use when working with TomTomMap setup, MapLibre integration, BaseMapModule and HillshadeModule, and viewport utilities; map styles, setStyle and StyleChangeHandler, style switcher; user interaction events (click, hover, contextmenu) and module lifecycle events; search, geocoding, reverse geocoding, autocomplete, places and POIs (PlacesModule, POIsModule), fuzzy/geometry/along-route search, and EV charging; routing and calculateRoute (RoutingModule), route alternatives, guidance, EV routing, and reachable ranges (isochrones); GeometriesModule; traffic flow, incidents, and area analytics; custom GeoJSON layers and bring-your-own-data (CustomGeoJSONModule, BYOD); and the agent-toolkit plugin for conversational map agents (createMapAgent, LLM tools, Vercel AI SDK). Also covers core Place/Route types, service config and customizeService, and utilities such as bboxFromGeoJSON, getPosition, formatDistance, and formatDuration.
allowed-tools: Read, Glob
---

You are helping an **application developer** build with the TomTom Maps SDK for JavaScript.

## Step 1: Identify the topic and read the reference doc

From `$ARGUMENTS` or the conversation context, match the topic to a doc filename:

| Topic                  | Filename             | Keywords                                                                                                                                                                             |
|------------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Map setup              | `map-setup.md`       | map, display, language, module, maplibre, baseMap, hillshade, viewport, layer, non-interactive, bounds, style switcher                                                                |
| User interaction events | `user-events.md`    | click, hover, long-hover, contextmenu, events.on, events.off, event handler, precisionMode, paddingBoxPx, cursorOnHover, longHoverDelay, background click, rest of the map, event priority, layer order |
| Map styles             | `map-styles.md`      | style, setStyle, StyleChangeHandler, addStyleChangeHandler, style change, style switcher, dark mode, custom layers, style lifecycle, keepState                                        |
| Module lifecycle events | `module-events.md`  | config-change, shown-features, module events, ModuleEvents, CombinedEvents, applyConfig, setVisible, unsubscribe, routing events.module, events.user                                 |
| Places & search        | `places.md`          | search, places, poi, fuzzy, geocode, address, reverse, autocomplete, ev, charging, geometry, polygon, within, along route, route search, detour, viewportplaces                      |
| Routing                | `routing.md`         | route, routing, directions, waypoint, guidance, reachable, isochrone, range, ev routing, alternatives, vehicle                                                                       |
| Traffic                | `traffic.md`         | traffic, incidents, flow, analytics, congestion, speed, incident details                                                                                                             |
| Core types             | `core-types.md`      | place type, route type, properties, summary, sections, address, poi, entry points, traffic types, delaymagnitude, typescript types                                                   |
| Core utilities         | `core-utilities.md`  | bbox, bboxFromGeoJSON, polygonFromBBox, getPosition, formatDistance, formatDuration, progress, waypoint insertion, route progress, snap                                              |
| Services config        | `services-config.md` | config, api key, language, timeout, validation, validateRequest, error, customizeService, hooks, onAPIRequest, onAPIResponse                                                         |
| MapLibre direct access | `maplibre.md`        | mapLibreMap, addSource, addLayer, removeLayer, geojson, vector tiles, raster, pmtiles, tile source, paint, layout, queryRenderedFeatures, querySourceFeatures, z-order, symbol layer |
| Custom GeoJSON module  | `custom.md`          | CustomGeoJSONModule, BYOD, bring your own data, custom geojson, customer-authored layers, heatmap layer, symbol layer with custom icon, multi-source module, applyConfig layer diff, per-source events, style-change restoration with own layers |
| Agent toolkit plugin   | `agent-toolkit.md`   | agent, agent-toolkit, createMapAgent, LLM, chat, conversational, Vercel AI SDK, ToolLoopAgent, classifier, intent, per-turn scope, scopeSchema, scopePrompt, EntryDataKind, analyseData, processData, dataEntries, DataEntryKind, DataEntryConfig, enabled, entryMode, ToolEntry, ToolEntryBuilder, ToolState, custom tool, system prompt, BASE_SYSTEM_PROMPT, composeSystemPrompt, SYSTEM_PROMPT_SECTIONS, SystemPromptSection, SystemPromptSectionOverrides, section overrides, systemPromptPrefix, systemPromptSuffix, DEFAULT_TOOLS, MapAgentOptions, BYOD layers, addByodSource, setByodLayers, BYODDataProfile, recallByod, updateByodDisplay, getTrafficIncidents where schema |

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
