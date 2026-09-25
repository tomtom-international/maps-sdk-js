import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { StylingModule, TomTomMap, TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne } from '@tomtom-org/maps-sdk/services';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { BLOOM_LOOK, FLOW_WIDTH_FACTOR } from './bloomLook';
import { API_KEY } from './config';
import { initScopeSelector } from './scopeSelector';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const manhattan = await geocodeOne('Manhattan, New York');
    const [longitude, latitude] = manhattan.geometry.coordinates;

    const map = new TomTomMap({
        style: 'monoDark',
        mapLibre: {
            container: 'sdk-map',
            center: [longitude, latitude],
            zoom: 13,
            // Bloom reads the map canvas back; MapLibre keeps it readable only when asked.
            canvasContextAttributes: { preserveDrawingBuffer: true },
        },
    });

    // Flow tubes and incident jams: between them, everything this example lights.
    await TrafficFlowModule.get(map, { visible: true });
    await TrafficIncidentsModule.get(map, { visible: true });

    const styling = await StylingModule.get(map);
    styling.set('traffic.flow.widthFactor', FLOW_WIDTH_FACTOR);

    const effects = new MapEffects(map, BLOOM_LOOK);

    // The same glow, pointed at less of the map.
    initScopeSelector(BLOOM_LOOK['bloom.only'] ?? [], (scope) => effects.set({ 'bloom.only': scope }));
})();
