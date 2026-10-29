# Changelog

## 1.0.0-rc.7

### Patch Changes

- services: a call that adds its own `apiKey` to a request for the configured proxy sends the proxy's session cookie with it, so `trafficAreaAnalytics` with a Move Portal key works from a page on a site other than the proxy's. A call that changes `commonBaseURL` decides on its own merged config

## 1.0.0-rc.6

### Minor Changes

- **Breaking:** map: The attribution shows the TomTom and OpenStreetMap credits as logos, each keeping its credit's link, with any other credit after them as text.
  
  - `attribution` takes `position` (the corner) and `padding` to place the logos. It only places them: no value turns them off or swaps them for plain text
  - The logos are black with a white outline on every style, light and dark
  - A soft, blurred backdrop sits behind the logos so they stand out from map labels. It follows the style's theme across `setStyle`. `backdrop: false` removes it, and the logos stay
  - Your own `credits` follow the logos
  - **Breaking:** CSS or layout code aimed at `.maplibregl-ctrl-attrib` no longer finds the attribution: place the logos clear of your layout with `position` and `padding`
  - examples: `attribution-playground` places the logos in each corner, over every standard style, with or without their backdrop

- **Breaking:** core, services, map: a refused API key reads the same on the map as on a service call, so `PrivatePreviewAccess`, which both errors now carry, is imported from `@tomtom-org/maps-sdk/core`, not `@tomtom-org/maps-sdk/services`
  - core: `APIErrorDetails` declares `apiErrorCode` and `privatePreviewAccess` once, for one function to read a service call's error and the map's alike
  - map: `TomTomMapError` implements it, as `SDKServiceError` does
  - map: a style, tile, sprite or glyph refused with a JSON body names the API's own code in `apiErrorCode`, `'InvalidReferer'` when the key's domain restriction refused the page and `'Forbidden'` when the API isn't enabled for the key, and adds the API's own message to `message`
  - map: the message of a failed style, tile, sprite or glyph request shows the API key in its URL as `key=…`, so the message is safe to log
  - map: a plugin's data that fails to load, such as the Landmarks 3D tiles, reaches `addErrorHandler` as a `TomTomMapError` under the plugin's source, coded by status like the map's own tiles

### Patch Changes

- map: `BaseMapModule` lights up the style's own 3D buildings: `buildings3D.hover` and `buildings3D.click` set the colour a hovered or clicked building turns towards, and `setBuildingColors` gives the buildings you pick by id a colour of their own
  
  - A building reacts while a `BaseMapModule` handler reaches the `buildings3D` group, and stays as drawn while you leave both colours unset
  - A building the map data splits into parts lights up and takes its colour whole, by the id of any of its parts
  - `getBuildingIdAt` names the building standing at a position, to highlight buildings you know by place
  - Features of the base map, the POIs and the traffic tiles now carry their `eventState` as a feature state, for your own `styling.layers` paint to read
  - The 3D buildings' `fill-extrusion-color` is now an expression around the style's colour on every map, so `getPaintProperty` and an exported style return that expression; the style's own colour is its output at intensity 0
  - The four settings are knobs of `baseMapKnobCatalogue`, `buildings3D.{hover,click}.{color,intensity}`
  - The new `base-map-buildings-interaction` example hovers, selects and paints buildings over Midtown Manhattan

- map: `getMapLight` reads where the map's light comes from, as a compass direction and an altitude, so a layer of your own can light its surfaces from the same direction as the 3D buildings
  
  - With neither `view.light.direction` nor `view.light.altitude` set, the light knobs leave MapLibre's position unset, so a colour, intensity or alignment on its own, and a clean style switch, leave `getMapLight` `undefined` instead of writing the 210°/60° default

- services: an unknown POI category logs its id, not the name the service sent

- core: geometry helpers handle routes, boxes and cells across the antimeridian, and a new stop slots into a round trip where it belongs
  
  - core: `bboxFromGeoJSON` gives the narrowest box around shapes on both sides of the antimeridian, and `undefined` for a geometry missing its coordinates
  - core: route positions, owned polygons and hexagon cells wrap past ±180° instead of jumping across the map
  - core: departure, arrival, waypoint, border and tollgate instructions carry no lanes
  - core: `findBestWaypointInsertionIndex` and `withInsertedWaypoints` slot a new stop on a round trip between the right passes of its origin and destination
  - core: `calculateProgressAtRoutePoint`, `getRouteProgressBetween` and `getRouteProgressForSection` return `undefined` for a path index that is no whole number, where they returned `NaN` values
  - core: `formatDuration` rounds a half minute up, and `formatDistance` and `formatDuration` keep the global units for an option left `undefined`
  - core: bundlers drop `TomTomConfig` from an app that never reads it
  - core: a junction's instruction keeps its lanes where a waypoint instruction shares its path point

- map: `setLanguage` also translates style labels that read their name inside an expression, such as POIs, states, peaks and ferries
  
  - map: a sourceless map error is `STYLE_LOAD_FAILED` only while a style loads, and `INTERNAL` otherwise
  - map: colour knobs refuse colour forms MapLibre can't paint, instead of drawing nothing
  - map: `CustomGeoJSONModule.applyConfig` replaces a layer whose type changes instead of throwing
  - map: a failed or superseded style switch finishes cleanly, and a switch to the same style resets knobs and raw edits
  - map: route summary bubbles stay above their route on a rotated map, hidden sections stay hidden, and section icons follow their size knob
  - map: places keep another module's config properties, draw a mapped category icon, and rebuild once per knob batch
  - map: traffic incident icons keep their visibility across config changes, opacities clamp to 0–1, and area analytics grids take regions across the antimeridian
  - map: `setLanguage` relabels only the map style's own labels, so module and app layers keep the text they were given
  - map: `calculateFittingBBox` expands latitudes in Web Mercator, as `fitBounds` frames them, so its south and north move
  - map: a custom `icon.default` image repositions the place labels, a hovered `base-map` place draws once, and a clicked `pin-clustered` micro dot stays drawn
  - map: `invertFeature` shades a polygon's holes, a MultiPolygon's title sits on its outer ring, and an expression `fill.color` falls through to `color`
  - map: shown-features handlers keep firing after one of them unsubscribes
  - map: custom images load from an SVG file's URL, from SVG markup with text past Latin-1 and from another origin that allows CORS
  - map: each `where()` scope over one source keeps its own hover and cursor, `off` also removes the handlers on a source a config change dropped, and an unsubscribe removes only the registration it came from
  - map: routes, places, area analytics and traffic filters reload only the sources a change reaches
  - map: a clean switch to the style already loaded removes the traffic flow and incident filters, as it does the POI ones
  - map: the map look reads a page background the browser reports in `oklch()` as painted
  - map: POI and place category icon offsets apply where the style's own icon offset is a zoom ramp

- services: a `geoBias` with both a point and a bounding box fails validation as `INVALID_REQUEST`, and error statuses survive bodies the SDK can't read
  
  - services: search results map their fields, opening hours and polygon boxes as the service sends them, and keep area-scoped brands
  - services: an XML error over HTTP/2 names its status, and an unread error body is freed
  - services: a zero `Retry-After` still backs off before the next try
  - services: suggestions pick their concept independently of `limit`
  - services: traffic area analytics checks its date rules before the request, rejecting a call that breaks them as `INVALID_REQUEST`
  - services: an along-route search whose filters hold only keys it doesn't declare fails validation, as one with no filter does
  - services: a route leaves out `vehicleRestricted` when it has none, as it does every other section type, and `sectionTypes: ['lanes']` without `guidance` requests no sections
  - services: `geometryData` sends a footprint that several places share once, and gives it the first place's properties, where the last place's won
  - services: an `INVALID_REQUEST` message lists its issues without the `Issues:` JSON, which stays in the error's `issues`
  - services: fuzzy search drops a query intent it doesn't know, and reverse geocoding an area type it doesn't know, rather than returning `undefined`
  - services: `trafficIncidentDetails` sends a polygon cut at 180° as one box across the antimeridian, not one around the world
  - services: a cached `getPOICategories` call rejects an insecure base URL, as an uncached one does

## 1.0.0-rc.5

### Minor Changes

- **Breaking:** core: `formatDuration` returns a `string` for any `number`, so you can pass its result where a `string` is required with no fallback
  
  - **Breaking:** core: `0` gives `"0 min"` and any other duration under 30 seconds gives `"< 1 min"`, in your minute units, where it returned `undefined`. Only `undefined` still returns `undefined`, so where `undefined` hid a label for no delay or no wait, test the seconds before you format them
  - map: `RoutingModule` still leaves out a traffic delay, a jam delay, a stop's wait and a duration difference that round to no minutes, and a summary bubble on a route under 30 seconds reads `"< 1 min"`
  - examples: the route, traffic and store examples drop their fallbacks for a short duration

### Patch Changes

- map: `calculatePaddedBBox`, `calculatePaddedCenter` and `calculateFittingBBox` cut an element short of the map's full width and height from the side that leaves the most of the map visible, so a toolbar inset from the map edges leaves the area below it visible rather than none
  
  - map: this changes the result for any such element whose closest map edge is not that side, whether it floats, sits in a corner or touches one edge. A 600 × 150 px panel against the left edge of a 1280 × 720 px map cuts from the top, and a short panel in the top-right corner cuts from the top rather than the right
  - map: an element spanning the map's full width or height cuts as before. If two sides leave the same area, the side nearest a map edge wins

- The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

- map: waypoint labels win over the route's section icons, and the section focus ring outlines the route instead of crossing it
  - A tunnel, closed-to-vehicles, ferry, toll-road or traffic icon under a stop's name gives way to it, as it does to the pin, rather than pushing the name aside.
  - `setSectionFocus` draws its ring under the route's own lines, so on a road that doubles back, or where focused sections meet end to end, the route covers the ring rather than the ring crossing it.

- services: `geocode` and `discoverPlaces` take a bare query string, the same as `{ query }`, as `geocodeOne` and `discoverOnePlace` already do
  
  - services: `discoverPlaces('coffee')` runs a fuzzy search and is typed as one

## 1.0.0-rc.4

### Major Changes

- **Breaking:** core, services: a route or leg summary's `trafficDelayInSeconds` and `trafficLengthInMeters` are optional, present only when the routing service sends them, rather than `0` when it leaves them out
  
  - core: `trafficDelayInSeconds` is the delay of the traffic events along `trafficLengthInMeters`. For the gap to free-flow, use `Math.max(0, liveTrafficIncidentsTravelTimeInSeconds - noTrafficTravelTimeInSeconds)`, with `computeTravelTimeFor: 'all'`
  - agent-toolkit: the route shape `analyseData`, `processData`, `clusterIncidents` and `createTracker` give the model says what `trafficDelayInSeconds` measures and how to work out the gap to free-flow
  - examples: `react-route-planner` shows the traffic delay against free flow, and the delay of the traffic events on a row of its own

### Minor Changes

- **Breaking:** core: the bbox utilities read and return a box crossing the antimeridian as `west > east`, as RFC 7946 and the services do, so fitting the map to results around Fiji frames Fiji rather than the whole world
  
  - **Breaking:** core: `bboxFromCoordsArray`, and `bboxFromGeoJSON` on points, return the box across the antimeridian when it is narrower than the one from the lowest to the highest longitude. A tie, or input spanning -180 to 180, keeps the latter, so every country in the world still gives `[-180, …, 180]`
  - **Breaking:** core: `bboxFromGeoJSON` reads a line or ring along its edges, which don't wrap, so a ring past 180 gives the box across the antimeridian and one from -100 to 100 stays `[-100, …, 100]`
  - **Breaking:** core: `bboxFromBBoxes`, and `bboxFromGeoJSON` on several features or parts, return the narrowest box containing every input, so merging a box across the antimeridian with another keeps both
  - **Breaking:** core: `polygonFromBBox` draws a box across the antimeridian with its east edge at `east + 360`, around the box rather than the rest of the world, and `bboxFromGeoJSON` reads that ring back as the same box
  - map: `TomTomMap.getBBox` with padding returns a view across the antimeridian as `west > east`, and a view wider than 180° whole
  - services: `geometrySearch` ranks a polygon across the antimeridian by its own width when it keeps the largest 50
  - agent-toolkit: `getTrafficAreaAnalytics` reads a `bbox` across the antimeridian as the area it covers, and the tools describe a bbox as `[west, south, east, north]`. It needs SDK 1.0.0-rc.4

- **Breaking:** core: `Language` holds every language the map labels carry, so `map.setLanguage('hi-IN')` labels the map in Hindi, and the services send each API a code it takes
  
  - **Breaking:** core: `Language` and `languages` gain `ca-ES`, `et-EE`, `eu-ES`, `gl-ES`, `he-IL`, `hi-IN`, `hr-HR`, `ja-JP`, `kk-KZ`, `lv-LV`, `ro-RO`, `sr-RS` and `uk-UA`, so a `Record<Language, …>` of your own needs an entry for each
  - map: the map labels in each of them, and the traffic incident descriptions in Catalan, Estonian, Hebrew, Japanese, Latvian and Romanian
  - services: a behaviour change. `zh-Hans` goes out as `zh-CN` and `zh-Hant` as `zh-TW`, so every service but traffic incidents, which lack Simplified Chinese, answers in that script, where it picked the script by place and answered Singapore in English. Search, geocoding, suggestions and POI categories take both, where they answered each with a 400
  - services: search, geocoding and suggestions answer `hi-IN` and `ja-JP` in local names, and POI categories in English. All four answer `en-CA` in British English and `es-MX` in Latin American Spanish, where they answered each with a 400. POI categories take `ngt` and `ngt-Latn` too
  - services: `trafficIncidentDetails` takes every `Language`, answering in the nearest language the incident tiles have, or in English, where it answered one it lacks, such as `en-AU` or `pt-BR`, with a 406
  - examples: `map-language` offers Hebrew, Hindi, Japanese, Serbian and Ukrainian

- **Breaking:** core: `main-when-available` uses a place's first untyped entry point when none is typed `'main'`, so a reverse geocoded place routes to the road-snapped point the service returns rather than to the queried point
  
  - **Breaking:** core: `getPosition(place, { useEntryPoint: 'main-when-available' })` returns that entry point's position. A place whose entry points are all `'minor'` keeps its own position
  - **Breaking:** services: `calculateRoute` with `useEntryPoints: 'main-when-available'` sends such a stop at that entry point
  - **Breaking:** map: `RoutingModule` with `waypoints.entryPoints: 'main-when-available'` draws such a waypoint at that entry point

- **Breaking:** map: `styling.layers.query` selects style layers by exact id, derives a paint or layout value from the one beneath it, and narrows a layer's filter with one more clause, all kept across style switches; `POIsModule` hides or shows single POIs by id, which makes `filters.categories` optional
  
  - map: `LayerQuery` takes `ids`, the exact style layer ids to select
  - map: `setPaint` and `setLayout` take a function `(valueUnder, layerId) => value` for any property, worked out from the style's own value, or the one a knob set, and again whenever that value changes
  - map: `addFilterClause` and `removeFilterClause` add a clause to a layer's filter, `and`-ed with the style's own and with the filters other modules add, instead of replacing it as `setFilter` does
  - map: `POIsModule`'s `filters.ids` takes a `ValuesFilter` of POI ids, beside `filters.categories`
  - **Breaking:** map: `POIsModuleConfig`'s `filters.categories` is optional, so `filters` can hold `ids` alone. Code reading `config.filters.categories` must handle `undefined`
  - examples: `map-styling-playground` adds a motorway name halo derived from the one beneath it and a road name filter clause, and `poi-filters` hides a POI you click

- map: add a MapLibre custom layer with `map.addCustomLayer`, which keeps it in its place through style switches and lets its objects take clicks and hovers
  - `beforeLayerConfig` places it as on a module. The new `'lowest3D'` anchor, `mapStyleLayerIDs.lowest3D`, puts a 3D layer under the style's 3D buildings, otherwise under the POIs, and module layers placed before `lowestLabel` stay below it, even the ones added later. Module layers at `'poi'` or `'top'` stay above it, also where it falls back to the POIs or the top
  - An id the map already has throws, until that layer's `remove()`
  - After every `setStyle`, before the modules restore, the layer goes back to its place, added again if the switch dropped it, and the module layers go back over or under it as they were. `remove()` takes it off for good
  - A `hitTest` returns the objects under the pointer, topmost first. They join the map's user events in layer order, so the layer's `events`, priority, the hover cursor and the event states work as on a module's features, with `setState` to draw the states

- **Breaking:** map: drag features on every module and scope with the new `dragstart`, `drag` and `dragend` events, such as a route's waypoints, its lines or a place's pin
  
  - map: a drag handler makes its features draggable with the mouse or one finger. They show the new `cursorOnDraggable` cursor, `'grab'` by default, the map doesn't pan under the drag, and the release fires no `click`
  - map: `RoutingModule` reports the drag on `events.waypoints` and `events.mainLines` and plans nothing, so you call `calculateRoute` and `showRoutes` with the moved or inserted stop, or let the route dragging plugin do it
  - **Breaking:** map: `EventType` also holds the three drag types, so a `switch` or a `Record` over it needs them. Event states keep to the click and hover types, as `EventState` and `SetEventStateOptions.state` now say on their own
  - examples: `react-route-planner` drags stops on the map and pulls new ones onto the route line through the route dragging plugin, re-planning the route as you drag

- map: line up a custom layer's three.js or WebGL scene with the map, in metres around a place, with `localFrameMatrix`
  - It turns `defaultProjectionData.mainMatrix` into a `Float64Array`, composed in double precision, which a three.js camera or a WebGL uniform takes
  - `centerLatitude` scales heights at the map centre's latitude, as MapLibre scales its 3D buildings and terrain, and `units: 'mercatorMeters'` takes geometry authored in EPSG:3857 metres

- **Breaking:** map: `SectionLinePattern`, deprecated in 1.0.0-rc.3, is removed. Use `LinePattern`, the same type, which geometries and reachable range borders share too

- **Breaking:** map: `TomTomMap` takes a `transformRequest` that holds or rewrites each map request after the SDK's own, and may return a promise, so an app can wait for its proxy session or point tiles at its own cache
  
  - map: `transformRequest`, typed `MapRequestTransform`, gets the request the SDK built, with its URL, headers and credentials, and stays in place through `setLanguage` and `setGeopoliticalView`
  - **Breaking:** map: the map no longer awaits `globalThis.__DEMOS_PROXY_ENSURE_SESSION__` before its requests. An app that set it passes the same function as `transformRequest` instead: `transformRequest: async (request) => { await ensureSession(); return request; }`
  - examples: `map-request-transform` holds the map's tile requests behind a toggle and counts them

- **Breaking:** map: when the map's style fails to load, a module's `create()` or `get()` rejects with the style's `TomTomMapError`, the one the error handlers get, so an `await` on it lands in your `catch` instead of waiting forever
  
  - **Breaking:** map: after a style load fails, a module call that waits for the map, such as `showRoutes` or `show`, rejects with that error too, until a `setStyle` loads a style. Once one loads, create again only the modules whose `create()` or `get()` rejected: the others restore themselves
  - map: a style, tile, sprite or glyph request that gets no response, offline or blocked, reaches the error handlers as `NETWORK_NOT_AVAILABLE`, which can be retried, instead of `STYLE_LOAD_FAILED` or `INTERNAL`
  - examples: `multiple-maps-landmarks` logs a map whose style fails to load instead of leaving an unhandled rejection

- **Breaking:** services: `calculateRoute` returns the curves of each route as `sections.curve` and the winding stretches they make up as `sections.curvyStretch` when its `sectionTypes` names them, so you can keep a motion-sick passenger off winding roads or send a motorcyclist down them
  
  - **Breaking:** core: `SectionType`, `sectionTypes`, `inputSectionTypes` and `inputSectionTypesWithGuidance` include `'curve'` and `'curvyStretch'`. A `Record<SectionType, …>` needs an entry for each
  - **Breaking:** services: `InputSectionType` includes them too
  - **Breaking:** map: `DrawnSectionType`, `GeneratedSectionType`, `drawnSectionTypes` and `generatedSectionTypes` include them, so a `Record<DrawnSectionType, …>` needs an entry for each. `SectionKnobName` includes `'kerb'`, so a `Record<SectionKnobName, …>` needs one for it
  - core: each curve has its `headingChangeInDegrees`, positive to the right, its `radiusInMeters` where it turns tightest, its `lengthInMeters` and a `curvinessScore`, its arc weighted by how tight it is as roadcurvature.com scores roads, a `severity` from 0 to 1, how much a driver slows down for it from the speed limit on the road into it, weighing its radius, how far it turns and whether it's a turn at a junction, and on a route with guidance the `maneuver` of a junction instruction on it. An instruction that keeps to the road, such as "Turn left to stay on the SS38" at a hairpin, names none
  - core: each curvy stretch groups three or more curves within 500 m of each other, ended by a curve with a maneuver, with its `curveCount`, `hairpinCount` (its hairpins, curves turning 140° or more on a radius of 40 m or less, which the new `isHairpin` tells), `lengthInMeters`, `minRadiusInMeters` and `curvinessScore`, its curves' scores added up
  - core: `getCurveSections` and `getCurvyStretchSections` find them with thresholds of your own. A curve's `severity` reads the route's `speedLimit` sections, so ask for them along with the curves
  - services: `calculateRoute` takes those thresholds as `curveDetection`, a `CurveDetectionOptions` with the turn, radius and straight that make a curve and the curve count and gap that make a curvy stretch
  - core: the new `withCurveSections` finds a route's curves and curvy stretches again with other thresholds, keeping its other sections, so you can tune them on routes you already have, with no new request
  - core: `compareRoutes` and `getSectionsWithin` weigh `curve` and `curvyStretch` when you pass no `types`, on routes that carry them
  - services: the SDK finds `curve` and `curvyStretch` in the route's geometry, only when a `sectionTypes` list names them, so a `calculateRoute` without `sectionTypes` does no more work than before. `inputSectionTypes` and `inputSectionTypesWithGuidance` name them, so a list built from those finds them too. It never sends them to the routing API
  - core: the new `defaultSectionTypes` names the sections a `calculateRoute` without `sectionTypes` returns, so `sectionTypes: [...defaultSectionTypes, 'curve', 'curvyStretch']` keeps them all and adds the curves
  - map: the routing module draws `curve` and `curvyStretch` as bands when you switch them on with `sections.curve: { visible: true }`, at the width of every other section band. The curves draw rose, a colour no traffic delay takes, deeper the higher their `severity`, above the stretch they make up, which draws the same rose fainter
  - map: from zoom 12, a curve of 60 m radius or less carries a kerb, short stripes of a tint of its colour, nearly white on a light map and nearly black on a dark one. The new `sections.curve.kerb.color` knob sets the stripes' colour, and `sections.curve.kerb.visible: false` draws one plain line. `layers.sections.curve` takes the kerb as `routeSectionCurveKerb`
  - examples: the new `route-curves` example ranks a mountain trip's routes by how winding they are and takes the straightest or the curviest. It shows all their curves, the open-road bends, the turns in towns, the curvy stretches each route has of its own, the curves in tunnels or the hairpins, with their speed limit signs, names how hard a curve you click is, and tells where a curvy stretch you click anywhere along starts, how long it takes and which towns it runs between. Its sliders, folded away under the picker, set what counts as a curve and a curvy stretch, and find them again on the routes shown. The `route-sections-playground` picker adds the Stelvio Pass, and `map-styling-playground` draws a route's curves over Twin Peaks
  - examples: `react-route-planner` adds a Curvy roads lane and counts each alternative's curvy stretches of its own, and a Curvy route draws its curves and curvy stretches

