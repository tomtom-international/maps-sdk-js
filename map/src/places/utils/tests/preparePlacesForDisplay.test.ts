import type { CommonPlaceProps, Place, Places } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { MAP_MEDIUM_FONT } from '../../../shared/layers/commonLayerProps';
import {
    getIconIDForPlace,
    getPOIGroupForPlace,
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
        expect(getIconIDForPlace({ properties: {} } as Place, 0)).toEqual('default_place-0');
        expect(
            getIconIDForPlace(
                {
                    properties: { poi: {} },
                } as Place,
                0,
            ),
        ).toBe('default_place-0');
    });

    test('Get Icon ID for a given Place with custom config', () => {
        expect(
            getIconIDForPlace({ properties: { poi: { categories: ['RESTAURANT'] } } } as Place, 0, {
                theme: 'circle-icon',
            }),
        ).toBe('poi-restaurant');

        expect(
            getIconIDForPlace({ properties: { poi: { categories: ['BEACH'] } } } as Place, 0, {
                theme: 'base-map',
            }),
        ).toBe('poi-beach_resort');

        expect(
            getIconIDForPlace({ properties: { poi: { categories: ['RESTAURANT'] } } } as Place, 0, {
                icon: { categoryIcons: [{ image: 'https://test.com', id: 'RESTAURANT' }] },
            }),
        ).toBe('RESTAURANT-0');
    });

    test('Get Icon ID with imageID mapping', () => {
        const place = {
            properties: {
                poi: { name: 'Urgent Care', categories: ['HOSPITAL'] },
            },
        } as Place;

        expect(
            getIconIDForPlace(place, 0, {
                icon: {
                    mapping: {
                        to: 'imageID',
                        fn: (p) => (p.properties.poi?.name?.includes('Urgent') ? 'urgent-icon' : 'default-icon'),
                    },
                },
            }),
        ).toBe('urgent-icon');

        expect(
            getIconIDForPlace({ properties: { poi: { name: 'Regular Hospital' } } } as Place, 0, {
                icon: {
                    mapping: {
                        to: 'imageID',
                        fn: (p) => (p.properties.poi?.name?.includes('Urgent') ? 'urgent-icon' : 'default-icon'),
                    },
                },
            }),
        ).toBe('default-icon');
    });

    test('Get Icon ID with poiCategory mapping', () => {
        const place = {
            properties: {
                customCategory: 'RESTAURANT',
                poi: { categories: ['CAFE_PUB'] },
            },
        } as any;

        expect(
            getIconIDForPlace(place, 0, {
                icon: {
                    mapping: {
                        to: 'poiCategory',
                        fn: (p) => (p.properties as any).customCategory ?? 'CAFE_PUB',
                    },
                },
            }),
        ).toBe('7315');

        const placeWithoutCustom = {
            properties: {
                poi: { categories: ['HOTEL_MOTEL'] },
            },
        } as any;

        expect(
            getIconIDForPlace(placeWithoutCustom, 0, {
                icon: {
                    mapping: {
                        to: 'poiCategory',
                        fn: (p) => (p.properties as any).customCategory ?? 'HOTEL_MOTEL',
                    },
                },
            }),
        ).toBe('7314');

        expect(
            getIconIDForPlace(placeWithoutCustom, 0, {
                theme: 'base-map',
                icon: {
                    mapping: {
                        to: 'poiCategory',
                        fn: (p) => (p.properties as any).customCategory ?? 'HOTEL_MOTEL',
                    },
                },
            }),
        ).toBe('poi-hotel_or_motel');
    });
});

describe('Get mapped poi layer category for a place', () => {
    test('Get mapped poi layer category for a place', () => {
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { categories: ['RESTAURANT'] } },
            } as Place),
        ).toBe('restaurant');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { categories: ['CAFE_PUB'] } },
            } as Place),
        ).toBe('cafe');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { categories: ['PHARMACY'] } },
            } as Place),
        ).toBe('pharmacy');
        expect(
            getPOILayerCategoryForPlace({
                properties: { poi: { categories: ['HOTEL_MOTEL'] } },
            } as Place),
        ).toBe('hotel_or_motel');
        expect(getPOILayerCategoryForPlace({ properties: {} } as Place)).toBeUndefined();
    });

    test('honors icon.mapping override when provided', () => {
        // User data with no `poi.categories` — mapping is the only source for the category.
        const place = { properties: { address: { freeformAddress: 'A Building' } } } as Place;
        expect(
            getPOILayerCategoryForPlace(place, {
                icon: { mapping: { to: 'poiCategory', fn: () => 'COMPANY' } },
            }),
        ).toBe('commercial_area');
    });
});

