import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { DrawnSectionType } from '@tomtom-org/maps-sdk/map';
import { drawnSectionTypes, RoutingModule, sectionSourceKey, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, SDKAbortError } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import { PICKABLE_ROUTES } from './routes';
import { buildConfig, buildInitialState } from './sectionsConfig';
import { initSectionsPanel } from './sectionsPanel';
import './style.css';

TomTomConfig.instance.put({ apiKey: API_KEY });

// Room on the right for the panel, so a picked route frames itself beside it rather than under it.
const FIT_PADDING = { top: 60, bottom: 60, left: 60, right: 340 };

// A section type is only in the response when it was asked for, so ask for every type the map
// draws. `drawnSectionTypes` is the SDK's own list of them.
const SECTION_TYPES = [...drawnSectionTypes];

(async () => {
    const [firstRoute] = PICKABLE_ROUTES;
    const routes = await calculateRoute({ locations: firstRoute.locations, sectionTypes: SECTION_TYPES });

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON(routes),
            fitBoundsOptions: { padding: FIT_PADDING },
            // The view goes in the URL, so a stretch worth looking at can be linked to — the speed
            // limit signs only draw once a stretch is long enough on screen to carry one.
            hash: true,
        },
    });

    const state = buildInitialState();

    const routingModule = await RoutingModule.create(map, buildConfig(state));
    await routingModule.showWaypoints(firstRoute.locations);
    await routingModule.showRoutes(routes);

    // Each section type files its features under its own key, so one `getShown()` says which types
    // the route currently on the map actually has.
    const sectionCounts = (): Record<DrawnSectionType, number> => {
        const shown = routingModule.getShown();
        return Object.fromEntries(
            drawnSectionTypes.map((type) => [type, shown[sectionSourceKey(type)]?.features.length ?? 0]),
        ) as Record<DrawnSectionType, number>;
    };

    const panel = initSectionsPanel({
        map,
        state,
        sectionCounts: sectionCounts(),
        apply: () => routingModule.applyConfig(buildConfig(state)),
    });

    let controller: AbortController | undefined;

    const showPickedRoute = async (index: number): Promise<void> => {
        // Picking again while a plan is still in flight would let the slower response paint last,
        // leaving the map on a route the picker no longer names.
        controller?.abort();
        controller = new AbortController();

        const { locations } = PICKABLE_ROUTES[index];
        try {
            const picked = await calculateRoute({
                locations,
                sectionTypes: SECTION_TYPES,
                signal: controller.signal,
            });
            // `showRoutes` replaces what each section source holds, so the previous route's
            // stretches go with it — no clear in between.
            await routingModule.showWaypoints(locations);
            await routingModule.showRoutes(picked);

            const bounds = bboxFromGeoJSON(picked);
            if (bounds) map.mapLibreMap.fitBounds(bounds, { padding: FIT_PADDING });

            panel.setSectionCounts(sectionCounts());
        } catch (error) {
            // A superseded pick is expected to abort — the one that replaced it paints instead.
            if (error instanceof SDKAbortError) return;

            throw error;
        }
    };

    const picker = document.getElementById('route-picker') as HTMLSelectElement;
    picker.innerHTML = PICKABLE_ROUTES.map(({ label }, index) => `<option value="${index}">${label}</option>`).join('');
    picker.addEventListener('change', () => showPickedRoute(Number(picker.value)));
})();
