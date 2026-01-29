import { type Place, type POICategory, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type AvailabilityLevel, PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    getPlacesWithEVAvailability,
    getPlaceWithEVAvailability,
    type SearchResponse,
    search,
} from '@tomtom-org/maps-sdk/services';
import { Popup } from 'maplibre-gl';
import { API_KEY } from './config';
import customEvCircleSVG from './custom-ev-circle.svg?raw';
import customEvCircleAvailable from './custom-ev-circle-available.svg?raw';
import customEvCircleUnavailable from './custom-ev-circle-unavailable.svg?raw';
import customEvPinSVG from './custom-ev-pin.svg?raw';
import customEvPinAvailable from './custom-ev-pin-available.svg?raw';
import customEvPinUnavailable from './custom-ev-pin-unavailable.svg?raw';
import { setupEventListeners } from './eventListeners';
import { connectorsHTML } from './htmlTemplates';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    // =============================================================================
    // SETUP: Map, POIs, and Popup
    // =============================================================================
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [2.3597, 48.85167], zoom: 11 },
    });

    const mapBasePOIs = await POIsModule.get(map, {
        filters: { categories: { show: 'all_except', values: ['ELECTRIC_VEHICLE_STATION'] } },
    });

    const popUp = new Popup({ closeButton: false, offset: 35, className: 'maps-sdk-js-popup' });

    // =============================================================================
    // CUSTOMIZATION STATE: All configurable options
    // =============================================================================
    const state = {
        bgAvailability: false,
        bgCustomIcon: false,
        searchAvailability: true,
        searchCustomIcon: true,
        threshold: 0.3,
        textColor: undefined as string | undefined,
        haloColor: undefined as string | undefined,
        haloWidth: 1,
        formatOption: 'slash' as 'slash' | 'of' | 'available',
        textOffset: 0,
        useCustomOffset: false,
    };

    // =============================================================================
    // CONFIG BUILDERS: Convert state to PlacesModule configuration
    // =============================================================================
    const buildIconConfig = (useCustom: boolean, withAvailability: boolean) => {
        if (!useCustom) {
            return undefined;
        }

        // If availability is enabled, use the 2 availability-aware custom pin icons
        if (withAvailability) {
            return {
                categoryIcons: [
                    {
                        id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                        image: customEvPinAvailable,
                        availabilityLevel: 'available' as AvailabilityLevel,
                    },
                    {
                        id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                        image: customEvPinUnavailable,
                        availabilityLevel: 'occupied' as AvailabilityLevel,
                    },
                ],
            };
        }

        // Otherwise, use single custom pin icon without availability indicator
        return {
            categoryIcons: [
                {
                    id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                    image: customEvPinSVG,
                },
            ],
        };
    };

    const buildCircleIconConfig = (useCustom: boolean, withAvailability: boolean) => {
        if (!useCustom) {
            return undefined;
        }

        // If availability is enabled, use the 2 availability-aware circular icons
        if (withAvailability) {
            return {
                categoryIcons: [
                    {
                        id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                        image: customEvCircleAvailable,
                        availabilityLevel: 'available' as AvailabilityLevel,
                    },
                    {
                        id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                        image: customEvCircleUnavailable,
                        availabilityLevel: 'occupied' as AvailabilityLevel,
                    },
                ],
            };
        }

        // Otherwise, use single circular icon without availability indicator
        return {
            categoryIcons: [
                {
                    id: 'ELECTRIC_VEHICLE_STATION' as POICategory,
                    image: customEvCircleSVG,
                },
            ],
        };
    };

    const buildEVConfig = (enabled: boolean) => {
        if (!enabled) {
            return undefined;
        }

        const formats = {
            slash: (a: number, t: number) => `${a}/${t}`,
            of: (a: number, t: number) => `${a} of ${t}`,
            available: (a: number) => `${a} available`,
        };

        return {
            enabled: true,
            threshold: state.threshold,
            formatText: formats[state.formatOption],
        };
    };

    const buildTextConfig = () => {
        const hasCustomColors = state.textColor || state.haloColor;
        const hasCustomHaloWidth = state.haloWidth !== 1;
        const hasCustomOffset = state.useCustomOffset;

        // If nothing is customized, return undefined to use SDK defaults
        if (!hasCustomColors && !hasCustomHaloWidth && !hasCustomOffset) {
            return undefined;
        }

        return {
            ...(state.textColor && { color: state.textColor }),
            ...(state.haloColor && { haloColor: state.haloColor }),
            haloWidth: state.haloWidth,
            ...(state.useCustomOffset && { offset: state.textOffset }),
        };
    };

    // =============================================================================
    // PLACES MODULES: Three separate layers for different use cases
    // =============================================================================

    // Background stations: Show all stations on the map
    const bgStations = await PlacesModule.get(map, {
        theme: 'base-map',
        icon: buildCircleIconConfig(state.bgCustomIcon, state.bgAvailability),
        evAvailability: buildEVConfig(state.bgAvailability),
        text: buildTextConfig(),
    });

    // Searched stations: User-searched results
    const searchedStations = await PlacesModule.get(map, {
        theme: 'pin',
        icon: buildIconConfig(state.searchCustomIcon, state.searchAvailability),
        evAvailability: buildEVConfig(state.searchAvailability),
        text: buildTextConfig(),
    });

    // Selected station: With highlighted style
    const selectedStation = await PlacesModule.get(map, {
        icon: buildIconConfig(state.searchCustomIcon, state.searchAvailability),
        evAvailability: buildEVConfig(state.searchAvailability),
        text: { ...buildTextConfig(), color: '#90D5FF', haloWidth: 2 },
    });

    // =============================================================================
    // DATA MANAGEMENT: Store search results for re-rendering on config changes
    // =============================================================================
    let bgStationsData: SearchResponse | null = null;
    let searchedStationsData: SearchResponse | null = null;

    // =============================================================================
    // UI INTERACTIONS: Search, display, and selection logic
    // =============================================================================

    // Update background stations based on zoom level and viewport
    const updateBackgroundStations = async () => {
        const zoom = map.mapLibreMap.getZoom();
        if (zoom < 7) {
            bgStations.clear();
            bgStationsData = null;
        } else {
            bgStationsData = await search({
                query: '',
                poiCategories: ['ELECTRIC_VEHICLE_STATION'],
                minPowerKW: 50,
                boundingBox: map.getBBox(),
                limit: zoom < 10 ? 50 : 100,
            });
            const dataToShow = state.bgAvailability
                ? await getPlacesWithEVAvailability(bgStationsData)
                : bgStationsData.features;
            bgStations.show(dataToShow);
        }
    };

    // Simplified search focusing on EV stations by brand name
    const searchEVStations = async () => {
        const evBrandTextBox = document.querySelector('#sdk-example-evBrandTextBox') as HTMLInputElement;
        popUp.remove();
        mapBasePOIs.setVisible(false);

        searchedStationsData = await search({
            query: evBrandTextBox.value,
            boundingBox: map.getBBox(),
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            limit: 100,
        });
        const dataToShow = state.searchAvailability
            ? await getPlacesWithEVAvailability(searchedStationsData)
            : searchedStationsData.features;
        searchedStations.show(dataToShow);
    };

    // Clear search results
    const clear = () => {
        const evBrandTextBox = document.querySelector('#sdk-example-evBrandTextBox') as HTMLInputElement;
        evBrandTextBox.value = '';
        popUp.remove();
        searchedStations.clear();
        selectedStation.clear();
        mapBasePOIs.setVisible(true);
        searchedStationsData = null;
    };

    // Show selected station with popup
    const selectEVStation = async (station: Place) => {
        // Fetch availability for popup display (detailed view)
        const stationWithAvailability = (await getPlaceWithEVAvailability(station)) ?? station;
        selectedStation.show(stationWithAvailability);

        const { address, poi, chargingPark } = stationWithAvailability.properties;
        popUp
            .setHTML(`
                <h3>${poi?.name}</h3>
                <label class="sdk-example-address sdk-example-label">${address.freeformAddress}</label>
                <br/><br/>
                ${chargingPark ? connectorsHTML(chargingPark) : 'Charging park data not available.'}
            `)
            .setLngLat(stationWithAvailability.geometry.coordinates as [number, number])
            .addTo(map.mapLibreMap);
    };

    // =============================================================================
    // DYNAMIC RECONFIGURATION: Apply customizations menu state changes to modules
    // =============================================================================

    // Update background stations configuration and re-render
    const applyBackgroundConfig = async () => {
        bgStations.applyConfig({
            theme: 'base-map',
            icon: buildCircleIconConfig(state.bgCustomIcon, state.bgAvailability),
            evAvailability: buildEVConfig(state.bgAvailability),
            text: buildTextConfig(),
        });
        if (bgStationsData) {
            const dataToShow = state.bgAvailability
                ? await getPlacesWithEVAvailability(bgStationsData)
                : bgStationsData.features;
            bgStations.show(dataToShow);
        }
    };

    // Update searched/selected stations configuration and re-render
    const applySearchedConfig = async () => {
        searchedStations.applyConfig({
            icon: buildIconConfig(state.searchCustomIcon, state.searchAvailability),
            evAvailability: buildEVConfig(state.searchAvailability),
            text: buildTextConfig(),
        });
        selectedStation.applyConfig({
            icon: buildIconConfig(state.searchCustomIcon, state.searchAvailability),
            evAvailability: buildEVConfig(state.searchAvailability),
            text: { ...buildTextConfig(), color: '#90D5FF', haloWidth: 2 },
        });
        if (searchedStationsData) {
            const dataToShow = state.searchAvailability
                ? await getPlacesWithEVAvailability(searchedStationsData)
                : searchedStationsData.features;
            searchedStations.show(dataToShow);
        }
    };

    // =============================================================================
    // INITIALIZE: Setup event listeners and load initial data
    // =============================================================================
    await updateBackgroundStations();
    setupEventListeners({
        map,
        bgStations,
        searchedStations,
        selectedStation,
        popUp,
        state,
        operations: {
            searchEVStations,
            clear,
            selectEVStation,
            updateBackgroundStations,
            applyBackgroundConfig,
            applySearchedConfig,
        },
    });
})();
