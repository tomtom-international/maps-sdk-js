import type { Place } from '@tomtom-org/maps-sdk/core';
import { type PlacesModule, type StandardStyleID, standardStyleIDs, type TomTomMap } from '@tomtom-org/maps-sdk/map';
import type { Popup } from 'maplibre-gl';

type AppState = {
    bgAvailability: boolean;
    bgCustomIcon: boolean;
    searchAvailability: boolean;
    searchCustomIcon: boolean;
    threshold: number;
    textColor: string | undefined;
    haloColor: string | undefined;
    haloWidth: number;
    formatOption: 'slash' | 'of' | 'available';
    textOffset: number;
    useCustomOffset: boolean;
};

type Operations = {
    searchEVStations: () => Promise<void>;
    clear: () => void;
    selectEVStation: (station: Place) => Promise<void>;
    updateBackgroundStations: () => Promise<void>;
    applyBackgroundConfig: () => Promise<void>;
    applySearchedConfig: () => Promise<void>;
};

type SetupEventListenersDeps = {
    map: TomTomMap;
    bgStations: PlacesModule;
    searchedStations: PlacesModule;
    selectedStation: PlacesModule;
    popUp: Popup;
    state: AppState;
    operations: Operations;
};

export const setupEventListeners = ({
    map,
    bgStations,
    searchedStations,
    selectedStation,
    popUp,
    state,
    operations,
}: SetupEventListenersDeps) => {
    const {
        searchEVStations,
        clear,
        selectEVStation,
        updateBackgroundStations,
        applyBackgroundConfig,
        applySearchedConfig,
    } = operations;

    // Search controls
    document.querySelector('#searchButton')?.addEventListener('click', searchEVStations);
    document.querySelector('#clearButton')?.addEventListener('click', clear);
    document.querySelector('#sdk-example-evBrandTextBox')?.addEventListener('keypress', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') searchEVStations();
    });

    // Map style selector
    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );

    // Background stations toggles
    document.querySelector('#bgAvailabilityToggle')?.addEventListener('change', async (event) => {
        state.bgAvailability = (event.target as HTMLInputElement).checked;
        await applyBackgroundConfig();
    });
    document.querySelector('#bgCustomIconToggle')?.addEventListener('change', async (event) => {
        state.bgCustomIcon = (event.target as HTMLInputElement).checked;
        bgStations.clear();
        await applyBackgroundConfig();
    });

    // Searched stations toggles
    document.querySelector('#searchAvailabilityToggle')?.addEventListener('change', async (event) => {
        state.searchAvailability = (event.target as HTMLInputElement).checked;
        await applySearchedConfig();
    });
    document.querySelector('#searchCustomIconToggle')?.addEventListener('change', async (event) => {
        state.searchCustomIcon = (event.target as HTMLInputElement).checked;
        searchedStations.clear();
        selectedStation.clear();
        await applySearchedConfig();
    });

    // Format dropdown
    document.querySelector('#availabilityFormat')?.addEventListener('change', async (event) => {
        state.formatOption = (event.target as HTMLSelectElement).value as typeof state.formatOption;
        await applyBackgroundConfig();
        await applySearchedConfig();
    });

    // Threshold slider
    const thresholdSlider = document.querySelector('#threshold') as HTMLInputElement;
    const thresholdValue = document.querySelector('#thresholdValue') as HTMLSpanElement;
    thresholdSlider?.addEventListener('input', async () => {
        state.threshold = Number.parseInt(thresholdSlider.value) / 100;
        thresholdValue.textContent = `${thresholdSlider.value}%`;
        await applyBackgroundConfig();
        await applySearchedConfig();
    });

    // Text color selectors
    document.querySelectorAll('#textColorSelectors .sdk-example-color-selector').forEach((selector) => {
        selector.addEventListener('click', async () => {
            document
                .querySelectorAll('#textColorSelectors .sdk-example-color-selector')
                .forEach((s) => s.classList.remove('active'));
            selector.classList.add('active');
            const value = (selector as HTMLElement).dataset.value;
            // 'default' means use SDK defaults (undefined), which adapts to dark/light mode
            state.textColor = value === 'default' ? undefined : value || '#ffffff';
            await applyBackgroundConfig();
            await applySearchedConfig();
        });
    });

    // Halo color selectors
    document.querySelectorAll('#haloColorSelectors .sdk-example-color-selector').forEach((selector) => {
        selector.addEventListener('click', async () => {
            document
                .querySelectorAll('#haloColorSelectors .sdk-example-color-selector')
                .forEach((s) => s.classList.remove('active'));
            selector.classList.add('active');
            const value = (selector as HTMLElement).dataset.value;
            state.haloColor = value === 'default' ? undefined : value || '#000000';
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

    // Text offset controls
    const offsetSlider = document.querySelector('#textOffset') as HTMLInputElement;
    const offsetValue = document.querySelector('#textOffsetValue') as HTMLSpanElement;
    const useCustomOffsetCheckbox = document.querySelector('#useCustomOffset') as HTMLInputElement;

    offsetSlider?.addEventListener('input', async () => {
        state.textOffset = Number.parseFloat(offsetSlider.value);
        offsetValue.textContent = `${state.textOffset.toFixed(1)} em`;
        if (state.useCustomOffset) {
            await applyBackgroundConfig();
            await applySearchedConfig();
        }
    });

    useCustomOffsetCheckbox?.addEventListener('change', async (event) => {
        state.useCustomOffset = (event.target as HTMLInputElement).checked;
        await applyBackgroundConfig();
        await applySearchedConfig();
    });

    // Map interaction events
    map.mapLibreMap.on('moveend', updateBackgroundStations);
    bgStations.events.on('click', selectEVStation);
    searchedStations.events.on('click', selectEVStation);
    popUp.on('close', () => selectedStation.clear());
};
