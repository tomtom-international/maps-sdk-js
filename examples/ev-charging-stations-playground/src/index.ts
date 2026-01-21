import {
    type EVChargingStationWithAvailabilityPlaceProps,
    geographyTypes,
    type Place,
    type PolygonFeatures,
    TomTomConfig,
} from '@tomtom-org/maps-sdk/core';
import { GeometriesModule, PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    geometryData,
    getPlacesWithEVAvailability,
    getPlaceWithEVAvailability,
    search,
} from '@tomtom-org/maps-sdk/services';
import { bboxPolygon, difference } from '@turf/turf';
import { without } from 'lodash-es';
import { type LngLatBoundsLike, Popup } from 'maplibre-gl';
import './style.css';
import { ViewportPlaces } from '@tomtom-org/maps-sdk-plugin-viewport-places';
import { API_KEY } from './config';
import { connectorsHTML } from './htmlTemplates';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const evBrandTextBox = document.querySelector('#sdk-example-evBrandTextBox') as HTMLInputElement;
    const areaTextBox = document.querySelector('#sdk-example-areaTextBox') as HTMLInputElement;
    const fitBoundsOptions = { padding: 50 };
    const popUp = new Popup({
        closeButton: false,
        offset: 35,
        className: 'maps-sdk-js-popup',
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
            categories: { show: 'all_except', values: ['ELECTRIC_VEHICLE_STATION'] },
        },
    });
    const placesLayers = new ViewportPlaces(map);
    let mapEVStationsModule: PlacesModule | null = null;

    const buildAvailabilityText = (place: Place<EVChargingStationWithAvailabilityPlaceProps>): string => {
        const availability = getChargingPointAvailability(place);
        return availability ? `${availability.availableCount}/${availability.totalCount}` : '';
    };

    const evStationPinConfig: PlacesModuleConfig = {
        extraFeatureProps: {
            availabilityText: buildAvailabilityText,
            availabilityRatio: (place: Place<EVChargingStationWithAvailabilityPlaceProps>) =>
                getChargingPointAvailability(place)?.ratio ?? 0,
        },
        text: {
            title: [
                'format',
                ['get', 'title'],
                {},
                '\n',
                {},
                ['get', 'availabilityText'],
                {
                    'font-scale': 1.1,
                    'text-color': [
                        'case',
                        ['>=', ['get', 'availabilityRatio'], 0.25],
                        'green',
                        ['>', ['get', 'availabilityRatio'], 0],
                        'orange',
                        'red',
                    ],
                },
            ],
        },
    };

    const mapSearchedEVStationsModule = await PlacesModule.get(map, evStationPinConfig);
    const selectedEVStationModule = await PlacesModule.get(map, evStationPinConfig);
    const mapGeometryModule = await GeometriesModule.get(map);

    let minPowerKWMapEVStations = 50;
    let minPowerKWSearchedEVStations = 0;

    const mapEVStationsId = 'ev-stations';

    const showPopup = (evStation: Place | Place<EVChargingStationWithAvailabilityPlaceProps>) => {
        const { address, poi, chargingPark } = evStation.properties;
        popUp
            .setHTML(
                `
                    <h3>${poi?.name}</h3>
                    <label class="sdk-example-address sdk-example-label">${address.freeformAddress}</label>
                    <br/><br/>
                    ${chargingPark ? connectorsHTML(chargingPark) : 'Charging park data not available.'}
                `,
            )
            .setLngLat(evStation.geometry.coordinates as [number, number])
            .addTo(map.mapLibreMap);
    };

    // inverts the polygon, so it looks like a hole on the map instead
    const invert = (geometry: PolygonFeatures): PolygonFeatures => {
        const invertedArea = difference({
            type: 'FeatureCollection',
            features: [bboxPolygon([-180, 90, 180, -90]), geometry?.features?.[0]],
        });
        return invertedArea
            ? ({
                  type: 'FeatureCollection',
                  features: [invertedArea],
              } as PolygonFeatures)
            : geometry;
    };

    const searchEVStations = async () => {
        popUp.remove();
        mapBasePOIs.setVisible(false);

        const areaToSearch =
            areaTextBox.value &&
            (await search({
                query: areaTextBox.value,
                geographyTypes: without(geographyTypes, 'Country'),
                limit: 1,
            }));

        areaToSearch && map.mapLibreMap.fitBounds(areaToSearch.bbox as LngLatBoundsLike, fitBoundsOptions);
        const geometryToSearch = areaToSearch && (await geometryData({ geometries: areaToSearch }));
        if (geometryToSearch) {
            mapGeometryModule.show(invert(geometryToSearch));
        } else {
            mapGeometryModule.clear();
        }

        const places = await search({
            query: evBrandTextBox.value,
            ...(geometryToSearch && { geometries: [geometryToSearch] }),
            ...(!geometryToSearch && { boundingBox: map.getBBox() }),
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            minPowerKW: minPowerKWSearchedEVStations,
            limit: 100,
        });
        // We first show the places, then fetch their EV availability and show them again:
        mapSearchedEVStationsModule.show(places);
        mapSearchedEVStationsModule.show(await getPlacesWithEVAvailability(places));
    };

    const clear = () => {
        evBrandTextBox.value = '';
        areaTextBox.value = '';
        popUp.remove();
        mapSearchedEVStationsModule.clear();
        selectedEVStationModule.clear();
        mapGeometryModule.clear();
        mapBasePOIs.setVisible(true);
    };

    const selectEVStation = (evStation: Place | Place<EVChargingStationWithAvailabilityPlaceProps>) => {
        selectedEVStationModule.show(evStation);
        showPopup(evStation);
    };

    const listenToMapUserEvents = async () => {
        mapEVStationsModule?.events.on('click', async (evStation) =>
            selectEVStation((await getPlaceWithEVAvailability(evStation)) ?? evStation),
        );
        mapSearchedEVStationsModule.events.on('click', async (evWithAvailability) =>
            selectEVStation(evWithAvailability),
        );
        popUp.on('close', () => selectedEVStationModule.clear());
    };

    const listenToHTMLUserEvents = () => {
        const searchButton = document.querySelector('#searchButton') as HTMLButtonElement;
        searchButton.addEventListener('click', searchEVStations);
        (document.querySelector('#clearButton') as HTMLButtonElement).addEventListener('click', clear);
        evBrandTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());
        areaTextBox.addEventListener('keypress', (event) => event.key === 'Enter' && searchButton.click());

        const minPowerKWMapEVStationsInput = document.querySelector('#minPowerKWMapEVStations') as HTMLInputElement;
        minPowerKWMapEVStationsInput.value = String(minPowerKWMapEVStations);
        const minPowerKWSearchedEVStationsInput = document.querySelector(
            '#minPowerKWSearchedEVStations',
        ) as HTMLInputElement;
        minPowerKWSearchedEVStationsInput.value = String(minPowerKWSearchedEVStations);
        minPowerKWMapEVStationsInput.addEventListener('keyup', async () => {
            minPowerKWMapEVStations = Number(minPowerKWMapEVStationsInput.value);
            await placesLayers.update({ id: mapEVStationsId, searchOptions: { minPowerKW: minPowerKWMapEVStations } });
        });
        minPowerKWSearchedEVStationsInput.addEventListener(
            'keyup',
            () => (minPowerKWSearchedEVStations = Number(minPowerKWSearchedEVStationsInput.value)),
        );
    };

    const getChargingPointAvailability = (
        place: Place | Place<EVChargingStationWithAvailabilityPlaceProps>,
    ): { availableCount: number; totalCount: number; ratio: number } | undefined => {
        const chargingPark = place.properties.chargingPark;
        if (hasChargingAvailability(chargingPark)) {
            const availability = chargingPark.availability.chargingPointAvailability;
            const available = availability.statusCounts.Available ?? 0;
            return {
                availableCount: available,
                totalCount: availability.count,
                ratio: available / availability.count,
            };
        }
        return undefined;
    };

    mapEVStationsModule = await placesLayers.addBaseMapPOICategories({
        id: mapEVStationsId,
        categories: ['ELECTRIC_VEHICLE_STATION'],
        minZoom: 7,
    });
    await listenToMapUserEvents();
    listenToHTMLUserEvents();
})();
