import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    RoutingModule,
    type RoutingModuleConfig,
    routingKnobCatalogue,
    type StandardStyleID,
    type SummaryBubbleLabelConfig,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';
import { initKnobPanel } from './knobPanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

// Room on the right for the panel, so the routes frame themselves beside it rather than under it.
const FIT_PADDING = { top: 80, bottom: 80, left: 80, right: 380 };

// The routes come back best first, so the first one is the fastest by default.
const routeNames: SummaryBubbleLabelConfig['title'] = (summary) => {
    const { routeIndex, formattedDuration } = summary.properties;
    return routeIndex === 0 ? `Fastest · ${formattedDuration}` : `Option ${routeIndex + 1} · ${formattedDuration}`;
};

(async () => {
    const waypoints = await Promise.all([geocodeOne('Amsterdam'), geocodeOne('Rotterdam')]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: FIT_PADDING },
        },
    });

    // Each alternative's bubble says how much longer the trip takes than the selected one.
    const routing = await RoutingModule.create(map, {
        summaryBubbles: { fields: ['duration', 'durationDifference', 'trafficDelay'] },
    });
    await routing.showWaypoints(waypoints);
    await routing.showRoutes(await calculateRoute({ locations: waypoints, maxAlternatives: 2 }));

    // A click on an alternative selects it: its bubble takes the selected look, and the others are timed
    // against it.
    routing.events.mainLines
        .where((route) => route.properties.routeState === 'deselected')
        .on('click', (route) => routing.selectRoute(route.properties.index));

    // A title function is no knob, so this toggle sets the config itself. Every knob the panel set
    // stays, since the config is read back first.
    const namedRoutes = document.getElementById('ui-namedRoutes') as HTMLInputElement;
    namedRoutes.addEventListener('change', () => {
        const config: RoutingModuleConfig = routing.getConfig() ?? {};
        routing.applyConfig({
            ...config,
            summaryBubbles: {
                ...config.summaryBubbles,
                label: { ...config.summaryBubbles?.label, title: namedRoutes.checked ? routeNames : undefined },
            },
        });
    });

    // A dark style turns the bubbles dark, unless a knob gave them a colour of their own.
    const styleSelector = document.getElementById('ui-style') as HTMLSelectElement;
    styleSelector.addEventListener('change', () => map.setStyle(styleSelector.value as StandardStyleID));

    // The catalogue lists every bubble setting with its kind, range and default, which is all the
    // panel needs to build a control for each.
    initKnobPanel(
        'ui-knobs',
        routingKnobCatalogue.filter(({ id }) => id.startsWith('summaryBubbles.')),
        routing,
    );

    const toggle = document.querySelector('.ui-heading-toggle');
    const content = document.querySelector('.ui-panel-content');
    toggle?.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        content?.classList.toggle('collapsed');
    });
})();