- **Breaking:** map: the `maplibre-gl` peer dependency moves up to `^6.15.0`
  - **Breaking:** services: the `zod` peer dependency moves up to `^4.6.7`.
  - services: `geometryData` reports a `geometries` list over 20 as one issue on that field, not as a union mismatch.

- **Breaking:** services: along-route results from `discoverPlaces({ route })` carry their detour as typed `AlongRoutePlaceProps`, `detourTimeInSeconds` and `detourDistanceInMeters`, so you read them without a cast
  
  - **Breaking:** services: the untyped `properties.detourTime`, `detourDistance` and `detourOffset` are now `detourTimeInSeconds`, `detourDistanceInMeters` and `detourOffsetInMeters`. Either detour can be negative, when the route through the place is faster or shorter than the original
  - services: `detourOffsetInMeters` comes with results sorted by `'detourOffset'`
  - examples: `nodejs-along-route-search` prints each charger's detour

- **Breaking:** services: `geocodeOne` and `discoverOnePlace` reject with an `SDKError` coded `NOT_FOUND` when nothing matches, naming the `'Geocode'` or `'FuzzySearch'` service, so you can branch on `error.code` as for any other failed call
  
  - The message is unchanged. A `catch` that filters on `instanceof SDKError` now receives a miss too, where it used to get a plain `Error`.

- **Breaking:** services: request validation rejects a parameter the service doesn't know, and names it, so a misplaced key such as a top-level `poiCategories` fails with `INVALID_REQUEST` instead of being dropped silently
  
  - **Breaking:** services: an unknown parameter rejects with an `unrecognized_keys` issue, and one the service takes inside an object parameter points there: `poiCategories is not a parameter of AlongRouteSearch. Did you mean filters.poiCategories?`. The check reads only the parameters you pass, not the global configuration, and a parameter set to `undefined` counts as absent. `validateRequest: false` skips it
  - **Breaking:** services: an along-route `discoverPlaces` with neither a `query` nor a filter other than `indexes` rejects in validation, rather than with the API's `400 "The requested route cannot be calculated"`
  - services: `calculateRoute` validates `useEntryPoints`, `extendedRouteRepresentations` and `guidance`

- **Breaking:** services: a request a service can't build, such as a geometry type geometry search doesn't take sent with `validateRequest: false`, rejects with an `SDKError` coded `INVALID_REQUEST` instead of a plain `Error`, so you can branch on `error.code` as for any other failed call
  
  - What the request builder threw is on `cause`, and the message is unchanged.
  - If the parameters passed validation and the request still can't be built, the code is `INTERNAL`.

- **Breaking:** services: a rate-limited (`429`) call backs off 447 ms before its first retry by default instead of retrying at once, and each wait is drawn between half and all of the backoff, so clients rate-limited together don't retry together

- **Breaking:** services: `when` takes a `localDateTime`, a wall-clock time such as `'2026-10-19T08:15:00'` that the routing API reads in the origin's time zone, so you can route at 08:15 in Tokyo from a browser anywhere without a UTC offset
  
  - With `arriveBy`, `calculateRoute` reads a `localDateTime` in the time zone of the route's final destination. `calculateReachableRange` takes it with `departAt`
  - The format is `YYYY-MM-DDTHH:mm:ss`, typed as `LocalDateTime`. Request validation rejects a time without seconds, with an offset or a `Z`, a date that doesn't exist, and a `when` with both or neither of `date` and `localDateTime`
  - **Breaking:** `DepartArriveParams` is a union of `{ date }` and `{ localDateTime }`, so code reading `when.date` off it gets `Date | undefined`. Narrow it first, for example with `Extract<DepartArriveParams, { date: Date }>`. Passing `{ option, date }` is unchanged

### Patch Changes

- map: the style's 3D buildings have softened corners, rounded over the last metre of their walls, and the new `buildings3D.roundedCornerDistanceMeters` knob of `StylingFoundationsModule` sets how far the rounding reaches
  
  - map: `0` gives the sharp corners back, and a few metres rounds the buildings. A style that sets its own `fill-extrusion-rounded-corner-distance` keeps it
  - examples: `map-styling-playground` adds a 3D buildings section with the knob

- core: `aggregateIntoCells` groups your points into hexagons, squares or your own polygons, such as districts, and gives each cell the median, mean, count, sum, min or max of a value, as GeoJSON polygons any map module draws
  
  - core: each point's grid cell comes from its coordinates, so large data sets stay fast, and the cells across the antimeridian stay side by side. `minCount` leaves out the cells with too few points, and `gridOrigin` keeps the cells in place while your points change
  - map: `TrafficAreaAnalyticsModule` finds each tile's hexagon or square from its coordinates on the same cell grid, instead of testing it against every cell, and draws the same cells as before
  - examples: `byod-geojson-cells-custom-module` colours Berlin by the median asking price per square metre in each hexagon or square

- core: `servesGeopoliticalView(view, api)` tells whether the SDK sends a geopolitical view to an API, so you can label a result with the view its request carried
  
  - core: `GeopoliticalViewAPI` names the APIs it answers for: `'mapTiles'`, `'search'`, `'placeDetails'`, `'reverseGeocoding'` and `'geocoding'`
  - map, services: the map's tiles and every search, place details, reverse geocoding and geocoding request decide which view to send from it, so your label and the request always agree
  - examples: `geopolitical-views-playground` labels each address with the view its reverse geocoding request carried

- core, services, map: exported classes keep their names in the minified bundles, so `SDKError.name` is `'SDKError'`, `TomTomConfig.name` is `'TomTomConfig'` and `RoutingModule.name` is `'RoutingModule'`

- map: Add your own credits to the map's attribution with `attribution: { credits }` on `TomTomMap`. They show next to TomTom's and stay across style switches.
  
  - examples: `byod-geojson-heatmap-custom-module` credits its listed-buildings dataset in the map's attribution

- map: `setMapColors` paints city parks and sport grounds with `park` on every standard style, where `streetDark` and the mono styles gave them `artificial`'s colour
  
  - map: with `park` left unset, the parks keep the style's own colour whatever `artificial` is set to

- map: `TrafficIncidentDetailsModule` fades every incident outside the focus set with the new `highlight.unfocusedOpacityFactor`, so the incidents you focus are the ones that stand out
  
  - map: it fades their lines, icons and delay text while a focus is set, multiplies `line.opacity`, leaves a hovered or clicked incident at full strength and survives a style change. It's `1` by default, which leaves them as they are, and the `highlight.unfocusedOpacityFactor` knob sets it by id
  - examples: `traffic-incident-details` fades the other incidents when you click one

- map: the map language labels the map in `zh-Hant`, `zh-Hans`, `ko-Latn-KR`, `ru-Latn-RU`, `ngt-Latn` and `nb-NO` too, where those showed the local name or the wrong script
  
  - examples: `map-language` offers Simplified and Traditional Chinese

- map: with a proxy `commonBaseURL`, the map sends credentials and TomTom headers only to URLs on the proxy's own origin and under its path, not to a host or path that only starts with the same text

