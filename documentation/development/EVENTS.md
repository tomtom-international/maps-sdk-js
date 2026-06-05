# 🖱️ User-Event Subsystem (internals)

*How user interaction events (click, contextmenu, hover, long-hover) flow from MapLibre to a
module's handler — and why the design is the way it is.*

> [!NOTE]
> This is a **contributor-facing architecture doc**, not consumer documentation. For the public
> API see the `UserEventHandler` / `UserEvents.on` TypeDoc and the `user-events` skill doc. The
> knowledge here was hard to reconstruct from the code; this document is the canonical reference so
> it never has to be re-derived.

All paths below are under `map/src/shared/` unless noted. Code is cited by **file + symbol** (line
numbers drift; symbol names don't).

---

## 1. Mental model

A single click handler registration travels through four layers:

```
module.events.on('click', fn)          // public API — CombinedEvents → UserEvents
        │
        ▼
UserEvents.on(...)                       // wraps fn (typed mapping), registers with the proxy
        │
        ▼
EventsProxy.addEventHandler(...)         // one proxy per map; registry keyed by source id
        │
   (map.on('click'))                     // ONE MapLibre listener, set up once in the ctor
        │
        ▼
EventsProxy.onMapClick(...)              // queryRenderedFeatures over the shared interactive pool
        │                                //   → topmost hit decides the firing source
        ▼
handler.fn(topFeature, lngLat, allEventFeatures, sourceWithLayers)
```

The two ideas that make everything else fall into place:

1. **There is exactly one `EventsProxy` per `TomTomMap`** (`TomTomMap.ts` — `_eventsProxy`,
   constructed as `new EventsProxy(this.mapLibreMap, this._params?.events)`). Every module that wants
   events registers its source + layers with that one proxy. The proxy attaches a *single* set of
   MapLibre listeners (`map.on('click')`, `'mousemove'`, …) — not one per module, not one per layer.
2. **Per event, only ONE source's handlers fire** — the source of the topmost rendered feature at
   the pointer. This is enforced by `findHandlers` (see §3) and underpins the `allEventFeatures`
   scoping contract (§6).

---

## 2. Registration — module → proxy

### `module.events` = `CombinedEvents(UserEvents, ModuleEvents)`

`CombinedEvents` (`CombinedEvents.ts`) merges two event families behind one `.on()`:

- **`UserEvents`** — user interaction on rendered features (`click`, `contextmenu`, `hover`,
  `long-hover`). Backed by the `EventsProxy`.
- **`ModuleEvents`** — module lifecycle (`config-change`, `shown-features`). Pure in-module
  callback lists, nothing to do with MapLibre hit-testing.

A module exposes them via a `get events()` accessor, e.g. `TrafficIncidentOverlayModule`:

```ts
get events(): CombinedEvents<TrafficIncident, TrafficIncidentOverlayConfig, TrafficIncidentDetails> {
    return new CombinedEvents(
        new UserEvents<TrafficIncident>(
            this.tomtomMap._eventsProxy,                 // the one shared proxy
            this.sourcesWithLayers.incidents,            // this module's source + layers
            this.config?.events,
        ),
        new ModuleEvents(this.configChangeHandlers, this.shownFeaturesHandlers),
    );
}
```

### The typed `mapping` wrap

`UserEvents` carries an optional `mapping: (feature: MapGeoJSONFeature) => T` so each module hands
its caller a *typed* feature (e.g. `TrafficIncident`, `Place`) instead of the raw MapLibre feature.
`UserEvents.on` wraps the caller's handler so the mapping is applied to the first arg on every
dispatch:

```ts
const wrappedHandler: UserEventHandler<any> = (feature, ...rest) => handler(mapping(feature), ...rest);
this.eventProxy.addEventHandler(source, wrappedHandler, type, this.config);
```

> [!IMPORTANT]
> The mapping is applied to `topFeature` (arg 1) only. `allEventFeatures` (arg 3) is **not** mapped
> — its entries are the substituted `Feature`s (§6), not the module's typed shape.

A module with multiple sources passes an array of `SourceWithLayers`; `UserEvents.on` registers the
handler against each.

### The registry (`AbstractEventProxy`)

`addEventHandler` does two things:

1. **Pools the layers** — `ensureInteractiveLayerIDsAdded` appends the source's layer ids to the
   proxy-wide `interactiveLayerIDs: string[]`. This is the single pool that `queryRenderedFeatures`
   queries (§3).
2. **Indexes the handler by source id** — `handlers: Record<string, SourceEventHandlers>`, i.e.
   `handlers[sourceId][eventType] = SourceEventTypeHandler[]`:

```
handlers = {
    "places-0":   { click: [ { sourceWithLayers, layerIDs, fn, config } ] },
    "vectorTiles":{ click: [ … ], hover: [ … ] },
}
```

`addEventHandler` **pushes** onto the per-`(source, type)` array and `findHandlers` returns **all** of
them, so registering more than one handler for the same `(source, type)` makes them **all fire** —
`on` does **not** replace. `on` returns an unsubscribe for *that* handler (`removeHandler` by fn);
`off(type)` removes them all. (The public `UserEvents.on` JSDoc still says "calling `on()` again
replaces the previous handler" — that's inaccurate; verified by manual test. The
`// TODO: add support for multiple handlers …` in `AbstractEventProxy.ts` is about formalizing this
already-working behavior.)

---

## 3. Dispatch — MapLibre → handler

### One listener set, installed once

`EventsProxy.listenToEvents` (called from the ctor) wires the whole subsystem to MapLibre with a
fixed handful of listeners:

```ts
this.map.on('mousemove', (ev) => this.onMouseMove(ev));
this.map.on('movestart', () => this.onMouseStart());
this.map.on('mouseout', () => this.onMouseOut());
this.map.on('mouseover', (ev) => this.onMouseMove(ev));
this.map.on('mousedown', () => this.onMouseDown());
this.map.on('mouseup', () => this.onMouseUp());
this.map.on('click', (ev) => this.onMapClick('click', ev));
this.map.on('contextmenu', (ev) => this.onMapClick('contextmenu', ev));
```

### One query over the shared pool

`getRenderedFeatures(point)` runs `queryRenderedFeatures` against `interactiveLayerIDs` — the pool
**every** interactive module contributed to. The result is top-first, spans all modules, and
contains per-layer / per-tile duplicates.

```ts
const options = { layers: this.interactiveLayerIDs, validate: false };
// precisionMode 'point' / 'point-then-box' tries the exact pixel first;
// 'box' (and the point-then-box fallback) queries a small padded bounding box:
return this.map.queryRenderedFeatures(this.toPaddedBounds(point), options);
```

Two precision details worth knowing:

- **`queryRenderedFeatures` is pixel-based**, not geographic. The proxy always has a pixel
  (`ev.point`, or the retained `hoveringPoint`). A handler only receives `lngLat`, so consumers that
  want to re-query must `map.project(lngLat)` first (§6, escape hatch).
- **`paddingBoxPx`** (default 5) widens the hit-test to a small box so near-misses still register;
  `precisionMode` (`'box'` default) picks point-vs-box behaviour.

### The topmost hit decides the firing source

`onMapClick` takes `clickedFeatures[0]` (the topmost) as `lastClickedFeature`, then asks
`findHandlers` for handlers registered against **that feature's source + layer**:

```ts
const clickedFeatures = this.getRenderedFeatures(ev.point);
this.lastClickedFeature = clickedFeatures[0];
const clickHandlers = this.findHandlers([clickType], this.lastClickedFeature?.source, this.lastClickedFeature?.layer.id);
```

### `findHandlers` is single-source — the key invariant

```ts
protected findHandlers = (types, sourceId, layerId): SourceEventTypeHandler[] =>
    (sourceId && layerId &&
        types.flatMap((type) => {
            const sourceEventTypeHandlers = this.handlers[sourceId]?.[type];
            return sourceEventTypeHandlers?.length === 1
                ? sourceEventTypeHandlers                                         // 1 handler → skip layer match
                : this.handlers[sourceId]?.[type]?.filter((h) => h.layerIDs.includes(layerId)) || [];
        })) || [];
```

**Every return path indexes `this.handlers[sourceId]`.** So whatever fires, every dispatched
handler belongs to that one source. Since each module creates its own source
(`sourceWithLayersFor`'s "at most one `SourceWithLayers` per source id" assumption), **one source =
one module**. This is *the* fact Problem-B scoping relies on.

---

## 4. Hover state machine

Hover is richer than click because it must distinguish *entering* a feature, *moving along* it, and
*resting* on it (long-hover).

- **`detectHoverState`** (`eventUtils.ts`) compares the current hit against the retained
  `hoveringFeature`/`hoveringPoint` and returns `{ hoverChanged?, mouseInMotionOverHoveredFeature? }`.
  `hoverChanged` covers no-hover↔hover and feature→feature transitions (compared by id, then
  `properties.id`, then `source`, then `layer.id` — the last catches id-less base-map features
  across layer groups). `mouseInMotionOverHoveredFeature` means same feature, moved pixel.
- **`hover`** fires on `hoverChanged`; **`hover-move`** fires on motion over the same feature;
  **`long-hover`** fires from a `setTimeout` (`handleLongHoverTimeout`) after the cursor rests.
- **Two delays** (`MapEventsConfig`): `longHoverDelayAfterMapMoveMS` (default 800) for the first
  hover after the map settles, `longHoverDelayOnStillMapMS` (default 300) for subsequent hovers on a
  quiet map. `firstDelayedHoverSinceMapMove` toggles between them.
- **Cursor** is managed here too (`updateHoverCursor`): `cursorOnHover` over a feature,
  `cursorOnMap` otherwise, `cursorOnMouseDown` while dragging.

> [!NOTE]
> **Long-hover has no DOM event** — it is fired from a timer, so only `hoveringLngLat` /
> `hoveringPoint` are available, not a `MapMouseEvent`. This is why the deferred event-context
> redesign models `originalEvent` as optional.

---

## 5. `eventState` & data-driven styling

Selection/hover highlight is **not** done with separate layers or `setPaintProperty`. Instead the
proxy writes an `eventState` marker into the feature's `properties` inside the cached
`shownFeatures`, and layer paint expressions react to it.

- **`updateEventState`** (`eventUtils.ts`) mutates `properties.eventState` on the matched feature in
  a copy of `shownFeatures.features`, then calls `sourceWithLayers.show(...)` with
  `automaticVisibility: false`. It also clears the marker off the previously-marked feature (in the
  same or a different source).
- **`putEventState`** does the actual splice, and enforces **event priority**: a high-priority
  marker (`click`/`contextmenu`) is not overwritten by a low-priority one (`hover`/`long-hover`).
  `isHighPriority` defines the precedence.
- **Layers react via expressions** on `eventState`, e.g. `eventState.ts`:

```ts
export const isClickEventState: ExpressionSpecification = ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]];
```

**Why props, not layers:** toggling a highlight is then a single `source.setData(...)` with zero
`addLayer`/`removeLayer` churn — cheaper, and it survives style changes via the same restore path as
the data itself.

> [!IMPORTANT]
> `eventState` styling only works for **GeoJSON-backed** sources — they own a `shownFeatures` cache
> the proxy can mutate. Vector-tile sources have no such cache; `updateEventState` no-ops for them
> (it guards on `sourceWithLayers instanceof GeoJSONSourceWithLayers`).

---

## 6. Feature substitution & the `allEventFeatures` contract

### `toCallerFeature` — GeoJSON substitution vs vector-tile passthrough

```ts
private toCallerFeature(rendered: MapGeoJSONFeature): Feature {
    const swl = this.sourceWithLayersFor(rendered.source);
    return swl instanceof GeoJSONSourceWithLayers
        ? (swl.findById(renderedRefId(rendered))?.feature ?? rendered)   // cached typed original
        : rendered;                                                       // vector tile → raw passthrough
}
```

For GeoJSON modules the proxy swaps the MapLibre-rendered feature for the **original typed object**
the caller passed to `show()` — recovered by id via `findById(renderedRefId(...))`. That original has
real Dates, nested objects and arrays (MapLibre would have flattened them to JSON strings on render).
If the lookup **misses**, it falls back to the raw `MapGeoJSONFeature` (still a valid `Feature`, but
with those stringified props).

> [!IMPORTANT]
> **Id recovery & clustering.** `renderedRefId` reads `properties.id` **first**, then the top-level
> `id`. Normally they're equal (`promoteId: 'id'` mirrors `properties.id` up). But clustered sources
> (`PlacesModule` `pin-clustered`) disable `promoteId`, and MapLibre's supercluster then assigns its
> own *synthetic* numeric top-level `id` to rendered features — so the top-level `id` is **not** the
> real id there; `properties.id` is. Reading `properties.id` first keeps substitution (and the
> `eventState` cache lookup in `updateEventState`) resolving to the cached original for clustered
> features. Preferring the top-level `id` would miss → hand back the raw stringified feature.

> [!IMPORTANT]
> **Consequence:** the substituted GeoJSON original has **no `.source` / `.layer`**. Those MapLibre
> wrapper fields exist only on the *raw* `MapGeoJSONFeature`, before substitution. This is exactly
> why scoping and de-duplication (below) operate on the **raw** features.

### `toCallerFeatures` — scope + dedupe, then substitute

```ts
private toCallerFeatures(rendered: MapGeoJSONFeature[], firingSource: string | undefined): Feature[] {
    return dedupeRenderedFeatures(scopeToSource(rendered, firingSource)).map((f) => this.toCallerFeature(f));
}
```

Each dispatch site passes the firing source — the same value it gives `findHandlers`
(`lastClickedFeature?.source` for click, `hoveringFeature?.source` / `hoveredTopFeature?.source` for
the hover paths).

- **`scopeToSource(rendered, firingSource)`** — keep only entries whose `.source` is the firing
  source. Per §3 every dispatched handler belongs to that one source, so this is the *correct* set,
  not an arbitrary trim. The topmost hit is always from the firing source, so it survives and stays
  first ⇒ the proxy dispatches it as `topFeature`. (Per §2 the per-module `mapping` is applied to
  `topFeature` only, so for a mapper module `topFeature` is the mapped object while
  `allEventFeatures[0]` is its raw counterpart — the same feature, not the same object.)
- **`dedupeRenderedFeatures(...)`** — collapse `(feature × layer)` and `(feature × tile)` duplicates,
  keyed on `(source, renderedRefId)`, keeping the topmost occurrence. Id-less features (base-map
  fills) can't be keyed and are all kept.

### The contract handed to handlers

```ts
type UserEventHandler<T> = (
    topFeature: T,
    lngLat: LngLat,
    allEventFeatures: Feature[],   // THIS module's features at the point, de-duplicated; [0] is topFeature (its raw form for mapper modules — §2)
    sourceWithLayers: SourceWithLayers,
) => void;
```

`allEventFeatures` is **scoped to the firing module and de-duplicated.** To inspect *every* feature
at the point across all modules (base map included, with `.source`/`.layer` intact), query MapLibre
directly — projecting the geographic `lngLat` to a pixel first:

```ts
const p = map.mapLibreMap.project(lngLat);
const all = map.mapLibreMap.queryRenderedFeatures([[p.x - 5, p.y + 5], [p.x + 5, p.y - 5]]);
```

> [!NOTE]
> `queryRenderedFeatures(lngLat)` does **not** error — a `LngLat` is read as the *options* arg, so it
> silently queries the whole viewport. Always `project()` to a pixel first.

---

## 7. MapLibre integration notes

- **Hit-testing == paint filtering.** A layer's `filter` expression gates both what is painted and
  what `queryRenderedFeatures` returns. Hidden / filtered-out features don't fire events.
- **Collision-culled symbols are unqueryable.** When MapLibre culls an overlapping symbol, it is
  also invisible to `queryRenderedFeatures` — hover/click can't reach it. To surface stacked features
  at one point, query the source data you passed to `show()`, not the render result. (See
  `TrafficIncidentOverlayModule`'s "Overlapping incidents" note.)
- **Pixels vs geographic.** Internally everything is pixels (`Point2D`); the public surface speaks
  `LngLat`. `project`/`unproject` bridge them.

---

## 8. Style-change resilience

`setStyle` tears down and rebuilds layers, invalidating every `SourceWithLayers` reference the proxy
holds. `updateIfRegistered` re-points the registry's stale references to the freshly-built ones
(matched by `equalSourceAndLayerIDs`), so handlers keep working across a style swap without
re-registration. Modules call it from their style-change restore path.

---

## 9. Performance

Per event the JS cost is, in rough order: the native `queryRenderedFeatures`; then — for
GeoJSON-backed sources — `updateEventState` → `show()` → `setData(wholeCollection)`, where MapLibre
re-ingests the whole collection (O(m) in the cache size `m`, on every click and hover-enter); then
`toCallerFeatures`. The `setData` re-ingest is the dominant per-event term for large layers and
dwarfs the JS below it.

- **`scopeToSource` + `dedupeRenderedFeatures` are cheap** — O(n) over the raw hit count `n`, flat in
  `m`. `n` is bounded by what renders in the hit-test box, not by `m`. They also shrink the list
  before substitution.
- **Substitution is the O(n·m) part.** `toCallerFeature` → `findById` is a linear scan of
  `shownFeatures` (O(m)), run once per deduped hit (`n` of them) → O(n·m) per event. This
  rendered→original mapping is **new in this subsystem** — it replaced a pass that handed handlers the
  raw `queryRenderedFeatures` output after a `JSON.parse`-every-property `deserializeFeatures` step —
  so its cost is net-new. In absolute terms it is small (sub-millisecond of JS) and cheaper than the
  old deserialize pass in every realistic case **except one corner**: a source showing ~10k+ features
  *and* ~10 of them overlapping at the cursor, where the `n` linear scans (~0.3 ms) edge past the old
  pass. Even there it is sub-frame and is itself dwarfed by the `setData` re-ingest above.
- **`allEventFeatures` is built only when a handler reads it.** Every dispatch path (click,
  contextmenu, hover, hover-move, long-hover) skips `toCallerFeatures` unless a handler for *that*
  type is registered; cursor and `eventState` highlight are still applied. This matters most on the
  two highest-frequency / least-guarded paths: `hover-move` (fires on every mousemove over a feature,
  yet a `hover-move` handler is almost never registered) and `click` (`onMapClick` runs on every map
  click with no source pre-filter, so clicks on empty map or on a module without a click handler cost
  nothing). A click-only module — the common case — does no substitution on hover at all.

An `id → position` index for O(1) `findById` (dropping the `n` multiplier) was prototyped and
**deferred** — not because it doesn't help, but because it would need a `preservesPositions` flag on
`show()` to survive the per-event `eventState` re-`show()`s, and that flag is a workaround for the very
thing the proper fix removes. The structural fix for large layers is to move `eventState` highlighting
off `show()`/`setData` onto MapLibre `setFeatureState` (per-feature state, no re-ingest): that deletes
the dominant O(m) `setData` term, and once `show()` is no longer called per event an index can be added
that simply invalidates on every `show()` — no flag. So the index belongs with that rework, not ahead
of it. **Until then, a very large + densely-overlapping GeoJSON layer pays the O(n·m) substitution
scan on hover** (sub-frame, but the one place this design is slower than the old per-property
deserialize). Tracked as future work.

---

## 10. Design decisions & rationale

| Decision | Where | Why |
|----------|-------|-----|
| **Centralized proxy, not per-layer listeners** | `EventsProxy` class doc | One query/event lets the proxy arbitrate z-order and run a unified hover state machine across overlapping modules — impossible with independent `map.on(layerId, …)` listeners. |
| **Single shared interactive-layer pool, one query per event** | `AbstractEventProxy.interactiveLayerIDs` + `getRenderedFeatures` | Topmost-across-all-modules is decided in one hit-test; no per-module query coordination. |
| **Registry keyed by source id; single-source dispatch** | `AbstractEventProxy.handlers` + `findHandlers` | One source = one module ⇒ a clean "firing module" definition. Underpins Problem-B scoping. |
| **`eventState` marker in props → data-driven paint** | `eventUtils.ts` + `eventState.ts` | Highlight toggles via `setData`, zero layer churn, survives style changes. |
| **Event priority: click/contextmenu > hover** | `isHighPriority` (`eventUtils.ts`) | A click selection must not be clobbered by an incidental hover. |
| **GeoJSON substitution vs vector-tile passthrough** | `toCallerFeatures` | Hands back typed originals (real Dates/objects) for GeoJSON modules; raw passthrough where there's no cache — at the cost of `.source`/`.layer` on GeoJSON entries. |
| **`allEventFeatures` scoped + de-duplicated** | `toCallerFeatures` + `scopeToSource`/`dedupeRenderedFeatures` | Makes arg 3 coherent with args 1 & 4 (already module-scoped) and removes per-layer/tile noise. Cross-module inspection moves to the explicit `queryRenderedFeatures` escape hatch. |
| **`topFeature` dispatched as `allEventFeatures[0]`** | `toCallerFeatures` + dispatch sites | The dispatched top hit is the array's first entry (before the per-module `mapping`, §2); also more correct under rare hover skew where the retained top feature could otherwise come from a different source. |
| **Typed `mapping` callback per module** | `UserEvents` ctor + `on` | Callers get `Place` / `TrafficIncident`, not raw `MapGeoJSONFeature`. |
| **`CombinedEvents` = user interaction + module lifecycle** | `CombinedEvents` / `ModuleEvents` | One `module.events.on(...)` for both families. |
| **Style-change refresh** | `updateIfRegistered` | Handlers survive `setStyle` without re-registration. |

### Deferred (planned, not implemented)

An **event-context signature** `(feature, context)` — collapsing the positional tail into one object
that also carries the exact `point` and (when present) `originalEvent` for modifier keys. Tracked
separately; long-hover's lack of a DOM event is why `originalEvent` would be optional.

---

## 11. Invariants & gotchas

- **`allEventFeatures[0]` is `topFeature`** — the topmost firing-source hit always survives scope +
  dedupe and stays first. For a module with a `mapping` (§2), `topFeature` is the mapped form of
  `allEventFeatures[0]` — the same feature, not the same object.
- **One `SourceWithLayers` per source id** — `sourceWithLayersFor` returns the first handler bucket's
  reference; overlapping sources are unsupported.
- **Multiple handlers per `(source, type)` all fire** — `on` appends (it does **not** replace) and
  returns a per-handler unsubscribe; `off(type)` removes them all; to "replace", `off()` then `on()`.
  (The public `UserEvents.on` JSDoc's "replaces" wording is inaccurate.)
- **Hidden / culled features don't fire** — events gate on render+query; collision-culled symbols are
  invisible to hit-testing.
- **`eventState` is GeoJSON-only** — vector-tile sources have no `shownFeatures` cache to mark.
- **Long-hover has no event object** — fired from a timer.
