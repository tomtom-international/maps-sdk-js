import '../styles.css';
import { PolygonFeatures, TomTomConfig } from '@cet/maps-sdk-js/core';
import { GeometriesModule, TomTomMap } from '@cet/maps-sdk-js/map';
import { geometryData, search } from '@cet/maps-sdk-js/services';
import { bboxPolygon, difference } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';

const mapsElement = document.querySelector('#maps') as HTMLElement;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY, language: 'en-US' });

const invert = (geometry: Feature<Polygon | MultiPolygon>): PolygonFeatures => {
    const invertedArea = difference({
        type: 'FeatureCollection',
        features: [bboxPolygon([-180, 90, 180, -90]), geometry],
    });
    return { type: 'FeatureCollection', features: [invertedArea ?? geometry] } as PolygonFeatures;
};

const initMap = async (geometry: Feature<Polygon | MultiPolygon>, index: number) => {
    const div = document.createElement('div');
    div.id = `map${index}`;
    div.className = 'map';
    mapsElement.appendChild(div);

    const map = new TomTomMap({ container: div.id, bounds: geometry.bbox as LngLatBoundsLike, interactive: false });
    (
        await GeometriesModule.init(map, {
            beforeLayerConfig: 'lowestPlaceLabel',
            colorConfig: { fillColor: 'white', fillOpacity: 0.75 },
            lineConfig: { lineOpacity: 0 },
        })
    ).show(invert(geometry));
};

const initExample = async () => {
    const places = await search({ query: '', countries: ['ESP'], geographyTypes: ['Municipality'], limit: 16 });
    const geometries = await geometryData({ geometries: places });
    for (let i = 0; i < geometries.features.length; i++) {
        await initMap(geometries.features[i], i);
    }
};

window.addEventListener('load', initExample);
