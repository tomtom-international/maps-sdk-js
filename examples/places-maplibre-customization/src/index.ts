import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.90435, 52.36876],
            zoom: 12,
        },
    });

    const placesModule = await PlacesModule.create(map, {
        markerType: 'base-map',
        icon: { opacity: 0.75 },
        layers: {
            main: {
                paint: {
                    'text-color': '#AA0000',
                },
            },
            selected: {
                paint: {
                    'text-color': 'red',
                },
            },
        },
    });

    // Registering a click handler is what gives the places the click state the `selected` paint reads.
    placesModule.events.on('click', () => {});

    // A new map move retires the previous move's search, so a slow answer cannot paint over a newer viewport
    const latestSearch = createLatestRequest();

    const updatePlaces = async () => {
        const results = await latestSearch.run((signal) =>
            discoverPlaces({
                query: 'restaurant',
                geoBias: { boundingBox: map.getBBox() },
                limit: 25,
                signal,
            }),
        );
        if (results.current) await placesModule.show(results.value);
    };

    await updatePlaces();

    map.mapLibreMap.on('moveend', updatePlaces);
})();
