import type { LayerSpecification } from 'maplibre-gl';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AbstractEventProxy } from '../AbstractEventProxy';
import type { StyleSourceWithLayers } from '../SourceWithLayers';

const sourceWithLayersMock = {
    places: {
        source: { id: 'SOURCE_ID' },
        _layerSpecs: [{ id: 'layer0', type: 'symbol', source: 'SOURCE_ID' } as LayerSpecification],
        equalSourceAndLayerIDs: vi.fn(),
    } as unknown as StyleSourceWithLayers,
    placesStats: {
        source: { id: 'SOURCE_ID_2' },
        _layerSpecs: [{ id: 'layer5', type: 'symbol', source: 'SOURCE_ID_2' } as LayerSpecification],
        equalSourceAndLayerIDs: vi.fn(),
    } as unknown as StyleSourceWithLayers,
};

const sourceWithLayersMock2 = {
    places: {
        source: { id: 'SOURCE_ID' },
        _layerSpecs: [{ id: 'layer0', type: 'line', source: 'SOURCE_ID', minzoom: 5 } as LayerSpecification],
        equalSourceAndLayerIDs: vi.fn(),
    } as unknown as StyleSourceWithLayers,
};

const sourceWithLayersMock3 = {
    otherThings: {
        source: { id: 'SOURCE_ID_456' },
        _layerSpecs: [{ id: 'layer0', type: 'circle', source: 'SOURCE_ID_456', minzoom: 7 } as LayerSpecification],
        equalSourceAndLayerIDs: vi.fn(),
    } as unknown as StyleSourceWithLayers,
};

class TestEventProxy extends AbstractEventProxy {}

describe('AbstractEventProxy tests', () => {
    let eventsProxy: TestEventProxy;
    beforeEach(() => {
        eventsProxy = new TestEventProxy();
    });

    test('Add one event handler', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click');
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBe(true);
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.placesStats.source.id)).toBe(false);
    });

    test('Check if has any handler registered', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click');
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBe(true);

        eventsProxy.removeAll();
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBe(false);
    });

    test('Remove event handler', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click');
        eventsProxy.remove(sourceWithLayersMock.places, 'click');
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBe(false);
    });

    test('Remove all event handlers', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click');
        eventsProxy.removeAll();
        expect(eventsProxy.hasSourceID(sourceWithLayersMock.places.source.id)).toBe(false);
    });

    test('Update sources with layers', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click');

        // Happy flow: updating with sourceWithLayers of same source ID:
        eventsProxy.updateIfRegistered(sourceWithLayersMock2);

        // updating while not registered yet:
        eventsProxy.updateIfRegistered(sourceWithLayersMock3);
        eventsProxy.addEventHandler(sourceWithLayersMock3.otherThings, () => 'test', 'click');
        eventsProxy.updateIfRegistered(sourceWithLayersMock);
        eventsProxy.addEventHandler(sourceWithLayersMock.placesStats, () => 'test', 'click');
    });
});
