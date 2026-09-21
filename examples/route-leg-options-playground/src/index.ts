import { bboxFromGeoJSON, formatDistance, formatDuration, type Place, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, type GeocodingProps, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import { buildLegPanel, type LegPanel, type LegStats } from './legPanel';
import './style.css';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

const STOP_QUERIES = ['Barcelona, Spain', 'Mataró, Spain', 'Girona, Spain', 'Figueres, Spain'];

// Fixed in code, not a control: the panel is about per-leg options, and a route that waits
// somewhere is what makes each leg's reported stop time worth showing. The destination cannot wait.
const WAIT_SECONDS_BY_STOP: Record<number, number> = { 1: 10 * 60, 2: 5 * 60 };

const element = <T extends HTMLElement>(selector: string): T => {
    const found = document.querySelector<T>(selector);
    if (!found) throw new Error(`Missing element: ${selector}`);

    return found;
};

const legContainer = element<HTMLElement>('#ui-legs');
const totalsList = element<HTMLElement>('#ui-totals');
const statusText = element<HTMLElement>('#ui-status');

const placeName = (place: Place<GeocodingProps>): string =>
    place.properties.poi?.name ?? place.properties.address?.freeformAddress ?? 'Stop';

const renderTotals = (rows: [string, string][]): void => {
    totalsList.innerHTML = rows
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
};

// A leg's options live on the stop it *arrives at*, so leg 0 carries them on places[1]. That keeps
// each leg's settings with the right stop if another one is inserted earlier in the list.
const buildLocations = (places: Place<GeocodingProps>[], costModels: LegPanel['costModels']) =>
    places.map((place, stopIndex) => {
        const legCostModel = stopIndex > 0 ? costModels[stopIndex - 1] : undefined;
        const pauseDurationSeconds = WAIT_SECONDS_BY_STOP[stopIndex];
        const hasLegCostModel = legCostModel && Object.keys(legCostModel).length > 0;
        if (!hasLegCostModel && !pauseDurationSeconds) return place;

        return {
            ...place,
            properties: {
                ...place.properties,
                ...(hasLegCostModel && { legCostModel }),
                ...(pauseDurationSeconds && { pauseDurationSeconds }),
            },
        };
    });

const calculateAndShow = async (
    routingModule: RoutingModule,
    places: Place<GeocodingProps>[],
    costModels: LegPanel['costModels'],
): Promise<LegStats[]> => {
    const locations = buildLocations(places, costModels);
    const routes = await calculateRoute({ locations });

    // Show the line and the pins sequentially — never in parallel.
    await routingModule.showRoutes(routes);
    await routingModule.showWaypoints(locations);

    const route = routes.features[0];
    const summary = route.properties.summary;
    renderTotals([
        ['Distance', formatDistance(summary.lengthInMeters)],
        ['Travel time', formatDuration(summary.travelTimeInSeconds) ?? '—'],
    ]);

    return route.properties.sections.leg.map((leg) => ({
        lengthInMeters: leg.summary.lengthInMeters,
        travelTimeInSeconds: leg.summary.travelTimeInSeconds,
        stopTimeInSeconds: leg.summary.stopTimeInSeconds,
    }));
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

    // The panel is driven by the legs of the calculated route, so it is only built once the first
    // route is in — the route says how many legs there are.
    statusText.textContent = 'Calculating…';
    const initialStats = await calculateAndShow(routingModule, places, []);
    statusText.textContent = '';

    const legNames = initialStats.map((_stats, legIndex): [string, string] => [
        placeName(places[legIndex]),
        placeName(places[legIndex + 1]),
    ]);

    let panel: LegPanel;
    let pending = false;

    const recalculate = async (): Promise<void> => {
        if (pending) return;

        pending = true;
        panel.setBusy(true);
        statusText.textContent = 'Calculating…';

        try {
            panel.setStats(await calculateAndShow(routingModule, places, panel.costModels));
            statusText.textContent = '';
        } catch (error) {
            statusText.textContent = error instanceof Error ? error.message : 'Could not calculate the route.';
        } finally {
            pending = false;
            panel.setBusy(false);
        }
    };

    panel = buildLegPanel(legContainer, legNames, () => void recalculate());
    panel.setStats(initialStats);
})();
