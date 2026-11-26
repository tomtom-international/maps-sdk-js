# Changelog

## 0.20.0

### Minor Changes

- **Breaking:** the Agent Toolkit's trackers are event rules, each a condition the agent watches and the alerts it logs, and a custom tool can create one with the `createEventRule(state, parameters)` function
  
  - **Breaking:** the `createTracker` and `clearTracker` tools are `createEventRule` and `clearEventRule`. Rename them where your app names a tool: a `tools` override, a `ToolName`, or a tool part your chat UI renders.
  - **Breaking:** `state.trackers` is `state.eventRules`. Its `trackers` list is `rules`, `trackersForDataset` is `rulesForDataset`, and its `tracker-event` and `trackers-change` events are `rule-event` and `event-rules-change`.
  - **Breaking:** `recallState({ slice: 'trackers' })` is `recallState({ slice: 'eventRules' })`, which returns `eventRules`, or `eventRule` for one id, in place of `trackers` and `tracker`.
  - **Breaking:** a conversation you saved before this release fails `validateUIMessages` while it holds a `recallState` call with `slice: 'trackers'`. Change that input's `slice` to `'eventRules'` before you load it.
  - **Breaking:** the `Tracker`, `TrackerEvent`, `TrackerEventType`, `TrackerEventStatus` and `TrackerStateEvents` types are `EventRule`, `RuleEvent`, `RuleEventType`, `RuleEventStatus` and `EventsStateEvents`.
  - **Breaking:** `trackerId` and `trackerName` are `ruleId` and `ruleName`, on an event, in `log()`'s options and in the tools' inputs and outputs. An event rule's `rule` is `condition`.
  - The `createEventRule` function does what the tool does, so an app gives the model a compact tool for a watch it already knows instead of the tool's long schema and the code the model writes. It returns what the tool returns, typed `CreateEventRuleResult`. `CreateEventRuleParams` takes the datasets' `*DatasetIDs`, at least one of them (`SomeMultiInputIds`), with the event rule's `name`, `condition` and `code`. Remove the event rule with `state.eventRules.unregister(ruleId)`.

- **Breaking:** the Agent Toolkit's `deriveDatasets` decides on every call whether a derived dataset follows the datasets it came from, so a filtered or computed layer stays current as its sources refresh
  
  - **Breaking:** the required `persist` says what happens to the new dataset. `'none'` writes it once, as a call did before. `'monitor'` also derives it again in place whenever one of its source datasets refreshes in place, such as monitored incidents or a route kept updated with live traffic. The camera stays where it is, a re-derive that returns nothing empties the dataset, and the result reports `monitoring: true`.
  - **Breaking:** a conversation you saved before this release fails `validateUIMessages` while an earlier successful `deriveDatasets` call in it has no `persist`. Add `persist: 'none'` to those calls' inputs before you load it.
  - The new `monitorDerivedDataset({ datasetId, enabled })` tool stops or resumes that by the dataset's own id.

- **Breaking:** the Agent Toolkit's `analyseDatasets` decides on every call whether to keep its result, so a one-off answer leaves no analysis behind
  
  - **Breaking:** the required `persist` replaces the optional `monitor`. `'none'` only returns the result, with no `analysisId`, for a count, a percentage or an average the model states in chat or feeds into another tool. `'attach'` keeps it on every contributing dataset, as a call without `monitor` did. `'monitor'` keeps it and recomputes it on every source change, as `monitor: true` did, for a live chart or metric. A chart needs `'attach'` or `'monitor'`.
  - **Breaking:** a conversation you saved before this release fails `validateUIMessages` while an earlier successful `analyseDatasets` call in it has no `persist`. Add `persist: 'attach'` to those calls' inputs before you load it, or `persist: 'monitor'` where they set `monitor: true`.
  - A built-in tool that names a dataset an earlier call in the same step is still creating waits for that call and looks again, so *"find hospitals in Las Vegas and chart the jams near them"* no longer fails with `No places dataset with id …`.
  - When code in `analyseDatasets`, `deriveDatasets` or `createEventRule` reads a dataset by an id its call doesn't list, such as `placesByDataset['vegas-hospitals']`, the call fails before running and names the id and the `*DatasetIDs` input to add it to.
  - When code in those tools or `clusterIncidents` reads a dataset record its call left empty in any other way, the error names the missing input, rather than pointing the model at a `reduce` callback.
  - When `deriveDatasets` code keeps nothing, such as no hospital within 150 m of a jam, the error says no feature passed its filter rather than calling `turf.bbox` of the empty result a malformed `fitOnMap`, so the model can say none matched.
  - `createDefaultClassifier` takes a `temperature`, such as 0 so the same request picks the same tools, and a plain camera move goes to `moveCamera` rather than `executeMaplibreCode`.

### Patch Changes

- A long-running agent can keep its history short with `compactMessages`, which folds every turn but the latest few into a running summary with one model call and returns that summary, the kept messages and the call's token usage
  
  - It cuts only where a user message starts a turn, so a tool call always stays with its result, and makes no call when there is nothing to fold.
  - By default the summary keeps commitments, decisions and facts later turns can't recover. Replace `instructions` to give it your agent's point of view, or extend `COMPACT_MESSAGES_INSTRUCTIONS`.

- A custom tool can derive a dataset with the `deriveDatasets(state, parameters)` function, which does what the `deriveDatasets` tool does, so an app gives the model a compact tool for a derivation it already knows instead of code the model writes
  
  - The function returns what the tool returns, typed `DeriveDatasetsResult`. `DeriveDatasetsParams` takes the datasets' `*DatasetIDs`, at least one, with the `code`, `persist` and the tool's optional fields; with `persist: 'monitor'`, `state.derivedDatasets.remove(datasetId)` stops it.
  - `CreateEventRuleParams` shares the at-least-one rule through the new `SomeMultiInputIds`, so a call that reads no dataset doesn't compile.

- A dataset that `deriveDatasets` keeps live can now start empty: set `keepEmpty: true` with `persist: 'monitor'` for a watch that matches nothing yet
  
  - The run writes its places, custom-geometries or BYOD dataset empty and keeps it live, and the dataset fills as its sources change. Without it, a first run that keeps nothing still writes nothing and returns an error.
  - With `keepHistory`, the history starts at a sample of zero, so a rule watching it sees the first match arrive.
  - Drift is measured against the first run that writes features, and a run that empties again is no drift.

- A BYOD dataset that `deriveDatasets` writes now comes back with its data profile, so the agent styles or analyses what its code returned in its next step
  
  - The result carries `profile` beside `byodDatasetId` and `byodFeatureCount`: the geometry types, plus each property's types, coverage and numeric and boolean examples, as `addByodSource` returns.
  - String examples stay out of it, as in every BYOD result the model sees.
  - A run that revises a monitored BYOD dataset in place returns the profile of the new data, and the `deriveDatasets` function returns it to your app too.

- A live derived dataset in the Agent Toolkit says when a re-run still writes but breaks what reads it: its run record carries a `drift` naming what changed from the result its code was written for
  
  - A run drifts when it returns no feature from source datasets that have some, or when a property at least half of its first result's features carried is now missing, on fewer than half of the features, or of a type it never had.
  - The baseline is what `deriveDatasets` wrote when it armed the dataset with `persist: 'monitor'`, or when a call with its `datasetId` revised it.
  - The model reads it in `derivation.lastRun` of the dataset's `recallState` detail, and your app in `state.derivedDatasets.lastRun(datasetId)` or the `derived-dataset-run` event.

- A dataset that `deriveDatasets` keeps live can now keep a history of its runs: set `keepHistory: true` with `persist: 'monitor'`, and the agent reads trends and peaks without keeping notes
  
  - Each run adds a sample to the BYOD dataset `<datasetId>_history`, which `historyDatasetId` in the result names: when it ran, how many features it kept and the total of each numeric property.
  - The history holds six hours of samples in the data's own time, at most 360, and takes runs within 20 seconds of each other as one.
  - The agent reads it with `analyseDatasets`, and `createEventRule` can watch it. `recallState` names it on the live dataset, and `state.derivedDatasets.historyIdOf` gives it to your app.
  - It goes when the dataset stops being kept live. A revision keeps it under the same id, so the rules watching it carry on, and starts its samples afresh.
  - It never touches your own BYOD data: it isn't kept while the BYOD slice holds a single dataset, nor when one of yours already has its id.

- `createMapAgent` takes a function as `systemPrompt`, so instructions that change while the agent runs, such as a persona's policy or a user's preferences, apply from the next turn
  
  - The agent calls it at the start of every turn and composes what it returns like the static forms, with the prefix, suffix and section overrides, for every step of that turn.
  - A host `prepareStep` receives the turn's prompt as `initialInstructions`.
  - `CustomSystemPrompt` names what the function returns: a full string or section overrides.

- The Agent Toolkit sends the model about a fifth fewer tokens for its default tools, with the same tools and arguments
  
  - The code-writing tools (`analyseDatasets`, `deriveDatasets`, `createEventRule` and `clusterIncidents`) state each sandbox rule and input shape once, and the dataset schema docs drop repeated fields and padding. `PLACES_SCHEMA_DOC`, `ROUTES_SCHEMA_DOC`, `INCIDENTS_SCHEMA_DOC`, `TRAFFIC_AREA_ANALYTICS_SCHEMA_DOC`, `GEOMETRIES_SCHEMA_DOC`, `GEOMETRIES_PROPS_DOC`, `BY_DATASET_VIEWS_DOC` and `FIT_ON_MAP_DOC` change their text accordingly, and so do the field descriptions of the shared schemas, such as `geometriesIdSchema`, `routeStretchSchema` and `locationInputSchema`.
  - The `set` description of `setMapStyling` writes a long value list several knobs share, such as the label fonts, once as `$name = …`.
  - The data tools' scope hints no longer tell the intent classifier to omit a scope its prompt makes mandatory, and the classification prompts of `setRoute`, `setLayerProperties` and `setDatasetMode` are shorter.

