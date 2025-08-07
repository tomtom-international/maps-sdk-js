import type { CommonPlaceProps, Place, Places, POICategory } from '@anw/maps-sdk-js/core';
import type { Map } from 'maplibre-gl';
import { describe, expect, test, vi } from 'vitest';
import { MAP_MEDIUM_FONT } from '../../shared/layers/commonLayerProps';
import {
    getIconIDForPlace,
    getPOILayerCategoryForPlace,
    preparePlacesForDisplay,
    toPlaces,
} from '../preparePlacesForDisplay';

describe('toPlaces tests', () => {
    const testPlace0: Place = {
        id: 'something0',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 10] },
        properties: {} as CommonPlaceProps,
    };

    const testPlace1: Place = {
        id: 'something1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [1, 11] },
        properties: {} as CommonPlaceProps,
    };

    test('toPlaces with array', () => {
        expect(toPlaces([])).toEqual({ type: 'FeatureCollection', features: [] });
        expect(toPlaces([testPlace0])).toEqual({ type: 'FeatureCollection', features: [testPlace0] });
        expect(toPlaces([testPlace0, testPlace1])).toEqual({
            type: 'FeatureCollection',
            features: [testPlace0, testPlace1],
        });
    });

    test('toPlaces with single feature', () => {
        expect(toPlaces(testPlace0)).toEqual({ type: 'FeatureCollection', features: [testPlace0] });
    });

    test('toPlaces with FeatureCollection', () => {
        const testFeatureCollection0: Places = { type: 'FeatureCollection', features: [] };
        expect(toPlaces(testFeatureCollection0)).toBe(testFeatureCollection0);
        const testFeatureCollection1: Places = { type: 'FeatureCollection', features: [testPlace0, testPlace1] };
        expect(toPlaces(testFeatureCollection1)).toBe(testFeatureCollection1);
    });
});

describe('Get Icon ID for a given Place tests', () => {
    test('Get Icon ID for a given Place', () => {
        expect(getIconIDForPlace({ properties: {} } as Place)).toEqual('default_pin');
        expect(getIconIDForPlace({ properties: { poi: { classifications: [{ code: 'HOSPITAL' }] } } } as Place)).toBe(
            'poi-hospital',
        );
        expect(
            getIconIDForPlace({
                properties: { poi: { classifications: [{ code: 'UNKNOWN' as POICategory }] } },
            } as Place),
        ).toBe('poi-unknown');
    });

    test('Get Icon ID for a given Place with custom config', () => {
        const mapLibreMock = {
            loadImage: vi.fn().mockResolvedValue(vi.fn()),
            addImage: vi.fn(),
            hasImage: vi.fn().mockReturnValue(false),
        } as unknown as Map;

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: 'RESTAURANT' }] } } } as Place, {
                iconConfig: { iconStyle: 'circle' },
            }),
        ).toBe('poi-restaurant');

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: 'BEACH' }] } } } as Place, {
                iconConfig: { iconStyle: 'poi-like' },
            }),
        ).toBe('poi-beach');

        expect(
            getIconIDForPlace(
                { properties: { poi: { classifications: [{ code: 'RESTAURANT' }] } } } as Place,
                {
                    iconConfig: { customIcons: [{ iconUrl: 'https://test.com', category: 'RESTAURANT' }] },
                },
                mapLibreMock,
            ),
        ).toBe('restaurant');

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: 'RESTAURANT' }] } } } as Place, {
                iconConfig: { customIcons: [{ iconUrl: 'https://test.com', category: 'RESTAURANT' }] },
            }),
        ).toBe('poi-restaurant');

        expect(
            getIconIDForPlace({ properties: { poi: { classifications: [{ code: 'CAFE_PUB' }] } } } as Place, {
                iconConfig: { customIcons: [{ iconUrl: 'https://test.com', category: 'RESTAURANT' }] },
            }),
        ).toBe('poi-cafe');
    });
});

describe('Get mapped poi layer category for a place', () => {
    test('Get mapped poi layer category for a place', () => {
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: 'RESTAURANT' }] } },
            } as Place),
        ).toBe('restaurant');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: 'CAFE_PUB' }] } },
            } as Place),
        ).toBe('cafe');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: 'PHARMACY' }] } },
            } as Place),
        ).toBe('pharmacy');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { classifications: [{ code: 'HOTEL_MOTEL' }] } },
            } as Place),
        ).toBe('hotel_or_motel');
        expect(getPOILayerCategoryForPlace({ properties: {} } as Place)).toBeUndefined();
    });
});

describe('test prepare places for display', () => {
    const mapLibreMock = vi.fn() as unknown as Map;
    const places: Places = {
        type: 'FeatureCollection',
        features: [
            {
                id: '123',
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {
                    type: 'POI',
                    poi: {
                        name: 'test',
                        phone: '+31000099999',
                    },
                    address: {
                        freeformAddress: 'address test',
                    },
                },
            },
        ],
    };

    test('prepare places for display for single place', () => {
        expect(preparePlacesForDisplay(places.features[0], mapLibreMock)).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    id: '123',
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0], bbox: undefined },
                    properties: {
                        id: '123',
                        iconID: 'default_pin',
                        title: 'test',
                        type: 'POI',
                        poi: { name: 'test', phone: '+31000099999' },
                        address: { freeformAddress: 'address test' },
                    },
                },
            ],
        });
    });

    const getPhoneFun = (place: Place) => place.properties.poi?.phone;

    test('prepare places for display with config', () => {
        expect(
            preparePlacesForDisplay(places, mapLibreMock, {
                iconConfig: { iconStyle: 'pin' },
                textConfig: {
                    textSize: 5,
                    textField: ['get', 'name'],
                    textFont: [MAP_MEDIUM_FONT],
                },
                extraFeatureProps: {
                    phone: getPhoneFun,
                    staticProp: 'Static text',
                },
            }),
        ).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    id: '123',
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0], bbox: undefined },
                    properties: {
                        id: '123',
                        iconID: 'default_pin',
                        title: 'test',
                        phone: '+31000099999',
                        staticProp: 'Static text',
                        type: 'POI',
                        poi: { name: 'test', phone: '+31000099999' },
                        address: { freeformAddress: 'address test' },
                    },
                },
            ],
        });
    });

    test('prepare places for display with function text field config', () => {
        expect(
            preparePlacesForDisplay(places, mapLibreMock, {
                iconConfig: { iconStyle: 'poi-like' },
                textConfig: {
                    textSize: 5,
                    textField: (place) => place.properties.poi?.url ?? 'No url found',
                    textFont: [MAP_MEDIUM_FONT],
                },
            }),
        ).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    id: '123',
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0],
                        bbox: undefined,
                    },
                    properties: {
                        id: '123',
                        iconID: 'default_pin',
                        title: 'No url found',
                        category: undefined,
                        type: 'POI',
                        poi: {
                            name: 'test',
                            phone: '+31000099999',
                        },
                        address: {
                            freeformAddress: 'address test',
                        },
                    },
                },
            ],
        });
    });
});
