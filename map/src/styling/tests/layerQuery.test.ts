import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import type { LayerFilterComposer, LayerFilterTransform } from '../../shared/layers/layerFilterComposer';
import { LayerOverrides, LayerSelection } from '../layerQuery';
import { orbisStreetLightLayers } from './data/orbisStreetLightLayers.data';

const sources = { vectorTiles: { type: 'vector' } };

const makeRegistry = (layers: LayerSpecification[] = orbisStreetLightLayers) => {
    const current = new Map<string, unknown>();
    const mapLibre = {
        getLayer: vi.fn((id: string) => layers.find((layer) => layer.id === id)),
        // `fill-opacity` stands for a property the style leaves unset.
        getPaintProperty: vi.fn((id: string, property: string) => {
            const key = `${id}|paint|${property}`;
            if (current.has(key)) return current.get(key);

            return property === 'fill-opacity' ? undefined : `pristine ${property}`;
        }),
        getLayoutProperty: vi.fn(
            (id: string, property: string) => current.get(`${id}|layout|${property}`) ?? 'visible',
        ),
        setPaintProperty: vi.fn((id: string, property: string, value: unknown) =>
            current.set(`${id}|paint|${property}`, value),
        ),
        setLayoutProperty: vi.fn((id: string, property: string, value: unknown) =>
            current.set(`${id}|layout|${property}`, value),
        ),
    };
    const composer = {
        setTransform: vi.fn<(layerId: string, contributor: string, transform?: LayerFilterTransform) => void>(),
    };
    const warn = vi.fn();
    const registry = new LayerOverrides(
        mapLibre as unknown as MapLibreMap,
        composer as unknown as LayerFilterComposer,
        warn,
    );
    registry.index(layers, sources);
    return { registry, mapLibre, composer, current, warn };
};

