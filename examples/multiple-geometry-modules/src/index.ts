import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { discoverPlaces, geocode, geometryData } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const mainPlace = await geocode({ query: 'Germany', filters: { geographyTypes: ['Country'] } });
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            minZoom: 2,
            zoom: 13,
            bounds: mainPlace.bbox,
        },
    });
    const mainGeometry = await geometryData({ geometries: mainPlace });

    const restOfTheMapGeometryModule = await GeometriesModule.create(map, {
        fill: { style: 'inverted', color: 'black', opacity: ['interpolate', ['linear'], ['zoom'], 6, 0.6, 14, 0.4] },
        line: { opacity: 0 },
    });
    restOfTheMapGeometryModule.show(mainGeometry);

    const subdivisions = await discoverPlaces({
        filters: { countries: ['DEU'], geographyTypes: ['CountrySubdivision'] },
        limit: 20,
    });
    const subdivisionGeometries = await geometryData({ geometries: subdivisions });
    // One colour per subdivision in turn, shared by the close-up and the far-away look.
    const palette = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'];
    const closeupGeometriesModule = await GeometriesModule.create(map, {
        beforeLayerConfig: 'lowestRoadLine',
        fill: {
            palette,
            opacity: ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 1, 11, 0],
        },
    });
    closeupGeometriesModule.show(subdivisionGeometries);

    const farAwayGeometriesModule = await GeometriesModule.create(map, {
        beforeLayerConfig: 'country',
        line: { width: 0.7, opacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0] },
        fill: {
            palette,
            opacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 7, 0],
        },
    });
    farAwayGeometriesModule.show(subdivisionGeometries);
})();
