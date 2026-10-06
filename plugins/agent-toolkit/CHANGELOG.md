# Changelog

## 0.13.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: CustomGeoJSONModule places its layers with `beforeLayerConfig`, as every other module does, and can still put a layer below any layer outside the style
  - map: a layer's `beforeID: mapStyleLayerIDs.lowestLabel` is `beforeLayerConfig: 'lowestLabel'`; `beforeLayerConfig: { layerID }` goes below another layer, such as one of this or another module's
  - map: `beforeLayerConfig` on the module places every layer that sets none, `'top'` by default
  - agent-toolkit: `setByodLayers` keeps its `beforeID` parameter and needs SDK 0.64.0

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - agent-toolkit: `createMapAgent`'s `tools` option and `resolveTools` accept any `ToolDefinition`, so `DEFAULT_TOOLS` values and `ToolEntryBuilder`s type-check without a cast
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.3.0

## 0.12.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: whole base-map layer groups are `BaseMapModule`'s alone; the StylingModule knobs `basemap.<group>`, `buildings.footprints`, `buildings.3d` and `roads.shields` are gone
  - map: show or hide a group with `baseMap.setVisible(visible, { layerGroups: { show: 'only', values: ['buildings3D'] } })`, or `setKnob(baseMap, baseMapKnobCatalogue, 'groups.buildings3D.visible', true)`
  - map: the `data-viz`, `night-driving` and `minimal` presets no longer show or hide the building groups and the road shields
  - agent-toolkit: the `toggleTilesBaseMapLayerGroups` tool shows and hides whole groups, or the whole base map, and reports which groups are hidden; `setMapStyling` no longer takes the group knobs

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map-effects: `bloom.only` names the style colour knobs by their map-wide ids (`'traffic.incidents.colors.major'`, `'pois.label.color'`), and `StylingColorKnobGroup` is `StyleColorKnobGroup`
  - map-effects: the scope reads the colours with the SDK's `getStyleColor`, so it no longer needs a `StylingFoundationsModule` on the map
  - agent-toolkit: `setMapStyling` sets the look knobs on the module owning each (Styling, BaseMap road markings, POIs, traffic flow and incidents, the terrain hillshade) by its map-wide id, and its `preset` applies a map preset with `applyMapPreset`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `StylingModule` is `StylingFoundationsModule`, the name of what it holds now that every other module styles its own layers
  - map: its types and catalogue follow: `StylingFoundationsModuleConfig`, `StylingFoundationsEvents`, `StylingFoundationsKnob`, `StylingFoundationsKnobId`, `StylingFoundationsKnobKind`, `StylingFoundationsKnobRange`, `StylingFoundationsKnobValue`, `StylingFoundationsKnobValueOf`, `StylingFoundationsKnobAppliesTo`, `stylingFoundationsKnobCatalogue`, `stylingFoundationsKnobIds`, `stylingFoundationsKnobKinds` and `stylingFoundationsKnobAppliesTo`
  - agent-toolkit: the base-map state's `getStylingModule()` is `getStylingFoundationsModule()`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - agent-toolkit: the `ai` peer dependency requires `^6.0.300`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map-effects: `MapEffects` loses `set`, `get` and `reset`: one knob goes through the SDK's `setKnob`, `getKnob` and `resetKnob` with `effectKnobCatalogue`, several through `updateConfig(settings)`, and `resetConfig()` turns everything off
  - map-effects: `applyConfig` checks every value before it replaces any, so a refused value leaves the effects as they were instead of clearing them
  - map-effects: the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
  - agent-toolkit: `setMapStyling` sets and resets knobs through the SDK's `setKnob` and `resetKnob`, and the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.63.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.3

## 0.11.0

