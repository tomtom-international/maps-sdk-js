import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapLayerGroupName,
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

    const baseMap = await BaseMapModule.get(map);
    const trafficIncidents = await TrafficIncidentsModule.get(map);
    const pois = await POIsModule.get(map);
    const trafficFlow = await TrafficFlowModule.get(map);

    // The order the map builds up in. Base map groups are toggled through the one base map
    // module, which takes the group to act on; the other three are whole modules of their own.
    const baseMapGroupOrder: BaseMapLayerGroupName[] = [
        'borders',
        'buildings2D',
        'countryLabels',
        'land',
        'capitalLabels',
        'roads',
        'buildings3D',
        'allPlaceLabels',
        'roadLabels',
        'roadShields',
    ];

    const orderedSteps: ((visible: boolean) => void)[] = [
        ...baseMapGroupOrder.map(
            (name) => (visible: boolean) =>
                baseMap.setVisible(visible, { layerGroups: { mode: 'include', names: [name] } }),
        ),
        (visible) => trafficIncidents.setVisible(visible),
        (visible) => pois.setVisible(visible),
        (visible) => trafficFlow.setVisible(visible),
    ];

    // Iterating through negative indexes shows the default map:
    let index = -3;
    setInterval(() => {
        if (index == -1) {
            orderedSteps.forEach((step) => step(false));
        } else if (index >= 0) {
            orderedSteps[index](true);
        }
        index++;
        if (index > orderedSteps.length - 1) {
            // Iterating through negative indexes shows the default map:
            index = -3;
        }
    }, 1000);

    map.mapLibreMap.zoomTo(18, { duration: 200000 });

    (window as any).map = map;
})();
