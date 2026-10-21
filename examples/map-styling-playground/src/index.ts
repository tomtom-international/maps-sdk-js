import { defaultSectionTypes, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    applyMapPreset,
    BaseMapModule,
    baseMapKnobCatalogue,
    GeometriesModule,
    type MapPresetId,
    mapPresetCatalogue,
    PlacesModule,
    POIsModule,
    poisKnobCatalogue,
    RoutingModule,
    resetKnob,
    StandardStyleID,
    StylingFoundationsModule,
    standardStyleIDs,
    stylingFoundationsKnobCatalogue,
    TerrainModule,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
    terrainKnobCatalogue,
    trafficFlowKnobCatalogue,
    trafficIncidentsKnobCatalogue,
} from '@tomtom-org/maps-sdk/map';
import {
    calculateRoute,
    discoverOnePlace,
    discoverPlaces,
    geocodeOne,
    geometryData,
} from '@tomtom-org/maps-sdk/services';
import './style.css';
import { initBaseMapGroupsPanel } from './baseMapGroupsPanel';
import { API_KEY } from './config';
import { initLayerEdits } from './layerEdits';
import { collapsibleSection, initStylingPanel, type LookKnobSource } from './stylingPanel';
import { initTogglePanel } from './togglePanel';
import { initTypefacePanel } from './typefacePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const showRouteAndPlaces = async (routing: RoutingModule, places: PlacesModule, area: GeometriesModule) => {
    const waypoints = await Promise.all([
        discoverOnePlace('Twin Peaks, San Francisco'),
        discoverOnePlace('Mission Dolores Park, San Francisco'),
        discoverOnePlace('Alamo Square, San Francisco'),
    ]);
    const [routes, museums, district] = await Promise.all([
        // The curves of the winding roads over Twin Peaks, with every section the routes draw by default.
        calculateRoute({ locations: waypoints, sectionTypes: [...defaultSectionTypes, 'curve', 'curvyStretch'] }),
        discoverPlaces({ filters: { poiCategories: ['MUSEUM'] }, geoBias: { position: [-122.43, 37.775] }, limit: 10 }),
        geocodeOne('Haight-Ashbury, San Francisco, CA').then((place) =>
            geometryData({ geometries: [place], zoom: 14 }),
        ),
    ]);
    await routing.showWaypoints(waypoints);
    await routing.showRoutes(routes);
    await places.show(museums);
    // The labels draw each geometry's `title`.
    await area.show({
        ...district,
        features: district.features.map((feature) => ({
            ...feature,
            properties: { ...feature.properties, title: 'Haight-Ashbury' },
        })),
    });
};

(async () => {
    // San Francisco: hills for the shading knobs, traffic for the congestion colours, and water,
    // ferries and rail for the base-map groups.
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-122.4372, 37.7652], zoom: 12.6 },
    });
    const [trafficFlow, trafficIncidents, pois, baseMap] = await Promise.all([
        TrafficFlowModule.get(map, { visible: true }),
        TrafficIncidentsModule.get(map),
        POIsModule.get(map),
        BaseMapModule.get(map),
    ]);
    // The standard styles fade the shading out by zoom 13; these keep it at every zoom.
    const terrain = await TerrainModule.get(map, { hillshade: { visible: true, intensity: 0.5, maxZoom: 22 } });
    const styling = await StylingFoundationsModule.get(map, { labels: { sizeFactor: 1.2 } });
    // A route, a few places and a district, whose labels follow the map's typeface until given their own.
    const area = await GeometriesModule.create(map, { fill: { opacity: 0.1 }, lineLabel: {} });
    // The curves keep their rose on any theme, while their kerbs follow the style's light or dark.
    const routing = await RoutingModule.create(map, {
        sections: { curve: { visible: true }, curvyStretch: { visible: true } },
    });
    const places = await PlacesModule.create(map);
    void showRouteAndPlaces(routing, places, area);

    // How the map looks is held by the module drawing each part: the foundations by StylingFoundationsModule,
    // road markings by BaseMapModule, and the POI, traffic and hillshade looks by their own modules.
    const isTrafficLook = (id: string) => id.startsWith('colors.') || id === 'widthFactor' || id === 'opacityFactor';
    const lookSources: LookKnobSource[] = [
        // The typeface dropdown sets the map's typeface, with font files as well as the style's faces.
        { module: styling, catalogue: stylingFoundationsKnobCatalogue, isLook: (id) => id !== 'labels.typeface' },
        { module: baseMap, catalogue: baseMapKnobCatalogue, isLook: (id) => id.startsWith('roads.'), section: 'roads' },
        {
            module: pois,
            catalogue: poisKnobCatalogue,
            isLook: (id) => id !== 'visible' && !id.startsWith('filters.'),
            section: 'pois',
        },
        { module: trafficFlow, catalogue: trafficFlowKnobCatalogue, isLook: isTrafficLook, section: 'traffic flow' },
        {
            module: trafficIncidents,
            catalogue: trafficIncidentsKnobCatalogue,
            isLook: isTrafficLook,
            section: 'traffic incidents',
        },
        {
            module: terrain,
            catalogue: terrainKnobCatalogue,
            isLook: (id) => id.startsWith('hillshade.') && id !== 'hillshade.visible',
            section: 'hillshade',
        },
    ];
    // The typefaces are label settings, `labels.typeface` beside `labels.sizeFactor`, so they join that section.
    const panel = initStylingPanel(lookSources, { labels: document.querySelector('#ui-typeface') as HTMLElement });
    collapsibleSection('#ui-layerEdits', 'layer edits');
    initLayerEdits(styling);

    // Showing or hiding a whole layer group is BaseMapModule's, so its toggles are a panel of their own.
    const baseMapGroups = initBaseMapGroupsPanel(baseMap);
    const resetTypefaces = initTypefacePanel({ styling, routing, places, area });

    // Resets every look knob and typeface, keeping traffic and hillshade shown.
    document.querySelector('#ui-reset')?.addEventListener('click', () => {
        for (const { module, catalogue, isLook } of lookSources) {
            for (const { id } of catalogue) if (isLook?.(id) ?? true) resetKnob(module, catalogue, id);
        }
        baseMap.resetConfig();
        resetTypefaces();
    });

    // Map presets are named bundles of knob settings across the modules, listed by their catalogue too.
    const presetsSelector = document.querySelector('#ui-presets') as HTMLSelectElement;
    for (const preset of mapPresetCatalogue) {
        presetsSelector.add(new Option(preset.name, preset.id));
    }
    presetsSelector.addEventListener('change', () => {
        if (presetsSelector.value) applyMapPreset(map, presetsSelector.value as MapPresetId);
    });

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', async (event) => {
        // Knob settings survive the switch: the module re-applies them on the new style.
        await map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID);
        panel.render();
        baseMapGroups.render();
    });

    initTogglePanel();
})();
