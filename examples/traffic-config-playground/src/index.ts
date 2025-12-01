import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficFlowModule, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import { geocode } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import { configPresets } from './configPresets';
import { jumpToPlaces } from './jumpToPlaces';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        container: 'sdk-map',
        center: [2.34281, 48.85639],
        zoom: 12,
    });
    const incidents = await TrafficIncidentsModule.get(map, { visible: true });
    const flow = await TrafficFlowModule.get(map, { visible: true });

    const cachedPlacesByQuery: Record<string, Place> = {};
    const geocodeWithCache = async (query: string): Promise<Place> => {
        let fetchedPlace = cachedPlacesByQuery[query];
        if (!fetchedPlace) {
            fetchedPlace = (await geocode({ query, limit: 1 })).features[0];
            cachedPlacesByQuery[query] = fetchedPlace;
        }
        return fetchedPlace;
    };

    const presetSelector = document.getElementById('sdk-example-preset-selector') as HTMLSelectElement;
    configPresets.forEach((preset, index) => presetSelector.add(new Option(preset.title, String(index))));
    presetSelector.addEventListener('change', (event) => {
        const config = configPresets[Number((event.target as HTMLOptionElement).value)].config;
        incidents.applyConfig(config?.incidents);
        flow.applyConfig(config?.flow);
    });

    const locationsSelector = document.getElementById('sdk-example-jump-to-location-selector') as HTMLSelectElement;
    jumpToPlaces.forEach((location, index) => locationsSelector.add(new Option(location, String(index))));
    locationsSelector.addEventListener('change', async (event) => {
        const place = await geocodeWithCache(jumpToPlaces[Number((event.target as HTMLOptionElement).value)]);
        // We clear the selected Jump-to location when the user moves the map after we have centered it there:
        map.mapLibreMap.once('moveend', () =>
            map.mapLibreMap.once('moveend', () => (locationsSelector.selectedIndex = -1)),
        );
        map.mapLibreMap.fitBounds(place.bbox as LngLatBoundsLike, { duration: 0 });
    });
    locationsSelector.selectedIndex = 0;
})();
