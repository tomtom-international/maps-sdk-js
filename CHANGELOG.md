# Changelog

## 1.0.0-rc.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `npm install @tomtom-org/maps-sdk` installs the 1.0.0 release candidate, with no `@rc` needed, and the npm page shows its README

## 1.0.0-rc.0

### Major Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core, services, map: 1.0.0, the first stable release of the SDK. The *Upgrading to 1.0 from a 0.x release* guide lists every change to apply from a 0.x release.

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** core, services, map: the error codes take the TomTom Navigation SDK's names: `API_KEY_REJECTED` is `INVALID_CREDENTIALS`, `SERVICE_UNAVAILABLE` is `LIVE_SERVICE_NOT_AVAILABLE`, `NETWORK_ERROR` is `NETWORK_NOT_AVAILABLE` and `UNEXPECTED` is `INTERNAL`
  **Breaking:** core, services, map: a `403` is `INSUFFICIENT_PERMISSIONS`, a valid key not allowed the request, and `INVALID_CREDENTIALS` is a `401` only, a key the API does not know
  - services, map: `SDKError.canRetry` and `TomTomMapError.canRetry` are `true` for `RATE_LIMITED`, `LIVE_SERVICE_NOT_AVAILABLE` and `NETWORK_NOT_AVAILABLE`, the failures that clear on their own
  - services: a `403` keeps the API's message, and `SDKServiceError.apiErrorCode` holds the API's own code: `'Forbidden'` when the API is not enabled for the key, `'InvalidReferer'` when its domain restriction refused the page
  - services: `calculateReachableRange` and `calculateReachableRanges`, in Private Preview, name the access a key lacks, and link the Private Preview terms, in the message; the access is also in `SDKServiceError.privatePreviewAccess`, `{ product, requestAccessURL }`
  - map: a style, tile, sprite or glyph answered `403` reaches the error handlers as `INSUFFICIENT_PERMISSIONS`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the sky, space, incident delay and hillshade knobs are named as every other knob is: a part's settings sit under it, and no name repeats its parent
  - map: `StylingFoundationsModule` knob ids `view.sky`, `view.skyColor`, `view.horizonColor` and `view.spaceColor` are `view.sky.visible`, `view.sky.color`, `view.sky.horizonColor` and `view.space.color`, in `styleColorKnobIds`, `getStyleColor` and map presets too
  - map: `TrafficIncidentsModule` `filters: { delays: { mustHaveDelay, minDelayMinutes } }` is `filters: { delays: { required, minMinutes } }`, and the knob ids follow
  - map: `TerrainModule` `hillshade: { lightDirection, exaggeration, shadowColor, highlightColor, accentColor }` is `hillshade: { light: { direction }, intensity, colors: { shaded, lit, steep } }`, and the knob ids follow, in `styleColorKnobIds` and `getStyleColor` too; `exaggeration` is now only the raised surface's vertical scale
  - agent-toolkit: `setMapStyling`'s globe example sets `view.sky.visible`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `PlacesKnob` and the traffic knob types list only the kinds their catalogues hold, so a `switch` over their `kind` drops the cases no entry reaches
  - `PlacesKnob` no longer includes `text`
  - `TrafficFlowKnob`, `TrafficIncidentsKnob`, `TrafficIncidentDetailsKnob` and `TrafficAreaAnalyticsKnob` no longer include `image`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the last config properties and knob ids off the shared vocabulary follow it: a size preset is a `*Preset`, a fill style sits under `fill`, and a unit is named once
  - map: `GeometriesModule` and `ReachableRangesModule` take `fill: { style }` instead of `fillStyle`, and `TrafficAreaAnalyticsModule` `regionPolygon: { fill: { style } }` instead of `regionPolygon.fillStyle`; a feature's `properties.fillStyle` stays
  - map: `RoutingModule` `width`, `sections.<type>.width` and `waypoints.size` are `widthPreset`, `sections.<type>.widthPreset` and `waypoints.sizePreset`
  - map: `PlacesModule` `cluster.source` takes `radius`, `maxZoom`, `minPoints` and `properties` instead of MapLibre's `clusterRadius`, `clusterMaxZoom`, `clusterMinPoints` and `clusterProperties`, typed by `PlacesClusterSourceConfig`
  - map: `PlacesModule` `label.offset` is `label.distance`, since an `offset` is an `[x, y]` displacement on every module
  - map: `TrafficAreaAnalyticsModule` `height.maxHeightMeters` and `height.minHeightMeters` are `height.maxMeters` and `height.minMeters`, in `setHeight` too
  - map: each renamed property's knob id follows it
  - agent-toolkit: the tools keep their parameters, and the plugin needs SDK 1.0.0-rc.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the map loads TomTom standard styles only, so a custom style URL or style JSON no longer loads
  - `StyleInput` no longer takes `{ type: 'custom', url }` or `{ type: 'custom', json }`, and `CustomStyle` and `CustomStyleSource` are no longer exported
  - `lightDarkTheme` is gone with them: `map.styleLightDarkTheme` follows from the standard style ID
  - Restyle a standard style at runtime with `StylingFoundationsModule` and `setMapColors` instead

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** core, services, map: the SDK no longer offers real-time EV charging availability, nor routes and reachable ranges planned on a vehicle consumption model; search results keep their static EV station data
  - services: `evChargingStationsAvailability`, `getPlacesWithEVAvailability`, `getPlaceWithEVAvailability` and `hasChargingAvailability` are removed
  - services: long-distance EV routing is removed: `vehicle.preferences`, `chargingStopsStrategy` and `chargingStopsStrategies`
  - services: `vehicle` takes `model.dimensions.weightKG`, `state.heading` and `restrictions` only: `engineType`, `model.engine`, `model.variantId` and the charge and fuel state are removed, with the electric, combustion and generic vehicle types
  - core: the reachable-range budgets `remainingChargePCT`, `spentChargePCT` and `spentFuelLiters` are removed; a budget is `timeMinutes` or `distanceKM`
  - core: route and leg summaries lose their battery, charge and fuel fields and `chargingInformationAtEndOfLeg`, with `ChargingStop`
  - core: `ChargingPark.availability`, `ChargingPoint.status` and `dataSources.chargingAvailability` are removed; `StaticChargingPoint` becomes `ChargingPoint`, and `ChargingStation` takes no type parameter
  - map: `PlacesModule` loses `evAvailability`, `categoryIcons` entries lose `availabilityLevel`, and `RoutingModule` loses `chargingStops`, with their knobs, events and shown data
  
  The *Upgrading to 1.0 from a 0.x release* guide lists every removed name.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: each standard style ID is the Orbis style it loads, in camelCase
  - map: `standardLight`, `standardDark`, `drivingLight`, `drivingDark` and `satellite` are `streetLight`, `streetDark`, `streetLightDriving`, `streetDarkDriving` and `streetSatellite`; `monoLight` and `monoDark` stay
  - agent-toolkit: `setMapStandardStyle` takes the new IDs, `resetState` reverts to `streetLight`, and the plugin needs SDK 1.0.0-rc.0
  - map-theme, landmarks-3d: their docs name the new IDs

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: the `maplibre-gl` peer dependency moves up to `^6.12.0`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core, services, map: the package ships without source maps, so a stack trace through the SDK points into its minified bundles, which keep their function names
  - An app's own source maps still lead a trace to the SDK's frames (`map/dist/map.es.js:1:84523`); share such a trace in a report and TomTom maps it back to the source

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TerrainModule` sets the hillshade light's height and what its direction turns with, and the `multidirectional` method fans its four lights around the light's direction
  - map: `hillshade.light.altitude`, in degrees above the horizon, and `hillshade.light.alignment`, `viewport` or `map` (`hillshadeLightAlignments`), in the config and as `terrainKnobCatalogue` knobs
  - map: with `method: 'multidirectional'`, `hillshade.light.direction` is the centre of four lights spread over 135°

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TrafficIncidentsModule` can show planned incidents, and its incident descriptions follow the map language
  
  - `timeValidity: ['present', 'future']` brings scheduled roadworks and closures in next to the incidents under way, also as the `timeValidity` knob
  - `description` is in the map language, or the nearest one the traffic service has (`pt-PT` for `pt-BR`), else English; `map.setLanguage` reloads the incident tiles when that changes
  - core: `trafficIncidentTimeValidities` lists every `TrafficIncidentTimeValidity`, `present` first

## 0.64.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: CustomGeoJSONModule places its layers with `beforeLayerConfig`, as every other module does, and can still put a layer below any layer outside the style
  - map: a layer's `beforeID: mapStyleLayerIDs.lowestLabel` is `beforeLayerConfig: 'lowestLabel'`; `beforeLayerConfig: { layerID }` goes below another layer, such as one of this or another module's
  - map: `beforeLayerConfig` on the module places every layer that sets none, `'top'` by default
  - agent-toolkit: `setByodLayers` keeps its `beforeID` parameter and needs SDK 0.64.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the event-state methods are `setEventState`, `clearEventState` and `clearEventStates`, and the style-owned modules' `getShown()` is `getRenderedFeatures()`
  - map: `putEventState`, `cleanEventState` and `cleanEventStates` are renamed on every data-owned module and its named scopes; `PutEventStateOptions`, `CleanEventStateOptions` and `CleanEventStatesOptions` are `SetEventStateOptions`, `ClearEventStateOptions` and `ClearEventStatesOptions`
  - map: `POIsModule`, `TrafficFlowModule` and `TrafficIncidentsModule` `getShown()` is `getRenderedFeatures()`, what their tiles render in view; the data-owned modules keep `getShown()`, the data `show` was given

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: every module's `highlight` names the part it changes, then the property, so the hovered and clicked look reads the same across modules
  - RoutingModule: `highlight: { outlineWidthFactor }` is `highlight: { outline: { widthFactor } }`, knob id `highlight.outline.widthFactor`
  - GeometriesModule and ReachableRangesModule: `highlight: { fillOpacityFactor, lineWidthFactor }` is `highlight: { fill: { opacityFactor }, line: { widthFactor } }`, knob ids `highlight.fill.opacityFactor` and `highlight.line.widthFactor`
  - TrafficIncidentDetailsModule: `highlight: { outlineColor, widthFactor }` is `highlight: { outline: { color }, line: { widthFactor } }`, knob ids `highlight.outline.color` and `highlight.line.widthFactor`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** services, map: a `commonBaseURL` on `http:` is refused unless it is a loopback address (`localhost`, `127.0.0.0/8`, `[::1]`), so the API key never travels in the clear
  - services: such a call rejects with an `SDKError` coded `INSECURE_BASE_URL` before any request, even with `validateRequest: false`
  - map: the `TomTomMap` constructor throws a `TomTomMapError` coded `INSECURE_BASE_URL`
  - a relative base URL, such as `/api`, still follows the page

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map, services: internals that were exported without documentation are no longer exported
  - map: `EventsProxy`, `sharedInstance`, `TomTomMapSource`, `InternalTomTomMapParams`, `poiLayerIDs`, `buildRoutingLayers` and `ROUTE_LINE_OUTLINE_COLOR`, whose value the upgrade guide gives
  - services: the geometry data wire-format types `GeometryDataResponseAPI` and `AdditionalDataAPI`
  - flyover: the arrow marker keeps its default fill, now defined in the plugin rather than imported from the SDK

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a shape's edge is its outline and a label's is its halo, in every module
  - map: the map colour `labelOutline` is `labelHalo`, knob id `colors.labelHalo`
  - map: PlacesModule `cluster.badge.strokeColor` and `strokeWidth` are `outlineColor` and `outlineWidth`, knob ids `cluster.badge.outlineColor` and `cluster.badge.outlineWidth`
  - map-theme: `deriveMapColors`, `deriveMapColorsFromCss` and `deriveMapColorsFromImage` return `labelHalo` in place of `labelOutline`, and need SDK 0.64.0

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: ReachableRangesModule's border labels are `lineLabel`, as GeometriesModule names the labels along a line
  - `label` is `lineLabel`, its knob ids `lineLabel.*`, and `ReachableRangeLabelConfig` is `ReachableRangeLineLabelConfig`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** services: `getSearchSuggestions` takes `limit` and `geoBias: { position }`, as the other searches name them
  - `getSearchSuggestions({ maxResults: 8, origin: [4.9, 52.37] })` is `getSearchSuggestions({ limit: 8, geoBias: { position: [4.9, 52.37] } })`; defaults and behaviour are unchanged

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** services, map: every SDK error names what went wrong in a `code`, one of `SDKErrorCode`, and carries the `sdkVersion` that raised it
  - core: `sdkErrorCodes` lists the codes: `INVALID_REQUEST`, `INSECURE_BASE_URL`, `API_KEY_REJECTED`, `NOT_FOUND`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `NETWORK_ERROR`, `ABORTED`, `WEBGL_UNSUPPORTED`, `WEBGL_CONTEXT_LOST`, `STYLE_LOAD_FAILED`, `UNEXPECTED`
  - services: a request that gets no response rejects with `NETWORK_ERROR`, keeping what `fetch` threw as its `cause`
  - **Breaking:** services: `SDKError`'s third constructor argument is an options object, `{ code, issues?, cause? }`, instead of the Zod issues
  - map: `TomTomMap.addErrorHandler` receives every failure after construction as a `TomTomMapError`: a style, tile, sprite or glyph that failed to load, with its `status` and `sourceId`, and a lost WebGL context
  - map: the `TomTomMap` constructor throws a `TomTomMapError` with `WEBGL_UNSUPPORTED` when the browser has no WebGL2, and `setStyle` rejects with one when the style fails to load

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** core, services, map: 37 internal helpers and types are no longer exported, or no longer in the published types
  - **Breaking:** core: `bboxExpandedWithPosition`, `bboxExpandedWithBBox`, `bboxExpandedWithGeoJSON`, `toPointFeature`
  - **Breaking:** services: `ServiceTemplate`, `ParseResponseError`, `ParsedFetchResponse`, `RequestOptions`, `parseDefaultResponseError`, `buildResponseError`, `buildValidationError`
  - **Breaking:** map: `renderedRefId`, `findFeatureByRefId`, `filterLayersBySources`, `withEventState`, `combineEventScopes`, `scopedLayerSpecs`, `reservedScopeNames`, `assertNoReservedScopeNames`, `getIconIDForPlace`, `getPOIGroupForPlace`, `getPOILayerCategoryForPlace`, `STOP_DISPLAY_LABEL`, `getStyleCategories`
  - **Breaking:** core: helpers its packages share are left out of the published types, so TypeScript no longer resolves them: `mergeFromGlobal`, `TomTomHeaders`, `generateTomTomHeaders`, `bboxOnlyIfWithArea`, `getPositionStrict`, `toPointGeometry`, `poiCategoriesToID`, `poiCategoriesToIDs`, `poiIDsToCategories`, `getRoutePlanningLocationType`, `iconToTrafficIncidentCategory`, `trafficIncidentToIconCategory`, `MILE_IN_METERS`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `MapLibreOptions` no longer accepts `transformRequest`, which the SDK sets itself, so a value that never took effect is now a type error
  - route TomTom requests through a proxy of your own with `commonBaseURL` instead

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: a Vite build or dev server renders the map with no MapLibre worker setup: `TomTomMap` starts MapLibre's web worker from the copy Vite builds out of your own `maplibre-gl`, served from your app's origin
  - `registerMapLibreWorker: false` keeps MapLibre's own worker lookup
  - MapLibre's own lookup also stays in place when you already called its `setWorkerUrl`, when MapLibre loads unbundled from a CDN, and under webpack's default classic workers

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core: a partial `retry` passed to `TomTomConfig.instance.put` takes its missing fields from the default retry config
  - `put({ retry: { timeoutMs: 10000 } })` no longer leaves `initialWaitMs` and `backoffFactor` undefined, which made `429` retries wait `NaN` milliseconds

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core: `sendUserAgentHeader: false` in the global config, or in a map's or a service call's params, stops requests from carrying the `tomtom-user-agent` header

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services, map: import as values the catalogues that only exported their types
  - services: `arrivalSides`, `chargingStopsStrategies` and `functionalRoadClasses` from `@tomtom-org/maps-sdk/services`, as `routeTypes` already is
  - map: `AREA_ANALYTICS_DEFAULTS` from `@tomtom-org/maps-sdk/map`

