import type { Place } from '@cet/maps-sdk-js/core';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import { TomTomMap, TrafficFlowModule, TrafficIncidentsModule } from '@cet/maps-sdk-js/map';
import { geocode } from '@cet/maps-sdk-js/services';
import './style.css';
import type { LngLatBoundsLike, Map } from 'maplibre-gl';
import { configPresets } from './configPresets';
import { jumpToPlaces } from './jumpToPlaces';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

let map: TomTomMap;
let mapLibreMap: Map;
let incidents: TrafficIncidentsModule;
let flow: TrafficFlowModule;

const cachedPlacesByQuery: Record<string, Place> = {};
const geocodeWithCache = async (query: string): Promise<Place> => {
    let fetchedPlace = cachedPlacesByQuery[query];
    if (!fetchedPlace) {
        fetchedPlace = (await geocode({ query, limit: 1 })).features[0];
        cachedPlacesByQuery[query] = fetchedPlace;
    }
    return fetchedPlace;
};

const initUI = () => {
    const presetSelector = document.getElementById('maps-sdk-js-examples-preset-selector') as HTMLSelectElement;
    configPresets.forEach((preset, index) => presetSelector.add(new Option(preset.title, String(index))));
    presetSelector.addEventListener('change', (event) => {
        const config = configPresets[Number((event.target as HTMLOptionElement).value)].config;
        incidents.applyConfig(config?.incidents);
        flow.applyConfig(config?.flow);
    });

    const locationsSelector = document.getElementById(
        'maps-sdk-js-examples-jump-to-location-selector',
    ) as HTMLSelectElement;
    jumpToPlaces.forEach((location, index) => locationsSelector.add(new Option(location, String(index))));
    locationsSelector.addEventListener('change', async (event) => {
        const place = await geocodeWithCache(jumpToPlaces[Number((event.target as HTMLOptionElement).value)]);
        // We clear the selected Jump-to location when the user moves the map after we have centered it there:
        mapLibreMap.once('moveend', () => mapLibreMap.once('moveend', () => (locationsSelector.selectedIndex = -1)));
        mapLibreMap.fitBounds(place.bbox as LngLatBoundsLike, { duration: 0 });
    });
    locationsSelector.selectedIndex = 0;
};

map = new TomTomMap(
    { container: 'maps-sdk-js-examples-map-container', center: [2.34281, 48.85639], zoom: 12 },
    { style: { type: 'published', include: ['trafficIncidents', 'trafficFlow'] } },
);
mapLibreMap = map.mapLibreMap;
incidents = await TrafficIncidentsModule.get(map);
flow = await TrafficFlowModule.get(map);
initUI();

(window as any).map = map; // This has been done for automation test support
