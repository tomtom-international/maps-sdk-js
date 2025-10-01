import { bboxFromGeoJSON, TomTomConfig } from '@cet/maps-sdk-js/core';
import { TomTomMap } from '@cet/maps-sdk-js/map';
import { geocode } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const initPlace = await geocode({ query: 'Canary Islands', geographyTypes: ['CountrySubdivision'] });
new TomTomMap(
    {
        container: 'maps-sdk-js-examples-body',
        fitBoundsOptions: { padding: 50 },
        bounds: bboxFromGeoJSON(initPlace) as LngLatBoundsLike,
    },
    { style: { type: 'published', id: 'monoLight', include: ['hillshade'] } },
);
