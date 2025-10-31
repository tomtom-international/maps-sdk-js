import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode, geometryData } from '@tomtom-org/maps-sdk/services';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const location = await geocode({ query: 'Schiphol Airport, Netherlands', limit: 1 });
const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        zoom: 11,
        center: [location.features[0].geometry.coordinates[0], location.features[0].geometry.coordinates[1]],
    },
    { language: 'en-GB' },
);
const geometryModule = await GeometriesModule.get(map);

const geometryToSearch = await geometryData({ geometries: location });
geometryModule.show(geometryToSearch);
