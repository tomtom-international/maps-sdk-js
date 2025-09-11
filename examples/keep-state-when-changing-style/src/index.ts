import { bboxFromGeoJSON, TomTomConfig, Waypoint } from '@cet/maps-sdk-js/core';
import {
    PlacesModule,
    POIsModule,
    PublishedStyleID,
    publishedStyleIDs,
    RoutingModule,
    TomTomMap,
    TrafficIncidentsModule,
} from '@cet/maps-sdk-js/map';
import { calculateRoute, search } from '@cet/maps-sdk-js/services';
import { LngLatBoundsLike } from 'maplibre-gl';
import '../style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'es-ES' });

(async () => {
    const geoInputs: Waypoint[] = (
        await Promise.all([search({ query: 'Hyde Park Corner, London' }), search({ query: 'Leman Street, London' })])
    ).map((result) => result.features[0]);

    const map = new TomTomMap(
        {
            container: 'map',
            bounds: bboxFromGeoJSON(geoInputs) as LngLatBoundsLike,
            fitBoundsOptions: { padding: 100 },
        },
        { style: { type: 'published', include: ['trafficIncidents'] } },
    );
    await POIsModule.get(map, {
        filters: { categories: { show: 'only', values: ['IMPORTANT_TOURIST_ATTRACTION'] } },
    });
    await TrafficIncidentsModule.get(map, {
        icons: { visible: false },
        filters: { any: [{ magnitudes: { show: 'all_except', values: ['minor'] } }] },
    });
    const routingModule = await RoutingModule.init(map);
    routingModule.showWaypoints(geoInputs);
    routingModule.showRoutes(await calculateRoute({ geoInputs }));

    const position = map.mapLibreMap.getCenter().toArray();
    (await PlacesModule.init(map)).show(await search({ query: 'London Eye', position, limit: 1 }));
    (await PlacesModule.init(map)).show(
        await search({ query: 'City Hall', position, poiCategories: ['GOVERNMENT_OFFICE'] }),
    );

    const stylesSelector = document.querySelector('#mapStyles') as HTMLSelectElement;
    publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID),
    );

    (window as any).map = map; // This has been done for automation test support
})();
