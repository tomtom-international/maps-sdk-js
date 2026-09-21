import type { LayerSpecification, MapGeoJSONFeature } from 'maplibre-gl';
import { beforeEach, describe, expect, test } from 'vitest';
import type { AnyMapModule } from '../AbstractEventProxy';
import { AbstractEventProxy } from '../AbstractEventProxy';
import type { StyleSourceWithLayers } from '../SourceWithLayers';
import type { EventType } from '../types';

const sourceWithLayersMock = {
    places: {
        source: { id: 'SOURCE_ID' },
        _layerSpecs: [{ id: 'layer0', type: 'symbol', source: 'SOURCE_ID' } as LayerSpecification],
    } as unknown as StyleSourceWithLayers,
    placesStats: {
        source: { id: 'SOURCE_ID_2' },
        _layerSpecs: [{ id: 'layer5', type: 'symbol', source: 'SOURCE_ID_2' } as LayerSpecification],
    } as unknown as StyleSourceWithLayers,
};

const sourceWithLayersMock2 = {
    places: {
        source: { id: 'SOURCE_ID' },
        _layerSpecs: [{ id: 'layer0', type: 'line', source: 'SOURCE_ID', minzoom: 5 } as LayerSpecification],
    } as unknown as StyleSourceWithLayers,
};

const sourceWithLayersMock3 = {
    otherThings: {
        source: { id: 'SOURCE_ID_456' },
        _layerSpecs: [{ id: 'layer0', type: 'circle', source: 'SOURCE_ID_456', minzoom: 7 } as LayerSpecification],
    } as unknown as StyleSourceWithLayers,
};

class TestEventProxy extends AbstractEventProxy {
    // findHandlers and interactiveLayerIDs are protected; scope tests need to observe both.
    handlersFor(types: EventType[], layerId: string, feature?: MapGeoJSONFeature) {
        return this.findHandlers(types, layerId, feature);
    }

    get interactiveLayers(): string[] {
        return this.interactiveLayerIDs;
    }
}

const layerSpec = (id: string): LayerSpecification => ({ id, type: 'symbol', source: 'SCOPED' }) as LayerSpecification;

// One source carrying a mixed layer set, so a scope over it is a real subset — this is the
// BaseMapModule shape (`vectorTiles` with road, label and water layers under one source).
const scopedSource = (...ids: string[]) =>
    ({
        source: { id: 'SCOPED' },
        _layerSpecs: ids.map(layerSpec),
    }) as unknown as StyleSourceWithLayers;

const roadLabelsOnly = { layerFilter: (layer: LayerSpecification) => layer.id.startsWith('roadLabel') };

// Stands in for the module registering a handler. Handlers are found again by owner identity, so
// every registration needs one; tests that care about telling two modules apart declare their own.
const owner = {} as AnyMapModule;

describe('AbstractEventProxy tests', () => {
    let eventsProxy: TestEventProxy;
    beforeEach(() => {
        eventsProxy = new TestEventProxy();
    });

    test('Add one event handler', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click', { owner });
        expect(eventsProxy.hasHandlerForLayer('layer0')).toBe(true);
        expect(eventsProxy.hasHandlerForLayer('layer5')).toBe(false);
    });

    test('Check if has any handler registered', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click', { owner });
        expect(eventsProxy.hasHandlerForLayer('layer0')).toBe(true);

        eventsProxy.removeAll();
        expect(eventsProxy.hasHandlerForLayer('layer0')).toBe(false);
    });

    test('Remove event handler', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click', { owner });
        eventsProxy.remove(sourceWithLayersMock.places, 'click', owner);
        expect(eventsProxy.hasHandlerForLayer('layer0')).toBe(false);
    });

    test('Remove all event handlers', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click', { owner });
        eventsProxy.removeAll();
        expect(eventsProxy.hasHandlerForLayer('layer0')).toBe(false);
    });

    test('Update sources with layers', () => {
        eventsProxy.addEventHandler(sourceWithLayersMock.places, () => 'test', 'click', { owner });

        // Happy flow: updating with sourceWithLayers of same source ID:
        eventsProxy.updateIfRegistered(sourceWithLayersMock2, owner);

        // updating while not registered yet:
        eventsProxy.updateIfRegistered(sourceWithLayersMock3, owner);
        eventsProxy.addEventHandler(sourceWithLayersMock3.otherThings, () => 'test', 'click', { owner });
        eventsProxy.updateIfRegistered(sourceWithLayersMock, owner);
        eventsProxy.addEventHandler(sourceWithLayersMock.placesStats, () => 'test', 'click', { owner });
    });
});