## 0.63.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: TrafficAreaAnalyticsModule names its settings as the other modules do, so its config and knob ids change
  - `metricConfig` is `metrics`, and its knob ids `metrics.<metric>.*`
  - a colour stops' `valueType` is `scaleMode`, taking the height's values: `'predefinedRange'`, `'currentRange'` and `'raw'`; `AreaAnalyticsValueType` is `AreaAnalyticsScaleMode`
  - `regionPolygon` takes `fill: { opacity }`, `line: { opacity, width }` and `fillStyle: 'filled' | 'inverted'` in place of `fillOpacity`, `outlineOpacity`, `outlineWidth` and `inverted`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: whole base-map layer groups are `BaseMapModule`'s alone; the StylingModule knobs `basemap.<group>`, `buildings.footprints`, `buildings.3d` and `roads.shields` are gone
  - map: show or hide a group with `baseMap.setVisible(visible, { layerGroups: { show: 'only', values: ['buildings3D'] } })`, or `setKnob(baseMap, baseMapKnobCatalogue, 'groups.buildings3D.visible', true)`
  - map: the `data-viz`, `night-driving` and `minimal` presets no longer show or hide the building groups and the road shields
  - agent-toolkit: the `toggleTilesBaseMapLayerGroups` tool shows and hides whole groups, or the whole base map, and reports which groups are hidden; `setMapStyling` no longer takes the group knobs

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: TrafficFlowModule and TrafficIncidentsModule `filters` is one filter, its fields set directly, and `any` adds the further filters a feature may match instead: `filters: { any: [{ roadCategories }] }` becomes `filters: { roadCategories }`, and the knob ids drop `any.0` (`filters.roadCategories.values`). Flow's `showRoadClosures` is `roadClosures`. `TrafficFlowFilters` and `TrafficIncidentsFilters` are `FiltersWithAlternatives` of their one filter. BaseMapModule `layerGroups` take the `{ show: 'only' | 'all-except', values }` filter POIs and traffic use, instead of `{ mode: 'include' | 'exclude', names }`.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: **Breaking:** `GeometriesModule` takes MapLibre border overrides only through `layers.line`
  - **Breaking:** `line.layer` is removed; move its `paint` and `layout` to `layers: { line }`, which takes precedence over the curated `line` fields where `line.layer` sat under them

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the TrafficIncidentDetailsModule `focus` setting is `highlight`, the look of a focused, hovered or clicked incident; `setFocus` and the `focused` state keep their names
  - map: `IncidentFocusStyle` is `IncidentHighlightConfig`, the knob ids `focus.outlineColor` and `focus.widthFactor` are `highlight.outlineColor` and `highlight.widthFactor`
  - map: the `layers.focusHalo` override is `layers.highlightHalo`, and the layer id suffix `-focus-halo` is `-highlight-halo`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `setKnob`, `getKnob` and `resetKnob` set, read and reset a knob by id on every module, `StylingFoundationsModule` included, which loses its own `set`, `get` and `reset`
  - `styling.set(id, value)` is `setKnob(styling, stylingFoundationsKnobCatalogue, id, value)`, `styling.get(id)` is `getKnob(styling, stylingFoundationsKnobCatalogue, id)`, `styling.reset(id)` is `resetKnob(styling, stylingFoundationsKnobCatalogue, id)`, and `styling.reset()` is `styling.resetConfig()`
  - `getKnob(module, catalogue, id)` returns the value in force, or the catalogue default where the configuration sets none
  - `resetKnob(module, catalogue, id)` drops the knob from the configuration, so a `setKnob` then a `resetKnob` leaves `getConfig()` as it was
  - `KnobTarget` types what the three functions take, for a control panel written once for any module

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a knob's range is read from its catalogue with `knobEntryOf(catalogue, id)`, and the `*_RANGE` constants that repeated it are no longer exported
  - `ROUTE_WIDTH_FACTOR_RANGE`, `ROUTE_WAYPOINT_SIZE_FACTOR_RANGE`, `ROUTE_WAYPOINT_HIGHLIGHT_SIZE_FACTOR_RANGE`, `SECTION_ICON_SIZE_FACTOR_RANGE` and `ROUTE_HIGHLIGHT_OUTLINE_WIDTH_FACTOR_RANGE` are `knobEntryOf(routingKnobCatalogue, id).range`
  - `INCIDENT_FOCUS_WIDTH_FACTOR_RANGE` is `knobEntryOf(trafficIncidentDetailsKnobCatalogue, 'highlight.widthFactor').range`
  - **Breaking:** the undocumented route layer colours, widths and size helpers, such as `ROUTE_LINE_FOREGROUND_COLOR` and `getWaypointIconSize`, are no longer exported; `SELECTED_ROUTE_FILTER` and `DESELECTED_ROUTE_FILTER` stay
  - `knobEntryOf` throws an `Error` naming an id its catalogue lacks

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: every label names its content `title` and its look with the shared label fields, in a `label` object. PlacesModule `connections.label` takes `{ title, color, haloColor }` instead of a function beside `textColor` and `haloColor`, and the cluster badge's `textColor` and `textSize` move to `badge.label.color` and `badge.label.size`. RoutingModule `countryCrossings.textColor` is `countryCrossings.label.color`. GeometriesModule `label.text` and `lineLabel.text` are `title`. ReachableRangesModule `title` moves to `label.title`, and `palette` to `fill.palette`. The knob ids follow.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `StylingFoundationsModule` keeps the foundations of the look (label, symbol and road sizes, the map colours and the accent, projection and sky), and every other look knob moves to the module drawing those layers
  - map: the POI knobs are `POIsModule`'s: `pois.sizeFactor`, `pois.minZoom` and `pois.zoomShift` are `sizeFactor`, `minZoom` and `zoomShift`; `pois.labelColor` and `pois.labelOutlineColor` are `label.color` and `label.haloColor`; `pois.microMarkers` is `microMarkers.visible`, in `poisKnobCatalogue` and `POIsModuleConfig`
  - map: the traffic knobs are `TrafficFlowModule`'s and `TrafficIncidentsModule`'s: `traffic.flow.<level>Color` is `colors.<level>` (`colors.slow`, …), `traffic.incidents.<magnitude>Color` is `colors.<magnitude>`, and each module has its own `widthFactor`
  - map: the hillshade knobs are `TerrainModule`'s, under the same `hillshade.*` ids in `terrainKnobCatalogue` and `TerrainModuleConfig`
  - map: the road markings are `BaseMapModule`'s: `roads.exitNumbers`, `roads.arrows`, `roads.restricted` and `roads.underConstruction` are `roads.<part>.visible` in `baseMapKnobCatalogue`, set in `BaseMapModuleConfig` as `roads: { exitNumbers: { visible: false } }`
  - map: the knobs still compose across modules on one layer (`labels.sizeFactor` and the POIs' `sizeFactor` multiply on the POI labels) and survive a style switch
  - map: `getStyleColor(map, id)` reads the colour a style colour knob is at by its map-wide id (`'traffic.incidents.colors.major'`, `'pois.label.color'`, `'colors.water'`), with `styleColorKnobIds` listing them; `StylingColorKnobId` is `StyleColorKnobId`, joined by `StyleKnobId` and `StyleKnobValueOf`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the undocumented internals `mapDisplayPoiCategoryMappings`, `toBaseMapPOICategory`, `toBaseMapPOIGroup`, `baseMapPOICategoryValues`, `sharedInstanceIfCreated` and `SymbolLayerSpecWithoutSource` are no longer exported; `MapStylePOICategory` stays

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: presets are the map's, not `StylingFoundationsModule`'s: `styling.applyPreset(id)` is `await applyMapPreset(map, id)`, which sets the StylingFoundations, BaseMap and POIs knobs each preset names
  - map: `stylingPresetIds`, `stylingPresetCatalogue`, `StylingPresetId` and `StylingPreset` are `mapPresetIds`, `mapPresetCatalogue`, `MapPresetId` and `MapPreset`, with `MapPresetSettings` giving each module's values by its own catalogue ids
  - map: `applyMapPreset` creates the modules the map lacks, takes `{ merge: true }` as before, and throws an `Error` for an unknown id

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: RoutingModule's `waypointSize` and `waypointSizeFactor` move into `waypoints` as `size` and `sizeFactor`, beside every other waypoint setting; the knob ids are `waypoints.size` and `waypoints.sizeFactor`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `StylingModule` is `StylingFoundationsModule`, the name of what it holds now that every other module styles its own layers
  - map: its types and catalogue follow: `StylingFoundationsModuleConfig`, `StylingFoundationsEvents`, `StylingFoundationsKnob`, `StylingFoundationsKnobId`, `StylingFoundationsKnobKind`, `StylingFoundationsKnobRange`, `StylingFoundationsKnobValue`, `StylingFoundationsKnobValueOf`, `StylingFoundationsKnobAppliesTo`, `stylingFoundationsKnobCatalogue`, `stylingFoundationsKnobIds`, `stylingFoundationsKnobKinds` and `stylingFoundationsKnobAppliesTo`
  - agent-toolkit: the base-map state's `getStylingModule()` is `getStylingFoundationsModule()`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `StylingSettings` is `StylingFoundationsModuleConfig`, the name every other module gives its configuration

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: every show-or-hide setting is a `visible` flag, so TerrainModule nests its settings and Places' EV availability drops `enabled`
  - `TerrainModule` takes `{ hillshade: { visible }, elevation: { visible, exaggeration } }`; its knob ids are `hillshade.visible`, `elevation.visible` and `elevation.exaggeration`
  - `terrain.setElevationEnabled` and `isElevationEnabled` are `setElevationVisible` and `isElevationVisible`
  - `PlacesModule`'s `evAvailability.enabled` is `evAvailability.visible`, in the config and as a knob id

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `routingKnobCatalogue` publishes the rest of the waypoint label: `waypoints.label.size`, `waypoints.label.haloWidth`, `waypoints.label.opacity` and `waypoints.label.font`, so `RoutingKnob` takes the `enums` kind. Every module's label size and halo width knobs share one range, 6 to 48 and 0 to 10 pixels, widening the places ones.

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TrafficAreaAnalyticsModule` colour stops given out of order or sharing a value still paint the cells
  - Each such ramp made MapLibre reject the layer's colour, as did any ramp under `relativeToActualRangePCT` once the loaded data had one value only
  - Stops are sorted, and of stops sharing a value the last given wins

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Built on the refreshed toolchain (`vite` 8.3.2, `rolldown` 1.2.12, Biome 2.5.15); the runtime and peer dependencies are unchanged

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: every route section icon now wins its space over the map's labels by default, and the speed limit signs give way to all of them
  - map: the tunnel sign and the icons a generated section type asks for (`sections.<type>.icon`) sit above the map's labels, just under the other route icons, instead of under the labels
  - map: under the default `sign.priority`, `belowRouteIcons`, the speed limit signs give way to every route icon, section icons included, and still take precedence over the map's labels
  - map: the speed limit signs draw a tenth smaller, 0.45 to 0.63 from zoom 10 to 16, with their number scaled to match

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `sectionSupportsKnob(type, knob)` narrows `type` to `SectionTypeWithKnob<KNOB>`, the section types that take that knob, so a `` `sections.${type}.sign.minZoom` `` id built from it type-checks as a `RoutingKnobId`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: two `get()` calls at once on a style-owned module whose part the style lacks, such as `TrafficIncidentsModule`, add that part to the style once
  - Each call found the part missing while the first one's style was still loading, so the second asked for the part twice, which the style service rejects

## 0.62.3

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: a module layer anchored below a layer the style lacks, such as `lowestBuilding` on Satellite, is drawn on top of the map instead of not at all
  - Traffic Area Analytics cells with such a `beforeLayerConfig`
  - Custom GeoJSON layers with such a `beforeID`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: routes, places, geometries and every other data-owned module stay drawn through a `setStyle` that carries state, instead of disappearing for the first frames of the new style
  - Their layers are kept through the switch and take on the new style's look in place
  - A clean switch (`resetState: true`) still removes them along with the old style

## 0.62.2

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `getShown()` on `TrafficIncidentsModule`, `TrafficFlowModule` and `POIsModule` leaves out what `setVisible(false)` just hid
  - MapLibre still returned a hidden layer's icons until its next symbol placement, a few frames later, so a `getShown()` right after hiding listed incidents or POIs no longer drawn

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: override any MapLibre property of the layers `GeometriesModule`, `ReachableRangesModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule` draw, through a `layers` config merged over their defaults, as `PlacesModule` and `RoutingModule` already take
  - `styling.layers.query` takes the layers of the other style-owned modules as a `group`: `pois`, `trafficFlow`, `trafficIncidents` and `hillshade` (`styleModuleLayerGroupNames`)
  - `styling.layers` and the styling knobs reach only the loaded style's own layers, never the layers a module adds on top of it
  - `GeometriesModule`'s `line.layer` is deprecated in favour of `layers.line`, which takes precedence over the curated `line` fields instead of sitting under them
  - `TrafficAreaAnalyticsModule` keeps the cells within both a metric filter's `min` and its `max`, where it kept the cells within either

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: draw the map's own POIs of a category with an icon of your own, through `POIsModule`'s `icon.categoryIcons`
  - A `PlacesModule` `categoryIcons` entry also reaches the places of its map category: `RESTAURANT` reaches a searched `ITALIAN_RESTAURANT`, so one list restyles the map's POIs and the places you show alike

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core: the route progress helpers place distances and times between `progress` entries by the line's length, so a position stepped a fixed distance at a time moves at a steady speed
  - They shared the gap between two of the route's sparse entries by vertex count, so positions ran behind in bends, where vertices crowd, and ahead on straights. A fly-over along a mountain route sped up and slowed down by up to five times
  - Covers `getCoordinateAtRouteProgress`, `calculateProgressAtRoutePoint`, `getRouteProgressBetween`, `getRouteProgressForSection` and `getProgressAtNearestRoutePoint`; on a winding route, values between entries can move by a couple of kilometres or minutes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `StylingModule` knobs carried across `setStyle` land on the new style's first frame, instead of fading in from its own colours over the style's `transition` (300 ms by default)
  - Knobs set once the style has drawn keep the style's transition

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: style a route's waypoint pins per role, letter or hide the stop numbers, set the labels and the hover growth, and give pins icons of your own or a POI category pin per stop.
  
  - `RoutingModuleConfig.waypoints` takes `icon.start`, `icon.middle` and `icon.finish` (a `style` and an `image` each, over `icon.style`), `icon.customIcons`, `icon.mapping` (the `IconMapping` places take), `stopNumbering` (`'numbers'`, `'letters'` or `'none'`), `label.visible`, `label.title` and `highlight.sizeFactor`.
  - `routingKnobCatalogue` lists the new plain settings; `buildWaypointTitle` is exported, and handlers on `events.waypoints` receive the stop's mark as `stopDisplayLabel`.
  - A waypoint setting changed through `applyConfig` now reaches the waypoints already shown, which keep their ids and event states, and the pins repaint when the map's accent changes.
  - Once a handler covers the waypoints, a hovered or clicked pin grows 1.2 times with its stop mark; `waypoints.highlight.sizeFactor: 1` keeps the old look.
  - The stop mark sits in the centre of its pin's head at every waypoint size and zoom; it used to sink towards the pin's point on large pins.
  - `PlacesModule`: an `icon.mapping` that returns `undefined` keeps the place's own icon, and a custom `icon.default.image` replaced at runtime now shows.
  - New example: `route-waypoints-playground`.

## 0.62.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: an icon a route posts where a section starts gives way to the waypoint icon on that point, instead of drawing flush against it
  - Covers the speed limit, tunnel and closed-to-vehicles signs, and the ferry, toll-road and traffic icons.
  - The room follows the waypoint icon's `icon-anchor`, so a `layers.waypoints.routeWaypointSymbol` override is honoured.

## 0.62.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: **Breaking:** `TrafficAreaAnalyticsModule` colours each metric from a named `palette` or its own `colorStops`, set with `setPalette` and `setColorStops`, and a raw height takes `metersPerUnit`
  
  - map: **Breaking:** `AreaAnalyticsColorTheme` is `AreaAnalyticsPalette`, and `areaAnalyticsPalettes` lists its names. Rename the type
  - map: **Breaking:** `AreaAnalyticsMetricConfig.color` is gone: a palette name goes in `palette`, colour stops in `colorStops`, which wins when both are set, and with neither a metric draws `trafficLight`. Migrate `color: 'heat'` to `palette: 'heat'` and `color: { valueType, stops }` to `colorStops: { valueType, stops }`
  - map: **Breaking:** `setColor` is gone: `setPalette(palette, metrics?)` and `setColorStops(colorStops, metrics?)` each set their own field, and `undefined` clears it. Migrate `setColor('heat')` to `setPalette('heat')` and `setColor({ valueType, stops })` to `setColorStops({ valueType, stops })`
  - map: **Breaking:** the config keeps a palette as its name, so `getConfig().metricConfig.speed.palette` reads `'heat'` where `color` read the stops `setColor('heat')` expanded it to, and `AREA_ANALYTICS_DEFAULTS` gives each metric `palette: 'trafficLight'` instead of colour stops. Read a palette's stops with `resolveColorStops(metric, metricConfig)`, which takes the metric and its config instead of a theme or stops
  - map: **Breaking:** a palette on `networkLength` spans the loaded range, as its default colours do, instead of 0 to 5,000 m. Set `colorStops` with `valueType: 'relativeToPredefinedRangePCT'` to keep the fixed range
  - map: **Breaking:** the raw height's `scaleFactor` is `metersPerUnit`, the metres of height per unit of the metric. Migrate `setHeight({ scaleMode: 'raw', scaleFactor: 10 })` to `setHeight({ scaleMode: 'raw', metersPerUnit: 10 })`
  - map: **Breaking:** in `trafficAreaAnalyticsKnobCatalogue`, `metricConfig.<metric>.color` is `metricConfig.<metric>.palette`, an `enum` knob over `areaAnalyticsPalettes` that defaults to `trafficLight`, and `metricConfig.<metric>.height.scaleFactor` is `metricConfig.<metric>.height.metersPerUnit`. Rename the ids

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `TrafficIncidentsModule.isIconsVisible()` returns the incident icons setting, replacing `anyIconLayersVisible()`.
  
  - **Breaking:** map: `TrafficIncidentsModule.anyIconLayersVisible()` is removed. To read the icons setting, use `isIconsVisible()`; to read a layer itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')`
  - map: `TrafficIncidentsModule.isIconsVisible()` returns `icons.visible`, as the `icons.visible` knob reads, and `isVisible()` while it is unset: `true` for the icons-only `{ visible: false, icons: { visible: true } }`
  - map: `TrafficIncidentsModule.setVisible()` clears `icons.visible` in a new configuration object, leaving the one `getConfig()`, a `config-change` handler or `TrafficIncidentsModule.get()` was given untouched

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: Waypoint and place connection labels follow the map's light/dark theme like place and geometry labels, and take colour knobs of their own
  
  - `RoutingModule` waypoint labels draw dark grey text on a white halo on a light map and the two swapped on a dark one; `waypoints.label` takes a `LabelConfig`, and `waypoints.label.color` and `waypoints.label.haloColor` join `routingKnobCatalogue`
  - `PlacesModule` connections take `connections.color`, `connections.textColor` and `connections.haloColor`, all three in `placesKnobCatalogue`
  - On a dark map, connection labels and entry points take the same dark grey halo as place labels instead of a near-black one, and a connection label with a custom colour takes a lighter shade of it instead of a darker one
  - Connection labels draw in the map's regular font; they named none, so the map fetched a font TomTom styles do not serve and drew them in a local browser font

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - Breaking changes:
  - map: `TrafficIncidentOverlayModule` is `TrafficIncidentDetailsModule`, after the Traffic Incident Details service whose incidents it draws, and its config is `TrafficIncidentDetailsModuleConfig`; its sources and layers are suffixed `traffic-incident-details-N`, no longer `traffic-incident-overlay-N`
  - map: `trafficIncidentOverlayKnobCatalogue`, `trafficIncidentOverlayKnobIds`, `TrafficIncidentOverlayKnob`, `TrafficIncidentOverlayKnobId` and `TrafficIncidentOverlayKnobValueOf` follow the module: `trafficIncidentDetailsKnobCatalogue`, `trafficIncidentDetailsKnobIds`, `TrafficIncidentDetailsKnob`, `TrafficIncidentDetailsKnobId`, `TrafficIncidentDetailsKnobValueOf`
  - map: `StyleModule` is `StylePart` and `styleModules` is `styleParts`, so a part of the style no longer shares its name with the map modules: `include: StyleModule[]` → `include: StylePart[]`
  - map: the `'hillshade'` style part is `'terrain'`, the elevation data both the hillshade and 3D terrain draw from: `include: ['hillshade']` → `include: ['terrain']`
  - map: `TomTomMap.getStyle()` is `getStyleInput()`, as it returns the `StyleInput` the map was given and not the style specification MapLibre's `getStyle()` returns
  - map: `POIsModule.getShown()` returns `{ pois }`, no longer `{ poi }`, and the module's source key is `pois` too

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: every module setting changes through `applyConfig`, `updateConfig` or `setKnob`; the setters that changed one setting are removed.
  
  - **Breaking:** map: `places.applyMarkerType(type)`, `applyIconConfig(icon)`, `applyLabelConfig(label)`, `applyExtraFeatureProps(props)` are removed: use `places.updateConfig({ markerType, icon, label, extraFeatureProps })`
  - **Breaking:** map: `geometries.applyLabelConfig(label)` is removed: use `geometries.updateConfig({ label })`
  - **Breaking:** map: `moveBeforeLayer(target)` on `GeometriesModule`, `TrafficIncidentOverlayModule` and `TrafficAreaAnalyticsModule` is removed: use `updateConfig({ beforeLayerConfig: target })`. A part a `beforeLayerConfig` record leaves out goes back to its default position
  - **Breaking:** map: `trafficFlow.filter(filters)` and `trafficIncidents.filter(filters)` are removed: use `updateConfig({ filters })`, and `updateConfig({ filters: undefined })` to clear
  - **Breaking:** map: `pois.filterCategories(filter)` is removed: use `pois.updateConfig({ filters: { categories: filter } })`
  - **Breaking:** map: `terrain.setElevationExaggeration(value)` is removed: use `terrain.updateConfig({ elevationExaggeration: value })`
  - **Breaking:** map: `analytics.setMode(mode)`, `setMetric(metric)` and the `mode` getter are removed: use `analytics.updateConfig({ displayMode: mode })`, `updateConfig({ activeMetric: metric })` and `getConfig()?.displayMode`
  - **Breaking:** map: `analytics.filter(filters, metrics)` is `setFilters(filters, metrics)`, and `clearFilter(metrics)` is `setFilters(undefined, metrics)`
  - map: `PlacesModule.applyConfig` and `updateConfig` take the place shape, so `label.title`, `extraFeatureProps` and the icon mapping read your own place properties typed
  - map: a `GeometriesModule` config change that only moves or hides layers keeps the shown geometries instead of preparing them again, and `TrafficAreaAnalyticsModule` masks its region again only when `regionPolygon.inverted` changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: **Breaking:** `ReachableRangesModule` draws `calculateReachableRanges` results in colours from the map, and a geometry `fill.palette` is a list of your own CSS colours instead of a palette name
  
  - map: `ReachableRangesModule.create(map, config?)` and `show(ranges)` draw reachable ranges as returned: each band titled from its budget, each origin's bands nested around it, several origins in one `show`, and the `'filled'`, `'outline'` and `'inverted'` fill styles
  - map: without a `palette`, the bands ramp from the map's accent toward its land colour, reversed for `'inverted'`, and repaint when either changes, such as on `StylingModule.setMapColors(deriveMapColors(…))`. On a map no theme has coloured, the ramp runs between the style's light or dark defaults and follows a switch. `palette` takes your own colours, innermost band first
  - map: a geometries `lineLabel` set after `create`, such as through `setKnob` or `updateConfig`, draws the border labels, which it only did when given at `create`
  - map: `reachableRangesKnobCatalogue`, `reachableRangesKnobIds`, `ReachableRangesKnob`, `ReachableRangesKnobId` and `ReachableRangesKnobValueOf` publish its settings as data; `ReachableRangesModuleConfig` and `ReachableRangesModuleSerializableConfig` type its configuration
  - map: `AbstractGeometriesModule` is the base `GeometriesModule` and `ReachableRangesModule` share
  - map: **Breaking:** `reachableRangeGeometryConfig`, `ReachableRangeGeometryConfigOptions`, `prepareReachableRangesForDisplay`, `buildReachableRangeFeatures` and `ReachableRangesDisplayOptions` are gone. Migrate `GeometriesModule.create(map, reachableRangeGeometryConfig({ fillStyle, title }))` to `ReachableRangesModule.create(map, { fillStyle, title })`, and show the ranges unprepared
  - map: **Breaking:** `colorPalettes`, `colorPaletteIDs` and `ColorPaletteOptions` are gone, and `fill.palette` and the `palette` option of `fillStyledGeometryConfig` take `string[]`. Migrate `palette: 'warm'` to a list of colours, such as ones from the map-theme plugin's `deriveMapColors`; the colours are drawn as given on dark styles too
  - map: **Breaking:** `fillStyledGeometryConfig()` without a `palette` draws every feature in one colour, the map's accent or the default, instead of `fadedRainbow`
  - map: **Breaking:** the `fill.palette` knob of `geometriesKnobCatalogue` is of kind `colors` instead of `enum`
  - **Breaking:** services: `budgetTypes`, `BudgetType` and `ReachableRangeBudget` move to core. Migrate `import { type BudgetType } from '@tomtom-org/maps-sdk/services'` to `import { type BudgetType } from '@tomtom-org/maps-sdk/core'`
  - core: `budgetUnits` maps each budget type to the unit it counts in, the one the range titles print: `min`, `km`, `% remaining`, `% spent`, `L`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: hover and click states survive a style change on every data-owned module, and a user event moves a state your code put.
  
  - map: the hover and click states of shown features survive a style change on `GeometriesModule`, `CustomGeoJSONModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule`, and a `GeometriesModule` geometry keeps its id
  - map: a `TrafficAreaAnalyticsModule` style change no longer emits `shown-features`, as on the other modules
  - map: a user click, right click or hover moves its state off a feature that `putEventState` gave it, instead of leaving two features clicked or hovered at once; a click takes `click` and `contextmenu` off the other features of its source, a hover takes `hover`, `hover-move` and `long-hover`
  - map: an event state no longer writes into the feature objects you passed to `show`; `getShown()` returns a new collection after each state change
  - map: a `PlacesModule` hover, click or `putEventState` after a configuration change keeps the titles, icons and properties that change set, instead of drawing the earlier ones again

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: every data-owned module reads and writes the event states of the features it shows — `putEventState`, `cleanEventState`, `cleanEventStates` and `getEventStates`.
  
  - map: `PlacesModule`, `RoutingModule`, `GeometriesModule`, `CustomGeoJSONModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule` act on the main features their `getShown()` returns; `getEventStates()` reads back the ids by event state, what user interactions put as well as yours, as the new `EventStateIds` type
  - map: the named scopes of those modules — `routing.events.waypoints`, `places.events.entryPoints`, `custom.events.<sourceName>`, … — are the new `UserEventsWithStates`, with the same four methods for their own features, so ids that repeat across sources never collide
  - map: `PutEventStateOptions.id` and `CleanEventStateOptions.id` take a number as well as a string, matching a feature's `properties.id`, else its top-level `id`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: hovered and clicked routes, geometries and traffic incidents stand out by default; routes and geometries take how much from `highlight` factors, also knobs.
  
  - map: a hovered or clicked route draws a wider outline, selected or not, in its outline colour, `highlight.outlineWidthFactor` times: 1.2 unless set, clamped to `ROUTE_HIGHLIGHT_OUTLINE_WIDTH_FACTOR_RANGE` (1 to 1.25) so a section halo stays in sight, and a knob in `routingKnobCatalogue`; a `layers.mainLines.routeOutline` or `routeDeselectedOutline` line width you give is drawn as given
  - map: a hovered or clicked geometry draws a denser fill and a wider border, in its own colours, `highlight.fillOpacityFactor` (2, 1 to 4, at most opaque) and `highlight.lineWidthFactor` (1.75, 1 to 3) times the opacity and width in force, a configured `fill.opacity` or `line.width` included; both are knobs in `geometriesKnobCatalogue`, and a `line.layer` line width is drawn as given
  - map: a hovered or clicked `TrafficIncidentDetailsModule` incident draws the focus treatment `setFocus` draws, configured by the same `focus` config; `focus: false` turns it off for focused, hovered and clicked incidents alike

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `PlacesModule` takes a `beforeLayerConfig` (`PlacesBeforeLayerConfig`), placing its layers in the map's layer stack as one or per part
  - The parts are `places`, for the markers, clusters and entry points, and `connections`, for the connection lines; `all` covers the parts a record leaves out
  - `applyConfig` and `updateConfig` restack the layers, a style change keeps them there and `resetConfig` puts them back. Unconfigured, the layer order is unchanged

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `StylingModule` warns about a knob that matches no layer of the loaded style when that knob is set, as documented, instead of warning for every such knob as soon as the module loads (eight warnings on `satellite` before any `set`).

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: a `CustomImage.image` given as an SVG data URI (`data:image/svg+xml;…`) is drawn, instead of failing to decode and leaving places, waypoints and incidents without their icon.

## 0.61.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** services: `discoverPlaces` replaces `alongRouteSearch`, and the search response and wire-format types are not exported.
  
  - **Breaking:** services: `alongRouteSearch` is not exported; `discoverPlaces` takes the same params and searches along the route whenever they carry `route`: `alongRouteSearch({ route, maxDetourTimeSeconds, query, filters, sortBy, limit })` → `discoverPlaces({ route, maxDetourTimeSeconds, query, filters, sortBy, limit })`. It resolves to a `DiscoverPlacesResponse`
  - **Breaking:** services: the response types of the three searches `discoverPlaces` runs are not exported: `AlongRouteSearchResponse`, `FuzzySearchResponse` and `GeometrySearchResponse` → `DiscoverPlacesResponse`, `GeometrySearchFeatureCollectionProps` → `SearchSummary`
  - **Breaking:** services: their wire-format types are not exported either, with no replacement: `AlongRouteSearchRequestAPI`, `AlongRouteSearchPayloadAPI`, `AlongRouteSearchResponseAPI`, `AlongRouteSearchResultAPI`, `RoutePointAPI`, `FuzzySearchResponseAPI`, `FuzzySearchResultAPI`, `QueryIntentAPI`, `CoordinateIntentAPI`, `CoordinateIntentDetailsAPI`, `NearbyIntentAPI`, `NearbyIntentDetailsAPI`, `GeometrySearchRequestAPI`, `GeometrySearchPayloadAPI`, `GeometrySearchResponseAPI`, `GeometrySearchResultAPI`, `GeometryAPI`, `PolygonAPI` and `CircleAPI`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `EVAvailabilityConfig.threshold` defaults to `0.3` for the availability label colour as well as the pin icon, instead of `0` for the label, which drew every station's label green, one with no free charging point included. Set `threshold: 0` to keep the old label colour

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `GeometriesModule` text config is label config, and the geometry config helpers take one options object.
  
  - **Breaking:** map: `GeometriesModule.applyTextConfig()` is `applyLabelConfig()`, after the `label` it sets: `geometries.applyTextConfig({ text })` → `geometries.applyLabelConfig({ text })`
  - **Breaking:** map: `GeometryLabel` is `GeometryLabelConfig` and `GeometryLineLabel` is `GeometryLineLabelConfig`, like `GeometryFillConfig` and `GeometryLineConfig`
  - **Breaking:** map: `fillStyledGeometryConfig` takes one options object: `fillStyledGeometryConfig('retro', 'top')` → `fillStyledGeometryConfig({ palette: 'retro', beforeLayerConfig: 'top' })`
  - **Breaking:** map: `reachableRangeGeometryConfig` takes one options object, and its label function is `title`: `reachableRangeGeometryConfig('cold', 'inverted', 'top', fn)` → `reachableRangeGeometryConfig({ palette: 'cold', fillStyle: 'inverted', beforeLayerConfig: 'top', title: fn })`
  - **Breaking:** map: `prepareReachableRangesForDisplay` takes its fill style and title function in an options object: `prepareReachableRangesForDisplay(result, 'inverted', fn)` → `prepareReachableRangesForDisplay(result, { fillStyle: 'inverted', title: fn })`; `ReachableRangeLabelFn` is `ReachableRangeTitleFn`
  - map: `GeometryLineLabelConfig.text` sets the text of the border labels, a string or a MapLibre expression, as `label.text` does for the center labels; both default to the feature's `title`
  - map: `GeometryLabelConfig.text` is optional, so `label: { size: 18 }` restyles the center labels without restating their text
  - map: `FillStyledGeometryConfigOptions`, `ReachableRangeGeometryConfigOptions` and `ReachableRangesDisplayOptions` name the options objects

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a `GeometriesModule` palette name moves from `fill.color` to the new `fill.palette`.
  
  - **Breaking:** map: `GeometryFillConfig.color` takes a colour or a MapLibre expression; a palette name goes in `fill.palette`. Migrate `fill: { color: 'warm' }` to `fill: { palette: 'warm' }`
  - map: `GeometryFillConfig.palette` gives each `GeometriesModule` feature the next colour of a named palette, on the fill and on a border without its own `line.color`. It sits between `fill.color`, which wins over it, and the top-level `color`; `fillStyledGeometryConfig` and `reachableRangeGeometryConfig` set it, and once it is set an accent change leaves the geometries as they are

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** core: the geopolitical view is set once in `TomTomConfig`, and `View` / `view` are renamed `GeopoliticalView` / `geopoliticalView`.
  
  - **Breaking:** core: `View` is renamed `GeopoliticalView`, and `views` is renamed `geopoliticalViews`
  - **Breaking:** services: the `view` parameter of search, suggestions, geocoding, reverse geocoding and place details is renamed `geopoliticalView`. Migrate `discoverPlaces({ query, view: 'IN' })` to `discoverPlaces({ query, geopoliticalView: 'IN' })`; the request still sends the API's own parameter
  - core: `TomTomConfig.instance.put({ geopoliticalView })` sets the geopolitical view for the map and every service; a map's or a call's own `geopoliticalView` overrides it
  - core: `geopoliticalViews` lists all 20 geopolitical views the TomTom APIs serve, adding `AE`, `BN`, `CL`, `DZ`, `KR`, `MY`, `PH`, `US` and `VN`
  - map: the map draws the borders and names of disputed territories in the configured view, and `TomTomMap.setGeopoliticalView` switches it at runtime, reloading only the visible vector tiles
  - services: a view an API does not serve is left out of its requests, which then use the default view of the caller's country, instead of failing
  - services: `getSearchSuggestions` uses the global geopolitical view when the call sets none

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: the knob catalogues gain `enums`, `offset` and `text` knobs, and hold the POI, traffic and routing filters and unit labels.
  
  - **Breaking:** map: `KnobKind` gains `enums`, a list of options, `offset`, an `[x, y]` screen displacement within a `range`, and `text`, any string, so an exhaustive `switch` over `KnobKind` or `KnobEntry['kind']` needs a case for each
  - **Breaking:** map: `POICategoryGroup` is the union of the `poiCategoryGroups` names, `'FOOD_DRINKS_GROUP' | 'TRANSPORTATION_GROUP' | …`, no longer `string`, so `FilterablePOICategory` and `filterCategories` reject a name that is no group or category
  - **Breaking:** map: every module's `…KnobValueOf<ID>` is the plain value at the knob's path, without the expressions and objects the config also takes there. The one id this narrows is `metricConfig.<metric>.color`: `TrafficAreaAnalyticsKnobValueOf` gives `AreaAnalyticsColorTheme` alone; type custom colour stops as `AreaAnalyticsColorStopsConfig`
  - map: `poisKnobCatalogue` holds the category filter: `filters.categories.show` (`only` or `all-except`) and `filters.categories.values`, an `enums` knob over the category groups, then every `MapStylePOICategory`
  - map: `trafficFlowKnobCatalogue` and `trafficIncidentsKnobCatalogue` hold the first `filters.any` alternative: road categories and subcategories, road closures on flow, and incident categories, magnitudes and delays on incidents
  - map: a POI category or traffic values filter missing `show` or `values` filters nothing until the other is set, instead of throwing, so the two knobs can be set one at a time
  - map: `trafficAreaAnalyticsKnobCatalogue` holds `regionPolygon.outlineWidth` and each metric's `height.maxHeightMeters`, `height.minHeightMeters` and `height.scaleFactor`
  - map: `routingKnobCatalogue` holds the unit labels, `displayUnits.distance.*` and `displayUnits.time.*`, as `text` knobs
  - map: a `RoutingModule` `displayUnits` that leaves `distance.type` unset posts the speed limit signs in the global config's unit system, as the summary bubbles already do, so relabelling one unit keeps the global unit system everywhere

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `validateKnobValue` and `setKnob` check and set knob values, and `KnobRange` requires `bounds`.
  
  - **Breaking:** map: `KnobRange` requires `bounds`, which ends a value must keep to: `hard` both, `hard-min` only `min`, `soft` neither, so a range you declare yourself needs one
  - map: `validateKnobValue(entry, value)` checks a value against a knob's kind, range, options or colour syntax, and throws a `RangeError` naming the knob and what it expects
  - map: `setKnob(module, catalogue, id, value)` validates a value, then applies the module's config with it at the knob's path, keeping every other setting; the value is typed from the path
  - map: `StylingModule.set` and `setMapColors` check values with `validateKnobValue`, so their messages match every other module's
  - map: the traffic heights, height scale factor, outline width, delay minutes and area analytics filters, and the geometries line and halo widths, label size and symbol spacing have `hard-min` ranges; the geometries line label offset a `soft` one; opacities, factors and zooms `hard` ones

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: each module's `isVisible()` returns its `visible` setting, and `RoutingModule` gains `setVisible` and `isVisible`.
  
  - **Breaking:** map: `isVisible()` on `POIsModule`, `BaseMapModule`, `TrafficFlowModule` and `TrafficIncidentsModule` returns the `visible` setting, as the module's `visible` knob reads, instead of whether any of its layers draws; on `BaseMapModule`, the `visible`, `groups` and styling-toggle settings over the groups asked about. Until something sets it, POIs and the base map report what the style draws and the traffic modules `false`. To read a layer itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')`
  - **Breaking:** map: `TrafficIncidentsModule.isVisible()` is `false` when the incidents are set hidden with `icons: { visible: true }`. Read `anyIconLayersVisible()` for the icons
  - **Breaking:** map: `TerrainModule.isHillshadeVisible()` returns the `hillshade` setting, `false` until something sets it, instead of whether a hillshade layer draws; `isElevationEnabled()` returns the `elevation` setting and, until something sets it, whether the map's own terrain is raised. To read the map itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')` or `map.mapLibreMap.getTerrain()`
  - **Breaking:** map: `CustomGeoJSONModule.show()` no longer draws the layers of a module hidden with `setVisible(false)` or `visible: false`; data shown while hidden draws on `setVisible(true)`. Call `setVisible(true)` where a `show()` used to reveal them
  - **Breaking:** map: a subclass of `AbstractDataOwnedMapModule` implements `applyVisibility(config)`, which shows or hides what it draws for the `setVisible` and `isVisible` the base class now provides; its config type takes `visible?: boolean`. Move a module's own `setVisible` body into `applyVisibility`
  - map: `RoutingModule` takes `visible` (default `true`), with `setVisible` and `isVisible`. Hiding covers every part it draws and keeps the routes and waypoints through `showRoutes`, `showWaypoints`, `selectRoute`, the clears and style changes, and `routingKnobCatalogue` lists it as the `visible` toggle
  - map: `CustomGeoJSONModule.isVisible()` reads its `visible` setting

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `PlacesModule` and the routing charging stops take `label` instead of `text`, as `GeometriesModule` does.
  
  - **Breaking:** map: `PlacesModuleConfig.text` is `label`, like `GeometriesModuleConfig.label`: `{ text: { title, color } }` → `{ label: { title, color } }`
  - **Breaking:** map: `PlaceTextConfig` is `PlaceLabelConfig`
  - **Breaking:** map: `PlacesModule.applyTextConfig()` is `applyLabelConfig()`, as on `GeometriesModule`: `places.applyTextConfig({ color })` → `places.applyLabelConfig({ color })`
  - **Breaking:** map: `RoutingModuleConfig.chargingStops.text` is `chargingStops.label`: `{ chargingStops: { text: { title } } }` → `{ chargingStops: { label: { title } } }`; `ChargingStopTextConfig` is `ChargingStopLabelConfig`, and the routing knob `chargingStops.text.visible` is `chargingStops.label.visible`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: a `PlacesModule` theme is a marker type (`markerType`, `applyMarkerType`), and `PlacesModuleConfig.color` sets the place colours at once.
  
  - **Breaking:** map: `PlacesModuleConfig.theme` is `markerType`, with the same values: `{ theme: 'base-map' }` → `{ markerType: 'base-map' }`
  - **Breaking:** map: `PlacesModule.applyTheme()` is `applyMarkerType()`: `places.applyTheme('pin')` → `places.applyMarkerType('pin')`
  - **Breaking:** map: `PlacesTheme` is `PlacesMarkerType`, and `placesThemes` is `placesMarkerTypes`
  - map: `PlacesModuleConfig.color` sets the default pin fill, the label of a hovered or clicked place, connection lines and entry points at once. A more specific setting still wins, and once `color` is set an accent change leaves the places as they are
  - map: `PlaceLabelConfig` extends the shared `LabelConfig` and gains `opacity`, drawn as the labels' `text-opacity`
  - map: a `label.size` or `label.haloWidth` of `0` on `PlacesModule` reaches its labels instead of being ignored
  - map: a `PlacesModule` `layers.*.layout` override of `text-size`, `text-font` or `text-field` wins over `label`, as its paint overrides already did

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)! - **Breaking:** services: `getPOICategories` ranks `filters` matches and keeps each filter's best ones, so `'bar'` returns Bar.
  
  - **Breaking:** services: `getPOICategories`, and `getPOICategoryCodes` with it, ranks `filters` matches and keeps each filter's strongest ones, instead of every category whose name or synonym contains it: `'bar'` returns Bar instead of 15 categories including Nail Salon ("Nail Bar") and Toll Gate ("Toll Bar"), and a category code returns that category only
  - services: `getPOICategories` merges several `filters` round-robin, so each filter's best match comes first
  - services: `getPOICategories` `filters` fold accents, so `'cafe'` finds Café, and a blank filter matches nothing instead of every category

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `RoutingModule.getConfig()` returns the configuration as given, and a module without `displayUnits` follows the global units.
  
  - **Breaking:** map: `RoutingModule.getConfig()` returns the configuration as given: without the global `displayUnits` filled in when none were set, and `undefined` after `RoutingModule.create(map)` or `resetConfig()`. Read `TomTomConfig.instance.get().displayUnits` for the units in force when the module config has none
  - map: a `RoutingModule` without `displayUnits` labels its summaries, waypoints and speed limit signs in the global units in force when it draws them, so a later `TomTomConfig.instance.put({ displayUnits })` reaches routes already shown on their next `showRoutes` or configuration change, where the units set at creation used to stay, `updateConfig` included

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `routingKnobCatalogue` lists the `RoutingModule` display settings, and `StylingKnob` types each knob kind strictly.
  
  - **Breaking:** map: `StylingKnob` has one member per `kind`: a `factor` or `number` knob always carries its `range`, an `enum` knob its `options`, and no other kind either, so an entry built with a `range` on a `toggle` or `options` on a `color` knob no longer type-checks
  - **Breaking:** map: `KnobKind` gains `image`, a sprite image id, so an exhaustive `switch` over `KnobKind` needs a case for it
  - map: `routingKnobCatalogue` lists every plain-valued `RoutingModuleConfig` display setting, route-wide and per section type, with its kind, range or options and, where one value holds everywhere, its default; `routingKnobIds` lists the ids. `RoutingKnob` is one entry, `RoutingKnobId` a setting's path in the config, and `RoutingKnobValueOf` the value it takes
  - map: `KnobEntry` is the entry shape every catalogue shares, one member per kind, and `KnobValueOf` the value a knob of each kind holds
  - map: `SectionIconPlacement` names the placements `SectionIconConfig.placement` takes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `SectionIconConfig.sizeFactor` multiplies the size the section type draws its icon at, rather than setting it: `1` leaves it unchanged, and `ferry`, `tollRoad`, `tunnel` and `vehicleRestricted` keep their zoom ramp under any factor. A `size: 0.8` on `ferry` was a fixed `icon-size` of 0.8; `sizeFactor: 0.8` draws that size from zoom 16.5 and scales down below it

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `baseMapKnobCatalogue` and `poisKnobCatalogue` list the base map and POI settings a knob holds.
  
  - map: `baseMapKnobCatalogue` lists every `BaseMapModuleConfig` setting, `visible` and one `groups.<group>.visible` toggle per layer group, with its description; `baseMapKnobIds` lists the ids. `BaseMapKnob` is one entry, `BaseMapKnobId` a setting's path in the config, and `BaseMapKnobValueOf` the value it takes
  - map: `poisKnobCatalogue` lists the `POIsModuleConfig` settings a knob holds, `visible` with its default; `poisKnobIds` lists the ids. `POIsKnob` is one entry, `POIsKnobId` a setting's path in the config, and `POIsKnobValueOf` the value it takes
  - map: the `basemap.<group>` entries of `stylingKnobCatalogue` say what their group holds, in the words of the matching `baseMapKnobCatalogue` entry, and name its id

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: places, routes and the traffic incident overlay follow the styling knob colours live.
  
  - map: `TrafficIncidentOverlayModule` follows the `traffic.incidents.*Color` styling knobs live, set before or after it was created and across `setStyle`
  - map: `PlacesModule` with the `base-map`, `circle-icon` or `pin-clustered` marker type follows the POI label colour, outline and size knobs live; the caller's `label` and `layers` settings still win
  - map: `RoutingModule` draws a route's traffic sections in the `traffic.incidents.minorColor`, `moderateColor` and `majorColor` knob colours when they are set, live; a `layers.sections` override still wins, and with none set the colours are unchanged
  - map: `TrafficIncidentOverlayModule` draws minor jams in the style's own colour instead of the light styles' on every style, the dark ones included

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `customGeoJSONKnobCatalogue` lists the `CustomGeoJSONModuleConfig` settings a knob holds, `visible` with its default; the sources' MapLibre layers and cluster options and the images stay the caller's. `customGeoJSONKnobIds` lists the ids. `CustomGeoJSONKnob` is one entry, `CustomGeoJSONKnobId` a setting's path in the config, and `CustomGeoJSONKnobValueOf` the value it takes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TomTomMap` loads nothing from unpkg.com: neither the MapLibre stylesheet nor the RTL text plugin.
  
  - map: `TomTomMap` no longer fetches the MapLibre stylesheet from unpkg.com, which sent every end user's IP address to a third party and fired even when the app had imported `maplibre-gl.css` itself; when the page lacks the MapLibre CSS, the SDK applies a copy shipped with it as a lazy chunk — served alongside the SDK, not blocked by a strict CSP `style-src`, and in a cascade layer so the app's own CSS still wins
  - map: `TomTomMap` no longer loads the Mapbox RTL text plugin from unpkg.com either; MapLibre shapes Arabic and bidirectional text itself, so right-to-left labels render as before

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `GeometriesModule` config changes restyle the geometries already shown.
  
  - map: `GeometriesModule.applyConfig`, `updateConfig`, `resetConfig` and `applyLabelConfig` restyle the geometries already shown — colours, palette, fill style, labels and `transformFeaturesForDisplay` — instead of only the ones a later `show()` draws; a shown geometry keeps its id and event state
  - map: `GeometriesModule.applyConfig` replaces the paint of the previous config, so a config that leaves out the colour, fill, border or label, and `resetConfig()`, return them to the defaults; call `updateConfig` to change one part
  - map: a `GeometriesModule` `label.text` given as a MapLibre expression no longer becomes each geometry's `title`, which the line labels and an expression reading `['get', 'title']` drew as the expression itself; a geometry keeps its own title or address, and a literal `label.text` still sets it
  - map: a config change or a style change after `GeometriesModule.clear()` keeps the map clear, and a style change no longer emits `shown-features`, as on the other modules

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `geometriesKnobCatalogue` lists every plain-valued `GeometriesModuleConfig` display setting — colour, fill, border, center and border labels with their fonts, and the border labels' offset — with its kind, range or options and, where one value holds everywhere, its default; `geometriesKnobIds` lists the ids. `GeometriesKnob` is one entry, `GeometriesKnobId` a setting's path in the config, and `GeometriesKnobValueOf` the value it takes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core: `TimeDisplayUnits.hours` documents its real default, `hr`, which `formatDuration` uses when none is set

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TrafficIncidentOverlayModule.applyConfig` and `updateConfig` apply `focus` to the incidents already shown, instead of only after a style switch: the outline colour and width factor repaint in place, so the `focus.outlineColor` and `focus.widthFactor` knobs of `trafficIncidentOverlayKnobCatalogue` take effect when set, and `focus: false` removes the outline, which a later focus style adds back beneath the incidents

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `discoverPlaces` and the new `resolvePOICategories` take POI categories in words.
  
  - discoverPlaces: `filters.poiCategoryQuery` takes categories in words — `'sushi'`, `['gym', 'parking']` — and searches the POI categories they name, resolved in the call's language, so category words reach results in one call instead of a lookup and a search; a word nothing matches is left out, and when none matches the call rejects with `SDKError`
  - `resolvePOICategories` turns words or codes into the `poiCategories` of one search — each word's best three codes, merged round-robin and capped at the 10 a search accepts — and returns the words nothing matched in `unmatched`, for a caller who decides about them before searching; codes alone skip the catalog request

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `preparePlacesForDisplay`, what `PlacesModule.show()` does to the places it is given, is documented along with `toPlaces` and `buildPlaceTitle`, and takes `(places, config)`. The places guide shows your own GeoJSON points drawn through `show()`. `ShownPlaces` names the three places results that are not places — search suggestions, `geometryData` polygons, EV availability — and what shows each instead

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `getPlacesWithEVAvailability` takes `maxConcurrentRequests`, and its result type allows places without availability.
  
  - services: `getPlacesWithEVAvailability` takes `maxConcurrentRequests` (default 1, one request at a time as before) to send that many availability requests at once; the places keep their input order. `PlacesWithEVAvailabilityOptions` names its options
  - services: `getPlacesWithEVAvailability(places)` without options is typed as places that may lack availability, as it returns them; only `excludeIfAvailabilityUnknown: true` types every place as having it
  - services: the `discoverPlaces` docs name all three searches it runs, along-route search when `route` is given included

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `placesKnobCatalogue` lists every plain-valued `PlacesModuleConfig` display setting — marker type, colour, visibility, default pin style, label, cluster badge and source, EV availability and entry points — with its kind, range or options and, where one value holds everywhere, its default; `placesKnobIds` lists the ids. `PlacesKnob` is one entry, `PlacesKnobId` a setting's path in the config, and `PlacesKnobValueOf` the plain value it takes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `PlaceLabelConfig` says to set place labels through the module config rather than with MapLibre's `setPaintProperty` or `setLayoutProperty` on its layers, which a style change or a marker type change rebuilds from the config

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `PlacesModule` documents what a place keeps across `show()`, `clear()` and style changes — `show()` replaces and drops the event states and connections of what it replaces, even under the same id, while style and configuration changes keep both — and `getShown()` states that it returns the places as drawn, with their display properties and event states

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `PlacesModule.create<P>`, `applyLabelConfig<P>`, `applyIconConfig<P>` and `preparePlacesForDisplay<P>` type the `label.title` and `icon.mapping.fn` callbacks for the place shape `P` you name, as `extraFeatureProps` already was, so a callback reading a property of your own data no longer needs a cast

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `calculateReachableRange` and `calculateReachableRanges` return polygons whose ring ends on its first position, as GeoJSON requires; the API's boundary leaves it open, which spatial libraries such as Turf reject

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `calculateReachableRanges` rejects on a `401` like it does on a `403` or a `429`, instead of skipping the range as one the engine could not compute and returning no polygons

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - `calculateReachableRanges` says in its TSDoc that a range the service answers with an error, such as `NO_RANGE_FOUND` for an origin off the road network, is skipped rather than thrown, so the result can hold fewer polygons than requested.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: the route's instruction arrows scale with `widthFactor`, instead of keeping one size as the line around them grows or shrinks. The `width` presets draw them as before

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: the stop number inside a waypoint pin scales with the pin, so it stays in the pin's head at every `waypointSize` and `waypointSizeFactor`; the `'s'` and `'l'` presets draw it at 0.75× and 1.25×

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `PlacesModuleSerializableConfig`, `RoutingModuleSerializableConfig`, `GeometriesModuleSerializableConfig` and `CustomGeoJSONModuleSerializableConfig` type the part of each module's configuration that survives JSON, leaving out the functions and image elements those modules also take; `SerializableCustomImage` is a `CustomImage` with a string `image`. Every module's configuration, exported with `JSON.stringify(module.getConfig())` and given back to `applyConfig`, holds the same configuration and draws the same layers, and the map modules guide shows how to save and replay one

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `terrainKnobCatalogue` lists every `TerrainModuleConfig` setting — the hillshade, the 3D surface and its exaggeration — with its kind, the exaggeration's `hard-min` range (at least 0.5; above 3 still applies) and, where one value holds everywhere, its default; `terrainKnobIds` lists the ids. `TerrainKnob` is one entry, `TerrainKnobId` a setting's path in the config, and `TerrainKnobValueOf` the value it takes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `trafficFlowKnobCatalogue`, `trafficIncidentsKnobCatalogue`, `trafficIncidentOverlayKnobCatalogue` and `trafficAreaAnalyticsKnobCatalogue` list each traffic module's plain-valued settings with their kind, range or options and, where one value holds everywhere, their default; the matching `…KnobIds` arrays list the ids. `TrafficFlowKnob`, `TrafficIncidentsKnob`, `TrafficIncidentOverlayKnob` and `TrafficAreaAnalyticsKnob` are one entry each, their `…KnobId` a setting's path in the module config, and their `…KnobValueOf` the value it takes

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - security: a new guide, What the SDK sends, and where, lists what the browser sends to TomTom and to third parties, which values travel in URLs and so land in logs, and whose session cookie proxy mode carries, for a privacy notice or records of processing

## 0.60.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `GeometriesModule`'s `fill.beforeLayerConfig` and `line.beforeLayerConfig` are removed; use `beforeLayerConfig: { fill, line }` on the module config, `all` covering any part it doesn't name
  - **Breaking:** map: `GeometryBeforeLayerTargets` is removed; the record form of `GeometryBeforeLayerConfig` is `PartsBeforeLayerConfig<'fill' | 'line'>`'s
  - **Breaking:** map: `TrafficAreaAnalyticsModule`'s nested `beforeLayerConfig` shape is removed; key it by display mode instead: `hexgrid.flat2D` → `'hexgrid-2d'`, `hexgrid.extrusion3D` → `'hexgrid-3d'`, likewise for `square`, plus `all` for the rest
  - **Breaking:** map: `GeometriesModule.applyConfig` puts a part the applied config's `beforeLayerConfig` names no target for back at its default place, as a style change does — every part, when the applied config has no `beforeLayerConfig`. `moveBeforeLayer` still leaves such a part where it is
  - **Breaking:** map: `RoutingModule.getLayerToRenderLinesUnder()` returns `string | undefined`, following `beforeLayerConfig` and undefined when the route lines are on top; unconfigured, it still returns `mapStyleLayerIDs.lowestLabel`
  - map: `RoutingModule` takes a `beforeLayerConfig`: one target for the whole route, or one per part — `mainLines`, `instructionLines`, `icons` — plus `all`. `applyConfig` and `updateConfig` restack the layers, and a style change keeps them there. Unconfigured, the layer order is unchanged
  - map: `PartsBeforeLayerConfig` is the one shape every module's `beforeLayerConfig` takes: a single `BeforeLayerConfig`, or a record of the module's own part names plus `all`. `GeometryBeforeLayerConfig`, `AreaAnalyticsBeforeLayerConfig` and `RoutingBeforeLayerConfig` are built on it
  - map: `TrafficAreaAnalyticsModule.moveBeforeLayer` emits `config-change`, as `GeometriesModule` and `TrafficIncidentOverlayModule` do

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `RoutingModuleConfig.theme` and the `RouteTheme` type are removed. `theme.mainColor` → `color`, `theme.routeWidth` → `width`, `theme.waypointSize` → `waypointSize`, all top-level: `{ theme: { mainColor: '#f00', routeWidth: 'l' } }` becomes `{ color: '#f00', width: 'l' }`
  - **Breaking:** map: `SectionIconConfig.size` → `sizeFactor`, now clamped to `SECTION_ICON_SIZE_FACTOR_RANGE` (0.25–2)
  - map: `RoutingModuleConfig.widthFactor` and `waypointSizeFactor` multiply the `width` and `waypointSize` presets, and a section's `widthFactor` its own `width`; clamped to the published `ROUTE_WIDTH_FACTOR_RANGE` and `ROUTE_WAYPOINT_SIZE_FACTOR_RANGE` (0.5–2). The presets draw the sizes they did

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: the `ChargingModel.batteryCurve` reference says a route with charging stops needs it; the service rejects such a request without one

## 0.59.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `TrafficAreaAnalyticsModule.applyConfig` replaces the configuration instead of merging into it: what it leaves out, including each metric its `metricConfig` leaves out and each layer its `beforeLayerConfig` leaves out, goes back to the default. Merge with `updateConfig`, and change one metric with `setColor`, `setHeight` or `filter` given that metric (`setColor('heat', ['speed'])`)

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `BaseMapModuleConfig.layerGroupsVisibility` and the `BaseMapLayerGroupsVisibility` type are removed; use `groups`, which keeps a visibility per layer group:
    - `layerGroupsVisibility: { mode: 'include', names: ['water', 'ferries'], visible: false }` becomes `groups: { water: { visible: false }, ferries: { visible: false } }`
    - `layerGroupsVisibility: { mode: 'exclude', names: ['land', 'roads'], visible: false }` becomes `visible: false, groups: { land: {}, roads: {} }` — an entry without `visible` draws its group as the style ships it
  - **Breaking:** map: `BaseMapModule.getConfig()` and its `config-change` event carry `groups`, one entry per group `setVisible` has set
  - **Breaking:** map: `BaseMapModule.applyConfig` replaces the configuration instead of merging into it: groups the new configuration leaves out go back to how the style ships them. Merge with `updateConfig`
  - **Breaking:** map: `BaseMapModule.resetConfig` puts every base-map layer back to how the style ships it, instead of leaving hidden groups hidden, or showing every layer, those the style ships hidden included, when the whole base map was hidden
  - **Breaking:** map: the `basemap.roadShields` styling knob is removed; use `roads.shields`, which now toggles the whole `roadShields` group
  - map: `BaseMapModuleConfig.groups` keeps a visibility per base-map layer group, applied in order over `visible`; an entry without `visible` draws its group as the style ships it
  - map: a style change restores every `BaseMapModule.setVisible` group call, not only the last one
  - map: `BaseMapModule.setVisible` over a group removes the `basemap.<group>`, `buildings.*` or `roads.shields` knob for it from `StylingModule`, so the later call still wins after a style change
  - map: `pois.microMarkers`, `roads.arrows`, `roads.restricted`, `roads.underConstruction` and `roads.exitNumbers` only hide within what `POIsModule` and `BaseMapModule` show: `true` no longer shows layers their module hid, `POIsModule.setVisible(true)` or `BaseMapModule.setVisible(true)` keeps a knob's `false`, and resetting the knob leaves the layers as the module has them

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `IncidentFocusStyle.widthScale` is `widthFactor`, clamped to the new `INCIDENT_FOCUS_WIDTH_FACTOR_RANGE` (`1`–`1.8`, default `1.6`); migrate `focus: { widthScale }` to `focus: { widthFactor }`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `TrafficIncidentsModule` has one set of filters for the incident lines and their icons. `TrafficIncidentsModuleConfig.icons` is the new `IncidentIconsConfig`, `{ visible? }` only, and `filter()` takes a single argument; `IncidentsCommonConfig` is removed. Migrate by moving what `icons.filters` or `filter()`'s second argument held into the root `filters`
  - map: the style parts the SDK adds — traffic flow, traffic incidents and the hillshade — are hidden until you show them, stated in the traffic flow, traffic incidents and terrain guides

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `isVisible()` on `TrafficIncidentOverlayModule` and `TrafficAreaAnalyticsModule` reports the module's `visible` setting — `true` unless hidden with `setVisible(false)` or `visible: false` — whatever is shown. A module showing nothing returns `true`. To know whether data is drawn, read `getShown()`: `overlay.getShown().incidents.features.length > 0`, or the `heatmap`/`hexgrid`/`square` collections of `TrafficAreaAnalyticsModule.getShown()`
  - map: `TrafficIncidentOverlayModule.show()` keeps the incidents hidden while the module is set to `visible: false`
  - map: a style change restores a hidden `TrafficAreaAnalyticsModule` without emitting `config-change`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** services: `CommonServiceParams.customServiceBaseURL` is removed; every service builds its endpoint URL from the global `commonBaseURL`
  - **Breaking:** services: an `apiVersion` passed at runtime, per call or through `TomTomConfig.put`, is ignored; each service calls the API version it pins
  - **Breaking:** map: `StandardStyle.version` is removed; standard styles always load the Orbis style version the SDK is verified against
  - **Breaking:** map: the undocumented `DEFAULT_STYLE_VERSION` export is removed

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `GeometriesModuleConfig.theme` is `fillStyle`, `GeometryTheme` is `GeometryFillStyle` and `geometryThemes` is `geometryFillStyles`; the values are unchanged
  - **Breaking:** map: a feature sets its own fill style with `properties.fillStyle` instead of `properties.theme`
  - **Breaking:** map: `themedGeometryConfig` is `fillStyledGeometryConfig`
  - **Breaking:** map: `GeometriesModuleConfig.textConfig: { textField }` is `label: { text }`, `GeometryTextConfig` is `GeometryLabel`, and `GeometriesModule.applyTextConfig` takes `{ text }`
  - **Breaking:** map: `GeometriesModuleConfig.lineLabelConfig` is `lineLabel` and `GeometryLineLabelConfig` is `GeometryLineLabel`; its `textSize`, `textColor`, `textHaloColor`, `textHaloWidth`, `textOpacity` and `textOffset` are `size`, `color`, `haloColor`, `haloWidth`, `opacity` and `offset`
  - **Breaking:** map: `GeometryFillConfig.color` takes a colour, a palette name or a MapLibre expression; legacy MapLibre function objects (`{ stops }`) are no longer accepted
  - map: `GeometriesModuleConfig.color` colours a module's fill and border at once; `fill.color`, `line.color` and a feature's own `color` override it, and the map accent applies only while it is unset
  - map: `LabelConfig` is the label styling every module shares — `size`, `color`, `haloColor`, `haloWidth`, `opacity` and `font`
  - map: `label` styles the geometry titles with `LabelConfig`, and `lineLabel` gains `font`
  - map: a MapLibre expression in `fill.color` renders, on the fill and on a border without its own `line.color`; an accent change no longer redraws a module that sets `fill.color`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** core: `ChargingPoint.evseId` is optional — some operators publish none, in search results and in `evChargingStationsAvailability()` alike
  - services: EV charging places from `discoverPlaces()`, `discoverOnePlace()` and `getPlaceDetails()` carry `chargingPark.chargingStations` — each station's charging points (EVSEs) with `capabilities`, `restrictions`, connectors and `evseId`, as the availability service already returns them
  - services: route charging stops carry `dataSources.chargingAvailability.id`, so `getPlaceWithEVAvailability()` adds their availability as it does for search results
  - core: `ChargingStation` takes its charging point type as a parameter, and `StaticChargingPoint` describes a charging point without real-time status
  - services: `connectorAvailabilities[].connector.chargingSpeed` is set, and a charging point without `capabilities` or `restrictions` gets empty lists
  - services: `getPlaceWithEVAvailability()` counts `chargingPark.connectors` from the availability when the place has none of its own

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)!
  
  - **Breaking:** services: the options that drop results — `poiCategories`, `poiBrands`, `indexes`, `geographyTypes`, `connectors`, `fuelTypes`, `minPowerKW`, `maxPowerKW` and `countries` — move under one `filters` object: `PlaceFilters` on the places searches, plus `GeographicFilters` (`countries`) on fuzzy search and geocoding. Geometry and along-route search take no `countries`, which they never sent
  - **Breaking:** services: `offset` gives way to an opaque `cursor`: pass a fuzzy search or geocoding response's `properties.nextCursor` back unchanged; a value the SDK did not mint throws. `SearchSummary.offset` becomes `nextCursor`, absent when no further page can be served — including once the next page would start past result 1900, which ends pagination rather than failing validation
  - services: geocoding responses carry the search summary as `properties`, `nextCursor` included

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)! - **Breaking:** services: `getPlaceWithEVAvailability` and `getPlacesWithEVAvailability` reject with `SDKAbortError` when their `signal` is aborted, instead of reporting the cancellation as missing availability data. Every other request failure still resolves to `undefined`, and the sequential run now stops at the cancelled station rather than working through the rest of the list

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `SectionSignConfig.minzoom` and `CountryCrossingConfig.minzoom` are renamed `minZoom`, as every other display config spells its zoom threshold; migrate by renaming the key

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `MapColorName` and `mapColorNames` gain `accent`, the colour for what is drawn on top of the map, so a `Record<MapColorName, …>` needs an entry for it
  - map: `setMapColors` and the `colors.accent` knob set `accent`, and `map.mapColors` publishes the map colours in effect
  - map: routes, geometries, place pins, connections and entry points default to the accent and follow it when it changes; a colour the caller set still wins
  - map: `RoutingModule.getConfig()` returns the configuration as given, without the layers the module built from it
  - map: a `PlacesModule` default pin `style` repaints the pin when it changes, and an `icon.default.image` is never replaced by it
  - services: `trafficAreaAnalytics` parses its response when an app transpiles the SDK to ES5, as Sandpack or Babel over `node_modules` does, instead of failing with "undefined is not iterable"

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)! - **Breaking:** core: `AreaAnalyticsFeatureProperties.name` is optional: the API echoes a region name only from a request that names one, and the SDK's names none, so `trafficAreaAnalytics` leaves it out instead of setting it to `undefined`

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: the `evChargingStationsAvailability()`, `getPlaceWithEVAvailability()` and `getPlacesWithEVAvailability()` examples compile, and `ChargingParkWithAvailability.availability` names the functions that fetch it

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: the `hillshade.exaggeration` knob description, `TerrainModuleConfig.elevationExaggeration` and `TerrainModule.setElevationExaggeration` each name the other: the knob sets how strongly slopes are shaded, the terrain setting the vertical scale of the 3D surface

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)!
  
  - map: `PlacesModule` takes a `cluster` config under the `pin-clustered` theme: `badge` styles the count badge of single-category and mixed-category clusters together, and `source` sets MapLibre's `clusterRadius`, `clusterMaxZoom`, `clusterMinPoints` and your own `clusterProperties` aggregators. Entry points start above a changed `clusterMaxZoom`
  - map: a `PlacesModule` `layers.cluster`, `clusterBadge`, `clusterCount`, `clusterMixedBadge` or `clusterMixedCount` override merges into that layer's `paint` and `layout` key by key, like the other place layers, instead of replacing them whole

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: `PlacesModule` and `GeometriesModule` take a `visible` config field (default `true`) and `setVisible()` / `isVisible()`. Hiding covers every layer the module draws — places, connections and entry points; fills, borders, center labels and border labels — keeps its data, and survives `show()`, `clear()` and style changes. Showing again leaves theme-unused layers and `layout.visibility: 'none'` overrides hidden
  - map: `PlacesModule` connection layers and the `GeometriesModule` border keep a `layout.visibility: 'none'` override when data is shown
  - map: `GeometriesModule` border labels (`lineLabel`) move with the border in `moveBeforeLayer` and follow config changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `reverseGeocode` sets no `dataSources.geometry` on an area result; the ID it set was the place ID, which `geometryData` answers with no geometry. To draw a reverse geocoded area, search it by name with its `geographyType`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - core: `getCoordinateAtRouteProgress`, `calculateProgressAtRoutePoint` and the other route progress lookups bisect the route's `progress` instead of scanning all of it, so a lookup on a 30,000-point route takes microseconds rather than a millisecond

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: `RoutingModule` posts a tunnel sign where each tunnel starts, under the map's labels, and a "closed to vehicles" sign where each vehicle-restricted stretch starts, just under the traffic icons, on the new `routeTunnelSymbol` and `routeVehicleRestrictedSymbol` layers
  - map: `sections.tunnel.icon` and `sections.vehicleRestricted.icon` replace those signs, instead of being accepted and ignored

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `createLatestRequest` keeps only the latest of a series of requests. Each `run` aborts the one before it and resolves `{ current: true, value }`, or `{ current: false }` once a newer run or a `cancel` retired it, so a superseded call neither rejects nor paints last. Errors of the current request, a deadline composed onto its signal included, are rethrown

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: the `CommonRoutingParams` examples compile — the heavy-vehicle one drops `travelMode: 'truck'`, the EV one uses `speedsToConsumptionsKWH` — and `VehicleDimensions` states that weight is its only dimension

## 0.58.1

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: the `basemap.<group>` and `buildings.*` styling toggles write through `BaseMapModule`, and `styling.get` reads their layers live, so it agrees with `baseMap.isVisible(…)` whichever of the two set the group
  - map: `basemap.land` reaches the layers `BaseMapModule`'s `land` group does, which leave out the style's sourceless `background`; on `satellite` that is no layer

- Thanks [@SuleymanAli-TomTom](https://github.com/SuleymanAli-TomTom)!
  
  - services: `trafficIncidentDetails` takes a `polygon`, such as a city boundary from `geometryData`, as a third query mode beside `bbox` and `ids`; the request covers the polygon's bounding box and the response keeps the incidents that intersect the polygon
  - services: `trafficIncidentDetails` validation rejects a request that sets more than one of `bbox`, `polygon` and `ids`, or none of them; the check that `bbox` and `ids` are not combined was never applied

## 0.58.0

### Minor Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `culori` v4 is a new peer dependency. npm 7+ and Yarn install it for you; pnpm needs `auto-install-peers=true` or `pnpm add culori`
  - map: colour parsing, conversion, luminance and mixing run on culori's tree-shakeable `culori/fn` instead of the SDK's own parser and named-colour table, so an app that also uses culori ships it once

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** services: `GuidanceParams.phonetics` and the `Phonetics` type are removed; `guidance` takes `{ type: 'coded' }` only
  - **Breaking:** core: `TextWithPhonetics` is renamed `InstructionText` and drops `phonetic` and `phoneticLanguageCode`; instruction name fields carry `text` only

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** services: `calculateReachableRange` calls reachable-range API version 3, so the request `onAPIRequest` sees is a `POST` with `data` and `headers` — the API key travels as a `TomTom-Api-Key` header — instead of a `GET` URL
  - **Breaking:** services: `calculateReachableRange` rejects `costModel.avoidAreas`, `when.arriveBy`, and a charge budget it cannot convert (no `model.engine.charging.maxChargeKWH`, or no `vehicle.state` for `remainingChargePCT`) instead of dropping them
  - services: `calculateRoute` sends a vehicle's `currentChargeInkWh` / `currentFuelInLiters` when it has no explicit engine model, and keeps a zero charge, charge percentage or heading on the wire

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** services: the reachable-range budget type `remainingChargeCPT` is `remainingChargePCT`, matching `spentChargePCT`
  - **Breaking:** services: `reverseGeocode` takes `geographyTypes`, as the other places services do; it was a singular name holding an array
  - **Breaking:** services: `metricKeyToApiDataType` is no longer exported
  - **Breaking:** services: generic and combustion vehicles take no `preferences`, and the `VehiclePreferences` type is removed; an electric vehicle's `preferences` is `ElectricVehiclePreferences`
  - **Breaking:** map: the module config types follow `<Module>Config` — `TrafficFlowModuleConfig`, `TrafficIncidentsModuleConfig`, `TrafficIncidentOverlayModuleConfig`, `TrafficAreaAnalyticsModuleConfig` replace `FlowConfig`, `IncidentsConfig`, `TrafficIncidentOverlayConfig`, `TrafficAreaAnalyticsConfig`
  - **Breaking:** map: the `FilterShowMode` value `'all_except'` is `'all-except'`, in the POI, traffic flow and traffic incident filters
  - map: `filterShowModes` lists the `FilterShowMode` values at runtime
  - services: `discoverOnePlace` and `geocodeOne` also take a params object (everything but `limit`), so a single-result lookup can carry `geoBias` or a `signal`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `eventState` is typed `EventState`, which adds `recently-hovered`, so your own `['has', 'eventState']` expressions match a feature for its grace period; exclude that state or set `hoverGracePeriodMS: 0`
  - map: `PlacesModule` draws the entry points of shown places with `entryPoints` on its config — for all places or only hovered or clicked ones, from a minimum zoom — and `places.events.entryPoints` hands each back as a point feature with its place attached
  - map: a GeoJSON-backed feature the pointer leaves stays `recently-hovered` for `hoverGracePeriodMS` (default 400, on the map's or a module's `events`); the SDK's layers draw it as no state

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)!
  
  - **Breaking:** core: 67 `POICategory` values take their Places Search v3 name, upper-cased — among them `GAS_STATION` → `FUEL_STATION`, `ELECTRIC_VEHICLE_STATION` → `CHARGING_LOCATION`, `HOTEL_MOTEL` → `HOTEL_OR_MOTEL`, `SHOPPING_CENTER` → `MALL`, `SUPERMARKETS_HYPERMARKETS` → `SUPERMARKET`
  - **Breaking:** core: five `POICategory` values merge into the v3 type they share, keeping both V2 ids: `COLLEGE_UNIVERSITY` → `COLLEGE_OR_UNIVERSITY`, `LEISURE_SPORTS_CENTER` → `SPORTS_CENTER`, `OPEN_PARKING_AREA` → `OPEN_CAR_PARKING_AREA`, `PERFORMING_ARTS_THEATER` → `THEATER`, `ROAD_TRAFFIC_CONTROL_CENTER` → `TRAFFIC_CONTROL_DEPARTMENT`
  - **Breaking:** services: `autocompleteSearch` and its `AutocompleteSearch*` types are no longer exported — `getSearchSuggestions()` returns its brand and category suggestions, alone with `filters: { kinds: ['brand', 'category'] }` or ranked with places
  - **Breaking:** services: the places functions take intent-based names that line up with Places Search v3's `suggest` / `discover` / `details`: `search` → `discoverPlaces`, `searchOne` → `discoverOnePlace`, `placeById` → `getPlaceDetails`
  - **Breaking:** services: the types follow — `SearchResponse` → `DiscoverPlacesResponse`, `PlaceByIdParams` / `PlaceByIdResponse` → `PlaceDetailsParams` / `PlaceDetailsResponse`; a place-details error reports its service as `PlaceDetails`
  - **Breaking:** core: `POICategory` drops `PUB_FOOD`, `POLYNESIAN_RESTAURANT`, `OTHER_WINTER_SPORT` and `SNOOKER_POOL_BILLIARD`, which the category endpoint no longer returns. Filtering on one already matched nothing. The map's `poiCategoryGroups.FOOD_DRINKS_GROUP` no longer lists `PUB_FOOD`
  - services: `getSearchSuggestions()` returns one ranked list from the search and autocomplete arms, blended like Places Search v3: at most one brand or category leads, then places
  - core: `POICategory` gains the seven categories the endpoint returns that the vendored table was missing, so `getPOICategories()` and category filters now reach them, and `PlacesModule` draws an icon for each
  - services: `discoverPlaces`, `geocode` and `getSearchSuggestions` encode the query in the request path, so a query containing `/`, `?` or `#` is answered instead of failing with a 404

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** services: remove the `customizeService` export, and the optional second argument every service function took to override its request building, sending or response parsing. `calculateReachableRanges` keeps its second `options` argument

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - **Breaking:** map: `StylingModule.describe()` is removed, together with the `StylingCatalogue`, `StylingKnobDescriptor`, `StylingPresetDescriptor` and shared `KnobDescriptor` types. The knob catalogue is static data now: `stylingKnobCatalogue` lists every knob's kind, description, range or options and `appliesTo`, `stylingPresetCatalogue` every preset with its settings, and `styling.get(id)` reads the value in force on a live map.

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** core: `GlobalConfig.trackingId` is removed, together with the `Tracking-ID` request header it set
  - **Breaking:** core, services: `apiVersion` is removed from `GlobalConfig` and `CommonRoutingParams`; each service picks the API version it calls

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)!
  
  - **Breaking:** core: each `AreaAnalyticsTimedData` granularity has its own entry type, `AreaAnalyticsYearlyEntry` to `AreaAnalyticsHourlyEntry` and `AreaAnalyticsAverageEntry`, whose time identifiers are required, and `AreaAnalyticsTimedEntry` is their union, so code that builds entries by hand must set them
  - **Breaking:** core: `AreaAnalyticsFeatureProperties.timezone` is optional: the API echoes it only from a request that names one, and the SDK's names none
  - services: `trafficAreaAnalytics` reads each `timedData.average` entry's `day` and `hour` from the label the API sends (`FRIDAY-10`) and orders the entries Monday first, instead of numbering them by position in an array the API sorts by label string
  - services: `trafficAreaAnalytics` reads the `year`, `month`, `week`, `date` and `hour` of each yearly to hourly `timedData` entry from the `time` label the API sends (`2024-08-06T07:00`), instead of numbering daily and hourly entries by position from a start date the Lite response never sends, which gave every one an Invalid Date and shifted the hours whenever an `hours` filter, a `days` list or a day without data left entries out, and leaving yearly, monthly and weekly entries with none
  - services: `trafficAreaAnalytics` defaults an omitted `endDate` to three days ago, the latest date that always has data, instead of two: the API publishes a day 24 to 48 hours after it ends, so the default window failed during part of each day
  - services: `trafficAreaAnalytics` documents that its `hours` filter and every `timedData` time identifier are in UTC, since the request names no region timezone

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)!
  
  - **Breaking:** services: `trafficIncidentDetails` calls Orbis Traffic Incident Details v2, so the request `onAPIRequest` sees carries the API key, version, language and an `Attributes` projection as headers instead of query parameters
  - **Breaking:** services: remove the `trafficModelId` parameter from `trafficIncidentDetails`; v2 always serves the latest traffic state
  - **Breaking:** core: remove `TrafficIncidentTMC`, `TrafficIncidentTMCPoint` and `properties.tmc` from `TrafficIncidentProperties`; v2 carries no TMC data
  - services: `trafficAreaAnalytics` accepts a `startDate` without an `endDate` and measures the range to two days ago, the end date it sends, instead of rejecting every such request
  - services: `trafficAreaAnalytics` validates a range in the UTC calendar days it sends, and dates hourly and daily entries in UTC, so neither drifts a day with the time of day or a daylight-saving switch

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: the API reference of `BaseMapModule`, `POIsModule`, `TerrainModule`, `TrafficFlowModule` and `TrafficIncidentsModule` states what each module owns and which `StylingModule` knobs own the look

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: a source comment in the place-pin category mapping no longer links to an internal repository

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - The `maplibre-gl` peer dependency requires `^6.11.2`, and the `zod` peer dependency `^4.6.5`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: `PlacesModule` pins for `ADVENTURE_SPORTS_FACILITY`, `COMMUNITY_CENTER`, `EMBASSY`, `EMERGENCY_MEDICAL_SERVICE` and `ENTERTAINMENT` draw the icon of the category they share a base-map icon with, instead of no icon at all
  - map: `TOLL_GATE` maps to the base-map `toll_plaza` category, so its `circle-icon` and `base-map` icons draw and `POIsModule` category filters match toll plazas
  - map: `THEATER`, `SPORTS_CENTER`, `SQUASH_COURT` and `SCHOOL_BUS_COMPANY` places draw the closest base-map icon under the `circle-icon`, `base-map` and `pin-clustered` themes, instead of the default place pin

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: `calculateReachableRange` and `calculateReachableRanges` keep the API key, base URLs, `retry`, callbacks and `signal` out of each polygon's `properties`, now typed as the new `ReachableRangeProperties` — the request parameters without the `CommonServiceParams` fields

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - services: the TSDoc of reachable ranges, Long Distance EV Routing, EV charging stations availability and traffic area analytics says which API key access each needs; reachable ranges are marked as a private preview

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `TomTomMap.updateEventsConfig` changes the map's user events configuration at runtime, such as the long-hover delays and `hoverGracePeriodMS`; what it leaves out keeps its value

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: on the mono styles, `setMapColors({ land })` re-derives the other nine colours from it with the formulas the styles' themes compile them with; colours given outright still win
  - map: `setMapColors` darkens or lightens the education, healthcare, leisure and shopping land-use and building tints with `artificial`, keeping their hue and scaling their saturation with its luminance as the styles' themes do, instead of leaving them at the style's pastel lightness under a dark built-up colour
  - map: a pure grey map colour or colour knob derives grey shades, instead of shades tinted towards red
  - map: `setMapColors` recolours railway outlines with `artificial` along with their dashes, instead of leaving them at the style's grey
  - map: `setMapColors` paints water, roads, built-up areas and labels in the colour given, on the mono styles too, instead of offsetting them from a glacier, restricted-access or city-label literal
  - map: `setMapColors` keeps the opacity of translucent label halos, instead of painting them opaque
  - map: `setMapColors` recolours motorway, trunk and primary link roads with `roadMajor`, instead of with `road`
  - map: `styling.get('colors.<name>')` reports a colour without the opacity of the layer it was read from, so setting it back changes nothing
  - map: `artificial` is read from the city-scale built-up colour, the one the style's theme sets, and `setMapColors` measures its shades from it, instead of from the more saturated small-scale stop

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: replacing the image of a `ferry` or `tollRoad` section icon through `sections.<type>.icon` keeps the zoom-ramped size its layer draws with, instead of flattening it to 1; `icon.size` still sets one when given

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)! - map: `toHsl`, `formatStyleHsl` and `HslColor` are exported, the colour rules the map-theme plugin shares with the recolour

