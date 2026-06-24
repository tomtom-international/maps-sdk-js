/**
 * @module agent-toolkit-tools
 */

import { trafficIncidentRequestCategories } from '@tomtom-org/maps-sdk/core';
import type { DataEntryKind } from '../state';
import type { ToolDefinition, ToolState } from '../types';

// --- MapLibre tools ---
import {
    executeExecuteMaplibreCode,
    executeFlyTo,
    executeGetMapStyleLayers,
    executeGetViewport,
    executeMaplibreCodeDescription,
    executeMaplibreCodeOutputSchema,
    executeMaplibreCodeSchema,
    executeSetLayoutProperties,
    executeSetPaintProperties,
    executeSetPitchBearing,
    executeZoomInOrOut,
    flyToDescription,
    flyToOutputSchema,
    flyToSchema,
    getMapStyleLayersDescription,
    getMapStyleLayersOutputSchema,
    getMapStyleLayersSchema,
    getViewportDescription,
    getViewportOutputSchema,
    getViewportSchema,
    setLayoutPropertiesDescription,
    setLayoutPropertiesOutputSchema,
    setLayoutPropertiesSchema,
    setPaintPropertiesDescription,
    setPaintPropertiesOutputSchema,
    setPaintPropertiesSchema,
    setPitchBearingDescription,
    setPitchBearingOutputSchema,
    setPitchBearingSchema,
    zoomInOrOutDescription,
    zoomInOrOutOutputSchema,
    zoomInOrOutSchema,
} from './maplibre';

// --- Service tools ---
import {
    addWaypointsToRouteDescription,
    addWaypointsToRouteOutputSchema,
    addWaypointsToRouteSchema,
    discoverPlacesBuilder,
    executeAddWaypointsToRoute,
    executeFindReachableAreas,
    executeGetPoiCategoryCodes,
    executeGetTrafficAreaAnalytics,
    executeGetTrafficIncidents,
    executeLocatePlace,
    executeRemoveWaypointsFromRoute,
    executeReplaceWaypointInRoute,
    executeReverseGeocode,
    executeSetRoute,
    findReachableAreasDescription,
    findReachableAreasOutputSchema,
    findReachableAreasSchema,
    getPoiCategoryCodesDescription,
    getPoiCategoryCodesOutputSchema,
    getPoiCategoryCodesSchema,
    getTrafficAreaAnalyticsDescription,
    getTrafficAreaAnalyticsOutputSchema,
    getTrafficAreaAnalyticsSchema,
    getTrafficIncidentsDescription,
    getTrafficIncidentsOutputSchema,
    getTrafficIncidentsSchema,
    locatePlaceDescription,
    locatePlaceOutputSchema,
    locatePlaceSchema,
    removeWaypointsFromRouteDescription,
    removeWaypointsFromRouteOutputSchema,
    removeWaypointsFromRouteSchema,
    replaceWaypointInRouteDescription,
    replaceWaypointInRouteOutputSchema,
    replaceWaypointInRouteSchema,
    reverseGeocodeDescription,
    reverseGeocodeOutputSchema,
    reverseGeocodeSchema,
    setRouteDescription,
    setRouteOutputSchema,
    setRouteSchema,
} from './services';

// --- State tools ---
import {
    addByodSourceDescription,
    addByodSourceOutputSchema,
    addByodSourceSchema,
    analyseDataBuilder,
    clearTrackerDescription,
    clearTrackerOutputSchema,
    clearTrackerSchema,
    clusterIncidentsBuilder,
    createTrackerDescription,
    createTrackerOutputSchema,
    createTrackerSchema,
    executeAddByodSource,
    executeClearTracker,
    executeCreateTracker,
    executeFocusIncidents,
    executeGetCurrentWaypoints,
    executeGetTrackerHistory,
    executeGetTrackers,
    executeMonitorAnalysis,
    executeResetState,
    executeSetByodLayers,
    executeSetEntryMode,
    executeSetTrafficIncidentsMonitor,
    executeStartRouteMonitor,
    executeStopRouteMonitor,
    focusIncidentsDescription,
    focusIncidentsOutputSchema,
    focusIncidentsSchema,
    getCurrentWaypointsDescription,
    getCurrentWaypointsOutputSchema,
    getCurrentWaypointsSchema,
    getTrackerHistoryDescription,
    getTrackerHistoryOutputSchema,
    getTrackerHistorySchema,
    getTrackersDescription,
    getTrackersOutputSchema,
    getTrackersSchema,
    monitorAnalysisDescription,
    monitorAnalysisOutputSchema,
    monitorAnalysisSchema,
    processDataBuilder,
    recallStateBuilder,
    resetStateDescription,
    resetStateOutputSchema,
    resetStateSchema,
    setByodLayersDescription,
    setByodLayersOutputSchema,
    setByodLayersSchema,
    setEntryModeDescription,
    setEntryModeOutputSchema,
    setEntryModeSchema,
    setTrafficIncidentsMonitorDescription,
    setTrafficIncidentsMonitorOutputSchema,
    setTrafficIncidentsMonitorSchema,
    startRouteMonitorDescription,
    startRouteMonitorOutputSchema,
    startRouteMonitorSchema,
    stopRouteMonitorDescription,
    stopRouteMonitorOutputSchema,
    stopRouteMonitorSchema,
} from './state';

// --- TomTom Map tools ---
import {
    clearMapDescription,
    clearMapOutputSchema,
    clearMapSchema,
    executeClearMap,
    executeGetStandardMapStyles,
    executeSetLanguage,
    executeSetMapStandardStyle,
    executeToggleTilesBaseMapLayerGroups,
    executeToggleTilesPOIs,
    executeToggleTilesTrafficFlow,
    executeToggleTilesTrafficIncidents,
    executeUpdateByodDisplay,
    executeUpdatePlacesDisplay,
    executeUpdateRoutesDisplay,
    executeUpdateTrafficAreaAnalyticsDisplay,
    executeUpdateWaypointsDisplay,
    getStandardMapStylesDescription,
    getStandardMapStylesOutputSchema,
    getStandardMapStylesSchema,
    setLanguageDescription,
    setLanguageOutputSchema,
    setLanguageSchema,
    setMapStandardStyleDescription,
    setMapStandardStyleOutputSchema,
    setMapStandardStyleSchema,
    toggleTilesBaseMapLayerGroupsDescription,
    toggleTilesBaseMapLayerGroupsOutputSchema,
    toggleTilesBaseMapLayerGroupsSchema,
    toggleTilesPOIsDescription,
    toggleTilesPOIsOutputSchema,
    toggleTilesPOIsSchema,
    toggleTilesTrafficFlowDescription,
    toggleTilesTrafficFlowOutputSchema,
    toggleTilesTrafficFlowSchema,
    toggleTilesTrafficIncidentsDescription,
    toggleTilesTrafficIncidentsOutputSchema,
    toggleTilesTrafficIncidentsSchema,
    updateByodDisplayDescription,
    updateByodDisplayOutputSchema,
    updateByodDisplaySchema,
    updatePlacesDisplayDescription,
    updatePlacesDisplayOutputSchema,
    updatePlacesDisplaySchema,
    updateRoutesDisplayDescription,
    updateRoutesDisplayOutputSchema,
    updateRoutesDisplaySchema,
    updateTrafficAreaAnalyticsDisplayDescription,
    updateTrafficAreaAnalyticsDisplayOutputSchema,
    updateTrafficAreaAnalyticsDisplaySchema,
    updateWaypointsDisplayDescription,
    updateWaypointsDisplayOutputSchema,
    updateWaypointsDisplaySchema,
} from './tomtom-map';

// --- Utility tools ---
import {
    calculateBBoxDescription,
    calculateBBoxSchema,
    executeCalculateBBox,
    executeGetCurrentLocation,
    getCurrentLocationDescription,
    getCurrentLocationOutputSchema,
    getCurrentLocationSchema,
    helpDescription,
    helpOutputSchema,
    helpSchema,
} from './utilities';

// Shared classifier-prompt framing for the two dynamic-JS data tools (`analyseData`,
// `processData`). Both run user-authored code against the same set of injected inputs
// (`places` / `routes` / `incidents` / `geometries` / `trafficAreaAnalytics`); only the *contract*
// of what the code returns differs. Lifting the common framing here keeps the two
// `classificationPrompt`s short — the per-tool prompt then only carries the verb (transforms vs
// aggregates) plus disambiguating triggers.
const DATA_TOOL_INPUTS = 'places / routes / incidents / geometries / trafficAreaAnalytics / byod';
const DATA_TOOL_SHARED_FRAMING =
    `Dynamic-JS sandbox over any combination of ${DATA_TOOL_INPUTS} entries. ` +
    'Each input arg is `undefined` when its `*EntryIDs` was omitted.';