describe('LayerSelection over LayerOverrides', () => {
    test('a query resolves through the base-map taxonomy and narrows by type and id', () => {
        const { registry } = makeRegistry();
        expect(new LayerSelection(registry, { group: 'roadShields' }).layerIds).toEqual([
            'TransitLabels - Route Shield 4',
            'TransitLabels - Route Shield 3',
            'TransitLabels - Route Shield 2',
            'TransitLabels - Route Shield 1',
        ]);
        expect(
            new LayerSelection(registry, { group: 'roads', idIncludes: ['motorway'], layerTypes: ['line'] }).layerIds,
        ).toEqual(['Surface - Motorway & Trunk outline', 'Surface - Motorway & Trunk']);
        expect(new LayerSelection(registry, { metadataGroups: ['water'], layerTypes: ['line'] }).layerIds).toEqual([
            'Water - Line',
        ]);
    });

    test("a query's constraints narrow the group's, never widen or replace them", () => {
        const { registry } = makeRegistry();
        expect(new LayerSelection(registry, { group: 'railways', idIncludes: ['subway'] }).layerIds).toEqual([
            'Tunnel - Subway',
        ]);
        expect(new LayerSelection(registry, { group: 'roads', metadataGroups: ['water'] }).layerIds).toEqual([]);
    });

    test('an empty match warns under one key (so the module reports it once) and applies nothing', () => {
        const { registry, mapLibre, warn } = makeRegistry();
        const selection = new LayerSelection(registry, { idIncludes: ['no such layer'] });
        selection.setPaint({ 'line-color': 'red' });
        selection.setVisible(false);
        expect(new Set(warn.mock.calls.map((call) => call[0])).size).toBe(1);
        expect(warn.mock.calls[0][1]).toMatch(/matches no layer/);
        expect(mapLibre.setPaintProperty).not.toHaveBeenCalled();
    });

    test('overrides apply to every matched layer, remember what they replaced, and reset restores it', () => {
        const { registry, mapLibre } = makeRegistry();
        const labels = new LayerSelection(registry, { group: 'roadLabels' });
        labels.setPaint({ 'text-color': '#93c5fd' }).setVisible(false);

        for (const layerId of labels.layerIds) {
            expect(mapLibre.setPaintProperty).toHaveBeenCalledWith(layerId, 'text-color', '#93c5fd', {
                validate: false,
            });
            expect(mapLibre.setLayoutProperty).toHaveBeenCalledWith(layerId, 'visibility', 'none', { validate: false });
        }

        labels.reset();
        expect(mapLibre.setPaintProperty).toHaveBeenLastCalledWith(
            expect.any(String),
            'text-color',
            'pristine text-color',
            {
                validate: false,
            },
        );
        expect(mapLibre.setLayoutProperty).toHaveBeenLastCalledWith(expect.any(String), 'visibility', 'visible', {
            validate: false,
        });
    });

    test('reset after repeated overrides restores the value the style had, even when it left it unset', () => {
        const { registry, mapLibre } = makeRegistry();
        const water = new LayerSelection(registry, { idIncludes: ['water - fill'] });
        water.setPaint({ 'fill-opacity': 0.5 }).setPaint({ 'fill-opacity': 0.8 }).reset();
        expect(mapLibre.setPaintProperty).toHaveBeenLastCalledWith('Water - Fill', 'fill-opacity', undefined, {
            validate: false,
        });
    });

    test('reapply re-reads what it replaces on the new style and lands the override again; clear forgets', () => {
        const { registry, mapLibre } = makeRegistry();
        new LayerSelection(registry, { idIncludes: ['water - fill'] }).setPaint({ 'fill-opacity': 0.5 });
        mapLibre.setPaintProperty.mockClear();

        registry.reapply();
        expect(mapLibre.setPaintProperty).toHaveBeenCalledWith('Water - Fill', 'fill-opacity', 0.5, {
            validate: false,
        });

        registry.clear();
        mapLibre.setPaintProperty.mockClear();
        registry.reapply();
        expect(mapLibre.setPaintProperty).not.toHaveBeenCalled();
    });

    test('reapply on the same style keeps what an override replaced, so a later reset still restores it', () => {
        // What `styling.reset()`, `applyPreset` and `setMapColors` do: re-apply over the edited style.
        const { registry, mapLibre } = makeRegistry();
        const water = new LayerSelection(registry, { idIncludes: ['water - fill'] });
        water.setPaint({ 'fill-opacity': 0.5 });

        registry.reapply();
        water.reset();

        expect(mapLibre.setPaintProperty).toHaveBeenLastCalledWith('Water - Fill', 'fill-opacity', undefined, {
            validate: false,
        });
    });

    test('reapply takes a knob written under the override as what it replaces', () => {
        const { registry, mapLibre, current } = makeRegistry();
        const labels = new LayerSelection(registry, { idIncludes: ['water - fill'] });
        labels.setPaint({ 'fill-color': '#93c5fd' });
        current.set('Water - Fill|paint|fill-color', 'the knob colour');

        registry.reapply();
        labels.reset();

        expect(mapLibre.setPaintProperty).toHaveBeenLastCalledWith('Water - Fill', 'fill-color', 'the knob colour', {
            validate: false,
        });
    });

    test('a filter replaces the style filter through the shared composer, and reset withdraws it', () => {
        const { registry, composer } = makeRegistry();
        const water = new LayerSelection(registry, { idIncludes: ['water - fill'] });
        water.setFilter(['==', ['get', 'class'], 'lake']);

        const [layerId, contributor, transform] = composer.setTransform.mock.calls[0];
        expect([layerId, contributor]).toEqual(['Water - Fill', 'styling.layers']);
        expect(transform?.(['==', 'style', 'filter'])).toEqual(['==', ['get', 'class'], 'lake']);

        water.reset();
        expect(composer.setTransform).toHaveBeenLastCalledWith('Water - Fill', 'styling.layers', undefined);
    });
});
