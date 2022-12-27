import remove from "lodash/remove";
import { StyleSourceWithLayers } from "./SourceWithLayers";
import { EventHandlers, EventType, HoverClickHandler } from "./types/EventProxy";

interface SourceWithLayersMap {
    [sourceID: string]: StyleSourceWithLayers;
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
    private add = (sourceWithLayers: StyleSourceWithLayers) => {
        const sourceID = sourceWithLayers.source.id;
        this.interactiveSourcesAndLayers[sourceID] = sourceWithLayers;
        sourceWithLayers.layerSpecs.forEach((layerSpec) => {
            if (!this.interactiveLayerIDs.includes(layerSpec.id)) {
                this.interactiveLayerIDs.push(layerSpec.id);
            }
        });
    };

    /**
     * Register an event listener to the list.
     * @param sourcesWithLayers The sources and layers to added.
     * @param handler Function that will handle the event.
     * @param type Type of event to listen to.
     */
    public addEventHandler = (sourceWithLayers: StyleSourceWithLayers, handler: HoverClickHandler, type: EventType) => {
        if (!this.has(sourceWithLayers)) {
            this.add(sourceWithLayers);
        }

        const handlerId = `${sourceWithLayers.source.id}_${type}`;
        const handlerExists = this.handlers[handlerId] && this.handlers[handlerId].indexOf(handler) !== -1;

        if (!handlerExists) {
            this.handlers[handlerId] = this.handlers[handlerId] || [];
            this.handlers[handlerId].push(handler);
        }
    };

    /**
     * Removes the given sources and layers from the interactive list. When not present, nothing happens.
     * @param type The event type to be removed.
     * @param sourcesWithLayers The sources and layers to remove, matched by source and layer IDs.
     */
    public remove = (type: EventType, sourceWithLayers: StyleSourceWithLayers) => {
        delete this.handlers[`${sourceWithLayers.source.id}_${type}`];
        delete this.interactiveSourcesAndLayers[sourceWithLayers.source.id];
        sourceWithLayers.layerSpecs.forEach((layer) => {
            remove(this.interactiveLayerIDs, (item) => layer.id.includes(item));
        });
    };

    /**
     * Removes all interactive sources and layers.
     */
    public removeAll = () => {
        this.interactiveSourcesAndLayers = {};
        this.interactiveLayerIDs = [];
        this.handlers = {};
    };

    /**
     * Returns a boolean if sources and layers are registered.
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    public has = (sourcesWithLayers: StyleSourceWithLayers): boolean => {
        return Boolean(this.interactiveSourcesAndLayers[sourcesWithLayers.source.id]);
    };
}
