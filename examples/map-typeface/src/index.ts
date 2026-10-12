import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    PlacesModule,
    RoutingModule,
    StylingFoundationsModule,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import {
    calculateRoute,
    discoverOnePlace,
    discoverPlaces,
    geocodeOne,
    geometryData,
} from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';
import { fontFamilies, typefaceChoices, typefaceSelect } from './typefaces';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const waypoints = await Promise.all([
        discoverOnePlace('Notre-Dame de Paris'),
        discoverOnePlace('Musée du Louvre'),
        discoverOnePlace('Eiffel Tower'),
    ]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: { top: 120, bottom: 120, left: 80, right: 360 } },
        },
    });

    const styling = await StylingFoundationsModule.get(map, { labels: { customTypeface: fontFamilies.Fraunces } });
    // No module sets a typeface of its own, so their labels follow the map's. An empty `lineLabel` draws
    // the district's name along its border too.
    const district = await GeometriesModule.create(map, { fill: { opacity: 0.12 }, lineLabel: {} });
    const routing = await RoutingModule.create(map);
    const museums = await PlacesModule.create(map);

    const [districtGeometry, routes, museumPlaces] = await Promise.all([
        geocodeOne('7e Arrondissement, Paris').then((place) => geometryData({ geometries: [place], zoom: 14 })),
        calculateRoute({ locations: waypoints }),
        discoverPlaces({ filters: { poiCategories: ['MUSEUM'] }, geoBias: { position: [2.33, 48.858] }, limit: 15 }),
    ]);
    // The labels draw each geometry's `title`.
    await district.show({
        ...districtGeometry,
        features: districtGeometry.features.map((feature) => ({
            ...feature,
            properties: { ...feature.properties, title: '7th arrondissement' },
        })),
    });
    await routing.showWaypoints(waypoints);
    await routing.showRoutes(routes);
    await museums.show(museumPlaces);

    // `updateConfig` replaces `labels` as a whole, so picking one kind of typeface drops the other.
    const mapSelect = typefaceSelect('ui-mapTypeface', 'Fraunces');
    mapSelect.addEventListener('change', () => styling.updateConfig({ labels: typefaceChoices.get(mapSelect.value) }));

    // A module's own typeface wins over the map's, for its labels alone; with none, they follow the map again.
    const waypointSelect = typefaceSelect('ui-waypointTypeface', '', 'Same as the map');
    waypointSelect.addEventListener('change', () =>
        routing.updateConfig({ waypoints: { label: typefaceChoices.get(waypointSelect.value) } }),
    );
    const museumSelect = typefaceSelect('ui-museumTypeface', '', 'Same as the map');
    museumSelect.addEventListener('change', () =>
        museums.updateConfig({ label: typefaceChoices.get(museumSelect.value) }),
    );
    // A geometry draws a title inside it and labels along its border, each with a typeface of its own.
    const districtSelect = typefaceSelect('ui-districtTypeface', '', 'Same as the map');
    districtSelect.addEventListener('change', () => {
        const choice = typefaceChoices.get(districtSelect.value);
        district.updateConfig({ label: choice, lineLabel: choice ?? {} });
    });

    initTogglePanel();
})();
