import remove from "lodash/remove";
import { StyleSourceWithLayers } from "./SourceWithLayers";
import { EventListeners, EventType, HoverClickHandler } from "./types/EventProxy";

interface SourceWithLayersMap {
    [sourceID: string]: StyleSourceWithLayers;
}

export abstract class AbstractEventProxy {
    // This is the list of all sources/layers we listen to:
    protected interactiveSourcesAndLayers: SourceWithLayersMap = {};
    protected interactiveLayerIDs: string[] = [];
    protected listeners: EventListeners = {};

    /**
     * Adds the given sources and layers as interactive, so we'll listen to them for hover and click.
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    private add = (sourceWithLayers: StyleSourceWithLayers) => {
        if (this.has(sourceWithLayers)) {
            return;
        }

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
     * @param sourcesWithLayers The sources and layers to remove, matched by source and layer IDs.
     * @param listener Function that will handle the event.
     * @param type Type of event to listen to.
     */
    public addEventListener = (
        sourceWithLayers: StyleSourceWithLayers,
        listener: HoverClickHandler,
        type: EventType
    ) => {
        if (!this.has(sourceWithLayers)) {
            this.add(sourceWithLayers);
        }

        const listenerId = `${sourceWithLayers.source.id}_${type}`;
        const listenerExists = this.listeners[listenerId] && this.listeners[listenerId].indexOf(listener) !== -1;

        if (!listenerExists) {
            this.listeners[listenerId] = this.listeners[listenerId] || [];
            this.listeners[listenerId].push(listener);
        }
    };

    /**
     * Removes the given sources and layers from the interactive list. When not present, nothing happens.
     * @param type The event type to be removed.
     * @param sourcesWithLayers The sources and layers to remove, matched by source and layer IDs.
     */
    public remove = (type: EventType, sourceWithLayers: StyleSourceWithLayers) => {
        delete this.listeners[`${sourceWithLayers.source.id}_${type}`];
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
        this.listeners = {};
    };

    /**
     * Returns a boolean if sources and layers are registered.
     * @param sourcesWithLayers The sources and layers to listen to.
     */
    public has = (sourcesWithLayers: StyleSourceWithLayers): boolean => {
        return Boolean(this.interactiveSourcesAndLayers[sourcesWithLayers.source.id]);
    };
}
