---
name: tomtom-maps-sdk-js
description: Build apps with the TomTom Maps SDK for JavaScript (@tomtom-org/maps-sdk). Use when working with TomTomMap setup, MapLibre integration, BaseMapModule and HillshadeModule, and viewport utilities; map styles, setStyle and StyleChangeHandler, style switcher; semantic map styling with StylingModule (label/icon/road size knobs, feature toggles, POI and traffic colours, globe projection, sky and 3D terrain, presets, describe() catalogue) and the map-effects plugin (bloom, tint, grade, vignette, fog, capture); user interaction events (click, hover, contextmenu) and module lifecycle events; search, geocoding, reverse geocoding, autocomplete, places and POIs (PlacesModule, POIsModule), fuzzy/geometry/along-route search, geographic bias with geoBias, and EV charging; routing and calculateRoute (RoutingModule), route alternatives, turn-by-turn guidance instructions, route sections including toll and charged roads and speed limits, border crossings between country sections, EV routing with chargingStopsStrategy, and reachable ranges (isochrones); GeometriesModule; traffic flow, incidents, and area analytics; custom GeoJSON layers and bring-your-own-data (CustomGeoJSONModule, BYOD); and the agent-toolkit plugin for conversational map agents (createMapAgent, LLM tools, Vercel AI SDK). Also covers core Place/Route types, service config and customizeService, cancelling in-flight service calls with an AbortSignal (search-as-you-type, refetch on map move) and the SDKError/SDKServiceError/SDKAbortError classes, and utilities such as bboxFromGeoJSON, getPosition, formatDistance, and formatDuration.
allowed-tools: Read
---

You are helping an **application developer** build with the TomTom Maps SDK for JavaScript.

## Step 1: Identify the topic and read the reference doc

From `$ARGUMENTS` or the conversation context, match the topic to a doc filename:

| Topic                  | Filename             | Keywords                                                                                                                                                                             |
|------------------------|----------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Map setup              | `map-setup.md`       | map, display, language, module, maplibre, baseMap, hillshade, viewport, layer, non-interactive, bounds, style switcher                                                                |
| User interaction events | `user-events.md`    | click, hover, long-hover, contextmenu, events.on, events.off, event handler, precisionMode, paddingBoxPx, cursorOnHover, longHoverDelay, background click, rest of the map, event priority, layer order |
| Map styles             | `map-styles.md`      | style, setStyle, StyleChangeHandler, addStyleChangeHandler, style change, style switcher, dark mode, custom layers, style lifecycle, resetState                                       |
| Map styling (knobs)    | `map-styling.md`     | StylingModule, styling knobs, describe, catalogue, presets, applyPreset, data-viz, night driving, minimal, label size, icon size, road width, exit numbers, route shields, road arrows, 3D buildings, building footprints, POI micro markers, POI min zoom, zoom shift, POI label colour, traffic congestion colours, incident colours, globe, projection, sky, atmosphere, 3D terrain, terrain exaggeration, restyle base map, brand the map, setMapStyling, describeMapStyling |
| Module lifecycle events | `module-events.md`  | config-change, shown-features, module events, ModuleEvents, CombinedEvents, applyConfig, setVisible, unsubscribe, named event scopes, events.where                                   |
| Places & search        | `places.md`          | search, places, poi, fuzzy, geocode, address, reverse, autocomplete, geoBias, ev, charging, geometry, polygon, within, along route, route search, detour, viewportplaces                      |
| Routing                | `routing.md`         | route, routing, directions, waypoint, guidance, instructions, turn-by-turn, maneuver, phonetics, toll, tollRoad, sectionTypes, reachable, isochrone, range, ev routing, chargingStopsStrategy, alternatives, vehicle, charging stop, charging stop icon, customIcons, icon offset, abort, cancel, signal, route sections, speed limit, speed limit sign, section sign, country, border crossing, countryCrossings |
| Traffic                | `traffic.md`         | traffic, incidents, flow, analytics, congestion, speed, incident details                                                                                                             |
| Core types             | `core-types.md`      | place type, route type, properties, summary, sections, toll, tollRoad, originalWaypointIndex, eventId, instruction, maneuverView, address, poi, entry points, traffic types, delaymagnitude, typescript types                                                   |
| Core utilities         | `core-utilities.md`  | bbox, bboxFromGeoJSON, polygonFromBBox, getPosition, formatDistance, formatDuration, progress, waypoint insertion, route progress, snap                                              |
| Services config        | `services-config.md` | config, api key, language, validation, validateRequest, error, SDKError, SDKServiceError, SDKAbortError, cancel, cancellation, abort, AbortSignal, AbortController, signal, deadline, search-as-you-type, customizeService, hooks, onAPIRequest, onAPIResponse |
| MapLibre direct access | `maplibre.md`        | mapLibreMap, addSource, addLayer, removeLayer, geojson, vector tiles, raster, pmtiles, tile source, paint, layout, queryRenderedFeatures, querySourceFeatures, z-order, symbol layer, layer placement, layer order, beforeId, mapStyleLayerIDs, lowestLabel, lowestRoadLine, lowestBuilding, lowestPlaceLabel, poi anchor, draw roads under labels, polygon under roads, moveLayer |
| Custom GeoJSON module  | `custom.md`          | CustomGeoJSONModule, BYOD, bring your own data, custom geojson, customer-authored layers, heatmap layer, symbol layer with custom icon, multi-source module, applyConfig layer diff, per-source events, style-change restoration with own layers, beforeID, layer placement, mapStyleLayerIDs, polygons under roads, lines under labels |
| Map effects plugin     | `map-effects.md`     | map-effects, MapEffects, bloom, glow, vignette, tint, fog, edge blur, grade, brightness, contrast, saturation, mute the base map, dim the map under data, post-processing, capture, high-DPI, print, preserveDrawingBuffer |
| Landmarks 3D plugin    | `landmarks-3d.md`    | landmarks-3d, Landmarks3D, 3D landmarks, Orbis landmarks, GLB tiles, Three.js, fill-extrusion, display mode, inherited/dark/light, minZoom, maxZoom, ModelsLayer, custom layer, buildLandmarksTileURL |
| Agent toolkit plugin   | `agent-toolkit.md`   | agent, agent-toolkit, createMapAgent, LLM, chat, conversational, Vercel AI SDK, ToolLoopAgent, classifier, intent, per-turn scope, scopeSchema, scopePrompt, EntryDataKind, analyseData, processData, dataEntries, DataEntryKind, DataEntryConfig, enabled, entryMode, ToolEntry, ToolEntryBuilder, ToolState, custom tool, system prompt, BASE_SYSTEM_PROMPT, composeSystemPrompt, SYSTEM_PROMPT_SECTIONS, SystemPromptSection, SystemPromptSectionOverrides, section overrides, systemPromptPrefix, systemPromptSuffix, DEFAULT_TOOLS, MapAgentOptions, BYOD layers, addByodSource, setByodLayers, BYODDataProfile, updateByodDisplay, recallState, getTrafficIncidents where schema |