- The intent classifier works with a reasoning model behind an Azure deployment whose name does not start with the model name, such as `chat-agent-gpt-5.1-prod`

- A slice's `removeDataset` waits for the `upsertDataset` calls you made before it, so a dataset you remove right after an upsert stays removed
  
  - It drops the dataset from `datasets` once those upserts are done, not when you call it. Await it before you add a dataset under the same id, or the new one takes a suffixed id.

- The Agent Toolkit's model can check a live derived dataset and correct its code: `recallState` shows the code behind a dataset `deriveDatasets` keeps live and what its latest run did, and a new `deriveDatasets` call with that dataset's id rewrites it in place
  
  - A dataset's `recallState` detail carries a `derivation` when `deriveDatasets` keeps it live with `persist: 'monitor'`: its `code`, `sourceDatasetIds`, whether it's `monitoring`, and a `lastRun` with the features it wrote or the error that kept the dataset as it was.
  - A `deriveDatasets` call whose `datasetId` names such a dataset, and whose code returns the same kind, replaces its data under the same id, label and display, reports `revised: true`, and re-derives with the new code from then on. With `persist: 'none'`, it stops following its sources.
  - A re-derive that throws, or returns another kind, still keeps the dataset as it was, and now says why. Your app reads it with `state.derivedDatasets.lastRun(datasetId)` or the `derived-dataset-run` event on `state.derivedDatasets.events`, typed `DerivedDatasetRun` and `DerivedDatasetsEvents`.

- An event rule over a flickering feed stays open through a brief dip: set `resolveAfterMs` when your app calls the `createEventRule` function
  
  - The rule resolves at the first refresh after its condition has stayed false that long, measured in the data's own timestamps, so a traffic jam that drops out of one minute's refresh no longer resolves and fires again.
  - A condition that comes back meanwhile keeps the open alert, with no new one.
  - `eventRuleParamsOf` gives it back, so a saved rule keeps its hold when you create it again.

- Save the event rules and live derived datasets an agent sets up, and bring them back in a later session with no model call
  
  - `eventRuleParamsOf(state, ruleId)` gives back what a live event rule was created with, and `derivedDatasetParamsOf(state, datasetId)` what a dataset kept live with `persist: 'monitor'` was derived with, its latest revision included. Pass either to the `createEventRule` or `deriveDatasets` function to create it again. A paused rule or dataset, or one that's gone, gives back nothing.
  - `state.derivedDatasets.datasetIds` lists the monitored derived datasets in every slice, each after the derived ones it reads, so restoring them in that order finds every source.

- Your app keeps an Agent Toolkit dataset in step with a live feed in one call: `upsertDataset({ id, label, data })`, on every dataset slice, adds the dataset under a new `id` and replaces its data under a known one
  
  - A replace works as `replaceDatasetData` does. It redraws the dataset where it's shown and re-runs the event rules and monitored analyses that read it.
  - A replace records the `producedFrom` you pass, so a route's or incidents' monitor replays the new request, and keeps the dataset's `label` and what the slice keeps beside it, such as its BYOD layers.
  - A places replace swaps the connections and boundary polygons you pass along with the places, and keeps the ones you leave out.
  - A slice's upserts run in the order you call them, so the latest data wins.
  - It resolves to `'added'` or `'replaced'`, and rejects an empty `id`.

## 0.19.1

### Patch Changes

- The `ai` peer dependency moves up to `^7.0.173` and `chart.js` to `^4.6.1`

- A conversation keeps working after a turn scopes a data tool: `agent.tools` keeps every tool's full schema, so validating the history before the next turn no longer fails on an earlier call that used a kind the last turn left out

## 0.19.0

### Minor Changes

- The Agent Toolkit's places, traffic and route results answer the counting and opening-hours questions themselves, so the agent needs fewer calls and no generated code for them
  
  - `discoverPlaces` counts every place it returns `byCategory`, every charging station `byConnector`, by type and power, and how many are `openNow`, and says `moreMatched` when the search hit its limit, so the counts cover only those. Each place it lists carries its `distance` and `openingHours`: today's hours, when it next closes or opens in the place's own time, and the days it opens. A charging park also lists its `connectors`. Which of the unlisted places are open is still a question for `analyseDatasets`.
  - `deriveDatasets` and `recallState` on a places dataset return those same counts and per-place fields. `locatePlace` of a venue returns `distance`, `openingHours` and `connectors`.
  - `discoverPlaces` takes `chargers: { minPowerKW?, maxPowerKW?, connectors? }`, which on its own searches charging stations.
  - `getTrafficIncidents` returns a `summary`: incidents `byCategory` and `byMagnitude`, their `totalDelayInSeconds`, and `byRoad`, the 10 roads with most incidents.
  - A route held up by traffic says how many `jams` it meets, and where the first one is: how far in, how long, its delay and its road.
  - **Breaking:** `recallState({ slice: 'trafficIncidents', id })` returns that same `summary` in place of `byMagnitude` and `totalDelaySeconds`.
  - **Breaking:** each cluster from `clusterIncidents`, and `ClusterResult`, names its delay and peak `totalDelayInSeconds` and `peakDelayInSeconds` in place of `totalDelaySeconds` and `peakDelaySeconds`, to match the incidents' `delayInSeconds`.

- **Breaking:** the Agent Toolkit moves the camera and sets the map's locale with one tool each, so the default tools go from 50 to 46
  
  - **Breaking:** `moveCamera({ where?, zoomBy?, pitch?, bearing? })` replaces `flyTo`, `zoomInOrOut` and `setPitchBearing`. `where` is `flyTo`'s, and `zoomBy` is `zoomInOrOut`'s `delta`.
  - **Breaking:** `setMapLocale({ language?, geopoliticalView? })` replaces `setLanguage` and `setGeopoliticalView`. `geopoliticalView: null` resets the view to the default.
  - **Breaking:** `getStandardMapStyles` is removed: `setMapStandardStyle` lists the style ids.

- **Breaking:** the Agent Toolkit's two code tools are named for what they write: `analyseDatasets` attaches an analysis to the datasets it reads, and `deriveDatasets` writes new ones
  
  - **Breaking:** `analyseDatasets` replaces `analyseData`, and `deriveDatasets` replaces `processData`, with the same inputs and outputs. Rename them in a `tools` override, a `ToolName` and the tool parts your chat UI renders.

- **Breaking:** the agent restyles what it drew in place. `updateDatasetDisplay` sets the `fillStyle` of reachable areas and custom geometries and the `originPins` of reachable areas, so a reachable area or a computed polygon changes its look without being calculated again, and the camera stays where it is
  
  - `setRoute`, `editRouteWaypoints`, `findReachableAreas` and `getTrafficAreaAnalytics` take `fitBounds`, as `getTrafficIncidents` does: `false` shows the result and keeps the map where it is.
  - `updateDatasetDisplay` fits the camera when `add` or `addMatching` names the datasets to show, or when a `focus` finds sections. A display field that targets the latest dataset, places' `markerType` included, leaves the camera still.
  - **Breaking:** `findReachableAreas` takes `originPins` in place of `showOriginPin`, and returns `datasetId` in place of `rangesId`.

