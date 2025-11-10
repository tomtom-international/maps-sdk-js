import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { MAP_MEDIUM_FONT } from '../../../shared/layers/commonLayerProps';
import poiLayerSpec from '../../tests/poiLayerSpec.data.json';
import {
    buildPlacesLayerSpecs,
    getTextSizeSpec,
    hasEventState,
    placesLayerSpec,
    SELECTED_COLOR,
    selectedPlaceLayerSpec,
} from '../placesLayers';

describe('Get places layer spec with circle or pin icon style config', () => {
    const mapLibreMock = vi.fn() as unknown as Map;

    test('Get places layer spec no config', () => {
        expect(buildPlacesLayerSpecs(undefined, mapLibreMock)).toEqual({
            main: {
                ...placesLayerSpec,
            },
            selected: {
                ...selectedPlaceLayerSpec,
            },
        });
    });

    test('Get places layer spec with circle icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'circle' }, mapLibreMock)).toEqual({
            main: {
                ...placesLayerSpec,
            },
            selected: {
                ...selectedPlaceLayerSpec,
            },
        });
    });

    test('Get places layer spec with pin icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'pin' }, mapLibreMock)).toEqual({
            main: {
                ...placesLayerSpec,
            },
            selected: {
                ...selectedPlaceLayerSpec,
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
            ),
        ).toEqual({
            main: {
                ...placesLayerSpec,
                layout: {
                    ...placesLayerSpec.layout,
                    'text-size': 5,
                    'text-font': [MAP_MEDIUM_FONT],
                    'text-offset': [0, 1],
                    'text-field': ['get', 'name'],
                },
                paint: {
                    ...placesLayerSpec.paint,
                    'text-color': 'red',
                    'text-halo-color': 'white',
                    'text-halo-width': 1,
                },
            },
            selected: {
                ...selectedPlaceLayerSpec,
                layout: {
                    ...selectedPlaceLayerSpec.layout,
                    'text-size': 5,
                    'text-font': [MAP_MEDIUM_FONT],
                    'text-offset': [0, 1],
                    'text-field': ['get', 'name'],
                },
                paint: {
                    ...selectedPlaceLayerSpec.paint,
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
            ),
        ).toEqual({
            main: {
                ...placesLayerSpec,
                paint: {
                    ...placesLayerSpec.paint,
                    'text-color': 'green',
                },
            },
            selected: {
                ...selectedPlaceLayerSpec,
                paint: {
                    ...selectedPlaceLayerSpec.paint,
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
        expect(buildPlacesLayerSpecs({ theme: 'base-map' }, mapLibreMock)).toEqual({
            main: {
                filter: ['!', ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]]],
                type: 'symbol',
                paint: { ...poiLayerSpec.paint },
                layout: {
                    ...poiLayerSpec.layout,
                    'text-field': ['get', 'title'],
                    'icon-image': ['get', 'iconID'],
                    'text-size': placesTextSizeSpec,
                },
            },
            selected: {
                filter: hasEventState,
                type: 'symbol',
                paint: {
                    ...poiLayerSpec.paint,
                    'text-color': SELECTED_COLOR,
                },
                layout: {
                    ...poiLayerSpec.layout,
                    'text-field': ['get', 'title'],
                    'icon-image': ['get', 'iconID'],
                    'text-size': placesTextSizeSpec,
                    'text-allow-overlap': true,
                },
            },
        });
    });
});
