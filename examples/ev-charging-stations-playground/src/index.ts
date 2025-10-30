import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import {
    ChargingParkWithAvailability,
    ConnectorAvailability,
    EVChargingStationPlaceProps,
    geographyTypes,
    Place,
    PolygonFeatures,
    TomTomConfig,
} from '@tomtom-org/maps-sdk-js/core';
import {
    GeometriesModule,
    PlacesModule,
    PlacesModuleConfig,
    POIsModule,
    TomTomMap,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk-js/map';
import {
    buildPlacesWithEVAvailability,
    buildPlaceWithEVAvailability,
    geometryData,
    search,
} from '@tomtom-org/maps-sdk-js/services';
import { bboxPolygon, difference } from '@turf/turf';
import { isEmpty, without } from 'lodash-es';
import { LngLatBoundsLike, LngLatLike, NavigationControl, Popup } from 'maplibre-gl';
import { connectorIcons } from './connectorIcons';
import { connectorNames } from './connectorNames';
import genericIcon from './resources/ic-generic-24.svg?raw';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

const evBrandTextBox = document.querySelector('#maps-sdk-js-examples-evBrandTextBox') as HTMLInputElement;
const areaTextBox = document.querySelector('#maps-sdk-js-examples-areaTextBox') as HTMLInputElement;
const fitBoundsOptions = { padding: 50 };
const popUp = new Popup({
    closeButton: false,
    offset: 35,
    className: 'maps-sdk-js-popup',
});

const map = new TomTomMap(
    {
        container: 'maps-sdk-js-examples-map-container',
        center: [2.3597, 48.85167],
        zoom: 11,
        fitBoundsOptions,
    },
    {
        language: 'en-GB',
        style: { type: 'standard', include: ['trafficIncidents'] },
    },
);
const mapIncidents = await TrafficIncidentsModule.get(map);
const mapBasePOIs = await POIsModule.get(map, {
    filters: {
        categories: { show: 'all_except', values: ['ELECTRIC_VEHICLE_STATION'] },
    },
});
const mapEVStations = await PlacesModule.get(map, {
    iconConfig: { iconStyle: 'poi-like' },
});

const buildAvailabilityText = (place: Place<EVChargingStationPlaceProps>): string => {
    const availability = getChargingPointAvailability(place);
    return availability ? `${availability.availableCount}/${availability.totalCount}` : '';
};

const evStationPinConfig: PlacesModuleConfig = {
    extraFeatureProps: {
        availabilityText: buildAvailabilityText,
        availabilityRatio: (place: Place) => getChargingPointAvailability(place)?.ratio ?? 0,
    },
    textConfig: {
        textField: [
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

const mapSearchedEVStations = await PlacesModule.get(map, evStationPinConfig);
const selectedEVStation = await PlacesModule.get(map, evStationPinConfig);
const mapGeometry = await GeometriesModule.get(map);

let minPowerKWMapEVStations = 50;
let minPowerKWSearchedEVStations = 0;

const connectorsHTML = (chargingPark: ChargingParkWithAvailability): string => {
    const availability = chargingPark?.availability;
    const connectorAvailabilities = availability ? availability.connectorAvailabilities : chargingPark.connectorCounts;
    return `<ul class="maps-sdk-js-examples-connector-ul">
    ${connectorAvailabilities
        .map((connectorAvailability) => {
            const statusCounts = (connectorAvailability as ConnectorAvailability).statusCounts;
            const hasStatuses = !isEmpty(statusCounts);
            const availableCount = statusCounts.Available ?? 0;
            const connectorType = connectorAvailability.connector.type;
            const connectorName = connectorNames[connectorType] ?? connectorType;
            return `
            <li class="maps-sdk-js-examples-connector-li">
                <div class="maps-sdk-js-examples-connectorIcon">${connectorIcons[connectorType] ?? genericIcon}</div>
                <label class="maps-sdk-js-examples-connectorName maps-sdk-js-examples-label">${connectorName ?? ''}</label>
                <label class="maps-sdk-js-examples-connectorPower maps-sdk-js-examples-label"> | ${connectorAvailability.connector.ratedPowerKW} KW</label>
                <label class="maps-sdk-js-examples-label ${
                    hasStatuses
                        ? availableCount
                            ? 'maps-sdk-js-examples-available'
                            : 'maps-sdk-js-examples-unavailable'
                        : 'maps-sdk-js-examples-noStatus'
                }">${hasStatuses ? `${availableCount} / ` : ''}${connectorAvailability.count}</label>
            </li>`;
        })
        .join('')}
    </ul>`;
};

const showPopup = (evStation: Place<EVChargingStationPlaceProps>) => {
    const { address, poi, chargingPark } = evStation.properties;
    popUp
        .setHTML(
            `
                <h3>${poi?.name}</h3>
                <label class="maps-sdk-js-examples-address maps-sdk-js-examples-label">${address.freeformAddress}</label>
                <br/><br/>
                ${connectorsHTML(chargingPark as ChargingParkWithAvailability)}
            `,
        )
        .setLngLat(evStation.geometry.coordinates as LngLatLike)
        .addTo(map.mapLibreMap);
};

const updateMapEVStations = async () => {
    const zoom = map.mapLibreMap.getZoom();
    if (zoom < 7) {
        mapEVStations.clear();
    } else {
        const chargingStations = await search({
            query: '',
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            minPowerKW: minPowerKWMapEVStations,
            boundingBox: map.getBBox(),
            limit: zoom < 10 ? 50 : 100,
        });
        mapEVStations.show(chargingStations);
    }
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
    // We simplify the map to focus on the searched pins better:
    mapIncidents.setIconsVisible(false);
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
        mapGeometry.show(invert(geometryToSearch));
    } else {
        mapGeometry.clear();
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
    mapSearchedEVStations.show(places);
    mapSearchedEVStations.show(await buildPlacesWithEVAvailability(places));
};

const clear = () => {
    evBrandTextBox.value = '';
    areaTextBox.value = '';
    popUp.remove();
    mapSearchedEVStations.clear();
    selectedEVStation.clear();
    mapGeometry.clear();
    mapIncidents.setIconsVisible(true);
    mapBasePOIs.setVisible(true);
};

const selectEVStation = (evStation: Place<EVChargingStationPlaceProps>) => {
    selectedEVStation.show(evStation);
    showPopup(evStation);
};

const listenToMapUserEvents = async () => {
    map.mapLibreMap.on('moveend', updateMapEVStations);
    mapEVStations.events.on('click', async (evStation) =>
        selectEVStation(await buildPlaceWithEVAvailability(evStation)),
    );
    mapSearchedEVStations.events.on('click', async (evWithAvailability) => selectEVStation(evWithAvailability));
    popUp.on('close', () => selectedEVStation.clear());
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
        await updateMapEVStations();
    });
    minPowerKWSearchedEVStationsInput.addEventListener(
        'keyup',
        () => (minPowerKWSearchedEVStations = Number(minPowerKWSearchedEVStationsInput.value)),
    );
};

const getChargingPointAvailability = (
    place: Place<EVChargingStationPlaceProps>,
): { availableCount: number; totalCount: number; ratio: number } | undefined => {
    const availability = place.properties.chargingPark?.availability?.chargingPointAvailability;
    if (availability) {
        const available = availability.statusCounts.Available ?? 0;
        return {
            availableCount: available,
            totalCount: availability.count,
            ratio: available / availability.count,
        };
    }
    return undefined;
};

map.mapLibreMap.addControl(new NavigationControl(), 'bottom-right');

await updateMapEVStations();
await listenToMapUserEvents();
listenToHTMLUserEvents();