### Minor Changes

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - **Breaking:** getCurrentLocation sends the model the user's position rounded to about 100 m by default, and `createGetCurrentLocationTool({ fullPrecision: true })` builds the tool that sends the exact one.
  
  - **Breaking:** getCurrentLocation: the position is rounded to 3 decimals (about 100 m), `accuracy` is at least 111 m and `timestamp` is left out, from a fix that is not high-accuracy and up to 60 s old. Replace the default with `createGetCurrentLocationTool({ fullPrecision: true })` for the exact, high-accuracy position and its timestamp
  - `createGetCurrentLocationTool` builds the getCurrentLocation tool, and `GetCurrentLocationToolOptions` names its `fullPrecision` option

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** `updateTrafficAreaAnalyticsDisplay` takes `palette` for `colorTheme`, and `maxHeightMeters` or `metersPerUnit` for `heightScale`
  
  - updateTrafficAreaAnalyticsDisplay: **Breaking:** `colorTheme` is `palette`, which takes the SDK's `areaAnalyticsPalettes`. Migrate `colorTheme: 'heat'` to `palette: 'heat'`
  - updateTrafficAreaAnalyticsDisplay: **Breaking:** `heightScale` is `maxHeightMeters`, the tallest cell's height under the `predefinedRange` and `currentRange` scale modes, and `metersPerUnit` sets the metres per unit of the metric under `raw`, which it switches to; a call that sets both, or one with the other's `scaleMode`, is refused. Migrate `heightScale: 200` to `maxHeightMeters: 200`
  - updateTrafficAreaAnalyticsDisplay: the `scaleMode` description names `predefinedRange` as the default, the one the SDK applies
  - The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.62.0 <1.0.0`, the first release with `areaAnalyticsPalettes`, `setPalette` and `metersPerUnit`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's `useChat` snippet and the `createMapAgent` example compile against `ai@6`, and the README's tool tables list exactly the tools in `DEFAULT_TOOLS`.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Fixes:
  - The traffic incident tools show incidents with `TrafficIncidentDetailsModule`, and the styling tools read the style with `getStyleInput()`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.62.0 <1.0.0`, the first release whose map modules change their settings through `updateConfig` and filter area analytics with `setFilters`.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - findReachableAreas draws its ranges with the SDK's `ReachableRangesModule`, so their bands take the map's accent and land colours and follow a theme the agent sets
  
  - `RangeState.getEntryRangesModule` returns the entry's `ReachableRangesModule`; `getEntryGeometriesModule` now returns a plain `GeometriesModule` for drawing the entry's polygons in a style of your own, cleared with the entry; a later call changes only its fill style, keeping the styling applied since
  - `resetState` clears each ranges entry's geometries module too
  - Place boundaries and custom geometries draw in the map's accent instead of one rainbow colour each, as the SDK's `fillStyledGeometryConfig` no longer has a default palette; outlined ones keep a neutral grey border
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.62.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.2

## 0.10.1

### Patch Changes

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)! - `discoverPlaces` resolves category words to their best-ranked POI categories, at most 10 per search.
  
  - discoverPlaces: a natural-language `poiCategories` term resolves to at most three of the categories the SDK's ranked `getPOICategoryCodes` filter returns first, instead of every category whose name or synonym contains it, so "café" no longer searches truck stops ("Transport Café")
  - discoverPlaces: a search holds at most 10 category codes, the exact codes first and then each term's best match in turn, since the Places API rejects more; "bar" alone used to expand to 15
  - getPOICategoryCodes: returns each filter's best-matching categories through the SDK's ranked `filters`, so "bar" gives Bar rather than every category holding the word
  - `getViewportBias`, `MIN_VIEWPORT_BIAS_ZOOM`, `locatePlace` and `QueryAs` are documented for custom tools that resolve a place near the map view

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `discoverPlaces` resolves its `poiCategories` words in one `resolvePOICategories` lookup and lists the words nothing matched.
  
  - discoverPlaces: `poiCategories` resolves through the SDK's `resolvePOICategories` in one lookup across all inputs, so a category ranked below a matched parent is left out as the parent already covers it
  - discoverPlaces: `unmatchedPoiCategories` in the result lists the `poiCategories` inputs left out because nothing matched them, and the error when none matches suggests a broader word or an exact code
  - discoverPlaces: the tool tells the model to pass category words straight in instead of calling `getPOICategoryCodes` first, which no longer runs before it; `getPOICategoryCodes` is described for looking up or listing codes
  - discoverPlaces: a failed category lookup returns a tool error instead of throwing

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `setRoute`, `addWaypointsToRoute`, `replaceWaypointInRoute`, `removeWaypointsFromRoute` and `discoverPlaces` return `{ error }` with the service's message when the route calculation or the search result handling fails, instead of throwing it past the AI SDK, which showed the chat only "An error occurred."

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)! - `getTrafficAreaAnalytics` works in UTC days and hours, and reports the dates the response analysed.
  
  - `getTrafficAreaAnalytics` leaves an omitted `endDate` to the SDK default of three days ago, and reports the dates the response analysed, as UTC days, in its summary and entry label
  - `getTrafficAreaAnalytics` tells the model that its `hours` filter and every returned day and hour label are UTC, so it converts from the area's local time, and no longer returns a `timezone` the service never sends
  - The traffic area analytics schema that `analyseData`, `processData` and `clusterIncidents` show the model drops `timezone`, says the region `name` comes only when the request names the region, and describes the UTC `daily`, `hourly` and `average` entries of `timedData`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `discoverPlaces` in `maxDetour` mode searches along the route with the SDK's `discoverPlaces`, so the toolkit no longer imports `alongRouteSearch`, which the SDK does not export

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The reachable range tools pass `reachableRangeGeometryConfig` its options object, which needs `@tomtom-org/maps-sdk` `>=0.61.0`.
  
  - The reachable range tools build their geometry config with the options object `reachableRangeGeometryConfig` takes
  - The `@tomtom-org/maps-sdk` peer dependency requires `>=0.61.0 <1.0.0`, the first release where `reachableRangeGeometryConfig` takes an options object

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `toggleTilesPOIs` rejects a call whose `filterCategories.values` names no POI category or category group, listing the unknown values, rather than passing them to the map

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - agent-toolkit and map-effects check knob values with the SDK's `validateKnobValue`.
  
  - agent-toolkit: `toggleTilesPOIs` checks `filterCategories.values` with the SDK's `validateKnobValue`, so its error names every refused value the way the map does
  - map-effects: `set` checks values with the SDK's `validateKnobValue`, so a `color` knob refuses a string that is no CSS colour, and the peer range starts at `@tomtom-org/maps-sdk` 0.61.0
  - map-effects: every `effectKnobCatalogue` range has `bounds: 'hard'`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The places tools create and restyle their modules with the SDK's `markerType` and `applyMarkerType`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README points to `LICENSE.txt`, as the other plugins' READMEs do

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - A new guide, What the agent sends, and where, lists what reaches the model provider each turn, when `getCurrentLocation` reads the user's position, and which URLs `addByodSource` and `setMapStyling` load from the user's browser
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.2

