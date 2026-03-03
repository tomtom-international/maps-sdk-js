import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { placeById } from '@tomtom-org/maps-sdk/services';
import type { Popup } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { buildPopupHtml, createPOIPopup } from './popup';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.90435, 52.36876],
            zoom: 16,
        },
    });

    const restOfTheMapModule = await BaseMapModule.get(map, { events: { cursorOnHover: 'default' } });
    const poisModule = await POIsModule.get(map);
    const placesModule = await PlacesModule.get(map);

    let activePopup: Popup | null = null;

    const clearSelection = async () => {
        await placesModule.clear();
        activePopup?.remove();
        activePopup = null;
    };

    poisModule.events.on('click', async (feature) => {
        const details = await placeById({
            entityId: feature.properties.id,
            openingHours: 'nextSevenDays',
        });

        if (!details) return;

        await placesModule.show(details);

        activePopup?.remove();
        const [lng, lat] = details.geometry.coordinates;
        activePopup = createPOIPopup().setLngLat([lng, lat]).setHTML(buildPopupHtml(details)).addTo(map.mapLibreMap);
    });

    restOfTheMapModule.events.on('click', async () => {
        await clearSelection();
    });
})();