- core, services, map: the `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- services: `getSearchSuggestions` validates its own parameters before sending either request, so an invalid `filters.boundingBox` rejects under that name rather than `geoBias`, and an invalid call costs no request

- services: geometry search sends a closed polygon ring of 50 vertices whole and samples a longer one to 50 evenly spaced vertices, where a ring just over a multiple of 50 sent as few as 26

- services: `createLatestRequest({ supersede: 'on-answer' })` shows each answer of requests that start faster than they answer, such as a route re-planned during a drag, and never an older answer after a newer one

- services: along-route `discoverPlaces` rejects a `maxDetourTimeSeconds` above `3600`, the service's maximum, in request validation rather than after a round trip

## 1.0.0-rc.3

### Minor Changes

- **Breaking:** core: ten plain POI sub-categories have codes of their own, such as `SCHOOL_GENERIC`, so a search can ask for plain schools without childcare or driving schools
  
  - **Breaking:** core: a place in one of them reads as its own code rather than its parent's. Where you match `SCHOOL`, `THEATER`, `SPORTS_CENTER`, `MARINA`, `WEIGH_STATION`, `OPEN_CAR_PARKING_AREA`, `COLLEGE_OR_UNIVERSITY`, `CAR_WASH`, `AMUSEMENT_PARK` or `TRAFFIC_CONTROL_DEPARTMENT` in `poi.categories`, match its `_GENERIC` code too
  - **Breaking:** core: a `Record<POICategory, …>` needs an entry for each of the ten codes
  - services: a `poiCategoryQuery` or `resolvePOICategories` word that names a plain sub-category best, such as `'rto'` or `'open car parking area'`, resolves to its `_GENERIC` code, which searches that sub-category alone rather than its parent and the parent's other sub-categories
  - services: a word no longer spends one of its three codes on a sub-category of another code it already has, so `'medical'` and `'care'` also find `EMERGENCY_MEDICAL_SERVICE`
  - map: a place with one of the new codes takes its parent's base-map icon, pin and `categoryIcons` entry

- **Breaking:** map: a route's border crossings stand in a bubble above the route, the summary bubble's shape with its tail on the border, instead of a plaque on the route line; `countryCrossings.alignment` is removed with its knob and the `CountryCrossingAlignment` type, and crossings no longer carry a `bearing`
  
  - The default bubble takes the selected summary bubble's default colours, so it follows the light or dark style, `setMapColors()` and the `colors.label` and `colors.labelHalo` knobs: white on a light style, dark grey on a dark one, the map's label halo lightened under a theme. `countryCrossings.color` and `countryCrossings.label.color` still override either.
  - A crossing hides where a waypoint pin, a summary bubble, another symbol drawn above it or a crossing close by would cover it, and shows again once there's room.
  - Migration: drop `alignment` from `countryCrossings`. A bubble stays level with the screen.
  - examples: `route-sections-playground` drops its crossing alignment control and gains a map look picker, light, dark and an amber theme, that the crossings follow.

- services: an instruction's `pathPointIndex` is the route point at its maneuver, rather than the first point a few metres short of it, so it usually falls inside the `lanes` section leading to the maneuver
  
  - **Breaking:** a `lanes` section's `properties` read `IS_MANEUVER`, as documented, where they passed the API's `isManeuver` through. Match `'IS_MANEUVER'` instead.

- **Breaking:** map: the types of place events, traffic features and waypoint ids match what the map hands your code
  
  - **Breaking:** map: under `pin-clustered`, a cluster no longer reaches the `events.places` handlers, which are typed `Place`, nor takes their hover and click states. The module-wide `events` receive it, with `cluster: true`, `cluster_id` and `point_count` in its properties
  - **Breaking:** map: `roadSubcategory` is optional on `TrafficIncidentsModuleFeature`, and absent off `street` and `service` roads, as on `TrafficFlowModuleFeature`
  - **Breaking:** map: a `TrafficFlowModuleFeature`'s geometry is a `LineString` or a `MultiLineString`, so check `geometry.type` before you read its coordinates
  - **Breaking:** map: a waypoint keeps the id you give it, a number included, so `WaypointDisplayProps.id` is `string | number`

- **Breaking:** core: `getDistinctSections` finds the stretches each route has to itself, and `calculateRoute` returns them as `sections.distinct` whenever it returns two or more routes. `getImportantRoads` names the main roads a route takes, by road number
  
  - **Breaking:** core: `SectionType` and `sectionTypes` include `'distinct'`, which a request's `sectionTypes` can't ask for: the SDK adds it. A `Record<SectionType, …>` needs an entry for it
  - **Breaking:** services: `InputSectionType` is only the types a request can ask for, so `leg` and `distinct` no longer compile in `sectionTypes`; type a list as `InputSectionTypes` rather than `SectionType[]`. `InputSectionTypes` is read-only, so build a list whole rather than `push` onto one. `inputSectionTypes`, `inputSectionTypesWithGuidance` and `sectionTypes` are read-only lists of their exact types
  - core: each distinct section runs from where its route leaves the others to where it rejoins them, with its `lengthInMeters`, and `minLengthInMeters` leaves out the short ones
  - core: `getSectionOverlap` gives the stretch two sections of one route share, whatever their types, as a `RouteSpan`
  - core: `getSectionsWithin` lists a route's sections of every type within spans of it, such as the ferries, tolls and traffic on its distinct sections, with each section's share there to prorate a jam's delay
  - core: `compareRoutes` tells what a route adds and avoids against a reference route, such as the selected alternative, or the route `costModel: { traffic: 'historical' }` gives, to say which jams and closures the live route avoids
  - core: `getImportantRoads` groups a route's `importantRoadStretch` sections road by road, each with its `name`, its length and its stretches to ring with `setSectionFocus`; `within: sections.distinct` names what sets a route apart
  - map: summary bubbles sit on their route's longest distinct section, read from `sections.distinct` when every route carries it, so a route crossing another at a junction keeps its whole stretch for the bubble
  - examples: the `route-with-alternatives` and `react-route-planner` examples name the main roads of the stretches each route has to itself, and highlight a route the same way from the map or its card
  - examples: each card in `route-with-alternatives` says what its route adds and avoids against the selected route, or against the usual route a toggle draws: ferries, car trains, tolls, closures, roadworks, traffic and unpaved roads

- **Breaking:** map: a route you select with a click takes the selected style alone, and a feature an `events.where()` predicate rejects stays inert, so narrowing a click to the alternatives keeps the selected route from reacting to the pointer
  
  - **Breaking:** map: an `events.where()` predicate decides on the top-most feature under the pointer. One it rejects keeps the map cursor and takes no hover or click highlight, and the handler doesn't run, even with a matching feature beneath
  - map: `selectRoute` clears the `click` state of the route lines and summary bubbles, so a route you select with a click no longer stays highlighted
  - map: a long hover comes on the feature under the pointer when it comes due, so a still pointer no longer long-hovers a route as it was before a click selected it, which drew its wider outline
  - examples: `route-summary-bubbles-playground` selects only alternatives on click

- services: **Breaking:** the service types say what each call returns and takes, from reverse geocoding and geometry data to the errors, and a call can set its own `retry`
  - services: **Breaking:** `reverseGeocode` resolves a `ReverseGeocodingResponse`, a `Place` or, where nothing matches, the queried point without `properties`; checking `properties` narrows it to a `Place`
  - services: **Breaking:** `geometryData` given a `Places` collection types each polygon's properties as `PlaceGeometryProps`, its place's properties plus `placeCoordinates`, and gives a polygon that matches no place `null` properties; a `Place[]` or geometry IDs return plain `PolygonFeatures`
  - services: a service call's `retry` overrides the global one field by field, and `retry: undefined` turns retrying off for that call
  - services: **Breaking:** a service call no longer takes `displayUnits`, which no service reads
  - services: **Breaking:** `calculateReachableRanges` rejects a `404`, a `5xx` or an error without a status, as it does a `401`, `403` or `429`, and skips only the other `4xx`, such as the `400` `MAP_MATCHING_FAILURE` of an origin off the road network
  - services: **Breaking:** `SDKError.service` is a `ServiceName`, the union of the services' names, and reachable ranges report `'ReachableRange'`, not `'Reachable Range'`
  - services: **Breaking:** the wire-format types `PoiCategoriesResponseAPI`, `PoiCategoryAPI`, `PlaceDetailsResponseAPI` and `PlaceDetailsResultAPI` are no longer exported
  - services: **Breaking:** `minFuzzyLevel` and `maxFuzzyLevel` take a `FuzzyLevel`, the whole numbers `1` to `4`
  - core: **Breaking:** a route traffic section's `tec` is optional, and absent when the service sends no TEC codes

### Patch Changes

- core: `languages` is a runtime export, and the distance formatter, bounding-box and route helpers handle their edge cases
  
  - core: `formatDistance` rounds below 10 m to one decimal, rounds a negative distance to the same magnitude as its positive, rounds feet and yards once rather than twice, and takes `undefined`
  - core: `bboxCenter` centres a box that crosses the antimeridian, and `bboxFromGeoJSON` reads the 2D edges of a 3D `bbox`
  - core: `getProgressAtNearestRoutePoint` returns `undefined` on a route under two coordinates, rather than throwing
  - core: `getCoordinateAtRouteProgress` returns `undefined` past an end whose progress entry lacks the value, rather than `0`
  - core: `findBestWaypointInsertionIndices` and `withInsertedWaypoints` prepend on a route under two coordinates
  - core: `getRouteProgressForSection` and `getSectionBBox` take any `RouteSpan`, such as the one `getSectionOverlap` returns
  - core: `TomTomConfig.instance.reset()` restores the retry defaults, even after a caller edited `get().retry`

- core: `getInstructionLanes(route, instruction)` finds the `lanes` section leading to an instruction's maneuver, so a directions panel can show the lanes to take under each step
  
  - examples: `route-with-guidance` lists its instructions in a Directions panel, and both it and `react-route-planner` draw the lanes to take under each instruction that has them, as a small SVG sign of their own.

- map: images without a DOM, base-map places under offset POI icons and a module's `events.off()` handle their edge cases
  
  - map: a module given an SVG image where there is no DOM, as in a server render or a Node.js test, adds no image rather than throwing a `TypeError`
  - map: a `base-map` place keeps the style's icon offset when `POIsModule` offsets its own `categoryIcons` entry for the same category, rather than drawing its sprite that many pixels away
  - map: `events.off('shown-features')` stops compiling on a module with no `show` method, which never emits that event, as `events.on('shown-features', …)` already did

- map: geometries and reachable ranges can blend `fill.palette` from its first colour to its last, fade the bands away from the origin, and dash or dot their borders
  
  - map: `fill.paletteMode: 'ramp'` shades the features, or the bands, evenly from the palette's first colour to its last, blended in OKLCH. `'cycle'`, the default, takes the colours in turn as before
  - map: `ReachableRangesModule`'s `fill.outermostOpacityFactor` multiplies the outermost band's fill opacity, and steps the bands between evenly from the innermost one. A lone range takes the factor
  - map: `line.pattern` (`'solid'`, `'dashed'` or `'dotted'`) breaks up the borders of `GeometriesModule` and `ReachableRangesModule`, scaled with the border width
  - map: the new settings are knobs of `geometriesKnobCatalogue` and `reachableRangesKnobCatalogue`
  - map: `LinePattern` now types every line pattern; `SectionLinePattern` is deprecated in its favour
  - examples: `geometry-config-playground` sets the border pattern, `multiple-geometries` swaps palettes and switches them between cycling and ramping, and `reachable-ranges-playground` offers two- and five-colour palettes to ramp

- map: light the 3D buildings with the `view.light` knobs of `StylingFoundationsModule`, kept across style switches
  
  - `view.light.direction`, `view.light.altitude`, `view.light.alignment`, `view.light.color` and `view.light.intensity` set MapLibre's light. A part you leave unset takes the style's own light, otherwise MapLibre's default
  - `stylingFoundationsKnobKinds` gains `number`, the kind of the direction, altitude and intensity
  - `exportStyle()` carries the light the knobs set
  - Once a light knob has been set, a clean `setStyle(…, { resetState: true })` draws the new style's light, rather than keeping the one the knobs had set
  - examples: `map-styling-playground` shows the light knobs in a View light section

- map: road shields, POI icons and road patterns no longer go missing when the map's own sprite loads more slowly than the place pins' sprite

- map: modules keep their state across style switches, routes draw with a traffic halo, and events, images and knobs handle their edge cases
  
  - map: `RoutingModule` draws its routes when `sections.traffic.style` is `'halo'`, at creation, after a style switch and when switched at runtime
  - map: `routeIndex` on route sections, summary bubbles and border crossings is the route's position among the shown routes, so `selectRoute` and clicks work when only some routes are shown
  - map: `selectRoute` waits for the module before reading the shown routes, so a `showRoutes` it follows unawaited keeps its routes; a new `showRoutes` starts its summary bubbles with no click state
  - map: route jam labels follow `displayUnits.time`, and a speed limit that changes at a border takes the country the route enters
  - map: speed-limit signs anchor to their own instance's layers, and go to the top on a style without their usual anchor
  - map: `PlacesModule` restores what it showed synchronously on a style switch, repaints its default pin when created with no config, and no longer fires `shown-features` for the restore
  - map: a place category icon with no image resolves to the sprite's own id, a `poiCategory` icon mapping draws the `categoryIcons` entry for the category it returns, and `layers.*.layout` overrides win over the computed text and icon offsets
  - map: `POIsModule` keeps its category icons after a `setStyle` to the style already loaded, and `FOOD_DRINKS_GROUP`, `HEALTH_GROUP` and `ENTERTAINMENT_GROUP` no longer pull in delicatessens, welfare organisations and clubs
  - map: a centre title keeps its own hover and click state rather than its polygon's, and two identical reachable ranges no longer shade the inverted style
  - map: raw layer edits stay on top of every module's knobs, a preset switch fires `config-change` once per module, and an unknown preset id such as `'toString'` throws the documented error
  - map: event handlers survive a style switch that leaves their scope with no layers, hover detects a feature with id 0 and the same id in two sources, and a handler that unsubscribes mid-dispatch no longer skips the next one
  - map: a slow image load no longer overwrites a newer image or re-adds a removed one, and `addOrUpdateImage` leaves a caller's `onload` alone
  - map: a `setStyle` called before the first style load finishes on the style it asked for, or on the first style when its own fails to load
  - map: `TrafficAreaAnalyticsModule` moves its hover outlines and highlights with their cells on a `beforeLayerConfig` change, and its heatmap stays valid when every tile has the same value
  - map: an incident with an average speed of 0 km/h keeps it, and the jam delay label rounds to whole minutes first, with a marker sized for the rounded label
  - map: `CustomGeoJSONModule` gives a feature with no id one no other feature holds, keeps a layer hidden that its spec sets to `visibility: 'none'`, re-adds an image whose options change, and no longer fires `shown-features` on a style switch
  - map: a retry after the first style fails to load loads it, and a `setGeopoliticalView` or `setLanguage` called mid-switch applies once the map is ready without undoing a later call
  - map: a display-units change keeps the hover and click states of route jams and speed-limit signs, `showWaypoints` draws with a config applied while it waited, a waypoint Feature with `properties: null` no longer throws, and speed-limit signs show mph in Jersey, Guernsey, the Isle of Man, the US territories, seven British Overseas Territories, eight Caribbean states and Samoa
  - map: a dotted ferry or tunnel line draws its dots, and a named routing layer override placed under another routing layer, by its bare name or its full id, lands there rather than on top
  - map: `PlacesModule` keeps entry point and connection event states across a style switch, a cluster rebuild and a config change, and a custom icon's label offset accounts for its `pixelRatio` and an SVG's drawn size, an SVG with only a width or a height taking the other from its viewBox
  - map: `POIsModule` no longer turns on micro markers the style hides, `styling.layers` visibility edits no longer show a layer a module hides, a style sky that draws nothing no longer hides the theme sky while one with colours but no atmosphere counts as shown, and base-map group knobs apply in the order given
  - map: an events scope you hold registers on the current sources after a style switch, clicking the empty map clears a click state set before one, an `on()` unsubscribe removes only its own registration, and a hovered place redrawn as selected doesn't fire `hover` twice
  - map: a layer added in the same config change follows the layer it is pinned under when that layer moves
  - map: geometries with their own ids keep them, and their event states, after a config change
  - map: area analytics cells stop at `maxMeters`, their hover outlines and highlights follow the metric filter, and an empty `colorStops` falls back to the palette; `TrafficIncidentDetailsModule.show()` keeps the layers its `layers` config hides; an incident delay or report count of 0 is kept
  - map: `calculateFittingBBox` clamps latitudes to the Web Mercator range and handles a box across the antimeridian, and `calculatePaddedBBox` covers a rotated map and cuts a panel touching one edge from its closest edge
  - map: a module's `applyConfig` and `resetConfig` reach the event handlers already registered, so a new hover cursor or grace period applies, and a click on a cluster whose id matches a shown feature's hands the handler the cluster
  - map: `TrafficFlowModule`, `TrafficIncidentsModule` and `TerrainModule` show and hide their layers alongside `styling.layers` edits, so an edit no longer shows traffic or a hillshade the module hides, and `BaseMapModule` no longer misrecords an `all-except` visibility for a layer group the style has no layers for
  - map: a section's halo no longer vanishes under the route outline when the section sets a narrower `widthFactor` or `widthPreset`, and setting `countryCrossings.visible: true` while they are shown keeps a clicked crossing's state
  - map: a `setStyle` call a newer one supersedes resolves even when its style fails to load, as documented
  - map: area analytics extrusion highlights follow an extrusion height that ramps with zoom
  - map: `POIsModuleSerializableConfig` is exported, and `stylingFoundationsKnobIds` is `readonly` like the other modules' knob id lists, so code that mutates it stops compiling
  - map: `PlaceLayerName` leaves out `'additional'`, which names no layer, and `RouteLayersConfig.sections` names only the layers each type draws: `speedLimit` its sign layer, the other generated types their line and icon layers
  - map: `PlacesModule.updateData` and a show after a config change drop the category, icon and extra properties the previous config added, and a custom module's layers that reference each other stack in dependency order at creation, on `applyConfig` and after a style switch
  - map: `CustomGeoJSONLayerSpec` takes only the six layer types a GeoJSON source draws (circle, line, fill, fill-extrusion, symbol and heatmap)
  - map: a route module with only some `displayUnits` of its own follows a global unit-system change for the rest
  - map: a POIs event handler no longer receives base-map features, nor a base-map handler POI ones, and a `recently-hovered` state clears after its handler unsubscribes
  - map: area analytics fall back to the defaults for each fill and line field left `undefined`, an inverted display cuts every region out of the mask, and `setHeight(undefined)` clears the extrusion height
  - map: a jam with a delay of 0 shows no "1 min" marker, and a whole-hour jam delay gets the small sprite
  - map: `setLayout` takes `visibility` as `'visible'` or `'none'` only, since a visibility expression was drawn as always visible, and `getStyleInput()` is typed as never `undefined`
  - map: routes relabel on the next config change after a global display-units change, a style switch in between included, and a layer override's `reset()` after a style switch restores the new style's value, or after a `setStyle` to the style already loaded the value it replaced
  - map: an `off()` followed by a style switch no longer leaves a hover, click or recently-hovered state stuck on a source
  - map: a place config change gives back the place's own value of a property an `extraFeatureProps` entry replaced, and a clicked `micro` dot under `pin-clustered` keeps its state across a config change and a style switch
  - map: `CustomGeoJSONModule.applyConfig` throws a clear error before changing anything when the config names other sources or `sourceID`s than the module was created with, where it used to apply half of it
  - map: area analytics hover and click highlights stay off the cells a layer filter hides

- core, services, map: the package now installs on Node.js 22 with any package manager
  
  - The `engines` field asks for Node.js 22 or newer instead of 24, and no longer names a pnpm version, so npm and pnpm stop warning about it on Node.js 22 and `engine-strict` installs succeed

- map: Fade a route, the traffic overlays, the incidents you show and your place icons, each with one opacity setting
  
  - `RoutingModule` `opacity` fades the route lines and their outlines, selected and deselected; sections keep `sections.<type>.opacity`
  - `TrafficFlowModule` and `TrafficIncidentsModule` `opacityFactor` multiply the style's own line opacity, its zoom ramp kept; the incident icons stay opaque
  - `TrafficIncidentDetailsModule` `line.opacity` fades the incident lines; the markers and the highlight outline stay opaque
  - `PlacesModule` `icon.opacity` fades the icons of every marker type, the cluster pin included; a selected place stays opaque
  - Each is a knob in its module's catalogue
  - `route-styling-playground` fades the route through `opacity`, `places-customize-playground` gains an icon opacity slider, and `traffic-incident-focus` fades the flow through `opacityFactor`

- services: `calculateReachableRange` rejects an arrival time with a message that shows the `when` shape to use instead, `when: { option: 'departAt', date }`

- map: Choose what a route's summary bubble says, its colour, typeface and the zooms it shows at, or write your own text per route
  
  - `summaryBubbles.fields` lists `duration`, `distance` and `trafficDelay` in the order shown; a bubble with nothing to say isn't drawn, so `['trafficDelay']` shows bubbles on delayed routes alone
  - `summaryBubbles.minZoom`, `maxZoom`, `color` and `label` (`color`, `size`, `opacity`, `typeface`, `customTypeface`) are knobs in `routingKnobCatalogue`, all but `customTypeface`
  - `summaryBubbles.label.title` takes a function of the route's summary, or a MapLibre expression, and writes its text in place of the fields
  - The bubbles now follow the map: a theme's `labelHalo` and `label` colours once one sets them, else dark bubbles and light text on a dark style
  - New `route-summary-bubbles-playground` example, its panel built from the catalogue

- map: Summary bubbles keep clear of each other, show on the routes you choose and give each alternative's time against the selected route
  
  - Each bubble sits on a stretch of road its route has to itself, so routes sharing a motorway no longer hide each other's bubble, and it stays put when another route is selected
  - `summaryBubbles.routes` shows the bubbles on `all` routes, the `selected` one alone or its `alternatives`
  - The `durationDifference` field writes each other route's time against the selected one, such as `+6 min`, and `selectRoute` re-times the bubbles
  - The `route-summary-bubbles-playground` example opens with bubbles timed against the selected route

- services: validation catches the inputs that used to crash or reach the API, and routing, search suggestions and the shared pipeline handle their edge cases
  
  - services: validation rejects, as `INVALID_REQUEST`, what used to throw a plain `Error` or come back as a 400: an empty Polygon or a Point in `geometrySearch`, an impossible date such as `'2024-02-30'` in `trafficAreaAnalytics`, more than 100 incident ids, a non-integer fuzzy level or a `minFuzzyLevel` above `maxFuzzyLevel`, a routing avoid area with no bounding box, a one-point path, a non-integer `maxAlternatives`, an along-route search route under two positions, a zero reachable-range budget, a non-integer or out-of-range `limit` or `heading`, and an undefined `commonBaseURL`
  - services: validation also rejects an empty array as a route location, a stop's `candidateEntryPoints` off the globe or `preferredEntryPointIndex` past them, an empty `geometrySearch` geometry list or ring, `days` beside an `endDate` in `trafficAreaAnalytics`, and a bare bbox of other than four numbers; it now accepts a GeometryCollection where a bounding box is read, bare or inside a Feature or FeatureCollection, and the documented `weightKG: 0`
  - services: validation checks GeoJSON input against its type: a route waypoint's position, every position of a path, an along-route search route or a polygon ring, and a `geometrySearch` Circle centre must be on the globe, a bounding box can't be an empty array or collection, a path given as a Feature must hold a LineString, a stop's `pauseDurationSeconds` can't be negative and its `legCostModel` takes only known route types and avoid values, a geometry's coordinates must match its `type`, and a GeoJSON `bbox` must hold 4 or 6 numbers; `extendedPostalCodesFor`, `mapcodes`, `openingHours`, `timeZone`, `relatedPois` and `filters.indexes` reject values outside their types
  - services: a validation error from a union schema lists what each branch rejected
  - services: `onAPIResponse` receives the API's response body, as its type says, rather than the fetch envelope, and fires once per call
  - services: proxy-credentials mode is decided per call, so a call with its own `apiKey` no longer sends `credentials: 'include'` under a global proxy setup
  - services: an error response labelled JSON whose body doesn't parse still rejects with its status
  - services: `calculateRoute` keeps the leg point indices right after a one-coordinate first leg, gives a road-shield section with no references `[]`, no longer lets an origin's `candidateEntryPoints` override `useEntryPoints`, maps TEC cause codes 16, 22 and 23 to `'other'` as the TPEG2-TEC table defines them, and gives each instruction with no road info an object of its own
  - services: `trafficAreaAnalytics` no longer throws a `RangeError` over a region with hundreds of thousands of tiles, and `calculateReachableRanges` stops listening to the batch's abort signal once each call settles
  - services: `getSearchSuggestions` shows a brand asked for alongside address-type kinds
  - services: `getSearchSuggestions` no longer offers a category refinement whose `refine()` fails for a category id the SDK doesn't know, and leaves out autocomplete segments of a type the SDK doesn't know
  - services: `getPOICategories` and `resolvePOICategories` validate their parameters and reject with `SDKAbortError` on an aborted signal even when the cache or the known codes answer the call
  - services: `SDKServiceError.status` is `readonly`, like the other error fields
  - services: `geocode` keeps in `geographyType` only the types core's `geographyTypes` lists, and rejects `extendedPostalCodesFor: ['POI']` as `INVALID_REQUEST`
  - services: a blank `poiCategoryQuery` rejects rather than searching with no category filter
  - services: `calculateReachableRanges` no longer needs `AbortSignal.any`, which React Native lacks, and the search cursor no longer needs `atob` and `btoa`
  - services: a search or geocode result at distance 0 keeps its `distance`, Kosovo's `XK` maps to `XKX`, and `getPOICategories` hands out a copy of its cache
  - services: `VehicleModel` and `VehicleDimensions` are exported
  - core: `TomTomConfig.instance.put` drops `undefined` retry fields rather than storing them over the defaults

- core, services, map: an app now bundles only the SDK code its imports use, so most single imports come out far smaller
  
  - core: importing one helper, such as `generateId`, bundles under 1 KB minified instead of about 30 KB with lodash
  - services: `geocode` bundles about 14 KB minified instead of 68 KB, and `calculateRoute` 32 KB instead of 86 KB, with lodash
  - map: `TomTomMap` bundles about 44 KB minified on top of MapLibre instead of 123 KB, with lodash
  - core, services, map: the package declares `sideEffects: false`, so bundlers drop the modules an app doesn't import

- map: a route's speed limit signs draw from zoom 12.5 by default instead of 11, two and a half zooms after the tunnel and closed-road signs, so they no longer crowd the overview of a route; `sections.speedLimit.sign.minZoom` still sets it, in steps of half a zoom in `routingKnobCatalogue`
  
  - examples: `route-speed-signs` sets `sign.minZoom` to 10, so its tiles post the signs on a whole route; `route-sections-playground` moves its `sign.minZoom` slider by half a zoom

## 1.0.0-rc.2

### Minor Changes

- **Breaking:** map: a knob id is the path of its setting in the configuration on every module, and `setKnobs` sets several knobs in one checked change
  - map: `setKnobs(module, catalogue, values)` checks every value against its knob, then applies them all in one change and one `config-change`. If it refuses one value, it sets none. `KnobValues<CONFIG, ID>` types the values by id
  - map: `StylingFoundationsModuleConfig` nests each setting along its id, as every other module does: `{ labels: { sizeFactor: 1.2 } }` instead of `{ 'labels.sizeFactor': 1.2 }`. `setKnob`, `setKnobs`, `getKnob`, `resetKnob` and `MapPresetSettings` keep the ids
  - map: `StylingFoundationsModule`'s `updateConfig` merges one level deep, as on every module, so `updateConfig({ colors: { water } })` replaces the colours set before. Set a single colour with `setKnob`. Its `applyConfig` and `updateConfig` no longer check values at run time, as on every module. `setKnob` and `setKnobs` do
  - map: a `KnobTarget` implements `_setKnobValues(values)` instead of `_setKnobValue(id, value)`, and a subclass of `AbstractMapModule` inherits it. For a plugin's own target, `knobValueIn`, `configWithKnobs` and `configWithoutKnob` implement the hooks
  - map-effects: `MapEffectsSettings` is `MapEffectsConfig`, and nests each knob along its id: `new MapEffects(map, { bloom: { intensity: 0.5 } })`. `updateConfig` replaces each effect it names, while `setKnob` and `setKnobs` keep the rest of an effect. The constructor, `applyConfig` and `updateConfig` no longer check values at run time, as on a map module. `setKnob` and `setKnobs` do. The plugin needs SDK 1.0.0-rc.2
  - agent-toolkit: `setMapStyling` reads the styling knobs at their paths, and the plugin needs SDK 1.0.0-rc.2
  - examples: the map effects playground restores its panel from `localStorage` with `setKnobs`

### Patch Changes

- map: `TrafficAreaAnalyticsModule` metric filters no longer make MapLibre validate the whole style on each change

- map: a traffic flow section at a standstill reports `absoluteSpeed: 0` from `TrafficFlowModule.getRenderedFeatures()` and its events, instead of leaving it `undefined`

- license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- map: The map fills its container from the first frame on pages whose scrollbars take up layout space, as on Windows
  - If the page didn't import the MapLibre CSS, the canvas could stay about one scrollbar width short on the right and bottom until the window was resized

- map: a knob or config change on a data-owned module writes only the layer properties whose value changes, so a value set on its layers with `mapLibreMap` stays until a change sets that property
  - map: changing a `GeometriesModule`'s `line.color` keeps a fill opacity or label size set on its layers, and the same holds for routes, places, reachable ranges, custom GeoJSON, traffic incident details and area analytics

- map: Set every label on the map in one typeface, from the style's serif and italic faces or your own font files, and give the labels of a route, places or geometries one of their own
  
  - The `labels.typeface` knob of `StylingFoundationsModule` takes `sans`, `sans-italic`, `serif` or `serif-italic` (`mapTypefaces`), each label keeping its weight
  - `labels.customTypeface` takes your own font file URLs per weight (`CustomTypeface`), which the map downloads itself; characters outside their range are drawn in the style's Noto face
  - The labels of routes, places, geometries, reachable ranges and incident details follow the map's typeface unless their module sets its own
  - Each module's label settings take the same `typeface` (a knob: `label.typeface`, `waypoints.label.typeface`, `lineLabel.typeface`) and `customTypeface`, for those labels alone
  - The waypoint, geometry and reachable-range `font` knobs have no default, so `getKnob` returns `undefined` until you set one. Unset, those labels are in `Noto-Bold` set in their typeface
  - `exportStyle()` returns labels set in font files in the style's own Noto faces, since only the SDK can draw those files
  - New `map-typeface` example, with ten open-source font families and a typeface each for the map, the waypoints, the museums and a district
  - `map-styling-playground` shows the typefaces in its Labels section, beside a route, museums and a district, and its sections now collapse
  - `themed-map` sets its labels in Fraunces from the first frame

- map: `RoutingModule`, `PlacesModule`, `CustomGeoJSONModule` and `TrafficIncidentDetailsModule` keep their events and `sourceAndLayerIDs` in step with the layers a later config change adds or removes
  - A removed layer, such as a section icon, an `additional` layer, a custom source's layer or the incident highlight halo, used to stop hover and click for every module on the map. An added layer got no events and was missing from `sourceAndLayerIDs`

- map: `POIsModule`'s `filters.categories` narrows the micro markers too, so the dots of filtered-out categories no longer show from zoom 15.5, nor come back from `getRenderedFeatures()`

- map: `RoutingModule.setSectionFocus` rings any section or leg of the shown routes, so your UI can point at the stretch it describes
  
  - The ring outlines the route clear of its hovered outline and section halos rather than covering them, black on a light style and white on a dark one, as the traffic incident highlight does
  - `highlight.section.outline.color` and `highlight.section.outline.widthFactor` restyle it, as config or as routing knobs
  - `getShown().sectionFocus` holds the focused sections, and `showRoutes` clears them
  - examples: `route-leg-options-playground` rings the leg you point at or focus in its panel
  - examples: `route-styling-playground` rings the route's toll roads, with a colour and a width control for the ring

- map: the `maplibre-gl` peer dependency moves up to `^6.13.0`

- map: a route's speed limit signs draw from zoom 11 by default, one zoom after the tunnel and closed-road signs, so they no longer crowd the overview of a route; `sections.speedLimit.sign.minZoom` still sets it

- map: a `TerrainModule` change that leaves the 3D surface as it was, such as a hillshade knob, no longer makes MapLibre rebuild the terrain

- tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 1.0.0-rc.1

### Patch Changes

- `npm install @tomtom-org/maps-sdk` installs the 1.0.0 release candidate, with no `@rc` needed, and the npm page shows its README

## 1.0.0-rc.0

### Major Changes

- core, services, map: 1.0.0, the first stable release of the SDK. The *Upgrading to 1.0 from a 0.x release* guide lists every change to apply from a 0.x release.

### Minor Changes

- **Breaking:** core, services, map: the error codes take the TomTom Navigation SDK's names: `API_KEY_REJECTED` is `INVALID_CREDENTIALS`, `SERVICE_UNAVAILABLE` is `LIVE_SERVICE_NOT_AVAILABLE`, `NETWORK_ERROR` is `NETWORK_NOT_AVAILABLE` and `UNEXPECTED` is `INTERNAL`
  **Breaking:** core, services, map: a `403` is `INSUFFICIENT_PERMISSIONS`, a valid key not allowed the request, and `INVALID_CREDENTIALS` is a `401` only, a key the API does not know
  - services, map: `SDKError.canRetry` and `TomTomMapError.canRetry` are `true` for `RATE_LIMITED`, `LIVE_SERVICE_NOT_AVAILABLE` and `NETWORK_NOT_AVAILABLE`, the failures that clear on their own
  - services: a `403` keeps the API's message, and `SDKServiceError.apiErrorCode` holds the API's own code: `'Forbidden'` when the API is not enabled for the key, `'InvalidReferer'` when its domain restriction refused the page
  - services: `calculateReachableRange` and `calculateReachableRanges`, in Private Preview, name the access a key lacks, and link the Private Preview terms, in the message; the access is also in `SDKServiceError.privatePreviewAccess`, `{ product, requestAccessURL }`
  - map: a style, tile, sprite or glyph answered `403` reaches the error handlers as `INSUFFICIENT_PERMISSIONS`

- **Breaking:** map: the sky, space, incident delay and hillshade knobs are named as every other knob is: a part's settings sit under it, and no name repeats its parent
  - map: `StylingFoundationsModule` knob ids `view.sky`, `view.skyColor`, `view.horizonColor` and `view.spaceColor` are `view.sky.visible`, `view.sky.color`, `view.sky.horizonColor` and `view.space.color`, in `styleColorKnobIds`, `getStyleColor` and map presets too
  - map: `TrafficIncidentsModule` `filters: { delays: { mustHaveDelay, minDelayMinutes } }` is `filters: { delays: { required, minMinutes } }`, and the knob ids follow
  - map: `TerrainModule` `hillshade: { lightDirection, exaggeration, shadowColor, highlightColor, accentColor }` is `hillshade: { light: { direction }, intensity, colors: { shaded, lit, steep } }`, and the knob ids follow, in `styleColorKnobIds` and `getStyleColor` too; `exaggeration` is now only the raised surface's vertical scale
  - agent-toolkit: `setMapStyling`'s globe example sets `view.sky.visible`

- **Breaking:** map: `PlacesKnob` and the traffic knob types list only the kinds their catalogues hold, so a `switch` over their `kind` drops the cases no entry reaches
  - `PlacesKnob` no longer includes `text`
  - `TrafficFlowKnob`, `TrafficIncidentsKnob`, `TrafficIncidentDetailsKnob` and `TrafficAreaAnalyticsKnob` no longer include `image`

- **Breaking:** map: the last config properties and knob ids off the shared vocabulary follow it: a size preset is a `*Preset`, a fill style sits under `fill`, and a unit is named once
  - map: `GeometriesModule` and `ReachableRangesModule` take `fill: { style }` instead of `fillStyle`, and `TrafficAreaAnalyticsModule` `regionPolygon: { fill: { style } }` instead of `regionPolygon.fillStyle`; a feature's `properties.fillStyle` stays
  - map: `RoutingModule` `width`, `sections.<type>.width` and `waypoints.size` are `widthPreset`, `sections.<type>.widthPreset` and `waypoints.sizePreset`
  - map: `PlacesModule` `cluster.source` takes `radius`, `maxZoom`, `minPoints` and `properties` instead of MapLibre's `clusterRadius`, `clusterMaxZoom`, `clusterMinPoints` and `clusterProperties`, typed by `PlacesClusterSourceConfig`
  - map: `PlacesModule` `label.offset` is `label.distance`, since an `offset` is an `[x, y]` displacement on every module
  - map: `TrafficAreaAnalyticsModule` `height.maxHeightMeters` and `height.minHeightMeters` are `height.maxMeters` and `height.minMeters`, in `setHeight` too
  - map: each renamed property's knob id follows it
  - agent-toolkit: the tools keep their parameters, and the plugin needs SDK 1.0.0-rc.0

- **Breaking:** map: the map loads TomTom standard styles only, so a custom style URL or style JSON no longer loads
  - `StyleInput` no longer takes `{ type: 'custom', url }` or `{ type: 'custom', json }`, and `CustomStyle` and `CustomStyleSource` are no longer exported
  - `lightDarkTheme` is gone with them: `map.styleLightDarkTheme` follows from the standard style ID
  - Restyle a standard style at runtime with `StylingFoundationsModule` and `setMapColors` instead

- **Breaking:** core, services, map: the SDK no longer offers real-time EV charging availability, nor routes and reachable ranges planned on a vehicle consumption model; search results keep their static EV station data
  - services: `evChargingStationsAvailability`, `getPlacesWithEVAvailability`, `getPlaceWithEVAvailability` and `hasChargingAvailability` are removed
  - services: long-distance EV routing is removed: `vehicle.preferences`, `chargingStopsStrategy` and `chargingStopsStrategies`
  - services: `vehicle` takes `model.dimensions.weightKG`, `state.heading` and `restrictions` only: `engineType`, `model.engine`, `model.variantId` and the charge and fuel state are removed, with the electric, combustion and generic vehicle types
  - core: the reachable-range budgets `remainingChargePCT`, `spentChargePCT` and `spentFuelLiters` are removed; a budget is `timeMinutes` or `distanceKM`
  - core: route and leg summaries lose their battery, charge and fuel fields and `chargingInformationAtEndOfLeg`, with `ChargingStop`
  - core: `ChargingPark.availability`, `ChargingPoint.status` and `dataSources.chargingAvailability` are removed; `StaticChargingPoint` becomes `ChargingPoint`, and `ChargingStation` takes no type parameter
  - map: `PlacesModule` loses `evAvailability`, `categoryIcons` entries lose `availabilityLevel`, and `RoutingModule` loses `chargingStops`, with their knobs, events and shown data
  
  The *Upgrading to 1.0 from a 0.x release* guide lists every removed name.

- **Breaking:** map: each standard style ID is the Orbis style it loads, in camelCase
  - map: `standardLight`, `standardDark`, `drivingLight`, `drivingDark` and `satellite` are `streetLight`, `streetDark`, `streetLightDriving`, `streetDarkDriving` and `streetSatellite`; `monoLight` and `monoDark` stay
  - agent-toolkit: `setMapStandardStyle` takes the new IDs, `resetState` reverts to `streetLight`, and the plugin needs SDK 1.0.0-rc.0
  - map-theme, landmarks-3d: their docs name the new IDs

### Patch Changes

- map: the `maplibre-gl` peer dependency moves up to `^6.12.0`

- core, services, map: the package ships without source maps, so a stack trace through the SDK points into its minified bundles, which keep their function names
  - An app's own source maps still lead a trace to the SDK's frames (`map/dist/map.es.js:1:84523`); share such a trace in a report and TomTom maps it back to the source

- map: `TerrainModule` sets the hillshade light's height and what its direction turns with, and the `multidirectional` method fans its four lights around the light's direction
  - map: `hillshade.light.altitude`, in degrees above the horizon, and `hillshade.light.alignment`, `viewport` or `map` (`hillshadeLightAlignments`), in the config and as `terrainKnobCatalogue` knobs
  - map: with `method: 'multidirectional'`, `hillshade.light.direction` is the centre of four lights spread over 135°

- map: `TrafficIncidentsModule` can show planned incidents, and its incident descriptions follow the map language
  
  - `timeValidity: ['present', 'future']` brings scheduled roadworks and closures in next to the incidents under way, also as the `timeValidity` knob
  - `description` is in the map language, or the nearest one the traffic service has (`pt-PT` for `pt-BR`), else English; `map.setLanguage` reloads the incident tiles when that changes
  - core: `trafficIncidentTimeValidities` lists every `TrafficIncidentTimeValidity`, `present` first

## 0.64.0

### Minor Changes

- **Breaking:** map: CustomGeoJSONModule places its layers with `beforeLayerConfig`, as every other module does, and can still put a layer below any layer outside the style
  - map: a layer's `beforeID: mapStyleLayerIDs.lowestLabel` is `beforeLayerConfig: 'lowestLabel'`; `beforeLayerConfig: { layerID }` goes below another layer, such as one of this or another module's
  - map: `beforeLayerConfig` on the module places every layer that sets none, `'top'` by default
  - agent-toolkit: `setByodLayers` keeps its `beforeID` parameter and needs SDK 0.64.0

- **Breaking:** map: the event-state methods are `setEventState`, `clearEventState` and `clearEventStates`, and the style-owned modules' `getShown()` is `getRenderedFeatures()`
  - map: `putEventState`, `cleanEventState` and `cleanEventStates` are renamed on every data-owned module and its named scopes; `PutEventStateOptions`, `CleanEventStateOptions` and `CleanEventStatesOptions` are `SetEventStateOptions`, `ClearEventStateOptions` and `ClearEventStatesOptions`
  - map: `POIsModule`, `TrafficFlowModule` and `TrafficIncidentsModule` `getShown()` is `getRenderedFeatures()`, what their tiles render in view; the data-owned modules keep `getShown()`, the data `show` was given

- **Breaking:** map: every module's `highlight` names the part it changes, then the property, so the hovered and clicked look reads the same across modules
  - RoutingModule: `highlight: { outlineWidthFactor }` is `highlight: { outline: { widthFactor } }`, knob id `highlight.outline.widthFactor`
  - GeometriesModule and ReachableRangesModule: `highlight: { fillOpacityFactor, lineWidthFactor }` is `highlight: { fill: { opacityFactor }, line: { widthFactor } }`, knob ids `highlight.fill.opacityFactor` and `highlight.line.widthFactor`
  - TrafficIncidentDetailsModule: `highlight: { outlineColor, widthFactor }` is `highlight: { outline: { color }, line: { widthFactor } }`, knob ids `highlight.outline.color` and `highlight.line.widthFactor`

- **Breaking:** services, map: a `commonBaseURL` on `http:` is refused unless it is a loopback address (`localhost`, `127.0.0.0/8`, `[::1]`), so the API key never travels in the clear
  - services: such a call rejects with an `SDKError` coded `INSECURE_BASE_URL` before any request, even with `validateRequest: false`
  - map: the `TomTomMap` constructor throws a `TomTomMapError` coded `INSECURE_BASE_URL`
  - a relative base URL, such as `/api`, still follows the page

- **Breaking:** map, services: internals that were exported without documentation are no longer exported
  - map: `EventsProxy`, `sharedInstance`, `TomTomMapSource`, `InternalTomTomMapParams`, `poiLayerIDs`, `buildRoutingLayers` and `ROUTE_LINE_OUTLINE_COLOR`, whose value the upgrade guide gives
  - services: the geometry data wire-format types `GeometryDataResponseAPI` and `AdditionalDataAPI`
  - flyover: the arrow marker keeps its default fill, now defined in the plugin rather than imported from the SDK

- **Breaking:** map: a shape's edge is its outline and a label's is its halo, in every module
  - map: the map colour `labelOutline` is `labelHalo`, knob id `colors.labelHalo`
  - map: PlacesModule `cluster.badge.strokeColor` and `strokeWidth` are `outlineColor` and `outlineWidth`, knob ids `cluster.badge.outlineColor` and `cluster.badge.outlineWidth`
  - map-theme: `deriveMapColors`, `deriveMapColorsFromCss` and `deriveMapColorsFromImage` return `labelHalo` in place of `labelOutline`, and need SDK 0.64.0

- **Breaking:** map: ReachableRangesModule's border labels are `lineLabel`, as GeometriesModule names the labels along a line
  - `label` is `lineLabel`, its knob ids `lineLabel.*`, and `ReachableRangeLabelConfig` is `ReachableRangeLineLabelConfig`

- **Breaking:** services: `getSearchSuggestions` takes `limit` and `geoBias: { position }`, as the other searches name them
  - `getSearchSuggestions({ maxResults: 8, origin: [4.9, 52.37] })` is `getSearchSuggestions({ limit: 8, geoBias: { position: [4.9, 52.37] } })`; defaults and behaviour are unchanged

- **Breaking:** services, map: every SDK error names what went wrong in a `code`, one of `SDKErrorCode`, and carries the `sdkVersion` that raised it
  - core: `sdkErrorCodes` lists the codes: `INVALID_REQUEST`, `INSECURE_BASE_URL`, `API_KEY_REJECTED`, `NOT_FOUND`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`, `NETWORK_ERROR`, `ABORTED`, `WEBGL_UNSUPPORTED`, `WEBGL_CONTEXT_LOST`, `STYLE_LOAD_FAILED`, `UNEXPECTED`
  - services: a request that gets no response rejects with `NETWORK_ERROR`, keeping what `fetch` threw as its `cause`
  - **Breaking:** services: `SDKError`'s third constructor argument is an options object, `{ code, issues?, cause? }`, instead of the Zod issues
  - map: `TomTomMap.addErrorHandler` receives every failure after construction as a `TomTomMapError`: a style, tile, sprite or glyph that failed to load, with its `status` and `sourceId`, and a lost WebGL context
  - map: the `TomTomMap` constructor throws a `TomTomMapError` with `WEBGL_UNSUPPORTED` when the browser has no WebGL2, and `setStyle` rejects with one when the style fails to load

