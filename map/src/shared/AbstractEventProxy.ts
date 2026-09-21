import { remove } from 'lodash-es';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import type { AbstractMapModule } from './AbstractMapModule';
import { type ResolvedEventScope, scopedLayerSpecs } from './eventScope';
import type { EventHandlerConfig, EventType, SourcesWithLayers, SourceWithLayers, UserEventHandler } from './types';

/**
 * Any map module, whatever its sources and config. The event proxy only ever compares owners by
 * identity, so it needs no more than "some module" — but naming the class says who may own a
 * handler, which a bare `object` did not. The two type parameters are irrelevant to identity, and
 * pinning them would drag every module's concrete types through this file.
 *
 * @ignore
 */
export type AnyMapModule = AbstractMapModule<any, any>;

/**
 * One entry in the handler index: the caller's function plus everything dispatch needs to decide
 * whether it should fire. A caller supplies a {@link HandlerRegistration}; the proxy files this.
 *
 * Repeated `on()` calls append rather than replace, so several entries can listen to one layer and
 * all of them fire.
 *
 * @ignore
 */
export type HandlerEntry = {
    /**
     * The source the handler was registered against — **all** of its layers, not just the ones
     * this entry listens to; `layerIDs` is that narrowing.
     *
     * Kept because the handler receives it as its last argument, because a GeoJSON source can
     * substitute the caller's typed original back in for the rendered feature, and because
     * dropping by source needs its ID. Replaced wholesale on a style change.
     */
    sourceWithLayers: SourceWithLayers;
    /**
     * The layers this entry actually listens to: `sourceWithLayers`' layers narrowed by `scope`,
     * so a scoped handler holds a subset and an unscoped one holds the lot.
     *
     * It is also *where the entry is filed* — it appears in `handlers[type][layerID]` under each
     * of these — which is why a style change re-files the entry rather than just overwriting the
     * set. A Set rather than a list because a layer-scoped handler tests membership per dispatch
     * to narrow the features its caller sees, and the base map contributes ~90 layers to test
     * against.
     */
    layerIDs: Set<string>;
    /**
     * The handler to call, already wrapped by {@link UserEvents} with the module's feature mapping
     * and any `where()` predicate — so by the time dispatch reaches it, it takes the module's own
     * feature type and has already declined features outside its scope.
     */
    fn: UserEventHandler<any>;
    /** Event configuration this entry registered with — its hover cursor, chiefly. */
    config?: EventHandlerConfig;
    /**
     * The module that registered this handler. Two modules can share one MapLibre source ID —
     * POIs and the base map both use `vectorTiles` — so a style-change refresh has to tell their
     * handlers apart by owner rather than by source ID alone.
     */
    owner: AnyMapModule;
    /**
     * How the registration was narrowed, if at all. Kept alongside `layerIDs` rather than being
     * spent when it is resolved: `layerFilter` has to run again over the new layer set after a
     * style change, and `featureMatches` decides per dispatch whether this entry claims the
     * hover cursor for the feature under the pointer.
     */
    scope?: ResolvedEventScope;
};

/**
 * How a handler was registered: the parts of a {@link HandlerEntry} a caller supplies, as opposed
 * to the layers and source the proxy resolves for it. Grouped rather than passed as three trailing
 * arguments, so a call site names what it means instead of positioning an `undefined` config
 * before an owner.
 *
 * @ignore
 */
export type HandlerRegistration = Pick<HandlerEntry, 'config' | 'owner' | 'scope'>;

/**
 * One event type's handlers, bucketed by the layer they listen to. Each bucket is in registration
 * order — `findHandlers()[0]` is the first one registered, which is what claims the hover cursor.
 *
 * @ignore
 */
type HandlersByLayer = Record<string, HandlerEntry[]>;

/**
 * Every registered handler, indexed by event type and then by the layer it listens to. A handler
 * scoped to several layers appears under each of them, so dispatch is a lookup rather than a scan:
 * a hit on `layerId` fires exactly `handlers[type][layerId]`.
 *
 * Keyed this way, the interactive-layer list is local information — a layer is interactive while
 * some type still holds a non-empty bucket for it, so releasing one costs five lookups instead of
 * a walk over every registered handler.
 *
 * @example
 * ```typescript
 * const handlers = {
 *     click: {
 *         'Buildings': [{ sourceWithLayers, layerIDs: Set { 'Buildings', 'Roads' }, fn, … }],
 *         'Roads':     [ …the same handler again, plus any other listening to Roads ],
 *     },
 *     hover: { 'Water': [ … ] },
 *     contextmenu: {},
 *     'hover-move': {},
 *     'long-hover': {},
 * };
 * ```
 *
 * @ignore
 */
