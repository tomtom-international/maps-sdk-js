import type { PolygonFeatures } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';
import { bboxPolygon, difference } from '@turf/turf';
import './style.css';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const invert = (geometry: PolygonFeatures): PolygonFeatures => {
        const invertedArea = difference({
            type: 'FeatureCollection',
            features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
        });
        return invertedArea ? ({ type: 'FeatureCollection', features: [invertedArea] } as PolygonFeatures) : geometry;
    };

    const mainPlace = await geocode({ query: 'Germany', geographyTypes: ['Country'] });
    const map = new TomTomMap({
        container: 'sdk-map',
        minZoom: 2,
        zoom: 13,
        bounds: mainPlace.bbox as LngLatBoundsLike,
    });
    const mainGeometry = await geometryData({ geometries: mainPlace });

    const restOfTheMapGeometryModule = await GeometriesModule.get(map, {
        colorConfig: { fillColor: 'black', fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 0.6, 14, 0.4] },
        lineConfig: { lineOpacity: 0 },
    });
    restOfTheMapGeometryModule.show(invert(mainGeometry));

    const subdivisions = await search({
        query: '',
        countries: ['DEU'],
        geographyTypes: ['CountrySubdivision'],
        limit: 20,
    });
    const subdivisionGeometries = await geometryData({ geometries: subdivisions });
    const closeupGeometriesModule = await GeometriesModule.get(map, {
        beforeLayerConfig: 'lowestRoadLine',
        colorConfig: {
            fillColor: 'fadedRainbow',
            fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 1, 11, 0],
        },
    });
    closeupGeometriesModule.show(subdivisionGeometries);

    const farAwayGeometriesModule = await GeometriesModule.get(map, {
        beforeLayerConfig: 'country',
        lineConfig: { lineWidth: 0.7, lineOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0] },
        colorConfig: {
            fillColor: 'fadedRainbow',
            fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 7, 0],
        },
    });
    farAwayGeometriesModule.show(subdivisionGeometries);
})();
