import remove from "lodash/remove";
import { EventHandlers, EventType, HoverClickHandler, SourceWithLayers } from "./types";

interface SourceWithLayersMap {
    [sourceID: string]: SourceWithLayers;
}

export abstract class AbstractEventProxy {
    // This is the list of all sources/layers we listen to:
    protected interactiveSourcesAndLayers: SourceWithLayersMap = {};
    protected interactiveLayerIDs: string[] = [];
    protected handlers: EventHandlers = {};

    /**
     * Adds the given sources and layers as interactive, so we'll listen to them for hover and click.
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    ensureAdded(sourcesWithLayers: SourceWithLayers) {
        this.interactiveSourcesAndLayers[sourcesWithLayers.source.id] = sourcesWithLayers;
        sourcesWithLayers.layerSpecs.forEach((layerSpec) => {
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
    addEventHandler(sourceWithLayers: SourceWithLayers, handler: HoverClickHandler, type: EventType) {
        if (!this.has(sourceWithLayers)) {
            this.ensureAdded(sourceWithLayers);
        }

        const handlerId = `${sourceWithLayers.source.id}_${type}`;
        const handlerExists = this.handlers[handlerId] && this.handlers[handlerId].indexOf(handler) !== -1;

        if (!handlerExists) {
            this.handlers[handlerId] = this.handlers[handlerId] || [];
            this.handlers[handlerId].push(handler);
        }
    }

    /**
     * Removes the given sources and layers from the interactive list. When not present, nothing happens.
     * @param type The event type to be removed.
     * @param sourceWithLayers The sources and layers to remove, matched by source and layer IDs.
     */
    remove(type: EventType, sourceWithLayers: SourceWithLayers) {
        delete this.handlers[`${sourceWithLayers.source.id}_${type}`];
        delete this.interactiveSourcesAndLayers[sourceWithLayers.source.id];
        sourceWithLayers.layerSpecs.forEach((layer) => {
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
     * Returns a boolean if sources and layers are registered.
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    has(sourcesWithLayers: SourceWithLayers): boolean {
        return Boolean(this.interactiveSourcesAndLayers[sourcesWithLayers.source.id]);
    }
}
