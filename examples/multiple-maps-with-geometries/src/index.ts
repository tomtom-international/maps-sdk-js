import { PolygonFeatures, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geometryData, search } from '@tomtom-org/maps-sdk/services';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';

const mapsElement = document.querySelector('#sdk-example-maps-container') as HTMLElement;

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const initMap = async (geometry: Feature<Polygon | MultiPolygon>, index: number) => {
        const div = document.createElement('div');
        div.id = `map${index}`;
        div.className = 'sdk-example-map';
        mapsElement.appendChild(div);

        const map = new TomTomMap({
            mapLibre: {
                container: div.id,
                bounds: geometry.bbox as LngLatBoundsLike,
                interactive: false,
            },
        });
        await (
            await GeometriesModule.get(map, {
                theme: 'inverted',
                beforeLayerConfig: 'lowestPlaceLabel',
                colorConfig: { fillColor: 'white', fillOpacity: 0.75 },
                lineConfig: { lineOpacity: 0 },
            })
        ).show({ type: 'FeatureCollection', features: [geometry] } as PolygonFeatures);
    };

    const places = await search({ countries: ['ESP'], geographyTypes: ['Municipality'], limit: 16 });
    const geometries = await geometryData({ geometries: places });
    for (let i = 0; i < geometries.features.length; i++) {
        await initMap(geometries.features[i], i);
    }
})();
