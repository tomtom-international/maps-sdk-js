import { LayerSpecification } from "maplibre-gl";
import { AbstractEventProxy } from "../AbstractEventProxy";
import { StyleSourceWithLayers } from "../SourceWithLayers";

const sourceWithLayersMock = {
    places: {
        source: { id: "SOURCE_ID" },
        _layerSpecs: [{ id: "layer0", type: "symbol", source: "SOURCE_ID" } as LayerSpecification]
    } as StyleSourceWithLayers,
    placesStats: {
        source: { id: "SOURCE_ID_2" },
        _layerSpecs: [{ id: "layer5", type: "symbol", source: "SOURCE_ID_2" } as LayerSpecification]
    } as StyleSourceWithLayers
};

const sourceWithLayersMock2 = {
    places: {
        source: { id: "SOURCE_ID" },
        _layerSpecs: [{ id: "layer0", type: "line", source: "SOURCE_ID", minzoom: 5 } as LayerSpecification]
    } as StyleSourceWithLayers
};

const sourceWithLayersMock3 = {
    otherThings: {
        source: { id: "SOURCE_ID_456" },
        _layerSpecs: [{ id: "layer0", type: "circle", source: "SOURCE_ID_456", minzoom: 7 } as LayerSpecification]
    } as StyleSourceWithLayers
};

class TestEventProxy extends AbstractEventProxy {
    getInteractiveSourcesAndLayers() {
        return this.interactiveSourcesAndLayers;
    }
}

describe("AbstractEventProxy tests", () => {
    let eventsProxy: TestEventProxy;
    beforeEach(() => (eventsProxy = new TestEventProxy()));

    test("Add one event handler", () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => "test", "click");
        expect(eventsProxy.has(sourceWithLayersMock.places)).toStrictEqual(true);
        expect(eventsProxy.has(sourceWithLayersMock.placesStats)).toStrictEqual(false);
    });

    test("Check if has any handler registered", () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => "test", "click");
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBeTruthy();

        eventsProxy.removeAll();
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBeFalsy();
    });

    test("Remove event handler", () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => "test", "click");
        eventsProxy.remove(sourceWithLayersMock.places, "click");
        expect(eventsProxy.has(sourceWithLayersMock.places)).toStrictEqual(false);
    });

    test("Remove all event handlers", () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => "test", "click");
        eventsProxy.removeAll();
        expect(eventsProxy.has(sourceWithLayersMock.places)).toStrictEqual(false);
    });

    test("Update sources with layers", () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => "test", "click");
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({ SOURCE_ID: sourceWithLayersMock.places });

        // Happy flow: updating with sourceWithLayers of same source ID:
        eventsProxy.updateIfRegistered(sourceWithLayersMock2);
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({ SOURCE_ID: sourceWithLayersMock2.places });

        // updating while not registered yet:
        eventsProxy.updateIfRegistered(sourceWithLayersMock3);
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({ SOURCE_ID: sourceWithLayersMock2.places });

        eventsProxy.addEventHandler(sourceWithLayersMock3.otherThings, () => "test", "click");
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({
            SOURCE_ID: sourceWithLayersMock2.places,
            SOURCE_ID_456: sourceWithLayersMock3.otherThings
        });

        eventsProxy.updateIfRegistered(sourceWithLayersMock);
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({
            SOURCE_ID: sourceWithLayersMock.places,
            SOURCE_ID_456: sourceWithLayersMock3.otherThings
        });

        eventsProxy.addEventHandler(sourceWithLayersMock.placesStats, () => "test", "click");
        expect(eventsProxy.getInteractiveSourcesAndLayers()).toEqual({
            SOURCE_ID: sourceWithLayersMock.places,
            SOURCE_ID_2: sourceWithLayersMock.placesStats,
            SOURCE_ID_456: sourceWithLayersMock3.otherThings
        });
    });
});
