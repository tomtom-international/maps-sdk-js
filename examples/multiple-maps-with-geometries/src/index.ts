import { PolygonFeatures, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geometryData, search } from '@tomtom-org/maps-sdk/services';
import { bboxPolygon, difference } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

const mapsElement = document.querySelector('#sdk-example-maps-container') as HTMLElement;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
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
        div.className = 'sdk-example-map';
        mapsElement.appendChild(div);

        const map = new TomTomMap({ container: div.id, bounds: geometry.bbox as LngLatBoundsLike, interactive: false });
        (
            await GeometriesModule.get(map, {
                beforeLayerConfig: 'lowestPlaceLabel',
                colorConfig: { fillColor: 'white', fillOpacity: 0.75 },
                lineConfig: { lineOpacity: 0 },
            })
        ).show(invert(geometry));
    };

    const places = await search({ query: '', countries: ['ESP'], geographyTypes: ['Municipality'], limit: 16 });
    const geometries = await geometryData({ geometries: places });
    for (let i = 0; i < geometries.features.length; i++) {
        await initMap(geometries.features[i], i);
    }
})();
