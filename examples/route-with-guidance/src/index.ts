import { getInstructionLanes, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { laneSign } from './laneSign';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const waypoints = await Promise.all(['Leidsplein, Amsterdam', 'Damplein, Amsterdam'].map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.8888162, 52.3728909],
            zoom: 16.6,
        },
    });

    const routingModule = await RoutingModule.create(map);

    const routes = await calculateRoute({
        locations: waypoints,
        costModel: {
            traffic: 'historical',
        },
        guidance: {
            // request guidance instructions, and the lanes leading to each maneuver
            type: 'coded',
        },
    });

    routingModule.showRoutes(routes);
    routingModule.showWaypoints(waypoints);

    const route = routes.features[0];
    const directions = document.querySelector('#ui-directions') as HTMLOListElement;
    for (const instruction of route.properties.guidance?.instructions ?? []) {
        const item = document.createElement('li');
        item.className = 'ui-direction';
        item.textContent = instruction.message ?? instruction.maneuver;

        const lanes = getInstructionLanes(route, instruction);
        const sign = lanes && laneSign(lanes);
        if (sign) item.insertAdjacentHTML('beforeend', sign);
        directions.append(item);
    }
})();
