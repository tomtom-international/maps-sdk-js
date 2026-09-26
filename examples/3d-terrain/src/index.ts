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

    // Raises the map surface in 3D and shades its relief
    await TerrainModule.get(map, { elevation: true, elevationExaggeration: 1.5, hillshade: true });

    // Turn on 3D basemap buildings
    const baseMap = await BaseMapModule.get(map);
    baseMap.setVisible(true, { layerGroups: { mode: 'include', names: ['buildings3D'] } });

    // Streams the 3D Landmarks
    new Landmarks3D(map, { displayMode: 'inherited' });
})();