## 0.10.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** The `updateRoutesDisplay` tool's `mainColor` input and output → `color`; `RoutingState.mainColor` → `color` and `RoutingState.setMainColor` → `setColor`
  - The `@tomtom-org/maps-sdk` peer dependency requires `>=0.60.0 <1.0.0`, the first release with the top-level route `color`

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.60.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.0

## 0.9.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** `findReachableAreas`, `processData` (`show.customGeometries`, `show.placesGeometries`), `updatePlacesDisplay` (`geometry`), `locatePlace` (`geometry`) and `discoverPlaces` (`geometries`) take `fillStyle` instead of `theme`, as the SDK's `GeometriesModuleConfig` names it
  - **Breaking:** The ranges and custom-geometries entries record the fill style they are shown with in `_shownFillStyle` instead of `_shownTheme`

### Patch Changes

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - The places tools pass their category and area-type restrictions through the SDK's `filters` object

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `createTracker` and `getTrackerHistory` tools pass SonarQube analysis, with unchanged behaviour

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - `setMapStyling({ theme })` also returns the theme's `accent` in `themeColors`, and a themed map recolours the routes and place pins the agent drew unless it set a colour for them
  - The peer dependencies are `@tomtom-org/maps-sdk` `>=0.59.0 <1.0.0` and `@tomtom-org/maps-sdk-plugin-map-theme` `>=0.2.0`, the first releases with the accent

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)! - `recallState` for a traffic area analytics entry lists only the region names the response has, instead of one `undefined` per region, and the traffic area analytics schema the data tools hand the model marks `name` and `timezone` optional
- Updated dependencies:
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.0

