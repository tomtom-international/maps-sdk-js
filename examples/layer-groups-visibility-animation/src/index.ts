import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapModule,
    POIsModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [-74.00432, 40.71632],
            zoom: 3,
        },
    });

    const orderedModules = [
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['borders'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['buildings2D'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['countryLabels'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['land'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['capitalLabels'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['roadLines'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['buildings3D'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['placeLabels'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['roadLabels'] } }),
        await BaseMapModule.get(map, { layerGroupsFilter: { mode: 'include', names: ['roadShields'] } }),
        await TrafficIncidentsModule.get(map),
        await POIsModule.get(map),
        await TrafficFlowModule.get(map),
    ];

    // Iterating through negative indexes shows the default map:
    let index = -3;
    setInterval(() => {
        if (index == -1) {
            orderedModules.forEach((module) => module.setVisible(false));
        } else if (index >= 0) {
            orderedModules[index].setVisible(true);
        }
        index++;
        if (index > orderedModules.length - 1) {
            // Iterating through negative indexes shows the default map:
            index = -3;
        }
    }, 1000);

    map.mapLibreMap.zoomTo(18, { duration: 200000 });

    (window as any).map = map;
})();
