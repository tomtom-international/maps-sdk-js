/**
 * @module agent-toolkit-state
 */

import type { CommonPlaceProps, Place, Places, PolygonFeature } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    type GeometryTheme,
    type PlaceConnectionDisplay,
    PlacesModule,
    type TomTomMap,
    themedGeometryConfig,
} from '@tomtom-org/maps-sdk/map';
import { geometryData } from '@tomtom-org/maps-sdk/services';
import type { StateSlice } from '../../types';
import { StateEvents } from '../events';
import type { EntryMode } from '../state';
import type { PlacesAnalysis } from './analysis';
import type { PlacesEntry } from './entry';

// Geometry Data service accepts up to 20 ids per request; we intentionally cap our batches
// at 5 to keep individual requests small (lower per-call latency, easier to fan out in
// parallel without hitting rate limits). Any larger input set is split into multiple chunks.
const GEOMETRY_DATA_BATCH_SIZE = 5;

/** How an entry is rendered on the map: as individual pins, base-map POIs, or clustered pins. */
export type PlacesMarkerType = 'pin' | 'base-map' | 'pin-clustered';

/**
 * Events fired by {@link PlacesState}. Subscribe via `state.places.events.on(type, handler)`.
 *
 * @group Agent Toolkit
 */
export type PlacesStateEvents = {
    /** History changed — entry added, replaced, or cleared via `reset()`. Payload: the full entries snapshot. */
    'entries-change': readonly PlacesEntry[];
    /** Set of entries currently rendered on the map changed (or marker type swapped). */
    'shown-change': ReadonlySet<string>;
    /** A new analysis was attached to (or replaced on) an entry. */
    'analysis-added': { entryId: string; analysis: PlacesAnalysis };
    /** Boundary polygons were fetched and cached on an entry. */
    'geometries-change': { entryId: string; count: number };
    /** Display policy switched between `single` and `multiple`. */
    'mode-change': EntryMode;
};

// Maps the public `PlacesMarkerType` to the property name on `entry._modules`
// where the corresponding PlacesModule lives. Centralised so the public string
// values can include hyphens (`pin-clustered`) while the internal slot uses
// camelCase (`pinClustered`).
const markerTypeSlot = (markerType: PlacesMarkerType): 'pin' | 'baseMap' | 'pinClustered' => {
    switch (markerType) {
        case 'pin':
            return 'pin';
        case 'base-map':
            return 'baseMap';
        case 'pin-clustered':
            return 'pinClustered';
    }
};

// Dedupe features by their string `id`. Features without a string id are kept as-is.
const dedupeById = (features: PolygonFeature<CommonPlaceProps>[]): PolygonFeature<CommonPlaceProps>[] => {
    const seen = new Set<string>();
    const out: PolygonFeature<CommonPlaceProps>[] = [];
    for (const feature of features) {
        const featureId = typeof feature.id === 'string' ? feature.id : undefined;
        if (featureId) {
            if (seen.has(featureId)) continue;
            seen.add(featureId);
        }
        out.push(feature);
    }
    return out;
};

// Replace the module's currently-rendered FeatureCollection with `features`. An empty list
// clears the layer.
const renderReplace = async (module: GeometriesModule, features: PolygonFeature<CommonPlaceProps>[]): Promise<void> => {
    if (features.length === 0) {
        await module.clear();
        return;
    }
    await module.show({ type: 'FeatureCollection', features });
};

// Merge `features` with whatever the module is currently rendering, deduped by feature id.
// Empty input is a no-op (leaves whatever is on the layer in place).
const renderMerged = async (module: GeometriesModule, features: PolygonFeature<CommonPlaceProps>[]): Promise<void> => {
    if (features.length === 0) return;
    const current = (module.getShown().geometry.features ?? []) as PolygonFeature<CommonPlaceProps>[];
    const merged = dedupeById([...current, ...features]);
    await module.show({ type: 'FeatureCollection', features: merged });
};

/**
 * State for the places layer: an append-only history of place results plus per-entry display
 * modules.
 *
 * Each entry owns its own PlacesModule (per marker theme: pin / base-map / pin-clustered) and
 * a dedicated GeometriesModule, lazy-initialised on first show. The slice no longer holds
 * shared modules — display state lives on the entry, so two entries can be rendered side by
 * side under different themes without sharing a single source.
 *
 * @group Agent Toolkit
 */
