import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode } from '@tomtom-org/maps-sdk/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const initPlace = await geocode({ query: 'Canary Islands', geographyTypes: ['CountrySubdivision'] });
new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        fitBoundsOptions: { padding: 50 },
        bounds: bboxFromGeoJSON(initPlace) as LngLatBoundsLike,
    },
    { style: { type: 'standard', id: 'monoLight', include: ['hillshade'] } },
);
