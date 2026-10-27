import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, TerrainModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [14.508, 46.0494],
            zoom: 16.2,
            pitch: 70,
            bearing: 125,
            maxPitch: 70,
        },
    });

    await TerrainModule.get(map, { elevation: { visible: true, exaggeration: 1.5 }, hillshade: { visible: true } });

    const baseMap = await BaseMapModule.get(map);
    baseMap.setVisible(true, { layerGroups: { show: 'only', values: ['buildings3D'] } });

    // Streams the 3D Landmarks, shaded like the 3D buildings around them
    new Landmarks3D(map);
})();
