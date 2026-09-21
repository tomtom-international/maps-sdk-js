# Agent Toolkit — State

The `ToolState` slices, common reads, the tagged geometries-id discriminator, custom slices, and entry mode.
See [base reference](../agent-toolkit.md) for setup and `MapAgentOptions`.

---

## `ToolState` slices

Live state, accessible from custom tools and from your app via `agent.state`:

| Slice | What it holds |
|---|---|
| `places` | Append-only history of place / geometry entries; per-entry lazy `PlacesModule` and `GeometriesModule` |
| `routing` | Append-only history of route entries; planning waypoint slots; route parameters; per-entry `RoutingModule` |
| `ranges` | Reachable range entries — origin(s), budgets, polygons, per-entry display modules |
| `customGeometries` | Derived polygon entries produced by `processData` (union, difference, h3-coverage, …); per-entry analyses + lazy `GeometriesModule` |
| `byod` | Customer-authored GeoJSON layer entries (URL fetch or inline) with per-entry lazy `CustomGeoJSONModule` and a runtime-inferred `BYODDataProfile`. Produced by `addByodSource` or programmatic `state.byod.addEntry(...)`. See [byod.md](./byod.md) |
| `baseMap` | Viewport, style, language, MapLibre map instance (`mapLibreMap`) |
| `trafficTiles` | Real-time traffic flow + incident tile-overlay visibility |
| `trafficAreaAnalytics` | Per-entry traffic-area-analytics history; per-entry visualisation config + lazy `TrafficAreaAnalyticsModule` |
| `trafficIncidents` | Fetched incident entries (history) + per-entry analyses, focused subsets, and the live monitor — produced/refreshed by `getTrafficIncidents` and `setTrafficIncidentsMonitor` |
| `mapPOIs` | POI category visibility and filters |

Common reads from app code:

```ts
agent.state.routing.currentRoutes;     // most recent Routes
agent.state.places.latestEntry;        // most recent places entry
agent.state.places.entries;            // full history
agent.state.byod.entries;              // BYOD layer entries
agent.state.byod.shownEntryIds;        // set of currently-rendered BYOD ids
agent.state.baseMap.mapLibreMap;       // raw maplibre-gl Map
```

---

## Tagged geometries-id discriminator

`recallState({ kind: 'geometries' })` and the data-tool `geometriesEntryIDs` input accept tagged ids that select polygons from any of four sources:

```ts
type GeometriesIdKind = 'place' | 'places' | 'ranges' | 'customGeometries';

// { kind: 'place', id: '<placeId>' }          → that one place's footprint
// { kind: 'places', id: '<placesEntryId>' }   → every footprint in a places entry
// { kind: 'ranges', id: '<rangesEntryId>' }   → every isochrone polygon in a ranges entry
// { kind: 'customGeometries', id: '<entryId>' } → a custom-geometries entry produced by processData
```

(The `customGeometries` literal was previously `custom` — renamed for consistency with the slice key.)

---

## Custom state slice

```ts
import type { StateSlice, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

class FleetState implements StateSlice {
    vehicles = new Map<string, VehiclePosition>();
    reset() { this.vehicles.clear(); }
}

interface MyState extends ToolState {
    fleet: FleetState;
}

createMapAgent<MyState>(map, {
    model,
    state: { fleet: new FleetState() },
});
```

`destroy()` calls `reset()` on every slice that implements `StateSlice` — both built-in and custom.

---

## Entry mode

Every entry-bearing slice supports `setEntryMode('single' | 'multiple')`.
The slice union `EntryModeSliceName` and runtime list `ENTRY_MODE_SLICE_NAMES` are exported
so custom UIs / tools can iterate every entry-mode-aware slice without hard-coding names:

```ts
import { ENTRY_MODE_SLICE_NAMES } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';

for (const slice of ENTRY_MODE_SLICE_NAMES) {
    console.log(slice, agent.state[slice].entryMode);
}
```

The model also surfaces mode changes through the `setEntryMode` tool (responds to *"only show one route at a time"*).