- **Breaking:** core, services, map: 37 internal helpers and types are no longer exported, or no longer in the published types
  - **Breaking:** core: `bboxExpandedWithPosition`, `bboxExpandedWithBBox`, `bboxExpandedWithGeoJSON`, `toPointFeature`
  - **Breaking:** services: `ServiceTemplate`, `ParseResponseError`, `ParsedFetchResponse`, `RequestOptions`, `parseDefaultResponseError`, `buildResponseError`, `buildValidationError`
  - **Breaking:** map: `renderedRefId`, `findFeatureByRefId`, `filterLayersBySources`, `withEventState`, `combineEventScopes`, `scopedLayerSpecs`, `reservedScopeNames`, `assertNoReservedScopeNames`, `getIconIDForPlace`, `getPOIGroupForPlace`, `getPOILayerCategoryForPlace`, `STOP_DISPLAY_LABEL`, `getStyleCategories`
  - **Breaking:** core: helpers its packages share are left out of the published types, so TypeScript no longer resolves them: `mergeFromGlobal`, `TomTomHeaders`, `generateTomTomHeaders`, `bboxOnlyIfWithArea`, `getPositionStrict`, `toPointGeometry`, `poiCategoriesToID`, `poiCategoriesToIDs`, `poiIDsToCategories`, `getRoutePlanningLocationType`, `iconToTrafficIncidentCategory`, `trafficIncidentToIconCategory`, `MILE_IN_METERS`

### Patch Changes

- map: `MapLibreOptions` no longer accepts `transformRequest`, which the SDK sets itself, so a value that never took effect is now a type error
  - route TomTom requests through a proxy of your own with `commonBaseURL` instead

- map: a Vite build or dev server renders the map with no MapLibre worker setup: `TomTomMap` starts MapLibre's web worker from the copy Vite builds out of your own `maplibre-gl`, served from your app's origin
  - `registerMapLibreWorker: false` keeps MapLibre's own worker lookup
  - MapLibre's own lookup also stays in place when you already called its `setWorkerUrl`, when MapLibre loads unbundled from a CDN, and under webpack's default classic workers

- core: a partial `retry` passed to `TomTomConfig.instance.put` takes its missing fields from the default retry config
  - `put({ retry: { timeoutMs: 10000 } })` no longer leaves `initialWaitMs` and `backoffFactor` undefined, which made `429` retries wait `NaN` milliseconds

- core: `sendUserAgentHeader: false` in the global config, or in a map's or a service call's params, stops requests from carrying the `tomtom-user-agent` header

- services, map: import as values the catalogues that only exported their types
  - services: `arrivalSides`, `chargingStopsStrategies` and `functionalRoadClasses` from `@tomtom-org/maps-sdk/services`, as `routeTypes` already is
  - map: `AREA_ANALYTICS_DEFAULTS` from `@tomtom-org/maps-sdk/map`

## 0.63.0

### Minor Changes

- **Breaking:** map: TrafficAreaAnalyticsModule names its settings as the other modules do, so its config and knob ids change
  - `metricConfig` is `metrics`, and its knob ids `metrics.<metric>.*`
  - a colour stops' `valueType` is `scaleMode`, taking the height's values: `'predefinedRange'`, `'currentRange'` and `'raw'`; `AreaAnalyticsValueType` is `AreaAnalyticsScaleMode`
  - `regionPolygon` takes `fill: { opacity }`, `line: { opacity, width }` and `fillStyle: 'filled' | 'inverted'` in place of `fillOpacity`, `outlineOpacity`, `outlineWidth` and `inverted`

- **Breaking:** map: whole base-map layer groups are `BaseMapModule`'s alone; the StylingModule knobs `basemap.<group>`, `buildings.footprints`, `buildings.3d` and `roads.shields` are gone
  - map: show or hide a group with `baseMap.setVisible(visible, { layerGroups: { show: 'only', values: ['buildings3D'] } })`, or `setKnob(baseMap, baseMapKnobCatalogue, 'groups.buildings3D.visible', true)`
  - map: the `data-viz`, `night-driving` and `minimal` presets no longer show or hide the building groups and the road shields
  - agent-toolkit: the `toggleTilesBaseMapLayerGroups` tool shows and hides whole groups, or the whole base map, and reports which groups are hidden; `setMapStyling` no longer takes the group knobs

- **Breaking:** map: TrafficFlowModule and TrafficIncidentsModule `filters` is one filter, its fields set directly, and `any` adds the further filters a feature may match instead: `filters: { any: [{ roadCategories }] }` becomes `filters: { roadCategories }`, and the knob ids drop `any.0` (`filters.roadCategories.values`). Flow's `showRoadClosures` is `roadClosures`. `TrafficFlowFilters` and `TrafficIncidentsFilters` are `FiltersWithAlternatives` of their one filter. BaseMapModule `layerGroups` take the `{ show: 'only' | 'all-except', values }` filter POIs and traffic use, instead of `{ mode: 'include' | 'exclude', names }`.

- map: **Breaking:** `GeometriesModule` takes MapLibre border overrides only through `layers.line`
  - **Breaking:** `line.layer` is removed; move its `paint` and `layout` to `layers: { line }`, which takes precedence over the curated `line` fields where `line.layer` sat under them

- **Breaking:** map: the TrafficIncidentDetailsModule `focus` setting is `highlight`, the look of a focused, hovered or clicked incident; `setFocus` and the `focused` state keep their names
  - map: `IncidentFocusStyle` is `IncidentHighlightConfig`, the knob ids `focus.outlineColor` and `focus.widthFactor` are `highlight.outlineColor` and `highlight.widthFactor`
  - map: the `layers.focusHalo` override is `layers.highlightHalo`, and the layer id suffix `-focus-halo` is `-highlight-halo`

- **Breaking:** map: `setKnob`, `getKnob` and `resetKnob` set, read and reset a knob by id on every module, `StylingFoundationsModule` included, which loses its own `set`, `get` and `reset`
  - `styling.set(id, value)` is `setKnob(styling, stylingFoundationsKnobCatalogue, id, value)`, `styling.get(id)` is `getKnob(styling, stylingFoundationsKnobCatalogue, id)`, `styling.reset(id)` is `resetKnob(styling, stylingFoundationsKnobCatalogue, id)`, and `styling.reset()` is `styling.resetConfig()`
  - `getKnob(module, catalogue, id)` returns the value in force, or the catalogue default where the configuration sets none
  - `resetKnob(module, catalogue, id)` drops the knob from the configuration, so a `setKnob` then a `resetKnob` leaves `getConfig()` as it was
  - `KnobTarget` types what the three functions take, for a control panel written once for any module

- **Breaking:** map: a knob's range is read from its catalogue with `knobEntryOf(catalogue, id)`, and the `*_RANGE` constants that repeated it are no longer exported
  - `ROUTE_WIDTH_FACTOR_RANGE`, `ROUTE_WAYPOINT_SIZE_FACTOR_RANGE`, `ROUTE_WAYPOINT_HIGHLIGHT_SIZE_FACTOR_RANGE`, `SECTION_ICON_SIZE_FACTOR_RANGE` and `ROUTE_HIGHLIGHT_OUTLINE_WIDTH_FACTOR_RANGE` are `knobEntryOf(routingKnobCatalogue, id).range`
  - `INCIDENT_FOCUS_WIDTH_FACTOR_RANGE` is `knobEntryOf(trafficIncidentDetailsKnobCatalogue, 'highlight.widthFactor').range`
  - **Breaking:** the undocumented route layer colours, widths and size helpers, such as `ROUTE_LINE_FOREGROUND_COLOR` and `getWaypointIconSize`, are no longer exported; `SELECTED_ROUTE_FILTER` and `DESELECTED_ROUTE_FILTER` stay
  - `knobEntryOf` throws an `Error` naming an id its catalogue lacks

- **Breaking:** map: every label names its content `title` and its look with the shared label fields, in a `label` object. PlacesModule `connections.label` takes `{ title, color, haloColor }` instead of a function beside `textColor` and `haloColor`, and the cluster badge's `textColor` and `textSize` move to `badge.label.color` and `badge.label.size`. RoutingModule `countryCrossings.textColor` is `countryCrossings.label.color`. GeometriesModule `label.text` and `lineLabel.text` are `title`. ReachableRangesModule `title` moves to `label.title`, and `palette` to `fill.palette`. The knob ids follow.

