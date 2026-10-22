import {
    bboxFromGeoJSON,
    formatDistance,
    formatDuration,
    type Place,
    type Routes,
    TomTomConfig,
} from '@tomtom-org/maps-sdk/core';
import { PlacesModule, RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, createLatestRequest, geocode } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';
import { type Store, stores } from './stores';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const SHORTLIST_SIZE = 3;
const PADDING = { top: 100, bottom: 80, left: 80, right: 400 };

const searchForm = document.getElementById('ui-search') as HTMLFormElement;
const addressInput = document.getElementById('ui-address') as HTMLInputElement;
const statusText = document.getElementById('ui-status') as HTMLParagraphElement;
const storeList = document.getElementById('ui-stores') as HTMLOListElement;

// Only compared with each other, so a flat projection is close enough within one city.
const straightLineDistance = ([fromLng, fromLat]: number[], [toLng, toLat]: number[]) =>
    Math.hypot((toLng - fromLng) * Math.cos((fromLat * Math.PI) / 180), toLat - fromLat);

const summaryOf = (routes: Routes) => routes.features[0].properties.summary;
const storeByID = (id: string | undefined) => stores.features.find((store) => store.id === id);

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', bounds: bboxFromGeoJSON(stores), fitBoundsOptions: { padding: PADDING } },
    });
    const routingModule = await RoutingModule.create(map);
    const placesModule = await PlacesModule.create<Store>(map, {
        color: '#b4530a',
        label: { title: (store) => store.properties.name },
    });
    await placesModule.show(stores);

    let visitor: Place;
    let ranked: { store: Place<Store>; routes: Routes }[] = [];
    let selectedID: string | undefined;

    const selectStore = async (store: Place<Store>) => {
        selectedID = store.id;
        placesModule.setEventState({ id: store.id, state: 'click' });
        for (const button of storeList.querySelectorAll('button')) {
            button.classList.toggle('ui-selected', button.dataset.storeId === store.id);
        }
        // A store off the shortlist has no route yet, so a click on its pin plans one.
        const routes =
            ranked.find((entry) => entry.store.id === store.id)?.routes ??
            (await calculateRoute({ locations: [visitor, store] }));
        if (selectedID === store.id) await routingModule.showRoutes(routes);
    };

    const lookUpNearestStores = async (address: string, signal: AbortSignal) => {
        const geoBias = { position: map.mapLibreMap.getCenter().toArray() };
        const [origin] = (await geocode({ query: address, limit: 1, geoBias, filters: { countries: ['NL'] }, signal }))
            .features;
        if (!origin) return undefined;

        const shortlist = [...stores.features]
            .sort(
                (first, second) =>
                    straightLineDistance(origin.geometry.coordinates, first.geometry.coordinates) -
                    straightLineDistance(origin.geometry.coordinates, second.geometry.coordinates),
            )
            .slice(0, SHORTLIST_SIZE);
        const routes = await Promise.all(
            shortlist.map((store) => calculateRoute({ locations: [origin, store], signal })),
        );
        return { origin, shortlist, routes };
    };

    // A newer search retires the one still in flight, so its late answer cannot repaint the list.
    const latestSearch = createLatestRequest();

    const findNearestStores = async (address: string) => {
        statusText.textContent = 'Finding your nearest stores…';
        const found = await latestSearch.run((signal) => lookUpNearestStores(address, signal));
        if (!found.current) return;
        if (!found.value) {
            statusText.textContent = `No address found for "${address}".`;
            return;
        }
        const { origin, shortlist, routes } = found.value;
        visitor = origin;

        const bounds = bboxFromGeoJSON(routes);
        if (bounds) map.mapLibreMap.fitBounds(bounds, { padding: PADDING, animate: false });
        ranked = shortlist
            .map((store, index) => ({ store, routes: routes[index] }))
            .sort(
                (first, second) =>
                    summaryOf(first.routes).travelTimeInSeconds - summaryOf(second.routes).travelTimeInSeconds,
            );

        storeList.innerHTML = ranked
            .map(({ store, routes }) => {
                const { travelTimeInSeconds, lengthInMeters } = summaryOf(routes);
                return `<li><button class="ui-store" data-store-id="${store.id}">
                    <span class="ui-store-name">${store.properties.name}</span>
                    <span class="ui-store-address">${store.properties.address.freeformAddress}</span>
                    <span class="ui-store-trip">${formatDuration(travelTimeInSeconds)} · ${formatDistance(lengthInMeters)}</span>
                </button></li>`;
            })
            .join('');
        statusText.textContent = '';

        await routingModule.showWaypoints([origin]);
        await selectStore(ranked[0].store);
    };

    await findNearestStores(addressInput.value);

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        void findNearestStores(addressInput.value);
    });
    storeList.addEventListener('click', (event) => {
        const store = storeByID((event.target as HTMLElement).closest('button')?.dataset.storeId);
        if (store) void selectStore(store);
    });
    placesModule.events.places.on('click', (place) => {
        const store = storeByID(place.id);
        if (store) void selectStore(store);
    });
})();