## 0.8.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** the POI filter mode is `'all-except'` instead of `'all_except'`, in `toggleTilesPOIs`'s input and `recallState`'s output, following the SDK's `FilterShowMode`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** The `describeMapStyling` tool is removed. `setMapStyling`'s schema now names every knob id with the range or values it accepts, so the model needs no separate call before setting one.

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The README's example links point at `examples/map-traffic-agent-react`, which the public repository ships, instead of an internal-only example

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency requires `^6.11.2`, `zod` `^4.6.5` and `ai` `^6.0.291`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The routes schema the model reads describes a street name as `{ text }`, following the SDK dropping phonetic transcriptions from route guidance

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: the TSDoc of reachable ranges, Long Distance EV Routing, EV charging stations availability and traffic area analytics says which API key access each needs; reachable ranges are marked as a private preview

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - The places tools search through the SDK's `discoverPlaces`, and the category codes their schemas name are the SDK's Places Search v3 ones — `CHARGING_LOCATION`, `FUEL_STATION`, `SUPERMARKET`, `PARK_AND_RECREATION_AREA`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - `setMapStyling` takes a `theme: { colors | imageUrl, mode }` and returns the resolved `themeColors`, so a conversation can theme the map from a brand, a website, an artist or a mood; a theme that comes out the other light or dark than the standard style switches to its variant first, reported as `switchedStyle`
  - `@tomtom-org/maps-sdk-plugin-map-theme` is a new peer dependency, behind `setMapStyling({ theme })`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.1.0

## 0.7.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** `toggleTilesBaseMapLayerGroups` is removed: `setMapStyling` covers the base-map layer groups as `basemap.<group>` knobs, and the building groups as `buildings.footprints` / `buildings.3d`

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)! - **Breaking:** `BaseMapState.getHillshadeModule` is removed, with the SDK's `HillshadeModule`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Recolouring a shown route or hiding its summary bubbles goes through the SDK's `updateConfig`, so it needs the SDK release that ships it
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.57.0

## 0.6.1