- **Breaking:** every Agent Toolkit dataset is a plain GeoJSON `FeatureCollection`, and `producedFrom` records what produced it where the slice can make it again. Every dataset slice shares one surface to add, find, show, focus and monitor it. The default tools go from 46 to 34 and do what they did
  
  - **Breaking:** `_module`, `_modules`, `_shown`, `_shownAs`, `_waypointsShown`, `_sectionFocus`, `_monitor`, `_tick`, `_config`, `_configChangeUnsub`, `_focus`, `_byId` and `_geometryByPlaceId` are removed from the dataset types. Read `shownDatasetIds`, `getDatasetModule(id)`, `getDatasetConfig(id)`, `isMonitored(id)` and `getFocus(id)`. `RoutingState.setWaypointsShown` and `keepSectionFocus` replace `_waypointsShown` and `_sectionFocus`.
  - **Breaking:** `RoutingState.currentDatasetModule` is removed: read `getDatasetModule(id)` with an id from `shownDatasetIds`.
  - **Breaking:** `BYODDataProfile` and `BYODPropertyProfile` are `DatasetProfile` and `DatasetPropertyProfile`.
  - **Breaking:** `data` is a `FeatureCollection` on every dataset: `Places` on places, `PolygonFeatures` on custom geometries, `TrafficIncidentDetails` on incidents, and on ranges one polygon per origin and budget, which carries its `origin`, `budget` and `originQuery`. `rangesOf(data)` groups a ranges dataset back into `ReachableRange[]`.
  - **Breaking:** what a slice keeps beside a dataset stays on the slice, read with a `getDataset*` accessor. `places.getDatasetConnections(id)`, `places.getDatasetGeometries(id)` and `byod.getDatasetLayers(id)` replace `PlacesDataset.connections`, `PlacesDataset.geometries` and `BYODDataset.layers`. On `trafficIncidents`, `getDatasetClusters`, `setDatasetClusters`, `clearDatasetClusters` and `getDatasetClustersRecord` replace `getClusters`, `setClusters`, `clearClusters` and `getClustersRecord`.
  - **Breaking:** in `analyseDatasets`, `deriveDatasets`, `createTracker` and `clusterIncidents` code, `incidentsByDataset[id]` is a `TrafficIncidentDetails` collection, like the other kinds but geometries, not a `TrafficIncident[]`. `clusterIncidents` and the sandbox's `cluster` take the collection or an array.
  - **Breaking:** `PlacesAnalysis`, `RoutesAnalysis`, `IncidentsAnalysis`, `CustomGeometriesAnalysis`, `BYODAnalysis` and `TrafficAreaAnalyticsAnalysis` are removed. Use `DatasetAnalysis`, which they aliased.
  - **Breaking:** the `setDatasetMonitor` tool, `{ slice: 'routing' | 'trafficIncidents', datasetId, enabled, intervalMs? }`, replaces `startRouteMonitor`, `stopRouteMonitor` and `setTrafficIncidentsMonitor`. Its `slice` drops a disabled kind, and the agent drops the tool once routes and incidents are both disabled.
  - **Breaking:** every dataset slice adds with `addDataset({ label, data, producedFrom, id?, timestamp? })`. Routes, incidents, custom geometries and area analytics require `producedFrom`, BYOD defaults it to `{ kind: 'integrator' }`, and places and ranges have none. It replaces `places.addPlaceResult`, `routing.addRoutes`, `trafficIncidents.addIncidentsDataset`, and the `addDataset` that took its fields as arguments on `customGeometries`, `trafficAreaAnalytics` and `byod`. `AddBYODDatasetOptions` is `BYODDatasetInput`.
  - **Breaking:** what a dataset was produced from is its `producedFrom`. It replaces `waypoints` and `params` on a routes dataset, `params` on an incidents or area-analytics dataset, `provenance` on a custom-geometries dataset and `source` on a BYOD dataset. `GeometryProvenance`, `BYODSource` and `TrafficAreaAnalyticsParams` are `GeometryProducedFrom`, `BYODProducedFrom` and `TrafficAreaAnalyticsProducedFrom`. `BYODDataset.profile` is removed. Read `state.byod.profile(id)`.
  - **Breaking:** `replaceDatasetData(id, data, timestamp)` replaces `routing.replaceRouteData`. `findFeature(id)`, which returns `{ feature, dataset }`, replaces `places.findPlaceById` and `trafficIncidents.findDatasetWithIncident`.
  - **Breaking:** every dataset slice has `showDataset(id)`, `hideDataset(id)` and `getDatasetModule(id)`. `getDatasetModule` replaces `getDatasetPlacesModule` on `places`, `getDatasetRoutingModule`, `getDatasetRangesModule` and `getDatasetGeometriesModule` on `customGeometries`. `routing.findDatasetModule(id)` returns a dataset's module if it has one, and `places.findDatasetGeometriesModule(id)` its boundaries module. On `places`, `showDataset(id, { markerType })` and `hideDataset(id)` replace `setShownDatasets`, `addShownDatasets`, `removeShownDatasets`, `clearShownDatasets` and the `shownAs*Ids` sets. On `ranges`, `showDataset(id, { polygons, fillStyle, originPins })` draws the dataset, an omitted option keeping how a shown dataset draws (one drawn without polygons gets its bands back unless the call sets only `originPins`, and a hidden one draws its bands and origin pins), and replaces `markDatasetShown`. `customGeometries.showDataset` and `trafficIncidents.showDataset` take their options as an object.
  - **Breaking:** `startMonitoring(id, { fetch }, options?)` monitors a dataset on any dataset slice, and `monitor-tick` carries a `DatasetSnapshot`, `{ takenAt, data }`. `IncidentSnapshot` and `MonitoredArea` are removed. `IncidentFocus` is `DatasetFocus`, and every dataset slice has `setFocus`, `getFocus`, `clearFocus`, `focusedFeatures` and the `focus-change` event. `getMonitorStatus(id)` returns a dataset's monitor status, `idle` for one never monitored.
  - Every dataset slice has `latestDataset`, `findById(id)` and `profile(id)`, which returns the dataset's `DatasetProfile`. `TrafficAreaAnalyticsState.getDatasetConfig(id)` returns the display config of the dataset's module, or nothing before the module exists. `BaseMapState.hasMap` says whether the agent has a map. Showing a dataset needs that map.
  - `createMapAgent` and `createToolState` take `undefined` for the map. The agent then reads datasets and never shows, moves or styles a map, and `baseMap.hasMap` is false.
  - **Breaking:** `editRouteWaypoints({ replace?, remove?, origin?, destination?, stops?, show? })` replaces `addWaypointsToRoute`, `removeWaypointsFromRoute` and `replaceWaypointInRoute`. It applies every edit in that order and recalculates once, on the latest routes dataset, whether or not it is on the map.
  - **Breaking:** `updateDatasetDisplay({ slice, … })` replaces `updatePlacesDisplay`, `updateRoutesDisplay`, `updateTrafficAreaAnalyticsDisplay`, `updateByodDisplay`, `updateWaypointsDisplay` and `clearMap`. It shows, hides and drops the datasets of every slice, ranges, custom geometries and incidents included, and `{ clear: true }` clears the map. Its `slice` drops the slices of disabled kinds, except `ranges`.
  - **Breaking:** `recallState` takes `slice` in place of `kind`, with `routing` and `trafficIncidents` for `routes` and `incidents`, and names `routing` in its snapshot. `recallState({ slice: 'trackers' })` replaces `getTrackers` and `getTrackerHistory`, and the `planningSlots` of `recallState({ slice: 'routing' })` replace `getCurrentWaypoints`.
  - **Breaking:** `show` replaces `showOnMap` on `setRoute`, `findReachableAreas` and `getTrafficAreaAnalytics`. `datasetId` replaces `incidentsDatasetID` on `focusIncidents` and `clusterIncidents` and `byodDatasetId` on `setByodLayers`.
  - **Breaking:** `DatasetKindMeta`, the type of the `DATASET_KIND_META` rows, drops `recallTool` and `fieldLabel`. Wrap `fieldName` in backticks for the label, and point to `recallState({ slice })` to list a kind's dataset ids.

### Patch Changes

- `alongRoute` names a point along a stored route, such as one hour into the drive, and reads it off the selected alternative, or the first alternative when the route is hidden, without recalculating it. `moveCamera` flies there, `discoverPlaces` and `locatePlace` search around it, and `reverseGeocode` names the place there. Each returns where it landed as `routePoint`, including `routeIndex`

- Agent Toolkit: search places and traffic along part of a route, not only the whole drive
  
  `discoverPlaces` (`where.route.stretch` and `maxDetour.stretch`) and `getTrafficIncidents` (`where.route.stretch`) take a window on the selected alternative. `from` and `to` use `travelTimeSeconds` or `distanceMeters`, the same fields as a point along the route, or `percent`, and `last` is the final part. Countries, in ISO alpha-2 or alpha-3, or section types narrow it further. The result's `searchedStretch` names the alternative and the parts covered, and the dataset label names the part searched. A `maxDetour` search now reads the selected alternative with or without a stretch, as a point along the route does.

## 0.18.0

### Minor Changes