- **Breaking:** map: `StylingFoundationsModule` keeps the foundations of the look (label, symbol and road sizes, the map colours and the accent, projection and sky), and every other look knob moves to the module drawing those layers
  - map: the POI knobs are `POIsModule`'s: `pois.sizeFactor`, `pois.minZoom` and `pois.zoomShift` are `sizeFactor`, `minZoom` and `zoomShift`; `pois.labelColor` and `pois.labelOutlineColor` are `label.color` and `label.haloColor`; `pois.microMarkers` is `microMarkers.visible`, in `poisKnobCatalogue` and `POIsModuleConfig`
  - map: the traffic knobs are `TrafficFlowModule`'s and `TrafficIncidentsModule`'s: `traffic.flow.<level>Color` is `colors.<level>` (`colors.slow`, …), `traffic.incidents.<magnitude>Color` is `colors.<magnitude>`, and each module has its own `widthFactor`
  - map: the hillshade knobs are `TerrainModule`'s, under the same `hillshade.*` ids in `terrainKnobCatalogue` and `TerrainModuleConfig`
  - map: the road markings are `BaseMapModule`'s: `roads.exitNumbers`, `roads.arrows`, `roads.restricted` and `roads.underConstruction` are `roads.<part>.visible` in `baseMapKnobCatalogue`, set in `BaseMapModuleConfig` as `roads: { exitNumbers: { visible: false } }`
  - map: the knobs still compose across modules on one layer (`labels.sizeFactor` and the POIs' `sizeFactor` multiply on the POI labels) and survive a style switch
  - map: `getStyleColor(map, id)` reads the colour a style colour knob is at by its map-wide id (`'traffic.incidents.colors.major'`, `'pois.label.color'`, `'colors.water'`), with `styleColorKnobIds` listing them; `StylingColorKnobId` is `StyleColorKnobId`, joined by `StyleKnobId` and `StyleKnobValueOf`

- **Breaking:** map: the undocumented internals `mapDisplayPoiCategoryMappings`, `toBaseMapPOICategory`, `toBaseMapPOIGroup`, `baseMapPOICategoryValues`, `sharedInstanceIfCreated` and `SymbolLayerSpecWithoutSource` are no longer exported; `MapStylePOICategory` stays

- **Breaking:** map: presets are the map's, not `StylingFoundationsModule`'s: `styling.applyPreset(id)` is `await applyMapPreset(map, id)`, which sets the StylingFoundations, BaseMap and POIs knobs each preset names
  - map: `stylingPresetIds`, `stylingPresetCatalogue`, `StylingPresetId` and `StylingPreset` are `mapPresetIds`, `mapPresetCatalogue`, `MapPresetId` and `MapPreset`, with `MapPresetSettings` giving each module's values by its own catalogue ids
  - map: `applyMapPreset` creates the modules the map lacks, takes `{ merge: true }` as before, and throws an `Error` for an unknown id

- **Breaking:** map: RoutingModule's `waypointSize` and `waypointSizeFactor` move into `waypoints` as `size` and `sizeFactor`, beside every other waypoint setting; the knob ids are `waypoints.size` and `waypoints.sizeFactor`

- **Breaking:** map: `StylingModule` is `StylingFoundationsModule`, the name of what it holds now that every other module styles its own layers
  - map: its types and catalogue follow: `StylingFoundationsModuleConfig`, `StylingFoundationsEvents`, `StylingFoundationsKnob`, `StylingFoundationsKnobId`, `StylingFoundationsKnobKind`, `StylingFoundationsKnobRange`, `StylingFoundationsKnobValue`, `StylingFoundationsKnobValueOf`, `StylingFoundationsKnobAppliesTo`, `stylingFoundationsKnobCatalogue`, `stylingFoundationsKnobIds`, `stylingFoundationsKnobKinds` and `stylingFoundationsKnobAppliesTo`
  - agent-toolkit: the base-map state's `getStylingModule()` is `getStylingFoundationsModule()`

- **Breaking:** map: `StylingSettings` is `StylingFoundationsModuleConfig`, the name every other module gives its configuration

- **Breaking:** map: every show-or-hide setting is a `visible` flag, so TerrainModule nests its settings and Places' EV availability drops `enabled`
  - `TerrainModule` takes `{ hillshade: { visible }, elevation: { visible, exaggeration } }`; its knob ids are `hillshade.visible`, `elevation.visible` and `elevation.exaggeration`
  - `terrain.setElevationEnabled` and `isElevationEnabled` are `setElevationVisible` and `isElevationVisible`
  - `PlacesModule`'s `evAvailability.enabled` is `evAvailability.visible`, in the config and as a knob id

- map: `routingKnobCatalogue` publishes the rest of the waypoint label: `waypoints.label.size`, `waypoints.label.haloWidth`, `waypoints.label.opacity` and `waypoints.label.font`, so `RoutingKnob` takes the `enums` kind. Every module's label size and halo width knobs share one range, 6 to 48 and 0 to 10 pixels, widening the places ones.

### Patch Changes

- map: `TrafficAreaAnalyticsModule` colour stops given out of order or sharing a value still paint the cells
  - Each such ramp made MapLibre reject the layer's colour, as did any ramp under `relativeToActualRangePCT` once the loaded data had one value only
  - Stops are sorted, and of stops sharing a value the last given wins

- Built on the refreshed toolchain (`vite` 8.3.2, `rolldown` 1.2.12, Biome 2.5.15); the runtime and peer dependencies are unchanged

- map: every route section icon now wins its space over the map's labels by default, and the speed limit signs give way to all of them
  - map: the tunnel sign and the icons a generated section type asks for (`sections.<type>.icon`) sit above the map's labels, just under the other route icons, instead of under the labels
  - map: under the default `sign.priority`, `belowRouteIcons`, the speed limit signs give way to every route icon, section icons included, and still take precedence over the map's labels
  - map: the speed limit signs draw a tenth smaller, 0.45 to 0.63 from zoom 10 to 16, with their number scaled to match

- map: `sectionSupportsKnob(type, knob)` narrows `type` to `SectionTypeWithKnob<KNOB>`, the section types that take that knob, so a `` `sections.${type}.sign.minZoom` `` id built from it type-checks as a `RoutingKnobId`

- map: two `get()` calls at once on a style-owned module whose part the style lacks, such as `TrafficIncidentsModule`, add that part to the style once
  - Each call found the part missing while the first one's style was still loading, so the second asked for the part twice, which the style service rejects

## 0.62.3

### Patch Changes

- map: a module layer anchored below a layer the style lacks, such as `lowestBuilding` on Satellite, is drawn on top of the map instead of not at all
  - Traffic Area Analytics cells with such a `beforeLayerConfig`
  - Custom GeoJSON layers with such a `beforeID`

- map: routes, places, geometries and every other data-owned module stay drawn through a `setStyle` that carries state, instead of disappearing for the first frames of the new style
  - Their layers are kept through the switch and take on the new style's look in place
  - A clean switch (`resetState: true`) still removes them along with the old style

## 0.62.2

### Patch Changes

- map: `getShown()` on `TrafficIncidentsModule`, `TrafficFlowModule` and `POIsModule` leaves out what `setVisible(false)` just hid
  - MapLibre still returned a hidden layer's icons until its next symbol placement, a few frames later, so a `getShown()` right after hiding listed incidents or POIs no longer drawn

- map: override any MapLibre property of the layers `GeometriesModule`, `ReachableRangesModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule` draw, through a `layers` config merged over their defaults, as `PlacesModule` and `RoutingModule` already take
  - `styling.layers.query` takes the layers of the other style-owned modules as a `group`: `pois`, `trafficFlow`, `trafficIncidents` and `hillshade` (`styleModuleLayerGroupNames`)
  - `styling.layers` and the styling knobs reach only the loaded style's own layers, never the layers a module adds on top of it
  - `GeometriesModule`'s `line.layer` is deprecated in favour of `layers.line`, which takes precedence over the curated `line` fields instead of sitting under them
  - `TrafficAreaAnalyticsModule` keeps the cells within both a metric filter's `min` and its `max`, where it kept the cells within either

- map: draw the map's own POIs of a category with an icon of your own, through `POIsModule`'s `icon.categoryIcons`
  - A `PlacesModule` `categoryIcons` entry also reaches the places of its map category: `RESTAURANT` reaches a searched `ITALIAN_RESTAURANT`, so one list restyles the map's POIs and the places you show alike

- core: the route progress helpers place distances and times between `progress` entries by the line's length, so a position stepped a fixed distance at a time moves at a steady speed
  - They shared the gap between two of the route's sparse entries by vertex count, so positions ran behind in bends, where vertices crowd, and ahead on straights. A fly-over along a mountain route sped up and slowed down by up to five times
  - Covers `getCoordinateAtRouteProgress`, `calculateProgressAtRoutePoint`, `getRouteProgressBetween`, `getRouteProgressForSection` and `getProgressAtNearestRoutePoint`; on a winding route, values between entries can move by a couple of kilometres or minutes

- map: `StylingModule` knobs carried across `setStyle` land on the new style's first frame, instead of fading in from its own colours over the style's `transition` (300 ms by default)
  - Knobs set once the style has drawn keep the style's transition

- map: style a route's waypoint pins per role, letter or hide the stop numbers, set the labels and the hover growth, and give pins icons of your own or a POI category pin per stop.
  
  - `RoutingModuleConfig.waypoints` takes `icon.start`, `icon.middle` and `icon.finish` (a `style` and an `image` each, over `icon.style`), `icon.customIcons`, `icon.mapping` (the `IconMapping` places take), `stopNumbering` (`'numbers'`, `'letters'` or `'none'`), `label.visible`, `label.title` and `highlight.sizeFactor`.
  - `routingKnobCatalogue` lists the new plain settings; `buildWaypointTitle` is exported, and handlers on `events.waypoints` receive the stop's mark as `stopDisplayLabel`.
  - A waypoint setting changed through `applyConfig` now reaches the waypoints already shown, which keep their ids and event states, and the pins repaint when the map's accent changes.
  - Once a handler covers the waypoints, a hovered or clicked pin grows 1.2 times with its stop mark; `waypoints.highlight.sizeFactor: 1` keeps the old look.
  - The stop mark sits in the centre of its pin's head at every waypoint size and zoom; it used to sink towards the pin's point on large pins.
  - `PlacesModule`: an `icon.mapping` that returns `undefined` keeps the place's own icon, and a custom `icon.default.image` replaced at runtime now shows.
  - New example: `route-waypoints-playground`.

## 0.62.1

### Patch Changes

- map: an icon a route posts where a section starts gives way to the waypoint icon on that point, instead of drawing flush against it
  - Covers the speed limit, tunnel and closed-to-vehicles signs, and the ferry, toll-road and traffic icons.
  - The room follows the waypoint icon's `icon-anchor`, so a `layers.waypoints.routeWaypointSymbol` override is honoured.

## 0.62.0

### Minor Changes

- map: **Breaking:** `TrafficAreaAnalyticsModule` colours each metric from a named `palette` or its own `colorStops`, set with `setPalette` and `setColorStops`, and a raw height takes `metersPerUnit`
  
  - map: **Breaking:** `AreaAnalyticsColorTheme` is `AreaAnalyticsPalette`, and `areaAnalyticsPalettes` lists its names. Rename the type
  - map: **Breaking:** `AreaAnalyticsMetricConfig.color` is gone: a palette name goes in `palette`, colour stops in `colorStops`, which wins when both are set, and with neither a metric draws `trafficLight`. Migrate `color: 'heat'` to `palette: 'heat'` and `color: { valueType, stops }` to `colorStops: { valueType, stops }`
  - map: **Breaking:** `setColor` is gone: `setPalette(palette, metrics?)` and `setColorStops(colorStops, metrics?)` each set their own field, and `undefined` clears it. Migrate `setColor('heat')` to `setPalette('heat')` and `setColor({ valueType, stops })` to `setColorStops({ valueType, stops })`
  - map: **Breaking:** the config keeps a palette as its name, so `getConfig().metricConfig.speed.palette` reads `'heat'` where `color` read the stops `setColor('heat')` expanded it to, and `AREA_ANALYTICS_DEFAULTS` gives each metric `palette: 'trafficLight'` instead of colour stops. Read a palette's stops with `resolveColorStops(metric, metricConfig)`, which takes the metric and its config instead of a theme or stops
  - map: **Breaking:** a palette on `networkLength` spans the loaded range, as its default colours do, instead of 0 to 5,000 m. Set `colorStops` with `valueType: 'relativeToPredefinedRangePCT'` to keep the fixed range
  - map: **Breaking:** the raw height's `scaleFactor` is `metersPerUnit`, the metres of height per unit of the metric. Migrate `setHeight({ scaleMode: 'raw', scaleFactor: 10 })` to `setHeight({ scaleMode: 'raw', metersPerUnit: 10 })`
  - map: **Breaking:** in `trafficAreaAnalyticsKnobCatalogue`, `metricConfig.<metric>.color` is `metricConfig.<metric>.palette`, an `enum` knob over `areaAnalyticsPalettes` that defaults to `trafficLight`, and `metricConfig.<metric>.height.scaleFactor` is `metricConfig.<metric>.height.metersPerUnit`. Rename the ids

- **Breaking:** map: `TrafficIncidentsModule.isIconsVisible()` returns the incident icons setting, replacing `anyIconLayersVisible()`.
  
  - **Breaking:** map: `TrafficIncidentsModule.anyIconLayersVisible()` is removed. To read the icons setting, use `isIconsVisible()`; to read a layer itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')`
  - map: `TrafficIncidentsModule.isIconsVisible()` returns `icons.visible`, as the `icons.visible` knob reads, and `isVisible()` while it is unset: `true` for the icons-only `{ visible: false, icons: { visible: true } }`
  - map: `TrafficIncidentsModule.setVisible()` clears `icons.visible` in a new configuration object, leaving the one `getConfig()`, a `config-change` handler or `TrafficIncidentsModule.get()` was given untouched

- map: Waypoint and place connection labels follow the map's light/dark theme like place and geometry labels, and take colour knobs of their own
  
  - `RoutingModule` waypoint labels draw dark grey text on a white halo on a light map and the two swapped on a dark one; `waypoints.label` takes a `LabelConfig`, and `waypoints.label.color` and `waypoints.label.haloColor` join `routingKnobCatalogue`
  - `PlacesModule` connections take `connections.color`, `connections.textColor` and `connections.haloColor`, all three in `placesKnobCatalogue`
  - On a dark map, connection labels and entry points take the same dark grey halo as place labels instead of a near-black one, and a connection label with a custom colour takes a lighter shade of it instead of a darker one
  - Connection labels draw in the map's regular font; they named none, so the map fetched a font TomTom styles do not serve and drew them in a local browser font

- Breaking changes:
  - map: `TrafficIncidentOverlayModule` is `TrafficIncidentDetailsModule`, after the Traffic Incident Details service whose incidents it draws, and its config is `TrafficIncidentDetailsModuleConfig`; its sources and layers are suffixed `traffic-incident-details-N`, no longer `traffic-incident-overlay-N`
  - map: `trafficIncidentOverlayKnobCatalogue`, `trafficIncidentOverlayKnobIds`, `TrafficIncidentOverlayKnob`, `TrafficIncidentOverlayKnobId` and `TrafficIncidentOverlayKnobValueOf` follow the module: `trafficIncidentDetailsKnobCatalogue`, `trafficIncidentDetailsKnobIds`, `TrafficIncidentDetailsKnob`, `TrafficIncidentDetailsKnobId`, `TrafficIncidentDetailsKnobValueOf`
  - map: `StyleModule` is `StylePart` and `styleModules` is `styleParts`, so a part of the style no longer shares its name with the map modules: `include: StyleModule[]` → `include: StylePart[]`
  - map: the `'hillshade'` style part is `'terrain'`, the elevation data both the hillshade and 3D terrain draw from: `include: ['hillshade']` → `include: ['terrain']`
  - map: `TomTomMap.getStyle()` is `getStyleInput()`, as it returns the `StyleInput` the map was given and not the style specification MapLibre's `getStyle()` returns
  - map: `POIsModule.getShown()` returns `{ pois }`, no longer `{ poi }`, and the module's source key is `pois` too

- **Breaking:** map: every module setting changes through `applyConfig`, `updateConfig` or `setKnob`; the setters that changed one setting are removed.
  
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

- map: **Breaking:** `ReachableRangesModule` draws `calculateReachableRanges` results in colours from the map, and a geometry `fill.palette` is a list of your own CSS colours instead of a palette name
  
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

- map: hover and click states survive a style change on every data-owned module, and a user event moves a state your code put.
  
  - map: the hover and click states of shown features survive a style change on `GeometriesModule`, `CustomGeoJSONModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule`, and a `GeometriesModule` geometry keeps its id
  - map: a `TrafficAreaAnalyticsModule` style change no longer emits `shown-features`, as on the other modules
  - map: a user click, right click or hover moves its state off a feature that `putEventState` gave it, instead of leaving two features clicked or hovered at once; a click takes `click` and `contextmenu` off the other features of its source, a hover takes `hover`, `hover-move` and `long-hover`
  - map: an event state no longer writes into the feature objects you passed to `show`; `getShown()` returns a new collection after each state change
  - map: a `PlacesModule` hover, click or `putEventState` after a configuration change keeps the titles, icons and properties that change set, instead of drawing the earlier ones again

- map: every data-owned module reads and writes the event states of the features it shows — `putEventState`, `cleanEventState`, `cleanEventStates` and `getEventStates`.
  
  - map: `PlacesModule`, `RoutingModule`, `GeometriesModule`, `CustomGeoJSONModule`, `TrafficIncidentDetailsModule` and `TrafficAreaAnalyticsModule` act on the main features their `getShown()` returns; `getEventStates()` reads back the ids by event state, what user interactions put as well as yours, as the new `EventStateIds` type
  - map: the named scopes of those modules — `routing.events.waypoints`, `places.events.entryPoints`, `custom.events.<sourceName>`, … — are the new `UserEventsWithStates`, with the same four methods for their own features, so ids that repeat across sources never collide
  - map: `PutEventStateOptions.id` and `CleanEventStateOptions.id` take a number as well as a string, matching a feature's `properties.id`, else its top-level `id`

- map: hovered and clicked routes, geometries and traffic incidents stand out by default; routes and geometries take how much from `highlight` factors, also knobs.
  
  - map: a hovered or clicked route draws a wider outline, selected or not, in its outline colour, `highlight.outlineWidthFactor` times: 1.2 unless set, clamped to `ROUTE_HIGHLIGHT_OUTLINE_WIDTH_FACTOR_RANGE` (1 to 1.25) so a section halo stays in sight, and a knob in `routingKnobCatalogue`; a `layers.mainLines.routeOutline` or `routeDeselectedOutline` line width you give is drawn as given
  - map: a hovered or clicked geometry draws a denser fill and a wider border, in its own colours, `highlight.fillOpacityFactor` (2, 1 to 4, at most opaque) and `highlight.lineWidthFactor` (1.75, 1 to 3) times the opacity and width in force, a configured `fill.opacity` or `line.width` included; both are knobs in `geometriesKnobCatalogue`, and a `line.layer` line width is drawn as given
  - map: a hovered or clicked `TrafficIncidentDetailsModule` incident draws the focus treatment `setFocus` draws, configured by the same `focus` config; `focus: false` turns it off for focused, hovered and clicked incidents alike

- map: `PlacesModule` takes a `beforeLayerConfig` (`PlacesBeforeLayerConfig`), placing its layers in the map's layer stack as one or per part
  - The parts are `places`, for the markers, clusters and entry points, and `connections`, for the connection lines; `all` covers the parts a record leaves out
  - `applyConfig` and `updateConfig` restack the layers, a style change keeps them there and `resetConfig` puts them back. Unconfigured, the layer order is unchanged

- map: `StylingModule` warns about a knob that matches no layer of the loaded style when that knob is set, as documented, instead of warning for every such knob as soon as the module loads (eight warnings on `satellite` before any `set`).

- map: a `CustomImage.image` given as an SVG data URI (`data:image/svg+xml;…`) is drawn, instead of failing to decode and leaving places, waypoints and incidents without their icon.

## 0.61.0

### Minor Changes

- **Breaking:** services: `discoverPlaces` replaces `alongRouteSearch`, and the search response and wire-format types are not exported.
  
  - **Breaking:** services: `alongRouteSearch` is not exported; `discoverPlaces` takes the same params and searches along the route whenever they carry `route`: `alongRouteSearch({ route, maxDetourTimeSeconds, query, filters, sortBy, limit })` → `discoverPlaces({ route, maxDetourTimeSeconds, query, filters, sortBy, limit })`. It resolves to a `DiscoverPlacesResponse`
  - **Breaking:** services: the response types of the three searches `discoverPlaces` runs are not exported: `AlongRouteSearchResponse`, `FuzzySearchResponse` and `GeometrySearchResponse` → `DiscoverPlacesResponse`, `GeometrySearchFeatureCollectionProps` → `SearchSummary`
  - **Breaking:** services: their wire-format types are not exported either, with no replacement: `AlongRouteSearchRequestAPI`, `AlongRouteSearchPayloadAPI`, `AlongRouteSearchResponseAPI`, `AlongRouteSearchResultAPI`, `RoutePointAPI`, `FuzzySearchResponseAPI`, `FuzzySearchResultAPI`, `QueryIntentAPI`, `CoordinateIntentAPI`, `CoordinateIntentDetailsAPI`, `NearbyIntentAPI`, `NearbyIntentDetailsAPI`, `GeometrySearchRequestAPI`, `GeometrySearchPayloadAPI`, `GeometrySearchResponseAPI`, `GeometrySearchResultAPI`, `GeometryAPI`, `PolygonAPI` and `CircleAPI`

- **Breaking:** map: `EVAvailabilityConfig.threshold` defaults to `0.3` for the availability label colour as well as the pin icon, instead of `0` for the label, which drew every station's label green, one with no free charging point included. Set `threshold: 0` to keep the old label colour

- **Breaking:** map: `GeometriesModule` text config is label config, and the geometry config helpers take one options object.
  
  - **Breaking:** map: `GeometriesModule.applyTextConfig()` is `applyLabelConfig()`, after the `label` it sets: `geometries.applyTextConfig({ text })` → `geometries.applyLabelConfig({ text })`
  - **Breaking:** map: `GeometryLabel` is `GeometryLabelConfig` and `GeometryLineLabel` is `GeometryLineLabelConfig`, like `GeometryFillConfig` and `GeometryLineConfig`
  - **Breaking:** map: `fillStyledGeometryConfig` takes one options object: `fillStyledGeometryConfig('retro', 'top')` → `fillStyledGeometryConfig({ palette: 'retro', beforeLayerConfig: 'top' })`
  - **Breaking:** map: `reachableRangeGeometryConfig` takes one options object, and its label function is `title`: `reachableRangeGeometryConfig('cold', 'inverted', 'top', fn)` → `reachableRangeGeometryConfig({ palette: 'cold', fillStyle: 'inverted', beforeLayerConfig: 'top', title: fn })`
  - **Breaking:** map: `prepareReachableRangesForDisplay` takes its fill style and title function in an options object: `prepareReachableRangesForDisplay(result, 'inverted', fn)` → `prepareReachableRangesForDisplay(result, { fillStyle: 'inverted', title: fn })`; `ReachableRangeLabelFn` is `ReachableRangeTitleFn`
  - map: `GeometryLineLabelConfig.text` sets the text of the border labels, a string or a MapLibre expression, as `label.text` does for the center labels; both default to the feature's `title`
  - map: `GeometryLabelConfig.text` is optional, so `label: { size: 18 }` restyles the center labels without restating their text
  - map: `FillStyledGeometryConfigOptions`, `ReachableRangeGeometryConfigOptions` and `ReachableRangesDisplayOptions` name the options objects

- **Breaking:** map: a `GeometriesModule` palette name moves from `fill.color` to the new `fill.palette`.
  
  - **Breaking:** map: `GeometryFillConfig.color` takes a colour or a MapLibre expression; a palette name goes in `fill.palette`. Migrate `fill: { color: 'warm' }` to `fill: { palette: 'warm' }`
  - map: `GeometryFillConfig.palette` gives each `GeometriesModule` feature the next colour of a named palette, on the fill and on a border without its own `line.color`. It sits between `fill.color`, which wins over it, and the top-level `color`; `fillStyledGeometryConfig` and `reachableRangeGeometryConfig` set it, and once it is set an accent change leaves the geometries as they are

- **Breaking:** core: the geopolitical view is set once in `TomTomConfig`, and `View` / `view` are renamed `GeopoliticalView` / `geopoliticalView`.
  
  - **Breaking:** core: `View` is renamed `GeopoliticalView`, and `views` is renamed `geopoliticalViews`
  - **Breaking:** services: the `view` parameter of search, suggestions, geocoding, reverse geocoding and place details is renamed `geopoliticalView`. Migrate `discoverPlaces({ query, view: 'IN' })` to `discoverPlaces({ query, geopoliticalView: 'IN' })`; the request still sends the API's own parameter
  - core: `TomTomConfig.instance.put({ geopoliticalView })` sets the geopolitical view for the map and every service; a map's or a call's own `geopoliticalView` overrides it
  - core: `geopoliticalViews` lists all 20 geopolitical views the TomTom APIs serve, adding `AE`, `BN`, `CL`, `DZ`, `KR`, `MY`, `PH`, `US` and `VN`
  - map: the map draws the borders and names of disputed territories in the configured view, and `TomTomMap.setGeopoliticalView` switches it at runtime, reloading only the visible vector tiles
  - services: a view an API does not serve is left out of its requests, which then use the default view of the caller's country, instead of failing
  - services: `getSearchSuggestions` uses the global geopolitical view when the call sets none

- **Breaking:** map: the knob catalogues gain `enums`, `offset` and `text` knobs, and hold the POI, traffic and routing filters and unit labels.
  
  - **Breaking:** map: `KnobKind` gains `enums`, a list of options, `offset`, an `[x, y]` screen displacement within a `range`, and `text`, any string, so an exhaustive `switch` over `KnobKind` or `KnobEntry['kind']` needs a case for each
  - **Breaking:** map: `POICategoryGroup` is the union of the `poiCategoryGroups` names, `'FOOD_DRINKS_GROUP' | 'TRANSPORTATION_GROUP' | …`, no longer `string`, so `FilterablePOICategory` and `filterCategories` reject a name that is no group or category
  - **Breaking:** map: every module's `…KnobValueOf<ID>` is the plain value at the knob's path, without the expressions and objects the config also takes there. The one id this narrows is `metricConfig.<metric>.color`: `TrafficAreaAnalyticsKnobValueOf` gives `AreaAnalyticsColorTheme` alone; type custom colour stops as `AreaAnalyticsColorStopsConfig`
  - map: `poisKnobCatalogue` holds the category filter: `filters.categories.show` (`only` or `all-except`) and `filters.categories.values`, an `enums` knob over the category groups, then every `MapStylePOICategory`
  - map: `trafficFlowKnobCatalogue` and `trafficIncidentsKnobCatalogue` hold the first `filters.any` alternative: road categories and subcategories, road closures on flow, and incident categories, magnitudes and delays on incidents
  - map: a POI category or traffic values filter missing `show` or `values` filters nothing until the other is set, instead of throwing, so the two knobs can be set one at a time
  - map: `trafficAreaAnalyticsKnobCatalogue` holds `regionPolygon.outlineWidth` and each metric's `height.maxHeightMeters`, `height.minHeightMeters` and `height.scaleFactor`
  - map: `routingKnobCatalogue` holds the unit labels, `displayUnits.distance.*` and `displayUnits.time.*`, as `text` knobs
  - map: a `RoutingModule` `displayUnits` that leaves `distance.type` unset posts the speed limit signs in the global config's unit system, as the summary bubbles already do, so relabelling one unit keeps the global unit system everywhere

- **Breaking:** map: `validateKnobValue` and `setKnob` check and set knob values, and `KnobRange` requires `bounds`.
  
  - **Breaking:** map: `KnobRange` requires `bounds`, which ends a value must keep to: `hard` both, `hard-min` only `min`, `soft` neither, so a range you declare yourself needs one
  - map: `validateKnobValue(entry, value)` checks a value against a knob's kind, range, options or colour syntax, and throws a `RangeError` naming the knob and what it expects
  - map: `setKnob(module, catalogue, id, value)` validates a value, then applies the module's config with it at the knob's path, keeping every other setting; the value is typed from the path
  - map: `StylingModule.set` and `setMapColors` check values with `validateKnobValue`, so their messages match every other module's
  - map: the traffic heights, height scale factor, outline width, delay minutes and area analytics filters, and the geometries line and halo widths, label size and symbol spacing have `hard-min` ranges; the geometries line label offset a `soft` one; opacities, factors and zooms `hard` ones

- **Breaking:** map: each module's `isVisible()` returns its `visible` setting, and `RoutingModule` gains `setVisible` and `isVisible`.
  
  - **Breaking:** map: `isVisible()` on `POIsModule`, `BaseMapModule`, `TrafficFlowModule` and `TrafficIncidentsModule` returns the `visible` setting, as the module's `visible` knob reads, instead of whether any of its layers draws; on `BaseMapModule`, the `visible`, `groups` and styling-toggle settings over the groups asked about. Until something sets it, POIs and the base map report what the style draws and the traffic modules `false`. To read a layer itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')`
  - **Breaking:** map: `TrafficIncidentsModule.isVisible()` is `false` when the incidents are set hidden with `icons: { visible: true }`. Read `anyIconLayersVisible()` for the icons
  - **Breaking:** map: `TerrainModule.isHillshadeVisible()` returns the `hillshade` setting, `false` until something sets it, instead of whether a hillshade layer draws; `isElevationEnabled()` returns the `elevation` setting and, until something sets it, whether the map's own terrain is raised. To read the map itself, use `map.mapLibreMap.getLayoutProperty(layerId, 'visibility')` or `map.mapLibreMap.getTerrain()`
  - **Breaking:** map: `CustomGeoJSONModule.show()` no longer draws the layers of a module hidden with `setVisible(false)` or `visible: false`; data shown while hidden draws on `setVisible(true)`. Call `setVisible(true)` where a `show()` used to reveal them
  - **Breaking:** map: a subclass of `AbstractDataOwnedMapModule` implements `applyVisibility(config)`, which shows or hides what it draws for the `setVisible` and `isVisible` the base class now provides; its config type takes `visible?: boolean`. Move a module's own `setVisible` body into `applyVisibility`
  - map: `RoutingModule` takes `visible` (default `true`), with `setVisible` and `isVisible`. Hiding covers every part it draws and keeps the routes and waypoints through `showRoutes`, `showWaypoints`, `selectRoute`, the clears and style changes, and `routingKnobCatalogue` lists it as the `visible` toggle
  - map: `CustomGeoJSONModule.isVisible()` reads its `visible` setting

- **Breaking:** map: `PlacesModule` and the routing charging stops take `label` instead of `text`, as `GeometriesModule` does.
  
  - **Breaking:** map: `PlacesModuleConfig.text` is `label`, like `GeometriesModuleConfig.label`: `{ text: { title, color } }` → `{ label: { title, color } }`
  - **Breaking:** map: `PlaceTextConfig` is `PlaceLabelConfig`
  - **Breaking:** map: `PlacesModule.applyTextConfig()` is `applyLabelConfig()`, as on `GeometriesModule`: `places.applyTextConfig({ color })` → `places.applyLabelConfig({ color })`
  - **Breaking:** map: `RoutingModuleConfig.chargingStops.text` is `chargingStops.label`: `{ chargingStops: { text: { title } } }` → `{ chargingStops: { label: { title } } }`; `ChargingStopTextConfig` is `ChargingStopLabelConfig`, and the routing knob `chargingStops.text.visible` is `chargingStops.label.visible`

- **Breaking:** map: a `PlacesModule` theme is a marker type (`markerType`, `applyMarkerType`), and `PlacesModuleConfig.color` sets the place colours at once.
  
  - **Breaking:** map: `PlacesModuleConfig.theme` is `markerType`, with the same values: `{ theme: 'base-map' }` → `{ markerType: 'base-map' }`
  - **Breaking:** map: `PlacesModule.applyTheme()` is `applyMarkerType()`: `places.applyTheme('pin')` → `places.applyMarkerType('pin')`
  - **Breaking:** map: `PlacesTheme` is `PlacesMarkerType`, and `placesThemes` is `placesMarkerTypes`
  - map: `PlacesModuleConfig.color` sets the default pin fill, the label of a hovered or clicked place, connection lines and entry points at once. A more specific setting still wins, and once `color` is set an accent change leaves the places as they are
  - map: `PlaceLabelConfig` extends the shared `LabelConfig` and gains `opacity`, drawn as the labels' `text-opacity`
  - map: a `label.size` or `label.haloWidth` of `0` on `PlacesModule` reaches its labels instead of being ignored
  - map: a `PlacesModule` `layers.*.layout` override of `text-size`, `text-font` or `text-field` wins over `label`, as its paint overrides already did

- **Breaking:** services: `getPOICategories` ranks `filters` matches and keeps each filter's best ones, so `'bar'` returns Bar.
  
  - **Breaking:** services: `getPOICategories`, and `getPOICategoryCodes` with it, ranks `filters` matches and keeps each filter's strongest ones, instead of every category whose name or synonym contains it: `'bar'` returns Bar instead of 15 categories including Nail Salon ("Nail Bar") and Toll Gate ("Toll Bar"), and a category code returns that category only
  - services: `getPOICategories` merges several `filters` round-robin, so each filter's best match comes first
  - services: `getPOICategories` `filters` fold accents, so `'cafe'` finds Café, and a blank filter matches nothing instead of every category

- **Breaking:** map: `RoutingModule.getConfig()` returns the configuration as given, and a module without `displayUnits` follows the global units.
  
  - **Breaking:** map: `RoutingModule.getConfig()` returns the configuration as given: without the global `displayUnits` filled in when none were set, and `undefined` after `RoutingModule.create(map)` or `resetConfig()`. Read `TomTomConfig.instance.get().displayUnits` for the units in force when the module config has none
  - map: a `RoutingModule` without `displayUnits` labels its summaries, waypoints and speed limit signs in the global units in force when it draws them, so a later `TomTomConfig.instance.put({ displayUnits })` reaches routes already shown on their next `showRoutes` or configuration change, where the units set at creation used to stay, `updateConfig` included

- **Breaking:** map: `routingKnobCatalogue` lists the `RoutingModule` display settings, and `StylingKnob` types each knob kind strictly.
  
  - **Breaking:** map: `StylingKnob` has one member per `kind`: a `factor` or `number` knob always carries its `range`, an `enum` knob its `options`, and no other kind either, so an entry built with a `range` on a `toggle` or `options` on a `color` knob no longer type-checks
  - **Breaking:** map: `KnobKind` gains `image`, a sprite image id, so an exhaustive `switch` over `KnobKind` needs a case for it
  - map: `routingKnobCatalogue` lists every plain-valued `RoutingModuleConfig` display setting, route-wide and per section type, with its kind, range or options and, where one value holds everywhere, its default; `routingKnobIds` lists the ids. `RoutingKnob` is one entry, `RoutingKnobId` a setting's path in the config, and `RoutingKnobValueOf` the value it takes
  - map: `KnobEntry` is the entry shape every catalogue shares, one member per kind, and `KnobValueOf` the value a knob of each kind holds
  - map: `SectionIconPlacement` names the placements `SectionIconConfig.placement` takes

- **Breaking:** map: `SectionIconConfig.sizeFactor` multiplies the size the section type draws its icon at, rather than setting it: `1` leaves it unchanged, and `ferry`, `tollRoad`, `tunnel` and `vehicleRestricted` keep their zoom ramp under any factor. A `size: 0.8` on `ferry` was a fixed `icon-size` of 0.8; `sizeFactor: 0.8` draws that size from zoom 16.5 and scales down below it

### Patch Changes

- map: `baseMapKnobCatalogue` and `poisKnobCatalogue` list the base map and POI settings a knob holds.
  
  - map: `baseMapKnobCatalogue` lists every `BaseMapModuleConfig` setting, `visible` and one `groups.<group>.visible` toggle per layer group, with its description; `baseMapKnobIds` lists the ids. `BaseMapKnob` is one entry, `BaseMapKnobId` a setting's path in the config, and `BaseMapKnobValueOf` the value it takes
  - map: `poisKnobCatalogue` lists the `POIsModuleConfig` settings a knob holds, `visible` with its default; `poisKnobIds` lists the ids. `POIsKnob` is one entry, `POIsKnobId` a setting's path in the config, and `POIsKnobValueOf` the value it takes
  - map: the `basemap.<group>` entries of `stylingKnobCatalogue` say what their group holds, in the words of the matching `baseMapKnobCatalogue` entry, and name its id

- map: places, routes and the traffic incident overlay follow the styling knob colours live.
  
  - map: `TrafficIncidentOverlayModule` follows the `traffic.incidents.*Color` styling knobs live, set before or after it was created and across `setStyle`
  - map: `PlacesModule` with the `base-map`, `circle-icon` or `pin-clustered` marker type follows the POI label colour, outline and size knobs live; the caller's `label` and `layers` settings still win
  - map: `RoutingModule` draws a route's traffic sections in the `traffic.incidents.minorColor`, `moderateColor` and `majorColor` knob colours when they are set, live; a `layers.sections` override still wins, and with none set the colours are unchanged
  - map: `TrafficIncidentOverlayModule` draws minor jams in the style's own colour instead of the light styles' on every style, the dark ones included

- map: `customGeoJSONKnobCatalogue` lists the `CustomGeoJSONModuleConfig` settings a knob holds, `visible` with its default; the sources' MapLibre layers and cluster options and the images stay the caller's. `customGeoJSONKnobIds` lists the ids. `CustomGeoJSONKnob` is one entry, `CustomGeoJSONKnobId` a setting's path in the config, and `CustomGeoJSONKnobValueOf` the value it takes

- map: `TomTomMap` loads nothing from unpkg.com: neither the MapLibre stylesheet nor the RTL text plugin.
  
  - map: `TomTomMap` no longer fetches the MapLibre stylesheet from unpkg.com, which sent every end user's IP address to a third party and fired even when the app had imported `maplibre-gl.css` itself; when the page lacks the MapLibre CSS, the SDK applies a copy shipped with it as a lazy chunk — served alongside the SDK, not blocked by a strict CSP `style-src`, and in a cascade layer so the app's own CSS still wins
  - map: `TomTomMap` no longer loads the Mapbox RTL text plugin from unpkg.com either; MapLibre shapes Arabic and bidirectional text itself, so right-to-left labels render as before

- map: `GeometriesModule` config changes restyle the geometries already shown.
  
  - map: `GeometriesModule.applyConfig`, `updateConfig`, `resetConfig` and `applyLabelConfig` restyle the geometries already shown — colours, palette, fill style, labels and `transformFeaturesForDisplay` — instead of only the ones a later `show()` draws; a shown geometry keeps its id and event state
  - map: `GeometriesModule.applyConfig` replaces the paint of the previous config, so a config that leaves out the colour, fill, border or label, and `resetConfig()`, return them to the defaults; call `updateConfig` to change one part
  - map: a `GeometriesModule` `label.text` given as a MapLibre expression no longer becomes each geometry's `title`, which the line labels and an expression reading `['get', 'title']` drew as the expression itself; a geometry keeps its own title or address, and a literal `label.text` still sets it
  - map: a config change or a style change after `GeometriesModule.clear()` keeps the map clear, and a style change no longer emits `shown-features`, as on the other modules

- map: `geometriesKnobCatalogue` lists every plain-valued `GeometriesModuleConfig` display setting — colour, fill, border, center and border labels with their fonts, and the border labels' offset — with its kind, range or options and, where one value holds everywhere, its default; `geometriesKnobIds` lists the ids. `GeometriesKnob` is one entry, `GeometriesKnobId` a setting's path in the config, and `GeometriesKnobValueOf` the value it takes

- core: `TimeDisplayUnits.hours` documents its real default, `hr`, which `formatDuration` uses when none is set

- map: `TrafficIncidentOverlayModule.applyConfig` and `updateConfig` apply `focus` to the incidents already shown, instead of only after a style switch: the outline colour and width factor repaint in place, so the `focus.outlineColor` and `focus.widthFactor` knobs of `trafficIncidentOverlayKnobCatalogue` take effect when set, and `focus: false` removes the outline, which a later focus style adds back beneath the incidents

- services: `discoverPlaces` and the new `resolvePOICategories` take POI categories in words.
  
  - discoverPlaces: `filters.poiCategoryQuery` takes categories in words — `'sushi'`, `['gym', 'parking']` — and searches the POI categories they name, resolved in the call's language, so category words reach results in one call instead of a lookup and a search; a word nothing matches is left out, and when none matches the call rejects with `SDKError`
  - `resolvePOICategories` turns words or codes into the `poiCategories` of one search — each word's best three codes, merged round-robin and capped at the 10 a search accepts — and returns the words nothing matched in `unmatched`, for a caller who decides about them before searching; codes alone skip the catalog request

- map: `preparePlacesForDisplay`, what `PlacesModule.show()` does to the places it is given, is documented along with `toPlaces` and `buildPlaceTitle`, and takes `(places, config)`. The places guide shows your own GeoJSON points drawn through `show()`. `ShownPlaces` names the three places results that are not places — search suggestions, `geometryData` polygons, EV availability — and what shows each instead

- services: `getPlacesWithEVAvailability` takes `maxConcurrentRequests`, and its result type allows places without availability.
  
  - services: `getPlacesWithEVAvailability` takes `maxConcurrentRequests` (default 1, one request at a time as before) to send that many availability requests at once; the places keep their input order. `PlacesWithEVAvailabilityOptions` names its options
  - services: `getPlacesWithEVAvailability(places)` without options is typed as places that may lack availability, as it returns them; only `excludeIfAvailabilityUnknown: true` types every place as having it
  - services: the `discoverPlaces` docs name all three searches it runs, along-route search when `route` is given included

- map: `placesKnobCatalogue` lists every plain-valued `PlacesModuleConfig` display setting — marker type, colour, visibility, default pin style, label, cluster badge and source, EV availability and entry points — with its kind, range or options and, where one value holds everywhere, its default; `placesKnobIds` lists the ids. `PlacesKnob` is one entry, `PlacesKnobId` a setting's path in the config, and `PlacesKnobValueOf` the plain value it takes

- map: `PlaceLabelConfig` says to set place labels through the module config rather than with MapLibre's `setPaintProperty` or `setLayoutProperty` on its layers, which a style change or a marker type change rebuilds from the config

- map: `PlacesModule` documents what a place keeps across `show()`, `clear()` and style changes — `show()` replaces and drops the event states and connections of what it replaces, even under the same id, while style and configuration changes keep both — and `getShown()` states that it returns the places as drawn, with their display properties and event states

- map: `PlacesModule.create<P>`, `applyLabelConfig<P>`, `applyIconConfig<P>` and `preparePlacesForDisplay<P>` type the `label.title` and `icon.mapping.fn` callbacks for the place shape `P` you name, as `extraFeatureProps` already was, so a callback reading a property of your own data no longer needs a cast

- services: `calculateReachableRange` and `calculateReachableRanges` return polygons whose ring ends on its first position, as GeoJSON requires; the API's boundary leaves it open, which spatial libraries such as Turf reject

- services: `calculateReachableRanges` rejects on a `401` like it does on a `403` or a `429`, instead of skipping the range as one the engine could not compute and returning no polygons

- `calculateReachableRanges` says in its TSDoc that a range the service answers with an error, such as `NO_RANGE_FOUND` for an origin off the road network, is skipped rather than thrown, so the result can hold fewer polygons than requested.

- map: the route's instruction arrows scale with `widthFactor`, instead of keeping one size as the line around them grows or shrinks. The `width` presets draw them as before

- map: the stop number inside a waypoint pin scales with the pin, so it stays in the pin's head at every `waypointSize` and `waypointSizeFactor`; the `'s'` and `'l'` presets draw it at 0.75× and 1.25×

- map: `PlacesModuleSerializableConfig`, `RoutingModuleSerializableConfig`, `GeometriesModuleSerializableConfig` and `CustomGeoJSONModuleSerializableConfig` type the part of each module's configuration that survives JSON, leaving out the functions and image elements those modules also take; `SerializableCustomImage` is a `CustomImage` with a string `image`. Every module's configuration, exported with `JSON.stringify(module.getConfig())` and given back to `applyConfig`, holds the same configuration and draws the same layers, and the map modules guide shows how to save and replay one

- map: `terrainKnobCatalogue` lists every `TerrainModuleConfig` setting — the hillshade, the 3D surface and its exaggeration — with its kind, the exaggeration's `hard-min` range (at least 0.5; above 3 still applies) and, where one value holds everywhere, its default; `terrainKnobIds` lists the ids. `TerrainKnob` is one entry, `TerrainKnobId` a setting's path in the config, and `TerrainKnobValueOf` the value it takes

- map: `trafficFlowKnobCatalogue`, `trafficIncidentsKnobCatalogue`, `trafficIncidentOverlayKnobCatalogue` and `trafficAreaAnalyticsKnobCatalogue` list each traffic module's plain-valued settings with their kind, range or options and, where one value holds everywhere, their default; the matching `…KnobIds` arrays list the ids. `TrafficFlowKnob`, `TrafficIncidentsKnob`, `TrafficIncidentOverlayKnob` and `TrafficAreaAnalyticsKnob` are one entry each, their `…KnobId` a setting's path in the module config, and their `…KnobValueOf` the value it takes

- security: a new guide, What the SDK sends, and where, lists what the browser sends to TomTom and to third parties, which values travel in URLs and so land in logs, and whose session cookie proxy mode carries, for a privacy notice or records of processing

## 0.60.0

### Minor Changes

- **Breaking:** map: `GeometriesModule`'s `fill.beforeLayerConfig` and `line.beforeLayerConfig` are removed; use `beforeLayerConfig: { fill, line }` on the module config, `all` covering any part it doesn't name
- **Breaking:** map: `GeometryBeforeLayerTargets` is removed; the record form of `GeometryBeforeLayerConfig` is `PartsBeforeLayerConfig<'fill' | 'line'>`'s
- **Breaking:** map: `TrafficAreaAnalyticsModule`'s nested `beforeLayerConfig` shape is removed; key it by display mode instead: `hexgrid.flat2D` → `'hexgrid-2d'`, `hexgrid.extrusion3D` → `'hexgrid-3d'`, likewise for `square`, plus `all` for the rest
- **Breaking:** map: `GeometriesModule.applyConfig` puts a part the applied config's `beforeLayerConfig` names no target for back at its default place, as a style change does — every part, when the applied config has no `beforeLayerConfig`. `moveBeforeLayer` still leaves such a part where it is
- **Breaking:** map: `RoutingModule.getLayerToRenderLinesUnder()` returns `string | undefined`, following `beforeLayerConfig` and undefined when the route lines are on top; unconfigured, it still returns `mapStyleLayerIDs.lowestLabel`
- map: `RoutingModule` takes a `beforeLayerConfig`: one target for the whole route, or one per part — `mainLines`, `instructionLines`, `icons` — plus `all`. `applyConfig` and `updateConfig` restack the layers, and a style change keeps them there. Unconfigured, the layer order is unchanged
- map: `PartsBeforeLayerConfig` is the one shape every module's `beforeLayerConfig` takes: a single `BeforeLayerConfig`, or a record of the module's own part names plus `all`. `GeometryBeforeLayerConfig`, `AreaAnalyticsBeforeLayerConfig` and `RoutingBeforeLayerConfig` are built on it
- map: `TrafficAreaAnalyticsModule.moveBeforeLayer` emits `config-change`, as `GeometriesModule` and `TrafficIncidentOverlayModule` do

- **Breaking:** map: `RoutingModuleConfig.theme` and the `RouteTheme` type are removed. `theme.mainColor` → `color`, `theme.routeWidth` → `width`, `theme.waypointSize` → `waypointSize`, all top-level: `{ theme: { mainColor: '#f00', routeWidth: 'l' } }` becomes `{ color: '#f00', width: 'l' }`
- **Breaking:** map: `SectionIconConfig.size` → `sizeFactor`, now clamped to `SECTION_ICON_SIZE_FACTOR_RANGE` (0.25–2)
- map: `RoutingModuleConfig.widthFactor` and `waypointSizeFactor` multiply the `width` and `waypointSize` presets, and a section's `widthFactor` its own `width`; clamped to the published `ROUTE_WIDTH_FACTOR_RANGE` and `ROUTE_WAYPOINT_SIZE_FACTOR_RANGE` (0.5–2). The presets draw the sizes they did

### Patch Changes

- services: the `ChargingModel.batteryCurve` reference says a route with charging stops needs it; the service rejects such a request without one

## 0.59.0

### Minor Changes

- **Breaking:** map: `TrafficAreaAnalyticsModule.applyConfig` replaces the configuration instead of merging into it: what it leaves out, including each metric its `metricConfig` leaves out and each layer its `beforeLayerConfig` leaves out, goes back to the default. Merge with `updateConfig`, and change one metric with `setColor`, `setHeight` or `filter` given that metric (`setColor('heat', ['speed'])`)

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

- **Breaking:** map: `IncidentFocusStyle.widthScale` is `widthFactor`, clamped to the new `INCIDENT_FOCUS_WIDTH_FACTOR_RANGE` (`1`–`1.8`, default `1.6`); migrate `focus: { widthScale }` to `focus: { widthFactor }`

- **Breaking:** map: `TrafficIncidentsModule` has one set of filters for the incident lines and their icons. `TrafficIncidentsModuleConfig.icons` is the new `IncidentIconsConfig`, `{ visible? }` only, and `filter()` takes a single argument; `IncidentsCommonConfig` is removed. Migrate by moving what `icons.filters` or `filter()`'s second argument held into the root `filters`
- map: the style parts the SDK adds — traffic flow, traffic incidents and the hillshade — are hidden until you show them, stated in the traffic flow, traffic incidents and terrain guides

- **Breaking:** map: `isVisible()` on `TrafficIncidentOverlayModule` and `TrafficAreaAnalyticsModule` reports the module's `visible` setting — `true` unless hidden with `setVisible(false)` or `visible: false` — whatever is shown. A module showing nothing returns `true`. To know whether data is drawn, read `getShown()`: `overlay.getShown().incidents.features.length > 0`, or the `heatmap`/`hexgrid`/`square` collections of `TrafficAreaAnalyticsModule.getShown()`
- map: `TrafficIncidentOverlayModule.show()` keeps the incidents hidden while the module is set to `visible: false`
- map: a style change restores a hidden `TrafficAreaAnalyticsModule` without emitting `config-change`

- **Breaking:** services: `CommonServiceParams.customServiceBaseURL` is removed; every service builds its endpoint URL from the global `commonBaseURL`
- **Breaking:** services: an `apiVersion` passed at runtime, per call or through `TomTomConfig.put`, is ignored; each service calls the API version it pins
- **Breaking:** map: `StandardStyle.version` is removed; standard styles always load the Orbis style version the SDK is verified against
- **Breaking:** map: the undocumented `DEFAULT_STYLE_VERSION` export is removed

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

- **Breaking:** core: `ChargingPoint.evseId` is optional — some operators publish none, in search results and in `evChargingStationsAvailability()` alike
- services: EV charging places from `discoverPlaces()`, `discoverOnePlace()` and `getPlaceDetails()` carry `chargingPark.chargingStations` — each station's charging points (EVSEs) with `capabilities`, `restrictions`, connectors and `evseId`, as the availability service already returns them
- services: route charging stops carry `dataSources.chargingAvailability.id`, so `getPlaceWithEVAvailability()` adds their availability as it does for search results
- core: `ChargingStation` takes its charging point type as a parameter, and `StaticChargingPoint` describes a charging point without real-time status
- services: `connectorAvailabilities[].connector.chargingSpeed` is set, and a charging point without `capabilities` or `restrictions` gets empty lists
- services: `getPlaceWithEVAvailability()` counts `chargingPark.connectors` from the availability when the place has none of its own

- **Breaking:** services: the options that drop results — `poiCategories`, `poiBrands`, `indexes`, `geographyTypes`, `connectors`, `fuelTypes`, `minPowerKW`, `maxPowerKW` and `countries` — move under one `filters` object: `PlaceFilters` on the places searches, plus `GeographicFilters` (`countries`) on fuzzy search and geocoding. Geometry and along-route search take no `countries`, which they never sent
- **Breaking:** services: `offset` gives way to an opaque `cursor`: pass a fuzzy search or geocoding response's `properties.nextCursor` back unchanged; a value the SDK did not mint throws. `SearchSummary.offset` becomes `nextCursor`, absent when no further page can be served — including once the next page would start past result 1900, which ends pagination rather than failing validation
- services: geocoding responses carry the search summary as `properties`, `nextCursor` included

- **Breaking:** services: `getPlaceWithEVAvailability` and `getPlacesWithEVAvailability` reject with `SDKAbortError` when their `signal` is aborted, instead of reporting the cancellation as missing availability data. Every other request failure still resolves to `undefined`, and the sequential run now stops at the cancelled station rather than working through the rest of the list

- **Breaking:** map: `SectionSignConfig.minzoom` and `CountryCrossingConfig.minzoom` are renamed `minZoom`, as every other display config spells its zoom threshold; migrate by renaming the key

- **Breaking:** map: `MapColorName` and `mapColorNames` gain `accent`, the colour for what is drawn on top of the map, so a `Record<MapColorName, …>` needs an entry for it
- map: `setMapColors` and the `colors.accent` knob set `accent`, and `map.mapColors` publishes the map colours in effect
- map: routes, geometries, place pins, connections and entry points default to the accent and follow it when it changes; a colour the caller set still wins
- map: `RoutingModule.getConfig()` returns the configuration as given, without the layers the module built from it
- map: a `PlacesModule` default pin `style` repaints the pin when it changes, and an `icon.default.image` is never replaced by it
- services: `trafficAreaAnalytics` parses its response when an app transpiles the SDK to ES5, as Sandpack or Babel over `node_modules` does, instead of failing with "undefined is not iterable"

- **Breaking:** core: `AreaAnalyticsFeatureProperties.name` is optional: the API echoes a region name only from a request that names one, and the SDK's names none, so `trafficAreaAnalytics` leaves it out instead of setting it to `undefined`

### Patch Changes

- services: the `evChargingStationsAvailability()`, `getPlaceWithEVAvailability()` and `getPlacesWithEVAvailability()` examples compile, and `ChargingParkWithAvailability.availability` names the functions that fetch it

- map: the `hillshade.exaggeration` knob description, `TerrainModuleConfig.elevationExaggeration` and `TerrainModule.setElevationExaggeration` each name the other: the knob sets how strongly slopes are shaded, the terrain setting the vertical scale of the 3D surface

- map: `PlacesModule` takes a `cluster` config under the `pin-clustered` theme: `badge` styles the count badge of single-category and mixed-category clusters together, and `source` sets MapLibre's `clusterRadius`, `clusterMaxZoom`, `clusterMinPoints` and your own `clusterProperties` aggregators. Entry points start above a changed `clusterMaxZoom`
- map: a `PlacesModule` `layers.cluster`, `clusterBadge`, `clusterCount`, `clusterMixedBadge` or `clusterMixedCount` override merges into that layer's `paint` and `layout` key by key, like the other place layers, instead of replacing them whole

- map: `PlacesModule` and `GeometriesModule` take a `visible` config field (default `true`) and `setVisible()` / `isVisible()`. Hiding covers every layer the module draws — places, connections and entry points; fills, borders, center labels and border labels — keeps its data, and survives `show()`, `clear()` and style changes. Showing again leaves theme-unused layers and `layout.visibility: 'none'` overrides hidden
- map: `PlacesModule` connection layers and the `GeometriesModule` border keep a `layout.visibility: 'none'` override when data is shown
- map: `GeometriesModule` border labels (`lineLabel`) move with the border in `moveBeforeLayer` and follow config changes

- services: `reverseGeocode` sets no `dataSources.geometry` on an area result; the ID it set was the place ID, which `geometryData` answers with no geometry. To draw a reverse geocoded area, search it by name with its `geographyType`

- core: `getCoordinateAtRouteProgress`, `calculateProgressAtRoutePoint` and the other route progress lookups bisect the route's `progress` instead of scanning all of it, so a lookup on a 30,000-point route takes microseconds rather than a millisecond

- map: `RoutingModule` posts a tunnel sign where each tunnel starts, under the map's labels, and a "closed to vehicles" sign where each vehicle-restricted stretch starts, just under the traffic icons, on the new `routeTunnelSymbol` and `routeVehicleRestrictedSymbol` layers
- map: `sections.tunnel.icon` and `sections.vehicleRestricted.icon` replace those signs, instead of being accepted and ignored

- services: `createLatestRequest` keeps only the latest of a series of requests. Each `run` aborts the one before it and resolves `{ current: true, value }`, or `{ current: false }` once a newer run or a `cancel` retired it, so a superseded call neither rejects nor paints last. Errors of the current request, a deadline composed onto its signal included, are rethrown

- services: the `CommonRoutingParams` examples compile — the heavy-vehicle one drops `travelMode: 'truck'`, the EV one uses `speedsToConsumptionsKWH` — and `VehicleDimensions` states that weight is its only dimension

## 0.58.1

### Patch Changes

- map: the `basemap.<group>` and `buildings.*` styling toggles write through `BaseMapModule`, and `styling.get` reads their layers live, so it agrees with `baseMap.isVisible(…)` whichever of the two set the group
- map: `basemap.land` reaches the layers `BaseMapModule`'s `land` group does, which leave out the style's sourceless `background`; on `satellite` that is no layer

- services: `trafficIncidentDetails` takes a `polygon`, such as a city boundary from `geometryData`, as a third query mode beside `bbox` and `ids`; the request covers the polygon's bounding box and the response keeps the incidents that intersect the polygon
- services: `trafficIncidentDetails` validation rejects a request that sets more than one of `bbox`, `polygon` and `ids`, or none of them; the check that `bbox` and `ids` are not combined was never applied

## 0.58.0

### Minor Changes

- **Breaking:** map: `culori` v4 is a new peer dependency. npm 7+ and Yarn install it for you; pnpm needs `auto-install-peers=true` or `pnpm add culori`
- map: colour parsing, conversion, luminance and mixing run on culori's tree-shakeable `culori/fn` instead of the SDK's own parser and named-colour table, so an app that also uses culori ships it once

- **Breaking:** services: `GuidanceParams.phonetics` and the `Phonetics` type are removed; `guidance` takes `{ type: 'coded' }` only
- **Breaking:** core: `TextWithPhonetics` is renamed `InstructionText` and drops `phonetic` and `phoneticLanguageCode`; instruction name fields carry `text` only

- **Breaking:** services: `calculateReachableRange` calls reachable-range API version 3, so the request `onAPIRequest` sees is a `POST` with `data` and `headers` — the API key travels as a `TomTom-Api-Key` header — instead of a `GET` URL
- **Breaking:** services: `calculateReachableRange` rejects `costModel.avoidAreas`, `when.arriveBy`, and a charge budget it cannot convert (no `model.engine.charging.maxChargeKWH`, or no `vehicle.state` for `remainingChargePCT`) instead of dropping them
- services: `calculateRoute` sends a vehicle's `currentChargeInkWh` / `currentFuelInLiters` when it has no explicit engine model, and keeps a zero charge, charge percentage or heading on the wire

- **Breaking:** services: the reachable-range budget type `remainingChargeCPT` is `remainingChargePCT`, matching `spentChargePCT`
- **Breaking:** services: `reverseGeocode` takes `geographyTypes`, as the other places services do; it was a singular name holding an array
- **Breaking:** services: `metricKeyToApiDataType` is no longer exported
- **Breaking:** services: generic and combustion vehicles take no `preferences`, and the `VehiclePreferences` type is removed; an electric vehicle's `preferences` is `ElectricVehiclePreferences`
- **Breaking:** map: the module config types follow `<Module>Config` — `TrafficFlowModuleConfig`, `TrafficIncidentsModuleConfig`, `TrafficIncidentOverlayModuleConfig`, `TrafficAreaAnalyticsModuleConfig` replace `FlowConfig`, `IncidentsConfig`, `TrafficIncidentOverlayConfig`, `TrafficAreaAnalyticsConfig`
- **Breaking:** map: the `FilterShowMode` value `'all_except'` is `'all-except'`, in the POI, traffic flow and traffic incident filters
- map: `filterShowModes` lists the `FilterShowMode` values at runtime
- services: `discoverOnePlace` and `geocodeOne` also take a params object (everything but `limit`), so a single-result lookup can carry `geoBias` or a `signal`

- **Breaking:** map: `eventState` is typed `EventState`, which adds `recently-hovered`, so your own `['has', 'eventState']` expressions match a feature for its grace period; exclude that state or set `hoverGracePeriodMS: 0`
- map: `PlacesModule` draws the entry points of shown places with `entryPoints` on its config — for all places or only hovered or clicked ones, from a minimum zoom — and `places.events.entryPoints` hands each back as a point feature with its place attached
- map: a GeoJSON-backed feature the pointer leaves stays `recently-hovered` for `hoverGracePeriodMS` (default 400, on the map's or a module's `events`); the SDK's layers draw it as no state

- **Breaking:** core: 67 `POICategory` values take their Places Search v3 name, upper-cased — among them `GAS_STATION` → `FUEL_STATION`, `ELECTRIC_VEHICLE_STATION` → `CHARGING_LOCATION`, `HOTEL_MOTEL` → `HOTEL_OR_MOTEL`, `SHOPPING_CENTER` → `MALL`, `SUPERMARKETS_HYPERMARKETS` → `SUPERMARKET`
- **Breaking:** core: five `POICategory` values merge into the v3 type they share, keeping both V2 ids: `COLLEGE_UNIVERSITY` → `COLLEGE_OR_UNIVERSITY`, `LEISURE_SPORTS_CENTER` → `SPORTS_CENTER`, `OPEN_PARKING_AREA` → `OPEN_CAR_PARKING_AREA`, `PERFORMING_ARTS_THEATER` → `THEATER`, `ROAD_TRAFFIC_CONTROL_CENTER` → `TRAFFIC_CONTROL_DEPARTMENT`
- **Breaking:** services: `autocompleteSearch` and its `AutocompleteSearch*` types are no longer exported — `getSearchSuggestions()` returns its brand and category suggestions, alone with `filters: { kinds: ['brand', 'category'] }` or ranked with places
- **Breaking:** services: the places functions take intent-based names that line up with Places Search v3's `suggest` / `discover` / `details`: `search` → `discoverPlaces`, `searchOne` → `discoverOnePlace`, `placeById` → `getPlaceDetails`
- **Breaking:** services: the types follow — `SearchResponse` → `DiscoverPlacesResponse`, `PlaceByIdParams` / `PlaceByIdResponse` → `PlaceDetailsParams` / `PlaceDetailsResponse`; a place-details error reports its service as `PlaceDetails`
- **Breaking:** core: `POICategory` drops `PUB_FOOD`, `POLYNESIAN_RESTAURANT`, `OTHER_WINTER_SPORT` and `SNOOKER_POOL_BILLIARD`, which the category endpoint no longer returns. Filtering on one already matched nothing. The map's `poiCategoryGroups.FOOD_DRINKS_GROUP` no longer lists `PUB_FOOD`
- services: `getSearchSuggestions()` returns one ranked list from the search and autocomplete arms, blended like Places Search v3: at most one brand or category leads, then places
- core: `POICategory` gains the seven categories the endpoint returns that the vendored table was missing, so `getPOICategories()` and category filters now reach them, and `PlacesModule` draws an icon for each
- services: `discoverPlaces`, `geocode` and `getSearchSuggestions` encode the query in the request path, so a query containing `/`, `?` or `#` is answered instead of failing with a 404

