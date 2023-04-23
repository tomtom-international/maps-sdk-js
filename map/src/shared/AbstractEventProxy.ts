import remove from "lodash/remove";
import { MapGeoJSONFeature } from "maplibre-gl";
import { EventType, SourcesWithLayers, SourceWithLayers, UserEventHandler } from "./types";

type SourceWithLayersMap = { [sourceID: string]: SourceWithLayers };

type EventHandlers = Record<string, UserEventHandler<any>[]>;

/**
 * @ignore
 */
export const toHandlerGroupID = (sourceID: string, type: EventType): string => `${sourceID}_${type}`;

/**
 * @ignore
 */
const _toHandlerGroupID = (sourceWithLayers: SourceWithLayers, type: EventType): string =>
    toHandlerGroupID(sourceWithLayers.source.id, type);

/**
 * @ignore
 */
export abstract class AbstractEventProxy {
    // This is the list of all sources/layers we listen to:
    protected interactiveSourcesAndLayers: SourceWithLayersMap = {};
    protected interactiveLayerIDs: string[] = [];
    protected handlers: EventHandlers = {};

    /**
     * Adds the given sources and layers as interactive, so we'll listen to them for hover and click.
     * @param sourceWithLayers The sources and layers to listen to.
     */
    ensureAdded(sourceWithLayers: SourceWithLayers) {
        this.interactiveSourcesAndLayers[sourceWithLayers.source.id] = sourceWithLayers;

        sourceWithLayers._layerSpecs.forEach((layerSpec) => {
            if (!this.interactiveLayerIDs.includes(layerSpec.id)) {
                this.interactiveLayerIDs.push(layerSpec.id);
            }
        });
    }

    /**
     * Register an event listener to the list.
     * @param sourceWithLayers The sources and layers to added.
     * @param handler Function that will handle the event.
     * @param type Type of event to listen to.
     */
    addEventHandler<T = MapGeoJSONFeature>(
        sourceWithLayers: SourceWithLayers,
        handler: UserEventHandler<T>,
        type: EventType
    ) {
        this.ensureAdded(sourceWithLayers);

        const handlerGroupId = _toHandlerGroupID(sourceWithLayers, type);
        const handlerExists = this.handlers[handlerGroupId] && this.handlers[handlerGroupId].includes(handler);

        if (!handlerExists) {
            this.handlers[handlerGroupId] = this.handlers[handlerGroupId] || [];
            this.handlers[handlerGroupId].push(handler);
        }
    }

    /**
     * Removes the given sources and layers from the interactive list. When not present, nothing happens.
     * @param type The event type to be removed.
     * @param sourceWithLayers The sources and layers to remove, matched by source and layer IDs.
     */
    remove(sourceWithLayers: SourceWithLayers, type: EventType) {
        delete this.handlers[_toHandlerGroupID(sourceWithLayers, type)];
        delete this.interactiveSourcesAndLayers[sourceWithLayers.source.id];
        sourceWithLayers._layerSpecs.forEach((layer) => {
            remove(this.interactiveLayerIDs, (item) => layer.id.includes(item));
        });
    }

    /**
     * Removes all interactive sources and layers.
     */
    removeAll() {
        this.interactiveSourcesAndLayers = {};
        this.interactiveLayerIDs = [];
        this.handlers = {};
    }

    /**
     * Returns whether this sourceWithLayers is registered for events (has handlers attached).
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    has(sourcesWithLayers: SourceWithLayers): boolean {
        return this.hasSourceID(sourcesWithLayers.source.id);
    }

    /**
     * Returns whether this source is registered for events (has handlers attached).
     * @param sourceId The source id (should be linked to a SourceWithLayers instance).
     */
    hasSourceID(sourceId: string): boolean {
        return !!this.interactiveSourcesAndLayers[sourceId];
    }

    /**
     * Updates the given sourcesWithLayers, if they have any handlers.
     * * (This is typically called to refresh an existing, stale sourceWithLayers after a map style has changed).
     * @param sourcesWithLayers The new sources with layers to replace existing ones.
     */
    updateIfRegistered(sourcesWithLayers: SourcesWithLayers): void {
        for (const sourceWithLayers of Object.values(sourcesWithLayers)) {
            if (sourceWithLayers && this.has(sourceWithLayers)) {
                this.ensureAdded(sourceWithLayers);
            }
        }
    }
}
