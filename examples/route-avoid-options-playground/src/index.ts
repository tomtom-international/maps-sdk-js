import {
    BBox,
    bboxFromGeoJSON,
    getSectionBBox,
    inputSectionTypes,
    Route,
    SectionProps,
    TomTomConfig,
    Waypoint,
} from '@tomtom-org/maps-sdk/core';
import { RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne } from '@tomtom-org/maps-sdk/services';
import type { LngLat } from 'maplibre-gl';
import { setupAvoidedAreas } from './avoidedAreas';
import { setupAvoidOptions } from './avoidOptions';
import { API_KEY } from './config';
import { buildAvoidHTML, createSectionPopup } from './popup';
import './style.css';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const [paris, amsterdam]: Waypoint[] = await Promise.all([geocodeOne('London'), geocodeOne('Brussels')]);

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: bboxFromGeoJSON([paris, amsterdam]),
            fitBoundsOptions: { padding: 100 },
        },
    });

    const routingModule = await RoutingModule.get(map);

    let currentRoute: Route;
    let activePopup: ReturnType<typeof createSectionPopup> | null = null;
    let suppressNextMapClick = false;
    let avoidedAreasManager!: ReturnType<typeof setupAvoidedAreas>;
    let avoidOptions!: ReturnType<typeof setupAvoidOptions>;

    const recalculate = async () => {
        const activeAvoidTypes = avoidOptions.activeAvoidTypes;
        const avoid = activeAvoidTypes.size > 0 ? [...activeAvoidTypes] : undefined;
        const areas = avoidedAreasManager.areas;
        const avoidAreas = areas.length > 0 ? areas.map((a) => a.bbox) : undefined;
        const routeResult = await calculateRoute({
            locations: [paris, amsterdam],
            costModel: { avoid, avoidAreas },
            sectionTypes: inputSectionTypes,
        });
        currentRoute = routeResult.features[0];
        await routingModule.showWaypoints([paris, amsterdam]);
        await routingModule.showRoutes(routeResult);
    };

    avoidedAreasManager = setupAvoidedAreas(
        map.mapLibreMap,
        async (index) => {
            avoidedAreasManager.remove(index);
            await recalculate();
        },
        () => {
            suppressNextMapClick = true;
        },
    );
    avoidOptions = setupAvoidOptions(recalculate, async () => {
        avoidedAreasManager.reset();
        await recalculate();
    });

    const showAvoidPopup = (lngLat: LngLat, bbox: BBox, label: string) => {
        suppressNextMapClick = true;
        activePopup?.remove();
        const popup = createSectionPopup().setLngLat(lngLat).setHTML(buildAvoidHTML()).addTo(map.mapLibreMap);
        activePopup = popup;
        popup
            .getElement()
            .querySelector('.avoid-popup-btn')
            ?.addEventListener('click', async () => {
                popup.remove();
                activePopup = null;
                avoidedAreasManager.add({ bbox, label });
                await recalculate();
            });
    };

    const initialResult = await calculateRoute({ locations: [paris, amsterdam], sectionTypes: inputSectionTypes });
    currentRoute = initialResult.features[0];
    routingModule.showWaypoints([paris, amsterdam]);
    routingModule.showRoutes(initialResult);

    const makeClickHandler = (typeLabel: string) => (section: { properties: SectionProps }, lngLat: LngLat) => {
        const bbox = getSectionBBox(currentRoute, section.properties);
        if (bbox) showAvoidPopup(lngLat, bbox, typeLabel);
    };

    routingModule.events.ferries.on('click', makeClickHandler('Ferry'));
    routingModule.events.tollRoads.on('click', makeClickHandler('Toll Road'));
    routingModule.events.tunnels.on('click', makeClickHandler('Tunnel'));
    routingModule.events.vehicleRestricted.on('click', makeClickHandler('Restricted'));
    routingModule.events.incidents.on('click', (section, lngLat) => {
        const bbox = getSectionBBox(currentRoute, section.properties);
        if (bbox) showAvoidPopup(lngLat, bbox, section.properties.categories.join(', '));
    });

    // Close all popups on empty map click (skip when a layer click just opened one).
    map.mapLibreMap.on('click', () => {
        if (suppressNextMapClick) {
            suppressNextMapClick = false;
            return;
        }
        activePopup?.remove();
        activePopup = null;
        avoidedAreasManager.closeClearPopup();
    });

    initTogglePanel();
})();