Read `${CLAUDE_SKILL_DIR}/docs/<filename>` directly — the path is fixed, so no search step is needed, and `${CLAUDE_SKILL_DIR}` resolves wherever this skill is installed. For multi-topic tasks, read several.

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
- **Map modules are async**: `await Module.create(map)` for data-owned modules (Places, Routing, Geometries, CustomGeoJSON, TrafficIncidentOverlay, TrafficAreaAnalytics — a new independent instance per call), `await Module.get(map)` for style-owned ones (BaseMap, POIs, TrafficFlow, TrafficIncidents, Hillshade — a shared controller)
- **`geocodeOne()` throws** if no result — use `geocode()` when uncertain
- **`searchOne()` throws** if no result — use `search()` when uncertain
- **Services work in Node.js** — no browser or map required
- **Map container CSS**: The map div AND `html, body` all need explicit height (`height: 100%` or `100vh`) and `margin: 0` — without this the map renders with zero height. Always include a complete HTML + CSS boilerplate in your answer, not just the TypeScript.
- **Layer placement**: `beforeId`/`beforeID` inserts a custom layer **below** any style layer, but use the `mapStyleLayerIDs` anchors from `@tomtom-org/maps-sdk/map` — they are stable across styles. Default **lines and polygons to `mapStyleLayerIDs.lowestLabel`** so all labels stay above them (the SDK's own default); points and markers go on top, with no anchor. Anchor table in `maplibre.md` (raw `addLayer`) and `custom.md` (`CustomGeoJSONModule` specs).
- **Provide visible UI feedback** for event handlers (toasts, panels, info bars) — not just `console.log`. Build real, functional UI that the user can see and interact with.

---

## Step 2: Answer

State the relevant imports, apply the patterns from the doc, note any gotchas. Then write the code. Include complete HTML, CSS, and TypeScript — not just the TypeScript.