// See LSI-159. A scope narrows a handler to part of its source, so it must survive registration,
// dispatch and style changes without ever firing outside what it selected.
describe('AbstractEventProxy scoped handlers', () => {
    let eventsProxy: TestEventProxy;
    const source = scopedSource('roads', 'roadLabel-major', 'water');

    beforeEach(() => {
        eventsProxy = new TestEventProxy();
    });

    test('marks only the scoped layers interactive', () => {
        eventsProxy.addEventHandler(source, () => 'scoped', 'click', { owner, scope: roadLabelsOnly });

        expect(eventsProxy.interactiveLayers).toEqual(['roadLabel-major']);
    });

    test('a lone scoped handler does not fire outside its layers', () => {
        // Regression: findHandlers used to return the handler without matching layers whenever it
        // was the only one for that source and type, so a label-scoped handler fired on water.
        eventsProxy.addEventHandler(source, () => 'scoped', 'click', { owner, scope: roadLabelsOnly });

        expect(eventsProxy.handlersFor(['click'], 'roadLabel-major')).toHaveLength(1);
        expect(eventsProxy.handlersFor(['click'], 'water')).toHaveLength(0);
    });

    test('an unscoped handler still fires for every layer of its source', () => {
        eventsProxy.addEventHandler(source, () => 'all', 'click', { owner });

        expect(eventsProxy.handlersFor(['click'], 'water')).toHaveLength(1);
        expect(eventsProxy.interactiveLayers).toEqual(['roads', 'roadLabel-major', 'water']);
    });

    test('a feature predicate keeps a non-matching feature from reaching the handler', () => {
        const majorOnly = { featureMatches: (feature: MapGeoJSONFeature) => feature.properties.magnitude === 'major' };
        eventsProxy.addEventHandler(source, () => 'major', 'click', { owner, scope: majorOnly });

        const major = { properties: { magnitude: 'major' } } as unknown as MapGeoJSONFeature;
        const minor = { properties: { magnitude: 'minor' } } as unknown as MapGeoJSONFeature;

        expect(eventsProxy.handlersFor(['click'], 'roads', major)).toHaveLength(1);
        expect(eventsProxy.handlersFor(['click'], 'roads', minor)).toHaveLength(0);
        // Without a feature to test — the layer-only lookups — the handler is still a candidate.
        expect(eventsProxy.handlersFor(['click'], 'roads')).toHaveLength(1);
    });

    test('re-resolves scoped layer IDs when a style change alters the layer set', () => {
        eventsProxy.addEventHandler(source, () => 'scoped', 'click', { owner, scope: roadLabelsOnly });
        expect(eventsProxy.handlersFor(['click'], 'roadLabel-minor')).toHaveLength(0);

        // The new style renames the label layer. The scope still selects it, so the handler must
        // follow — previously layerIDs was captured once and the handler went silent.
        eventsProxy.updateIfRegistered({ vectorTiles: scopedSource('roads', 'roadLabel-minor') }, owner);

        expect(eventsProxy.handlersFor(['click'], 'roadLabel-minor')).toHaveLength(1);
        expect(eventsProxy.handlersFor(['click'], 'roadLabel-major')).toHaveLength(0);
        // The layer the scope no longer selects stops being queried, rather than lingering in the
        // interactive list for the rest of the style's life.
        expect(eventsProxy.interactiveLayers).toEqual(['roadLabel-minor']);
    });

    test('refreshes only the owner whose sources were restored', () => {
        // POIs and the base map share the `vectorTiles` source ID, so owner identity is the only
        // thing that tells their handlers apart on a restore.
        const baseMapOwner = {} as AnyMapModule;
        const poisOwner = {} as AnyMapModule;
        eventsProxy.addEventHandler(source, () => 'base', 'click', { owner: baseMapOwner, scope: roadLabelsOnly });
        eventsProxy.addEventHandler(source, () => 'pois', 'click', {
            owner: poisOwner,
            scope: { layerFilter: (layer) => layer.id === 'water' },
        });

        eventsProxy.updateIfRegistered({ vectorTiles: scopedSource('roadLabel-minor', 'water') }, baseMapOwner);

        // The base map's scope re-resolved onto the renamed label layer...
        expect(eventsProxy.handlersFor(['click'], 'roadLabel-minor')).toHaveLength(1);
        // ...while the POIs handler kept its own layers untouched.
        expect(eventsProxy.handlersFor(['click'], 'water')).toHaveLength(1);
    });

    test('keeps a layer interactive while another scope over the same source still needs it', () => {
        const first = () => 'first';
        eventsProxy.addEventHandler(source, first, 'click', { owner, scope: roadLabelsOnly });
        eventsProxy.addEventHandler(source, () => 'second', 'hover', { owner, scope: roadLabelsOnly });

        eventsProxy.removeHandler(source, 'click', first);

        expect(eventsProxy.interactiveLayers).toEqual(['roadLabel-major']);
    });

    test('releases a layer once no handler listens to it any more', () => {
        const only = () => 'only';
        eventsProxy.addEventHandler(source, only, 'click', { owner, scope: roadLabelsOnly });

        eventsProxy.removeHandler(source, 'click', only);

        expect(eventsProxy.interactiveLayers).toEqual([]);
    });
});

// `off(type)` must clear every handler for that source and type, scoped ones included. See LSI-159.
describe('AbstractEventProxy off() with scoped handlers', () => {
    let eventsProxy: TestEventProxy;
    const source = scopedSource('roads', 'roadLabel-major', 'water');

    beforeEach(() => {
        eventsProxy = new TestEventProxy();
    });

    test('off removes a scoped handler, not just the unscoped ones', () => {
        eventsProxy.addEventHandler(source, () => 'scoped', 'click', { owner, scope: roadLabelsOnly });

        eventsProxy.remove(source, 'click', owner);

        expect(eventsProxy.handlersFor(['click'], 'roadLabel-major')).toHaveLength(0);
        expect(eventsProxy.interactiveLayers).toEqual([]);
    });

    test('off removes scoped and unscoped handlers over the same source together', () => {
        eventsProxy.addEventHandler(source, () => 'scoped', 'click', { owner, scope: roadLabelsOnly });
        eventsProxy.addEventHandler(source, () => 'all', 'click', { owner });

        eventsProxy.remove(source, 'click', owner);

        expect(eventsProxy.handlersFor(['click'], 'roadLabel-major')).toHaveLength(0);
        expect(eventsProxy.handlersFor(['click'], 'water')).toHaveLength(0);
    });
});