const defaultTools = {
    locatePlace: {
        description: locatePlaceDescription,
        classificationPrompt:
            'Resolve a single location string (landmark, city, address) to a place without showing it; optionally stages a waypoint slot. ' +
            'Do NOT call as a precursor to discoverPlaces — discoverPlaces resolves named areas itself via `where.query` (or `where.municipalities` / `where.placeId`).',
        inputSchema: locatePlaceSchema,
        outputSchema: locatePlaceOutputSchema,
        execute: executeLocatePlace,
        tags: ['locate', 'place', 'location', 'waypoint'],
        examples: [
            'locatePlace("Buckingham Palace", queryAs: "poi", waypointIndex: 0)  // omit `where` to resolve the name anywhere (global)',
            'locatePlace("Tower Bridge", queryAs: "poi", where: { mode: "nearby", viewport: true }, waypointIndex: 1)',
            'locatePlace("Westminster Abbey", queryAs: "poi", where: { mode: "global" })',
            'locatePlace("10 Downing Street", queryAs: "place", where: { mode: "nearby", position: [4.9, 52.37] })',
            'locatePlace("Amsterdam", queryAs: "place", where: { mode: "global" }, entryId: "amsterdam-city", geometry: { show: true })  // outline the city',
            'locatePlace("Utrecht", queryAs: "place", where: { mode: "global" }, entryId: "utrecht-city", geometry: { show: true, mode: "add" })  // also outline a second city',
        ],
        examplePrompts: [
            'Where is the Louvre?',
            'Pin Central Station on the map',
            'Show Times Square on the map',
            'Pin Schiphol Airport on the map',
            'Outline Amsterdam on the map',
            'Show the boundary of Berlin',
            // Two WHOLE named cities outlined via repeated `geometry: { mode: "add" }` (see examples
            // above) — moved here from discoverPlaces, which the classifier routes past to locatePlace.
            'Show the boundaries of Amsterdam and Utrecht',
            // Tourist / traveller persona: single named landmark, pin or locate.
            'Pin the Eiffel Tower on the map',
            'Where is the Sydney Opera House?',
        ],
        relatedTools: ['setRoute', 'addWaypointsToRoute', 'getCurrentWaypoints', 'recallState'],
    },
    reverseGeocode: {
        description: reverseGeocodeDescription,
        classificationPrompt:
            'Convert [lng, lat] coordinates to an address; use after map clicks or any tool that returns a position.',
        inputSchema: reverseGeocodeSchema,
        outputSchema: reverseGeocodeOutputSchema,
        execute: executeReverseGeocode,
        tags: ['location', 'place'],
        examples: ['reverseGeocode({ position: [4.9, 52.4] })'],
        // Self-contained coordinate prompt first: it doubles as the canonical scenario (which needs
        // no prior map-click context) and as a concrete first UI suggestion.
        examplePrompts: [
            'Which city is [4.9, 52.4] in?',
            "What's the address at this point?",
            'Name the place where I clicked',
        ],
        relatedTools: ['getViewport', 'getCurrentLocation', 'updatePlacesDisplay', 'locatePlace'],
    },
    discoverPlaces: discoverPlacesBuilder,
    processData: processDataBuilder({
        classificationPrompt:
            `${DATA_TOOL_SHARED_FRAMING} ` +
            'WRITES NEW renderable map entries — returns `{ places?, placeConnections?, geometries?, fitOnMap?, byod? }` ' +
            'to write a places, custom-geometries, or BYOD entry, move the camera, or any combination. ' +
            'NOT for digests/charts/counts — those are `analyseData` (metadata only, never renders). ' +
            'Use for: filter/merge places (set ops), connect places (hub-spoke), compute polygons ' +
            '(union/buffer/h3-coverage/difference), focus camera on route sections via `routeUtils.getSectionBBox`, ' +
            'cross-reference (POIs near route, places-within-reachable, places-inside-high-congestion-tile).',
        tags: ['turf', 'h3', 'geometry', 'place', 'route', 'aggregation', 'connections'],
        examples: [
            // places-only: filter
            'processData({ placesEntryIDs: ["places-2"], code: "return { places: { type: \'FeatureCollection\', features: places.features.filter(p => (p.properties.poi?.name ?? \'\').toLowerCase().includes(\'vegan\')) } };", label: "vegan only", show: { places: { markerType: "pin", zoomMode: "auto", hidePreviousEntries: "all" } } })',
            // places-only: hub-spoke connections
            'processData({ placesEntryIDs: ["places-1"], code: "const [hub, ...rest] = places.features; return { places, placeConnections: rest.map(p => ({ from: hub, to: p })) };" })',
            // places + geometries (attached polygons): h3 hex coverage of result places
            'processData({ placesEntryIDs: ["places-1"], code: "const cells = new Set(); for (const p of places.features) cells.add(h3.latLngToCell(p.geometry.coordinates[1], p.geometry.coordinates[0], 8)); return { places, geometries: [...cells].map(c => turf.polygon([h3.cellToBoundary(c, true)], { cell: c })) };", show: { places: { markerType: "pin", zoomMode: "auto" }, placesGeometries: { theme: "outline" } } })',
            // routes-only: fit to worst traffic section
            'processData({ routesEntryIDs: ["routes-0"], code: "const r = routes.features[0]; const sec = (r.properties.sections.traffic ?? []).slice().sort((a,b) => (b.delayInSeconds ?? 0) - (a.delayInSeconds ?? 0))[0]; const bbox = sec ? routeUtils.getSectionBBox(r, sec) : turf.bbox(r); return { fitOnMap: { bbox, padding: 80 } };" })',
            // routes-only: fit to first toll section
            'processData({ routesEntryIDs: ["routes-0"], code: "const r = routes.features[0]; const sec = r.properties.sections.toll?.[0]; if (!sec) return { fitOnMap: turf.bbox(r) }; return { fitOnMap: routeUtils.getSectionBBox(r, sec) };" })',
            // routes + places: corridor filter into new places entry
            'processData({ placesEntryIDs: ["ev-stations"], routesEntryIDs: ["routes-0"], code: "const r = routes.features[0]; const buf = turf.buffer(r, 0.5, { units: \'kilometers\' }); const near = places.features.filter(p => turf.booleanPointInPolygon(p, buf)); return { places: { type: \'FeatureCollection\', features: near }, fitOnMap: turf.bbox(turf.featureCollection([...near, r])) };", label: "ev near route", entryId: "ev-near-routes-0", show: { places: { markerType: "pin", zoomMode: "none", hidePreviousEntries: "all" } } })',
            // geometries-only: union → new custom-geometries entry
            'processData({ geometriesEntryIDs: [{ kind: "place", id: "amsterdam-id" }, { kind: "place", id: "rotterdam-id" }], code: "return { geometries: [turf.union(turf.featureCollection(geometries))].filter(Boolean) };", label: "ams ∪ rdam", operation: "union" })',
            // geometries-only: buffer each
            'processData({ geometriesEntryIDs: [{ kind: "place", id: "paris-id" }], code: "return { geometries: geometries.map(f => ({ ...turf.buffer(f, 5, { units: \'kilometers\' }), id: `${f.id}-buf` })) };", label: "paris +5km", operation: "buffer" })',
            // geometries + places: inverse (areas in X NOT reachable from Y)
            'processData({ geometriesEntryIDs: [{ kind: "place", id: "amsterdam-id" }, { kind: "ranges", id: "ranges-0" }], code: "const outer = geometries.filter(g => g.properties._source.kind === \'place\'); const inner = geometries.filter(g => g.properties._source.kind === \'ranges\'); const env = turf.union(turf.featureCollection(outer)); const u = turf.union(turf.featureCollection(inner)); const inv = (env && u) ? turf.difference(turf.featureCollection([env, u])) : env; return { geometries: inv ? [{ ...inv, id: \'unreachable\' }] : [] };", label: "amsterdam minus reachable", operation: "difference", show: { customGeometries: { theme: "inverted", hidePreviousEntries: "all" } } })',
            // geometries (ranges) + places cross-ref: keep places inside the reachable area
            'processData({ geometriesEntryIDs: [{ kind: "ranges", id: "ranges-0" }, { kind: "places", id: "ev-stations" }], code: "const ranges = geometries.filter(g => g.properties._source.kind === \'ranges\'); const env = ranges.length ? turf.union(turf.featureCollection(ranges)) : null; const ev = (placesByEntry?.[\'ev-stations\']?.features ?? []); const kept = env ? ev.filter(p => turf.booleanPointInPolygon(p, env)) : ev; return { places: { type: \'FeatureCollection\', features: kept } };", label: "ev within reachable" })',
            // trafficAreaAnalytics + places cross-ref: keep places inside high-congestion tiles
            'processData({ placesEntryIDs: ["ev-stations"], trafficAreaAnalyticsEntryIDs: ["tta-0"], code: "const hot = trafficAreaAnalytics.features.filter(t => (t.properties.congestionLevel ?? 0) >= 75); const kept = places.features.filter(p => hot.some(t => turf.booleanPointInPolygon(p, t))); return { places: { type: \'FeatureCollection\', features: kept } };", label: "ev in high-congestion tiles" })',
            // trafficAreaAnalytics → derived geometry entry: hot-tiles polygon
            'processData({ trafficAreaAnalyticsEntryIDs: ["tta-0"], code: "const hot = trafficAreaAnalytics.features.filter(t => (t.properties.congestionLevel ?? 0) >= 75).map((t, i) => ({ ...t, id: `hot-${i}` })); const u = hot.length ? turf.union(turf.featureCollection(hot)) : null; return { geometries: u ? [{ ...u, id: \'congestion-hot-zone\' }] : [] };", label: "congestion hot zone", operation: "union", show: { customGeometries: { theme: "filled" } } })',
        ],
        examplePrompts: [
            'Keep only the vegan restaurants',
            'Draw lines from this hub to every nearby cafe',
            'Show the h3 hex coverage of these places',
            'Fit the map to the worst traffic section of the route',
            'Fit the map to the first toll section of the route',
            'Filter my loaded EV stations to those within 500 m of the route',
            'Union the city boundaries I loaded into one custom polygon',
            'Compute a 500 m buffer around the neighbourhood I loaded',
            'Areas of Amsterdam not reachable from the hospitals',
            'Filter loaded places to those inside the reachable area',
            'Keep only the EV stations that fall inside high-congestion tiles',
            'Create a custom polygon outlining the congestion hot zone in my loaded analytics',
        ],
        relatedTools: ['analyseData', 'recallState'],
        dependsOn: [
            'discoverPlaces',
            'locatePlace',
            'setRoute',
            'getTrafficIncidents',
            'getTrafficAreaAnalytics',
            'findReachableAreas',
            'addByodSource',
            'recallState',
        ],
    }),
    analyseData: analyseDataBuilder({
        classificationPrompt:
            `${DATA_TOOL_SHARED_FRAMING} ` +
            'WRITES metadata only — returns JSON or a Chart.js config (`outputFormat: "chart"`), attached as ' +
            '`_analysis[name]` on every contributing entry. Never renders or creates new map entries (that is ' +
            '`processData`). ' +
            'Use for: counts / groupings / charts (by-category, hex density); route summaries (per-leg / per-country / ' +
            'alternative compare); route TRAFFIC analysis from `route.properties.sections.traffic[]` — pick THIS for ' +
            '"distribution / count / chart of <something> along the route", NOT `getTrafficIncidents`; geometry stats ' +
            '(areas, h3 coverage); historical traffic-area-analytics breakdowns (congestion / speed / travel-time per ' +
            'tile); cross-kind correlations (incidents-per-cluster, places-near-route, distance-to-route bins, ' +
            'route-segments-by-tile-metric). ' +
            'One-shot by default — it returns an `analysisId`; pass that to `monitorAnalysis` to keep the analysis ' +
            'recomputing whenever its source entries change (the recurring sandbox then also sees `previous` / `now`).',
        tags: ['analysis', 'turf', 'h3', 'place', 'route', 'geometry'],
        examples: [
            // places-only: counts
            'analyseData({ placesEntryIDs: ["places-2"], name: "by-category", code: "const counts = {}; for (const p of places.features) for (const c of (p.properties.poi?.categories ?? [])) counts[c] = (counts[c] ?? 0) + 1; return { total: places.features.length, byCategory: counts };" })',
            // places-only: h3 density
            'analyseData({ placesEntryIDs: ["places-1"], name: "hex-density-8", code: "const bins = {}; for (const p of places.features) { const [lng,lat] = p.geometry.coordinates; const cell = h3.latLngToCell(lat, lng, 8); bins[cell] = (bins[cell] ?? 0) + 1; } return { resolution: 8, bins };" })',
            // places-only: chart
            'analyseData({ placesEntryIDs: ["places-2"], name: "top-categories-bar", outputFormat: "chart", code: "const counts = {}; for (const p of places.features) for (const c of (p.properties.poi?.categories ?? [])) counts[c] = (counts[c] ?? 0) + 1; const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10); return { type: \'bar\', data: { labels: entries.map(e => e[0]), datasets: [{ label: \'Places\', data: entries.map(e => e[1]) }] } };" })',
            // routes-only: per-route summary
            'analyseData({ routesEntryIDs: ["routes-0"], name: "summary", code: "return routes.features.map(r => ({ index: r.properties.index, distanceKm: r.properties.summary.lengthInMeters / 1000, durationMin: r.properties.summary.travelTimeInSeconds / 60, trafficDelaySec: r.properties.summary.trafficDelayInSeconds }));" })',
            // routes-only: alternative-comparison chart
            'analyseData({ routesEntryIDs: ["routes-0"], name: "alternative-comparison", outputFormat: "chart", code: "const r = routes.features; return { type: \'bar\', data: { labels: r.map(x => `Route ${x.properties.index}`), datasets: [{ label: \'Travel time (min)\', data: r.map(x => Math.round(x.properties.summary.travelTimeInSeconds / 60)) }, { label: \'Distance (km)\', data: r.map(x => Math.round(x.properties.summary.lengthInMeters / 1000)) }] } };" })',
            // routes-only: distribution of traffic incidents ALONG the route (reads route.properties.sections.traffic[])
            'analyseData({ routesEntryIDs: ["routes-0"], name: "on-route-incidents-by-category", outputFormat: "chart", code: "const sections = (routes.features[0].properties.sections.traffic ?? []); const counts = {}; for (const s of sections) for (const c of (s.categories ?? [])) counts[c] = (counts[c] ?? 0) + 1; const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]); return { type: \'bar\', data: { labels: entries.map(e => e[0]), datasets: [{ label: \'Incidents on route\', data: entries.map(e => e[1]) }] }, options: { plugins: { title: { display: true, text: \'Traffic incidents along the route\' } } } };" })',
            // routes-only: total delay per country section
            'analyseData({ routesEntryIDs: ["routes-0"], name: "delay-by-country", code: "const r = routes.features[0]; const byCountry = {}; for (const c of (r.properties.sections.country ?? [])) byCountry[c.countryCodeISO3] = (byCountry[c.countryCodeISO3] ?? 0) + (r.properties.sections.traffic ?? []).filter(t => t.startPointIndex >= c.startPointIndex && t.endPointIndex <= c.endPointIndex).reduce((s, t) => s + (t.delayInSeconds ?? 0), 0); return byCountry;" })',
            // routes + places cross-ref (count within distance)
            'analyseData({ routesEntryIDs: ["routes-0"], placesEntryIDs: ["ev-stations"], name: "ev-near-route-500m", code: "const route = routes.features[0]; const out = {}; for (const [id, fc] of Object.entries(placesByEntry)) out[id] = fc.features.filter(p => turf.pointToLineDistance(p, route, { units: \'meters\' }) <= 500).length; return { withinMeters: 500, byEntry: out };" })',
            // routes + places cross-ref (distance-to-route histogram, binned in km)
            'analyseData({ routesEntryIDs: ["routes-0"], placesEntryIDs: ["cafes"], name: "cafe-distance-bins-km", outputFormat: "chart", code: "const route = routes.features[0]; const distances = places.features.map(p => turf.pointToLineDistance(p, route, { units: \'kilometers\' })); const max = Math.max(0, ...distances); const binWidth = 1; const binCount = Math.max(1, Math.ceil(max / binWidth)); const bins = new Array(binCount).fill(0); for (const d of distances) bins[Math.min(binCount - 1, Math.floor(d / binWidth))]++; const labels = bins.map((_, i) => `${i}-${i + binWidth} km`); return { type: \'bar\', data: { labels, datasets: [{ label: \'cafes\', data: bins }] }, options: { plugins: { title: { display: true, text: \'Cafe distance to route\' } } } };" })',
            // geometries-only: areas
            'analyseData({ geometriesEntryIDs: [{ kind: "places", id: "cities" }], name: "areas", code: "return geometries.map(f => ({ id: f.id, km2: +(turf.area(f)/1e6).toFixed(2) }));" })',
            // geometries-only: chart
            'analyseData({ geometriesEntryIDs: [{ kind: "places", id: "cities" }], name: "area-bar", outputFormat: "chart", code: "return { type: \'bar\', data: { labels: geometries.map(f => f.id), datasets: [{ label: \'km²\', data: geometries.map(f => +(turf.area(f)/1e6).toFixed(2)) }] } };" })',
            // cross-kind: incidents per place cluster
            'analyseData({ placesEntryIDs: ["clusters"], incidentsEntryIDs: ["incidents-0"], name: "incidents-per-cluster", code: "const out = {}; for (const c of places.features) { const inCluster = incidents.filter(i => { const coord = i.geometry.type === \'Point\' ? i.geometry.coordinates : turf.centroid(i).geometry.coordinates; return turf.distance(coord, c.geometry.coordinates, { units: \'kilometers\' }) <= 0.5; }); out[c.id] = inCluster.length; } return out;" })',
            // cross-kind: incidents inside custom corridors
            'analyseData({ geometriesEntryIDs: [{ kind: "customGeometries", id: "buffered-routes" }], incidentsEntryIDs: ["incidents-0"], name: "incidents-in-corridors", code: "const out = []; for (const g of geometries) { const hits = incidents.filter(i => { const coord = i.geometry.type === \'Point\' ? i.geometry.coordinates : turf.centroid(i).geometry.coordinates; return turf.booleanPointInPolygon(coord, g); }); out.push({ id: g.id, count: hits.length, totalDelaySec: hits.reduce((s, i) => s + (i.properties.delayInSeconds ?? 0), 0) }); } return out;" })',
            // trafficAreaAnalytics-only: congestion distribution chart
            "analyseData({ trafficAreaAnalyticsEntryIDs: [\"tta-0\"], name: \"congestion-distribution\", outputFormat: \"chart\", code: \"const bins = [0, 25, 50, 75, 100]; const counts = new Array(bins.length).fill(0); for (const t of trafficAreaAnalytics.features) { const c = t.properties.congestionLevel ?? 0; const idx = Math.min(bins.length - 1, Math.floor(c / 25)); counts[idx]++; } return { type: 'bar', data: { labels: ['0–24', '25–49', '50–74', '75+'], datasets: [{ label: 'Tiles', data: counts.slice(0, 4) }] } };\" })",
            // cross-kind: places by congestion tile
            'analyseData({ placesEntryIDs: ["ev-stations"], trafficAreaAnalyticsEntryIDs: ["tta-0"], name: "ev-stations-by-congestion", code: "const buckets = { low: 0, mid: 0, high: 0 }; for (const p of places.features) { const tile = trafficAreaAnalytics.features.find(t => turf.booleanPointInPolygon(p, t)); if (!tile) continue; const c = tile.properties.congestionLevel ?? 0; if (c < 25) buckets.low++; else if (c < 75) buckets.mid++; else buckets.high++; } return buckets;" })',
            // cross-kind: route segments by tile metric
            'analyseData({ routesEntryIDs: ["routes-0"], trafficAreaAnalyticsEntryIDs: ["tta-0"], name: "route-tile-coverage", code: "const r = routes.features[0]; const hits = trafficAreaAnalytics.features.filter(t => turf.lineIntersect(r, t).features.length > 0); return { tilesCrossed: hits.length, avgCongestion: hits.length ? +(hits.reduce((s, t) => s + (t.properties.congestionLevel ?? 0), 0) / hits.length).toFixed(1) : null };" })',
            // incidents-only: counts by category (one-shot)
            'analyseData({ incidentsEntryIDs: ["incidents-0"], name: "by-category", code: "const c = {}; for (const i of incidents) c[i.properties.category] = (c[i.properties.category] ?? 0) + 1; return { total: incidents.length, byCategory: c };" })',
            // incidents-only: top-N by delay (one-shot)
            'analyseData({ incidentsEntryIDs: ["incidents-0"], name: "top-delays", code: "return [...incidents].sort((a,b) => (b.properties.delayInSeconds ?? 0) - (a.properties.delayInSeconds ?? 0)).slice(0,5).map(i => ({ id: i.properties.id, delay: i.properties.delayInSeconds, road: i.properties.roadNumbers?.[0] }));" })',
        ],
        examplePrompts: [
            'How many of each POI category are in these results?',
            'h3 hex density of these places',
            'Bar chart of the top POI categories',
            'Bar chart of the lengths of my route alternatives',
            'Bar chart of travel times across my route alternatives',
            'Of my loaded EV stations, how many are within 500 m of my route?',
            'Chart the distance from each cafe to the route, binned in km',
            'Histogram of place-to-route distances',
            'Distribution by category of the traffic incidents I loaded along my route',
            'Chart the incidents on the route by category',
            'Total delay by country for the incidents on my route',
            'How big are the city areas I loaded?',
            'Bar chart of the sizes of the city areas I loaded',
            'Count the loaded incidents per cluster of my loaded places',
            'Total delay per corridor for my loaded route incidents',
            'Congestion distribution across the analytics tiles',
            'Chart the average historical speed per tile in my loaded analytics',
            'Group these EV stations by the congestion level of the tile they fall in',
            'For the route, which tiles does it cross and what is their average congestion?',
            'How many incidents of each category?',
            'Top 5 incidents by delay',
            'Total delay per road across my loaded incidents',
            'Bar chart of incidents per category',
        ],
        relatedTools: ['processData', 'focusIncidents', 'recallState'],
        dependsOn: [
            'discoverPlaces',
            'locatePlace',
            'setRoute',
            'getTrafficIncidents',
            'getTrafficAreaAnalytics',
            'findReachableAreas',
            'addByodSource',
            'processData',
            'recallState',
        ],
    }),
    setRoute: {
        description: setRouteDescription,
        classificationPrompt:
            'Use to define a new route or change route waypoints/options. Pass `locations` for a new origin/stops/destination, `parameters` to update cost model / alternatives / when, or both together. Do not use to show, query, or modify an existing displayed route. To MONITOR / track / keep fresh the live traffic BETWEEN two places, START here (calculate with traffic "historical" + maxAlternatives 1-2 for stable paths), then pair with startRouteMonitor — startRouteMonitor needs a route to exist first.',
        inputSchema: setRouteSchema,
        outputSchema: setRouteOutputSchema,
        execute: executeSetRoute,
        tags: ['route', 'waypoint', 'location', 'traffic'],
        examples: [
            'setRoute({ locations: [{ query: "Amsterdam" }, { query: "Brussels" }] })',
            'setRoute({ locations: [{ query: "Eiffel Tower" }, { query: "Louvre Museum" }, { query: "Notre Dame" }] })',
            'setRoute({ parameters: { maxAlternatives: 2 } })',
            'setRoute({ parameters: { costModel: { routeType: "fast", avoid: ["tollRoads"] } } })',
            'setRoute({ parameters: { when: { option: "departAt", date: "2025-06-01T09:00:00Z" } } })',
            'setRoute({ locations: [{ query: "Paris" }, { query: "Lyon" }], parameters: { costModel: { routeType: "short" } } })',
            // Monitoring in one call: historical paths + alternatives + monitor:true (no startRouteMonitor needed).
            'setRoute({ locations: [{ query: "Paris" }, { query: "Amsterdam" }], parameters: { maxAlternatives: 2, costModel: { traffic: "historical" } }, monitor: true })',
        ],
        examplePrompts: [
            'Get directions from Paris to Lyon',
            'Route me from Amsterdam to Brussels',
            'Plan a new trip from Amsterdam to Schiphol airport',
            'Recalculate my route to Brussels from Schiphol airport',
            'Recalculate the route from Utrecht to Brussels',
            'Avoid toll roads on my current route',
            'Find the fastest route from Berlin to Munich',
            'Show 2 alternative routes for my current trip',
            'Depart at 9am on my current route',
            // Monitoring intents enter through setRoute (it builds the route startRouteMonitor then watches).
            'Monitor traffic between Paris and Amsterdam',
            'Monitor traffic between Santa Monica and Downtown LA',
            'Keep an eye on live traffic from the office to the airport',
            'Show me fresh traffic between A and B',
            // Leisure road-tripper / multi-stop traveller persona.
            'Plan a road trip from Lisbon to Porto',
            'Take me from the Eiffel Tower to the Arc de Triomphe',
        ],
        relatedTools: [
            'startRouteMonitor',
            'updateRoutesDisplay',
            'addWaypointsToRoute',
            'removeWaypointsFromRoute',
            'replaceWaypointInRoute',
            'recallState',
        ],
    },
    addWaypointsToRoute: {
        description: addWaypointsToRouteDescription,
        classificationPrompt:
            'Extend the route by prepending a new origin and/or appending a new destination (preserving the existing endpoints as stops), and/or inserting intermediate stops at optimal positions, then recalculate. Use setRoute when the user wants to fully replace waypoints.',
        inputSchema: addWaypointsToRouteSchema,
        outputSchema: addWaypointsToRouteOutputSchema,
        execute: executeAddWaypointsToRoute,
        tags: ['route', 'waypoint'],
        examples: [
            'addWaypointsToRoute({ stops: [{ query: "Westminster Abbey" }] })  // single intermediate stop',
            'addWaypointsToRoute({ stops: [{ query: "Reims" }, { query: "Metz" }] })  // multiple stops, settle into along-route order',
            'addWaypointsToRoute({ origin: { query: "my house" } })  // prepend new origin; previous origin becomes a stop',
            'addWaypointsToRoute({ destination: { query: "Heathrow Airport" } })  // append new destination; previous destination becomes a stop',
            'addWaypointsToRoute({ origin: { query: "Schiphol" }, destination: { query: "Brussels" } })  // extend on both ends',
            'addWaypointsToRoute({ origin: { query: "X" }, stops: [{ query: "Y" }] })  // combine endpoint extension and stops',
        ],
        examplePrompts: [
            'Add a stop at Westminster Abbey',
            'Add stops at Reims and Metz on the way',
            'Pick me up from my house first, then continue the trip',
            'Continue past the destination to Heathrow',
        ],
        relatedTools: [
            'locatePlace',
            'setRoute',
            'updateRoutesDisplay',
            'removeWaypointsFromRoute',
            'replaceWaypointInRoute',
        ],
        dependsOn: ['setRoute'],
    },
    removeWaypointsFromRoute: {
        description: removeWaypointsFromRouteDescription,
        classificationPrompt: 'Remove one or more waypoints by index from the current route and recalculate.',
        inputSchema: removeWaypointsFromRouteSchema,
        outputSchema: removeWaypointsFromRouteOutputSchema,
        execute: executeRemoveWaypointsFromRoute,
        tags: ['route', 'waypoint'],
        examples: [
            'removeWaypointsFromRoute({ waypointIndices: [1] })  // remove a single stop',
            'removeWaypointsFromRoute({ waypointIndices: [1, 2] })  // remove multiple stops in one call',
        ],
        examplePrompts: [
            'Remove the second stop from my route',
            'Delete the Utrecht stop',
            'Drop the last two intermediate stops',
        ],
        relatedTools: ['addWaypointsToRoute', 'replaceWaypointInRoute', 'setRoute', 'updateRoutesDisplay'],
        dependsOn: ['setRoute'],
    },
    replaceWaypointInRoute: {
        description: replaceWaypointInRouteDescription,
        classificationPrompt:
            "Overwrite a single waypoint of the current route in place — by 'origin', 'destination', or numeric index — and recalculate. Other waypoints are kept.",
        inputSchema: replaceWaypointInRouteSchema,
        outputSchema: replaceWaypointInRouteOutputSchema,
        execute: executeReplaceWaypointInRoute,
        tags: ['route', 'waypoint'],
        examples: [
            'replaceWaypointInRoute({ waypointIndex: "origin", location: { query: "Schiphol" } })',
            'replaceWaypointInRoute({ waypointIndex: "destination", location: { query: "Heathrow" } })',
            'replaceWaypointInRoute({ waypointIndex: 1, location: { query: "Utrecht" } })  // overwrite the first intermediate stop',
        ],
        examplePrompts: [
            'Change the origin to Schiphol',
            'Make Heathrow my destination',
            'Replace the second stop with Utrecht',
        ],
        relatedTools: ['addWaypointsToRoute', 'removeWaypointsFromRoute', 'setRoute', 'locatePlace'],
        dependsOn: ['setRoute'],
    },
    getPOICategoryCodes: {
        description: getPoiCategoryCodesDescription,
        classificationPrompt:
            'Resolve natural-language category names (e.g. "gym", "italian food") to POICategory codes for discoverPlaces.',
        inputSchema: getPoiCategoryCodesSchema,
        outputSchema: getPoiCategoryCodesOutputSchema,
        execute: executeGetPoiCategoryCodes,
        tags: ['discover', 'place'],
        examples: [
            'getPOICategoryCodes()',
            'getPOICategoryCodes(filters: ["gym"])',
            'getPOICategoryCodes(filters: ["italian restaurant"])  // multi-word phrase, spaces removed before matching',
            'getPOICategoryCodes(filters: ["restaurant"], language: "fr-FR")',
        ],
        examplePrompts: ['What POI categories are available?', "What's the code for gym?"],
        relatedTools: ['discoverPlaces', 'toggleTilesPOIs'],
    },
    getTrafficIncidents: {
        description: getTrafficIncidentsDescription,
        classificationPrompt:
            'AREA-BOUND incident loader — bbox / viewport / "incidents around here" / "accidents in <city>". ' +
            // Built from the canonical category list so the classifier hint can't drift from the schema.
            `Covers every incident category: ${trafficIncidentRequestCategories.join(', ')}. ` +
            'DO NOT pick for route-bound queries ("incidents ALONG / ON the route", "delays on the drive from X to Y"): ' +
            'a calculated route already carries its incidents in `route.properties.sections.traffic[]` — call ' +
            '`analyseData` with `routesEntryIDs` for those. Monitoring is built in: a shown fetch keeps the entry live ' +
            '(`monitor: true` by default; `monitor: false` for a one-shot count) — no separate ' +
            'setTrafficIncidentsMonitor call needed. Co-pick analyseData (aggregations / charts / clusters; pass ' +
            '`monitor: { entryId }` for the recurring spec) and focusIncidents (highlight a subset) when the query implies them.',
        inputSchema: getTrafficIncidentsSchema,
        outputSchema: getTrafficIncidentsOutputSchema,
        execute: executeGetTrafficIncidents,
        tags: ['traffic', 'location'],
        examples: [
            'getTrafficIncidents({})  // omit `where` → current viewport',
            'getTrafficIncidents({ where: { mode: "within", boundingBox: [4.728, 52.278, 5.080, 52.479] } })',
            'getTrafficIncidents({ where: { mode: "within", queries: [{ query: "Amsterdam" }] } })  // named area',
            'getTrafficIncidents({ where: { mode: "within", queries: [{ query: "Amsterdam" }] }, categoryFilter: ["accident", "jam"] })',
            'getTrafficIncidents({ where: { mode: "within", route: { widthMeters: 1000 } }, categoryFilter: ["roadworks"], timeValidityFilter: ["future"] })  // corridor around latest route',
            'getTrafficIncidents({ where: { mode: "within", range: "ranges-0" } })  // inside a reachable area',
        ],
        examplePrompts: [
            'Fetch traffic incidents in Amsterdam',
            'Any accidents in this area?',
            'Show roadworks across the city',
            // "Watch this area…" is a fetch + monitor — getTrafficIncidents monitors by default, so it
            // owns this prompt now (not setTrafficIncidentsMonitor, which is for an earlier entry).
            'Watch this area for new accidents',
            // Commuter / dispatcher persona: area-bound incident lookups by category.
            'Are there any road closures downtown right now?',
            'Show me the jams around the Amsterdam ring road',
            // Counter-examples: NOT this tool — route-bound queries use analyseData over routes.
        ],
        relatedTools: ['calculateBBox', 'getViewport', 'analyseData', 'focusIncidents', 'setTrafficIncidentsMonitor'],
    },
    focusIncidents: {
        description: focusIncidentsDescription,
        classificationPrompt:
            'Highlight a subset of incidents on an existing entry (drives map dim/highlight + FocusChip). ' +
            'Pick for "focus on…", "show only…", "highlight the…". Compose with analyseData to compute the ids.',
        inputSchema: focusIncidentsSchema,
        outputSchema: focusIncidentsOutputSchema,
        execute: executeFocusIncidents,
        tags: ['traffic', 'incident', 'state', 'ui'],
        examples: [
            "focusIncidents({ incidentsEntryID: 'incidents-0', incidentIds: ['TTI-...', 'TTI-...'], reason: 'top 3 by delay' })",
        ],
        examplePrompts: [
            'Focus on the 3 worst incidents by delay',
            'Highlight the closures',
            'Show only the incidents on the A4',
        ],
        relatedTools: ['analyseData', 'getTrafficIncidents'],
        dependsOn: ['getTrafficIncidents'],
    },
    clusterIncidents: clusterIncidentsBuilder({
        classificationPrompt:
            'DBSCAN clustering of loaded traffic incidents — "clusters / hotspots / dense pockets / worst areas". ' +
            'Produces stable IDs, road/category labels, delay aggregates, trend detection. Auto-reruns on monitor ticks. ' +
            'Also handles clustering of a FILTERED subset ("only jams / accidents", "delayed over N minutes", ' +
            '"along this route / within this area") via generated `code`. Co-pick with getTrafficIncidents (which ' +
            'keeps the entry monitored by default).',
        tags: ['traffic', 'incident', 'analysis', 'clustering'],
        examples: [
            "clusterIncidents({ incidentsEntryID: 'incidents-0' })",
            "clusterIncidents({ incidentsEntryID: 'incidents-0', eps: 0.3, minMembers: 4, maxClusters: 8 })",
            // Dynamic `code`: filter the incidents (real shape — `properties.delayInSeconds`) then cluster.
            'clusterIncidents({ incidentsEntryID: \'incidents-0\', code: "const major = incidents.filter(i => (i.properties.delayInSeconds ?? 0) >= 300); return cluster(major, { eps: 0.4 }, previous, now);" })',
            "clusterIncidents({ incidentsEntryID: 'incidents-0', code: \"const jams = incidents.filter(i => i.properties.category === 'jam'); return cluster(jams, {}, previous, now);\" })",
        ],
        examplePrompts: [
            'Cluster the incidents',
            'Show me the hotspots',
            'Where are the worst congestion pockets?',
            'Group the incidents into clusters',
            // New code-generation capability: clustering of a dynamically-filtered subset.
            'Cluster only the major jams',
            'Where are the hotspots of incidents delayed more than 5 minutes?',
            'Cluster just the accidents and road closures',
        ],
        relatedTools: ['getTrafficIncidents', 'setTrafficIncidentsMonitor', 'analyseData', 'focusIncidents'],
        dependsOn: ['getTrafficIncidents'],
    }),
    monitorAnalysis: {
        description: monitorAnalysisDescription,
        classificationPrompt:
            'Start or stop MONITORING an existing analysis by its `analysisId` (from analyseData) — a pure on/off ' +
            'switch that recomputes the analysis on every change to its source entries (incidents monitor ticks, ' +
            're-searched places, recalculated routes, refreshed data). When the user points at an analysis ALREADY ' +
            'in state ("that count", "the breakdown you computed") and wants it kept live — "keep that count updated ' +
            'and tell me when it grows or fades", "stop tracking that analysis" — pick THIS ALONE: the analysis ' +
            'already exists, so do NOT re-fetch the data or arm a tracker. "Tell me when it grows or fades" about an ' +
            'existing computed metric is monitorAnalysis, not createTracker. Define the computation with analyseData ' +
            'first (a ONE-SHOT analysis needs analyseData alone); for a one-off highlight use focusIncidents.',
        inputSchema: monitorAnalysisSchema,
        outputSchema: monitorAnalysisOutputSchema,
        execute: executeMonitorAnalysis,
        tags: ['analysis', 'monitor'],
        examples: [
            'monitorAnalysis({ analysisId: "rolling-count::incidents-0", enabled: true })',
            'monitorAnalysis({ analysisId: "ev-near-route::places-0,route-1", enabled: false })',
        ],
        // Follow-up phrased — monitorAnalysis toggles an analysis analyseData already created, so its
        // prompts reference an existing one ("that count / that analysis") rather than a cold request.
        examplePrompts: [
            'Keep that incident count updated and tell me when it grows or fades',
            'Stop tracking that analysis',
        ],
        relatedTools: ['analyseData', 'getTrafficIncidents', 'setTrafficIncidentsMonitor', 'focusIncidents'],
        dependsOn: ['analyseData'],
    },
    createTracker: {
        description: createTrackerDescription,
        classificationPrompt:
            'Arm a TRACKER (a watch that ALERTS) on already-loaded entries: you write `code` returning ' +
            '`{ active, members, summary }`, and it recomputes whenever the watched entries change, logging an ' +
            'alert when the condition turns true and an event when it clears. Pick for "alert me when…", "let me ' +
            'know if…", "watch for…", "notify when an incident appears near…". Reads multiple entry kinds at once ' +
            '(e.g. incidents near hospitals/places). The watched entries must already be loaded — for a fresh ' +
            'area co-pick getTrafficIncidents (load the incidents) and locatePlace (resolve a named area) so the ' +
            'tracker has real entry ids to read. CONTRAST analyseData (one-shot, no alerts) and monitorAnalysis: ' +
            'keeping an EXISTING analysis fresh — "keep that count updated, tell me when it grows or fades" — is ' +
            'monitorAnalysis, NOT a tracker. createTracker defines a NEW condition in `code` from scratch.',
        inputSchema: createTrackerSchema,
        outputSchema: createTrackerOutputSchema,
        execute: executeCreateTracker as (input: unknown, state: ToolState) => Promise<unknown>,
        tags: ['tracker', 'alert', 'monitor', 'turf'],
        examples: [
            'createTracker({ incidentsEntryIDs: ["incidents-0"], name: "Major incidents", rule: "any major incident in the area", code: "const hits = incidents.filter(i => i.properties.magnitudeOfDelay === \'major\'); return { active: hits.length > 0, members: [{ entryId: \'incidents-0\', featureIds: hits.map(i => i.properties.id) }], summary: hits.length ? `${hits.length} major incident(s)` : \'no major incidents\' };" })',
            'createTracker({ placesEntryIDs: ["hospitals"], incidentsEntryIDs: ["incidents-0"], name: "Incidents near hospitals", rule: "an incident within 100m of a hospital", code: "const near = []; const hosp = new Set(); for (const h of places.features) for (const i of incidents) { const c = i.geometry.type === \'Point\' ? i.geometry.coordinates : turf.centroid(i).geometry.coordinates; if (turf.distance(c, h.geometry.coordinates, { units: \'meters\' }) <= 100) { near.push(i.properties.id); hosp.add(h.properties.id); } } return { active: near.length > 0, members: [{ entryId: \'hospitals\', featureIds: [...hosp] }, { entryId: \'incidents-0\', featureIds: near }], summary: near.length ? `${near.length} incident(s) near ${hosp.size} hospital(s)` : \'clear\' };" })',
        ],
        examplePrompts: [
            'Alert me when there is a major incident in this area',
            'Let me know if an incident appears within 100m of a hospital',
            'Watch these incidents and tell me when a jam forms near my route',
        ],
        relatedTools: ['getTrafficIncidents', 'analyseData', 'clearTracker', 'getTrackerHistory', 'getTrackers'],
        dependsOn: ['getTrafficIncidents', 'locatePlace', 'analyseData'],
    },
    clearTracker: {
        description: clearTrackerDescription,
        classificationPrompt:
            'Stop a tracker armed by createTracker — "stop watching / stop alerting / clear that tracker". Omit ' +
            'trackerId when only one exists. Does not touch the watched entries.',
        inputSchema: clearTrackerSchema,
        outputSchema: clearTrackerOutputSchema,
        execute: executeClearTracker as (input: unknown, state: ToolState) => Promise<unknown>,
        tags: ['tracker', 'alert'],
        examples: ['clearTracker({})', 'clearTracker({ trackerId: "incidents-near-hospitals" })'],
        examplePrompts: ['Stop that tracker', 'Stop alerting me about incidents near hospitals'],
        relatedTools: ['createTracker', 'getTrackers'],
    },
    getTrackerHistory: {
        description: getTrackerHistoryDescription,
        classificationPrompt:
            'Read what trackers have FIRED — the alert/event log ("what alerts fired", "what happened with my ' +
            'trackers", "any incidents near hospitals today"). Scope to one trackerId or a sinceMs cutoff.',
        inputSchema: getTrackerHistorySchema,
        outputSchema: getTrackerHistoryOutputSchema,
        execute: executeGetTrackerHistory as (input: unknown, state: ToolState) => Promise<unknown>,
        tags: ['tracker', 'alert', 'history'],
        examples: ['getTrackerHistory({})', 'getTrackerHistory({ trackerId: "incidents-near-hospitals" })'],
        examplePrompts: ['What alerts have fired?', 'Show me the history for that tracker'],
        relatedTools: ['createTracker', 'getTrackers'],
    },
    getTrackers: {
        description: getTrackersDescription,
        classificationPrompt:
            'List the active trackers and their live state — "what am I tracking / what alerts are set / is ' +
            'anything firing". Read-only.',
        inputSchema: getTrackersSchema,
        outputSchema: getTrackersOutputSchema,
        execute: executeGetTrackers as (input: unknown, state: ToolState) => Promise<unknown>,
        tags: ['tracker', 'alert'],
        examples: ['getTrackers({})'],
        examplePrompts: ['What am I tracking?', 'Which alerts are set up?'],
        relatedTools: ['createTracker', 'getTrackerHistory'],
    },
    setTrafficIncidentsMonitor: {
        description: setTrafficIncidentsMonitorDescription,
        classificationPrompt:
            'Arm or pause background polling on an ALREADY-loaded incidents entry — one toggle (`enabled: true/false`). ' +
            'Enable for "keep updated"/"watch"/"live"/"refresh every N seconds" referring to incidents loaded on an ' +
            'EARLIER turn; disable for "stop refreshing"/"pause updates". A fresh getTrafficIncidents fetch already ' +
            'monitors by default, so do not co-pick this to start monitoring right after it.',
        inputSchema: setTrafficIncidentsMonitorSchema,
        outputSchema: setTrafficIncidentsMonitorOutputSchema,
        execute: executeSetTrafficIncidentsMonitor,
        tags: ['traffic', 'incident', 'state'],
        examples: [
            "setTrafficIncidentsMonitor({ incidentsEntryID: 'incidents-0', enabled: true })",
            "setTrafficIncidentsMonitor({ incidentsEntryID: 'incidents-0', enabled: true, intervalMs: 30000 })",
            "setTrafficIncidentsMonitor({ incidentsEntryID: 'incidents-0', enabled: false })",
        ],
        examplePrompts: [
            'Keep the incidents I loaded updated',
            'Refresh the incidents every 30 seconds',
            'Stop refreshing the incidents',
        ],
        relatedTools: ['getTrafficIncidents', 'analyseData', 'focusIncidents'],
        dependsOn: ['getTrafficIncidents'],
    },
    startRouteMonitor: {
        description: startRouteMonitorDescription,
        classificationPrompt:
            'Arm background recalculation on an ALREADY-calculated route (default 60s): re-runs the SAME route ' +
            'each tick so its live-traffic delays stay current. Pick for "keep this route updated" / "watch the ' +
            'traffic on this drive" / "recalculate every N seconds". Best paired with a route calculated as ' +
            'traffic "historical" + maxAlternatives 1-2 (stable typical paths, fresh delays). Not needed just to ' +
            'calculate a route — that is setRoute.',
        inputSchema: startRouteMonitorSchema,
        outputSchema: startRouteMonitorOutputSchema,
        execute: executeStartRouteMonitor,
        tags: ['route', 'traffic', 'state'],
        examples: [
            "startRouteMonitor({ routesEntryID: 'routes-0' })",
            "startRouteMonitor({ routesEntryID: 'routes-0', intervalMs: 30000 })",
        ],
        examplePrompts: [
            'Keep this route updated with live traffic',
            'Watch the traffic on the drive from Paris to Amsterdam',
            'Recalculate this route every 30 seconds',
            'Monitor traffic between these places',
        ],
        relatedTools: ['setRoute', 'stopRouteMonitor', 'updateRoutesDisplay', 'analyseData'],
        dependsOn: ['setRoute'],
    },
    stopRouteMonitor: {
        description: stopRouteMonitorDescription,
        classificationPrompt:
            'Stop recalculating a route entry; the entry stays in state with its last data. Pick for "stop ' +
            'refreshing the route" / "pause traffic updates on this drive".',
        inputSchema: stopRouteMonitorSchema,
        outputSchema: stopRouteMonitorOutputSchema,
        execute: executeStopRouteMonitor,
        tags: ['route', 'traffic', 'state'],
        examples: ["stopRouteMonitor({ routesEntryID: 'routes-0' })"],
        examplePrompts: ['Stop refreshing the route', 'Pause traffic updates on this drive'],
        relatedTools: ['startRouteMonitor', 'setRoute'],
        dependsOn: ['startRouteMonitor'],
    },
    getTrafficAreaAnalytics: {
        description: getTrafficAreaAnalyticsDescription,
        classificationPrompt:
            'Fetch historical traffic analytics (speed, congestion, travel time) for an area. Use analyseData over the ' +
            'loaded entry for breakdowns (per-day / per-hour / worst-day) without re-fetching.',
        inputSchema: getTrafficAreaAnalyticsSchema,
        outputSchema: getTrafficAreaAnalyticsOutputSchema,
        execute: executeGetTrafficAreaAnalytics,
        tags: ['traffic', 'location'],
        examples: [
            "getTrafficAreaAnalytics({ bbox: [4.728, 52.278, 5.080, 52.479], metrics: ['speed', 'congestionLevel'], startDate: '2025-03-01', endDate: '2025-03-07' })",
            "getTrafficAreaAnalytics({ bbox: [...], metrics: ['congestionLevel'], hours: [7,8,9,17,18] })",
        ],
        examplePrompts: [
            'What was the average congestion in Amsterdam last week?',
            'Analyze traffic patterns during rush hour in this area',
            'Show me historical speed data for the city center',
        ],
        relatedTools: ['analyseData', 'updateTrafficAreaAnalyticsDisplay', 'calculateBBox', 'getViewport'],
        dependsOn: ['locatePlace'],
    },
    updatePlacesDisplay: {
        description: updatePlacesDisplayDescription,
        classificationPrompt:
            'Show, hide, and swap places ENTRIES already in state on the map — add some (as pins, base-map-style ' +
            'markers via `markerType`, and/or boundary polygons), remove others, swap atomically, or render ' +
            'boundaries. Owns rendering a stored entry with base-map-style markers; NOT the base-map tile POI icons ' +
            '(those are toggleTilesPOIs).',
        inputSchema: updatePlacesDisplaySchema,
        outputSchema: updatePlacesDisplayOutputSchema,
        execute: executeUpdatePlacesDisplay,
        tags: ['place', 'location', 'map style', 'boundary', 'outline'],
        examples: [
            'updatePlacesDisplay({ add: ["places-2"] })',
            'updatePlacesDisplay({ add: ["places-1", "places-3"], markerType: "base-map" })',
            'updatePlacesDisplay({ remove: ["places-1"] })',
            'updatePlacesDisplay({ removeMatching: ["cinema"] })  // hide every entry labelled "cinema"',
            'updatePlacesDisplay({ addMatching: ["cafe"] })',
            'updatePlacesDisplay({ clear: true })',
            'updatePlacesDisplay({ clear: true, add: ["places-2"] })  // atomic swap: hide everything, show this',
            'updatePlacesDisplay({ markerType: "pin" })  // re-pin the most recently stored entry',
            'updatePlacesDisplay({ geometry: {} })  // outline the most recently stored entry',
            'updatePlacesDisplay({ add: ["places-2"], geometry: { mode: "add" } })  // also outline on top of existing boundaries',
            'updatePlacesDisplay({ add: ["places-2"], markerType: "pin", geometry: { theme: "outline" } })  // pin AND outline',
            'updatePlacesDisplay({ add: ["places-2"], geometry: { placeIds: ["G55fc4abe-..."], theme: "outline" } })  // outline a subset',
        ],
        examplePrompts: [
            'Show the results on the map',
            'Pin the search results',
            'Hide the banks',
            'Also show the cafes on the map',
            'Additionally pin the pubs',
            'Remove the banks from the map',
            'Drop every entry labelled "parking" from the map',
            'Toggle off the hotels without clearing the rest',
            'Replace the pins with the new set',
            'Render entry places-3 with the base-map marker style',
            'Show the boundaries of the neighbourhoods I loaded',
            'Outline these neighbourhoods',
            'Highlight the shape of this place',
            'Pin the cities and outline them too',
            'Also outline Utrecht while keeping Amsterdam drawn',
            'Add the neighbourhood boundaries on top of the pins',
        ],
        relatedTools: ['discoverPlaces', 'locatePlace', 'reverseGeocode', 'recallState', 'clearMap', 'flyTo'],
        dependsOn: ['discoverPlaces', 'locatePlace', 'processData'],
    },
    updateRoutesDisplay: {
        description: updateRoutesDisplayDescription,
        classificationPrompt:
            'Show, hide, swap, and recolor routes entries on the map — add some, remove others, swap atomically, switch the highlighted alternative, or set `mainColor` (CSS color / hex; sticky across entry swaps).',
        inputSchema: updateRoutesDisplaySchema,
        outputSchema: updateRoutesDisplayOutputSchema,
        execute: executeUpdateRoutesDisplay,
        tags: ['route', 'waypoint', 'map style'],
        examples: [
            'updateRoutesDisplay({ add: ["routes-1"] })',
            'updateRoutesDisplay({ add: ["routes-0", "routes-2"] })',
            'updateRoutesDisplay({ remove: ["routes-1"] })',
            'updateRoutesDisplay({ removeMatching: ["Brussels"] })  // hide every entry whose label mentions "Brussels"',
            'updateRoutesDisplay({ addMatching: ["Edinburgh"] })',
            'updateRoutesDisplay({ clear: true })',
            'updateRoutesDisplay({ clear: true, add: ["routes-2"] })  // atomic swap: hide everything, show this',
            'updateRoutesDisplay({ selectedIndex: 1 })  // re-highlight alternative #1 on the most recent route',
            'updateRoutesDisplay({ add: ["routes-0"], selectedIndex: 2, fitBounds: false })',
            'updateRoutesDisplay({ mainColor: "coral" })  // recolor every currently-shown route (and future shows)',
            'updateRoutesDisplay({ add: ["routes-1"], mainColor: "#FF0000" })  // show in red',
        ],
        examplePrompts: [
            'Draw the route on the map',
            'Show the directions',
            'Display the calculated route',
            'Show the Edinburgh route from earlier',
            'Also show the Brussels route',
            'Hide the Lyon route',
            'Switch to the second alternative',
            'Highlight alternative 2',
            'Replace what is shown with this route',
            'Make the route line red',
            'Change the route color to coral',
            'Style the route in steelblue',
        ],
        relatedTools: ['setRoute', 'processData', 'recallState', 'clearMap'],
        dependsOn: ['setRoute'],
    },
    updateTrafficAreaAnalyticsDisplay: {
        description: updateTrafficAreaAnalyticsDisplayDescription,
        classificationPrompt:
            'Show / hide / swap / restyle historical traffic-area-analytics entries on the map. `add` / `remove` / `addMatching` / `removeMatching` / `clear` for visibility; `mode` / `metric` / `colorTheme` / `heightScale` / `scaleMode` / `filter` for the rendering. Render knobs alone implicitly target the most recent entry.',
        inputSchema: updateTrafficAreaAnalyticsDisplaySchema,
        outputSchema: updateTrafficAreaAnalyticsDisplayOutputSchema,
        execute: executeUpdateTrafficAreaAnalyticsDisplay,
        tags: ['traffic', 'map style'],
        examples: [
            'updateTrafficAreaAnalyticsDisplay({ add: ["tta-0"] })',
            "updateTrafficAreaAnalyticsDisplay({ mode: 'hexgrid-2d', metric: 'speed', colorTheme: 'heat' })  // re-style the latest (implicit)",
            'updateTrafficAreaAnalyticsDisplay({ filter: { min: 50 } })',
            "updateTrafficAreaAnalyticsDisplay({ scaleMode: 'currentRange', heightScale: 200 })",
            'updateTrafficAreaAnalyticsDisplay({ clear: true })',
            'updateTrafficAreaAnalyticsDisplay({ clear: true, add: ["tta-1"] })  // atomic swap',
            'updateTrafficAreaAnalyticsDisplay({ remove: ["tta-0"] })',
            'updateTrafficAreaAnalyticsDisplay({ addMatching: ["Amsterdam"] })',
        ],
        examplePrompts: [
            'Show the analytics on the map',
            'Visualize the congestion',
            'Only show areas with congestion above 50%',
            'Normalize height to the current data range',
            'Switch to heatmap view',
            'Also show the Amsterdam analytics',
            'Hide the Amsterdam analytics',
            'Replace what is on the map with this analytics',
        ],
        relatedTools: ['getTrafficAreaAnalytics', 'toggleTilesTrafficFlow', 'clearMap', 'analyseData', 'processData'],
        dependsOn: ['getTrafficAreaAnalytics'],
    },
    updateWaypointsDisplay: {
        description: updateWaypointsDisplayDescription,
        classificationPrompt:
            'Show or hide the STAGED origin/stop/destination markers (`state.routing.planningSlots` — what is queued for the NEXT `setRoute`). No route line is drawn; for that use `updateRoutesDisplay`. Single-collection toggle: `visible: true` (default) renders the staged set, `visible: false` clears it.',
        inputSchema: updateWaypointsDisplaySchema,
        outputSchema: updateWaypointsDisplayOutputSchema,
        execute: executeUpdateWaypointsDisplay,
        tags: ['waypoint', 'route'],
        examples: [
            'updateWaypointsDisplay()',
            'updateWaypointsDisplay({ visible: true })',
            'updateWaypointsDisplay({ visible: false })',
        ],
        examplePrompts: [
            'Show the staged waypoints on the map',
            'Mark my pending route stops',
            'Hide the staged waypoints',
        ],
        relatedTools: ['setRoute', 'updateRoutesDisplay', 'getCurrentWaypoints', 'clearMap'],
        dependsOn: ['setRoute', 'locatePlace'],
    },
    clearMap: {
        description: clearMapDescription,
        classificationPrompt:
            'Hide what the chosen state slices are rendering on the map. `layers` are SLICE KEYS: `places`, `routing`, `ranges`, `customGeometries`, `byod`, `trafficAreaAnalytics`, `trafficIncidents`. Omit to clear every slice. Map-only — slice history is kept.',
        inputSchema: clearMapSchema,
        outputSchema: clearMapOutputSchema,
        execute: executeClearMap,
        tags: ['place', 'route', 'map style'],
        examples: [
            'clearMap()',
            'clearMap({ layers: ["places"] })',
            'clearMap({ layers: ["places", "routing"] })',
            'clearMap({ layers: ["trafficAreaAnalytics", "trafficIncidents"] })',
            'clearMap({ layers: ["byod"] })',
        ],
        // "Start fresh" → resetState (wipes the session); "Hide the analytics overlay" →
        // updateTrafficAreaAnalyticsDisplay (per-slice hide). Both routed away from clearMap, so the
        // examples are kept to unambiguous whole-map clears.
        examplePrompts: ['Clear the map', 'Remove all markers', 'Hide everything on the map'],
        relatedTools: ['updatePlacesDisplay', 'updateRoutesDisplay', 'updateTrafficAreaAnalyticsDisplay'],
    },
    flyTo: {
        description: flyToDescription,
        classificationPrompt:
            'Move the camera to a bounding box or specific position; use after locating places or computing bounds.',
        inputSchema: flyToSchema,
        outputSchema: flyToOutputSchema,
        execute: executeFlyTo,
        tags: ['location', 'map style'],
        examples: [
            'flyTo({ where: { boundingBox: [4.8, 52.3, 5.0, 52.5] } })',
            'flyTo({ where: { boundingBox: [4.8, 52.3, 5.0, 52.5], padding: 100 } })',
            'flyTo({ where: { position: [4.9, 52.4], zoom: 14 } })',
        ],
        // Coordinate prompt first: it moves the camera directly (no place lookup), so it's the
        // reliable canonical. "Go to Berlin" / "Center on Rome" need a locatePlace step first, which
        // the agent may stop at, so they stay as fanout cases.
        examplePrompts: ['Fly to [4.9, 52.37]', 'Go to Berlin', 'Center the map on Rome'],
        relatedTools: ['getViewport', 'locatePlace', 'updatePlacesDisplay', 'updateRoutesDisplay', 'calculateBBox'],
    },
    getViewport: {
        description: getViewportDescription,
        classificationPrompt:
            'Return the map center, zoom, and bounding box; use for area-relative queries like "in this area" or "near the map center".',
        inputSchema: getViewportSchema,
        outputSchema: getViewportOutputSchema,
        execute: executeGetViewport,
        tags: ['location', 'map style'],
        examples: ['getViewport()'],
        examplePrompts: [
            'Where is the map centered?',
            "What's the current map area?",
            'What are the current map bounds?',
        ],
        relatedTools: ['locatePlace', 'flyTo', 'discoverPlaces', 'reverseGeocode', 'getTrafficIncidents'],
    },
    addByodSource: {
        description: addByodSourceDescription,
        classificationPrompt:
            'Add a customer-owned GeoJSON FeatureCollection (URL fetch or inline) as a new BYOD source. Use when the ' +
            'user wants to import / load / overlay a customer-supplied dataset. Returns the new entry id (use with ' +
            '`byodEntryIDs` on analyseData / processData) plus a data `profile`. The entry starts with NO layers and ' +
            'renders nothing, so co-pick setByodLayers on every ingest turn to decide the layers from that profile.',
        inputSchema: addByodSourceSchema,
        outputSchema: addByodSourceOutputSchema,
        execute: executeAddByodSource,
        tags: ['byod', 'state', 'import'],
        examples: [
            'addByodSource({ label: "Sales territories", url: "https://example.com/territories.geojson" })  // then setByodLayers to render',
            'addByodSource({ label: "Inline pins", data: { type: "FeatureCollection", features: [/* … */] } })',
            'addByodSource({ label: "Q2 pins", data: { type: "FeatureCollection", features: [/* … */] } })',
        ],
        examplePrompts: [
            'Load my territories layer from https://example.com/territories.geojson',
            'Import the GeoJSON at https://example.com/data.geojson as a BYOD layer',
            'Add a customer-pins layer from https://example.com/pins.geojson',
        ],
        relatedTools: ['recallState', 'setByodLayers', 'updateByodDisplay', 'analyseData', 'processData'],
    },
    setByodLayers: {
        description: setByodLayersDescription,
        classificationPrompt:
            'Restyle a BYOD entry by replacing the MapLibre layers it renders under — pick layer types and ' +
            'data-driven paint from the data `profile` (graduate point size by a numeric field, colour a fill by ' +
            'category, switch points to symbols). OWNS every restyle of a loaded / imported / customer (BYOD) layer ' +
            '— recolour it, thicken its outlines, resize its points — even when phrased as generic styling; do NOT ' +
            'route those to setPaintProperties/setLayoutProperties (which are for base-map style layers). ALWAYS ' +
            'co-pick alongside addByodSource on EVERY BYOD ingest turn (whether or not styling was mentioned) — ' +
            'addByodSource creates the entry with no layers, so this is the only way it becomes visible. NOT for ' +
            'visibility (show/hide/remove → updateByodDisplay) nor for importing new data (→ addByodSource).',
        inputSchema: setByodLayersSchema,
        outputSchema: setByodLayersOutputSchema,
        execute: executeSetByodLayers,
        tags: ['byod', 'map style', 'display'],
        examples: [
            'setByodLayers({ byodEntryId: "byod-0", layers: [{ type: "fill", paint: { "fill-color": ["match", ["get", "region"], "north", "#1f77b4", "south", "#ff7f0e", "#cccccc"], "fill-opacity": 0.5 } }] })  // colour polygons by category',
            'setByodLayers({ byodEntryId: "byod-1", layers: [{ type: "circle", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "revenue"], 0, 3, 100000, 20], "circle-color": "#d62728" } }] })  // size points by a numeric field',
            'setByodLayers({ byodEntryId: "byod-2", layers: [{ type: "line", paint: { "line-color": "#2ca02c", "line-width": 3 } }], show: { zoomMode: "none" } })  // restyle a hidden entry and render it',
        ],
        examplePrompts: [
            'Colour my loaded territories layer by region',
            'Size my BYOD layer points by revenue',
            'Style my loaded BYOD layer with thicker green outlines',
            'Shade my BYOD polygons by their value',
        ],
        relatedTools: ['recallState', 'addByodSource', 'updateByodDisplay'],
        dependsOn: ['addByodSource'],
    },
    updateByodDisplay: {
        description: updateByodDisplayDescription,
        classificationPrompt:
            'Toggle visibility (or drop) of BYOD entries already in session state. Use after `addByodSource` or after `recallState({ kind: "byod" })` exposes the ids. Three actions: show / hide / remove. Pair with `clearAll` or `hideOthers` for bulk swaps.',
        inputSchema: updateByodDisplaySchema,
        outputSchema: updateByodDisplayOutputSchema,
        execute: executeUpdateByodDisplay,
        tags: ['byod', 'display', 'visibility'],
        examples: [
            'updateByodDisplay({ entryIds: ["byod-0"], action: "show" })',
            'updateByodDisplay({ entryIds: ["byod-0", "byod-1"], action: "show", hideOthers: true })',
            'updateByodDisplay({ entryIds: ["byod-0"], action: "hide" })',
            'updateByodDisplay({ action: "hide", clearAll: true })',
            'updateByodDisplay({ entryIds: ["byod-0"], action: "remove" })',
        ],
        examplePrompts: [
            'Hide the customer pins layer',
            'Show only the territories BYOD layer',
            'Hide all BYOD layers',
            'Drop the imported file from the session',
        ],
        relatedTools: ['recallState', 'addByodSource'],
        dependsOn: ['addByodSource'],
    },
    getCurrentWaypoints: {
        description: getCurrentWaypointsDescription,
        classificationPrompt:
            'STAGED waypoint slots only — the origin/stops/destination being built up for the NEXT `setRoute` call ' +
            '(read off `state.routing.planningSlots`, NOT off any calculated route entry). ' +
            'For waypoints of an EXISTING calculated route, use `recallState({ kind: "routes", id })` — its detail mode returns the entry\'s own waypoints.',
        inputSchema: getCurrentWaypointsSchema,
        outputSchema: getCurrentWaypointsOutputSchema,
        execute: executeGetCurrentWaypoints,
        tags: ['waypoint', 'route'],
        examples: [
            'getCurrentWaypoints()',
            'getCurrentWaypoints({ slotIndex: 1 })',
            'getCurrentWaypoints({ includeEmptySlots: true })',
            'getCurrentWaypoints({ offset: 2, limit: 4 })',
        ],
        examplePrompts: [
            "What's currently staged for the next route?",
            "What's my pending destination before I hit go?",
            'List the stops I have queued up',
        ],
        relatedTools: ['locatePlace', 'setRoute', 'updateWaypointsDisplay', 'recallState'],
    },
    getStandardMapStyles: {
        description: getStandardMapStylesDescription,
        classificationPrompt: 'List available standard map style IDs for use with setMapStandardStyle.',
        inputSchema: getStandardMapStylesSchema,
        outputSchema: getStandardMapStylesOutputSchema,
        execute: executeGetStandardMapStyles,
        tags: ['map style'],
        examples: ['getStandardMapStyles()'],
        examplePrompts: ['What map styles are available?', 'List the map themes'],
        relatedTools: ['setMapStandardStyle'],
    },
    setMapStandardStyle: {
        description: setMapStandardStyleDescription,
        classificationPrompt: 'Switch the map to a standard style preset (light, dark, satellite, driving, etc.).',
        inputSchema: setMapStandardStyleSchema,
        outputSchema: setMapStandardStyleOutputSchema,
        execute: executeSetMapStandardStyle,
        tags: ['map style'],
        examples: ['setMapStandardStyle("standardDark")', 'setMapStandardStyle("satellite")'],
        examplePrompts: [
            'Switch to dark mode',
            'Use the satellite view',
            'Change to the light theme',
            // Driver persona: the driving-optimised standard preset.
            'Use the driving map style',
        ],
        relatedTools: ['getStandardMapStyles', 'setLanguage', 'toggleTilesBaseMapLayerGroups', 'getMapStyleLayers'],
    },
    setLanguage: {
        description: setLanguageDescription,
        classificationPrompt: 'Change the language for map labels and all subsequent service API responses.',
        inputSchema: setLanguageSchema,
        outputSchema: setLanguageOutputSchema,
        execute: executeSetLanguage,
        tags: ['map style'],
        examples: ['setLanguage("fr-FR")', 'setLanguage("de-DE")'],
        examplePrompts: ['Show map labels in French', 'Switch the map to German', 'Use Spanish for place names'],
        relatedTools: ['setMapStandardStyle'],
    },
    toggleTilesBaseMapLayerGroups: {
        description: toggleTilesBaseMapLayerGroupsDescription,
        classificationPrompt:
            'Show / hide vector-tile base-map layer groups (buildings3D, roadLabels, water, placeLabels, …). Style-layer only — does NOT touch places / routes / custom-geometries rendered by the agent.',
        inputSchema: toggleTilesBaseMapLayerGroupsSchema,
        outputSchema: toggleTilesBaseMapLayerGroupsOutputSchema,
        execute: executeToggleTilesBaseMapLayerGroups,
        tags: ['map style'],
        examples: [
            'toggleTilesBaseMapLayerGroups({ visible: false, layerGroups: ["buildings3D"] })',
            'toggleTilesBaseMapLayerGroups({ visible: true, layerGroups: ["roadLabels"] })',
        ],
        examplePrompts: ['Hide 3D buildings', 'Show road labels', 'Toggle the building layer'],
        relatedTools: ['toggleTilesPOIs', 'getMapStyleLayers', 'setMapStandardStyle'],
    },
    toggleTilesPOIs: {
        description: toggleTilesPOIsDescription,
        classificationPrompt:
            'Show / hide vector-tile POI icons baked into the base-map style (restaurants/hotels/gas stations etc. shipped with the map). NOT places shown via `discoverPlaces` / `updatePlacesDisplay` (those are PlacesModule pins, untouched).',
        inputSchema: toggleTilesPOIsSchema,
        outputSchema: toggleTilesPOIsOutputSchema,
        execute: executeToggleTilesPOIs,
        tags: ['place', 'map style'],
        examples: [
            'toggleTilesPOIs({ allMapPOIsVisible: false })',
            'toggleTilesPOIs({ allMapPOIsVisible: true, filterCategories: { show: "only", values: ["RESTAURANT", "CAFE"] } })',
            'toggleTilesPOIs({ filterCategories: { show: "all_except", values: ["PARKING_GARAGE"] } })',
            'toggleTilesPOIs({ reset: true })',
        ],
        examplePrompts: [
            'Hide all map POI icons',
            'Show only restaurant icons on the map style',
            'Turn off parking icons in the base map',
        ],
        relatedTools: ['toggleTilesBaseMapLayerGroups', 'discoverPlaces', 'setMapStandardStyle'],
    },
    toggleTilesTrafficFlow: {
        description: toggleTilesTrafficFlowDescription,
        classificationPrompt:
            'Toggle the vector-tile traffic-flow overlay (live coloured road segments). NOT the same as `updateTrafficAreaAnalyticsDisplay` (historical) or route-section traffic (read via `analyseData`).',
        inputSchema: toggleTilesTrafficFlowSchema,
        outputSchema: toggleTilesTrafficFlowOutputSchema,
        execute: executeToggleTilesTrafficFlow,
        tags: ['traffic', 'map style'],
        examples: ['toggleTilesTrafficFlow({ visible: true })', 'toggleTilesTrafficFlow({ visible: false })'],
        examplePrompts: ['Show traffic flow', 'Turn off traffic colors', 'Enable the congestion overlay'],
        relatedTools: ['toggleTilesTrafficIncidents', 'setRoute', 'getTrafficIncidents'],
    },
    toggleTilesTrafficIncidents: {
        description: toggleTilesTrafficIncidentsDescription,
        classificationPrompt:
            'Toggle the vector-tile traffic-incidents overlay (live jam/accident/closure markers). NOT the GeoJSON `getTrafficIncidents` service and NOT `analyseData` (which aggregates fetched entries).',
        inputSchema: toggleTilesTrafficIncidentsSchema,
        outputSchema: toggleTilesTrafficIncidentsOutputSchema,
        execute: executeToggleTilesTrafficIncidents,
        tags: ['traffic', 'map style'],
        examples: ['toggleTilesTrafficIncidents({ visible: true })', 'toggleTilesTrafficIncidents({ visible: false })'],
        examplePrompts: ['Show traffic incidents overlay', 'Hide accident icons', 'Enable incident markers on the map'],
        relatedTools: ['toggleTilesTrafficFlow', 'getTrafficIncidents', 'setRoute'],
    },
    getMapStyleLayers: {
        description: getMapStyleLayersDescription,
        classificationPrompt: 'List MapLibre layer IDs with their paint/layout properties for custom styling.',
        inputSchema: getMapStyleLayersSchema,
        outputSchema: getMapStyleLayersOutputSchema,
        execute: executeGetMapStyleLayers,
        tags: ['map style'],
        examples: ['getMapStyleLayers()', 'getMapStyleLayers("road")', 'getMapStyleLayers("water")'],
        examplePrompts: ['What are the paint properties of the water layer?', 'Show me the road layer layout'],
        relatedTools: ['setLayoutProperties', 'setPaintProperties'],
    },
    setLayoutProperties: {
        description: setLayoutPropertiesDescription,
        classificationPrompt:
            'Set MapLibre layout properties (visibility, text-field, icon-size) on named base-map style layers. NOT ' +
            'for loaded BYOD / imported / customer layers — restyle those with setByodLayers.',
        inputSchema: setLayoutPropertiesSchema,
        outputSchema: setLayoutPropertiesOutputSchema,
        execute: executeSetLayoutProperties,
        tags: ['map style'],
        examples: [
            'setLayoutProperties([{ layerId: "road-label", propertyName: "visibility", value: "none" }])',
            'setLayoutProperties([{ layerId: "poi-label", propertyName: "text-field", value: "{name}" }, { layerId: "poi-label", propertyName: "icon-size", value: 1.2 }])',
        ],
        examplePrompts: [
            "Set the road-label layer's visibility property to none",
            'Change the text size on building labels',
            'Make the city labels bigger',
        ],
        relatedTools: ['getMapStyleLayers', 'setPaintProperties'],
        dependsOn: ['getMapStyleLayers'],
    },
    setPaintProperties: {
        description: setPaintPropertiesDescription,
        classificationPrompt:
            'Set MapLibre paint properties (colors, widths, opacity) on named base-map style layers. NOT for loaded ' +
            'BYOD / imported / customer layers — restyle those with setByodLayers.',
        inputSchema: setPaintPropertiesSchema,
        outputSchema: setPaintPropertiesOutputSchema,
        execute: executeSetPaintProperties,
        tags: ['map style'],
        examples: [
            'setPaintProperties([{ layerId: "water", propertyName: "fill-color", value: "#0000ff" }])',
            'setPaintProperties([{ layerId: "road", propertyName: "line-color", value: "#ff0000" }, { layerId: "road", propertyName: "line-width", value: 3 }])',
        ],
        examplePrompts: [
            'Make the water bright blue',
            'Change the road color to red',
            'Make buildings semi-transparent',
            'Make the country borders pink',
        ],
        relatedTools: ['getMapStyleLayers', 'setLayoutProperties', 'updateRoutesDisplay'],
        dependsOn: ['getMapStyleLayers'],
    },
    setPitchBearing: {
        description: setPitchBearingDescription,
        classificationPrompt: 'Tilt (pitch) and/or rotate (bearing) the map camera for a 3D perspective.',
        inputSchema: setPitchBearingSchema,
        outputSchema: setPitchBearingOutputSchema,
        execute: executeSetPitchBearing,
        tags: ['map style'],
        examples: [
            'setPitchBearing({ pitch: 45 })',
            'setPitchBearing({ bearing: 90 })',
            'setPitchBearing({ pitch: 60, bearing: -45 })',
        ],
        examplePrompts: ['Tilt the map to 45 degrees', 'Rotate the map to face north', 'Set a 3D perspective view'],
        relatedTools: ['getViewport', 'locatePlace', 'flyTo'],
    },
    zoomInOrOut: {
        description: zoomInOrOutDescription,
        classificationPrompt: 'Adjust the map zoom level by a delta; positive zooms in, negative zooms out.',
        inputSchema: zoomInOrOutSchema,
        outputSchema: zoomInOrOutOutputSchema,
        execute: executeZoomInOrOut,
        tags: ['map style'],
        examples: ['zoomInOrOut({ delta: 2 })', 'zoomInOrOut({ delta: -1 })'],
        examplePrompts: ['Zoom in', 'Zoom out 2 levels', 'Get a wider view'],
        relatedTools: ['getViewport', 'flyTo'],
    },
    executeMaplibreCode: {
        description: executeMaplibreCodeDescription,
        classificationPrompt:
            'Execute arbitrary MapLibre JS against the live map — the escape hatch when no other tool covers the ' +
            'operation. Pick it for map rendering that has no dedicated tool: fog / atmosphere / sky, terrain, ' +
            'globe vs mercator projection, or adding a raster / tile overlay — as well as time-based ANIMATIONS and ' +
            'multi-step loops (gradually fade a layer in/out, pulse opacity, sequence camera moves) that the ' +
            'one-shot setPaintProperties / setLayoutProperties cannot express.',
        inputSchema: executeMaplibreCodeSchema,
        outputSchema: executeMaplibreCodeOutputSchema,
        execute: executeExecuteMaplibreCode,
        tags: ['map style', 'maplibre', 'layers', 'sources', 'animation'],
        examples: [
            "executeMaplibreCode({ code: \"map.addSource('pts', { type: 'geojson', data: fc }); map.addLayer({ id: 'pts', type: 'circle', source: 'pts', paint: { 'circle-color': '#f00' } })\" })",
            'executeMaplibreCode({ code: "map.easeTo({ center: [4.9, 52.37], zoom: 14, duration: 2000 })" })',
            "executeMaplibreCode({ code: \"for (let i = 0; i <= 20; i++) { map.setPaintProperty('fill', 'fill-opacity', i / 20); await new Promise(r => setTimeout(r, 50)); }\" })",
            "executeMaplibreCode({ code: \"map.setFog({ color: 'white', 'horizon-blend': 0.1 })\" })",
        ],
        // Kept to operations no dedicated tool covers. Dropped "Add a GeoJSON layer to the map"
        // (the classifier rightly prefers addByodSource) and "Animate the map camera" (→ flyTo) —
        // the escape-hatch tool should only be exemplified by genuinely-uncovered map operations.
        // "Set map fog or atmosphere" first: a concrete map.setFog call with no dedicated tool, so
        // it routes reliably to the escape hatch (the canonical). "Fade in a layer gradually" is a
        // time-based animation no one-shot style tool can express — the classificationPrompt now
        // names that case explicitly so it routes here rather than to setPaintProperties.
        examplePrompts: [
            'Set map fog or atmosphere',
            'Add a raster tile overlay',
            'Fade in a layer gradually',
            'Switch the map to a globe projection',
        ],
        relatedTools: ['getMapStyleLayers', 'setLayoutProperties', 'setPaintProperties', 'flyTo'],
        dependsOn: ['getMapStyleLayers'],
    },
    calculateBBox: {
        description: calculateBBoxDescription,
        classificationPrompt:
            'Compute a [minLng, minLat, maxLng, maxLat] bounding box from GeoJSON features or tool results.',
        inputSchema: calculateBBoxSchema,
        execute: executeCalculateBBox,
        tags: ['utilities', 'location'],
        examples: ['calculateBBox(place)', 'calculateBBox(routes)', 'calculateBBox([place1, place2])'],
        // Route-extent prompt first: it classifies to calculateBBox reliably and is the canonical
        // scenario. "bounding box of these places" is kept but is flakier (the agent often computes
        // it via processData instead).
        examplePrompts: ['Calculate the extent of this route', "What's the bounding box of these places?"],
        relatedTools: ['flyTo', 'getViewport', 'updatePlacesDisplay', 'updateRoutesDisplay'],
    },
    getCurrentLocation: {
        description: getCurrentLocationDescription,
        classificationPrompt:
            'Get the user\'s physical GPS location from the browser; use for "near me" queries, not map center.',
        inputSchema: getCurrentLocationSchema,
        outputSchema: getCurrentLocationOutputSchema,
        execute: executeGetCurrentLocation,
        tags: ['utilities', 'location'],
        examples: ['getCurrentLocation()'],
        examplePrompts: ['Where am I?', 'Get my GPS location', 'Use my current position'],
        relatedTools: ['discoverPlaces', 'reverseGeocode', 'locatePlace'],
    },
    help: {
        description: helpDescription,
        classificationPrompt:
            'Return available capabilities in summary or searchable detail mode; call when the user asks what you can do.',
        inputSchema: helpSchema,
        outputSchema: helpOutputSchema,
        execute: async () => {
            throw new Error('help tool requires setupTools() — it needs resolved metadata from all tools.');
        },
        tags: ['utilities'],
        examples: [
            'help({ mode: "summary" })',
            'help({ mode: "detail", query: "traffic" })',
            'help({ mode: "detail", tag: "route" })',
            'help({ mode: "detail", query: "route", tag: "utilities" })',
        ],
        examplePrompts: ['What can you do?', 'Show me available tools', 'How do I search for places?'],
    },
    findReachableAreas: {
        description: findReachableAreasDescription,
        classificationPrompt:
            'Calculate isochrone/isodistance polygons showing how far you can travel from one or more origins.',
        inputSchema: findReachableAreasSchema,
        outputSchema: findReachableAreasOutputSchema,
        execute: executeFindReachableAreas,
        tags: ['reachable-range', 'isochrone', 'range', 'EV', 'coverage', 'multi-origin'],
        examples: [
            'findReachableAreas({ origins: [{ query: "Amsterdam", queryAs: "place" }], budgets: [{ type: "timeMinutes", value: 30 }], showOnMap: true })',
            'findReachableAreas({ origins: [{ query: "Amsterdam", queryAs: "place" }, { query: "Rotterdam", queryAs: "place" }], budgets: [{ type: "timeMinutes", value: 30 }], showOnMap: true })',
            'findReachableAreas({ origins: [{ position: { lng: 4.9, lat: 52.3 } }], budgets: [{ type: "timeMinutes", value: 10 }, { type: "timeMinutes", value: 30 }], showOnMap: true, theme: "inverted" })',
            'findReachableAreas({ origins: [{ query: "my location", queryAs: "place" }], budgets: [{ type: "distanceKM", value: 50 }], showOnMap: false })',
        ],
        examplePrompts: [
            'Show me where I can reach in 30 minutes from Amsterdam',
            'Compare 30-minute reach from Amsterdam, Rotterdam and Utrecht',
            'What area is within 50 km of Berlin?',
            'Show 10, 20, 30 minute drive zones from here',
            // Logistics / field-service planner persona: coverage from a named depot/warehouse site.
            'Map the 20-minute drive zone around our Rotterdam depot',
            'Show the area reachable within 25 km of the Eindhoven warehouse',
        ],
        relatedTools: ['recallState', 'locatePlace'],
    },
    recallState: recallStateBuilder,
    resetState: {
        description: resetStateDescription,
        classificationPrompt:
            'Wipe the session: clear every places/routes/ranges entry, reset POIs/traffic configs, revert to standard style. Use only when the user asks for a clean slate.',
        inputSchema: resetStateSchema,
        outputSchema: resetStateOutputSchema,
        execute: executeResetState,
        tags: ['state', 'reset', 'destructive'],
        examples: ['resetState()'],
        examplePrompts: ['Start over', 'Reset everything', 'Clear all my data and the map'],
        relatedTools: ['recallState', 'clearMap'],
    },
    setEntryMode: {
        description: setEntryModeDescription,
        classificationPrompt:
            'Switch any entry-owning slice (places, routing, ranges, customGeometries, byod, trafficAreaAnalytics, trafficIncidents) between `multiple` (overlay several entries) and `single` (latest only). `single` drops older entries.',
        inputSchema: setEntryModeSchema,
        outputSchema: setEntryModeOutputSchema,
        execute: executeSetEntryMode,
        tags: ['state', 'mode', 'display'],
        examples: [
            'setEntryMode({ slice: "places", mode: "single" })',
            'setEntryMode({ slice: "routing", mode: "multiple" })',
            'setEntryMode({ slice: "trafficIncidents", mode: "single" })',
        ],
        examplePrompts: [
            'Only show one route at a time',
            'Let me overlay multiple places searches',
            'Switch ranges back to single mode',
            'Only keep the latest traffic incidents snapshot',
        ],
        relatedTools: ['recallState'],
    },
} satisfies Record<string, ToolDefinition>;