- **Breaking:** the Agent Toolkit's data entries are now datasets, in its agent options, types, state slices, events and tools
  
  - **Breaking:** agent options: `dataEntries` is `datasets`, and `entryMode` is `datasetMode`.
  - **Breaking:** types: `DataEntryKind` is `DatasetKind`, and `EntryDataKind` is `AnalysableDatasetKind`. `DataEntryConfig` is `DatasetConfig`, `EntryMode` is `DatasetMode`, `EntryModeSlice` and `EntryModeSliceName` are `DatasetModeSlice` and `DatasetModeSliceName`, `ShownEntriesSlice` is `ShownDatasetsSlice` and `BaseEntry` is `BaseDataset`. `PlacesEntry`, `RoutesEntry`, `RangesEntry`, `CustomGeometriesEntry`, `BYODEntry`, `TrafficIncidentsEntry` and `TrafficAreaAnalyticsEntry` are `PlacesDataset`, `RoutesDataset`, `RangesDataset`, `CustomGeometriesDataset`, `BYODDataset`, `TrafficIncidentsDataset` and `TrafficAreaAnalyticsDataset`. `AddBYODEntryOptions` is `AddBYODDatasetOptions`, and `EntryAnalysis` is `DatasetAnalysis`.
  - **Breaking:** constants: `ENTRY_MODE_SLICE_NAMES` is `DATASET_MODE_SLICE_NAMES`, `DATA_ENTRY_KIND_TO_SLICE` is `DATASET_KIND_TO_SLICE`, `TOOLS_BY_DATA_ENTRY_KIND` is `TOOLS_BY_DATASET_KIND`, `ALL_ENTRY_DATA_KINDS` is `ANALYSABLE_DATASET_KINDS` and `ENTRY_KIND_META` is `DATASET_KIND_META`. Tool helpers: `placesEntryIDsSchema` is `placesDatasetIDsSchema`, `showEntryGeometries` is `showDatasetGeometries` and `findPlacesByEntry` is `findPlacesByDataset`.
  - **Breaking:** state slices: `entries`, `latestEntry`, `entryMode` and `setEntryMode` are `datasets`, `latestDataset`, `datasetMode` and `setDatasetMode`. `addEntry`, `showEntry`, `hideEntry`, `removeEntry`, `markEntryShown`, `replaceEntryData`, `setEntryLayers` and `shownEntryIds` are `addDataset`, `showDataset`, `hideDataset`, `removeDataset`, `markDatasetShown`, `replaceDatasetData`, `setDatasetLayers` and `shownDatasetIds`. `addShownEntries`, `setShownEntries`, `removeShownEntries` and `clearShownEntries` are `addShownDatasets`, `setShownDatasets`, `removeShownDatasets` and `clearShownDatasets`, and `addIncidentsEntry` is `addIncidentsDataset`. `getEntryModule`, `getEntryRoutingModule`, `getEntryPlacesModule`, `getEntryRangesModule` and `getEntryGeometriesModule` are `getDatasetModule`, `getDatasetRoutingModule`, `getDatasetPlacesModule`, `getDatasetRangesModule` and `getDatasetGeometriesModule`, and the routing slice's `currentEntryModule` is `currentDatasetModule`. `getAnalysesForEntry` is `getAnalysesForDataset` and `trackersForEntry` is `trackersForDataset`.
  - **Breaking:** state events: `entries-change` is `datasets-change`, with `datasets` in place of `entries`, and every `entryId` and `affectedEntryIds` field of an event, a `MemberRef`, an `AnalysisRecord` or a `Tracker` is `datasetId` and `affectedDatasetIds`. `StateDigest`'s `entryMode` and `entryCount` are `datasetMode` and `datasetCount`.
  - **Breaking:** tools: the `setEntryMode` tool is `setDatasetMode`, so `tools: { setEntryMode: false }` becomes `tools: { setDatasetMode: false }`. In tool inputs and outputs, every `*EntryIDs` and `*EntryID` field is `*DatasetIDs` and `*DatasetID`, such as `placesEntryIDs`, now `placesDatasetIDs`, and `entryId`, `entryIds`, `placesEntryId`, `byodEntryId`, `placeIdOrEntryId` and `hidePreviousEntries` are `datasetId`, `datasetIds`, `placesDatasetId`, `byodDatasetId`, `placeIdOrDatasetId` and `hidePreviousDatasets`. In tool outputs, `entries` and `entryMode` (`getTrafficIncidents`, `recallBYOD`, `recallGeometries`) are `datasets` and `datasetMode`, `recallState`'s `entryModes` is `datasetModes`, `setDatasetMode`'s `droppedEntryIds` is `droppedDatasetIds` and `processData`'s `customGeometriesEntryId` is `customGeometriesDatasetId`.
  - **Breaking:** in `analyseData`, `processData` and `createTracker` code, `placesByEntry`, `routesByEntry`, `incidentsByEntry`, `geometriesByEntry`, `byodByEntry` and `trafficAreaAnalyticsByEntry` are `placesByDataset`, `routesByDataset`, `incidentsByDataset`, `geometriesByDataset`, `byodByDataset` and `trafficAreaAnalyticsByDataset`, so code an app keeps, such as a tracker's, needs the new names.

## 0.17.2

### Patch Changes

- `setMapStyling` leaves out the base map's new `buildings3D.hover` and `buildings3D.click` knobs, which show only under a base-map event handler the agent never registers

- The package ships its `CHANGELOG.md`, as the SDK does, so you can read what changed between two releases from `node_modules`

- Dropped entries tear down fully, and the sandbox, the traffic monitor and re-runs no longer race each other
  
  - A route that `single` mode drops stops its traffic monitor, and a single-mode places entry clears its polygons
  - Incident listeners survive `resetState`, and the `resetState` tool also resets the map, even when a custom slice fails to reset
  - The code sandbox survives a lost frame and frees itself on `destroy()`; `executeMaplibreCode` returns `NaN` and `Infinity` as `null`, and reports its source and layer changes when its result can't be returned
  - Concurrent removals, mid-show drops and module creation no longer leave stale entries, focus, parameters or drawn layers behind
  - Bias and ranges handle the antimeridian, waypoints keep their altitude, and tools report errors instead of throwing
  - A `setRoute` time without a UTC offset is the local time at the origin for `departAt` and at the destination for `arriveBy`, not the browser's
  - `setRoute` keeps the cost-model fields a call leaves out
  - `dataEntries.places.enabled: false` also removes `reverseGeocode`
  - `locatePlace` and `discoverPlaces` report a failed boundary fetch in `geometryError` and `geometriesError`
  - `getTrackerHistory` orders events and its coverage by sample time
  - Cancelling `analyseData`, `processData` or `createTracker` also cancels their boundary requests
  - An entry id no entry has gets an error naming the entry kind and the recall call that lists the ids

## 0.17.1

### Patch Changes

- The README links the repository's security policy page, which sends a vulnerability report to TomTom's HackerOne program

## 0.17.0

### Minor Changes

- **Breaking:** The agent runs on the Vercel AI SDK 7, so the `ai` peer dependency moves up to `^7.0.143`
  - Move your own AI SDK calls to version 7 with its [migration guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0), for example `@ai-sdk/react` 4 and your model provider's next major.
  - **Breaking:** `MapAgentOptions.prepareStep` takes the AI SDK 7 `PrepareStepFunction<ToolSet>`. An `instructions` or `messages` override it returns now carries over to the later steps of the turn.
  - **Breaking:** The `maplibre-gl` peer dependency moves up to `^6.15.0`, and the `zod` peer dependency to `^4.6.7`.

- **Breaking:** `addByodSource` loads only public `https://` URLs unless you set `byod.validateSourceUrl`, so the model can no longer point it at your own origin, `localhost` or a private network address
  
  - **Breaking:** Without `byod.validateSourceUrl`, it refuses `http://` URLs, the page's own origin, `localhost`-style hostnames and loopback, private, link-local and other non-public IP addresses. To load from your origin or a local development server, allow those URLs in `byod.validateSourceUrl`, which replaces the default policy.
  - **Breaking:** The fetch sends no cookies or other credentials and refuses redirects, and any failure returns one generic error to the model, with no HTTP status or part of the response.
  - examples: the `map-site-selection-agent-react` code and README say its BYOD loads take any public https URL

- **Breaking:** `executeMaplibreCode` is no longer a default tool, because the code the model writes for it runs in your page with no sandbox. To keep it, add `tools: { executeMaplibreCode: createExecuteMaplibreCodeTool() }` to `createMapAgent`

- **Breaking:** agent-toolkit: a tool call carrying a top-level key the tool's `z.object` input schema doesn't declare fails with the key's name, which the model sees and can correct, instead of the key vanishing from `input`. This covers custom tools and the schemas a scope rebuilds

- **Breaking:** `setRoute` only calculates and shows a route; how it looks moves to the display and styling tools
  
  - **Breaking:** `setRoute` drops `showWaypoints` and `showSummaryBubbles`. Hide a route's pins with `updateRoutesDisplay({ waypoints: false })`, and its summary bubbles with `setMapStyling({ set: { "routes.summaryBubbles.visible": false } })`. A system prompt that names the old flags should name these instead
  - `updateRoutesDisplay` takes `waypoints` to show or hide the pins of the entries it targets, the latest one when it names none. Hidden pins stay hidden each time the route shows again, through `RoutingState.setWaypointsShown`; `showEntry`'s `showWaypoints` still applies to that one show. With pins hidden, `addWaypointsToRoute` still extends the route

- **Breaking:** In the browser, `analyseData`, `processData`, `createTracker` and `clusterIncidents` return an error to the model when the code sandbox can't start, instead of running the generated code in the page, and a call 30 seconds or more later tries the sandbox again
  - Set `codeExecution: { allowMainThreadFallback: true }` to run the code in the page, not isolated, when the sandbox can't start. That choice does not retry the sandbox.
  - A page with a document but no `Worker` fails closed the same way, rather than running the code on the page.
  - `agent.getCodeExecutionMode()` reports where generated code runs: `not-started`, `iframe-worker`, `unavailable` or `main-thread`.
  - A page CSP that blocks the sandbox's worker or `'unsafe-eval'` now fails the start too, rather than every run. The code-generation guide lists the directives the sandbox needs.

### Patch Changes

- The `discoverPlaces` schema the model reads caps `maxDetourTimeSeconds` at `3600`, the service's maximum

- The `discoverPlaces` schema the model reads says a negative detour time, a route through the POI that is faster than the original one, sorts first

- The places schema the model reads says `localizedCategories` is in English whatever the request language

- The agent tells route alternatives apart and points out a route's tolls, jams or roads on the map, without writing code for either
  
  - Each route summary names the main roads it takes in `via`, and each alternative says what it adds and avoids against route 0 in `comparedToBest`, such as a toll road or a jam. `setRoute`, the waypoint tools and `recallState` return them, so the agent can answer "how do the routes differ?" from them, with no code to write
  - `updateRoutesDisplay` takes `focus` to ring sections of the selected route and zoom to them: section types such as `tollRoad`, `traffic` or `distinct`, road numbers such as `A2`, and `pick` for the longest one, the jam with the most delay or one by its index. `focus: null` clears the ring. A monitored route keeps its selected alternative and its focus each time the monitor recalculates it
  - `updateRoutesDisplay` switches the selected alternative without drawing the route again, so the summary bubbles stay put and an index the entry doesn't have is refused
  - Routes come with their `curve` and `curvyStretch` sections, which the SDK finds in the geometry with no extra request. Each summary says how winding the route is in `timeInCurvesPercent`, the share of its travel time in curves. `focus` takes both types and `pick: 'curviest'`, and `setMapStyling` draws them with `routes.sections.curve.visible`. The agent plans without guidance, so a turn at a junction counts as a curve
  - The sandbox's `routeUtils` adds `getSectionsWithin`, `getImportantRoads`, `compareRoutes` and `isHairpin`