- **Breaking:** services: remove the `customizeService` export, and the optional second argument every service function took to override its request building, sending or response parsing. `calculateReachableRanges` keeps its second `options` argument

- **Breaking:** map: `StylingModule.describe()` is removed, together with the `StylingCatalogue`, `StylingKnobDescriptor`, `StylingPresetDescriptor` and shared `KnobDescriptor` types. The knob catalogue is static data now: `stylingKnobCatalogue` lists every knob's kind, description, range or options and `appliesTo`, `stylingPresetCatalogue` every preset with its settings, and `styling.get(id)` reads the value in force on a live map.

- **Breaking:** core: `GlobalConfig.trackingId` is removed, together with the `Tracking-ID` request header it set
- **Breaking:** core, services: `apiVersion` is removed from `GlobalConfig` and `CommonRoutingParams`; each service picks the API version it calls

- **Breaking:** core: each `AreaAnalyticsTimedData` granularity has its own entry type, `AreaAnalyticsYearlyEntry` to `AreaAnalyticsHourlyEntry` and `AreaAnalyticsAverageEntry`, whose time identifiers are required, and `AreaAnalyticsTimedEntry` is their union, so code that builds entries by hand must set them
- **Breaking:** core: `AreaAnalyticsFeatureProperties.timezone` is optional: the API echoes it only from a request that names one, and the SDK's names none
- services: `trafficAreaAnalytics` reads each `timedData.average` entry's `day` and `hour` from the label the API sends (`FRIDAY-10`) and orders the entries Monday first, instead of numbering them by position in an array the API sorts by label string
- services: `trafficAreaAnalytics` reads the `year`, `month`, `week`, `date` and `hour` of each yearly to hourly `timedData` entry from the `time` label the API sends (`2024-08-06T07:00`), instead of numbering daily and hourly entries by position from a start date the Lite response never sends, which gave every one an Invalid Date and shifted the hours whenever an `hours` filter, a `days` list or a day without data left entries out, and leaving yearly, monthly and weekly entries with none
- services: `trafficAreaAnalytics` defaults an omitted `endDate` to three days ago, the latest date that always has data, instead of two: the API publishes a day 24 to 48 hours after it ends, so the default window failed during part of each day
- services: `trafficAreaAnalytics` documents that its `hours` filter and every `timedData` time identifier are in UTC, since the request names no region timezone

