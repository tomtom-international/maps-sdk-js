import { bboxFromGeoJSON, TomTomConfig, Waypoint } from '@tomtom-org/maps-sdk/core';
import {
    PlacesModule,
    POIsModule,
    RoutingModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute, SearchResponse, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'es-ES' });

(async () => {
    const locations: Waypoint[] = (
        await Promise.all([search({ query: 'Hyde Park Corner, London' }), search({ query: 'Leman Street, London' })])
    ).map((result: SearchResponse) => result.features[0]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(locations),
            fitBoundsOptions: { padding: 100 },
        },
    });
    await POIsModule.get(map, {
        filters: { categories: { show: 'only', values: ['IMPORTANT_TOURIST_ATTRACTION'] } },
    });
    await TrafficIncidentsModule.get(map, {
        icons: { visible: false },
        filters: { any: [{ magnitudes: { show: 'all_except', values: ['minor'] } }] },
    });
    const routingModule = await RoutingModule.get(map);
    routingModule.showWaypoints(locations);
    routingModule.showRoutes(await calculateRoute({ locations }));

    const position = map.mapLibreMap.getCenter().toArray();
    (await PlacesModule.get(map)).show(await search({ query: 'London Eye', position, limit: 1 }));
    (await PlacesModule.get(map)).show(
        await search({ query: 'City Hall', position, poiCategories: ['GOVERNMENT_OFFICE'] }),
    );

    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
    
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });
})();