- `createTracker` costs the model fewer tokens: each turn offers only the entry kinds its rule reads
  
  - `createTracker` is now scopable like `analyseData`, so a tracker over incidents and places drops the other kinds' fields and schemas, about half to two thirds of its schema. It also leaves out the kinds `dataEntries` disables

- The route shape that `analyseData` and `processData` give the model says a traffic section's `eventId` is the tail of an incident's `id`, so the code it writes matches incidents by that suffix

- **Breaking:** core: the bbox utilities read and return a box crossing the antimeridian as `west > east`, as RFC 7946 and the services do, so fitting the map to results around Fiji frames Fiji rather than the whole world
  
  - **Breaking:** core: `bboxFromCoordsArray`, and `bboxFromGeoJSON` on points, return the box across the antimeridian when it is narrower than the one from the lowest to the highest longitude. A tie, or input spanning -180 to 180, keeps the latter, so every country in the world still gives `[-180, …, 180]`
  - **Breaking:** core: `bboxFromGeoJSON` reads a line or ring along its edges, which don't wrap, so a ring past 180 gives the box across the antimeridian and one from -100 to 100 stays `[-100, …, 100]`
  - **Breaking:** core: `bboxFromBBoxes`, and `bboxFromGeoJSON` on several features or parts, return the narrowest box containing every input, so merging a box across the antimeridian with another keeps both
  - **Breaking:** core: `polygonFromBBox` draws a box across the antimeridian with its east edge at `east + 360`, around the box rather than the rest of the world, and `bboxFromGeoJSON` reads that ring back as the same box
  - map: `TomTomMap.getBBox` with padding returns a view across the antimeridian as `west > east`, and a view wider than 180° whole
  - services: `geometrySearch` ranks a polygon across the antimeridian by its own width when it keeps the largest 50
  - agent-toolkit: `getTrafficAreaAnalytics` reads a `bbox` across the antimeridian as the area it covers, and the tools describe a bbox as `[west, south, east, north]`. It needs SDK 1.0.0-rc.4

- The `license` field reads `SEE LICENSE IN LICENSE.txt`, the form npm and license scanners recognise, so they point to the package's own `LICENSE.txt` instead of reporting an unknown license

- Installs beside `@tomtom-org/maps-sdk` 1.0.0 and every later 1.x release: the peer range on the SDK runs up to `<2.0.0` instead of stopping below 1.0.0

- The package page on npm and the API reference of its entry points say the plugin is in Public Preview until its 1.0.0 release, as its guides already do

- **Breaking:** core, services: a route or leg summary's `trafficDelayInSeconds` and `trafficLengthInMeters` are optional, present only when the routing service sends them, rather than `0` when it leaves them out
  
  - core: `trafficDelayInSeconds` is the delay of the traffic events along `trafficLengthInMeters`. For the gap to free-flow, use `Math.max(0, liveTrafficIncidentsTravelTimeInSeconds - noTrafficTravelTimeInSeconds)`, with `computeTravelTimeFor: 'all'`
  - agent-toolkit: the route shape `analyseData`, `processData`, `clusterIncidents` and `createTracker` give the model says what `trafficDelayInSeconds` measures and how to work out the gap to free-flow
  - examples: `react-route-planner` shows the traffic delay against free flow, and the delay of the traffic events on a row of its own

## 0.16.0

### Minor Changes

- **Breaking:** `PlacesEntry.geometries` and the boundaries `PlacesState` fetches, shows and returns are typed `PolygonFeature`, with the Geometry Data service's own properties, not `PolygonFeature<CommonPlaceProps>`
  - The route schema the model reads marks a traffic section's `tec` optional
  - `find_reachable_areas` keeps the other origins' ranges when one origin's service call fails, and lists that origin under `skipped` with the error; with no range at all, it returns the first error's code

### Patch Changes

- Showing a route without its summary bubbles keeps the bubbles' other settings, the knobs set on them included

- The route schema the model reads describes `sections.distinct`, the stretches each route has to itself

- Plugins are side-effect free, so your bundler drops every part of a plugin your app doesn't use
  
  - Each plugin declares `"sideEffects": false`, and its knob catalogue and other module-level tables are dropped when nothing reads them
  - flyover takes `@turf/turf` as a peer dependency, the copy the SDK already requires, instead of bundling its own
  - The plugins' bundles keep their module-level names, as the SDK's do, so Sandpack and builds that transpile `node_modules` with Babel run their loops correctly

## 0.15.1

### Patch Changes

- The `maplibre-gl` peer dependency moves up to `^6.13.0`

- license: the privacy clause of `LICENSE.txt` now links the TomTom Privacy Policy, https://www.tomtom.com/privacy/

- **Breaking:** map: a knob id is the path of its setting in the configuration on every module, and `setKnobs` sets several knobs in one checked change
  - map: `setKnobs(module, catalogue, values)` checks every value against its knob, then applies them all in one change and one `config-change`. If it refuses one value, it sets none. `KnobValues<CONFIG, ID>` types the values by id
  - map: `StylingFoundationsModuleConfig` nests each setting along its id, as every other module does: `{ labels: { sizeFactor: 1.2 } }` instead of `{ 'labels.sizeFactor': 1.2 }`. `setKnob`, `setKnobs`, `getKnob`, `resetKnob` and `MapPresetSettings` keep the ids
  - map: `StylingFoundationsModule`'s `updateConfig` merges one level deep, as on every module, so `updateConfig({ colors: { water } })` replaces the colours set before. Set a single colour with `setKnob`. Its `applyConfig` and `updateConfig` no longer check values at run time, as on every module. `setKnob` and `setKnobs` do
  - map: a `KnobTarget` implements `_setKnobValues(values)` instead of `_setKnobValue(id, value)`, and a subclass of `AbstractMapModule` inherits it. For a plugin's own target, `knobValueIn`, `configWithKnobs` and `configWithoutKnob` implement the hooks
  - map-effects: `MapEffectsSettings` is `MapEffectsConfig`, and nests each knob along its id: `new MapEffects(map, { bloom: { intensity: 0.5 } })`. `updateConfig` replaces each effect it names, while `setKnob` and `setKnobs` keep the rest of an effect. The constructor, `applyConfig` and `updateConfig` no longer check values at run time, as on a map module. `setKnob` and `setKnobs` do. The plugin needs SDK 1.0.0-rc.2
  - agent-toolkit: `setMapStyling` reads the styling knobs at their paths, and the plugin needs SDK 1.0.0-rc.2
  - examples: the map effects playground restores its panel from `localStorage` with `setKnobs`

- The map styling tool sets every map label in a serif or italic typeface through the `labels.typeface` knob

- tests: each package's unit test run now fails when its coverage drops below the goals in `TESTING.md`

## 0.15.0

### Minor Changes

- **Breaking:** `setLayerProperties` replaces `setPaintProperties` and `setLayoutProperties`, `setMapStyling` lists only the knobs a turn touches, and it styles the layers the agent drew
  - `setMapStyling` sets the look knobs of every layer the agent drew, shown now or later: `places.*`, `routes.*` (sections included), `geometries.*`, `ranges.*`, `traffic.areaAnalytics.*` and `traffic.incidentDetails.*`; showing them, the marker type and the fill style stay with the display tools
  - `updateRoutesDisplay` drops `color`, now `setMapStyling({ set: { 'routes.color': … } })`; `RoutingState.color` and `setColor` give way to `RoutingState.knobs`
  - `updateTrafficAreaAnalyticsDisplay` drops `mode`, `metric`, `palette`, `scaleMode`, `maxHeightMeters`, `metersPerUnit` and `filter`, now the `traffic.areaAnalytics.*` knobs
  - Each entry slice holds its modules' look as a `SliceKnobs`, such as `state.routing.knobs` and `state.places.geometriesKnobs`
  - Showing a custom geometries or places entry in another fill style keeps the styling set on its module
  - `setLayerProperties({ changes: [{ layerId, paint?, layout? }] })` sets both kinds of property on a style layer in one call
  - `setMapStyling` is scopable: the classifier picks the knob families a turn touches (`look`, `baseMap`, `pois`, `trafficFlow`, `trafficIncidents`, `terrain`, `places`, `routes`, `geometries`, `ranges`, `trafficAreaAnalytics`, `trafficIncidentDetails`), and its `set` parameter lists only their ids, while any id stays settable
  - An unknown knob id is refused with the closest ids, such as `did you mean pois.label.color?`
  - The default tools count 51
  - New example prompts cover planned roadworks, analytics recolouring, the dark styles, incident descriptions in another language and geopolitical views

### Patch Changes

- The README installs every peer dependency, `@tomtom-org/maps-sdk-plugin-map-theme` included
  - `@ai-sdk/react` is listed for the `useChat` example
  - The example links open the docs portal rather than a path outside the package
  - The `ToolEntry` shape lists the scope, loop-control and `execute` options fields

## 0.14.0

### Minor Changes

