import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { MAP_MEDIUM_FONT } from '../../../shared/layers/commonLayerProps';
import poiLayerSpec from '../../tests/poiLayerSpec.data.json';
import {
    buildPlacesLayerSpecs,
    clickedPlaceLayerSpec,
    getTextSizeSpec,
    placesLayerSpec,
    selectedPlaceLayerSpec,
} from '../placesLayers';

describe('Get places layer spec with circle or pin icon style config', () => {
    const mapLibreMock = jest.fn() as unknown as Map;

    test('Get places layer spec no config', () => {
        expect(buildPlacesLayerSpecs(undefined, 'placesSymbols-2', mapLibreMock)).toEqual([
            {
                ...placesLayerSpec,
                id: 'placesSymbols-2-main',
            },
            {
                ...selectedPlaceLayerSpec,
                id: 'placesSymbols-2-selected',
            },
        ]);
    });

    test('Get places layer spec with circle icon style config', () => {
        expect(
            buildPlacesLayerSpecs({ iconConfig: { iconStyle: 'circle' } }, 'placesSymbols-foo', mapLibreMock),
        ).toEqual([
            {
                ...placesLayerSpec,
                id: 'placesSymbols-foo-main',
            },
            {
                ...selectedPlaceLayerSpec,
                id: 'placesSymbols-foo-selected',
            },
        ]);
    });

    test('Get places layer spec with pin icon style config', () => {
        expect(buildPlacesLayerSpecs({ iconConfig: { iconStyle: 'pin' } }, 'placesSymbols-0', mapLibreMock)).toEqual([
            {
                ...placesLayerSpec,
                id: 'placesSymbols-0-main',
            },
            {
                ...selectedPlaceLayerSpec,
                id: 'placesSymbols-0-selected',
            },
        ]);
    });

    test('Get places layer spec with text config', () => {
        expect(
            buildPlacesLayerSpecs(
                {
                    iconConfig: { iconStyle: 'pin' },
                    textConfig: {
                        textSize: 5,
                        textField: ['get', 'name'],
                        textFont: [MAP_MEDIUM_FONT],
                        textOffset: [0, 1],
                        textColor: 'red',
                        textHaloColor: 'white',
                        textHaloWidth: 1,
                    },
                },
                'placesSymbols-0',
                mapLibreMock,
            ),
        ).toEqual([
            {
                ...placesLayerSpec,
                id: 'placesSymbols-0-main',
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
            {
                ...selectedPlaceLayerSpec,
                id: 'placesSymbols-0-selected',
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
        ]);
    });

    test('Get places layer spec with function text field config', () => {
        expect(
            buildPlacesLayerSpecs(
                {
                    textConfig: {
                        textField: (place) => place.properties.poi?.name ?? 'No name found',
                        textColor: 'green',
                    },
                },
                'placesSymbols-12',
                mapLibreMock,
            ),
        ).toEqual([
            {
                ...placesLayerSpec,
                id: 'placesSymbols-12-main',
                paint: {
                    ...placesLayerSpec.paint,
                    'text-color': 'green',
                },
            },
            {
                ...selectedPlaceLayerSpec,
                id: 'placesSymbols-12-selected',
                paint: {
                    ...selectedPlaceLayerSpec.paint,
                    'text-color': 'green',
                },
            },
        ]);
    });
});

describe('Get places layer spec with poi-like icon style config', () => {
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
        getStyle: jest.fn().mockReturnValue({ layers: [poiLayerSpec] }),
    } as unknown as Map;

    test('Get places layer spec with poi-like icon style config', () => {
        expect(
            buildPlacesLayerSpecs({ iconConfig: { iconStyle: 'poi-like' } }, 'placesSymbols-blah', mapLibreMock),
        ).toEqual([
            {
                filter: ['!', ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]]],
                id: 'placesSymbols-blah-main',
                type: 'symbol',
                paint: { ...poiLayerSpec.paint },
                layout: {
                    ...poiLayerSpec.layout,
                    'text-field': ['get', 'title'],
                    'icon-image': ['get', 'iconID'],
                    'text-size': placesTextSizeSpec,
                },
            },
            {
                ...clickedPlaceLayerSpec,
                id: 'placesSymbols-blah-selected',
            },
        ]);
    });
});
