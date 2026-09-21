import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, test } from 'vitest';
import { buildLayerGroupFilter, groupBaseMapLayers } from '../layerGroups';
import { baseMapLayerGroupNames } from '../types/baseMapModuleConfig';

describe('Tests for logic related to layer group filtering', () => {
    // Representative layers from the TomTom base-map style, each carrying the
    // `metadata.group` the matcher classifies on.
    const layer = (id: string, type: LayerSpecification['type'], group: string) =>
        ({ id, type, metadata: { group } }) as unknown as LayerSpecification;

    const testLayers = [
        layer('background', 'background', 'background'),
        layer('LULC - Built-up area', 'fill', 'area'),
        layer('LULC - Landcover', 'fill', 'area'),
        layer('Water - Fill', 'fill', 'water'),
        layer('Water - Line', 'line', 'water'),
        layer('NatureLabels - River line', 'symbol', 'label'),
        layer('Surface - Motorway & Trunk', 'line', 'road'),
        layer('Surface - Road arrow', 'symbol', 'road'),
        layer('Surface - Path', 'line', 'road'),
        layer('Surface - Track', 'line', 'road'),
        layer('Tunnel - Subway', 'line', 'road'),
        layer('Surface - Railway outline', 'line', 'road'),
        layer('Bridge - Aerialway', 'line', 'road'),
        layer('Surface - Ferry', 'line', 'road'),
        layer('Areas - Pedestrian', 'fill', 'road_area'),
        layer('Transit - Aeroway area', 'fill', 'transit_area'),
        layer('Structure - Bridge & Pier line', 'line', 'transit_area'),
        layer('Buildings - Outline', 'line', 'building'),
        layer('3D - Building', 'fill-extrusion', 'area_3d'),
        layer('House Number', 'symbol', 'address_point_label'),
        layer('Borders - Country', 'line', 'border'),
        layer('Borders - Overlays', 'line', 'border'),
        layer('Borders - Transport', 'fill', 'border'),
        layer('Borders - Treaty label', 'symbol', 'border_label'),
        layer('TransitLabels - Road', 'symbol', 'road_label'),
        layer('TransitLabels - Route Shield 1', 'symbol', 'road_label'),
        layer('Places - Label point', 'symbol', 'places_label'),
        layer('Places - Neighbourhood', 'symbol', 'places_label'),
        layer('Places - Village / Hamlet', 'symbol', 'places_label'),
        layer('Places - Town', 'symbol', 'places_label'),
        layer('Places - City', 'symbol', 'places_label'),
        layer('Places - Capital', 'symbol', 'places_label'),
        layer('Places - State name', 'symbol', 'places_label'),
        layer('Places - Country name', 'symbol', 'places_label'),
    ];

    const idsFor = (...names: Parameters<typeof buildLayerGroupFilter>[0]['names']) =>
        testLayers.filter(buildLayerGroupFilter({ mode: 'include', names })).map((layer) => layer.id);

    test('classifies surfaces and nature by metadata group', () => {
        // 'background' folds into 'land'.
        expect(idsFor('land')).toEqual(['background', 'LULC - Built-up area', 'LULC - Landcover']);
        expect(idsFor('water')).toEqual(['Water - Fill', 'Water - Line']);
        expect(idsFor('natureLabels')).toEqual(['NatureLabels - River line']);
    });

    test('splits the road metadata group into road / rail / ferry', () => {
        // 'roads' absorbs paths, tracks and road/transit surface areas.
        expect(idsFor('roads')).toEqual([
            'Surface - Motorway & Trunk',
            'Surface - Road arrow',
            'Surface - Path',
            'Surface - Track',
            'Areas - Pedestrian',
            'Transit - Aeroway area',
            'Structure - Bridge & Pier line',
        ]);
        expect(idsFor('railways')).toEqual(['Tunnel - Subway', 'Surface - Railway outline', 'Bridge - Aerialway']);
        expect(idsFor('ferries')).toEqual(['Surface - Ferry']);
    });

    test('separates 2D and 3D buildings by geometry type', () => {
        expect(idsFor('buildings2D')).toEqual(['Buildings - Outline']);
        expect(idsFor('buildings3D')).toEqual(['3D - Building']);
    });

    test('borders covers admin boundaries, overlays and labels', () => {
        expect(idsFor('borders')).toEqual([
            'Borders - Country',
            'Borders - Overlays',
            'Borders - Transport',
            'Borders - Treaty label',
        ]);
    });

    test('keeps road labels and shields apart', () => {
        expect(idsFor('roadLabels')).toEqual(['TransitLabels - Road']);
        expect(idsFor('roadShields')).toEqual(['TransitLabels - Route Shield 1']);
        expect(idsFor('houseNumbers')).toEqual(['House Number']);
    });

    test('splits the places hierarchy into one group per level', () => {
        // `allPlaceLabels` is the superset of the whole `places_label` group.
        expect(idsFor('allPlaceLabels')).toEqual([
            'Places - Label point',
            'Places - Neighbourhood',
            'Places - Village / Hamlet',
            'Places - Town',
            'Places - City',
            'Places - Capital',
            'Places - State name',
            'Places - Country name',
        ]);
        expect(idsFor('smallerTownLabels')).toEqual([
            'Places - Neighbourhood',
            'Places - Village / Hamlet',
            'Places - Town',
        ]);
        expect(idsFor('cityLabels')).toEqual(['Places - City']);
        expect(idsFor('capitalLabels')).toEqual(['Places - Capital']);
        expect(idsFor('stateLabels')).toEqual(['Places - State name']);
        expect(idsFor('countryLabels')).toEqual(['Places - Country name']);
    });

    test('include mode with no groups matches nothing', () => {
        expect(idsFor()).toEqual([]);
    });

    test('exclude mode is the complement of include', () => {
        const excludeRoads = testLayers
            .filter(buildLayerGroupFilter({ mode: 'exclude', names: ['roads'] }))
            .map((layer) => layer.id);
        expect(excludeRoads).not.toContain('Surface - Motorway & Trunk');
        expect(excludeRoads).not.toContain('Surface - Road arrow');
        expect(excludeRoads).toContain('Surface - Ferry');
        expect(excludeRoads).toContain('Water - Fill');
    });

    describe('groupBaseMapLayers', () => {
        const grouped = groupBaseMapLayers(testLayers);

        test('returns an entry for every layer group', () => {
            expect(Object.keys(grouped).sort((a, b) => a.localeCompare(b))).toEqual(
                [...baseMapLayerGroupNames].sort((a, b) => a.localeCompare(b)),
            );
        });

        test('classifies each group the same as the include filter', () => {
            for (const group of baseMapLayerGroupNames) {
                const viaFilter = testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: [group] }));
                expect(grouped[group]).toEqual(viaFilter.map((layer) => layer.id));
            }
        });

        test('overlapping groups share layer ids', () => {
            // A city label is in both its own group and the place-labels superset.
            expect(grouped.cityLabels).toEqual(['Places - City']);
            expect(grouped.allPlaceLabels).toContain('Places - City');
        });
    });
});
