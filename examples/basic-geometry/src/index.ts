import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const location = await geocodeOne('Schiphol Airport, NL');
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            zoom: 11,
            center: location.geometry.coordinates as [number, number],
        },
        language: 'en-GB',
    });
    const geometryModule = await GeometriesModule.get(map);

    const geometryToSearch = await geometryData({ geometries: [location] });
    geometryModule.show(geometryToSearch);
})();
