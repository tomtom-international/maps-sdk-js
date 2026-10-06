import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    StylingFoundationsModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentDetailsModule,
} from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import type { LngLatBoundsLike } from 'maplibre-gl';
import './style.css';
import { API_KEY } from './config';
import { initFocus } from './focus';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({ mapLibre: { container: 'sdk-map', center: [-0.13, 51.51], zoom: 10 } });

    const styling = await StylingFoundationsModule.get(map);
    await TrafficFlowModule.get(map, { visible: true });
    const incidents = await TrafficIncidentDetailsModule.create(map);
    const boundary = await GeometriesModule.create(map, { fill: { style: 'outline' } });

    const city = await geocodeOne('London');
    const cityBoundary = await geometryData({ geometries: [city] });
    await boundary.show(cityBoundary);
    await incidents.show(await trafficIncidentDetails({ polygon: cityBoundary, timeValidityFilter: ['present'] }));
    map.mapLibreMap.fitBounds(bboxFromGeoJSON(cityBoundary) as LngLatBoundsLike, { padding: 40, duration: 0 });

    initFocus(styling, incidents, boundary);
})();
