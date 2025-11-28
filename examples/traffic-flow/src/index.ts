import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        container: 'sdk-map',
        center: [2.34281, 48.85639],
        zoom: 12,
    });
    await TrafficFlowModule.get(map, { visible: true });
})();