- **Breaking:** services: `trafficIncidentDetails` calls Orbis Traffic Incident Details v2, so the request `onAPIRequest` sees carries the API key, version, language and an `Attributes` projection as headers instead of query parameters
- **Breaking:** services: remove the `trafficModelId` parameter from `trafficIncidentDetails`; v2 always serves the latest traffic state
- **Breaking:** core: remove `TrafficIncidentTMC`, `TrafficIncidentTMCPoint` and `properties.tmc` from `TrafficIncidentProperties`; v2 carries no TMC data
- services: `trafficAreaAnalytics` accepts a `startDate` without an `endDate` and measures the range to two days ago, the end date it sends, instead of rejecting every such request
- services: `trafficAreaAnalytics` validates a range in the UTC calendar days it sends, and dates hourly and daily entries in UTC, so neither drifts a day with the time of day or a daylight-saving switch

### Patch Changes

- map: the API reference of `BaseMapModule`, `POIsModule`, `TerrainModule`, `TrafficFlowModule` and `TrafficIncidentsModule` states what each module owns and which `StylingModule` knobs own the look

- map: a source comment in the place-pin category mapping no longer links to an internal repository

- The `maplibre-gl` peer dependency requires `^6.11.2`, and the `zod` peer dependency `^4.6.5`

- map: `PlacesModule` pins for `ADVENTURE_SPORTS_FACILITY`, `COMMUNITY_CENTER`, `EMBASSY`, `EMERGENCY_MEDICAL_SERVICE` and `ENTERTAINMENT` draw the icon of the category they share a base-map icon with, instead of no icon at all
- map: `TOLL_GATE` maps to the base-map `toll_plaza` category, so its `circle-icon` and `base-map` icons draw and `POIsModule` category filters match toll plazas
- map: `THEATER`, `SPORTS_CENTER`, `SQUASH_COURT` and `SCHOOL_BUS_COMPANY` places draw the closest base-map icon under the `circle-icon`, `base-map` and `pin-clustered` themes, instead of the default place pin

- services: `calculateReachableRange` and `calculateReachableRanges` keep the API key, base URLs, `retry`, callbacks and `signal` out of each polygon's `properties`, now typed as the new `ReachableRangeProperties` — the request parameters without the `CommonServiceParams` fields

- services: the TSDoc of reachable ranges, Long Distance EV Routing, EV charging stations availability and traffic area analytics says which API key access each needs; reachable ranges are marked as a private preview

- map: `TomTomMap.updateEventsConfig` changes the map's user events configuration at runtime, such as the long-hover delays and `hoverGracePeriodMS`; what it leaves out keeps its value

- map: on the mono styles, `setMapColors({ land })` re-derives the other nine colours from it with the formulas the styles' themes compile them with; colours given outright still win
- map: `setMapColors` darkens or lightens the education, healthcare, leisure and shopping land-use and building tints with `artificial`, keeping their hue and scaling their saturation with its luminance as the styles' themes do, instead of leaving them at the style's pastel lightness under a dark built-up colour
- map: a pure grey map colour or colour knob derives grey shades, instead of shades tinted towards red
- map: `setMapColors` recolours railway outlines with `artificial` along with their dashes, instead of leaving them at the style's grey
- map: `setMapColors` paints water, roads, built-up areas and labels in the colour given, on the mono styles too, instead of offsetting them from a glacier, restricted-access or city-label literal
- map: `setMapColors` keeps the opacity of translucent label halos, instead of painting them opaque
- map: `setMapColors` recolours motorway, trunk and primary link roads with `roadMajor`, instead of with `road`
- map: `styling.get('colors.<name>')` reports a colour without the opacity of the layer it was read from, so setting it back changes nothing
- map: `artificial` is read from the city-scale built-up colour, the one the style's theme sets, and `setMapColors` measures its shades from it, instead of from the more saturated small-scale stop

- map: replacing the image of a `ferry` or `tollRoad` section icon through `sections.<type>.icon` keeps the zoom-ramped size its layer draws with, instead of flattening it to 1; `icon.size` still sets one when given

- map: `toHsl`, `formatStyleHsl` and `HslColor` are exported, the colour rules the map-theme plugin shares with the recolour

- services: `trafficAreaAnalytics` reads `properties.startDate` and `endDate` as the earliest and latest of the `days` the API lists, at midnight UTC, instead of fields the Lite response never sends, which left both an Invalid Date
- services: `trafficAreaAnalytics` reads `anomalies` keyed by the abbreviated metric fields the API sends (`v`, `c`), instead of data type names, which dropped every anomaly; each anomaly's times are read as UTC, and its `labels` are the names of the public holidays it overlaps
- services: `trafficAreaAnalytics` documents that `anomalies` is empty: the service detects anomalies only over 35 days or more, beyond a request's 31-day limit

## 0.57.0

### Minor Changes

- **Breaking:** services: the places services send the API key and API version as `TomTom-Api-Key` / `TomTom-Api-Version` headers instead of `key=` in the URL, so a request builder now returns `{ url, headers }` and a proxy has to forward those headers
- **Breaking:** services: `SearchSummary.totalResults` and `SearchSummary.fuzzyLevel` are optional — guard them rather than assuming a number
- services: `customizeService` builders document how to send the credential yourself, including `credentials: 'include'` under a credentials proxy via `isProxyCredentialsMode(config)`

- **Breaking:** map: `TerrainModule` replaces `HillshadeModule` — `TerrainModule.get(map, { hillshade: true })` for what `HillshadeModule.get(map, { visible: true })` did, `setHillshadeVisible` for `setVisible`
- **Breaking:** map: the `view.terrain` and `view.terrainExaggeration` styling knobs and the `terrain` preset are removed — `TerrainModule.get(map, { elevation: true, elevationExaggeration })` raises the terrain instead, and loads the elevation style part the knob could not
- map: 3D terrain with `TerrainModule` — `elevation` and `elevationExaggeration` raise the map surface from the same elevation data the hillshade shades, restored after every style change

### Patch Changes

- map: `basemap.<group>` styling knobs toggle every base-map layer group `BaseMapModule` knows, bar the two building groups the `buildings.*` knobs already cover
- map: `hillshade.*` styling knobs set the shading's method, light direction, strength, maximum zoom and colours
- map: `styling.layers.query(…)` edits the paint, layout, filter or visibility of the style layers a query selects, re-applied after every style change and undone by `reset()`

- map: every module has `updateConfig(partial)`, which changes the given properties and keeps the rest of the configuration, whatever that module's `applyConfig` does with a whole one
- map: `BaseMapModule.resetConfig()` empties the configuration instead of keeping the previous one
- map: `TrafficAreaAnalyticsModule.resetConfig()` returns the display mode, metric, colours, filters, region and layer positions to their defaults, instead of only clearing `getConfig()`
- map: `TrafficAreaAnalyticsModule.applyConfig` with a new `activeMetric` filters and scales the layers by that metric rather than the previous one
- map: a clean style switch (`setStyle(style, { resetState: true })`) leaves every module on the configuration `resetConfig()` returns to, and `CustomGeoJSONModule` survives it instead of throwing

## 0.56.0

### Minor Changes

- **Breaking:** map: precise types for custom styles, places props and traffic data
- **Breaking:** services: deduplicate vehicle energy encoding, tighten EV types
- map: label a route's border crossings with the countries they join
- map: post speed limit signs where the limit changes
- map: styling GA phase 2 - view knobs, presets, map-effects plugin
- map: styling GA phase 3 - setMapColors map colours and exportStyle
- routing: phase 6 - show what the SDK adds over calling the API directly
- services: places GA phase 1 - remove the experimentalSearch export
- map: draw border crossings under the waypoint pins

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

* **core:** fold reverse geocoding's access points into entryPoints
* **examples:** gdpr demo compliance
* **examples:** put every reverseGeocode option on the rev-geo playground
* **examples:** redesign the claim-validation demo UX per Figma
* **examples:** serve the brand faces the typography tokens name
* **map:** one config tier for every drawn route section type
* **map:** post speed limits as road signs rather than a band
* **map:** styling GA phase 1 — StylingModule and the describe() catalogue
* **services:** replace flat geo-bias fields with a single geoBias option


### Miscellaneous Chores

* **release:** align package versions with the last shipped release

## [0.54.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.53.0...v0.54.0) (2026-09-17)


### ⚠ BREAKING CHANGES

* **routing:** phase 3 — land the response data v3 already returns

### Features

* **examples:** withdraw claim-validation-service from search
* **map:** let custom place icons offset from their coordinate
* **routing:** phase 3 — land the response data v3 already returns
* **service:** support request cancellation via AbortSignal
* **skills:** add an opt-in skill that reports SDK friction to GitHub


### Bug Fixes

* place-customization crash when using custom icons

## [0.53.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.52.0...v0.53.0) (2026-09-14)


### ⚠ BREAKING CHANGES

* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes
* **map:** add more dark theme styling

### Features

* **map:** add more dark theme styling
* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes
* **services:** add routing request parameters the API accepts


### Bug Fixes

* **examples:** pin the demos-proxy LLM base URL to the /v1 surface
* **map:** keep the map language across a clean style switch
* **skills:** correct four wrong APIs in the consumer skill docs

## [0.52.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.5...v0.52.0) (2026-09-09)


### ⚠ BREAKING CHANGES

* **routing:** drop the circle waypoint the API never had
* migrate rev-geocoding to Orbis v2
* **map:** scoped module events and per-map shared style modules (lsi-159)
* **services:** remove routing parameters the API does not support
* **map:** replace get() with create() on data-owned map modules

### Features

* **examples:** claim validation intake example
* **map:** replace get() with create() on data-owned map modules
* **map:** scoped module events and per-map shared style modules (lsi-159)
* migrate rev-geocoding to Orbis v2
* **routing:** drop the circle waypoint the API never had
* **services:** remove routing parameters the API does not support


### Bug Fixes

* **examples:** stack the searched EV pins above the viewport stations
* stop partial route updates clobbering config, give BYOD reset a contract

## [0.51.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.4...v0.51.5) (2026-08-25)


### Bug Fixes

* **docs:** correct stale APIs, dead links and drifted contributor docs

## [0.51.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.3...v0.51.4) (2026-08-24)


### Bug Fixes

* **agent-toolkit:** range-check model coordinates and report plugin coverage
* **agent-toolkit:** range-check the sandbox fitOnMap bbox

## [0.51.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.2...v0.51.3) (2026-08-18)


### Features

* add BaseMapModule appearance API and upgrade maplibre-gl to v6
* attribute map traffic to the product embedding the SDK

## [0.51.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.1...v0.51.2) (2026-08-05)


### Bug Fixes

* include dist files from examples

## [0.51.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.51.0...v0.51.1) (2026-08-04)


### Features

* **examples:** move the traffic and site-selection agents to Las Vegas
* **examples:** record query and response text on AgentSuccess telemetry


### Bug Fixes

* **deps:** pin a pnpm release that can still be installed
* **deps:** upgrade react and react-dom to 19.2.8
* geometry search playground empty query and unneeded promise.all
* location resolver selecting subdivision over parent city

## [0.51.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.4...v0.51.0) (2026-07-24)


### ⚠ BREAKING CHANGES

* **map:** improve base map layer groups

### Features

* **map:** improve base map layer groups


### Bug Fixes

* **agent-toolkit:** surface reverse-geocode no-match as an error
* chat UX polish, whitespace hex rendering, entry-id collision in toolkit
* **landmarks-3d:** render POIs on top of 3D landmark meshes

## [0.50.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.3...v0.50.4) (2026-07-09)


