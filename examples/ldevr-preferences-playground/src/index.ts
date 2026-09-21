import {
    bboxFromGeoJSON,
    formatDistance,
    formatDuration,
    type LegSectionProps,
    TomTomConfig,
} from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import './style.css';
import { initTogglePanel } from './togglePanel';
import { buildVehicle } from './vehicleParams';

TomTomConfig.instance.put({ apiKey: API_KEY });

const ROUTE_QUERIES = ['Paris, FR', 'Amsterdam, NL'];

const element = <T extends HTMLElement>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};

const offsetSlider = element<HTMLInputElement>('#ui-offsetSlider');
const offsetValue = element<HTMLElement>('#ui-offsetValue');
const stopChargeSlider = element<HTMLInputElement>('#ui-stopChargeSlider');
const stopChargeValue = element<HTMLElement>('#ui-stopChargeValue');
const destinationChargeSlider = element<HTMLInputElement>('#ui-destinationChargeSlider');
const destinationChargeValue = element<HTMLElement>('#ui-destinationChargeValue');
const summaryList = element<HTMLElement>('#ui-summary');
const stopList = element<HTMLElement>('#ui-stops');
const statusText = element<HTMLElement>('#ui-status');

const sliders = [offsetSlider, stopChargeSlider, destinationChargeSlider];

// The vehicle is fixed; only these three preferences change between calculations.
const readPreferences = () => ({
    chargingTimeOffsetInSec: Number(offsetSlider.value),
    minChargeAtChargingStopsPCT: Number(stopChargeSlider.value),
    minChargeAtDestinationPCT: Number(destinationChargeSlider.value),
});

const renderSummary = (rows: [string, string][]): void => {
    summaryList.innerHTML = rows
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
};

// A leg that ends at a charging stop reports the whole time there as `stopTimeInSeconds`, and the
// charging part of it under `chargingInformationAtEndOfLeg`. On this route nothing else waits, so
// the two are the same number -- which is the clearest way to see the fixed offset land inside the
// charging time rather than beside it.
const renderStops = (legs: LegSectionProps[]): void => {
    const stops = legs
        .map((leg) => ({
            charging: leg.summary.chargingInformationAtEndOfLeg,
            stopTime: leg.summary.stopTimeInSeconds,
        }))
        .filter((entry) => entry.charging);

    if (stops.length === 0) {
        stopList.innerHTML = '<li class="ui-stop">No charging needed with these settings.</li>';
        return;
    }

    stopList.innerHTML = stops
        .map(({ charging, stopTime }) => {
            const properties = charging?.properties;
            const name = properties?.chargingParkName ?? properties?.address?.freeformAddress ?? 'Charging stop';
            const chargingTime = formatDuration(properties?.chargingTimeInSeconds) ?? '—';
            const targetCharge = properties?.targetChargeInkWh;

            return `<li class="ui-stop">
                <span class="ui-stop-name">${name}</span>
                <span class="ui-stop-detail">
                    ${formatDuration(stopTime) ?? chargingTime} at the stop${
                        targetCharge ? ` · to ${Math.round(targetCharge)} kWh` : ''
                    }
                </span>
            </li>`;
        })
        .join('');
};

const showRoute = async (routingModule: RoutingModule, locations: Awaited<ReturnType<typeof geocodeOne>>[]) => {
    for (const slider of sliders) slider.disabled = true;
    statusText.textContent = 'Calculating…';

    try {
        const routes = await calculateRoute({ locations, vehicle: buildVehicle(readPreferences()) });

        // Show the line and the pins sequentially — never in parallel.
        await routingModule.showRoutes(routes);
        await routingModule.showWaypoints(locations);

        const route = routes.features[0].properties;
        const legs = route.sections.leg;
        // Driving is the sum of the legs; the route's total is the only one that includes the stops.
        const drivingSeconds = legs.reduce((total, leg) => total + leg.summary.travelTimeInSeconds, 0);

        renderSummary([
            ['Distance', formatDistance(route.summary.lengthInMeters)],
            ['Driving', formatDuration(drivingSeconds) ?? '—'],
            ['Charging', formatDuration(route.summary.totalChargingTimeInSeconds) ?? 'none'],
            ['Journey', formatDuration(route.summary.travelTimeInSeconds) ?? '—'],
        ]);
        renderStops(legs);
        statusText.textContent = '';
    } catch (error) {
        renderSummary([]);
        stopList.innerHTML = '';
        statusText.textContent = error instanceof Error ? error.message : 'Could not calculate the route.';
    } finally {
        for (const slider of sliders) slider.disabled = false;
    }
};

(async () => {
    initTogglePanel();

    const locations = await Promise.all(ROUTE_QUERIES.map(geocodeOne));

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(locations),
            fitBoundsOptions: { padding: 80 },
        },
    });

    const routingModule = await RoutingModule.create(map);

    // `input` keeps the labels up with the drag, `change` fires once on release — one route per
    // adjustment rather than one per pixel.
    offsetSlider.addEventListener('input', () => {
        offsetValue.textContent = formatDuration(Number(offsetSlider.value)) ?? 'none';
    });
    stopChargeSlider.addEventListener('input', () => {
        stopChargeValue.textContent = `${stopChargeSlider.value}%`;
    });
    destinationChargeSlider.addEventListener('input', () => {
        destinationChargeValue.textContent = `${destinationChargeSlider.value}%`;
    });
    for (const slider of sliders) {
        slider.addEventListener('change', () => void showRoute(routingModule, locations));
    }

    await showRoute(routingModule, locations);
})();
