import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        container: 'sdk-map',
        center: [2.34281, 48.85639],
        zoom: 12,
    });
    await TrafficIncidentsModule.get(map, { visible: true });
})();
