import { EventsProxy } from "./EventsProxy";
import { EventType, HoverClickHandler } from "./types/EventsProxy";
import { SourceWithLayers } from "./types/GOSDKLayerSpecs";

export class EventsModule {
    constructor(private eventProxy: EventsProxy, private mapModule?: SourceWithLayers) {}

    /**
     * Add Event to the EventProxy list
     * @private
     * @ignore
     */
    private addToEventProxy(type: EventType, handler: HoverClickHandler) {
        console.log(this.mapModule);
        if (this.mapModule) {
            this.eventProxy.addEventHandler(this.mapModule, handler, type);
        } else {
            console.error("mapModule can't be undefined.");
        }
    }

    /**
     * Remove Event to the EventProxy list
     * @private
     * @ignore
     */
    private removeFromEventProxy(type: EventType) {
        if (this.mapModule) {
            this.eventProxy.remove(type, this.mapModule);
        } else {
            console.error("mapModule can't be undefined.");
        }
    }

    /**
     * Add event handler of an event type
     * @param type
     * @param callback
     */
    on(type: EventType, handler: HoverClickHandler) {
        this.addToEventProxy(type, handler);
    }

    /**
     * Remove event handlers for event type
     * @param type
     */
    off(type: EventType) {
        this.removeFromEventProxy(type);
    }
}
