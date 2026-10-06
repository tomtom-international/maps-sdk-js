import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { MapEffects } from '@tomtom-org/maps-sdk-plugin-map-effects';
import './style.css';
import { API_KEY } from './config';
import { WATERCOLOR_FRAGMENT } from './watercolor';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [12.3358, 45.4371],
            zoom: 14.5,
            // Bloom and your own passes read the map canvas back; MapLibre keeps it readable only when asked.
            canvasContextAttributes: { preserveDrawingBuffer: true },
        },
    });

    // A painting carries no lettering: only land, water, parks and streets are left to paint.
    await BaseMapModule.get(map, {
        groups: {
            allPlaceLabels: { visible: false },
            natureLabels: { visible: false },
            roadLabels: { visible: false },
            roadShields: { visible: false },
            houseNumbers: { visible: false },
            ferries: { visible: false },
        },
    });
    await POIsModule.get(map, { visible: false });

    const effects = new MapEffects(map, {
        'bloom.intensity': 0.85,
        'bloom.radius': 38,
        'bloom.threshold': 0.52,
        'grade.contrast': 1.15,
        'vignette.intensity': -0.6,
        'vignette.reach': 0.55,
    });

    // Runs inside the effects chain, before every overlay effect: bloom, the grade and the vignette
    // work on the painted map rather than on the raw one.
    effects.addPass({
        id: 'watercolor',
        fragment: WATERCOLOR_FRAGMENT,
        uniforms: () => ({ uScale: map.mapLibreMap.getPixelRatio() }),
    });
})();