// Narrow the value type so the emitted d.ts captures only the keys, not the
// inlined `z.infer<...>` signatures from each `execute` (which the d.ts bundler
// flattens to invalid `infer<typeof X>` syntax). Must go through an intermediate
// const so TypeScript resolves the mapped type before re-exporting.
const DEFAULT_TOOLS_TYPED: { [K in keyof typeof defaultTools]: ToolDefinition } = defaultTools;

/**
 * Default tool set for the agent toolkit. Each entry is a {@link ToolDefinition}
 * — either a static `ToolEntry` or a `ToolEntryBuilder` that tailors the tool to
 * {@link ToolBuildOptions} (e.g. feature flags) at agent-creation time.
 *
 * Included automatically by createMapAgent unless includeDefaultTools is false.
 * Use resolveTools() for manual composition outside createMapAgent.
 *
 * @group Agent Toolkit
 */
export const DEFAULT_TOOLS = DEFAULT_TOOLS_TYPED;

/**
 * Union of all default tool names.
 *
 * @group Agent Toolkit
 */
export type ToolName = keyof typeof DEFAULT_TOOLS;

/**
 * All valid default tool names, derived from {@link DEFAULT_TOOLS}.
 *
 * @group Agent Toolkit
 */
export const TOOL_NAMES = Object.keys(DEFAULT_TOOLS) as ToolName[];

