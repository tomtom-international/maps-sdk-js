import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { matchesAnyLayerSelector, matchesLayerSelector, metadataGroupOf } from '../layerSelector';

const layer = (partial: Partial<LayerSpecification> & { id: string; type: LayerSpecification['type'] }) =>
    partial as LayerSpecification;

const exitNumbers = layer({
    id: 'TransitLabels - Exit Number',
    type: 'symbol',
    source: 'vectorTiles',
    'source-layer': 'roads_points',
    metadata: { group: 'road_label' },
});
const roadName = layer({
    id: 'TransitLabels - Road',
    type: 'symbol',
    source: 'vectorTiles',
    'source-layer': 'roads',
    metadata: { group: 'road_label' },
});
const motorway = layer({
    id: 'Surface - Motorway & Trunk',
    type: 'line',
    source: 'vectorTiles',
    'source-layer': 'roads',
    metadata: { group: 'road' },
});

describe('matchesLayerSelector', () => {
    test('every given constraint must hold', () => {
        expect(matchesLayerSelector({ metadataGroups: ['road_label'] }, exitNumbers)).toBe(true);
        expect(matchesLayerSelector({ metadataGroups: ['road_label'], layerTypes: ['line'] }, exitNumbers)).toBe(false);
        expect(matchesLayerSelector({ metadataGroups: ['road_label'], idIncludes: ['exit'] }, exitNumbers)).toBe(true);
        expect(matchesLayerSelector({ metadataGroups: ['road_label'], idIncludes: ['exit'] }, roadName)).toBe(false);
        expect(matchesLayerSelector({ metadataGroups: ['road_label'], idExcludes: ['exit'] }, exitNumbers)).toBe(false);
        expect(matchesLayerSelector({ sources: ['vectorTiles'], sourceLayers: ['roads_points'] }, exitNumbers)).toBe(
            true,
        );
        expect(matchesLayerSelector({ sourceLayers: ['roads_points'] }, roadName)).toBe(false);
    });

    test('id fragments match case-insensitively', () => {
        expect(matchesLayerSelector({ idIncludes: ['MOTORWAY'] }, motorway)).toBe(true);
        expect(matchesLayerSelector({ idExcludes: ['trunk'] }, motorway)).toBe(false);
    });

    test('an empty selector matches everything; a group constraint needs a group', () => {
        expect(matchesLayerSelector({}, motorway)).toBe(true);
        expect(matchesLayerSelector({ metadataGroups: ['road'] }, layer({ id: 'bare', type: 'line' }))).toBe(false);
    });

    test('matchesAnyLayerSelector is the union', () => {
        const selectors = [{ idIncludes: ['exit'] }, { metadataGroups: ['road'] }];
        expect(matchesAnyLayerSelector(selectors, exitNumbers)).toBe(true);
        expect(matchesAnyLayerSelector(selectors, motorway)).toBe(true);
        expect(matchesAnyLayerSelector(selectors, roadName)).toBe(false);
    });

    test('metadataGroupOf reads only a string group', () => {
        expect(metadataGroupOf(motorway)).toBe('road');
        expect(metadataGroupOf(layer({ id: 'x', type: 'line', metadata: { group: 3 } }))).toBeUndefined();
        expect(metadataGroupOf(layer({ id: 'x', type: 'line' }))).toBeUndefined();
    });
});
