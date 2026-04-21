import type { DataDrivenPropertyValueSpecification, Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { MAP_MEDIUM_FONT } from '../../../shared/layers/commonLayerProps';
import { pinLayerBaseSpec } from '../../../shared/layers/symbolLayers';
import { getTextSizeSpec } from '../../utils/layerSpecBuilders';
import {
    buildPlacesLayerSpecs,
    hasEventState,
    pinLayerSpec,
    SELECTED_COLOR,
    selectedPinLayerSpec,
} from '../placesLayers';
import poiLayerSpec from './poiLayerSpec.data';

// Expected placeholder for the always-present `micro` layer when the active theme is
// not `base-map`. The layer stays registered but hidden via `layout.visibility = 'none'`,
// so `updateLayersAndSource` swaps in the real `base-map` micro spec via
// `setLayoutProperty` without adding/removing a layer on theme switches.
const hiddenMicroLayer = (
    paint: Record<string, unknown> = { 'text-color': '#333333', 'text-halo-color': '#FFFFFF' },
    layout: Record<string, unknown> = {},
) => ({
    type: 'symbol',
    beforeID: 'main',
    layout: { visibility: 'none', ...layout },
    paint,
});

describe('Get places layer spec with circle-icon or pin icon style config', () => {
    const mapLibreMock = vi.fn() as unknown as Map;

    test('Get places layer spec no config', () => {
        expect(buildPlacesLayerSpecs(undefined, mapLibreMock, 'light', 0)).toEqual({
            micro: hiddenMicroLayer(),
            main: {
                ...pinLayerSpec,
                beforeID: 'selected',
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
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-halo-color': '#FFFFFF',
                },
            },
        });
    });

    test('Get places layer spec with circle-icon style config', () => {
        // circle-icon theme reads icon properties from the live POI layer in the map style
        const circleMapMock = {
            getStyle: vi.fn().mockReturnValue({ layers: [poiLayerSpec] }),
        } as unknown as Map;

        // Expected layout: pinLayerBaseSpec overridden with POI icon props and forced center anchor
        // extractMaxIconScale({ stops: [[10, 0.7], [18, 1]] }) → 1.0
        // iconScaleMultiplier = 1.0 / 0.8 = 1.25; centered theme → vertical adjustment = 0
        const expectedLayout = {
            ...pinLayerBaseSpec.layout,
            'icon-anchor': 'center',
            'icon-size': poiLayerSpec.layout['icon-size'],
            'icon-padding': poiLayerSpec.layout['icon-padding'],
            'text-variable-anchor-offset': ['top', [0, 0.875], 'left', [1.75, 0], 'right', [-1.75, 0]],
        };
        const expectedMainPaint = {
            ...pinLayerBaseSpec.paint,
            'icon-translate': [0, 0],
            'text-color': '#333333',
            'text-halo-color': '#FFFFFF',
        };
        const expectedSelectedPaint = {
            ...pinLayerBaseSpec.paint,
            'icon-translate': [0, 0],
            'text-color': SELECTED_COLOR,
            'text-halo-color': '#FFFFFF',
        };

        expect(buildPlacesLayerSpecs({ theme: 'circle-icon' }, circleMapMock, 'light', 0)).toEqual({
            // circle-icon theme still uses the centered-theme text offset recalculation path,
            // so even the hidden micro placeholder carries the circle-icon-style offsets.
            micro: hiddenMicroLayer(
                { 'text-color': '#333333', 'text-halo-color': '#FFFFFF' },
                { 'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, 0], 'right', [-1.4, 0]] },
            ),
            main: {
                type: 'symbol',
                filter: ['!', hasEventState],
                beforeID: 'selected',
                layout: expectedLayout,
                paint: expectedMainPaint,
            },
            selected: {
                type: 'symbol',
                filter: hasEventState,
                layout: {
                    ...expectedLayout,
                    'text-allow-overlap': true,
                },
                paint: expectedSelectedPaint,
            },
        });
    });

    test('Get places layer spec with pin icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'pin' }, mapLibreMock, 'light', 0)).toEqual({
            micro: hiddenMicroLayer(),
            main: {
                ...pinLayerSpec,
                beforeID: 'selected',
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
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
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
                        offset: 1,
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
            // Hidden micro still receives the text config (size/font/field) via withConfig,
            // but its `visibility: 'none'` keeps it from rendering.
            micro: hiddenMicroLayer(
                { 'text-color': 'red', 'text-halo-color': 'white', 'text-halo-width': 1 },
                {
                    'text-font': [MAP_MEDIUM_FONT],
                    'text-size': 5,
                    'text-field': ['get', 'name'],
                    'text-variable-anchor-offset': ['top', [0, 1], 'left', [1, -1.4], 'right', [-1, -1.4]],
                },
            ),
            main: {
                filter: ['!', hasEventState],
                type: 'symbol',
                beforeID: 'selected',
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
                    'text-variable-anchor-offset': ['top', [0, 1], 'left', [1, -1.4], 'right', [-1, -1.4]],
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
                    'text-variable-anchor-offset': ['top', [0, 1], 'left', [1, -1.75], 'right', [-1, -1.75]],
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
            micro: hiddenMicroLayer({ 'text-color': 'green', 'text-halo-color': '#FFFFFF' }),
            main: {
                ...pinLayerSpec,
                beforeID: 'selected',
                layout: {
                    ...pinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...pinLayerSpec.paint,
                    'text-halo-color': '#FFFFFF',
                    'text-color': 'green',
                },
            },
            selected: {
                ...selectedPinLayerSpec,
                layout: {
                    ...selectedPinLayerSpec.layout,
                    'text-variable-anchor-offset': ['top', [0, 0.7], 'left', [1.4, -1.4], 'right', [-1.4, -1.4]],
                },
                paint: {
                    ...selectedPinLayerSpec.paint,
                    'text-halo-color': '#FFFFFF',
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

    const poiMicroLayerSpec = {
        id: 'POI - Micro',
        type: 'symbol',
        source: 'poiTiles',
        'source-layer': 'poi_extended',
        layout: {
            'icon-image': '{icon}',
            'icon-size': { stops: [[12, 0.5]] },
            'text-field': '{name}',
            'text-size': ['step', ['zoom'], ['/', 10, ['log10', ['max', ['length', ['get', 'name']], 20]]], 14, 12],
        },
        paint: {
            'icon-opacity': 0.9,
            'text-color': 'hsl(210, 2%, 60%)',
            'text-halo-color': 'hsl(0, 0%, 100%)',
            'text-halo-width': 1,
        },
    };

    const mapLibreMock = {
        getStyle: vi.fn().mockReturnValue({ layers: [poiLayerSpec, poiMicroLayerSpec] }),
    } as unknown as Map;

    // The main/selected POI-like layers override `icon-image` outright with `['get','iconID']`,
    // mapped via `preparePlacesForDisplay` to either the style's default `poi-<category>` sprite
    // or a custom `PlaceIconConfig.categoryIcons` sprite. The micro layer inherits the style's
    // `['get','group']`-driven expression verbatim — custom icons apply on `main` only.
    const mainIconImage = ['get', 'iconID'];
    const microIconImage = poiMicroLayerSpec.layout['icon-image'];

    test('Get places layer spec with base-map icon style config', () => {
        expect(buildPlacesLayerSpecs({ theme: 'base-map' }, mapLibreMock, 'light', 0)).toEqual({
            micro: {
                filter: ['!', ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]]],
                type: 'symbol',
                beforeID: 'main',
                minzoom: 0,
                paint: { ...poiMicroLayerSpec.paint, 'icon-opacity': 1 },
                layout: {
                    ...poiMicroLayerSpec.layout,
                    'icon-image': microIconImage,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                },
            },
            main: {
                filter: ['!', ['in', ['get', 'eventState'], ['literal', ['click', 'contextmenu']]]],
                type: 'symbol',
                beforeID: 'selected',
                paint: poiLayerSpec.paint,
                layout: {
                    ...poiLayerSpec.layout,
                    'icon-image': mainIconImage,
                    'text-field': ['get', 'title'],
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
                    'icon-image': mainIconImage,
                    'text-field': ['get', 'title'],
                    'text-size': placesTextSizeSpec,
                    'text-allow-overlap': true,
                },
            },
        });
    });
});
