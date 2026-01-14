import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { HillshadeModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [11.108922, 47.109197],
            zoom: 7,
        },
    });
    await HillshadeModule.get(map, { visible: true });
})();