export class PlacesState implements StateSlice {
    private _entries: PlacesEntry[] = [];
    private _entryMode: EntryMode = 'multiple';

    /** Subscribe to state changes — see {@link PlacesStateEvents}. */
    readonly events = new StateEvents<PlacesStateEvents>();

    constructor(private readonly _ttMap: TomTomMap) {}

    /**
     * Display policy: `multiple` (default) keeps every history entry available to render
     * simultaneously; `single` enforces "at most one entry on the map at a time" and trims
     * the history down to the latest entry whenever it's set.
     */
    get entryMode(): EntryMode {
        return this._entryMode;
    }

    /**
     * Switch the display policy. When moving from `multiple` → `single` we hide every entry
     * older than the latest, drop them from history, and emit `entries-change` so listeners
     * (the recents rail, recall tools, …) re-render. No-op when the mode hasn't changed.
     */
    async setEntryMode(mode: EntryMode): Promise<void> {
        if (this._entryMode === mode) return;
        this._entryMode = mode;
        if (mode === 'single' && this._entries.length > 1) {
            const latest = this._entries.at(-1);
            const dropped = this._entries.slice(0, -1);
            for (const entry of dropped) await this._hideEntry(entry);
            this._entries = latest ? [latest] : [];
            this.events.emit('entries-change', this._entries);
            this.events.emit('shown-change', this.shownEntryIds);
        }
        this.events.emit('mode-change', mode);
    }

    /**
     * Lazy-init and return the entry's PlacesModule for the given marker theme. Each entry
     * keeps a separate module per theme so flipping themes for one entry doesn't disturb
     * another. Throws when the entry id is unknown.
     */
    async getEntryPlacesModule(entryId: string, markerType: PlacesMarkerType): Promise<PlacesModule> {
        const entry = this._requireEntry(entryId);
        entry._modules ??= {};
        const slot = markerTypeSlot(markerType);
        let module = entry._modules[slot];
        if (!module) {
            module = await PlacesModule.get(this._ttMap, { theme: markerType });
            entry._modules[slot] = module;
        }
        return module;
    }

    /**
     * Lazy-init and return the entry's place-geometries module (for POI footprints, municipality
     * outlines). Re-applies themed config when the theme changes. Throws on unknown entry id.
     */
    async getEntryGeometriesModule(entryId: string, theme: GeometryTheme = 'outline'): Promise<GeometriesModule> {
        const entry = this._requireEntry(entryId);
        entry._modules ??= {};
        // Module-level `theme` flows into `prepareGeometryForDisplay` and is used as the
        // effective theme for every feature that doesn't carry its own `properties.theme`.
        const config = { ...themedGeometryConfig(), theme };
        if (!entry._modules.geometries) {
            entry._modules.geometries = await GeometriesModule.get(this._ttMap, config);
        } else {
            entry._modules.geometries.applyConfig(config);
        }
        return entry._modules.geometries;
    }