- **Breaking:** `setMapStyling` shows, hides and filters the base map, its POIs and the live traffic overlays by knob id, replacing the four `toggleTiles*` tools
  - `toggleTilesBaseMapLayerGroups` is `setMapStyling` with `visible` and `groups.<group>.visible`
  - `toggleTilesPOIs` is `pois.visible` and `pois.filters.categories.show` / `.values`
  - `toggleTilesTrafficFlow` and `toggleTilesTrafficIncidents` are `traffic.flow.visible` and `traffic.incidents.visible`, with their `filters.*` knobs
  - `setMapStyling({ reset: true })` resets what the map shows too, not only its look
  - The default tools count 52
  - `traffic.incidents.timeValidity` brings the planned incidents onto the overlay too

- **Breaking:** map: the last config properties and knob ids off the shared vocabulary follow it: a size preset is a `*Preset`, a fill style sits under `fill`, and a unit is named once
  - map: `GeometriesModule` and `ReachableRangesModule` take `fill: { style }` instead of `fillStyle`, and `TrafficAreaAnalyticsModule` `regionPolygon: { fill: { style } }` instead of `regionPolygon.fillStyle`; a feature's `properties.fillStyle` stays
  - map: `RoutingModule` `width`, `sections.<type>.width` and `waypoints.size` are `widthPreset`, `sections.<type>.widthPreset` and `waypoints.sizePreset`
  - map: `PlacesModule` `cluster.source` takes `radius`, `maxZoom`, `minPoints` and `properties` instead of MapLibre's `clusterRadius`, `clusterMaxZoom`, `clusterMinPoints` and `clusterProperties`, typed by `PlacesClusterSourceConfig`
  - map: `PlacesModule` `label.offset` is `label.distance`, since an `offset` is an `[x, y]` displacement on every module
  - map: `TrafficAreaAnalyticsModule` `height.maxHeightMeters` and `height.minHeightMeters` are `height.maxMeters` and `height.minMeters`, in `setHeight` too
  - map: each renamed property's knob id follows it
  - agent-toolkit: the tools keep their parameters, and the plugin needs SDK 1.0.0-rc.0

- **Breaking:** map: each standard style ID is the Orbis style it loads, in camelCase
  - map: `standardLight`, `standardDark`, `drivingLight`, `drivingDark` and `satellite` are `streetLight`, `streetDark`, `streetLightDriving`, `streetDarkDriving` and `streetSatellite`; `monoLight` and `monoDark` stay
  - agent-toolkit: `setMapStandardStyle` takes the new IDs, `resetState` reverts to `streetLight`, and the plugin needs SDK 1.0.0-rc.0
  - map-theme, landmarks-3d: their docs name the new IDs

### Patch Changes

- The `maplibre-gl` peer dependency moves up to `^6.12.0`

- The route schema the model reads no longer lists the EV and fuel consumption fields the SDK dropped from route summaries

- The agent can show disputed borders from a country's view, turn on 3D terrain, and answer tolls, ferries and traffic delay questions from a route
  - New default tool `setGeopoliticalView`, which sets the view on the map and for the searches that follow
  - `setMapStyling` takes every terrain knob: `terrain.hillshade.visible`, `terrain.elevation.visible` and `terrain.elevation.exaggeration` too
  - Route summaries carry `sectionCounts` (toll roads, ferries, traffic…) and the `countries` crossed, and `setRoute` requests the free-flow, historic and live-traffic travel times
  - A tool whose TomTom service or map call fails returns the `SDKErrorCode` as `code`, and its error text says whether retrying helps
  - `updateTrafficAreaAnalyticsDisplay` colours by `freeFlowSpeed` and `networkLength` too

- `recallState` and `setMapStyling` read the map style as a standard style, the only kind the SDK loads
  - `recallState`'s `mapStyle` is always `{ id }`, one of `standardStyleIDs`: `streetLight` for a map created without a `style`, instead of `null`
  - `setMapStyling` switches a map created without a `style` to `streetDark` when a theme comes out dark, as it does for an explicit `streetLight`

- **Breaking:** map: the sky, space, incident delay and hillshade knobs are named as every other knob is: a part's settings sit under it, and no name repeats its parent
  - map: `StylingFoundationsModule` knob ids `view.sky`, `view.skyColor`, `view.horizonColor` and `view.spaceColor` are `view.sky.visible`, `view.sky.color`, `view.sky.horizonColor` and `view.space.color`, in `styleColorKnobIds`, `getStyleColor` and map presets too
  - map: `TrafficIncidentsModule` `filters: { delays: { mustHaveDelay, minDelayMinutes } }` is `filters: { delays: { required, minMinutes } }`, and the knob ids follow
  - map: `TerrainModule` `hillshade: { lightDirection, exaggeration, shadowColor, highlightColor, accentColor }` is `hillshade: { light: { direction }, intensity, colors: { shaded, lit, steep } }`, and the knob ids follow, in `styleColorKnobIds` and `getStyleColor` too; `exaggeration` is now only the raised surface's vertical scale
  - agent-toolkit: `setMapStyling`'s globe example sets `view.sky.visible`

- The package ships without source maps, so a stack trace through the plugin points into its minified bundle
  - An app's own source maps still lead a trace to the plugin's frames (`dist/index.es.js:1:2345`); share such a trace in a report and TomTom maps it back to the source

## 0.13.0

### Minor Changes

- **Breaking:** map: CustomGeoJSONModule places its layers with `beforeLayerConfig`, as every other module does, and can still put a layer below any layer outside the style
  - map: a layer's `beforeID: mapStyleLayerIDs.lowestLabel` is `beforeLayerConfig: 'lowestLabel'`; `beforeLayerConfig: { layerID }` goes below another layer, such as one of this or another module's
  - map: `beforeLayerConfig` on the module places every layer that sets none, `'top'` by default
  - agent-toolkit: `setByodLayers` keeps its `beforeID` parameter and needs SDK 0.64.0

### Patch Changes

- agent-toolkit: `createMapAgent`'s `tools` option and `resolveTools` accept any `ToolDefinition`, so `DEFAULT_TOOLS` values and `ToolEntryBuilder`s type-check without a cast
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.64.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.3.0

## 0.12.0

### Minor Changes

- **Breaking:** map: whole base-map layer groups are `BaseMapModule`'s alone; the StylingModule knobs `basemap.<group>`, `buildings.footprints`, `buildings.3d` and `roads.shields` are gone
  - map: show or hide a group with `baseMap.setVisible(visible, { layerGroups: { show: 'only', values: ['buildings3D'] } })`, or `setKnob(baseMap, baseMapKnobCatalogue, 'groups.buildings3D.visible', true)`
  - map: the `data-viz`, `night-driving` and `minimal` presets no longer show or hide the building groups and the road shields
  - agent-toolkit: the `toggleTilesBaseMapLayerGroups` tool shows and hides whole groups, or the whole base map, and reports which groups are hidden; `setMapStyling` no longer takes the group knobs

- **Breaking:** map-effects: `bloom.only` names the style colour knobs by their map-wide ids (`'traffic.incidents.colors.major'`, `'pois.label.color'`), and `StylingColorKnobGroup` is `StyleColorKnobGroup`
  - map-effects: the scope reads the colours with the SDK's `getStyleColor`, so it no longer needs a `StylingFoundationsModule` on the map
  - agent-toolkit: `setMapStyling` sets the look knobs on the module owning each (Styling, BaseMap road markings, POIs, traffic flow and incidents, the terrain hillshade) by its map-wide id, and its `preset` applies a map preset with `applyMapPreset`

- **Breaking:** map: `StylingModule` is `StylingFoundationsModule`, the name of what it holds now that every other module styles its own layers
  - map: its types and catalogue follow: `StylingFoundationsModuleConfig`, `StylingFoundationsEvents`, `StylingFoundationsKnob`, `StylingFoundationsKnobId`, `StylingFoundationsKnobKind`, `StylingFoundationsKnobRange`, `StylingFoundationsKnobValue`, `StylingFoundationsKnobValueOf`, `StylingFoundationsKnobAppliesTo`, `stylingFoundationsKnobCatalogue`, `stylingFoundationsKnobIds`, `stylingFoundationsKnobKinds` and `stylingFoundationsKnobAppliesTo`
  - agent-toolkit: the base-map state's `getStylingModule()` is `getStylingFoundationsModule()`

### Patch Changes

- agent-toolkit: the `ai` peer dependency requires `^6.0.300`

- **Breaking:** map-effects: `MapEffects` loses `set`, `get` and `reset`: one knob goes through the SDK's `setKnob`, `getKnob` and `resetKnob` with `effectKnobCatalogue`, several through `updateConfig(settings)`, and `resetConfig()` turns everything off
  - map-effects: `applyConfig` checks every value before it replaces any, so a refused value leaves the effects as they were instead of clearing them
  - map-effects: the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
  - agent-toolkit: `setMapStyling` sets and resets knobs through the SDK's `setKnob` and `resetKnob`, and the peer range starts at `@tomtom-org/maps-sdk` 0.63.0
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.63.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.3

## 0.11.0

### Minor Changes

- **Breaking:** getCurrentLocation sends the model the user's position rounded to about 100 m by default, and `createGetCurrentLocationTool({ fullPrecision: true })` builds the tool that sends the exact one.
  
  - **Breaking:** getCurrentLocation: the position is rounded to 3 decimals (about 100 m), `accuracy` is at least 111 m and `timestamp` is left out, from a fix that is not high-accuracy and up to 60 s old. Replace the default with `createGetCurrentLocationTool({ fullPrecision: true })` for the exact, high-accuracy position and its timestamp
  - `createGetCurrentLocationTool` builds the getCurrentLocation tool, and `GetCurrentLocationToolOptions` names its `fullPrecision` option

