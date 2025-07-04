import type { LayerSpecification } from 'maplibre-gl';
import { buildLayerGroupFilter } from '../layerGroups';

describe('Tests for logic related to layer group filtering', () => {
    const testLayers = [
        { id: 'Buildings - Outline', type: 'line' },
        { id: '3D - Building', type: 'fill-extrusion' },
        { id: 'LULC - Built-up area', type: 'fill' },
        { id: 'LULC - Earth Cover', type: 'fill' },
        { id: 'House Number', type: 'symbol' },
        { id: 'Places - City', type: 'symbol' },
        { id: 'Places - Capital', type: 'symbol' },
        { id: 'Places - State name', type: 'symbol' },
        { id: 'Places - Country name', type: 'symbol' },
        { id: 'Tunnel - Railway outline', type: 'line' },
        { id: 'TransitLabels - Road Shield 3', type: 'symbol' },
    ] as LayerSpecification[];

    test('build layer group filter in include mode', () => {
        // Include nothing:
        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: [] }))).toEqual([]);

        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: ['land'] }))).toEqual([
            { id: 'LULC - Built-up area', type: 'fill' },
            { id: 'LULC - Earth Cover', type: 'fill' },
        ]);

        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: ['buildings2D'] }))).toEqual([
            { id: 'Buildings - Outline', type: 'line' },
        ]);

        expect(
            testLayers.filter(
                buildLayerGroupFilter({ mode: 'include', names: ['houseNumbers', 'buildings2D', 'buildings3D'] }),
            ),
        ).toEqual([
            { id: 'Buildings - Outline', type: 'line' },
            { id: '3D - Building', type: 'fill-extrusion' },
            { id: 'House Number', type: 'symbol' },
        ]);

        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: ['placeLabels'] }))).toEqual([
            { id: 'Places - City', type: 'symbol' },
            { id: 'Places - Capital', type: 'symbol' },
            { id: 'Places - State name', type: 'symbol' },
            { id: 'Places - Country name', type: 'symbol' },
        ]);

        expect(
            testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: ['cityLabels', 'capitalLabels'] })),
        ).toEqual([
            { id: 'Places - City', type: 'symbol' },
            { id: 'Places - Capital', type: 'symbol' },
        ]);

        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'include', names: ['countryLabels'] }))).toEqual([
            { id: 'Places - Country name', type: 'symbol' },
        ]);
    });

    test('build layer group filter in exclude mode', () => {
        // Exclude nothing:
        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'exclude', names: [] }))).toEqual(testLayers);

        expect(testLayers.filter(buildLayerGroupFilter({ mode: 'exclude', names: ['buildings3D'] }))).toEqual([
            { id: 'Buildings - Outline', type: 'line' },
            { id: 'LULC - Built-up area', type: 'fill' },
            { id: 'LULC - Earth Cover', type: 'fill' },
            { id: 'House Number', type: 'symbol' },
            { id: 'Places - City', type: 'symbol' },
            { id: 'Places - Capital', type: 'symbol' },
            { id: 'Places - State name', type: 'symbol' },
            { id: 'Places - Country name', type: 'symbol' },
            { id: 'Tunnel - Railway outline', type: 'line' },
            { id: 'TransitLabels - Road Shield 3', type: 'symbol' },
        ]);

        expect(
            testLayers.filter(
                buildLayerGroupFilter({ mode: 'exclude', names: ['buildings2D', 'buildings3D', 'land'] }),
            ),
        ).toEqual([
            { id: 'House Number', type: 'symbol' },
            { id: 'Places - City', type: 'symbol' },
            { id: 'Places - Capital', type: 'symbol' },
            { id: 'Places - State name', type: 'symbol' },
            { id: 'Places - Country name', type: 'symbol' },
            { id: 'Tunnel - Railway outline', type: 'line' },
            { id: 'TransitLabels - Road Shield 3', type: 'symbol' },
        ]);

        expect(
            testLayers.filter(
                buildLayerGroupFilter({
                    mode: 'exclude',
                    names: ['buildings2D', 'buildings3D', 'land', 'placeLabels'],
                }),
            ),
        ).toEqual([
            { id: 'House Number', type: 'symbol' },
            { id: 'Tunnel - Railway outline', type: 'line' },
            { id: 'TransitLabels - Road Shield 3', type: 'symbol' },
        ]);
    });
});
