import type { Place, Places } from '@cet/maps-sdk-js/core';
import { describe, expect, test } from 'vitest';
import { buildGeometryDataRequest } from '../requestBuilder';

describe('Geometry data request URL building functional tests', () => {
    test('Geometry data request URL building tests', () => {
        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 1,
                geometries: ['GEOMETRY_ID'],
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=1&key=TEST_API_KEY&geometries=GEOMETRY_ID',
        );

        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 1,
                geometries: ['GEOMETRY_ID_0', 'GEOMETRY_ID_1'],
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=1&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1',
        );

        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 1,
                geometries: ['GEOMETRY_ID_0', 'GEOMETRY_ID_1'],
                zoom: 12,
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=1&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1&geometriesZoom=12',
        );

        const testPlaces: Places = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        dataSources: {
                            geometry: {
                                id: 'GEOMETRY_ID_0',
                            },
                        },
                    },
                } as Place,
                {
                    type: 'Feature',
                    properties: {
                        dataSources: {
                            geometry: {
                                id: 'GEOMETRY_ID_1',
                            },
                        },
                    },
                } as Place,
                {
                    type: 'Feature',
                    properties: {
                        dataSources: {
                            geometry: {
                                id: 'GEOMETRY_ID_2',
                            },
                        },
                    },
                } as Place,
            ],
        };

        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 2,
                geometries: testPlaces,
                zoom: 12,
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=2&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12',
        );
        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                geometries: testPlaces.features,
                zoom: 12,
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=undefined&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12',
        );

        // Adding place without geometry ID:
        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 1,
                geometries: [...testPlaces.features, { properties: {} } as Place],
                zoom: 12,
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=1&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12',
        );

        // Adding place without geometry ID:
        expect(
            buildGeometryDataRequest({
                commonBaseURL: 'https://api.tomtom.com',
                apiKey: 'TEST_API_KEY',
                apiVersion: 1,
                geometries: [{ properties: { dataSources: {} } } as Place, ...testPlaces.features],
                zoom: 12,
            }).toString(),
        ).toEqual(
            'https://api.tomtom.com/maps/orbis/places/additionalData.json?apiVersion=1&key=TEST_API_KEY&geometries=GEOMETRY_ID_0%2CGEOMETRY_ID_1%2CGEOMETRY_ID_2&geometriesZoom=12',
        );
    });
});