### Patch Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)!
  
  - setMapStyling: the tool describes and demonstrates the ten map colours (`colors.*`) of the SDK styling API
  - discoverPlaces and the shared place schemas follow the places GA search API
  - Accept every SDK release below 1.0: the peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.55.1 <1.0.0` instead of an exact version
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.56.0

## [0.6.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.4...maps-sdk-plugin-agent-toolkit-v0.6.0) (2026-09-21)


### ⚠ BREAKING CHANGES

* **map:** precise types for custom styles, places props and traffic data
* **services:** replace flat geo-bias fields with a single geoBias option
* **routing:** phase 3 — land the response data v3 already returns
* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes
* **map:** add more dark theme styling
* **routing:** drop the circle waypoint the API never had
* **map:** scoped module events and per-map shared style modules (lsi-159)
* **map:** replace get() with create() on data-owned map modules

### Features

* **map:** add more dark theme styling ([b53d60a](https://github.com/tomtom-international/maps-sdk-js/commit/b53d60ae9a75c394605de947b8c84d441f8d6660))
* **map:** replace get() with create() on data-owned map modules ([9d3d81e](https://github.com/tomtom-international/maps-sdk-js/commit/9d3d81e349d21ce00368c12462c5919f6d8da491))
* **map:** scoped module events and per-map shared style modules (lsi-159) ([d91519e](https://github.com/tomtom-international/maps-sdk-js/commit/d91519e870f2796a9874aa0b10651b7bc350b81e))
* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes ([657e9f7](https://github.com/tomtom-international/maps-sdk-js/commit/657e9f7b5177404dbe163111b805def0910b07d0))
* **map:** styling GA phase 1 — StylingModule and the describe() catalogue ([4379765](https://github.com/tomtom-international/maps-sdk-js/commit/437976535b976b33573002ade2d3611a3013ac28))
* **map:** styling GA phase 2 - view knobs, presets, map-effects plugin ([a672ffb](https://github.com/tomtom-international/maps-sdk-js/commit/a672ffbe5f9d2c61e009674e44ac49a4b9e0c980))
* **routing:** drop the circle waypoint the API never had ([a25365b](https://github.com/tomtom-international/maps-sdk-js/commit/a25365b8f491cc0b85001386601f2265c4ca05e2))
* **routing:** phase 3 — land the response data v3 already returns ([d071f02](https://github.com/tomtom-international/maps-sdk-js/commit/d071f02a30cbe6abf14423dc0309c782480f8a06))
* **services:** replace flat geo-bias fields with a single geoBias option ([14fdb49](https://github.com/tomtom-international/maps-sdk-js/commit/14fdb491b1a481ea49e050bee399be570a5120e0))
* **service:** support request cancellation via AbortSignal ([f2df5e4](https://github.com/tomtom-international/maps-sdk-js/commit/f2df5e42547e0d4fab79e078f375d419a82dd2a1))


### Bug Fixes

* stop partial route updates clobbering config, give BYOD reset a contract ([e69e37e](https://github.com/tomtom-international/maps-sdk-js/commit/e69e37ec833f665ec00b1b32835296e4918f9ad9))


### Code Refactoring

* **map:** precise types for custom styles, places props and traffic data ([8f2a9bd](https://github.com/tomtom-international/maps-sdk-js/commit/8f2a9bd80073cfaa5087e09698167aedebc1acba))

## [0.5.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.3...maps-sdk-plugin-agent-toolkit-v0.5.4) (2026-08-25)


### Bug Fixes

* **docs:** correct stale APIs, dead links and drifted contributor docs ([fa3dc7b](https://github.com/tomtom-international/maps-sdk-js/commit/fa3dc7bab594c685a1235376abb2ac9c386ebb81))

## [0.5.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.2...maps-sdk-plugin-agent-toolkit-v0.5.3) (2026-08-24)


### Bug Fixes

* **agent-toolkit:** range-check the sandbox fitOnMap bbox ([6d1c02e](https://github.com/tomtom-international/maps-sdk-js/commit/6d1c02e5e8d15bcc50c385479e72bddc662dc61c))

## [0.5.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.1...maps-sdk-plugin-agent-toolkit-v0.5.2) (2026-08-24)


### Features

* add BaseMapModule appearance API and upgrade maplibre-gl to v6 ([f6b5296](https://github.com/tomtom-international/maps-sdk-js/commit/f6b52966d456f1f73a9ce9dbe3a7b19eac164bc3))
* attribute map traffic to the product embedding the SDK ([644089f](https://github.com/tomtom-international/maps-sdk-js/commit/644089f7921e12caf9405bea715a62e3c7c8aa97))


### Bug Fixes

* **agent-toolkit:** range-check model coordinates and report plugin coverage ([8a4bcde](https://github.com/tomtom-international/maps-sdk-js/commit/8a4bcde241e0d6339c84d037a547e79ed5be9adc))

## [0.5.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.0...maps-sdk-plugin-agent-toolkit-v0.5.1) (2026-08-04)


### Features

* **examples:** move the traffic and site-selection agents to Las Vegas ([4b19cb9](https://github.com/tomtom-international/maps-sdk-js/commit/4b19cb994fee43e28bead4b6595526679d63e569))


### Bug Fixes

* location resolver selecting subdivision over parent city ([11b44ef](https://github.com/tomtom-international/maps-sdk-js/commit/11b44ef67f2811b67011a3cdc228e0d105d10736))

## [0.5.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.4...maps-sdk-plugin-agent-toolkit-v0.5.0) (2026-07-24)


### ⚠ BREAKING CHANGES

* **map:** improve base map layer groups

### Features

* **map:** improve base map layer groups ([4bf43b8](https://github.com/tomtom-international/maps-sdk-js/commit/4bf43b88910378e129ff2ec8d486eaf67a6210b6))


### Bug Fixes

* **agent-toolkit:** surface reverse-geocode no-match as an error ([8582a44](https://github.com/tomtom-international/maps-sdk-js/commit/8582a4407776e44e7fd5cd28d12411748bc7ed79))
* chat UX polish, whitespace hex rendering, entry-id collision in toolkit ([c1b97db](https://github.com/tomtom-international/maps-sdk-js/commit/c1b97dbe0e577918f0c391704632ee76378c23a3))

## [0.4.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.3...maps-sdk-plugin-agent-toolkit-v0.4.4) (2026-07-07)


### Features

* **examples:** add byod district prompts and per-district traffic monitoring ([60fe0e8](https://github.com/tomtom-international/maps-sdk-js/commit/60fe0e8619a1efa7b40c0061aa40293fb89179f1))


### Bug Fixes

* **agent-toolkit:** resolve routing waypoints by place id or entry id ([e73a15f](https://github.com/tomtom-international/maps-sdk-js/commit/e73a15f8f6d0a7b796b36b5d6a58ee04437e1f70))
* **agent-toolkit:** ungate scope and cross kind schemas ([6a4cb2e](https://github.com/tomtom-international/maps-sdk-js/commit/6a4cb2e8925072d301a615bc285b1394af4eb28b))

## [0.4.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.2...maps-sdk-plugin-agent-toolkit-v0.4.3) (2026-07-03)


### Bug Fixes

* **agent-toolkit:** unblock npm publishing of the plugin ([b0ae964](https://github.com/tomtom-international/maps-sdk-js/commit/b0ae9647970ab03e3ed6906b529bdb6c7aba6b3a))

## [0.4.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.1...maps-sdk-plugin-agent-toolkit-v0.4.2) (2026-07-03)


### Features

* **examples:** agent telemetry and Azure Monitor observability dashboard ([92893fe](https://github.com/tomtom-international/maps-sdk-js/commit/92893febbdcb6e1c1617867d1de3f0115c95815b))


### Bug Fixes

* **agent-toolkit:** accept places entry ids in where.placeIds ([5cf934d](https://github.com/tomtom-international/maps-sdk-js/commit/5cf934ddcabdc9c48ead7c1e6cb530e7fa57a2e2))
* **agent-toolkit:** guard setMapStandardStyle against accidental style changes ([eed6211](https://github.com/tomtom-international/maps-sdk-js/commit/eed62110b17efb7fb8b894f3433c97760a68ee5f))
* **agent-toolkit:** prefer dedicated tools over the MapLibre escape hatch ([a67a548](https://github.com/tomtom-international/maps-sdk-js/commit/a67a54850c8ac25ed2624e3478137bc16a1d63c5))
* **agent-toolkit:** validate processData places and trace derived ids ([f820d53](https://github.com/tomtom-international/maps-sdk-js/commit/f820d535f3b75f2467bed380b78407c87f243cad))

## [0.4.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.0...maps-sdk-plugin-agent-toolkit-v0.4.1) (2026-06-30)


### Features

* **agent-toolkit:** expose sandbox data-tool inputs as per-entry records only ([ae53be5](https://github.com/tomtom-international/maps-sdk-js/commit/ae53be54707aaa063d4a948d42226ae35761a2da))
* **examples:** unify the agent example UI + clarifyIntent survey wizard ([d1b3e05](https://github.com/tomtom-international/maps-sdk-js/commit/d1b3e0561134df7e3330ff04f360c1419a59d5ab))
* **toolkit:** add clarifyIntent tool and add alwaysActive flag to tools ([112a58a](https://github.com/tomtom-international/maps-sdk-js/commit/112a58abf731faed3df14618f41f0a63ddf57ed1))
* **traffic-agent:** watched-area highlight, grouped Event tracker, summary follows focus ([54476ec](https://github.com/tomtom-international/maps-sdk-js/commit/54476ec3415956a960f6013243cf1640f5480c9b))


### Bug Fixes

* **agent-toolkit:** register an empty entry for zero-incident results ([aed58c2](https://github.com/tomtom-international/maps-sdk-js/commit/aed58c2be416ddfe3369fc6ac8f9991dcbb982a4))

## [0.4.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.1...maps-sdk-plugin-agent-toolkit-v0.4.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **agent-toolkit:** consolidate per-kind recall tools into recallState
* **agent-toolkit:** analysis and incidents clustering improvements
* **traffic, map-display:** migrate to Orbis v2 GA

### Features

* **agent-toolkit:** `resolvedAreas` — surface where every query resolved ([f89f5cd](https://github.com/tomtom-international/maps-sdk-js/commit/f89f5cdb1e09362d4d3cef0c33e118a3fe29af42))
* **agent-toolkit:** analysis and incidents clustering improvements ([c9aa482](https://github.com/tomtom-international/maps-sdk-js/commit/c9aa4829056ae6779cd88415ff20b30be6f5e26a))
* **agent-toolkit:** app-supplied URL-validator hook for addByodSource ([b9a38a8](https://github.com/tomtom-international/maps-sdk-js/commit/b9a38a8263f6d54f8094c507ffa9d36f447686d5))
* **agent-toolkit:** fold incident monitoring into getTrafficIncidents ([6e63e92](https://github.com/tomtom-international/maps-sdk-js/commit/6e63e92571f4617f0502b18344a5252c6ee9902c))
* **agent-toolkit:** generic trackers on the analyses registry ([8d05187](https://github.com/tomtom-international/maps-sdk-js/commit/8d051871979e9f6ce2b281ae63b06286a56e62ea))
* **agent-toolkit:** keep untrusted BYOD free-text out of model context ([935c6eb](https://github.com/tomtom-international/maps-sdk-js/commit/935c6eb12899abe25fe5d5c1dfe42fb474ee5fa0))
* **agent-toolkit:** monitor routes — periodic live-traffic recalculation ([ca20d3c](https://github.com/tomtom-international/maps-sdk-js/commit/ca20d3cec0e20dcf247109ff0643b7104ba3ac9c))
* **agent-toolkit:** sandbox data-tool execution in a browser iframe-worker ([1103cf2](https://github.com/tomtom-international/maps-sdk-js/commit/1103cf2599379e57b19b7400da053fb7a5d96f73))
* **agent-toolkit:** split and compact the base system prompt ([bc9ff9e](https://github.com/tomtom-international/maps-sdk-js/commit/bc9ff9e5146dc92c610be8edaf463e1e3ac28bce))
* **agent-toolkit:** unify where-resolution ([6720e02](https://github.com/tomtom-international/maps-sdk-js/commit/6720e026b22b25b0cfe180fa7b811b4fa1daa18c))
* **traffic, map-display:** migrate to Orbis v2 GA ([6ccd244](https://github.com/tomtom-international/maps-sdk-js/commit/6ccd2445de3ef4e209b30cdd13009e2408328d80))


### Reverts

* feat(traffic, map-display)!: migrate to Orbis v2 GA ([12ed6b9](https://github.com/tomtom-international/maps-sdk-js/commit/12ed6b9dcc6b7e2c22d3525aa05f85c1ba6b5e89))


### Code Refactoring

* **agent-toolkit:** consolidate per-kind recall tools into recallState ([a519e1f](https://github.com/tomtom-international/maps-sdk-js/commit/a519e1f82efc571ef64492e269706482b67b1ef7))

## [0.3.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.0...maps-sdk-plugin-agent-toolkit-v0.3.1) (2026-06-10)


### Features

* **agent-toolkit:** deterministic DBSCAN clustering tool ([c1d31b4](https://github.com/tomtom-international/maps-sdk-js/commit/c1d31b4ddb1e71bf8bcbae5bdc57b3400d9cedcd))

## [0.3.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.12...maps-sdk-plugin-agent-toolkit-v0.3.0) (2026-06-04)


### ⚠ BREAKING CHANGES

* **events:** scope + dedupe allEventFeatures, typed substitution
* **agent-toolkit:** byod improvements

### Features

* **agent-toolkit:** byod improvements ([4aeddca](https://github.com/tomtom-international/maps-sdk-js/commit/4aeddca52a1da30cde36f6dbb18ddad689f47f27))
* **events:** scope + dedupe allEventFeatures, typed substitution ([036c9c4](https://github.com/tomtom-international/maps-sdk-js/commit/036c9c41be660b92ed80b74cae4b998ce595f94d))


### Bug Fixes

* **agent-toolkit:** add missing [@group](https://github.com/group) tags on exported types ([67f1cf3](https://github.com/tomtom-international/maps-sdk-js/commit/67f1cf3c383d2e0db544cead55d16a66342ec4c2))
* **agent-toolkit:** public docs cleanup — links, system-prompt guidance, internal refs ([283fbc9](https://github.com/tomtom-international/maps-sdk-js/commit/283fbc9f588e261baf1112805f77102b88ce7f5a))

## [0.2.12](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.11...maps-sdk-plugin-agent-toolkit-v0.2.12) (2026-05-22)


### Features

* **agent-toolkit:** expand plugin documentation ([3f55084](https://github.com/tomtom-international/maps-sdk-js/commit/3f550843ca92b2f08460759b200794e94178e87d))


### Bug Fixes

* **agent-toolkit:** split scenario tests into sanity / full suites ([b9b1fe8](https://github.com/tomtom-international/maps-sdk-js/commit/b9b1fe8a6dcdf8f6e6fb156a2f251351b04851c9))
* **agent-toolkit:** stabilize locate-place scenario prompt ([6883269](https://github.com/tomtom-international/maps-sdk-js/commit/6883269ccfd261c66067de6f8290d28a9dd83b91))

## [0.2.11](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.10...maps-sdk-plugin-agent-toolkit-v0.2.11) (2026-05-21)


### Bug Fixes

* **agent-toolkit:** point README docs link at overview page ([b2aba55](https://github.com/tomtom-international/maps-sdk-js/commit/b2aba55dccab4109b12a9358bc5003a066926e9b))

## [0.2.10](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.9...maps-sdk-plugin-agent-toolkit-v0.2.10) (2026-05-21)


### Bug Fixes

* engineering guideline updates for agent toolkit ([dd24926](https://github.com/tomtom-international/maps-sdk-js/commit/dd2492643fc67fc8e7dd3f6247f21569227b5912))

## [0.2.9](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.8...maps-sdk-plugin-agent-toolkit-v0.2.9) (2026-05-21)


### Features

* code generation tools with updated docs ([ef1a7fa](https://github.com/tomtom-international/maps-sdk-js/commit/ef1a7fac2120e093564afeabd8def3ab7e93dc94))

## [0.2.8](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.7...maps-sdk-plugin-agent-toolkit-v0.2.8) (2026-05-21)


### Features

* upgrade SDK agent toolkit and fix release process ([6e09446](https://github.com/tomtom-international/maps-sdk-js/commit/6e094469c689dd824a29bfaea9cc67cbe931390d))

## [0.2.7](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.6...maps-sdk-plugin-agent-toolkit-v0.2.7) (2026-05-15)


### Features

* exploration search with area tags ([65327e6](https://github.com/tomtom-international/maps-sdk-js/commit/65327e66eca351db365b5453e3801b420cee32e4))


### Bug Fixes

* agent toolkit place prompt fixes and clearing unnecessary modules ([1aa1873](https://github.com/tomtom-international/maps-sdk-js/commit/1aa1873811705077d40af1942d38c4c5bf3d9568))

## [0.2.6](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.5...maps-sdk-plugin-agent-toolkit-v0.2.6) (2026-05-12)


### Features

* agent evaluation testing [LSI-285] ([dd02bec](https://github.com/tomtom-international/maps-sdk-js/commit/dd02bec020e08b517c2908d2690d8bf0f9ae0aa3))


### Bug Fixes

* upgrade and fix deps ([f5f1f8e](https://github.com/tomtom-international/maps-sdk-js/commit/f5f1f8ed8d6168f24fdee900f580587fcc434422))

## [0.2.5](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.4...maps-sdk-plugin-agent-toolkit-v0.2.5) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent ([f16863c](https://github.com/tomtom-international/maps-sdk-js/commit/f16863c85f99dbebe167c7afe8adc6c8d81fbdb4))


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes ([61d2eb3](https://github.com/tomtom-international/maps-sdk-js/commit/61d2eb3abadc6d7190a7a69fb55be09761d1f427))

## [0.2.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.3...maps-sdk-plugin-agent-toolkit-v0.2.4) (2026-04-30)


### Features

* add managePlaces tool and centralize places display state ([0cc5005](https://github.com/tomtom-international/maps-sdk-js/commit/0cc50050469f5ae8fa3450afc572c9491346f2e1))
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md ([9428902](https://github.com/tomtom-international/maps-sdk-js/commit/9428902605299302fdbb206f22a514e6761d0716))


### Bug Fixes

* LSI-259 Fix tests that were failing because API changed response from 403 to 401 ([6c5c3ec](https://github.com/tomtom-international/maps-sdk-js/commit/6c5c3ecd3e6c7212266f5d9c63da3d0b0d52b8c3))

## [0.2.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.2...maps-sdk-plugin-agent-toolkit-v0.2.3) (2026-04-14)


### Bug Fixes

* update agent toolkit link in readme ([8659362](https://github.com/tomtom-international/maps-sdk-js/commit/86593623e7e790fdc7c2a89b70d7292076b53aa5))

## [0.2.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.1...maps-sdk-plugin-agent-toolkit-v0.2.2) (2026-04-14)


### Bug Fixes

* rename map-agent plugin to agent-toolkit ([535b0f5](https://github.com/tomtom-international/maps-sdk-js/commit/535b0f57c1b3ec2fedae70a351b52463594ebebe))

## [0.2.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.2.0...maps-sdk-plugin-ai-agent-v0.2.1) (2026-04-10)


### Features

* new module events to react to config changes and shown features ([28e295e](https://github.com/tomtom-international/maps-sdk-js/commit/28e295ea1a36cf85361469a1210434684e6d7689))


### Bug Fixes

* ai plugin docs diagrams ([bbbf011](https://github.com/tomtom-international/maps-sdk-js/commit/bbbf011fd39ec0b82e455891fe6b3f601f8a0a72))
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup ([dab7d79](https://github.com/tomtom-international/maps-sdk-js/commit/dab7d7912892f76e256d677c9ed416c1f1bc447c))

## [0.2.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.1.0...maps-sdk-plugin-ai-agent-v0.2.0) (2026-04-09)


### Features

* Initial release! Explore the README and documentation for further information.
