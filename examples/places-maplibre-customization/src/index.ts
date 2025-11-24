import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { search } from '@tomtom-org/maps-sdk/services';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

(async () => {
    // Create a map centered on Amsterdam
    const map = new TomTomMap({
        container: 'maps-sdk-js-examples-map-container',
        center: [4.90435, 52.36876],
        zoom: 12,
    });

    const places = await PlacesModule.get(map, {
        theme: 'base-map',
        layers: {
            main: {
                paint: {
                    'text-color': '#AA0000',
                    'icon-opacity': 0.75,
                },
            },
            selected: {
                paint: {
                    'text-color': 'red',
                },
            },
        },
    });

    places.events.on('click', () => console.log('clicked'));

    // Search for restaurants in the visible area
    const updatePlaces = async () => {
        const results = await search({
            query: 'restaurant',
            boundingBox: map.getBBox(),
            limit: 25,
        });

        await places.show(results);
    };

    // Initial load
    await updatePlaces();

    // Reload places when map moves
    map.mapLibreMap.on('moveend', updatePlaces);
})();
