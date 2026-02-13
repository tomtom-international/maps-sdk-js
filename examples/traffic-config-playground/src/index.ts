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
        mapLibre: {
            container: 'sdk-map',
            center: [2.34281, 48.85639],
            zoom: 12,
        },
    });
    const trafficIncidentsModule = await TrafficIncidentsModule.get(map, { visible: true });
    const trafficFlowModule = await TrafficFlowModule.get(map, { visible: true });

    const cachedPlacesByQuery: Record<string, Place> = {};
    const geocodeWithCache = async (query: string): Promise<Place> => {
        let fetchedPlace = cachedPlacesByQuery[query];
        if (!fetchedPlace) {
            fetchedPlace = (await geocode({ query, limit: 1 })).features[0];
            cachedPlacesByQuery[query] = fetchedPlace;
        }
        return fetchedPlace;
    };

    const presetSelector = document.getElementById('sdk-example-presetSelector') as HTMLSelectElement;
    configPresets.forEach((preset, index) => presetSelector.add(new Option(preset.title, String(index))));
    presetSelector.addEventListener('change', (event) => {
        const config = configPresets[Number((event.target as HTMLOptionElement).value)].config;
        trafficIncidentsModule.applyConfig(config?.incidents);
        trafficFlowModule.applyConfig(config?.flow);
    });

    const locationsSelector = document.getElementById('sdk-example-jumpToSelector') as HTMLSelectElement;
    jumpToPlaces.forEach((location, index) => locationsSelector.add(new Option(location, String(index))));
    locationsSelector.addEventListener('change', async (event) => {
        const place = await geocodeWithCache(jumpToPlaces[Number((event.target as HTMLOptionElement).value)]);
        map.mapLibreMap.fitBounds(place.bbox as LngLatBoundsLike, { duration: 0 });
    });
    locationsSelector.selectedIndex = 0;
    
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });
})();