- Thanks [@carlosprietofernandez-tomtom](https://github.com/carlosprietofernandez-tomtom)!
  
  - services: `trafficAreaAnalytics` reads `properties.startDate` and `endDate` as the earliest and latest of the `days` the API lists, at midnight UTC, instead of fields the Lite response never sends, which left both an Invalid Date
  - services: `trafficAreaAnalytics` reads `anomalies` keyed by the abbreviated metric fields the API sends (`v`, `c`), instead of data type names, which dropped every anomaly; each anomaly's times are read as UTC, and its `labels` are the names of the public holidays it overlaps
  - services: `trafficAreaAnalytics` documents that `anomalies` is empty: the service detects anomalies only over 35 days or more, beyond a request's 31-day limit

## 0.57.0

### Minor Changes

- Thanks [@JulianChinAFoeng-TomTom](https://github.com/JulianChinAFoeng-TomTom)!
  
  - **Breaking:** services: the places services send the API key and API version as `TomTom-Api-Key` / `TomTom-Api-Version` headers instead of `key=` in the URL, so a request builder now returns `{ url, headers }` and a proxy has to forward those headers
  - **Breaking:** services: `SearchSummary.totalResults` and `SearchSummary.fuzzyLevel` are optional — guard them rather than assuming a number
  - services: `customizeService` builders document how to send the credential yourself, including `credentials: 'include'` under a credentials proxy via `isProxyCredentialsMode(config)`

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)!
  
  - **Breaking:** map: `TerrainModule` replaces `HillshadeModule` — `TerrainModule.get(map, { hillshade: true })` for what `HillshadeModule.get(map, { visible: true })` did, `setHillshadeVisible` for `setVisible`
  - **Breaking:** map: the `view.terrain` and `view.terrainExaggeration` styling knobs and the `terrain` preset are removed — `TerrainModule.get(map, { elevation: true, elevationExaggeration })` raises the terrain instead, and loads the elevation style part the knob could not
  - map: 3D terrain with `TerrainModule` — `elevation` and `elevationExaggeration` raise the map surface from the same elevation data the hillshade shades, restored after every style change

### Patch Changes

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: `basemap.<group>` styling knobs toggle every base-map layer group `BaseMapModule` knows, bar the two building groups the `buildings.*` knobs already cover
  - map: `hillshade.*` styling knobs set the shading's method, light direction, strength, maximum zoom and colours
  - map: `styling.layers.query(…)` edits the paint, layout, filter or visibility of the style layers a query selects, re-applied after every style change and undone by `reset()`

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - map: every module has `updateConfig(partial)`, which changes the given properties and keeps the rest of the configuration, whatever that module's `applyConfig` does with a whole one
  - map: `BaseMapModule.resetConfig()` empties the configuration instead of keeping the previous one
  - map: `TrafficAreaAnalyticsModule.resetConfig()` returns the display mode, metric, colours, filters, region and layer positions to their defaults, instead of only clearing `getConfig()`
  - map: `TrafficAreaAnalyticsModule.applyConfig` with a new `activeMetric` filters and scales the layers by that metric rather than the previous one
  - map: a clean style switch (`setStyle(style, { resetState: true })`) leaves every module on the configuration `resetConfig()` returns to, and `CustomGeoJSONModule` survives it instead of throwing

## 0.56.0

### Minor Changes

- Thanks [@AlvaroGraca-TomTom](https://github.com/AlvaroGraca-TomTom)!
  
  - **Breaking:** map: precise types for custom styles, places props and traffic data
  - **Breaking:** services: deduplicate vehicle energy encoding, tighten EV types
  - map: label a route's border crossings with the countries they join
  - map: post speed limit signs where the limit changes
  - map: styling GA phase 2 - view knobs, presets, map-effects plugin
  - map: styling GA phase 3 - setMapColors map colours and exportStyle
  - routing: phase 6 - show what the SDK adds over calling the API directly
  - services: places GA phase 1 - remove the experimentalSearch export
  - map: draw border crossings under the waypoint pins

- Thanks [@DanielForniessoria-TomTom](https://github.com/DanielForniessoria-TomTom)!
  
  - **Breaking:** map: `StylingKnobValueOf` narrows to each knob's kind, so `StylingModule.set` rejects a value of the wrong kind at compile time
  - map: `stylingColorKnobIds` and `StylingColorKnobId` name every styling colour knob, and `KnobKind` gains `colors`

## [0.55.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.54.0...v0.55.1) (2026-09-21)


### ⚠ BREAKING CHANGES

* **services:** replace flat geo-bias fields with a single geoBias option
* **examples:** redesign the claim-validation demo UX per Figma
* **map:** post speed limits as road signs rather than a band
* **core:** fold reverse geocoding's access points into entryPoints
* **map:** one config tier for every drawn route section type

### Features

* **core:** fold reverse geocoding's access points into entryPoints ([6ff017f](https://github.com/tomtom-international/maps-sdk-js/commit/6ff017f3293f1d35f1432627a06c50efa4fe60de))
* **examples:** gdpr demo compliance ([03e4dd0](https://github.com/tomtom-international/maps-sdk-js/commit/03e4dd0ee0cf4dbade3cd12cf0dc05ef745446f3))
* **examples:** put every reverseGeocode option on the rev-geo playground ([313134c](https://github.com/tomtom-international/maps-sdk-js/commit/313134c5c54bc03c91cf317093836b3a6a7ec6e3))
* **examples:** redesign the claim-validation demo UX per Figma ([81fdb82](https://github.com/tomtom-international/maps-sdk-js/commit/81fdb8234329e425fd600cc150b0a944ecbcfec0))
* **examples:** serve the brand faces the typography tokens name ([1e630ce](https://github.com/tomtom-international/maps-sdk-js/commit/1e630ce3e5ce9ff1a5a3cad04f7d65f2ddf045b5))
* **map:** one config tier for every drawn route section type ([dcaec54](https://github.com/tomtom-international/maps-sdk-js/commit/dcaec543c11e1cf9514d430ef97d6befff8a9f19))
* **map:** post speed limits as road signs rather than a band ([ee2d6c0](https://github.com/tomtom-international/maps-sdk-js/commit/ee2d6c09c023804d4966f36440a74db699738d19))
* **map:** styling GA phase 1 — StylingModule and the describe() catalogue ([4379765](https://github.com/tomtom-international/maps-sdk-js/commit/437976535b976b33573002ade2d3611a3013ac28))
* **services:** replace flat geo-bias fields with a single geoBias option ([14fdb49](https://github.com/tomtom-international/maps-sdk-js/commit/14fdb491b1a481ea49e050bee399be570a5120e0))


### Miscellaneous Chores

* **release:** align package versions with the last shipped release ([2c91530](https://github.com/tomtom-international/maps-sdk-js/commit/2c91530d663e022a7329010007f2d0d83bc361c3))

## [0.54.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.53.0...v0.54.0) (2026-09-17)


### ⚠ BREAKING CHANGES

* **routing:** phase 3 — land the response data v3 already returns

### Features

* **examples:** withdraw claim-validation-service from search ([806f174](https://github.com/tomtom-international/maps-sdk-js/commit/806f1749871af48aac2b7efb1d1cfcbd6ba0f05a))
* **map:** let custom place icons offset from their coordinate ([0771ef9](https://github.com/tomtom-international/maps-sdk-js/commit/0771ef9004ea82db3c8168944498fba2038fa27b))
* **routing:** phase 3 — land the response data v3 already returns ([d071f02](https://github.com/tomtom-international/maps-sdk-js/commit/d071f02a30cbe6abf14423dc0309c782480f8a06))
* **service:** support request cancellation via AbortSignal ([f2df5e4](https://github.com/tomtom-international/maps-sdk-js/commit/f2df5e42547e0d4fab79e078f375d419a82dd2a1))
* **skills:** add an opt-in skill that reports SDK friction to GitHub ([03bd482](https://github.com/tomtom-international/maps-sdk-js/commit/03bd4823711d8fa4a882b1135dce100badfdbf2a))


### Bug Fixes

* place-customization crash when using custom icons ([4a67239](https://github.com/tomtom-international/maps-sdk-js/commit/4a67239adcf446bdac3ec392b1aeee9cd88eabbd))

## [0.53.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.52.0...v0.53.0) (2026-09-14)


### ⚠ BREAKING CHANGES

* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes
* **map:** add more dark theme styling

### Features

* **map:** add more dark theme styling ([b53d60a](https://github.com/tomtom-international/maps-sdk-js/commit/b53d60ae9a75c394605de947b8c84d441f8d6660))
* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes ([657e9f7](https://github.com/tomtom-international/maps-sdk-js/commit/657e9f7b5177404dbe163111b805def0910b07d0))
* **services:** add routing request parameters the API accepts ([1dab989](https://github.com/tomtom-international/maps-sdk-js/commit/1dab989d2854b8e477817f3e58aabc8849045e37))


### Bug Fixes

* **examples:** pin the demos-proxy LLM base URL to the /v1 surface ([bdc0ac4](https://github.com/tomtom-international/maps-sdk-js/commit/bdc0ac44917e90aef9c163fe45ce2ee40b0b3644))
* **map:** keep the map language across a clean style switch ([f88b3b4](https://github.com/tomtom-international/maps-sdk-js/commit/f88b3b448495529457094018b07343d6d5510895))
* **skills:** correct four wrong APIs in the consumer skill docs ([319cf5f](https://github.com/tomtom-international/maps-sdk-js/commit/319cf5f06b1af1613b57eb8c81414072694c6d43))

## [0.52.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.5...v0.52.0) (2026-09-09)


### ⚠ BREAKING CHANGES

* **routing:** drop the circle waypoint the API never had
* migrate rev-geocoding to Orbis v2
* **map:** scoped module events and per-map shared style modules (lsi-159)
* **services:** remove routing parameters the API does not support
* **map:** replace get() with create() on data-owned map modules

### Features

* **examples:** claim validation intake example ([6f20f43](https://github.com/tomtom-international/maps-sdk-js/commit/6f20f434549e357c7bdac98bbc86e0892f296024))
* **map:** replace get() with create() on data-owned map modules ([9d3d81e](https://github.com/tomtom-international/maps-sdk-js/commit/9d3d81e349d21ce00368c12462c5919f6d8da491))
* **map:** scoped module events and per-map shared style modules (lsi-159) ([d91519e](https://github.com/tomtom-international/maps-sdk-js/commit/d91519e870f2796a9874aa0b10651b7bc350b81e))
* migrate rev-geocoding to Orbis v2 ([d939fc8](https://github.com/tomtom-international/maps-sdk-js/commit/d939fc8eced2c016efac51723a3d18fecd78c180))
* **routing:** drop the circle waypoint the API never had ([a25365b](https://github.com/tomtom-international/maps-sdk-js/commit/a25365b8f491cc0b85001386601f2265c4ca05e2))
* **services:** remove routing parameters the API does not support ([943be5d](https://github.com/tomtom-international/maps-sdk-js/commit/943be5d0fefde37f284b1d44a7d0bca2582a0d30))


### Bug Fixes

* **examples:** stack the searched EV pins above the viewport stations ([7017081](https://github.com/tomtom-international/maps-sdk-js/commit/7017081ae467d6d762eba3d8f48cd86a7203ccce))
* stop partial route updates clobbering config, give BYOD reset a contract ([e69e37e](https://github.com/tomtom-international/maps-sdk-js/commit/e69e37ec833f665ec00b1b32835296e4918f9ad9))

## [0.51.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.4...v0.51.5) (2026-08-25)


### Bug Fixes

* **docs:** correct stale APIs, dead links and drifted contributor docs ([fa3dc7b](https://github.com/tomtom-international/maps-sdk-js/commit/fa3dc7bab594c685a1235376abb2ac9c386ebb81))

## [0.51.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.3...v0.51.4) (2026-08-24)


### Bug Fixes

* **agent-toolkit:** range-check model coordinates and report plugin coverage ([8a4bcde](https://github.com/tomtom-international/maps-sdk-js/commit/8a4bcde241e0d6339c84d037a547e79ed5be9adc))
* **agent-toolkit:** range-check the sandbox fitOnMap bbox ([6d1c02e](https://github.com/tomtom-international/maps-sdk-js/commit/6d1c02e5e8d15bcc50c385479e72bddc662dc61c))

## [0.51.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.2...v0.51.3) (2026-08-18)


### Features

* add BaseMapModule appearance API and upgrade maplibre-gl to v6 ([f6b5296](https://github.com/tomtom-international/maps-sdk-js/commit/f6b52966d456f1f73a9ce9dbe3a7b19eac164bc3))
* attribute map traffic to the product embedding the SDK ([644089f](https://github.com/tomtom-international/maps-sdk-js/commit/644089f7921e12caf9405bea715a62e3c7c8aa97))

## [0.51.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.1...v0.51.2) (2026-08-05)


### Bug Fixes

* include dist files from examples ([ded965a](https://github.com/tomtom-international/maps-sdk-js/commit/ded965a8fba7e9bb45c9010210b017c6c58ee565))

## [0.51.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.0...v0.51.1) (2026-08-04)


### Features

* **examples:** move the traffic and site-selection agents to Las Vegas ([4b19cb9](https://github.com/tomtom-international/maps-sdk-js/commit/4b19cb994fee43e28bead4b6595526679d63e569))
* **examples:** record query and response text on AgentSuccess telemetry ([ded1d51](https://github.com/tomtom-international/maps-sdk-js/commit/ded1d513c319fc91cc4f3d316f7b005c1c77817e))


### Bug Fixes

* **deps:** pin a pnpm release that can still be installed ([c4d0882](https://github.com/tomtom-international/maps-sdk-js/commit/c4d0882b39b8805efb670a3ce80189904f9bc1ea))
* **deps:** upgrade react and react-dom to 19.2.8 ([e6208dc](https://github.com/tomtom-international/maps-sdk-js/commit/e6208dcf5a10e59d38897e5033c5649b03f8d405))
* geometry search playground empty query and unneeded promise.all ([eaae67e](https://github.com/tomtom-international/maps-sdk-js/commit/eaae67e5ac01df9c64f715baef4d12aad31dbdf5))
* location resolver selecting subdivision over parent city ([11b44ef](https://github.com/tomtom-international/maps-sdk-js/commit/11b44ef67f2811b67011a3cdc228e0d105d10736))

## [0.51.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.4...v0.51.0) (2026-07-24)


### ⚠ BREAKING CHANGES

* **map:** improve base map layer groups

### Features

* **map:** improve base map layer groups ([4bf43b8](https://github.com/tomtom-international/maps-sdk-js/commit/4bf43b88910378e129ff2ec8d486eaf67a6210b6))


### Bug Fixes

* **agent-toolkit:** surface reverse-geocode no-match as an error ([8582a44](https://github.com/tomtom-international/maps-sdk-js/commit/8582a4407776e44e7fd5cd28d12411748bc7ed79))
* chat UX polish, whitespace hex rendering, entry-id collision in toolkit ([c1b97db](https://github.com/tomtom-international/maps-sdk-js/commit/c1b97dbe0e577918f0c391704632ee76378c23a3))
* **landmarks-3d:** render POIs on top of 3D landmark meshes ([79b0922](https://github.com/tomtom-international/maps-sdk-js/commit/79b092201562e4452ac31f2890ac8046fdf3b27e))

## [0.50.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.3...v0.50.4) (2026-07-09)


### Bug Fixes

* **map:** guard SourceWithLayers against a removed map ([8895e1a](https://github.com/tomtom-international/maps-sdk-js/commit/8895e1a36da01d30c8ae967b4fe65aa628c4a159))

## [0.50.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.2...v0.50.3) (2026-07-08)


### Bug Fixes

* **examples:** lazy-load App Insights in traffic agent to fix sandpack ([2b7a8f2](https://github.com/tomtom-international/maps-sdk-js/commit/2b7a8f203019ca7d44cac8b443f18bbd2562aaff))

## [0.50.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.1...v0.50.2) (2026-07-07)


### Features

* **examples:** add byod district prompts and per-district traffic monitoring ([60fe0e8](https://github.com/tomtom-international/maps-sdk-js/commit/60fe0e8619a1efa7b40c0061aa40293fb89179f1))
* **examples:** gate site-selection household behind the experimental flag ([5366d98](https://github.com/tomtom-international/maps-sdk-js/commit/5366d98485238921d23672737583f5fa2cdbf219))
* **examples:** prioritize agent-setup files in map agent Sandpack tabs ([13b2fd2](https://github.com/tomtom-international/maps-sdk-js/commit/13b2fd258b2aa8960fd35427214fa89fceeec91d))


### Bug Fixes

* **agent-toolkit:** resolve routing waypoints by place id or entry id ([e73a15f](https://github.com/tomtom-international/maps-sdk-js/commit/e73a15f8f6d0a7b796b36b5d6a58ee04437e1f70))
* **agent-toolkit:** ungate scope and cross kind schemas ([6a4cb2e](https://github.com/tomtom-international/maps-sdk-js/commit/6a4cb2e8925072d301a615bc285b1394af4eb28b))
* allow for an array of inputs with tools that use the progress bar ([1373650](https://github.com/tomtom-international/maps-sdk-js/commit/137365019d6e17fd8e78548157d966b24361260c))
* **examples:** example titles + jam detail panel design fixes ([c150c0f](https://github.com/tomtom-international/maps-sdk-js/commit/c150c0fe1eb5cb7edd87eca6db3951f051da66fe))
* **examples:** polish clarify wizard survey UX and hover states ([f992706](https://github.com/tomtom-international/maps-sdk-js/commit/f992706ca02a23d1542fb0ed4df44199245e4789))
* **examples:** scroll chat when hovering the resize handle ([7d42a04](https://github.com/tomtom-international/maps-sdk-js/commit/7d42a04bc9dd5141814d945ccd85a091541065f0))
* **site-selection:** panel polish + BYOD titles, colour & containment ([137b472](https://github.com/tomtom-international/maps-sdk-js/commit/137b47233b9dd0d556fab141abfa0d71fe690c0c))


### Performance Improvements

* move scenario-tests to main pushes ([a78a729](https://github.com/tomtom-international/maps-sdk-js/commit/a78a729a7ccf0c76c881cbdcbfccacc5f11cd827))

## [0.50.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.0...v0.50.1) (2026-07-03)


### Bug Fixes

* **agent-toolkit:** unblock npm publishing of the plugin ([b0ae964](https://github.com/tomtom-international/maps-sdk-js/commit/b0ae9647970ab03e3ed6906b529bdb6c7aba6b3a))

## [0.50.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.49.1...v0.50.0) (2026-07-03)


### ⚠ BREAKING CHANGES

* **map:** granular fill/line beforeLayerConfig + geometry-config-playground

### Features

* agent eval integration ([926270a](https://github.com/tomtom-international/maps-sdk-js/commit/926270a79613525e365a04855f386aa5d4f229cc))
* **agent-eval:** llm judge with grounding veto and per-agent token monitoring ([a75c74d](https://github.com/tomtom-international/maps-sdk-js/commit/a75c74d2a2c8ab4910b71581e51d5a61880db990))
* **examples:** agent telemetry and Azure Monitor observability dashboard ([92893fe](https://github.com/tomtom-international/maps-sdk-js/commit/92893febbdcb6e1c1617867d1de3f0115c95815b))
* **examples:** berlin-based starter prompts ([bee84e3](https://github.com/tomtom-international/maps-sdk-js/commit/bee84e39b75be6e44768e1fdd0c4f85b0a65b62f))
* **examples:** make site-selection agent state-driven + BYOD-capable ([667ae8e](https://github.com/tomtom-international/maps-sdk-js/commit/667ae8e389e853ceb4d4ef4bf89ca2ecf0d563b0))
* **map:** expand geometry line config ([fcceefb](https://github.com/tomtom-international/maps-sdk-js/commit/fcceefb63cd4371aef275bf29a41cc5cc751bcd2))
* **map:** granular fill/line beforeLayerConfig + geometry-config-playground ([44db14c](https://github.com/tomtom-international/maps-sdk-js/commit/44db14ca630a36c1286afa332732194c3b1f2df8))
* **site-selection:** align with latest ux designs ([f31c6eb](https://github.com/tomtom-international/maps-sdk-js/commit/f31c6eb3f12452f7f9bbb95ef2199eb734f55fe1))
* **site-selection:** let the LLM name the BYOD label field from the schema ([d97b632](https://github.com/tomtom-international/maps-sdk-js/commit/d97b63201b3a5afef592bc99265abd7e995f9d7e))
* **site-selection:** polish widget + map visuals to latest ux designs ([bdd4931](https://github.com/tomtom-international/maps-sdk-js/commit/bdd4931c50e5ce0bfc865a4dee2aeff4a86de3dd))


### Bug Fixes

* **agent-toolkit:** accept places entry ids in where.placeIds ([5cf934d](https://github.com/tomtom-international/maps-sdk-js/commit/5cf934ddcabdc9c48ead7c1e6cb530e7fa57a2e2))
* **agent-toolkit:** guard setMapStandardStyle against accidental style changes ([eed6211](https://github.com/tomtom-international/maps-sdk-js/commit/eed62110b17efb7fb8b894f3433c97760a68ee5f))
* **agent-toolkit:** prefer dedicated tools over the MapLibre escape hatch ([a67a548](https://github.com/tomtom-international/maps-sdk-js/commit/a67a54850c8ac25ed2624e3478137bc16a1d63c5))
* **agent-toolkit:** validate processData places and trace derived ids ([f820d53](https://github.com/tomtom-international/maps-sdk-js/commit/f820d535f3b75f2467bed380b78407c87f243cad))
* **examples:** align agent chat UI across example apps ([321c585](https://github.com/tomtom-international/maps-sdk-js/commit/321c585349b06ba4aff8911e448d4d39b0fbebad))
* **examples:** make agent telemetry optional in local dev ([8f4c4ef](https://github.com/tomtom-international/maps-sdk-js/commit/8f4c4ef5b1ff047b6586149091579e99a3ffe406))
* **examples:** toolCall Figma polish + route corridor colors ([ee87045](https://github.com/tomtom-international/maps-sdk-js/commit/ee8704565ae1bc08be506ea279d7b18830ac95c3))
* **landmarks-3d:** send session credentials so tiles load behind a proxy ([dc7b78c](https://github.com/tomtom-international/maps-sdk-js/commit/dc7b78c0d614571b63f0d4f27620bbe1155e971a))
* **site-selection:** render all parking points, add discoverPlaces ([1a7362d](https://github.com/tomtom-international/maps-sdk-js/commit/1a7362dd200fc8bd534ac53ee779729fb2236236))

## [0.49.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.49.0...v0.49.1) (2026-06-30)


### Features

* **agent-toolkit:** expose sandbox data-tool inputs as per-entry records only ([ae53be5](https://github.com/tomtom-international/maps-sdk-js/commit/ae53be54707aaa063d4a948d42226ae35761a2da))
* **examples:** align chat agent UI with the traffic agent Figma design ([0374887](https://github.com/tomtom-international/maps-sdk-js/commit/0374887ee722ebe07ae82e62a5c21dfcc34e8b0a))
* **examples:** align traffic agent UI with Figma + playbook tokens ([7f76ed4](https://github.com/tomtom-international/maps-sdk-js/commit/7f76ed4cecfea723d085e98fc9713bf17b2a9d8f))
* **examples:** group tool calls under a 'Used N tools' pill ([a901942](https://github.com/tomtom-international/maps-sdk-js/commit/a901942fe57f9f1e2aceee8c48a7a7a1639316c7))
* **examples:** polish traffic-agent prose and fix null-driven map errors ([f80041f](https://github.com/tomtom-international/maps-sdk-js/commit/f80041f51f3963ed71237549cf0f691806a27874))
* **examples:** render clarifyIntent as an interactive survey form ([5626cb1](https://github.com/tomtom-international/maps-sdk-js/commit/5626cb117e44eaea50781ffde139f1af195a6495))
* **examples:** site selection implementation ([e540a72](https://github.com/tomtom-international/maps-sdk-js/commit/e540a72b8e6a68d199a73895007fa52f9ece7e43))
* **examples:** unify the agent example UI + clarifyIntent survey wizard ([d1b3e05](https://github.com/tomtom-international/maps-sdk-js/commit/d1b3e0561134df7e3330ff04f360c1419a59d5ab))
* **plugins:** add landmarks-3d plugin for Orbis 3D Landmarks ([ef5ed89](https://github.com/tomtom-international/maps-sdk-js/commit/ef5ed899e9a396701668bd324799f6ddad96291c))
* **toolkit:** add clarifyIntent tool and add alwaysActive flag to tools ([112a58a](https://github.com/tomtom-international/maps-sdk-js/commit/112a58abf731faed3df14618f41f0a63ddf57ed1))
* **traffic-agent:** watched-area highlight, grouped Event tracker, summary follows focus ([54476ec](https://github.com/tomtom-international/maps-sdk-js/commit/54476ec3415956a960f6013243cf1640f5480c9b))


### Bug Fixes

* **agent-toolkit:** register an empty entry for zero-incident results ([aed58c2](https://github.com/tomtom-international/maps-sdk-js/commit/aed58c2be416ddfe3369fc6ac8f9991dcbb982a4))

## [0.49.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.3...v0.49.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **agent-toolkit:** consolidate per-kind recall tools into recallState
* **agent-toolkit:** analysis and incidents clustering improvements
* **traffic, map-display:** migrate to Orbis v2 GA

### Features

* agent-eval framework Initial MVP baseline ([223e15f](https://github.com/tomtom-international/maps-sdk-js/commit/223e15f0d3bc0ed607e678cef819ee1843c69a4b))
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
* **proxy:** bundle proxy config into static-html examples ([97095ff](https://github.com/tomtom-international/maps-sdk-js/commit/97095ffa716cea2d751f8b1d6880e52303da9f33))
* **services:** forward common service params ev availability util service ([fb1783f](https://github.com/tomtom-international/maps-sdk-js/commit/fb1783f28184c31b01f17c5818b3b08eacd94771))
* **traffic, map-display:** migrate to Orbis v2 GA ([6ccd244](https://github.com/tomtom-international/maps-sdk-js/commit/6ccd2445de3ef4e209b30cdd13009e2408328d80))


### Bug Fixes

* **examples:** inject multi-chunk plugin builds correctly for Sandpack ([0cf0752](https://github.com/tomtom-international/maps-sdk-js/commit/0cf07523fd176452fe7ce89c0284495e2af18baf))
* **examples:** keep illegal-request rejection rule in traffic agent prompt ([2ff7a3c](https://github.com/tomtom-international/maps-sdk-js/commit/2ff7a3c2da22b4f31d789d4bced1543200be6f86))
* **examples:** re-enable demo-BFF proxy bootstrap ([f0b9e7e](https://github.com/tomtom-international/maps-sdk-js/commit/f0b9e7e31a9da15d8a465867ce2b8cc8909ed7ed))
* **examples:** unblock CI lint — suppress noUnusedVariables ([0bd433c](https://github.com/tomtom-international/maps-sdk-js/commit/0bd433c1ca8d2d8b04177e4ee4bc06b55daf1517))
* **map:** style-change handlers return an unsubscribe disposer ([54758c3](https://github.com/tomtom-international/maps-sdk-js/commit/54758c36d9b105420d244c502ec8941062245944))
* **skill:** trim tomtom-maps-sdk-js description under 1024-char limit ([ddb7084](https://github.com/tomtom-international/maps-sdk-js/commit/ddb7084451496f4c6fd6b25a26baf3503e028905))


### Reverts

* feat(traffic, map-display)!: migrate to Orbis v2 GA ([12ed6b9](https://github.com/tomtom-international/maps-sdk-js/commit/12ed6b9dcc6b7e2c22d3525aa05f85c1ba6b5e89))


### Code Refactoring

* **agent-toolkit:** consolidate per-kind recall tools into recallState ([a519e1f](https://github.com/tomtom-international/maps-sdk-js/commit/a519e1f82efc571ef64492e269706482b67b1ef7))

## [0.48.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.2...v0.48.3) (2026-06-10)


### Features

* **routing:** migrate routing service to OrbisV3 API ([f6b04fc](https://github.com/tomtom-international/maps-sdk-js/commit/f6b04fc5d31b3a1f014e262223e2f2683b0b6120))

## [0.48.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.1...v0.48.2) (2026-06-09)


### Bug Fixes

* remove sdk dep in examples ([077b603](https://github.com/tomtom-international/maps-sdk-js/commit/077b6034c4d6ae51801c6d86037d243cb9ccc398))

## [0.48.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.0...v0.48.1) (2026-06-09)


### Features

* **agent-toolkit:** deterministic DBSCAN clustering tool ([c1d31b4](https://github.com/tomtom-international/maps-sdk-js/commit/c1d31b4ddb1e71bf8bcbae5bdc57b3400d9cedcd))


### Bug Fixes

* pin assistant-ui ([e80b0a1](https://github.com/tomtom-international/maps-sdk-js/commit/e80b0a1ff32b045cce707de27c3f7a7b15bd4e44))

## [0.48.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.9...v0.48.0) (2026-06-05)


### ⚠ BREAKING CHANGES

* **events:** scope + dedupe allEventFeatures, typed substitution
* **agent-toolkit:** byod improvements

### Features

* **agent-toolkit:** byod improvements ([4aeddca](https://github.com/tomtom-international/maps-sdk-js/commit/4aeddca52a1da30cde36f6dbb18ddad689f47f27))
* **ci:** wire up Docs Portal PR preview environments ([49829eb](https://github.com/tomtom-international/maps-sdk-js/commit/49829ebad00416fc88684f039f81239f6ac761d4))
* **events:** scope + dedupe allEventFeatures, typed substitution ([036c9c4](https://github.com/tomtom-international/maps-sdk-js/commit/036c9c41be660b92ed80b74cae4b998ce595f94d))
* sdk proxy mode for demo-BFF ([da0f932](https://github.com/tomtom-international/maps-sdk-js/commit/da0f9326c31665608cee1a2790129ff60be0ad29))


### Bug Fixes

* **agent-toolkit:** add missing [@group](https://github.com/group) tags on exported types ([67f1cf3](https://github.com/tomtom-international/maps-sdk-js/commit/67f1cf3c383d2e0db544cead55d16a66342ec4c2))
* **agent-toolkit:** public docs cleanup — links, system-prompt guidance, internal refs ([283fbc9](https://github.com/tomtom-international/maps-sdk-js/commit/283fbc9f588e261baf1112805f77102b88ce7f5a))
* proxy mode sdk ([d6b7327](https://github.com/tomtom-international/maps-sdk-js/commit/d6b73278f38d1e9b6ef43be46e4eff540a888640))

## [0.47.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.8...v0.47.9) (2026-05-22)


### Bug Fixes

* d2 diagram in documentation ([b071702](https://github.com/tomtom-international/maps-sdk-js/commit/b07170262abae749bdec2288eac405b26588de68))
* d2 diagram in documentation ([36a2991](https://github.com/tomtom-international/maps-sdk-js/commit/36a299110af550f11b467a471932da20b74c505e))

## [0.47.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.7...v0.47.8) (2026-05-22)


### Features

* **agent-toolkit:** expand plugin documentation ([3f55084](https://github.com/tomtom-international/maps-sdk-js/commit/3f550843ca92b2f08460759b200794e94178e87d))


### Bug Fixes

* **agent-toolkit:** split scenario tests into sanity / full suites ([b9b1fe8](https://github.com/tomtom-international/maps-sdk-js/commit/b9b1fe8a6dcdf8f6e6fb156a2f251351b04851c9))
* **agent-toolkit:** stabilize locate-place scenario prompt ([6883269](https://github.com/tomtom-international/maps-sdk-js/commit/6883269ccfd261c66067de6f8290d28a9dd83b91))

## [0.47.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.6...v0.47.7) (2026-05-21)


### Features

* code generation tools with updated docs ([ef1a7fa](https://github.com/tomtom-international/maps-sdk-js/commit/ef1a7fac2120e093564afeabd8def3ab7e93dc94))
* upgrade SDK agent toolkit and fix release process ([6e09446](https://github.com/tomtom-international/maps-sdk-js/commit/6e094469c689dd824a29bfaea9cc67cbe931390d))


### Bug Fixes

* **agent-toolkit:** point README docs link at overview page ([b2aba55](https://github.com/tomtom-international/maps-sdk-js/commit/b2aba55dccab4109b12a9358bc5003a066926e9b))
* engineering guideline updates for agent toolkit ([dd24926](https://github.com/tomtom-international/maps-sdk-js/commit/dd2492643fc67fc8e7dd3f6247f21569227b5912))
* tool doc updates for agent toolkit ([ac0076c](https://github.com/tomtom-international/maps-sdk-js/commit/ac0076c45b3d747fb1c6baae64f90b01fb85bb4d))

## [0.47.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.5...v0.47.6) (2026-05-15)


### Features

* exploration search with area tags ([65327e6](https://github.com/tomtom-international/maps-sdk-js/commit/65327e66eca351db365b5453e3801b420cee32e4))
* new custom geojson module in SDK ([63e5909](https://github.com/tomtom-international/maps-sdk-js/commit/63e5909f6083d79467dcf917ba3f7a9853eca96d))


### Bug Fixes

* agent toolkit place prompt fixes and clearing unnecessary modules ([1aa1873](https://github.com/tomtom-international/maps-sdk-js/commit/1aa1873811705077d40af1942d38c4c5bf3d9568))

## [0.47.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.4...v0.47.5) (2026-05-13)


### Features

* migrate all map chat agent demos to tailwind ([b3b0f92](https://github.com/tomtom-international/maps-sdk-js/commit/b3b0f927750b0fe78de724e5e919d2a082a63429))


### Bug Fixes

* restore incident module on style change ([ade0673](https://github.com/tomtom-international/maps-sdk-js/commit/ade0673a26a62d72a7374c903ed90aa66e1bd80b))
* updated a couple of schemas and bumped zod dependencies to ^4.4.3 ([cfddcf7](https://github.com/tomtom-international/maps-sdk-js/commit/cfddcf7b311dacc39e9075441060cfa543864960))

## [0.47.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.3...v0.47.4) (2026-05-12)


### Features

* agent evaluation testing [LSI-285] ([dd02bec](https://github.com/tomtom-international/maps-sdk-js/commit/dd02bec020e08b517c2908d2690d8bf0f9ae0aa3))


### Bug Fixes

* add missing traffic incidents geojson module into agent coding skills ([0095e09](https://github.com/tomtom-international/maps-sdk-js/commit/0095e09212794b0f0eb6d5edaffc214fdb38006a))
* upgrade and fix deps ([f5f1f8e](https://github.com/tomtom-international/maps-sdk-js/commit/f5f1f8ed8d6168f24fdee900f580587fcc434422))

## [0.47.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.2...v0.47.3) (2026-05-11)


### Bug Fixes

* example thumbnail reference ([3f22535](https://github.com/tomtom-international/maps-sdk-js/commit/3f22535a9bde9d7c1740256a5db1b3713c5fd02a))

## [0.47.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.1...v0.47.2) (2026-05-11)


### Bug Fixes

* example thumbnail reference ([68144d2](https://github.com/tomtom-international/maps-sdk-js/commit/68144d29034fea86fe2040308b69f150a1628a6c))

## [0.47.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.0...v0.47.1) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent ([f16863c](https://github.com/tomtom-international/maps-sdk-js/commit/f16863c85f99dbebe167c7afe8adc6c8d81fbdb4))
* **map:** TrafficIncidentOverlayModule ([b5c8099](https://github.com/tomtom-international/maps-sdk-js/commit/b5c80991f0f0c92f3df19422b941fd2d374f3456))


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes ([61d2eb3](https://github.com/tomtom-international/maps-sdk-js/commit/61d2eb3abadc6d7190a7a69fb55be09761d1f427))

## [0.47.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.13...v0.47.0) (2026-05-01)


### ⚠ BREAKING CHANGES

* improvements in places module themes

### Features

* add managePlaces tool and centralize places display state ([0cc5005](https://github.com/tomtom-international/maps-sdk-js/commit/0cc50050469f5ae8fa3450afc572c9491346f2e1))
* add model name to header ([a7c518b](https://github.com/tomtom-international/maps-sdk-js/commit/a7c518bfd785f0994212e037a7971914fa032956))
* expand deployment workflow to support multiple SDK demos ([25aa8c2](https://github.com/tomtom-international/maps-sdk-js/commit/25aa8c2361a233f8f85d803d43c41febe7f0866d))
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md ([9428902](https://github.com/tomtom-international/maps-sdk-js/commit/9428902605299302fdbb206f22a514e6761d0716))
* improvements in places module themes ([c287856](https://github.com/tomtom-international/maps-sdk-js/commit/c2878560f453e71a66f039cfe22f9e4b7322a577))


### Bug Fixes

* dynamic import ApplicationInsights to avoid adblocker crash ([98cc8bc](https://github.com/tomtom-international/maps-sdk-js/commit/98cc8bc0ccf4221134a61d8ef2719c9f381bc6df))
* escape $web variable reference in upload step echo ([92ec7f1](https://github.com/tomtom-international/maps-sdk-js/commit/92ec7f13366e02d0eef9bdd758ffd3f4e104888b))
* LSI-259 Fix tests that were failing because API changed response from 403 to 401 ([6c5c3ec](https://github.com/tomtom-international/maps-sdk-js/commit/6c5c3ecd3e6c7212266f5d9c63da3d0b0d52b8c3))
* LSI-265 Fix branch name sanitation in 'Publish Examples' step ([d9cfddd](https://github.com/tomtom-international/maps-sdk-js/commit/d9cfddd49e38537da3197fc4d341e39c5927d39d))

## [0.46.13](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.12...v0.46.13) (2026-04-14)


### Features

* upgrade maplibre dependency ([6a419c6](https://github.com/tomtom-international/maps-sdk-js/commit/6a419c6b70bff10588b11c4b3ea0fbefd5e20e18))


### Bug Fixes

* exporting map agent from plugins so it's included in API reference ([90a7bf9](https://github.com/tomtom-international/maps-sdk-js/commit/90a7bf971a62190f36a35df6b2198e19c3dcba3e))
* rename map-agent plugin to agent-toolkit ([535b0f5](https://github.com/tomtom-international/maps-sdk-js/commit/535b0f57c1b3ec2fedae70a351b52463594ebebe))
* update agent toolkit link in readme ([8659362](https://github.com/tomtom-international/maps-sdk-js/commit/86593623e7e790fdc7c2a89b70d7292076b53aa5))
* update mobile breakpoint for chat agent demos ([7514420](https://github.com/tomtom-international/maps-sdk-js/commit/751442031e9b1e3a2b7a25f8192c1db5c9b5e763))

## [0.46.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.11...v0.46.12) (2026-04-10)


### Bug Fixes

* missing example images ([ddf05a5](https://github.com/tomtom-international/maps-sdk-js/commit/ddf05a5d174f81228133db1a4e7aa79fff80e36a))

## [0.46.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.10...v0.46.11) (2026-04-10)


### Bug Fixes

* examples type exports ([7878115](https://github.com/tomtom-international/maps-sdk-js/commit/7878115d49806b1bffbedc7bc0eb63d278f32cc4))

## [0.46.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.9...v0.46.10) (2026-04-10)


### Features

* add traffic area analytics tools to map agent ([f9a6fd0](https://github.com/tomtom-international/maps-sdk-js/commit/f9a6fd0fe7fcaa68ab000eb073ee08367324214d))
* enable ai-agent plugin for release ([00a69c8](https://github.com/tomtom-international/maps-sdk-js/commit/00a69c84f4393b1a3736344d2784e761f54335c3))
* enhance traffic area analytics with improved filter handling and validation ([b8c9780](https://github.com/tomtom-international/maps-sdk-js/commit/b8c97801b5fec43e32d302369dfb8ba68573afd1))
* expand TrafficAreaAnalyticsModule API with tiles mode, filtering, custom styling, and tooltip ([85fac97](https://github.com/tomtom-international/maps-sdk-js/commit/85fac97a3bbd734b15db0a3bec3380e04e8dd563))
* improve mobile view for chat ([e8ea74b](https://github.com/tomtom-international/maps-sdk-js/commit/e8ea74b6764f0b014ccb5664c2c69283697d7519))
* new module events to react to config changes and shown features ([28e295e](https://github.com/tomtom-international/maps-sdk-js/commit/28e295ea1a36cf85361469a1210434684e6d7689))
* parameterize tool registry with unified ToolMetadata and MapAgentTool types ([5d599a8](https://github.com/tomtom-international/maps-sdk-js/commit/5d599a83aa819b44ea7f586af56fff9ce67b1a96))
* remove canvas area analytics chart from main sdk, ported to example using html elements instead of canvas ([2fd5513](https://github.com/tomtom-international/maps-sdk-js/commit/2fd55130856bb5a505a1bd04618b23c94deb0df8))
* traffic area analytics configuration improvements ([80cef2f](https://github.com/tomtom-international/maps-sdk-js/commit/80cef2f7c69896c4299bf528d85e08402d028f23))
* traffic area analytics configuration improvements ([50f6d44](https://github.com/tomtom-international/maps-sdk-js/commit/50f6d4427b51a461d88bebb99e83cedd6aa664dd))


### Bug Fixes

* ai plugin docs diagrams ([bbbf011](https://github.com/tomtom-international/maps-sdk-js/commit/bbbf011fd39ec0b82e455891fe6b3f601f8a0a72))
* disambiguate traffic tools, add analytics to clearMap, fix restoration race ([ca528b7](https://github.com/tomtom-international/maps-sdk-js/commit/ca528b73671c3a0cdffb8aa32c982f4a2fe53b9a))
* mobile speech input continuous ([d1da271](https://github.com/tomtom-international/maps-sdk-js/commit/d1da2710c558bd0187a7088d1c26816dca6d79da))
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup ([dab7d79](https://github.com/tomtom-international/maps-sdk-js/commit/dab7d7912892f76e256d677c9ed416c1f1bc447c))

## [0.46.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.8...v0.46.9) (2026-03-30)


### Features

* add internal optional metadata header ([cc1d522](https://github.com/tomtom-international/maps-sdk-js/commit/cc1d522448cd3dcaabd810f8732bbf414744c71e))

## [0.46.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.7...v0.46.8) (2026-03-27)


### Features

* add traffic area analytics example with configuration and visualization options ([61e50f9](https://github.com/tomtom-international/maps-sdk-js/commit/61e50f9898f7c75c2a9c97aef81e4ffdd4ed4741))
* **ai-eval, map-chat-agent:** extend eval harness and update eval cases ([f06cf91](https://github.com/tomtom-international/maps-sdk-js/commit/f06cf91cae4daf8aad9394cdc2dcc632bc0eb297))
* ensure area analytics dates start at least 2 days before the current day ([99b98b0](https://github.com/tomtom-international/maps-sdk-js/commit/99b98b0ba12f17e0958493fd486e1c3a43b7e11b))
* improve circle theme visuals with dynamic POI sizing and unified centered-icon offset logic ([ae3700b](https://github.com/tomtom-international/maps-sdk-js/commit/ae3700bf2fc51b40dc273d8787dcec7bc476f75d))
* **map-agent:** add extension tools and map-data-agent example ([b6bbb24](https://github.com/tomtom-international/maps-sdk-js/commit/b6bbb241d004ab50a554c3c9d98299957de03ffc))
* **map-agent:** redesign core tool layer ([9b341cc](https://github.com/tomtom-international/maps-sdk-js/commit/9b341cc4137b5b4124f3f070c45f11f3363b3c44))
* **map-agent:** switch focusOnPlace from geocode to search, add biasPosition ([218f964](https://github.com/tomtom-international/maps-sdk-js/commit/218f9643e3c103389511565f7add9f0094a6b3dd))
* show area analytics hexagons below place labels ([005c568](https://github.com/tomtom-international/maps-sdk-js/commit/005c568b2508f8ff42f7ab4698056601751fba7b))


### Bug Fixes

* **map-agent:** fix P0/P1/P2 tool bugs and design weaknesses ([51274db](https://github.com/tomtom-international/maps-sdk-js/commit/51274db17207911b30eb2445a63b1f6bc733c87e))
* maplibre version reliability in SDK built examples ([15752e4](https://github.com/tomtom-international/maps-sdk-js/commit/15752e4e38e8ccebffd9f51e5e8768cc642907cb))
* poi category codes and mappings, and formatting ([a052455](https://github.com/tomtom-international/maps-sdk-js/commit/a05245559bec8c698441288a15c02bec95c45d57))
* traffic area analytics layer id inits ([c5909cc](https://github.com/tomtom-international/maps-sdk-js/commit/c5909ccec7d4dd0408c65ba72eb8c0531b1a767d))

## [0.46.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.6...v0.46.7) (2026-03-20)


### Features

* add area analytics module with visualization layers and utilities ([3d3c4f4](https://github.com/tomtom-international/maps-sdk-js/commit/3d3c4f49431dff0591978c59786a5eed50203979))
* add color scheme selector and update legend functionality in TrafficAreaAnalyticsModule ([1b6aa8c](https://github.com/tomtom-international/maps-sdk-js/commit/1b6aa8ce5b89b5da2ccbf9220a7b7255b86f903c))
* add color scheme support for TrafficAreaAnalyticsModule and related components ([12d9d84](https://github.com/tomtom-international/maps-sdk-js/commit/12d9d8484d342c554bbe3c56c7000140a8e0c3ee))
* add integration tests and data for TrafficAreaAnalyticsModule following pr comments ([624957b](https://github.com/tomtom-international/maps-sdk-js/commit/624957ba6b36239ffeb28196f36cf4bb0e6d8ae7))
* add layer ID properties for explicit access in TrafficAreaAnalyticsModule ([9710674](https://github.com/tomtom-international/maps-sdk-js/commit/97106747e380c2e07a586a2d82ed351cb4c8af64))
* add theme propertie to RoutingModule and set-route-theme tool ([6c4833b](https://github.com/tomtom-international/maps-sdk-js/commit/6c4833b20f96397d5febb4da1dbe4e678625f8ab))
* add traffic area analytics example with city search and hex grid ([cb034ab](https://github.com/tomtom-international/maps-sdk-js/commit/cb034abf36c11596820dd70c549deebd58c7ca55))
* add TrafficAreaAnalyticsModule with hexgrid and heatmap layers ([cabe919](https://github.com/tomtom-international/maps-sdk-js/commit/cabe919a35d724ee1d0eae728600596dc5127f9e))
* add TrafficAreaAnalyticsModule with visualization layers ([e8a1386](https://github.com/tomtom-international/maps-sdk-js/commit/e8a1386086e715cda686ea316f85d388e9e3f03d))
* derive outline color from mainColor, update waypoint icons at runtime ([4a8e593](https://github.com/tomtom-international/maps-sdk-js/commit/4a8e593ac6d1ecf5dbeb27c819145e2b89db1589))
* remove hexTransform module and simplify analytics display logic ([f25f224](https://github.com/tomtom-international/maps-sdk-js/commit/f25f224058b8f635a4ba2918c7cbe1a9f9247f81))


### Bug Fixes

* add type annotation for madridCenter in TrafficAreaAnalyticsModule tests ([4ae92c5](https://github.com/tomtom-international/maps-sdk-js/commit/4ae92c51e11033ac9ba15291be9001eaf13f322e))
* migrate reachable range service from V3 to V2 API and update docs link ([6543c10](https://github.com/tomtom-international/maps-sdk-js/commit/6543c1036936876c39606c7774f0624d91b36310))
* omit tomtom-user-agent header for area analytics requests (CORS) ([e545b59](https://github.com/tomtom-international/maps-sdk-js/commit/e545b597813d1596eb9cf6e6a50db0a24a95b758))
* resolve lint errors and remove non-null assertions ([5dd3424](https://github.com/tomtom-international/maps-sdk-js/commit/5dd3424631a06498ba2a4b74a858b5d16a18e3d6))
* restore .npmrc before creating pull request ([143da4c](https://github.com/tomtom-international/maps-sdk-js/commit/143da4c4de981d50e6a9e6440e9de5591b9571c9))
* wait ForMapIdle race condition ([dd84fdc](https://github.com/tomtom-international/maps-sdk-js/commit/dd84fdcc26d7edcca8373a03a84d23efad2b2ea1))

## [0.46.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.5...v0.46.6) (2026-03-17)


### Bug Fixes

* dep and sandpack upgrades ([0c893f1](https://github.com/tomtom-international/maps-sdk-js/commit/0c893f1c3953c731bd5eff575d8e857066b73ea4))

## [0.46.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.4...v0.46.5) (2026-03-17)


### Bug Fixes

* add thumbnails for nodejs examples ([de8c4ed](https://github.com/tomtom-international/maps-sdk-js/commit/de8c4ed17163f1e982b11805401455629e5b8211))

## [0.46.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.3...v0.46.4) (2026-03-17)


### Bug Fixes

* sandpack examples relying on Set logic ([ada3d81](https://github.com/tomtom-international/maps-sdk-js/commit/ada3d811407200c1e2220e5a81f4a6dfa3e00242))

## [0.46.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.2...v0.46.3) (2026-03-17)


### Features

* along route search service with examples, docs and minor refactorings ([bca128f](https://github.com/tomtom-international/maps-sdk-js/commit/bca128fe3e122be4dbc6a19701bacfdb8e94080b))
* along route search service with examples, docs and minor refactorings ([fcef902](https://github.com/tomtom-international/maps-sdk-js/commit/fcef902167d51c61d26dfd104e8e929b7fe854d9))


### Bug Fixes

* ensure geometry search and along route search cannot accept position params ([b065378](https://github.com/tomtom-international/maps-sdk-js/commit/b065378f2f08a5bbbbac2e3d362e116c06263d1d))

## [0.46.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.1...v0.46.2) (2026-03-16)


### Features

* add context7 json to help manage ai assisted coding ([7ce7c17](https://github.com/tomtom-international/maps-sdk-js/commit/7ce7c179394471c8778828622ae8c8cec8d8ed6c))

## [0.46.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.0...v0.46.1) (2026-03-13)


### Features

* add skills for agents to develop with the SDK ([cc30803](https://github.com/tomtom-international/maps-sdk-js/commit/cc30803e1c7e626bae2ecd6239296427687f9d58))
* enhance documentation for map agent and setup with new examples and boilerplate ([d75af32](https://github.com/tomtom-international/maps-sdk-js/commit/d75af3225ba6331142976cc980d323881ea40240))
* make tool-activation opt-out ([1a3f980](https://github.com/tomtom-international/maps-sdk-js/commit/1a3f9808aa252b3b9a44139712f313e5cf8a68d1))


### Bug Fixes

* ensure traffic area analytics report name ([2bb9a5b](https://github.com/tomtom-international/maps-sdk-js/commit/2bb9a5b21d1719df23ece7fcb387ca702178cb73))
* poi category codes agent tool reliability with languages ([5bac87d](https://github.com/tomtom-international/maps-sdk-js/commit/5bac87d6e53c8089aab2bd4ee56042ab4a3023b9))

## [0.46.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.12...v0.46.0) (2026-03-12)


### ⚠ BREAKING CHANGES

* improve poi categories relationship with search

### Features

* improve poi categories relationship with search ([52f5a26](https://github.com/tomtom-international/maps-sdk-js/commit/52f5a265dbe0ae4cbb3386de3740cb887ed1a11c))
* traffic area analytics lite service ([e3208bb](https://github.com/tomtom-international/maps-sdk-js/commit/e3208bb3210fdb5c13a163a69ac3f397fca6d165))

## [0.45.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.11...v0.45.12) (2026-03-04)


### Bug Fixes

* missing example thumbnail ([376d2ae](https://github.com/tomtom-international/maps-sdk-js/commit/376d2aeb98fc1a875e9dfe59af04dc1e64862441))

## [0.45.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.10...v0.45.11) (2026-03-03)


### Features

* add avoid areas parameter for route calculations ([301c108](https://github.com/tomtom-international/maps-sdk-js/commit/301c1084c74bd9f7c8132524cb3806589300f264))
* add avoid areas parameter for route calculations ([92d622a](https://github.com/tomtom-international/maps-sdk-js/commit/92d622a5ae0c954039ece72bc5554539d53e3892))
* add intent-based classification and selective tooling with tool groups and step scope ([b49f2b4](https://github.com/tomtom-international/maps-sdk-js/commit/b49f2b48c1261990e5d25c4ff0aa267e57d971d8))
* improve pois and traffic map feature mappings ([3cc9648](https://github.com/tomtom-international/maps-sdk-js/commit/3cc96486b2f591308436e2e8e3a4cd892e3b98c1))
* improve pois and traffic map feature mappings ([3ea4c79](https://github.com/tomtom-international/maps-sdk-js/commit/3ea4c794597fb047bec5632a3c773e6609d15a39))
* multiple agent tool improvements ([2bc0945](https://github.com/tomtom-international/maps-sdk-js/commit/2bc09455bfaa4c50098daab246774ea2bf091e25))


### Bug Fixes

* clear geometry labels property ([5fba21b](https://github.com/tomtom-international/maps-sdk-js/commit/5fba21b833a33b341955cab3b7a80d29bb3dfa9e))
* geometries label size ([f01c4d6](https://github.com/tomtom-international/maps-sdk-js/commit/f01c4d626506847357ade61e1a4c6b2f1e111941))
* remove unused section props ([fd49b6e](https://github.com/tomtom-international/maps-sdk-js/commit/fd49b6e47fcb12d91a83a1c335c9824c42224e36))
* routing module incident events type ([fe0be16](https://github.com/tomtom-international/maps-sdk-js/commit/fe0be16344c6c4e52eb00b6ef07492d8dc4ab259))
* switch from geojsonobject to geojson types for correctness ([119816b](https://github.com/tomtom-international/maps-sdk-js/commit/119816b40ead3cf6081f319d8a6c006980c3ecf3))

## [0.45.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.9...v0.45.10) (2026-02-26)


### Features

* improve traffic details service parameters and documentation ([ca8e026](https://github.com/tomtom-international/maps-sdk-js/commit/ca8e0267dd11b6a899f5c4b254015913d50a60d0))

## [0.45.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.8...v0.45.9) (2026-02-26)


### Features

* improve inverted theme support for reachable ranges, migrate examples to use theme: 'inverted' ([5bd9c93](https://github.com/tomtom-international/maps-sdk-js/commit/5bd9c93ccc8cfce5b143da3f12a09d165af2eb6b))
* incident details service improvements and added agent tools ([9f3058d](https://github.com/tomtom-international/maps-sdk-js/commit/9f3058dd55fde278ea8d8b58ddb223c354dd9ada))
* traffic incident details service ([202d513](https://github.com/tomtom-international/maps-sdk-js/commit/202d51337cc0a45b2dd03474f8c155a3dc3e7eb9))

## [0.45.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.7...v0.45.8) (2026-02-24)


### Bug Fixes

* ensure reachable ranges is visible on docs portal ([f10675a](https://github.com/tomtom-international/maps-sdk-js/commit/f10675a170d6e7cfe8b73b29a921e210a3f0bae3))

## [0.45.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.6...v0.45.7) (2026-02-24)


### Features

* add themed geometry config and make reachable-ranges zero-plumbing geometry display ([75b0b2d](https://github.com/tomtom-international/maps-sdk-js/commit/75b0b2da243c0e7b51635c841301ec709e8bc4a6))
* reinstate displayReachableRanges and reachable-ranges example, allowing custom multi-budget-type, palette, and theme support ([ff5ef71](https://github.com/tomtom-international/maps-sdk-js/commit/ff5ef716cad6a423c6df955a634b4c781fb2519e))
* typed features for map traffic incidents and flow, with extra properties ([4c5f25d](https://github.com/tomtom-international/maps-sdk-js/commit/4c5f25d822b80df97b81ea6027c8b6e241e2c2e6))


### Bug Fixes

* remove roadShieldReferences guidance param — road shields are requested via sectionTypes, and are included by default ([dca539b](https://github.com/tomtom-international/maps-sdk-js/commit/dca539b5c04b91a79cfa47273c413edee342b6ce))

## [0.45.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.5...v0.45.6) (2026-02-23)


### Features

* opt-out visibility for route summary bubbles ([429c214](https://github.com/tomtom-international/maps-sdk-js/commit/429c214fa9d2416b3dc205df89d1d72b2ad781bc))


### Bug Fixes

* pois module feature mappings and type fixes ([7e59a24](https://github.com/tomtom-international/maps-sdk-js/commit/7e59a24fbdbd525e1d94c87036d05924bb28ff03))

## [0.45.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.4...v0.45.5) (2026-02-20)


### Features

* add new get section progress tool, and improve existing tools ([046264c](https://github.com/tomtom-international/maps-sdk-js/commit/046264cadb463ef5f1b2e856997f6d3ef5c5ad13))
* core utilities related to routes and tool description improvements ([a207053](https://github.com/tomtom-international/maps-sdk-js/commit/a207053638dbc34ffe8d440118b418b1d638a489))
* new hover-move event type which keeps firing as you move the pointer over the relevant features ([1ffc433](https://github.com/tomtom-international/maps-sdk-js/commit/1ffc433612b34397af242351ab1d226323ca5682))
* new utility to find route progress matching a nearby arbitrary location ([a0e3e0d](https://github.com/tomtom-international/maps-sdk-js/commit/a0e3e0d4e8ad69d874bc2d1099da65f585386772))
* refactor core utility guides and add new example for add stops to route ([137e4d9](https://github.com/tomtom-international/maps-sdk-js/commit/137e4d9515668acaaaf996a74029c0d8c86cb099))


## [0.45.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.3...v0.45.4) (2026-02-17)

## [0.45.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.2...v0.45.3) (2026-02-17)

## [0.45.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.1...v0.45.2) (2026-02-17)

### Features

* add shared CSS design system and reusable HTML templates for examples ([5d5e77b](https://github.com/tomtom-international/maps-sdk-js/commit/5d5e77bb95ba2d47ef87533edaf894780a9c8860))
* add template CSS inlining and local SDK dependency resolution to Sandpack ([d16d9b6](https://github.com/tomtom-international/maps-sdk-js/commit/d16d9b6f863d12b69033be350fac84ecbf5b1e2d))
* migrate all examples to use the shared CSS design system ([76f42f9](https://github.com/tomtom-international/maps-sdk-js/commit/76f42f90304e4db4b7061f91120d1632b6c4f0f5))
* zod and lodash are now peer dependencies, not bundled in sdk anymore ([e7dbce5](https://github.com/tomtom-international/maps-sdk-js/commit/e7dbce52d73372087fc6a38cd5a1eae499223e11))


### Bug Fixes

* update Playwright config for Chrome for Testing WebGL support and refresh snapshots ([05d644f](https://github.com/tomtom-international/maps-sdk-js/commit/05d644f82857ce6f828394a6f5bebb569d895ad4))

## [0.42.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.1...v0.42.2) (2026-02-06)


### Bug Fixes

* ensure map theme switching is smooth ([f5ce208](https://github.com/tomtom-international/maps-sdk-js/commit/f5ce208d1dfbc725e68ce2b57d4f20adafac1c06))

## [0.42.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.0...v0.42.1) (2026-02-03)


### Features

* add traffic incident playground example ([f5dc3ea](https://github.com/tomtom-international/maps-sdk-js/commit/f5dc3eacffc13549b098838fffedc1bd8d460f5f))


### Bug Fixes

* enable documentation indexing ([0af5d75](https://github.com/tomtom-international/maps-sdk-js/commit/0af5d75c356ed4ad5cbca07454d0c182a7621954))
* filter by incidents by magnitude_of_delay ([7e99da9](https://github.com/tomtom-international/maps-sdk-js/commit/7e99da917e1ce9caeef37f4d85b2a91d8051db9b))
* omit bounding box and position from search options in viewport places plugin since they should be automatically set ([a2ffd50](https://github.com/tomtom-international/maps-sdk-js/commit/a2ffd503c58cbf0c17c678b54cf6f83d8074936f))

## [0.42.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.8...v0.42.0) (2026-01-30)


### Features

* **viewport-places:** improve types ([817678e](https://github.com/tomtom-international/maps-sdk-js/commit/817678e6d280560307bfb445bf183136aca69a41))


### Bug Fixes

* viewport places plugin example ([836abdd](https://github.com/tomtom-international/maps-sdk-js/commit/836abdd73e6fc4bb4829c7bb725521e149bf1db3))


## [0.41.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.7...v0.41.8) (2026-01-30)


### Bug Fixes

* viewport places plugin example ([836abdd](https://github.com/tomtom-international/maps-sdk-js/commit/836abdd73e6fc4bb4829c7bb725521e149bf1db3))

## [0.41.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.6...v0.41.7) (2026-01-30)


### Bug Fixes

* improve release workflow and update documentation ([905a7ed](https://github.com/tomtom-international/maps-sdk-js/commit/905a7ed0f3770ce51ac2937a948ef4ad6b8bfcaa))

## [0.41.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.5...v0.41.6) (2026-01-30)


### Features

* **viewport-places:** improve types ([817678e](https://github.com/tomtom-international/maps-sdk-js/commit/817678e6d280560307bfb445bf183136aca69a41))

## [0.41.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.4...v0.41.5) (2026-01-30)


### Features

* **viewport-places:** improve TSDocs ([01ced36](https://github.com/tomtom-international/maps-sdk-js/commit/01ced36e895f679e0f92f2241d9442c9415e0eb2))

## [0.41.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.3...v0.41.4) (2026-01-30)


### Bug Fixes

* missing [@ignore](https://github.com/ignore) for internal routing variable ([3d0651d](https://github.com/tomtom-international/maps-sdk-js/commit/3d0651d38cbba4768dbf93c76858950f10b9a51b))
* missing tsdoc group for type ([c979606](https://github.com/tomtom-international/maps-sdk-js/commit/c9796067f7fb1dabda579ca4d086369da3f198c3))

## [0.41.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.2...v0.41.3) (2026-01-29)


### Features

* simplify viewport places method name, and improve api reference docs ([46c7de1](https://github.com/tomtom-international/maps-sdk-js/commit/46c7de1f504839a796d8052567069b5d87ccdb0b))
* upgrade deps ([a290b02](https://github.com/tomtom-international/maps-sdk-js/commit/a290b02770dfa80b54fe32ed0c2758c7b42d2ec3))

## [0.41.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.1...v0.41.2) (2026-01-29)


### Features

* add availability-aware custom EV icons to example ([99a7c22](https://github.com/tomtom-international/maps-sdk-js/commit/99a7c229e1dd79fb05f0e23a62121a70649c20ae))
* add EV availability icon selection with custom icon support ([64340fe](https://github.com/tomtom-international/maps-sdk-js/commit/64340fed1dcb4660c71a3ee780b807601408ff42))
* add EVAvailabilityConfig type with opt-in configuration ([6a7d8b5](https://github.com/tomtom-international/maps-sdk-js/commit/6a7d8b578d6d02c355462ec6575087587aa06d05))
* add plugins workspace with first plugin to easily display search-powered layers of places on the map ([eac82a2](https://github.com/tomtom-international/maps-sdk-js/commit/eac82a2ebe731e87463564eb5e1331089ca1cc70))
* add theme awareness and availability-level icon image handling to PlacesModule ([62f0859](https://github.com/tomtom-international/maps-sdk-js/commit/62f0859671242f58b5ade2efc6b710944afdc720))
* enhance EV custom display example with theme switching and improved controls ([5da5f20](https://github.com/tomtom-international/maps-sdk-js/commit/5da5f20af6634cb6ba3f16fb59c4ff0af3fd7a34))
* implement EV availability display in layer specs ([2f737a2](https://github.com/tomtom-international/maps-sdk-js/commit/2f737a2a9cded78e1d52d8a06d0e62f4efb5d438))
* rename ev playground to search ([5b19771](https://github.com/tomtom-international/maps-sdk-js/commit/5b19771765584305ff900c7d0c70e30d364e9ab5))


### Bug Fixes

* make StyleChangeHandler callbacks optional ([35339ca](https://github.com/tomtom-international/maps-sdk-js/commit/35339ca0927474314bd2222c5dcc30d832552da7))
* try to fail gracefully when some layers cannot be added in map modules, likely due to misconfiguration ([afa586e](https://github.com/tomtom-international/maps-sdk-js/commit/afa586e03e1a4d7c72f4b72fb1fab46bfeaa018a))

## [0.41.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.0...v0.41.1) (2026-01-16)


### Bug Fixes

* **examples:** import in ev-charging-stations-playground ([2d66e62](https://github.com/tomtom-international/maps-sdk-js/commit/2d66e62f948658abd652042ffaca5431c93d9966))

## [0.41.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.1...v0.41.0) (2026-01-16)


### ⚠ BREAKING CHANGES

* merge mapParams and mapLibreOptions
* **ev-search:** merge connectors and connectorCounts
* **ev-search:** getPlacesWithEvAvailability return type

### Bug Fixes

* css responsiveness ([37b0c8b](https://github.com/tomtom-international/maps-sdk-js/commit/37b0c8b7e01e36893f3acde03fbfbdb09d30ac0e))
* **ev-search:** getPlacesWithEvAvailability return type ([1a8134c](https://github.com/tomtom-international/maps-sdk-js/commit/1a8134cc16fb7a3701b09ef13a6897dd158ad861))


### Code Refactoring

* **ev-search:** merge connectors and connectorCounts ([352c404](https://github.com/tomtom-international/maps-sdk-js/commit/352c404abea41e407e2060ac74fe6b3a1fa64794))
* merge mapParams and mapLibreOptions ([3756aaf](https://github.com/tomtom-international/maps-sdk-js/commit/3756aafdf1b23f9af8a07a72b8ee388aade789e6))

## [0.40.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.0...v0.40.1) (2026-01-08)


### Bug Fixes

* calculate padded bboxes correctly if any of the surrounding elements goes beyond the visible screen ([6083ceb](https://github.com/tomtom-international/maps-sdk-js/commit/6083ceb25aab9a404c111802a68503e3b8b26225))
* ensure map style parts which were excluded are loaded more robustly ([33e74ff](https://github.com/tomtom-international/maps-sdk-js/commit/33e74ff8804c3acd63b71d6b8c7c335b0a0f2891))

## [0.40.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.39.0...v0.40.0) (2026-01-07)


### Features

* new padded bbox calculation utilities for map bundle ([7b686e0](https://github.com/tomtom-international/maps-sdk-js/commit/7b686e022a0035988db773e123bed0582b851823))
* new polygonFromBBox core utility ([ada872d](https://github.com/tomtom-international/maps-sdk-js/commit/ada872d9f76ea0a4f9dc4fd7b3132b568213e59d))
* sdk upgrade ([42ab185](https://github.com/tomtom-international/maps-sdk-js/commit/42ab185898820c60cb003b914a15d244324cb75b))

## [0.39.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.1...v0.39.0) (2026-01-06)


### Features

* add live coding for few guides ([05b3876](https://github.com/tomtom-international/maps-sdk-js/commit/05b3876cb6791e65fff5c6a990191b88f89fe6fc))
* new map style switcher example ([efdbbdd](https://github.com/tomtom-international/maps-sdk-js/commit/efdbbdd3006508114f9dd178fcc48d8bb62858ca))


### Bug Fixes

* simplify how sandpack examples are exposed ([3f75204](https://github.com/tomtom-international/maps-sdk-js/commit/3f752040d2f7f39f15e894fb6174645ef725b25a))

## [0.38.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.0...v0.38.1) (2025-12-17)


### Bug Fixes

* quickstart guide link text ([0c10c13](https://github.com/tomtom-international/maps-sdk-js/commit/0c10c13b00054ccc895db63ea64337d8675d502a))

## [0.38.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.37.0...v0.38.0) (2025-12-17)


### Features

* improve bbox types for places, routes and geometries ([602fa50](https://github.com/tomtom-international/maps-sdk-js/commit/602fa50025c71d4351a96beb5ed8fb742af27df1))

## [0.37.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.9...v0.37.0) (2025-12-16)


### Features

* improve bbox types for places and routes so they reflect 4-dimensional types ([bc80e1d](https://github.com/tomtom-international/maps-sdk-js/commit/bc80e1d0cfd4ca0c8d73dc232938f1e2b05adc15))
* optional events configuration for each map module ([ca823b3](https://github.com/tomtom-international/maps-sdk-js/commit/ca823b367ea2fa123ec0baf3dee3b8d2ce386de4))


### Bug Fixes

* add sandpack wrapper for each example ([bbe3a7c](https://github.com/tomtom-international/maps-sdk-js/commit/bbe3a7cc1b1ce2cf34d243811ab5898bbf143e2d))
* move sandpack local preview inside sandpack folder ([8fe88dc](https://github.com/tomtom-international/maps-sdk-js/commit/8fe88dcd4a555d0ff85f6b908c2aaf559d3542bf))
* use release please version in tests ([28ebc9b](https://github.com/tomtom-international/maps-sdk-js/commit/28ebc9bc99e4f544ae42fc078a8f864caf50a7ff))
* use vite to resolve dependencies and examples map ([ce5356e](https://github.com/tomtom-international/maps-sdk-js/commit/ce5356e03316c234d3f2d6beb3f911b09b415cd7))

## [0.36.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.8...v0.36.9) (2025-12-11)


### Bug Fixes

* upgrade deps ([dc382f9](https://github.com/tomtom-international/maps-sdk-js/commit/dc382f972a1c140a6849de3314ac11d2379d4231))

## [0.36.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.7...v0.36.8) (2025-12-11)


### Bug Fixes

* upgrade deps ([ee9437f](https://github.com/tomtom-international/maps-sdk-js/commit/ee9437fa3189b0a26201b32c49dab07294a1a884))

## [0.36.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.6...v0.36.7) (2025-12-11)


### Bug Fixes

* consistency with naming map module instance variables ([639ecdd](https://github.com/tomtom-international/maps-sdk-js/commit/639ecdd6eef1fc5ba4c365d678bd24ff986c0f36))

## [0.36.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.5...v0.36.6) (2025-12-10)


### Bug Fixes

* remove leftover console logs ([c225d2e](https://github.com/tomtom-international/maps-sdk-js/commit/c225d2eff60cac35a0a3e104246cad9486bcacac))

## [0.36.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.4...v0.36.5) (2025-12-09)


### Bug Fixes

* type exports ([60fe138](https://github.com/tomtom-international/maps-sdk-js/commit/60fe138823f5a3bb4110a1ecc0eca95427978319))

## [0.36.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.3...v0.36.4) (2025-12-08)


### Bug Fixes

* regression fix for additional layers vs multiple routing modules support ([8ef6ded](https://github.com/tomtom-international/maps-sdk-js/commit/8ef6ded477c406555665f1f466169c29aa23778b))
* regression fix regarding unnecessarily suffixing custom images in routing module instances ([2389813](https://github.com/tomtom-international/maps-sdk-js/commit/238981348d3381ac14527739d91eb9c71dc42623))

## [0.36.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.2...v0.36.3) (2025-12-08)


### Bug Fixes

* prevent querying features without passing any layers ([455c2c3](https://github.com/tomtom-international/maps-sdk-js/commit/455c2c3342f0dd2702949234b3434e2e88fb8662))

## [0.36.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.1...v0.36.2) (2025-12-08)


### Bug Fixes

* example content hotfix ([b8f1b83](https://github.com/tomtom-international/maps-sdk-js/commit/b8f1b834dc026f813df80dee3cfcebc13e47b069))
* simplify and improve category mappings for places ([3cb8095](https://github.com/tomtom-international/maps-sdk-js/commit/3cb809513ca859165acac712c14e5ba8aa477c9f))

## [0.36.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.0...v0.36.1) (2025-12-08)


### Bug Fixes

* simplify and improve category mappings for places ([62cb0dc](https://github.com/tomtom-international/maps-sdk-js/commit/62cb0dcdad8c3ec1f6ea4d088cc3abcfeea6c4ef))

## [0.36.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.5...v0.36.0) (2025-12-05)


### Features

* multiple routing module instances possible, including two new examples ([ba0ff53](https://github.com/tomtom-international/maps-sdk-js/commit/ba0ff53e67b7e29faa2dcf2a6581917cbd069691))


### Bug Fixes

* ensure feature ids and feature properties ids are always set ([8aeae8d](https://github.com/tomtom-international/maps-sdk-js/commit/8aeae8d4eb4943cb3413e8a0e5f6163180add13d))

## [0.35.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.4...v0.35.5) (2025-12-04)


### Bug Fixes

* skip validating styles when changing them for performance ([24a9490](https://github.com/tomtom-international/maps-sdk-js/commit/24a9490699da6383871f97f853a6cc1b5824f40e))
* upgrade maplibre dependency and ensure place properties always have id ([cf3d8ae](https://github.com/tomtom-international/maps-sdk-js/commit/cf3d8ae912bb677ced8acc28a55d8dd4f518a165))

## [0.35.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.3...v0.35.4) (2025-12-03)


### Bug Fixes

* use right icon for toll roads along routes ([9cb2144](https://github.com/tomtom-international/maps-sdk-js/commit/9cb21444a09d46eb367235d393fde095a0111c40))

## [0.35.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.2...v0.35.3) (2025-12-03)


### Bug Fixes

* custom image loading reliability across different browsers ([cd985d5](https://github.com/tomtom-international/maps-sdk-js/commit/cd985d58b2a5712f21dd1166c94154a10939b4a0))

## [0.35.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.1...v0.35.2) (2025-12-03)


### Bug Fixes

* rev geo playground init ([1e4356d](https://github.com/tomtom-international/maps-sdk-js/commit/1e4356d64f53d584771f93ba6c57b8a79c4cda71))

## [0.35.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.0...v0.35.1) (2025-12-03)


### Bug Fixes

* mitigation to try to be more reliable on detecting that maplibre css was already loaded ([755d7a0](https://github.com/tomtom-international/maps-sdk-js/commit/755d7a05fe6c08ab6f731e61b34178257d6548d5))
* remove noisy console warnings when deserializing potential JSON from features ([729405d](https://github.com/tomtom-international/maps-sdk-js/commit/729405dd03bc0509e455131249a862f38f868697))

## [0.35.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.1...v0.35.0) (2025-12-02)


### Features

* new searchOne convenience function for fast single result searches ([a5447bc](https://github.com/tomtom-international/maps-sdk-js/commit/a5447bcf718b49eca6775ab3c7dd1eb193219508))
* showRoutes in RoutingModule also accepts a single Route now ([e813e6d](https://github.com/tomtom-international/maps-sdk-js/commit/e813e6d7be63da7b0667a67de8995a4722bb866c))
* switching to a simplified BBox type in SDK with only 4 coordinates since we don't use the other 2 and this way we are more compatible with Maplibre ([d613460](https://github.com/tomtom-international/maps-sdk-js/commit/d613460f0e725e470c76fbe43553a44b90500047))


### Bug Fixes

* base map module undefined config consistency ([6163566](https://github.com/tomtom-international/maps-sdk-js/commit/6163566c060e51c34c4f7d5ba8aafe76df14ee34))

## [0.34.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.0...v0.34.1) (2025-12-01)


### Bug Fixes

* add config file to maintain example api key ([b3843c6](https://github.com/tomtom-international/maps-sdk-js/commit/b3843c6c58d582a403529bae0a398af2178590e7))
* move all files for examples under its src folder ([08848c8](https://github.com/tomtom-international/maps-sdk-js/commit/08848c802ebb4a5573942f958be92979c62426c6))
* nodejs examples based on es modules ([b180ba0](https://github.com/tomtom-international/maps-sdk-js/commit/b180ba08bbc729be336cf7adcf80d4ec334a473d))
* use sandpack to preview map in guides ([32be371](https://github.com/tomtom-international/maps-sdk-js/commit/32be371540c52dba85c99c3aed4fabb32a95fc43))

## [0.34.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.33.0...v0.34.0) (2025-11-26)


### Features

* hide fuzzySearch call to avoid overlap with search ([515e753](https://github.com/tomtom-international/maps-sdk-js/commit/515e753f6e1825d1ef90056e352c335c378bd539))
* improve visibility state management in traffic and hillshade modules, fix e2e tests, misc improvements ([908995e](https://github.com/tomtom-international/maps-sdk-js/commit/908995ec15b66d876132b6cd043783c827a5e8b3))
* improvements in PlacesModule and added examples ([9a1f1d8](https://github.com/tomtom-international/maps-sdk-js/commit/9a1f1d8f4adab6e856b826eae2da027178ded31d))
* upgrade sdk dependency ([11de0c7](https://github.com/tomtom-international/maps-sdk-js/commit/11de0c7c40e29a221738d713f1f6794a643093a4))


### Bug Fixes

* types and test data migrated to ts ([1269550](https://github.com/tomtom-international/maps-sdk-js/commit/12695509f73dc8e21e5bba75a64d7b2c1a3d5ad1))

## [0.33.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.3...v0.33.0) (2025-11-20)


### Bug Fixes

* update diagram how-the-sdk-works ([82f70ac](https://github.com/tomtom-international/maps-sdk-js/commit/82f70acf091d7998104738bd3b216a2aa53d5f4d))

## [0.32.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.2...v0.32.3) (2025-11-20)


### Bug Fixes

* route instruction arrows to be above incidents ([e72e3b8](https://github.com/tomtom-international/maps-sdk-js/commit/e72e3b82871e78d1a0b4d60c00cb3d624bdaf8a3))
* update license ([7ec1428](https://github.com/tomtom-international/maps-sdk-js/commit/7ec1428879424df602c34665fcd9806878c930c4))

## [0.32.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.1...v0.32.2) (2025-11-18)


### Bug Fixes

* es exports to prevent having to mention dist in imports ([00cedf3](https://github.com/tomtom-international/maps-sdk-js/commit/00cedf39f6977e8f2f2c766dc2a78e42eb0707c7))

## [0.32.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.31.1...v0.32.0) (2025-11-13)


### Features

* export sdk as es modules only ([1e7d0d9](https://github.com/tomtom-international/maps-sdk-js/commit/1e7d0d99d96320f910529d912b455ce36251560d))
* simplify map style initialization ([6dde7c9](https://github.com/tomtom-international/maps-sdk-js/commit/6dde7c9cea644e5046df19294d94da04a18cd49e))

## [0.31.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.2...v0.31.0) (2025-11-11)


### Features

* improve places module configuration and examples ([674ee83](https://github.com/tomtom-international/maps-sdk-js/commit/674ee83599ce59751e3183b9b3e00569e52cbfd3))
* sdk automatically loads MapLibre CSS if not done by the caller ([626a597](https://github.com/tomtom-international/maps-sdk-js/commit/626a59751c468c6d5deb02ce34779c348ec868f2))
* upgrade to new map style with new traffic incident icons ([1b228b5](https://github.com/tomtom-international/maps-sdk-js/commit/1b228b586a59232765d4c33c05b8b334d5246416))


### Bug Fixes

* search exports and using typeahead true for fuzzy search examples ([8601314](https://github.com/tomtom-international/maps-sdk-js/commit/8601314a4c1f40a364d713bda8e2e7806cf69baa))

## [0.30.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.1...v0.30.2) (2025-11-06)


### Bug Fixes

* example having incorrect references ([695d654](https://github.com/tomtom-international/maps-sdk-js/commit/695d654ac8309ba735db67d190726c6e79db6158))

## [0.30.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.0...v0.30.1) (2025-11-05)


### Bug Fixes

* pin category mapping ([a6aecb8](https://github.com/tomtom-international/maps-sdk-js/commit/a6aecb8569e3865d32ca814684f1c8c8d1f3b3e0))

## [0.30.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.2...v0.30.0) (2025-11-05)


### Features

* enable tomtom user agent headers by default ([30bcc22](https://github.com/tomtom-international/maps-sdk-js/commit/30bcc2264e5cd335c19b8f01699bc20de1141947))


### Bug Fixes

* route example content ([4b56065](https://github.com/tomtom-international/maps-sdk-js/commit/4b56065916e512a7d3ea2d2af00e02fbc17b1c77))

## [0.29.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.1...v0.29.2) (2025-11-04)


### Features

* First Public Preview Release :rocket:
