import { geographyTypes, type Place, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, discoverPlaces, geometryData } from '@tomtom-org/maps-sdk/services';
import { without } from 'lodash-es';
import { type LngLatBoundsLike, Popup } from 'maplibre-gl';
import './style.css';
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';
import { API_KEY } from './config';
import { chargingPointsHTML, connectorsHTML, escapeHtml } from './htmlTemplates';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const evBrandTextBox = document.querySelector('#ui-evBrandTextBox') as HTMLInputElement;
    const areaTextBox = document.querySelector('#ui-areaTextBox') as HTMLInputElement;
    const fitBoundsOptions = { padding: 50 };
    const popUp = new Popup({
        closeButton: false,
        offset: 35,
        className: 'ui-maps-sdk-js-popup',
    });

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [2.3597, 48.85167],
            zoom: 11,
            fitBoundsOptions,
        },
    });

    const mapBasePOIs = await POIsModule.get(map, {
        filters: {
            categories: { show: 'all-except', values: ['CHARGING_LOCATION'] },
        },
    });
    const mapEVStationsId = 'ev-stations';
    const placesLayers = new ViewportPlaces(map);
    // Places modules stack in creation order, so the base-map styled viewport stations
    // are added first for the searched and selected pins below to render on top of them.
    const mapEVStationsModule = await placesLayers.addPOICategories({
        id: mapEVStationsId,
        categories: ['CHARGING_LOCATION'],
        minZoom: 7,
    });

    const mapSearchedEVStationsModule = await PlacesModule.create(map);
    const selectedEVStationModule = await PlacesModule.create(map);
    const mapGeometryModule = await GeometriesModule.create(map, { fill: { style: 'inverted' } });

    let minPowerKWMapEVStations = 50;
    let minPowerKWSearchedEVStations = 0;
    const latestSearch = createLatestRequest();

    const showPopup = (evStation: Place) => {
        const { address, poi, chargingPark } = evStation.properties;
        popUp
            .setHTML(
                `
                    <div class="ui-popup-header">
                        <h3 class="ui-popup-title">${escapeHtml(poi?.name ?? '')}</h3>
                        <span class="ui-address">${escapeHtml(address.freeformAddress)}</span>
                    </div>
                    ${
                        chargingPark
                            ? connectorsHTML(chargingPark) + chargingPointsHTML(chargingPark)
                            : '<p class="ui-popup-empty">Charging park data not available.</p>'
                    }
                `,
            )
            .setLngLat(evStation.geometry.coordinates as [number, number])
            .addTo(map.mapLibreMap);
    };

    const searchEVStations = async () => {
        popUp.remove();
        mapBasePOIs.setVisible(false);

        const search = await latestSearch.run(async (signal) => {
            const areaToSearch =
                areaTextBox.value &&
                (await discoverPlaces({
                    query: areaTextBox.value,
                    filters: { geographyTypes: without(geographyTypes, 'Country') },
                    limit: 1,
                    signal,
                }));

            areaToSearch && map.mapLibreMap.fitBounds(areaToSearch.bbox as LngLatBoundsLike, fitBoundsOptions);
            const geometryToSearch = areaToSearch && (await geometryData({ geometries: areaToSearch, signal }));
            if (geometryToSearch) {
                mapGeometryModule.show(geometryToSearch);
            } else {
                mapGeometryModule.clear();
            }

            return discoverPlaces({
                query: evBrandTextBox.value,
                ...(geometryToSearch
                    ? { geometries: [geometryToSearch] }
                    : { geoBias: { boundingBox: map.getBBox() } }),
                filters: {
                    poiCategories: ['CHARGING_LOCATION'],
                    minPowerKW: minPowerKWSearchedEVStations,
                },
                limit: 100,
                signal,
            });
        });
        if (search.current) mapSearchedEVStationsModule.show(search.value);
    };

    const clear = () => {
        latestSearch.cancel();
        evBrandTextBox.value = '';
        areaTextBox.value = '';
        popUp.remove();
        mapSearchedEVStationsModule.clear();
        selectedEVStationModule.clear();
        mapGeometryModule.clear();
        mapBasePOIs.setVisible(true);
    };

    const selectEVStation = (evStation: Place) => {
        selectedEVStationModule.show(evStation);
        showPopup(evStation);
    };

    const listenToMapUserEvents = () => {
        mapEVStationsModule.events.places.on('click', selectEVStation);
        mapSearchedEVStationsModule.events.places.on('click', selectEVStation);
        popUp.on('close', () => selectedEVStationModule.clear());
    };

    const listenToHTMLUserEvents = () => {
        const searchButton = document.querySelector('#ui-searchButton') as HTMLButtonElement;
        searchButton.addEventListener('click', searchEVStations);
        (document.querySelector('#ui-clearButton') as HTMLButtonElement).addEventListener('click', clear);
        evBrandTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
        areaTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

        const minPowerKWMapEVStationsInput = document.querySelector('#ui-minPowerKWMapEVStations') as HTMLInputElement;
        minPowerKWMapEVStationsInput.value = String(minPowerKWMapEVStations);
        const minPowerKWSearchedEVStationsInput = document.querySelector(
            '#ui-minPowerKWSearchedEVStations',
        ) as HTMLInputElement;
        minPowerKWSearchedEVStationsInput.value = String(minPowerKWSearchedEVStations);
        minPowerKWMapEVStationsInput.addEventListener('keyup', async () => {
            minPowerKWMapEVStations = Number(minPowerKWMapEVStationsInput.value);
            await placesLayers.update({
                id: mapEVStationsId,
                searchOptions: { filters: { minPowerKW: minPowerKWMapEVStations } },
            });
        });
        minPowerKWSearchedEVStationsInput.addEventListener(
            'keyup',
            () => (minPowerKWSearchedEVStations = Number(minPowerKWSearchedEVStationsInput.value)),
        );
    };

    listenToMapUserEvents();
    listenToHTMLUserEvents();
})();
