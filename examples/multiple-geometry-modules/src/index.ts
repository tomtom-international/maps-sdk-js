import type { PolygonFeatures } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode, geometryData, search } from '@cet/maps-sdk-js/services';
import { bboxPolygon, difference } from '@turf/turf';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

const invert = (geometry: PolygonFeatures): PolygonFeatures => {
    const invertedArea = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
    });
    return invertedArea ? ({ type: 'FeatureCollection', features: [invertedArea] } as PolygonFeatures) : geometry;
};

const mainPlace = await geocode({ query: 'Germany', geographyTypes: ['Country'] });
const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        minZoom: 2,
        zoom: 13,
        bounds: mainPlace.bbox as LngLatBoundsLike,
    },
    { style: { type: 'published', include: ['trafficIncidents'] } },
);
const mainGeometry = await geometryData({ geometries: mainPlace });

const restOfTheMapGeometryModule = await GeometriesModule.init(map, {
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
const closeupGeometriesModule = await GeometriesModule.init(map, {
    beforeLayerConfig: 'lowestRoadLine',
    colorConfig: {
        fillColor: 'fadedRainbow',
        fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 0, 7, 1, 11, 0],
    },
});
closeupGeometriesModule.show(subdivisionGeometries);

const farAwayGeometriesModule = await GeometriesModule.init(map, {
    beforeLayerConfig: 'country',
    lineConfig: { lineWidth: 0.7, lineOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0] },
    colorConfig: {
        fillColor: 'fadedRainbow',
        fillOpacity: ['interpolate', ['linear'], ['zoom'], 6, 1, 7, 0],
    },
});
farAwayGeometriesModule.show(subdivisionGeometries);

(window as any).map = map; // This has been done for automation test support
