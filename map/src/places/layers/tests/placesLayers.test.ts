import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { MAP_MEDIUM_FONT } from '../../../shared/layers/commonLayerProps';
import { getTextSizeSpec } from '../../utils/layerSpecBuilders';
import { buildPlacesLayerSpecs, hasEventState, pinLayerSpec, selectedPinLayerSpec } from '../placesLayers';
import poiLayerSpec from './poiLayerSpec.data';

describe('Get places layer spec with circle or pin icon style config', () => {
    const mapLibreMock = vi.fn() as unknown as Map;

    test('Get places layer spec no config', () => {
        expect(buildPlacesLayerSpecs(undefined, mapLibreMock, 'light', 0)).toEqual({
            main: {
                ...pinLayerSpec,
                layout: {
                    ...pinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
            selected: {
                ...selectedPinLayerSpec,
                layout: {
                    ...selectedPinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.875], 'left', [1.75, -1.75], 'right', [-1.75, -1.75]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
        });
    });

    test('Get places layer spec with circle icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'circle' }, mapLibreMock, 'light', 0)).toEqual({
            main: {
                ...pinLayerSpec,
                layout: {
                    ...pinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
            selected: {
                ...selectedPinLayerSpec,
                layout: {
                    ...selectedPinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.875], 'left', [1.75, -1.75], 'right', [-1.75, -1.75]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
        });
    });

    test('Get places layer spec with pin icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'pin' }, mapLibreMock, 'light', 0)).toEqual({
            main: {
                ...pinLayerSpec,
                layout: {
                    ...pinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
            selected: {
                ...selectedPinLayerSpec,
                layout: {
                    ...selectedPinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.875], 'left', [1.75, -1.75], 'right', [-1.75, -1.75]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
            },
        });
    });

    test('Get places layer spec with text config', () => {
        expect(
            buildPlacesLayerSpecs(
                {
                    theme: 'pin',
                    text: {
                        size: 5,
                        title: ['get', 'name'],
                        font: [MAP_MEDIUM_FONT],
                        offset: [0, 1],
                        color: 'red',
                        haloColor: 'white',
                        haloWidth: 1,
                    },
                },
                mapLibreMock,
                'light',
                0,
            ),
        ).toEqual({
            main: {
                filter: ['!', hasEventState],
                type: 'symbol',
                layout: {
                    'icon-image': ['get', 'iconID'],
                    'icon-anchor': 'bottom',
                    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 22, 0.8],
                    'icon-allow-overlap': true,
                    'icon-padding': 0,
                    'text-optional': true,
                    'text-font': [MAP_MEDIUM_FONT],
                    'text-field': ['get', 'name'],
                    'text-justify': 'auto',
                    'text-variable-anchor': ['top', 'left', 'right'],
                    'text-size': 5,
                    'text-padding': 5,
                    'text-offset': [0, 1],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-color': 'red',
                    'text-halo-color': 'white',
                    'text-halo-width': 1,
                },
            },
            selected: {
                filter: hasEventState,
                type: 'symbol',
                layout: {
                    'icon-image': ['get', 'iconID'],
                    'icon-anchor': 'bottom',
                    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 22, 1],
                    'icon-allow-overlap': true,
                    'icon-padding': 0,
                    'text-optional': true,
                    'text-font': [MAP_MEDIUM_FONT],
                    'text-field': ['get', 'name'],
                    'text-justify': 'auto',
                    'text-variable-anchor': ['top', 'left', 'right'],
                    'text-size': 5,
                    'text-padding': 5,
                    'text-offset': [0, 1],
                    'text-allow-overlap': true,
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-color': 'red',
                    'text-halo-color': 'white',
                    'text-halo-width': 1,
                },
            },
        });
    });

    test('Get places layer spec with function text field config', () => {
        expect(
            buildPlacesLayerSpecs(
                {
                    text: {
                        title: (place) => place.properties.poi?.name ?? 'No name found',
                        color: 'green',
                    },
                },
                mapLibreMock,
                'light',
                0,
            ),
        ).toEqual({
            main: {
                ...pinLayerSpec,
                layout: {
                    ...pinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-color': 'green',
                },
            },
            selected: {
                ...selectedPinLayerSpec,
                layout: {
                    ...selectedPinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.875], 'left', [1.75, -1.75], 'right', [-1.75, -1.75]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-color': 'green',
                },
            },
        });
    });
});

describe('Get places layer spec with base-map icon style config', () => {
    const placesTextSizeSpec = [
        'step',
        ['zoom'],
        ['/', 14, ['log10', ['max', ['length', ['get', 'title']], 30]]],
        10,
        ['/', 16, ['log10', ['max', ['length', ['get', 'title']], 30]]],
    ];

    test('Get places text size specs from poi layer', () => {
        expect(
            getTextSizeSpec(poiLayerSpec.layout['text-size'] as DataDrivenPropertyValueSpecification<number>),
        ).toStrictEqual(placesTextSizeSpec);
    });

    const mapLibreMock = {
        getStyle: vi.fn().mockReturnValue({ layers: [poiLayerSpec] }),
    } as unknown as Map;

    test('Get places layer spec with base-map icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'base-map' }, mapLibreMock, 'light', 0)).toEqual({
            main: {
                filter: ['!', ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]]],
                type: 'symbol',
                paint: {
                    ...poiLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
                layout: {
                    ...poiLayerSpec.layout,
                    'text-field': ['get', 'title'],
                    'icon-image': ['get', 'iconID'],
                    'text-size': placesTextSizeSpec,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
            },
            selected: {
                filter: hasEventState,
                type: 'symbol',
                paint: {
                    ...poiLayerSpec.paint,
                    'text-color': '#333333',
                    'text-halo-color': '#FFFFFF',
                },
                layout: {
                    ...poiLayerSpec.layout,
                    'text-field': ['get', 'title'],
                    'icon-image': ['get', 'iconID'],
                    'text-size': placesTextSizeSpec,
                    'text-allow-overlap': true,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
            },
        });
    });
});
