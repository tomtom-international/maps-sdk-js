import { bboxFromGeoJSON, formatDistance, formatDuration, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    GeometriesModule,
    PlacesModule,
    prepareReachableRangesForDisplay,
    RoutingModule,
    reachableRangeGeometryConfig,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { calculateReachableRanges, calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';
import { EV_VEHICLE } from './vehicle';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const ROUTE_QUERIES = ['Munich, DE', 'Verona, IT'];
// A budget small enough to stay inside the destination's own region, so the polygon reads as
// "what you can still reach after arriving" rather than covering the whole route.
const RANGE_MINUTES = 20;

const element = <T extends HTMLElement>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};

const stepsList = element<HTMLElement>('#ui-steps');
const legsList = element<HTMLElement>('#ui-legs');
const statusText = element<HTMLElement>('#ui-status');

type Step = { label: string; detail: string };

// Each service call reports what it contributed, so the panel is a record of the chain rather than
// a summary of the last call.
const steps: Step[] = [];

const renderSteps = (): void => {
    stepsList.innerHTML = steps
        .map(
            (step, index) =>
                `<li class="ui-step" data-testid="step-${index}">
                    <span class="ui-step-label">${step.label}</span>
                    <span class="ui-step-detail">${step.detail}</span>
                </li>`,
        )
        .join('');
};

const addStep = (label: string, detail: string): void => {
    steps.push({ label, detail });
    renderSteps();
};

(async () => {
    initTogglePanel();
    statusText.textContent = 'Working…';

    // 1 — Geocoding. Two names in, two waypoints out, already in the shape the router takes.
    const waypoints = await Promise.all(ROUTE_QUERIES.map(geocodeOne));
    addStep('geocodeOne', `${waypoints.length} stops resolved from place names`);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(waypoints),
            fitBoundsOptions: { padding: 80 },
        },
    });

    const routingModule = await RoutingModule.create(map);
    const placesModule = await PlacesModule.create(map);
    const geometriesModule = await GeometriesModule.create(map, reachableRangeGeometryConfig('fadedRainbow', 'filled'));

    // 2 — Routing. An electric vehicle with charging preferences, so the service plans the charging
    // stops itself and reports how long the car sits at each one.
    const routes = await calculateRoute({ locations: waypoints, vehicle: EV_VEHICLE });
    const route = routes.features[0].properties;
    const legs = route.sections.leg;

    // Show the line and the pins sequentially — never in parallel.
    await routingModule.showRoutes(routes);
    await routingModule.showWaypoints(waypoints);

    const chargingStops = legs.filter((leg) => leg.summary.chargingInformationAtEndOfLeg).length;
    addStep(
        'calculateRoute',
        `${formatDistance(route.summary.lengthInMeters)} · ${formatDuration(route.summary.travelTimeInSeconds)} · ${chargingStops} charging stop${chargingStops === 1 ? '' : 's'}`,
    );

    // Every leg, with the time spent at the stop it ends at. `stopTimeInSeconds` is derived: the API
    // has no wait field, so it is the gap between this leg's arrival and the next leg's departure.
    legsList.innerHTML = legs
        .map((leg, index) => {
            const charging = leg.summary.chargingInformationAtEndOfLeg?.properties;
            const stopTime = formatDuration(leg.summary.stopTimeInSeconds);
            const where = charging?.chargingParkName ?? charging?.address?.freeformAddress;
            return `<li class="ui-leg" data-testid="leg-${index}">
                <span class="ui-leg-drive">${formatDistance(leg.summary.lengthInMeters)} · ${formatDuration(leg.summary.travelTimeInSeconds)} driving</span>
                <span class="ui-leg-stop">${stopTime ? `${stopTime} at ${where ?? 'the stop'}` : 'arrival'}</span>
            </li>`;
        })
        .join('');

    // 3 — Search, given the route the router just produced. The route feature goes straight in; no
    // reshaping, and the result is Places the map module draws directly.
    const alongRoute = await search({
        poiCategories: ['ELECTRIC_VEHICLE_STATION', 'REST_AREA'],
        route: routes.features[0],
        maxDetourTimeSeconds: 300,
        limit: 20,
    });
    await placesModule.show(alongRoute);
    addStep('search (along route)', `${alongRoute.features.length} places within a 5 min detour`);

    // 4 — Reachable range from the destination, drawn by the geometries module: a range is a
    // polygon, not a route, so it is a different module by design.
    const destination = waypoints[waypoints.length - 1];
    const ranges = await calculateReachableRanges([
        {
            origin: destination,
            budget: { type: 'timeMinutes', value: RANGE_MINUTES },
        },
    ]);
    await geometriesModule.show(prepareReachableRangesForDisplay(ranges));
    addStep('calculateReachableRanges', `${RANGE_MINUTES} min of driving from the destination`);

    statusText.textContent = '';
})();