- **Breaking:** `updateTrafficAreaAnalyticsDisplay` takes `palette` for `colorTheme`, and `maxHeightMeters` or `metersPerUnit` for `heightScale`
  
  - updateTrafficAreaAnalyticsDisplay: **Breaking:** `colorTheme` is `palette`, which takes the SDK's `areaAnalyticsPalettes`. Migrate `colorTheme: 'heat'` to `palette: 'heat'`
  - updateTrafficAreaAnalyticsDisplay: **Breaking:** `heightScale` is `maxHeightMeters`, the tallest cell's height under the `predefinedRange` and `currentRange` scale modes, and `metersPerUnit` sets the metres per unit of the metric under `raw`, which it switches to; a call that sets both, or one with the other's `scaleMode`, is refused. Migrate `heightScale: 200` to `maxHeightMeters: 200`
  - updateTrafficAreaAnalyticsDisplay: the `scaleMode` description names `predefinedRange` as the default, the one the SDK applies
  - The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.62.0 <1.0.0`, the first release with `areaAnalyticsPalettes`, `setPalette` and `metersPerUnit`

### Patch Changes

- The README's `useChat` snippet and the `createMapAgent` example compile against `ai@6`, and the README's tool tables list exactly the tools in `DEFAULT_TOOLS`.

- Fixes:
  - The traffic incident tools show incidents with `TrafficIncidentDetailsModule`, and the styling tools read the style with `getStyleInput()`

- The peer dependency on `@tomtom-org/maps-sdk` is the range `>=0.62.0 <1.0.0`, the first release whose map modules change their settings through `updateConfig` and filter area analytics with `setFilters`.

- findReachableAreas draws its ranges with the SDK's `ReachableRangesModule`, so their bands take the map's accent and land colours and follow a theme the agent sets
  
  - `RangeState.getEntryRangesModule` returns the entry's `ReachableRangesModule`; `getEntryGeometriesModule` now returns a plain `GeometriesModule` for drawing the entry's polygons in a style of your own, cleared with the entry; a later call changes only its fill style, keeping the styling applied since
  - `resetState` clears each ranges entry's geometries module too
  - Place boundaries and custom geometries draw in the map's accent instead of one rainbow colour each, as the SDK's `fillStyledGeometryConfig` no longer has a default palette; outlined ones keep a neutral grey border
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.62.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.2

## 0.10.1

### Patch Changes

- `discoverPlaces` resolves category words to their best-ranked POI categories, at most 10 per search.
  
  - discoverPlaces: a natural-language `poiCategories` term resolves to at most three of the categories the SDK's ranked `getPOICategoryCodes` filter returns first, instead of every category whose name or synonym contains it, so "café" no longer searches truck stops ("Transport Café")
  - discoverPlaces: a search holds at most 10 category codes, the exact codes first and then each term's best match in turn, since the Places API rejects more; "bar" alone used to expand to 15
  - getPOICategoryCodes: returns each filter's best-matching categories through the SDK's ranked `filters`, so "bar" gives Bar rather than every category holding the word
  - `getViewportBias`, `MIN_VIEWPORT_BIAS_ZOOM`, `locatePlace` and `QueryAs` are documented for custom tools that resolve a place near the map view

- `discoverPlaces` resolves its `poiCategories` words in one `resolvePOICategories` lookup and lists the words nothing matched.
  
  - discoverPlaces: `poiCategories` resolves through the SDK's `resolvePOICategories` in one lookup across all inputs, so a category ranked below a matched parent is left out as the parent already covers it
  - discoverPlaces: `unmatchedPoiCategories` in the result lists the `poiCategories` inputs left out because nothing matched them, and the error when none matches suggests a broader word or an exact code
  - discoverPlaces: the tool tells the model to pass category words straight in instead of calling `getPOICategoryCodes` first, which no longer runs before it; `getPOICategoryCodes` is described for looking up or listing codes
  - discoverPlaces: a failed category lookup returns a tool error instead of throwing

- `setRoute`, `addWaypointsToRoute`, `replaceWaypointInRoute`, `removeWaypointsFromRoute` and `discoverPlaces` return `{ error }` with the service's message when the route calculation or the search result handling fails, instead of throwing it past the AI SDK, which showed the chat only "An error occurred."

- `getTrafficAreaAnalytics` works in UTC days and hours, and reports the dates the response analysed.
  
  - `getTrafficAreaAnalytics` leaves an omitted `endDate` to the SDK default of three days ago, and reports the dates the response analysed, as UTC days, in its summary and entry label
  - `getTrafficAreaAnalytics` tells the model that its `hours` filter and every returned day and hour label are UTC, so it converts from the area's local time, and no longer returns a `timezone` the service never sends
  - The traffic area analytics schema that `analyseData`, `processData` and `clusterIncidents` show the model drops `timezone`, says the region `name` comes only when the request names the region, and describes the UTC `daily`, `hourly` and `average` entries of `timedData`

- `discoverPlaces` in `maxDetour` mode searches along the route with the SDK's `discoverPlaces`, so the toolkit no longer imports `alongRouteSearch`, which the SDK does not export

- The reachable range tools pass `reachableRangeGeometryConfig` its options object, which needs `@tomtom-org/maps-sdk` `>=0.61.0`.
  
  - The reachable range tools build their geometry config with the options object `reachableRangeGeometryConfig` takes
  - The `@tomtom-org/maps-sdk` peer dependency requires `>=0.61.0 <1.0.0`, the first release where `reachableRangeGeometryConfig` takes an options object

- `toggleTilesPOIs` rejects a call whose `filterCategories.values` names no POI category or category group, listing the unknown values, rather than passing them to the map

- agent-toolkit and map-effects check knob values with the SDK's `validateKnobValue`.
  
  - agent-toolkit: `toggleTilesPOIs` checks `filterCategories.values` with the SDK's `validateKnobValue`, so its error names every refused value the way the map does
  - map-effects: `set` checks values with the SDK's `validateKnobValue`, so a `color` knob refuses a string that is no CSS colour, and the peer range starts at `@tomtom-org/maps-sdk` 0.61.0
  - map-effects: every `effectKnobCatalogue` range has `bounds: 'hard'`

- The places tools create and restyle their modules with the SDK's `markerType` and `applyMarkerType`

- The README points to `LICENSE.txt`, as the other plugins' READMEs do

- A new guide, What the agent sends, and where, lists what reaches the model provider each turn, when `getCurrentLocation` reads the user's position, and which URLs `addByodSource` and `setMapStyling` load from the user's browser
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.61.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.2

## 0.10.0

### Minor Changes

- **Breaking:** The `updateRoutesDisplay` tool's `mainColor` input and output → `color`; `RoutingState.mainColor` → `color` and `RoutingState.setMainColor` → `setColor`
- The `@tomtom-org/maps-sdk` peer dependency requires `>=0.60.0 <1.0.0`, the first release with the top-level route `color`

### Patch Changes

- Updated dependencies:
  - @tomtom-org/maps-sdk@0.60.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.0

## 0.9.0

### Minor Changes

- **Breaking:** `findReachableAreas`, `processData` (`show.customGeometries`, `show.placesGeometries`), `updatePlacesDisplay` (`geometry`), `locatePlace` (`geometry`) and `discoverPlaces` (`geometries`) take `fillStyle` instead of `theme`, as the SDK's `GeometriesModuleConfig` names it
- **Breaking:** The ranges and custom-geometries entries record the fill style they are shown with in `_shownFillStyle` instead of `_shownTheme`

### Patch Changes

- The places tools pass their category and area-type restrictions through the SDK's `filters` object

- The `createTracker` and `getTrackerHistory` tools pass SonarQube analysis, with unchanged behaviour

- `setMapStyling({ theme })` also returns the theme's `accent` in `themeColors`, and a themed map recolours the routes and place pins the agent drew unless it set a colour for them
- The peer dependencies are `@tomtom-org/maps-sdk` `>=0.59.0 <1.0.0` and `@tomtom-org/maps-sdk-plugin-map-theme` `>=0.2.0`, the first releases with the accent

- `recallState` for a traffic area analytics entry lists only the region names the response has, instead of one `undefined` per region, and the traffic area analytics schema the data tools hand the model marks `name` and `timezone` optional
- Updated dependencies:
  - @tomtom-org/maps-sdk-plugin-map-theme@0.2.0

## 0.8.0

### Minor Changes

- **Breaking:** the POI filter mode is `'all-except'` instead of `'all_except'`, in `toggleTilesPOIs`'s input and `recallState`'s output, following the SDK's `FilterShowMode`

- **Breaking:** The `describeMapStyling` tool is removed. `setMapStyling`'s schema now names every knob id with the range or values it accepts, so the model needs no separate call before setting one.

### Patch Changes

- The README's example links point at `examples/map-traffic-agent-react`, which the public repository ships, instead of an internal-only example

- The `maplibre-gl` peer dependency requires `^6.11.2`, `zod` `^4.6.5` and `ai` `^6.0.291`

- The routes schema the model reads describes a street name as `{ text }`, following the SDK dropping phonetic transcriptions from route guidance

- services: the TSDoc of reachable ranges, Long Distance EV Routing, EV charging stations availability and traffic area analytics says which API key access each needs; reachable ranges are marked as a private preview

- The places tools search through the SDK's `discoverPlaces`, and the category codes their schemas name are the SDK's Places Search v3 ones — `CHARGING_LOCATION`, `FUEL_STATION`, `SUPERMARKET`, `PARK_AND_RECREATION_AREA`

- `setMapStyling` takes a `theme: { colors | imageUrl, mode }` and returns the resolved `themeColors`, so a conversation can theme the map from a brand, a website, an artist or a mood; a theme that comes out the other light or dark than the standard style switches to its variant first, reported as `switchedStyle`
- `@tomtom-org/maps-sdk-plugin-map-theme` is a new peer dependency, behind `setMapStyling({ theme })`
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.58.0
  - @tomtom-org/maps-sdk-plugin-map-theme@0.1.0

## 0.7.0

### Minor Changes

- **Breaking:** `toggleTilesBaseMapLayerGroups` is removed: `setMapStyling` covers the base-map layer groups as `basemap.<group>` knobs, and the building groups as `buildings.footprints` / `buildings.3d`

- **Breaking:** `BaseMapState.getHillshadeModule` is removed, with the SDK's `HillshadeModule`

### Patch Changes

- Recolouring a shown route or hiding its summary bubbles goes through the SDK's `updateConfig`, so it needs the SDK release that ships it
- Updated dependencies:
  - @tomtom-org/maps-sdk@0.57.0

## 0.6.1

### Patch Changes

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

* **map:** add more dark theme styling
* **map:** replace get() with create() on data-owned map modules
* **map:** scoped module events and per-map shared style modules (lsi-159)
* **map:** styling GA phase 0 - resetState, awaited lifecycle, custom themes
* **map:** styling GA phase 1 — StylingModule and the describe() catalogue
* **map:** styling GA phase 2 - view knobs, presets, map-effects plugin
* **routing:** drop the circle waypoint the API never had
* **routing:** phase 3 — land the response data v3 already returns
* **services:** replace flat geo-bias fields with a single geoBias option
* **service:** support request cancellation via AbortSignal


### Bug Fixes

* stop partial route updates clobbering config, give BYOD reset a contract


### Code Refactoring

* **map:** precise types for custom styles, places props and traffic data

## [0.5.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.3...maps-sdk-plugin-agent-toolkit-v0.5.4) (2026-08-25)


### Bug Fixes

* **docs:** correct stale APIs, dead links and drifted contributor docs

## [0.5.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.2...maps-sdk-plugin-agent-toolkit-v0.5.3) (2026-08-24)


### Bug Fixes

* **agent-toolkit:** range-check the sandbox fitOnMap bbox

## [0.5.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.1...maps-sdk-plugin-agent-toolkit-v0.5.2) (2026-08-24)


### Features

* add BaseMapModule appearance API and upgrade maplibre-gl to v6
* attribute map traffic to the product embedding the SDK


### Bug Fixes

* **agent-toolkit:** range-check model coordinates and report plugin coverage

## [0.5.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.5.0...maps-sdk-plugin-agent-toolkit-v0.5.1) (2026-08-04)


### Features

* **examples:** move the traffic and site-selection agents to Las Vegas


### Bug Fixes

* location resolver selecting subdivision over parent city

## [0.5.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.4...maps-sdk-plugin-agent-toolkit-v0.5.0) (2026-07-24)


### ⚠ BREAKING CHANGES

* **map:** improve base map layer groups

### Features

* **map:** improve base map layer groups


### Bug Fixes

* **agent-toolkit:** surface reverse-geocode no-match as an error
* chat UX polish, whitespace hex rendering, entry-id collision in toolkit

## [0.4.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.3...maps-sdk-plugin-agent-toolkit-v0.4.4) (2026-07-07)


### Features

* **examples:** add byod district prompts and per-district traffic monitoring


### Bug Fixes

* **agent-toolkit:** resolve routing waypoints by place id or entry id
* **agent-toolkit:** ungate scope and cross kind schemas

## [0.4.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.2...maps-sdk-plugin-agent-toolkit-v0.4.3) (2026-07-03)


### Bug Fixes

* **agent-toolkit:** unblock npm publishing of the plugin

## [0.4.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.1...maps-sdk-plugin-agent-toolkit-v0.4.2) (2026-07-03)


### Features

* **examples:** agent telemetry and Azure Monitor observability dashboard


### Bug Fixes

* **agent-toolkit:** accept places entry ids in where.placeIds
* **agent-toolkit:** guard setMapStandardStyle against accidental style changes
* **agent-toolkit:** prefer dedicated tools over the MapLibre escape hatch
* **agent-toolkit:** validate processData places and trace derived ids

## [0.4.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.4.0...maps-sdk-plugin-agent-toolkit-v0.4.1) (2026-06-30)


### Features

* **agent-toolkit:** expose sandbox data-tool inputs as per-entry records only
* **examples:** unify the agent example UI + clarifyIntent survey wizard
* **toolkit:** add clarifyIntent tool and add alwaysActive flag to tools
* **traffic-agent:** watched-area highlight, grouped Event tracker, summary follows focus


### Bug Fixes

* **agent-toolkit:** register an empty entry for zero-incident results

## [0.4.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.1...maps-sdk-plugin-agent-toolkit-v0.4.0) (2026-06-24)


### ⚠ BREAKING CHANGES

* **agent-toolkit:** consolidate per-kind recall tools into recallState
* **agent-toolkit:** analysis and incidents clustering improvements
* **traffic, map-display:** migrate to Orbis v2 GA

### Features

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
* **traffic, map-display:** migrate to Orbis v2 GA


### Reverts

* feat(traffic, map-display)!: migrate to Orbis v2 GA


### Code Refactoring

* **agent-toolkit:** consolidate per-kind recall tools into recallState

## [0.3.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.3.0...maps-sdk-plugin-agent-toolkit-v0.3.1) (2026-06-10)


### Features

* **agent-toolkit:** deterministic DBSCAN clustering tool

## [0.3.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.12...maps-sdk-plugin-agent-toolkit-v0.3.0) (2026-06-04)


### ⚠ BREAKING CHANGES

* **events:** scope + dedupe allEventFeatures, typed substitution
* **agent-toolkit:** byod improvements

### Features

* **agent-toolkit:** byod improvements
* **events:** scope + dedupe allEventFeatures, typed substitution


### Bug Fixes

* **agent-toolkit:** add missing [@group](https://github.com/group) tags on exported types
* **agent-toolkit:** public docs cleanup — links, system-prompt guidance, internal refs

## [0.2.12](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.11...maps-sdk-plugin-agent-toolkit-v0.2.12) (2026-05-22)


### Features

* **agent-toolkit:** expand plugin documentation


### Bug Fixes

* **agent-toolkit:** split scenario tests into sanity / full suites
* **agent-toolkit:** stabilize locate-place scenario prompt

## [0.2.11](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.10...maps-sdk-plugin-agent-toolkit-v0.2.11) (2026-05-21)


### Bug Fixes

* **agent-toolkit:** point README docs link at overview page

## [0.2.10](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.9...maps-sdk-plugin-agent-toolkit-v0.2.10) (2026-05-21)


### Bug Fixes

* engineering guideline updates for agent toolkit

## [0.2.9](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.8...maps-sdk-plugin-agent-toolkit-v0.2.9) (2026-05-21)


### Features

* code generation tools with updated docs

## [0.2.8](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.7...maps-sdk-plugin-agent-toolkit-v0.2.8) (2026-05-21)


### Features

* upgrade SDK agent toolkit and fix release process

## [0.2.7](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.6...maps-sdk-plugin-agent-toolkit-v0.2.7) (2026-05-15)


### Features

* exploration search with area tags


### Bug Fixes

* agent toolkit place prompt fixes and clearing unnecessary modules

## [0.2.6](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.5...maps-sdk-plugin-agent-toolkit-v0.2.6) (2026-05-12)


### Features

* agent evaluation testing [LSI-285]


### Bug Fixes

* upgrade and fix deps

## [0.2.5](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.4...maps-sdk-plugin-agent-toolkit-v0.2.5) (2026-05-11)


### Features

* **agent-toolkit:** live traffic agent


### Bug Fixes

* **traffic-incident-details:** drop non-filterable iconCategory codes

## [0.2.4](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.3...maps-sdk-plugin-agent-toolkit-v0.2.4) (2026-04-30)


### Features

* add managePlaces tool and centralize places display state
* improve api reference types, adjust syntax for agent toolkit plugin, and improve agents.md


### Bug Fixes

* LSI-259 Fix tests that were failing because API changed response from 403 to 401

## [0.2.3](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.2...maps-sdk-plugin-agent-toolkit-v0.2.3) (2026-04-14)


### Bug Fixes

* update agent toolkit link in readme

## [0.2.2](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-agent-toolkit-v0.2.1...maps-sdk-plugin-agent-toolkit-v0.2.2) (2026-04-14)


### Bug Fixes

* rename map-agent plugin to agent-toolkit

## [0.2.1](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.2.0...maps-sdk-plugin-ai-agent-v0.2.1) (2026-04-10)


### Features

* new module events to react to config changes and shown features


### Bug Fixes

* ai plugin docs diagrams
* serialize dates as ISO strings for safe LLM parsing. Example transport cleanup

## [0.2.0](https://github.com/tomtom-international/maps-sdk-js/compare/maps-sdk-plugin-ai-agent-v0.1.0...maps-sdk-plugin-ai-agent-v0.2.0) (2026-04-09)


### Features

* Initial release! Explore the README and documentation for further information.
