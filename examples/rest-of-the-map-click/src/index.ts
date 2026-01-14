import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { searchOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

const infoPanel = document.getElementById('info-panel') as HTMLElement;

(async () => {
    const place = (await searchOne('British Museum, London')) as Place;

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: place.geometry.coordinates as [number, number],
            zoom: 13,
        },
    });

    const placesModule = await PlacesModule.get(map);
    await placesModule.show(place);

    const baseMap = await BaseMapModule.get(map, {
        events: { cursorOnHover: 'default' }, // Keep default cursor on background
    });

    placesModule.events.on('click', (place) => {
        infoPanel.textContent = `Clicked on: ${place.properties.title}`;
    });

    baseMap.events.on('click', () => {
        infoPanel.textContent = 'Clicked on the rest of the map';
    });
})();
