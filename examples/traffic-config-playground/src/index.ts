import type { Place } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
    trafficFlowKnobCatalogue,
    trafficIncidentsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { configPresets } from './configPresets';
import { jumpToPlaces } from './jumpToPlaces';
import './style.css';
import { API_KEY } from './config';
import { initKnobPanel } from './knobPanel';
import { initTogglePanel } from './togglePanel';

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
    initKnobPanel('ui-flowKnobs', trafficFlowKnobCatalogue, trafficFlowModule);
    initKnobPanel('ui-incidentsKnobs', trafficIncidentsKnobCatalogue, trafficIncidentsModule);

    const cachedPlacesByQuery: Record<string, Place> = {};
    const geocodeWithCache = async (query: string): Promise<Place> => {
        let fetchedPlace = cachedPlacesByQuery[query];
        if (!fetchedPlace) {
            fetchedPlace = await geocodeOne(query);
            cachedPlacesByQuery[query] = fetchedPlace;
        }
        return fetchedPlace;
    };

    const presetSelector = document.getElementById('ui-presetSelector') as HTMLSelectElement;
    configPresets.forEach((preset, index) => presetSelector.add(new Option(preset.title, String(index))));
    presetSelector.addEventListener('change', () => {
        const { config } = configPresets[Number(presetSelector.value)];
        trafficIncidentsModule.applyConfig(config.incidents);
        trafficFlowModule.applyConfig(config.flow);
    });

    const locationsSelector = document.getElementById('ui-jumpToSelector') as HTMLSelectElement;
    jumpToPlaces.forEach((location, index) => locationsSelector.add(new Option(location, String(index))));
    // A later pick wins over an earlier one whose geocode is still on its way.
    const latestJump = createLatestRequest();
    locationsSelector.addEventListener('change', async () => {
        const query = jumpToPlaces[Number(locationsSelector.value)];
        const jump = await latestJump.run(() => geocodeWithCache(query));
        if (!jump.current) return;

        const { bbox } = jump.value;
        if (bbox) map.mapLibreMap.fitBounds(bbox, { duration: 0 });
    });
    locationsSelector.selectedIndex = 0;

    initTogglePanel();
})();
