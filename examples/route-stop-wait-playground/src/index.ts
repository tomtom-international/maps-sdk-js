import { bboxFromGeoJSON, formatDistance, formatDuration, type Place, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, type GeocodingProps, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

const STOP_QUERIES = ['Barcelona, Spain', 'Mataró, Spain', 'Girona, Spain'];

const element = <T extends HTMLElement>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};

const waitSlider = element<HTMLInputElement>('#ui-waitSlider');
const waitValue = element<HTMLElement>('#ui-waitValue');
const summaryList = element<HTMLElement>('#ui-summary');
const statusText = element<HTMLElement>('#ui-status');

const renderSummary = (rows: [string, string][]): void => {
    summaryList.innerHTML = rows
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
};

const showRoute = async (routingModule: RoutingModule, places: Place<GeocodingProps>[]): Promise<void> => {
    const waitSeconds = Number(waitSlider.value) * 60;
    const [origin, stop, destination] = places;

    // The wait rides on the stop's own properties, alongside what the geocoder returned, so the pin
    // ends up labelled with both the place name and the wait.
    const locations = [
        origin,
        { ...stop, properties: { ...stop.properties, pauseDurationSeconds: waitSeconds } },
        destination,
    ];

    waitSlider.disabled = true;
    statusText.textContent = 'Calculating…';

    try {
        const routes = await calculateRoute({ locations });

        // Show the line and the pins sequentially — never in parallel.
        await routingModule.showRoutes(routes);
        await routingModule.showWaypoints(locations);

        const route = routes.features[0].properties;
        const summary = route.summary;
        // Both come off the response, so the request does not have to be remembered: each leg
        // reports the wait at the stop it arrives at, and its own travel time is driving only —
        // the route's total is the one that includes the waits.
        const drivingSeconds = route.sections.leg.reduce((total, leg) => total + leg.summary.travelTimeInSeconds, 0);
        // `stopTimeInSeconds` is the whole time at a stop; on an EV route part of it could be
        // charging, which `chargingInformationAtEndOfLeg` would break out. Nothing charges here.
        const waitingSeconds = route.sections.leg.reduce(
            (total, leg) => total + (leg.summary.stopTimeInSeconds ?? 0),
            0,
        );

        renderSummary([
            ['Distance', formatDistance(summary.lengthInMeters)],
            ['Driving', formatDuration(drivingSeconds) ?? '—'],
            ['Waiting', formatDuration(waitingSeconds) ?? 'none'],
            ['Journey', formatDuration(summary.travelTimeInSeconds) ?? '—'],
            ['Arrival', summary.arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
        ]);
        statusText.textContent = '';
    } catch (error) {
        renderSummary([]);
        statusText.textContent = error instanceof Error ? error.message : 'Could not calculate the route.';
    } finally {
        waitSlider.disabled = false;
    }
};

(async () => {
    initTogglePanel();

    const places = await Promise.all(STOP_QUERIES.map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(places),
            fitBoundsOptions: { padding: 80 },
        },
    });

    const routingModule = await RoutingModule.create(map);

    // `input` fires per pixel dragged, `change` once the slider is released — so the label keeps up
    // while only one route is calculated per adjustment.
    waitSlider.addEventListener('input', () => {
        waitValue.textContent = `${waitSlider.value} min`;
    });
    waitSlider.addEventListener('change', () => void showRoute(routingModule, places));

    await showRoute(routingModule, places);
})();