describe('Get base map POI group for a place', () => {
    const placeWith = (category: string): Place =>
        ({ properties: { poi: { categories: [category] } } }) as unknown as Place;

    test.each([
        ['RESTAURANT', 'eat_and_drink'],
        ['CAFE_PUB', 'eat_and_drink'],
        ['PUB', 'eat_and_drink'],
        ['HOTEL_MOTEL', 'lodging'],
        ['CAMPING_GROUND', 'lodging'],
        ['AIRPORT', 'transport'],
        ['RAILWAY_STATION', 'transport'],
        ['GAS_STATION', 'driving'],
        ['ELECTRIC_VEHICLE_STATION', 'driving'],
        ['PARKING_GARAGE', 'parking'],
        ['HOSPITAL', 'healthcare'],
        ['PHARMACY', 'healthcare'],
        ['BANK', 'finance'],
        ['ATM', 'finance'],
        ['SHOPPING_CENTER', 'shopping'],
        ['SUPERMARKETS_HYPERMARKETS', 'shopping'],
        ['MUSEUM', 'cultural'],
        ['CINEMA', 'leisure'],
        ['STADIUM', 'sport'],
        ['GOLF_COURSE', 'sport'],
        ['PARK_RECREATION_AREA', 'outdoor'],
        ['MOUNTAIN_PEAK', 'outdoor'],
        ['PROTECTED_AREA', 'protected'],
        ['POLICE_STATION', 'public'],
        ['LIBRARY', 'public'],
        ['CHURCH', 'religion'],
        ['MILITARY_AIRPORT', 'military'],
        ['COMMERCIAL_BUILDING', 'business'],
        ['SCHOOL', 'education'],
    ])('maps %s → group %s', (category, expected) => {
        expect(getPOIGroupForPlace(placeWith(category))).toBe(expected);
    });

    test('returns undefined when the place has no categories', () => {
        expect(getPOIGroupForPlace({ properties: {} } as Place)).toBeUndefined();
        expect(getPOIGroupForPlace({ properties: { poi: {} } } as Place)).toBeUndefined();
    });

    test('returns undefined for a category that is not mapped to a base-map category', () => {
        expect(getPOIGroupForPlace(placeWith('UNKNOWN_CATEGORY'))).toBeUndefined();
    });

    test('honors icon.mapping override when provided', () => {
        const place = { properties: { address: { freeformAddress: 'A Building' } } } as Place;
        expect(
            getPOIGroupForPlace(place, {
                icon: { mapping: { to: 'poiCategory', fn: () => 'RESTAURANT' } },
            }),
        ).toBe('eat_and_drink');
    });
});

describe('test prepare places for display', () => {
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
                        categories: [],
                        localizedCategories: [],
                    },
                    address: {
                        freeformAddress: 'address test',
                    },
                },
            },
        ],
    };

    test('prepare places for display for single place', () => {
        expect(preparePlacesForDisplay(places.features[0], 0)).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    id: '123',
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [0, 0], bbox: undefined },
                    properties: {
                        id: '123',
                        iconID: 'default_place-0',
                        title: 'test',
                        type: 'POI',
                        poi: { name: 'test', phone: '+31000099999', categories: [], localizedCategories: [] },
                        address: { freeformAddress: 'address test' },
                    },
                },
            ],
        });
    });

    const getPhoneFun = (place: Place) => place.properties.poi?.phone;

    test('prepare places for display with config', () => {
        expect(
            preparePlacesForDisplay(places, 0, {
                theme: 'pin',
                text: {
                    size: 5,
                    title: ['get', 'name'],
                    font: [MAP_MEDIUM_FONT],
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
                        iconID: 'default_place-0',
                        title: 'test',
                        phone: '+31000099999',
                        staticProp: 'Static text',
                        type: 'POI',
                        poi: { name: 'test', phone: '+31000099999', categories: [], localizedCategories: [] },
                        address: { freeformAddress: 'address test' },
                    },
                },
            ],
        });
    });

    test('prepare places for display with function text field config', () => {
        expect(
            preparePlacesForDisplay(places, 0, {
                theme: 'base-map',
                text: {
                    size: 5,
                    title: (place: Place) => place.properties.poi?.url ?? 'No url found',
                    font: [MAP_MEDIUM_FONT],
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
                        iconID: 'default_place-0',
                        title: 'No url found',
                        category: undefined,
                        group: undefined,
                        type: 'POI',
                        poi: {
                            name: 'test',
                            phone: '+31000099999',
                            categories: [],
                            localizedCategories: [],
                        },
                        address: {
                            freeformAddress: 'address test',
                        },
                    },
                },
            ],
        });
    });

    test('prepare places for display attaches category and group for base-map theme', () => {
        const restaurant: Place = {
            id: 'r1',
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: {
                type: 'POI',
                poi: { name: 'Café du Coin', categories: ['CAFE_PUB'], localizedCategories: [] },
                address: { freeformAddress: 'Somewhere' },
            } as CommonPlaceProps,
        };

        const result = preparePlacesForDisplay(restaurant, 0, { theme: 'base-map' });
        const props = result.features[0].properties;

        expect(props.iconID).toBe('poi-cafe');
        expect(props.category).toBe('cafe');
        expect(props.group).toBe('eat_and_drink');
    });

    test('prepare places for display omits category and group for non-base-map themes', () => {
        const restaurant: Place = {
            id: 'r2',
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: {
                type: 'POI',
                poi: { name: 'Pizzeria', categories: ['RESTAURANT'], localizedCategories: [] },
                address: { freeformAddress: 'Somewhere' },
            } as CommonPlaceProps,
        };

        const result = preparePlacesForDisplay(restaurant, 0, { theme: 'pin' });
        const props = result.features[0].properties;

        expect(props.iconID).toBe('7315');
        expect(props).not.toHaveProperty('category');
        expect(props).not.toHaveProperty('group');
    });

    test('prepare places for display with no id generates random ID', () => {
        const placeWithoutId = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [1, 1],
            },
            properties: {
                type: 'POI',
                poi: {
                    name: 'Place without ID',
                },
                address: {
                    freeformAddress: 'test address',
                },
            },
        } as Place;

        const result = preparePlacesForDisplay(placeWithoutId, 0);

        expect(result.type).toBe('FeatureCollection');
        expect(result.features).toHaveLength(1);

        const feature = result.features[0];
        // MapLibre does not reuse the given feature ID. Either we generate it on the fly or use the one from properties via promotedId value.
        // (feature ID will be auto-generated due to GeoJsonSource 'promoteId' behavior, mapped to properties.id)
        expect(feature.properties.id).toMatchObject(expect.any(String));
        expect(feature.properties.title).toBe('Place without ID');
        expect(feature.properties.iconID).toBe('default_place-0');
    });
});