### Bug Fixes

* **map:** guard SourceWithLayers against a removed map

## [0.50.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.2...v0.50.3) (2026-07-08)


### Bug Fixes

* **examples:** lazy-load App Insights in traffic agent to fix sandpack

## [0.50.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.1...v0.50.2) (2026-07-07)


### Features

* **examples:** add byod district prompts and per-district traffic monitoring
* **examples:** gate site-selection household behind the experimental flag
* **examples:** prioritize agent-setup files in map agent Sandpack tabs


### Bug Fixes

* **agent-toolkit:** resolve routing waypoints by place id or entry id
* **agent-toolkit:** ungate scope and cross kind schemas
* allow for an array of inputs with tools that use the progress bar
* **examples:** example titles + jam detail panel design fixes
* **examples:** polish clarify wizard survey UX and hover states
* **examples:** scroll chat when hovering the resize handle
* **site-selection:** panel polish + BYOD titles, colour & containment


### Performance Improvements

* move scenario-tests to main pushes

## [0.50.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.50.0...v0.50.1) (2026-07-03)


### Bug Fixes

* **agent-toolkit:** unblock npm publishing of the plugin

## [0.50.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.49.1...v0.50.0) (2026-07-03)


### ⚠ BREAKING CHANGES

* **map:** granular fill/line beforeLayerConfig + geometry-config-playground

### Features

* agent eval integration
* **agent-eval:** llm judge with grounding veto and per-agent token monitoring
* **examples:** agent telemetry and Azure Monitor observability dashboard
* **examples:** berlin-based starter prompts
* **examples:** make site-selection agent state-driven + BYOD-capable
* **map:** expand geometry line config
* **map:** granular fill/line beforeLayerConfig + geometry-config-playground
* **site-selection:** align with latest ux designs
* **site-selection:** let the LLM name the BYOD label field from the schema
* **site-selection:** polish widget + map visuals to latest ux designs


### Bug Fixes

* **agent-toolkit:** accept places entry ids in where.placeIds
* **agent-toolkit:** guard setMapStandardStyle against accidental style changes
* **agent-toolkit:** prefer dedicated tools over the MapLibre escape hatch
* **agent-toolkit:** validate processData places and trace derived ids
* **examples:** align agent chat UI across example apps
* **examples:** make agent telemetry optional in local dev
* **examples:** toolCall Figma polish + route corridor colors
* **landmarks-3d:** send session credentials so tiles load behind a proxy
* **site-selection:** render all parking points, add discoverPlaces

## [0.49.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.49.0...v0.49.1) (2026-06-30)


### Features

* **agent-toolkit:** expose sandbox data-tool inputs as per-entry records only
* **examples:** align chat agent UI with the traffic agent Figma design
* **examples:** align traffic agent UI with Figma + playbook tokens
* **examples:** group tool calls under a 'Used N tools' pill
* **examples:** polish traffic-agent prose and fix null-driven map errors
* **examples:** render clarifyIntent as an interactive survey form
* **examples:** site selection implementation
* **examples:** unify the agent example UI + clarifyIntent survey wizard
* **plugins:** add landmarks-3d plugin for Orbis 3D Landmarks
* **toolkit:** add clarifyIntent tool and add alwaysActive flag to tools
* **traffic-agent:** watched-area highlight, grouped Event tracker, summary follows focus


### Bug Fixes

* **agent-toolkit:** register an empty entry for zero-incident results

## [0.49.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.3...v0.49.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **agent-toolkit:** consolidate per-kind recall tools into recallState
* **agent-toolkit:** analysis and incidents clustering improvements
* **traffic, map-display:** migrate to Orbis v2 GA

### Features

* agent-eval framework Initial MVP baseline
* **agent-toolkit:** `resolvedAreas` — surface where every query resolved
* **agent-toolkit:** analysis and incidents clustering improvements
* **agent-toolkit:** app-supplied URL-validator hook for addByodSource
* **agent-toolkit:** fold incident monitoring into getTrafficIncidents
* **agent-toolkit:** generic trackers on the analyses registry
* **agent-toolkit:** keep untrusted BYOD free-text out of model context
* **agent-toolkit:** monitor routes — periodic live-traffic recalculation
* **agent-toolkit:** sandbox data-tool execution in a browser iframe-worker
* **agent-toolkit:** split and compact the base system prompt
* **agent-toolkit:** unify where-resolution
* **proxy:** bundle proxy config into static-html examples
* **services:** forward common service params ev availability util service
* **traffic, map-display:** migrate to Orbis v2 GA


### Bug Fixes

* **examples:** inject multi-chunk plugin builds correctly for Sandpack
* **examples:** keep illegal-request rejection rule in traffic agent prompt
* **examples:** re-enable demo-BFF proxy bootstrap
* **examples:** unblock CI lint — suppress noUnusedVariables
* **map:** style-change handlers return an unsubscribe disposer
* **skill:** trim tomtom-maps-sdk-js description under 1024-char limit


### Reverts

* feat(traffic, map-display)!: migrate to Orbis v2 GA


### Code Refactoring

* **agent-toolkit:** consolidate per-kind recall tools into recallState

## [0.48.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.2...v0.48.3) (2026-06-10)


### Features

* **routing:** migrate routing service to OrbisV3 API

## [0.48.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.1...v0.48.2) (2026-06-09)


### Bug Fixes

* remove sdk dep in examples

## [0.48.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.48.0...v0.48.1) (2026-06-09)


### Features

* **agent-toolkit:** deterministic DBSCAN clustering tool


### Bug Fixes

* pin assistant-ui

## [0.48.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.9...v0.48.0) (2026-06-05)


### ⚠ BREAKING CHANGES

* **events:** scope + dedupe allEventFeatures, typed substitution
* **agent-toolkit:** byod improvements

### Features

* **agent-toolkit:** byod improvements
* **ci:** wire up Docs Portal PR preview environments
* **events:** scope + dedupe allEventFeatures, typed substitution
* sdk proxy mode for demo-BFF


### Bug Fixes

* **agent-toolkit:** add missing [@group](https://github.com/group) tags on exported types
* **agent-toolkit:** public docs cleanup — links, system-prompt guidance, internal refs
* proxy mode sdk

## [0.47.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.8...v0.47.9) (2026-05-22)


### Bug Fixes

* d2 diagram in documentation
* d2 diagram in documentation

## [0.47.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.7...v0.47.8) (2026-05-22)


### Features

* **agent-toolkit:** expand plugin documentation


### Bug Fixes

* **agent-toolkit:** split scenario tests into sanity / full suites
* **agent-toolkit:** stabilize locate-place scenario prompt

## [0.47.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.6...v0.47.7) (2026-05-21)


### Features

* code generation tools with updated docs
* upgrade SDK agent toolkit and fix release process


### Bug Fixes

* **agent-toolkit:** point README docs link at overview page
* engineering guideline updates for agent toolkit
* tool doc updates for agent toolkit

## [0.47.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.5...v0.47.6) (2026-05-15)


### Features

* exploration search with area tags
* new custom geojson module in SDK


### Bug Fixes

* agent toolkit place prompt fixes and clearing unnecessary modules

## [0.47.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.4...v0.47.5) (2026-05-13)


### Features

* migrate all map chat agent demos to tailwind


### Bug Fixes

* restore incident module on style change
* updated a couple of schemas and bumped zod dependencies to ^4.4.3

## [0.47.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.3...v0.47.4) (2026-05-12)


### Features

* agent evaluation testing [LSI-285]


### Bug Fixes

* add missing traffic incidents geojson module into agent coding skills
* upgrade and fix deps

## [0.47.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.2...v0.47.3) (2026-05-11)


### Bug Fixes

* example thumbnail reference

## [0.47.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.1...v0.47.2) (2026-05-11)


### Bug Fixes

* example thumbnail reference

## [0.47.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.47.0...v0.47.1) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent
* **map:** TrafficIncidentOverlayModule


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes

## [0.47.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.13...v0.47.0) (2026-05-01)


### ⚠ BREAKING CHANGES

* improvements in places module themes

### Features

* add managePlaces tool and centralize places display state
* add model name to header
* expand deployment workflow to support multiple SDK demos
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md
* improvements in places module themes


### Bug Fixes

* dynamic import ApplicationInsights to avoid adblocker crash
* escape $web variable reference in upload step echo
* LSI-259 Fix tests that were failing because API changed response from 403 to 401
* LSI-265 Fix branch name sanitation in 'Publish Examples' step

## [0.46.13](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.12...v0.46.13) (2026-04-14)


### Features

* upgrade maplibre dependency


### Bug Fixes

* exporting map agent from plugins so it's included in API reference
* rename map-agent plugin to agent-toolkit
* update agent toolkit link in readme
* update mobile breakpoint for chat agent demos

## [0.46.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.11...v0.46.12) (2026-04-10)


### Bug Fixes

* missing example images

## [0.46.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.10...v0.46.11) (2026-04-10)


### Bug Fixes

* examples type exports

## [0.46.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.9...v0.46.10) (2026-04-10)


### Features

* add traffic area analytics tools to map agent
* enable ai-agent plugin for release
* enhance traffic area analytics with improved filter handling and validation
* expand TrafficAreaAnalyticsModule API with tiles mode, filtering, custom styling, and tooltip
* improve mobile view for chat
* new module events to react to config changes and shown features
* parameterize tool registry with unified ToolMetadata and MapAgentTool types
* remove canvas area analytics chart from main sdk, ported to example using html elements instead of canvas
* traffic area analytics configuration improvements
* traffic area analytics configuration improvements


### Bug Fixes

* ai plugin docs diagrams
* disambiguate traffic tools, add analytics to clearMap, fix restoration race
* mobile speech input continuous
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup

## [0.46.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.8...v0.46.9) (2026-03-30)


### Features

* add internal optional metadata header

## [0.46.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.7...v0.46.8) (2026-03-27)


### Features

* add traffic area analytics example with configuration and visualization options
* **ai-eval, map-chat-agent:** extend eval harness and update eval cases
* ensure area analytics dates start at least 2 days before the current day
* improve circle theme visuals with dynamic POI sizing and unified centered-icon offset logic
* **map-agent:** add extension tools and map-data-agent example
* **map-agent:** redesign core tool layer
* **map-agent:** switch focusOnPlace from geocode to search, add biasPosition
* show area analytics hexagons below place labels


### Bug Fixes

* **map-agent:** fix P0/P1/P2 tool bugs and design weaknesses
* maplibre version reliability in SDK built examples
* poi category codes and mappings, and formatting
* traffic area analytics layer id inits

## [0.46.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.6...v0.46.7) (2026-03-20)


### Features

* add area analytics module with visualization layers and utilities
* add color scheme selector and update legend functionality in TrafficAreaAnalyticsModule
* add color scheme support for TrafficAreaAnalyticsModule and related components
* add integration tests and data for TrafficAreaAnalyticsModule following pr comments
* add layer ID properties for explicit access in TrafficAreaAnalyticsModule
* add theme propertie to RoutingModule and set-route-theme tool
* add traffic area analytics example with city search and hex grid
* add TrafficAreaAnalyticsModule with hexgrid and heatmap layers
* add TrafficAreaAnalyticsModule with visualization layers
* derive outline color from mainColor, update waypoint icons at runtime
* remove hexTransform module and simplify analytics display logic


### Bug Fixes

* add type annotation for madridCenter in TrafficAreaAnalyticsModule tests
* migrate reachable range service from V3 to V2 API and update docs link
* omit tomtom-user-agent header for area analytics requests (CORS)
* resolve lint errors and remove non-null assertions
* restore .npmrc before creating pull request
* wait ForMapIdle race condition

## [0.46.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.5...v0.46.6) (2026-03-17)


### Bug Fixes

* dep and sandpack upgrades

## [0.46.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.4...v0.46.5) (2026-03-17)


### Bug Fixes

* add thumbnails for nodejs examples

## [0.46.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.3...v0.46.4) (2026-03-17)


### Bug Fixes

* sandpack examples relying on Set logic

## [0.46.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.2...v0.46.3) (2026-03-17)


### Features

* along route search service with examples, docs and minor refactorings
* along route search service with examples, docs and minor refactorings


### Bug Fixes

* ensure geometry search and along route search cannot accept position params

## [0.46.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.1...v0.46.2) (2026-03-16)


### Features

* add context7 json to help manage ai assisted coding

## [0.46.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.46.0...v0.46.1) (2026-03-13)


### Features

* add skills for agents to develop with the SDK
* enhance documentation for map agent and setup with new examples and boilerplate
* make tool-activation opt-out


### Bug Fixes

* ensure traffic area analytics report name
* poi category codes agent tool reliability with languages

## [0.46.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.12...v0.46.0) (2026-03-12)


### ⚠ BREAKING CHANGES

* improve poi categories relationship with search

### Features

* improve poi categories relationship with search
* traffic area analytics lite service

## [0.45.12](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.11...v0.45.12) (2026-03-04)


### Bug Fixes

* missing example thumbnail

## [0.45.11](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.10...v0.45.11) (2026-03-03)


### Features

* add avoid areas parameter for route calculations
* add avoid areas parameter for route calculations
* add intent-based classification and selective tooling with tool groups and step scope
* improve pois and traffic map feature mappings
* improve pois and traffic map feature mappings
* multiple agent tool improvements


### Bug Fixes

* clear geometry labels property
* geometries label size
* remove unused section props
* routing module incident events type
* switch from geojsonobject to geojson types for correctness

## [0.45.10](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.9...v0.45.10) (2026-02-26)


### Features

* improve traffic details service parameters and documentation

## [0.45.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.8...v0.45.9) (2026-02-26)


### Features

* improve inverted theme support for reachable ranges, migrate examples to use theme: 'inverted'
* incident details service improvements and added agent tools
* traffic incident details service

## [0.45.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.7...v0.45.8) (2026-02-24)


### Bug Fixes

* ensure reachable ranges is visible on docs portal

## [0.45.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.6...v0.45.7) (2026-02-24)


### Features

* add themed geometry config and make reachable-ranges zero-plumbing geometry display
* reinstate displayReachableRanges and reachable-ranges example, allowing custom multi-budget-type, palette, and theme support
* typed features for map traffic incidents and flow, with extra properties


### Bug Fixes

* remove roadShieldReferences guidance param — road shields are requested via sectionTypes, and are included by default

## [0.45.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.5...v0.45.6) (2026-02-23)


### Features

* opt-out visibility for route summary bubbles


### Bug Fixes

* pois module feature mappings and type fixes

## [0.45.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.4...v0.45.5) (2026-02-20)


### Features

* add new get section progress tool, and improve existing tools
* core utilities related to routes and tool description improvements
* new hover-move event type which keeps firing as you move the pointer over the relevant features
* new utility to find route progress matching a nearby arbitrary location
* refactor core utility guides and add new example for add stops to route


## [0.45.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.3...v0.45.4) (2026-02-17)

## [0.45.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.2...v0.45.3) (2026-02-17)

## [0.45.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.45.1...v0.45.2) (2026-02-17)

### Features

* add shared CSS design system and reusable HTML templates for examples
* add template CSS inlining and local SDK dependency resolution to Sandpack
* migrate all examples to use the shared CSS design system
* zod and lodash are now peer dependencies, not bundled in sdk anymore


### Bug Fixes

* update Playwright config for Chrome for Testing WebGL support and refresh snapshots

## [0.42.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.1...v0.42.2) (2026-02-06)


### Bug Fixes

* ensure map theme switching is smooth

## [0.42.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.42.0...v0.42.1) (2026-02-03)


### Features

* add traffic incident playground example


### Bug Fixes

* enable documentation indexing
* filter by incidents by magnitude_of_delay
* omit bounding box and position from search options in viewport places plugin since they should be automatically set

## [0.42.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.8...v0.42.0) (2026-01-30)


### Features

* **viewport-places:** improve types


### Bug Fixes

* viewport places plugin example


## [0.41.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.7...v0.41.8) (2026-01-30)


### Bug Fixes

* viewport places plugin example

## [0.41.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.6...v0.41.7) (2026-01-30)


### Bug Fixes

* improve release workflow and update documentation

## [0.41.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.5...v0.41.6) (2026-01-30)


### Features

* **viewport-places:** improve types

## [0.41.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.4...v0.41.5) (2026-01-30)


### Features

* **viewport-places:** improve TSDocs

## [0.41.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.3...v0.41.4) (2026-01-30)


### Bug Fixes

* missing [@ignore](https://github.com/ignore) for internal routing variable
* missing tsdoc group for type

## [0.41.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.2...v0.41.3) (2026-01-29)


### Features

* simplify viewport places method name, and improve api reference docs
* upgrade deps

## [0.41.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.1...v0.41.2) (2026-01-29)


### Features

* add availability-aware custom EV icons to example
* add EV availability icon selection with custom icon support
* add EVAvailabilityConfig type with opt-in configuration
* add plugins workspace with first plugin to easily display search-powered layers of places on the map
* add theme awareness and availability-level icon image handling to PlacesModule
* enhance EV custom display example with theme switching and improved controls
* implement EV availability display in layer specs
* rename ev playground to search


### Bug Fixes

* make StyleChangeHandler callbacks optional
* try to fail gracefully when some layers cannot be added in map modules, likely due to misconfiguration

## [0.41.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.41.0...v0.41.1) (2026-01-16)


### Bug Fixes

* **examples:** import in ev-charging-stations-playground

## [0.41.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.1...v0.41.0) (2026-01-16)


### ⚠ BREAKING CHANGES

* merge mapParams and mapLibreOptions
* **ev-search:** merge connectors and connectorCounts
* **ev-search:** getPlacesWithEvAvailability return type

### Bug Fixes

* css responsiveness
* **ev-search:** getPlacesWithEvAvailability return type


### Code Refactoring

* **ev-search:** merge connectors and connectorCounts
* merge mapParams and mapLibreOptions

## [0.40.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.40.0...v0.40.1) (2026-01-08)


### Bug Fixes

* calculate padded bboxes correctly if any of the surrounding elements goes beyond the visible screen
* ensure map style parts which were excluded are loaded more robustly

## [0.40.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.39.0...v0.40.0) (2026-01-07)


### Features

* new padded bbox calculation utilities for map bundle
* new polygonFromBBox core utility
* sdk upgrade

## [0.39.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.1...v0.39.0) (2026-01-06)


### Features

* add live coding for few guides
* new map style switcher example


### Bug Fixes

* simplify how sandpack examples are exposed

## [0.38.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.38.0...v0.38.1) (2025-12-17)


### Bug Fixes

* quickstart guide link text

## [0.38.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.37.0...v0.38.0) (2025-12-17)


### Features

* improve bbox types for places, routes and geometries

## [0.37.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.9...v0.37.0) (2025-12-16)


### Features

* improve bbox types for places and routes so they reflect 4-dimensional types
* optional events configuration for each map module


### Bug Fixes

* add sandpack wrapper for each example
* move sandpack local preview inside sandpack folder
* use release please version in tests
* use vite to resolve dependencies and examples map

## [0.36.9](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.8...v0.36.9) (2025-12-11)


### Bug Fixes

* upgrade deps

## [0.36.8](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.7...v0.36.8) (2025-12-11)


### Bug Fixes

* upgrade deps

## [0.36.7](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.6...v0.36.7) (2025-12-11)


### Bug Fixes

* consistency with naming map module instance variables

## [0.36.6](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.5...v0.36.6) (2025-12-10)


### Bug Fixes

* remove leftover console logs

## [0.36.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.4...v0.36.5) (2025-12-09)


### Bug Fixes

* type exports

## [0.36.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.3...v0.36.4) (2025-12-08)


### Bug Fixes

* regression fix for additional layers vs multiple routing modules support
* regression fix regarding unnecessarily suffixing custom images in routing module instances

## [0.36.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.2...v0.36.3) (2025-12-08)


### Bug Fixes

* prevent querying features without passing any layers

## [0.36.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.1...v0.36.2) (2025-12-08)


### Bug Fixes

* example content hotfix
* simplify and improve category mappings for places

## [0.36.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.36.0...v0.36.1) (2025-12-08)


### Bug Fixes

* simplify and improve category mappings for places

## [0.36.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.5...v0.36.0) (2025-12-05)


### Features

* multiple routing module instances possible, including two new examples


### Bug Fixes

* ensure feature ids and feature properties ids are always set

## [0.35.5](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.4...v0.35.5) (2025-12-04)


### Bug Fixes

* skip validating styles when changing them for performance
* upgrade maplibre dependency and ensure place properties always have id

## [0.35.4](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.3...v0.35.4) (2025-12-03)


### Bug Fixes

* use right icon for toll roads along routes

## [0.35.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.2...v0.35.3) (2025-12-03)


### Bug Fixes

* custom image loading reliability across different browsers

## [0.35.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.1...v0.35.2) (2025-12-03)


### Bug Fixes

* rev geo playground init

## [0.35.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.35.0...v0.35.1) (2025-12-03)


### Bug Fixes

* mitigation to try to be more reliable on detecting that maplibre css was already loaded
* remove noisy console warnings when deserializing potential JSON from features

## [0.35.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.1...v0.35.0) (2025-12-02)


### Features

* new searchOne convenience function for fast single result searches
* showRoutes in RoutingModule also accepts a single Route now
* switching to a simplified BBox type in SDK with only 4 coordinates since we don't use the other 2 and this way we are more compatible with Maplibre


### Bug Fixes

* base map module undefined config consistency

## [0.34.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.34.0...v0.34.1) (2025-12-01)


### Bug Fixes

* add config file to maintain example api key
* move all files for examples under its src folder
* nodejs examples based on es modules
* use sandpack to preview map in guides

## [0.34.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.33.0...v0.34.0) (2025-11-26)


### Features

* hide fuzzySearch call to avoid overlap with search
* improve visibility state management in traffic and hillshade modules, fix e2e tests, misc improvements
* improvements in PlacesModule and added examples
* upgrade sdk dependency


### Bug Fixes

* types and test data migrated to ts

## [0.33.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.3...v0.33.0) (2025-11-20)


### Bug Fixes

* update diagram how-the-sdk-works

## [0.32.3](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.2...v0.32.3) (2025-11-20)


### Bug Fixes

* route instruction arrows to be above incidents
* update license

## [0.32.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.32.1...v0.32.2) (2025-11-18)


### Bug Fixes

* es exports to prevent having to mention dist in imports

## [0.32.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.31.1...v0.32.0) (2025-11-13)


### Features

* export sdk as es modules only
* simplify map style initialization

## [0.31.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.2...v0.31.0) (2025-11-11)


### Features

* improve places module configuration and examples
* sdk automatically loads MapLibre CSS if not done by the caller
* upgrade to new map style with new traffic incident icons


### Bug Fixes

* search exports and using typeahead true for fuzzy search examples

## [0.30.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.1...v0.30.2) (2025-11-06)


### Bug Fixes

* example having incorrect references

## [0.30.1](https://github.com/tomtom-international/maps-sdk-js/compare/v0.30.0...v0.30.1) (2025-11-05)


### Bug Fixes

* pin category mapping

## [0.30.0](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.2...v0.30.0) (2025-11-05)


### Features

* enable tomtom user agent headers by default


### Bug Fixes

* route example content

## [0.29.2](https://github.com/tomtom-international/maps-sdk-js/compare/v0.29.1...v0.29.2) (2025-11-04)


### Features

* First Public Preview Release :rocket:
