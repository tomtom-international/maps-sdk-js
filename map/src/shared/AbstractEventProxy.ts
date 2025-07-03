import isEmpty from 'lodash/isEmpty';
import remove from 'lodash/remove';
import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import type { EventType, SourcesWithLayers, SourceWithLayers, UserEventHandler } from './types';

// TODO: add support for multiple handlers per source, layers, and event type?
//  ... (this means multiple handlers for the same module, or repeated "on" calls for the same module)
type SourceEventTypeHandler = { sourceWithLayers: SourceWithLayers; layerIDs: string[]; fn: UserEventHandler<any> };

type SourceEventHandlers = Partial<Record<EventType, SourceEventTypeHandler[]>>;

// Source ID to event handlers for that source:
// Example:
// const handlers = {
//     vectorTiles: {
//         click: [
//             {
//                 sourceWithLayers: SourceWithLayers reference,
//                 layerIDs: ["Buildings", "Roads - Major"],
//                 fn: UserEventsHandler...
//             },
//             {
//                 sourceWithLayers: SourceWithLayers reference,
//                 layerIDs: ["Water", "Landuse - Parks],
//                 fn: UserEventsHandler...
//             }
//         ],
//         hover: [
//             {
//                 sourceWithLayers: SourceWithLayers reference,
//                 layerIDs: [...],
//                 fn: UserEventsHandler...
//              }
//         ]
//     },
type EventHandlers = Record<string, SourceEventHandlers>;

const matchesLayers = (layers: LayerSpecification[], layerIDs: string[]): boolean =>
    layerIDs.every((layerId, index) => layerId === layers[index].id);

/**
 * @ignore
 */
export abstract class AbstractEventProxy {
    protected interactiveLayerIDs: string[] = [];
    protected handlers: EventHandlers = {};

    /**
     * Adds the given layers as interactive, so we'll listen to them for hover and click.
     * @param sourceWithLayers The sources and layers to listen to.
     */
    private ensureInteractiveLayerIDsAdded(sourceWithLayers: SourceWithLayers) {
        sourceWithLayers._layerSpecs.forEach((layerSpec) => {
            if (!this.interactiveLayerIDs.includes(layerSpec.id)) {
                this.interactiveLayerIDs.push(layerSpec.id);
            }
        });
    }

    /**
     * Register an event listener to the list.
     * @param sourceWithLayers The sources and layers to added.
     * @param handlerFn Function that will handle the event.
     * @param type Type of event to listen to.
     */
    addEventHandler<T = MapGeoJSONFeature>(
        sourceWithLayers: SourceWithLayers,
        handlerFn: UserEventHandler<T>,
        type: EventType,
    ) {
        this.ensureInteractiveLayerIDsAdded(sourceWithLayers);
        const sourceId = sourceWithLayers.source.id;

        if (!this.handlers[sourceId]) {
            this.handlers[sourceId] = { [type]: [] };
        }
        this.handlers[sourceId][type] ??= [];

        this.handlers[sourceId][type]?.push({
            sourceWithLayers,
            layerIDs: sourceWithLayers._layerSpecs.map((layer) => layer.id),
            fn: handlerFn,
        });
    }

    /**
     * Removes the given sources and layers from the interactive list. When not present, nothing happens.
     * @param type The event type to be removed.
     * @param sourceWithLayers The sources and layers to remove, matched by source and layer IDs.
     */
    remove(sourceWithLayers: SourceWithLayers, type: EventType) {
        const sourceEventTypeHandlers = this.handlers[sourceWithLayers.source.id]?.[type];
        if (sourceEventTypeHandlers) {
            // @ts-ignore
            remove(sourceEventTypeHandlers, (handler) => matchesLayers(sourceWithLayers._layerSpecs, handler.layerIDs));
            // cleaning up empty arrays and objects if necessary:
            if (!sourceEventTypeHandlers.length) {
                delete this.handlers[sourceWithLayers.source.id]?.[type];
                if (isEmpty(this.handlers[sourceWithLayers.source.id])) {
                    delete this.handlers[sourceWithLayers.source.id];
                }
            }
        }
        for (const layer of sourceWithLayers._layerSpecs) {
            // @ts-ignore
            remove(this.interactiveLayerIDs, (id) => layer.id === id);
        }
    }

    /**
     * Removes all interactive sources and layers.
     */
    removeAll() {
        this.interactiveLayerIDs = [];
        this.handlers = {};
    }

    /**
     * Returns whether this source is registered for events (has handlers attached).
     * @param sourceId The source id (should be linked to a SourceWithLayers instance).
     */
    hasSourceID(sourceId: string): boolean {
        return !!this.handlers[sourceId];
    }

    /**
     * Updates the given sourcesWithLayers, if they have any handlers.
     * * (This is typically called to refresh any registered, stale sourceWithLayers references after a map style has changed).
     * @param sourcesWithLayers The new sources with layers to replace existing ones.
     */
    updateIfRegistered(sourcesWithLayers: SourcesWithLayers): void {
        for (const sourceWithLayers of Object.values(sourcesWithLayers)) {
            const sourceHandlers = this.handlers[sourceWithLayers.source.id];
            if (sourceHandlers) {
                for (const sourceEventTypeHandlers of Object.values(sourceHandlers)) {
                    for (const handler of sourceEventTypeHandlers) {
                        if (sourceWithLayers.equalSourceAndLayerIDs(handler.sourceWithLayers)) {
                            // We keep the reference fresh:
                            handler.sourceWithLayers = sourceWithLayers;
                        }
                    }
                }
            }
        }
    }

    protected findHandlers = (
        types: EventType[],
        sourceId: string | undefined,
        layerId: string | undefined,
    ): SourceEventTypeHandler[] =>
        (sourceId &&
            layerId &&
            types.flatMap((type) => {
                const sourceEventTypeHandlers = this.handlers[sourceId]?.[type];
                return sourceEventTypeHandlers?.length === 1
                    ? // if there's only handler for that source and type, we just return it, no need to match layers:
                      sourceEventTypeHandlers
                    : this.handlers[sourceId]?.[type]?.filter((handler) => handler.layerIDs.includes(layerId)) || [];
            })) ||
        [];
}