    private _requireEntry(entryId: string): PlacesEntry {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) throw new Error(`PlacesState: unknown entry "${entryId}"`);
        return entry;
    }

    get entries(): readonly PlacesEntry[] {
        return this._entries;
    }

    /**
     * This is used purely to pass data between tools in a context-dependent way,
     * so we assume the most recent entry is the relevant one to show on the map.
     */
    get latestPlace(): Place[] | undefined {
        return this._entries.at(-1)?.places;
    }

    addPlaceResult(
        place: Place | Places,
        label: string,
        explicitId?: string,
        connections?: PlaceConnectionDisplay[],
        geometries?: PolygonFeature<CommonPlaceProps>[],
    ): string {
        // Under `single` mode the new entry replaces everything older. Hide
        // those entries' modules synchronously where we can — the await is
        // done lazily inside `_hideEntry` (it returns a promise we can't
        // await here without making the whole API async). Listeners only see
        // the new entry in `entries-change`.
        if (this._entryMode === 'single' && this._entries.length > 0) {
            for (const entry of this._entries) void this._hideEntry(entry);
            this._entries = [];
        }
        const fallback = `places-${this._entries.length}`;
        const entryId = explicitId ? this._uniqueEntryId(explicitId) : fallback;
        this._entries.push({
            id: entryId,
            timestamp: Date.now(),
            label,
            places: 'features' in place ? place.features : [place],
            ...(connections?.length && { connections }),
            ...(geometries?.length && { geometries }),
        });
        this.events.emit('entries-change', this._entries);
        // Surface geometries via the same `geometries-change` event consumers
        // already use for `fetchGeometriesForEntry`, so a place panel that
        // listens once picks them up regardless of which writer added them.
        if (geometries?.length) {
            this.events.emit('geometries-change', { entryId, count: geometries.length });
        }
        return entryId;
    }

    // Returns `requested` unchanged when free, otherwise appends `-2`, `-3`, ... until a free id
    // is found. Lets the LLM hand us a semantic id without worrying about collisions across calls.
    private _uniqueEntryId(requested: string): string {
        const taken = new Set(this._entries.map((entry) => entry.id));
        if (!taken.has(requested)) return requested;
        for (let i = 2; ; i++) {
            const candidate = `${requested}-${i}`;
            if (!taken.has(candidate)) return candidate;
        }
    }

    /**
     * Attach an analysis result to an existing entry. Analysis names are unique
     * within a single entry — adding one with an existing name replaces it.
     * Returns true on success, false if the entry doesn't exist.
     */
    addAnalysisToEntry(entryId: string, analysis: PlacesAnalysis): boolean {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return false;
        entry._analysis ??= [];
        const existingIdx = entry._analysis.findIndex((a) => a.name === analysis.name);
        if (existingIdx >= 0) {
            entry._analysis[existingIdx] = analysis;
        } else {
            entry._analysis.push(analysis);
        }
        this.events.emit('analysis-added', { entryId, analysis });
        // Entries-change tracks the entry array reference *and* its observable contents — analyses
        // mutate an entry's `_analysis` field, so re-emit so consumers re-render.
        this.events.emit('entries-change', this._entries);
        return true;
    }

    // Scans entries (newest first) for a Place by its feature id. Each entry
    // lazily caches an id → Place record on first miss so repeated lookups stay
    // O(1) per entry. Safe because entry.places is effectively immutable after
    // addPlaceResult — no mutation path invalidates the index.
    findPlaceById(placeId: string): { place: Place; entryId: string } | undefined {
        for (let i = this._entries.length - 1; i >= 0; i--) {
            const entry = this._entries[i];
            if (!entry._byId) {
                entry._byId = {};
                for (const place of entry.places) entry._byId[place.id] = place;
            }
            const place = entry._byId[placeId];
            if (place) return { place, entryId: entry.id };
        }
        return undefined;
    }

    /**
     * Returns the cached boundary polygon for a place id, or undefined if no geometry has been
     * fetched for it yet. Builds a lazy place-id → feature index per entry on first lookup.
     */
    getGeometryForPlace(placeId: string): PolygonFeature<CommonPlaceProps> | undefined {
        for (let i = this._entries.length - 1; i >= 0; i--) {
            const entry = this._entries[i];
            if (!entry.geometries?.length) continue;
            if (!entry._geometryByPlaceId) entry._geometryByPlaceId = this._buildGeometryIndex(entry);
            const geometry = entry._geometryByPlaceId[placeId];
            if (geometry) return geometry;
        }
        return undefined;
    }

    /**
     * Fetches the boundary polygon for a place from the Geometry Data service and stores it on
     * the owning entry. Returns the cached feature if already fetched, or undefined if the place
     * is unknown or has no geometry data source.
     */
    async fetchPlaceGeometry(placeId: string): Promise<PolygonFeature<CommonPlaceProps> | undefined> {
        const cached = this.getGeometryForPlace(placeId);
        if (cached) return cached;

        const lookup = this.findPlaceById(placeId);
        if (!lookup) return undefined;
        const geometryDataSourceId = lookup.place.properties.dataSources?.geometry?.id;
        if (!geometryDataSourceId) return undefined;

        const result = await geometryData({ geometries: [lookup.place] });
        const feature = result.features[0];
        if (!feature) return undefined;

        const entry = this._entries.find((e) => e.id === lookup.entryId);
        if (entry) {
            entry.geometries ??= [];
            entry.geometries.push(feature);
            entry._geometryByPlaceId ??= {};
            entry._geometryByPlaceId[placeId] = feature;
            this.events.emit('geometries-change', { entryId: entry.id, count: entry.geometries.length });
        }
        return feature;
    }

    /**
     * Batch-fetches boundary polygons for every place in an entry that has a geometry data source
     * but is not yet cached. Issues one Geometry Data request per chunk of {@link GEOMETRY_DATA_BATCH_SIZE}
     * place ids (the API caps each request) and stores the merged result on `entry.geometries`.
     * Returns the full geometries list for the entry, or an empty array if the entry is unknown.
     */
    async fetchGeometriesForEntry(entryId: string): Promise<PolygonFeature<CommonPlaceProps>[]> {
        const entry = this._entries.find((e) => e.id === entryId);
        if (!entry) return [];

        const alreadyFetched = new Set<string>();
        for (const feature of entry.geometries ?? []) {
            if (typeof feature.id === 'string') alreadyFetched.add(feature.id);
        }

        // Dedupe by geometry-data-source id so a place repeated in the entry (or sharing a footprint)
        // contributes one request, not several.
        const placesNeedingFetch: Place[] = [];
        const queuedGeometryIds = new Set<string>();
        for (const place of entry.places) {
            const geometryDataSourceId = place.properties.dataSources?.geometry?.id;
            if (!geometryDataSourceId) continue;
            if (alreadyFetched.has(geometryDataSourceId)) continue;
            if (queuedGeometryIds.has(geometryDataSourceId)) continue;
            queuedGeometryIds.add(geometryDataSourceId);
            placesNeedingFetch.push(place);
        }

        if (placesNeedingFetch.length === 0) return entry.geometries ?? [];

        const batches: Place[][] = [];
        for (let i = 0; i < placesNeedingFetch.length; i += GEOMETRY_DATA_BATCH_SIZE) {
            batches.push(placesNeedingFetch.slice(i, i + GEOMETRY_DATA_BATCH_SIZE));
        }
        const results = await Promise.all(batches.map((batch) => geometryData({ geometries: batch })));

        const merged: PolygonFeature<CommonPlaceProps>[] = [...(entry.geometries ?? [])];
        for (const result of results) merged.push(...result.features);

        entry.geometries = merged;
        // Invalidate the lazy place-id index so the next lookup rebuilds it from the fuller list.
        entry._geometryByPlaceId = undefined;
        this.events.emit('geometries-change', { entryId: entry.id, count: merged.length });
        return merged;
    }

    /**
     * Render the given polygons via the entry's GeometriesModule. The `mode` flag is
     * scoped to **this entry's layer only** — it does not touch other entries (use
     * the slice's per-entry hide/show methods for cross-entry visibility).
     *
     * - `mode: 'replace'` (default) — calls `module.show` with exactly these features, replacing
     *   whatever was previously on this entry's layer. An empty array clears the layer.
     * - `mode: 'add'` — merges the new features with the polygons currently shown on this
     *   entry's layer (deduped by `feature.id`) and re-renders the union. An empty array is a
     *   no-op.
     *
     * `entryId` defaults to the latest entry that owns geometries — handy when callers only ever
     * render the most-recently produced footprints. Pass an explicit id to target an older one.
     */
    async showPlaceGeometries(
        features: PolygonFeature<CommonPlaceProps>[],
        theme: GeometryTheme = 'outline',
        mode: 'add' | 'replace' = 'replace',
        entryId?: string,
    ): Promise<void> {
        const targetId = entryId ?? this._latestGeometriesEntryId();
        if (!targetId) return;
        const module = await this.getEntryGeometriesModule(targetId, theme);
        if (mode === 'add') {
            await renderMerged(module, features);
        } else {
            await renderReplace(module, features);
        }
    }

    // Walks entries newest-first looking for the most recent one that has any
    // boundary polygons attached — that's the natural default for callers that
    // didn't pin a specific entry id (e.g. the legacy showPlaceGeometries surface).
    private _latestGeometriesEntryId(): string | undefined {
        for (let i = this._entries.length - 1; i >= 0; i--) {
            if (this._entries[i].geometries?.length) return this._entries[i].id;
        }
        return this._entries.at(-1)?.id;
    }

    // Each entry's geometries are stored as an array (mirroring the geometryData response shape);
    // build an O(1) place-id → feature lookup on first read.
    private _buildGeometryIndex(entry: PlacesEntry): Record<string, PolygonFeature<CommonPlaceProps>> {
        const byGeometryId = new Map<string, PolygonFeature<CommonPlaceProps>>();
        for (const feature of entry.geometries ?? []) {
            if (typeof feature.id === 'string') byGeometryId.set(feature.id, feature);
        }
        const index: Record<string, PolygonFeature<CommonPlaceProps>> = {};
        for (const place of entry.places) {
            const geometryId = place.properties.dataSources?.geometry?.id;
            if (!geometryId) continue;
            const feature = byGeometryId.get(geometryId);
            if (feature) index[place.id] = feature;
        }
        return index;
    }

    /** IDs of all entries currently shown on the map. */
    get shownEntryIds(): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) {
            if (entry._shownAs) out.add(entry.id);
        }
        return out;
    }

    /** IDs of entries currently shown as individual pins. */
    get shownAsPinIds(): ReadonlySet<string> {
        return this._idsShownAs('pin');
    }

    /** IDs of entries currently shown as base-map POIs. */
    get shownAsBaseMapIds(): ReadonlySet<string> {
        return this._idsShownAs('base-map');
    }

    /** IDs of entries currently shown as clustered pins. */
    get shownAsPinClusteredIds(): ReadonlySet<string> {
        return this._idsShownAs('pin-clustered');
    }

    private _idsShownAs(markerType: PlacesMarkerType): ReadonlySet<string> {
        const out = new Set<string>();
        for (const entry of this._entries) {
            if (entry._shownAs === markerType) out.add(entry.id);
        }
        return out;
    }

    /** Marker type for a specific entry, or undefined if it is not shown. */
    getShownMarkerType(id: string): PlacesMarkerType | undefined {
        return this._entries.find((entry) => entry.id === id)?._shownAs;
    }

    /** Return the union of all features belonging to currently-shown entries. */
    getShownFeatures(): Place[] {
        const out: Place[] = [];
        for (const entry of this._entries) {
            if (entry._shownAs) out.push(...entry.places);
        }
        return out;
    }

    /**
     * Replace the shown set for `markerType` with exactly these ids and re-render.
     * Entries currently shown as `markerType` but absent from `ids` are hidden;
     * entries in `ids` are switched to `markerType` (lazy-creating their module).
     */
    async setShownEntries(ids: readonly string[], markerType: PlacesMarkerType): Promise<Place[]> {
        const idSet = new Set(ids);
        const targets: PlacesEntry[] = [];
        const toHide: PlacesEntry[] = [];
        for (const entry of this._entries) {
            if (idSet.has(entry.id)) {
                targets.push(entry);
            } else if (entry._shownAs === markerType) {
                toHide.push(entry);
            }
        }
        for (const entry of toHide) await this._hideEntry(entry);
        for (const entry of targets) await this._showEntryAs(entry, markerType);
        this.events.emit('shown-change', this.shownEntryIds);
        return this.getShownFeatures();
    }

    /**
     * Add ids to the shown set under `markerType`. Any id previously shown as
     * a different marker type is moved (its previous module is cleared, the
     * new theme's module renders).
     *
     * Under `entryMode === 'single'` everything else is hidden first, so the
     * effective behaviour collapses to "show exactly the last id in the list".
     */
    async addShownEntries(ids: readonly string[], markerType: PlacesMarkerType): Promise<Place[]> {
        if (this._entryMode === 'single') {
            const lastId = ids.at(-1);
            return lastId ? this.setShownEntries([lastId], markerType) : this.getShownFeatures();
        }
        const targets = ids.flatMap((id) => {
            const entry = this._entries.find((e) => e.id === id);
            return entry ? [entry] : [];
        });
        const changed = targets.filter((entry) => entry._shownAs !== markerType);
        for (const entry of changed) await this._showEntryAs(entry, markerType);
        if (changed.length > 0) this.events.emit('shown-change', this.shownEntryIds);
        return this.getShownFeatures();
    }

    /** Remove ids from the shown set and clear their modules. */
    async removeShownEntries(ids: readonly string[]): Promise<Place[]> {
        const targets = ids.flatMap((id) => {
            const entry = this._entries.find((e) => e.id === id);
            return entry?._shownAs ? [entry] : [];
        });
        for (const entry of targets) await this._hideEntry(entry);
        if (targets.length > 0) this.events.emit('shown-change', this.shownEntryIds);
        return this.getShownFeatures();
    }

    /** Clear everything from the map (does not touch entries history). */
    async clearShownEntries(): Promise<void> {
        const shown = this._entries.filter((entry) => entry._shownAs);
        if (shown.length === 0) return;
        for (const entry of shown) await this._hideEntry(entry);
        this.events.emit('shown-change', this.shownEntryIds);
    }

    // Clears the rendered boundary polygons for the given entries (or every entry when `ids`
    // is omitted). Cached `entry.geometries` features are kept so re-showing is instant.
    async clearShownGeometries(ids?: readonly string[]): Promise<void> {
        const targets = ids
            ? ids.flatMap((id) => {
                  const entry = this._entries.find((e) => e.id === id);
                  return entry?._modules?.geometries ? [entry] : [];
              })
            : this._entries.filter((entry) => entry._modules?.geometries);
        if (targets.length === 0) return;
        for (const entry of targets) {
            // biome-ignore lint/style/noNonNullAssertion: filter guarantees the module exists
            await entry._modules!.geometries!.clear();
            this.events.emit('geometries-change', { entryId: entry.id, count: 0 });
        }
    }

    /**
     * Drop a single entry from history. Hides it from the map first (clears every theme module
     * it owns) then removes it from `_entries`. Emits `entries-change` and, when the entry was
     * shown, `shown-change`. No-op when the id is unknown.
     */
    async removeEntry(id: string): Promise<void> {
        const idx = this._entries.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const entry = this._entries[idx];
        const wasShown = !!entry._shownAs;
        if (entry._modules) {
            await entry._modules.pin?.clear();
            await entry._modules.baseMap?.clear();
            await entry._modules.pinClustered?.clear();
            await entry._modules.geometries?.clear();
        }
        this._entries.splice(idx, 1);
        this.events.emit('entries-change', this._entries);
        if (wasShown) this.events.emit('shown-change', this.shownEntryIds);
    }

    // Brings an entry up under `markerType`: clears the previous theme's module
    // (if any), lazy-inits the target theme's module, and pushes the entry's
    // places onto it. Idempotent — calling twice with the same theme just
    // re-pushes the same data.
    private async _showEntryAs(entry: PlacesEntry, markerType: PlacesMarkerType): Promise<void> {
        if (entry._shownAs && entry._shownAs !== markerType) {
            const prev = entry._modules?.[markerTypeSlot(entry._shownAs)];
            if (prev) await prev.clear();
        }
        const module = await this.getEntryPlacesModule(entry.id, markerType);
        await module.show({ type: 'FeatureCollection', features: entry.places } as Places);
        // Connections (when stored on the entry) re-render with the places.
        if (entry.connections?.length) {
            await module.showConnections(entry.connections);
        }
        entry._shownAs = markerType;
    }

    // Hides whichever theme is currently rendering this entry. No-op if
    // already hidden.
    private async _hideEntry(entry: PlacesEntry): Promise<void> {
        if (!entry._shownAs) return;
        const module = entry._modules?.[markerTypeSlot(entry._shownAs)];
        if (module) await module.clear();
        entry._shownAs = undefined;
    }

    reset(): void {
        // Modules can't be unmounted from the map without their `destroy()`
        // hook (not part of the SDK surface today), so we clear them so the
        // map looks empty before dropping the references. Layers stay parked
        // on the style — same trade-off the previous shared-module reset had.
        for (const entry of this._entries) {
            if (entry._modules) {
                entry._modules.pin?.clear();
                entry._modules.baseMap?.clear();
                entry._modules.pinClustered?.clear();
                entry._modules.geometries?.clear();
            }
        }
        this._entries = [];
        this.events.emit('entries-change', this._entries);
        this.events.emit('shown-change', this.shownEntryIds);
    }
}