type EventHandlers = Record<EventType, HandlersByLayer>;

// A fresh index. Every event type owns a bucket map from the start, so registering and dropping
// never have to create or delete one.
const emptyHandlers = (): EventHandlers => ({
    click: {},
    contextmenu: {},
    hover: {},
    'hover-move': {},
    'long-hover': {},
});

/**
 * @ignore
 */
export abstract class AbstractEventProxy {
    protected interactiveLayerIDs: string[] = [];
    protected handlers: EventHandlers = emptyHandlers();

    /**
     * Adds the given layers as interactive, so we'll listen to them for hover and click.
     *
     * Only the layers a handler's scope actually selects are added. Marking the whole source
     * interactive would let an out-of-scope feature rendered on top shadow an in-scope one, since
     * dispatch matches on the topmost hit.
     * @param layerIDs The scoped layers to listen to.
     */
    private ensureInteractiveLayerIDsAdded(layerIDs: Iterable<string>) {
        for (const layerID of layerIDs) {
            if (!this.interactiveLayerIDs.includes(layerID)) {
                this.interactiveLayerIDs.push(layerID);
            }
        }
    }

    // Stops listening to any of these layers that no handler covers any more. Cheap because the
    // index is keyed by layer: "still needed" is five bucket lookups, not a walk over every handler.
    private releaseUnusedInteractiveLayerIDs(layerIDs: Set<string>): void {
        remove(this.interactiveLayerIDs, (layerID) => layerIDs.has(layerID) && !this.hasHandlerForLayer(layerID));
    }

    // Files a handler under each layer it listens to, creating buckets as needed.
    private indexHandler(handler: HandlerEntry, type: EventType): void {
        const byLayer = this.handlers[type];
        for (const layerID of handler.layerIDs) {
            byLayer[layerID] ??= [];
            byLayer[layerID].push(handler);
        }
    }

    // Removes a handler from every bucket it occupies, dropping buckets that empty out.
    private unindexHandlers(handlers: Set<HandlerEntry>, type: EventType): Set<string> {
        const byLayer = this.handlers[type];
        const touchedLayerIDs = new Set<string>();
        for (const handler of handlers) {
            for (const layerID of handler.layerIDs) {
                touchedLayerIDs.add(layerID);
                const bucket = byLayer[layerID];
                if (!bucket) continue;

                remove(bucket, (candidate) => handlers.has(candidate));
                if (!bucket.length) delete byLayer[layerID];
            }
        }
        return touchedLayerIDs;
    }

    /**
     * Detaches this source's handlers that the predicate matches, then stops listening to any
     * layer none of the survivors still covers.
     *
     * The source has to be part of the match: `UserEvents.on` registers one handler function
     * across several sources and unsubscribes them one at a time, so the function alone does not
     * identify which registration to drop.
     */
    private dropHandlers(
        sourceWithLayers: SourceWithLayers,
        type: EventType,
        matches: (handler: HandlerEntry) => boolean,
    ): void {
        const sourceId = sourceWithLayers.source.id;
        const dropped = new Set<HandlerEntry>();
        for (const bucket of Object.values(this.handlers[type])) {
            for (const handler of bucket) {
                if (handler.sourceWithLayers.source.id === sourceId && matches(handler)) dropped.add(handler);
            }
        }
        if (!dropped.size) return;

        this.releaseUnusedInteractiveLayerIDs(this.unindexHandlers(dropped, type));
    }

    /**
     * Register an event listener to the list.
     * @param sourceWithLayers The sources and layers to added.
     * @param handlerFn Function that will handle the event.
     * @param type Type of event to listen to.
     * @param registration How the handler was registered — see {@link HandlerRegistration}.
     */
    addEventHandler<T = MapGeoJSONFeature>(
        sourceWithLayers: SourceWithLayers,
        handlerFn: UserEventHandler<T>,
        type: EventType,
        registration: HandlerRegistration,
    ) {
        const layerIDs = new Set(scopedLayerSpecs(sourceWithLayers, registration.scope).map((layer) => layer.id));
        this.ensureInteractiveLayerIDsAdded(layerIDs);
        this.indexHandler({ ...registration, sourceWithLayers, layerIDs, fn: handlerFn }, type);
    }

    /**
     * Removes a single handler function for the given source and event type.
     * Other handlers registered for the same source and type are not affected.
     * @param sourceWithLayers The source whose handler should be removed.
     * @param type The event type.
     * @param handlerFn The exact function reference to remove.
     */
    removeHandler(sourceWithLayers: SourceWithLayers, type: EventType, handlerFn: UserEventHandler<any>) {
        this.dropHandlers(sourceWithLayers, type, (handler) => handler.fn === handlerFn);
    }

