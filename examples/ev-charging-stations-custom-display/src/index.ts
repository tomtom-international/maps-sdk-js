import { type Place, type POICategory, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, POIsModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import {
    getPlacesWithEVAvailability,
    getPlaceWithEVAvailability,
    search,
    type SearchResponse,
} from '@tomtom-org/maps-sdk/services';
import { Popup } from 'maplibre-gl';
import customEvIconSVG from './custom-ev-icon.svg?raw';
import { API_KEY } from './config';
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
    // CUSTOMIZATION STATE: All configurable options in one place
    // =============================================================================
    const state = {
        bgAvailability: false,
        bgCustomIcon: false,
        searchAvailability: true,
        searchCustomIcon: true,
        highThreshold: 0.3,
        lowThreshold: 0.05,
        textColor: '#ffffff',
        haloWidth: 1,
        formatOption: 'of' as 'slash' | 'of' | 'available',
    };

    // =============================================================================
    // CONFIG BUILDERS: Convert state to PlacesModule configuration
    // =============================================================================
    const buildIconConfig = (useCustom: boolean) =>
        useCustom
            ? {
                  categoryIcons: [
                      { id: 'ELECTRIC_VEHICLE_STATION' as POICategory, image: customEvIconSVG },
                  ],
              }
            : undefined;

    const buildEVConfig = (enabled: boolean) => {
        if (!enabled) return undefined;
        const formats = {
            slash: (a: number, t: number) => `${a}/${t}`,
            of: (a: number, t: number) => `${a} of ${t}`,
            available: (a: number) => `${a} available`,
        };
        return {
            enabled: true,
            thresholds: { high: state.highThreshold, low: state.lowThreshold },
            formatText: formats[state.formatOption],
        };
    };

    const buildTextConfig = () => ({
        color: state.textColor,
        haloColor: '#000000',
        haloWidth: state.haloWidth,
    });

    // =============================================================================
    // PLACES MODULES: Three separate layers for different use cases
    // =============================================================================
    
    // Background stations: Show all stations on the map (availability disabled by default)
    const bgStations = await PlacesModule.get(map, {
        theme: 'base-map',
        icon: buildIconConfig(state.bgCustomIcon),
        evAvailability: buildEVConfig(state.bgAvailability),
        text: buildTextConfig(),
    });

    // Searched stations: User-searched results (availability enabled by default)
    const searchedStations = await PlacesModule.get(map, {
        icon: buildIconConfig(state.searchCustomIcon),
        evAvailability: buildEVConfig(state.searchAvailability),
        text: buildTextConfig(),
    });

    // Selected station: Highlighted with gold text
    const selectedStation = await PlacesModule.get(map, {
        icon: buildIconConfig(state.searchCustomIcon),
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

    // Search for EV stations by brand name
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
    const selectStation = async (station: Place) => {
        // Always fetch availability for popup display (detailed view)
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
    // DYNAMIC RECONFIGURATION: Apply state changes to modules
    // =============================================================================
    
    // Update background stations configuration and re-render
    const applyBackgroundConfig = async () => {
        bgStations.applyConfig({
            theme: 'base-map',
            icon: buildIconConfig(state.bgCustomIcon),
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
            icon: buildIconConfig(state.searchCustomIcon),
            evAvailability: buildEVConfig(state.searchAvailability),
            text: buildTextConfig(),
        });
        selectedStation.applyConfig({
            icon: buildIconConfig(state.searchCustomIcon),
            evAvailability: buildEVConfig(state.searchAvailability),
            text: { ...buildTextConfig(), color: '#FFD700', haloWidth: 3 },
        });
        if (searchedStationsData) {
            const dataToShow = state.searchAvailability
                ? await getPlacesWithEVAvailability(searchedStationsData)
                : searchedStationsData.features;
            searchedStations.show(dataToShow);
        }
    };

    // =============================================================================
    // EVENT LISTENERS: Wire up UI controls to state and configuration changes
    // =============================================================================
    const setupEventListeners = () => {
        // Search controls
        document.querySelector('#searchButton')?.addEventListener('click', searchEVStations);
        document.querySelector('#clearButton')?.addEventListener('click', clear);
        document.querySelector('#sdk-example-evBrandTextBox')?.addEventListener('keypress', (e) => {
            if ((e as KeyboardEvent).key === 'Enter') searchEVStations();
        });

        // Background stations toggles
        document.querySelector('#bgAvailabilityToggle')?.addEventListener('change', async (e) => {
            state.bgAvailability = (e.target as HTMLInputElement).checked;
            await applyBackgroundConfig();
        });
        document.querySelector('#bgCustomIconToggle')?.addEventListener('change', async (e) => {
            state.bgCustomIcon = (e.target as HTMLInputElement).checked;
            await applyBackgroundConfig();
        });

        // Searched stations toggles
        document.querySelector('#searchAvailabilityToggle')?.addEventListener('change', async (e) => {
            state.searchAvailability = (e.target as HTMLInputElement).checked;
            await applySearchedConfig();
        });
        document.querySelector('#searchCustomIconToggle')?.addEventListener('change', async (e) => {
            state.searchCustomIcon = (e.target as HTMLInputElement).checked;
            await applySearchedConfig();
        });

        // Format dropdown
        document.querySelector('#availabilityFormat')?.addEventListener('change', async (e) => {
            state.formatOption = (e.target as HTMLSelectElement).value as typeof state.formatOption;
            await applyBackgroundConfig();
            await applySearchedConfig();
        });

        // Threshold sliders
        const highSlider = document.querySelector('#highThreshold') as HTMLInputElement;
        const highValue = document.querySelector('#highThresholdValue') as HTMLSpanElement;
        highSlider?.addEventListener('input', async () => {
            state.highThreshold = Number.parseInt(highSlider.value) / 100;
            highValue.textContent = `${highSlider.value}%`;
            await applyBackgroundConfig();
            await applySearchedConfig();
        });

        const lowSlider = document.querySelector('#lowThreshold') as HTMLInputElement;
        const lowValue = document.querySelector('#lowThresholdValue') as HTMLSpanElement;
        lowSlider?.addEventListener('input', async () => {
            state.lowThreshold = Number.parseInt(lowSlider.value) / 100;
            lowValue.textContent = `${lowSlider.value}%`;
            await applyBackgroundConfig();
            await applySearchedConfig();
        });

        // Color selectors
        document.querySelectorAll('.sdk-example-color-selector').forEach((selector) => {
            selector.addEventListener('click', async () => {
                document.querySelectorAll('.sdk-example-color-selector').forEach((s) => s.classList.remove('active'));
                selector.classList.add('active');
                state.textColor = (selector as HTMLElement).dataset.value || '#ffffff';
                await applyBackgroundConfig();
                await applySearchedConfig();
            });
        });

        // Halo width slider
        const haloSlider = document.querySelector('#haloWidth') as HTMLInputElement;
        const haloValue = document.querySelector('#haloWidthValue') as HTMLSpanElement;
        haloSlider?.addEventListener('input', async () => {
            state.haloWidth = Number.parseFloat(haloSlider.value);
            haloValue.textContent = `${state.haloWidth}px`;
            await applyBackgroundConfig();
            await applySearchedConfig();
        });

        // Map interaction events
        map.mapLibreMap.on('moveend', updateBackgroundStations);
        bgStations.events.on('click', selectStation);
        searchedStations.events.on('click', selectStation);
        popUp.on('close', () => selectedStation.clear());
    };

    // Initialize
    await updateBackgroundStations();
    setupEventListeners();
})();