/**
 * Default tool names that should be dropped from the registry when a {@link DataEntryKind}
 * is disabled. Only default-tool names are listed here — user-supplied custom tools are
 * never filtered automatically; integrators that want to gate their own tools on enabled
 * kinds can read `dataEntries` themselves.
 *
 * Tools that span multiple kinds (`clearMap`, `recallState`, `setEntryMode`, …) are
 * intentionally absent — they keep working regardless of which kinds are disabled.
 *
 * @group Agent Toolkit
 */
export const TOOLS_BY_DATA_ENTRY_KIND: Record<DataEntryKind, readonly ToolName[]> = {
    places: ['updatePlacesDisplay', 'locatePlace', 'discoverPlaces'],
    routes: [
        'updateRoutesDisplay',
        'setRoute',
        'addWaypointsToRoute',
        'removeWaypointsFromRoute',
        'replaceWaypointInRoute',
        'getCurrentWaypoints',
        'updateWaypointsDisplay',
        'startRouteMonitor',
        'stopRouteMonitor',
    ],
    incidents: ['getTrafficIncidents', 'focusIncidents', 'setTrafficIncidentsMonitor', 'clusterIncidents'],
    customGeometries: [],
    trafficAreaAnalytics: ['getTrafficAreaAnalytics', 'updateTrafficAreaAnalyticsDisplay'],
    byod: ['addByodSource', 'setByodLayers', 'updateByodDisplay'],
    ranges: ['findReachableAreas'],
};

/**
 * Returns each default tool's `examplePrompts` keyed by tool name. Builders are
 * materialised with empty {@link ToolBuildOptions} so the prompts reflect the
 * tool's default (full-surface) shape. Tools without prompts map to `[]`.
 *
 * Surface these in chat UIs to keep starter suggestions in sync with what the
 * tools can actually do — the registry stays the single source of truth.
 *
 * @group Agent Toolkit
 */
export const getDefaultToolPrompts = (): Record<ToolName, readonly string[]> => {
    const result = {} as Record<ToolName, readonly string[]>;
    for (const name of TOOL_NAMES) {
        const entry = DEFAULT_TOOLS[name];
        const materialized = typeof entry === 'function' ? entry({}) : entry;
        result[name] = materialized.examplePrompts ?? [];
    }
    return result;
};