    /**
     * Removes every handler this owner registered for the given source and event type — what
     * `events.off(type)` means. Scoped handlers go with the rest: a scope is a way of registering,
     * not a separate surface to tear down.
     *
     * Matching is by owner rather than by layer set, because two modules can share one MapLibre
     * source ID (POIs and the base map both use `vectorTiles`) and neither may drop the other's
     * handlers.
     * @param sourceWithLayers The source whose handlers should go.
     * @param type The event type to be removed.
     * @param owner The module that registered them.
     */
    remove(sourceWithLayers: SourceWithLayers, type: EventType, owner: AnyMapModule) {
        this.dropHandlers(sourceWithLayers, type, (handler) => handler.owner === owner);
    }

    /**
     * Removes all interactive sources and layers.
     */
    removeAll() {
        this.interactiveLayerIDs = [];
        this.handlers = emptyHandlers();
    }

    /**
     * Whether any handler, of any event type, listens to this layer.
     * @param layerId The layer id a rendered feature was drawn from.
     */
    hasHandlerForLayer(layerId: string): boolean {
        return Object.values(this.handlers).some((byLayer) => !!byLayer[layerId]?.length);
    }

    /**
     * Look up the {@link SourceWithLayers} a layer's handlers were registered against, if any.
     *
     * The SDK assumes at most one `SourceWithLayers` per MapLibre source ID — each module creates
     * its own source — and a layer belongs to exactly one source, so any handler listening to the
     * layer carries the right reference.
     */
    protected sourceWithLayersFor(layerId: string | undefined): SourceWithLayers | undefined {
        if (!layerId) return undefined;

        for (const byLayer of Object.values(this.handlers)) {
            const bucket = byLayer[layerId];
            if (bucket?.length) return bucket[0].sourceWithLayers;
        }
        return undefined;
    }

    /**
     * Updates the given sourcesWithLayers, if they have any handlers.
     * * (This is typically called to refresh any registered, stale sourceWithLayers references after a map style has changed).
     * @param sourcesWithLayers The new sources with layers to replace existing ones.
     * @param owner The module whose sources these are. Only its own handlers are refreshed: two
     * modules can share one MapLibre source ID, so the ID alone cannot tell them apart.
     */
    updateIfRegistered(sourcesWithLayers: SourcesWithLayers, owner: AnyMapModule): void {
        const restoredBySourceId = new Map(
            Object.values(sourcesWithLayers).map((sourceWithLayers) => [sourceWithLayers.source.id, sourceWithLayers]),
        );

        for (const type of Object.keys(this.handlers) as EventType[]) {
            const affected = new Set<HandlerEntry>();
            for (const bucket of Object.values(this.handlers[type])) {
                for (const handler of bucket) {
                    if (handler.owner === owner && restoredBySourceId.has(handler.sourceWithLayers.source.id)) {
                        affected.add(handler);
                    }
                }
            }
            if (!affected.size) continue;

            // Re-file rather than edit in place: a style change can rename or drop layers, so a
            // handler's buckets are keyed by ids that may no longer be the ones its scope selects.
            const vacatedLayerIDs = this.unindexHandlers(affected, type);
            for (const handler of affected) {
                const sourceWithLayers = restoredBySourceId.get(handler.sourceWithLayers.source.id) as SourceWithLayers;
                handler.sourceWithLayers = sourceWithLayers;
                handler.layerIDs = new Set(scopedLayerSpecs(sourceWithLayers, handler.scope).map((layer) => layer.id));
                this.ensureInteractiveLayerIDsAdded(handler.layerIDs);
                this.indexHandler(handler, type);
            }
            this.releaseUnusedInteractiveLayerIDs(vacatedLayerIDs);
        }
    }

    /**
     * The handlers that should fire for a hit on `layerId`.
     *
     * The bucket *is* the layer, so no layer matching is needed here: a handler is filed under
     * exactly the layers its scope selects, which is what keeps a click on a POI out of the base
     * map's handler even though both register against the `vectorTiles` source.
     *
     * When a feature is supplied, handlers whose scope rejects it are dropped too — that is what
     * lets a feature-scoped handler drive its own hover cursor.
     */
    protected findHandlers = (
        types: EventType[],
        layerId: string | undefined,
        feature?: MapGeoJSONFeature,
    ): HandlerEntry[] =>
        (layerId &&
            types.flatMap((type) => {
                // `?? []` is load-bearing at runtime even though the index type says otherwise:
                // a bucket is deleted once its last handler goes.
                const bucket = this.handlers[type][layerId] ?? [];
                return feature
                    ? bucket.filter(
                          (handler) => !handler.scope?.featureMatches || handler.scope.featureMatches(feature),
                      )
                    : bucket;
            })) ||
        [];
}
