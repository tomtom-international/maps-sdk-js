import { type BudgetType, budgetUnits } from '@tomtom-org/maps-sdk/core';
import {
    type BeforeLayerConfig,
    type GeometryBeforeLayerConfig,
    type GeometryFillStyle,
    geometryFillStyles,
    type StandardStyleID,
    standardStyleIDs,
    type TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { discoverPlaces } from '@tomtom-org/maps-sdk/services';

export type ControlCallbacks = {
    onOriginSelected: (lngLat: [number, number], displayName: string) => void;
    onBudgetTypeChange: (type: BudgetType, newMax: number) => void;
    onMaxBudgetChange: (max: number) => void;
    onPaletteChange: (palette: string[]) => void;
    onFillStyleChange: (fillStyle: GeometryFillStyle) => void;
    onStyleChange: (styleId: StandardStyleID) => void;
    onBeforeLayerChange: (beforeLayer: GeometryBeforeLayerConfig) => void;
};

const BEFORE_LAYER_OPTIONS: Array<{ value: BeforeLayerConfig; label: string }> = [
    { value: 'top', label: 'Top' },
    { value: 'country', label: 'Below countries' },
    { value: 'lowestPlaceLabel', label: 'Below place labels' },
    { value: 'poi', label: 'Below Map POIs' },
    { value: 'lowestLabel', label: 'Below all labels' },
    { value: 'lowestRoadLine', label: 'Below roads' },
    { value: 'lowestBuilding', label: 'Below buildings' },
];

// Band colours of your own, innermost first. The empty list leaves them to the map's colours.
const PALETTES: Record<string, string[]> = {
    'From the map': [],
    Sunset: ['#d7263d', '#f46036', '#f9a03f', '#f6d55c', '#fbeec1'],
    Ocean: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
    Forest: ['#1b4332', '#2d6a4f', '#52b788', '#95d5b2', '#d8f3dc'],
};

const BUDGET_STEPS: Record<BudgetType, number[]> = {
    timeMinutes: [90, 60, 30, 20, 10],
    distanceKM: [100, 50, 25, 10, 5],
};

const INVERTED_BUDGET_STEPS: Record<BudgetType, number[]> = {
    timeMinutes: [90, 60, 45, 30],
    distanceKM: [100, 75, 50, 25],
};

const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
    timeMinutes: 'Time (min)',
    distanceKM: 'Distance (km)',
};

export const getBudgetsForMax = (maxValue: number, type: BudgetType, isInverted = false): number[] =>
    (isInverted ? INVERTED_BUDGET_STEPS[type] : BUDGET_STEPS[type]).filter((b) => b <= maxValue);

const statusText = document.getElementById('ui-statusText') as HTMLElement;
const spinner = document.getElementById('ui-spinner') as HTMLElement;

export const setStatus = (msg: string, loading = false): void => {
    statusText.textContent = msg;
    statusText.hidden = !msg;
    spinner.style.visibility = loading ? 'visible' : 'hidden';
};

export const initControls = (
    map: TomTomMap,
    callbacks: ControlCallbacks,
): { setOriginInput: (value: string) => void } => {
    const originInput = document.getElementById('ui-originSearch') as HTMLInputElement;
    const resultsList = document.getElementById('ui-searchResults') as HTMLUListElement;
    const searchButton = document.getElementById('ui-searchButton') as HTMLButtonElement;
    const clearButton = document.getElementById('ui-clearButton') as HTMLButtonElement;
    const budgetTypeSelect = document.getElementById('ui-budgetType') as HTMLSelectElement;
    const maxBudgetSelect = document.getElementById('ui-maxBudget') as HTMLSelectElement;
    const paletteSelect = document.getElementById('ui-palette') as HTMLSelectElement;
    const fillStyleSelect = document.getElementById('ui-fillStyle') as HTMLSelectElement;
    const mapStylesSelect = document.getElementById('ui-mapStyles') as HTMLSelectElement;
    const toggleButton = document.querySelector('.ui-heading-toggle') as HTMLButtonElement;
    const panelContent = document.querySelector('.ui-panel-content') as HTMLDivElement;
    const beforeLayerSelect = document.getElementById('ui-beforeLayer') as HTMLSelectElement;

    const addOption = (select: HTMLSelectElement, label: string, value = label, selected = false) =>
        select.add(new Option(label, value, selected, selected));

    // Map style selector
    standardStyleIDs.forEach((id) => addOption(mapStylesSelect, id, id, id === 'monoDark'));
    mapStylesSelect.addEventListener('change', () => callbacks.onStyleChange(mapStylesSelect.value as StandardStyleID));

    // Budget type selector
    const populateBudgetValues = (type: BudgetType, inverted: boolean) => {
        const steps = inverted ? INVERTED_BUDGET_STEPS[type] : BUDGET_STEPS[type];
        const defaultStep = steps[Math.floor(steps.length / 2)];
        maxBudgetSelect.innerHTML = '';
        steps.forEach((step) =>
            addOption(maxBudgetSelect, `Up to ${step} ${budgetUnits[type]}`, String(step), step === defaultStep),
        );
    };

    (Object.keys(BUDGET_STEPS) as BudgetType[]).forEach((type) =>
        addOption(budgetTypeSelect, BUDGET_TYPE_LABELS[type], type, type === 'timeMinutes'),
    );
    populateBudgetValues('timeMinutes', false);

    budgetTypeSelect.addEventListener('change', () => {
        const type = budgetTypeSelect.value as BudgetType;
        populateBudgetValues(type, fillStyleSelect.value === 'inverted');
        callbacks.onBudgetTypeChange(type, Number(maxBudgetSelect.value));
    });
    maxBudgetSelect.addEventListener('change', () => callbacks.onMaxBudgetChange(Number(maxBudgetSelect.value)));

    // Palette selector
    Object.keys(PALETTES).forEach((name, index) => addOption(paletteSelect, name, name, index === 0));
    paletteSelect.addEventListener('change', () => callbacks.onPaletteChange(PALETTES[paletteSelect.value]));

    // Fill style selector
    geometryFillStyles.forEach((id) =>
        addOption(fillStyleSelect, id.charAt(0).toUpperCase() + id.slice(1), id, id === 'filled'),
    );
    fillStyleSelect.addEventListener('change', () => {
        const fillStyle = fillStyleSelect.value as GeometryFillStyle;
        populateBudgetValues(budgetTypeSelect.value as BudgetType, fillStyle === 'inverted');
        callbacks.onFillStyleChange(fillStyle);
        callbacks.onMaxBudgetChange(Number(maxBudgetSelect.value));
    });

    // Layer position selector
    BEFORE_LAYER_OPTIONS.forEach(({ value, label }) =>
        addOption(beforeLayerSelect, label, value, value === 'lowestLabel'),
    );
    beforeLayerSelect.addEventListener('change', () =>
        callbacks.onBeforeLayerChange(beforeLayerSelect.value as GeometryBeforeLayerConfig),
    );

    // Panel toggle
    toggleButton.addEventListener('click', () => {
        const expanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', String(!expanded));
        panelContent.classList.toggle('collapsed');
    });

    // Search results
    const clearResults = () => {
        resultsList.innerHTML = '';
    };

    const showResults = (features: Awaited<ReturnType<typeof discoverPlaces>>['features']) => {
        clearResults();
        for (const place of features) {
            const name = place.properties.poi?.name
                ? `${place.properties.poi.name} — ${place.properties.address.freeformAddress}`
                : place.properties.address.freeformAddress;
            const li = Object.assign(document.createElement('li'), {
                className: 'ui-result-item',
                textContent: name,
            });
            li.addEventListener('click', () => {
                originInput.value = name;
                map.mapLibreMap.flyTo({ center: place.geometry.coordinates as [number, number], zoom: 9 });
                clearResults();
                callbacks.onOriginSelected(place.geometry.coordinates as [number, number], name);
            });
            resultsList.appendChild(li);
        }
    };

    const performSearch = async () => {
        const query = originInput.value.trim();
        if (query.length < 2) {
            clearResults();
            return;
        }
        try {
            showResults(
                (
                    await discoverPlaces({
                        query,
                        typeahead: true,
                        limit: 5,
                        geoBias: { position: map.mapLibreMap.getCenter().toArray() },
                    })
                ).features,
            );
        } catch {
            clearResults();
        }
    };

    originInput.addEventListener('input', () =>
        originInput.value.trim().length >= 2 ? void performSearch() : clearResults(),
    );
    originInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') void performSearch();
    });
    searchButton.addEventListener('click', performSearch);
    clearButton.addEventListener('click', () => {
        originInput.value = '';
        clearResults();
    });
    document.addEventListener('click', (e) => {
        if (!originInput.contains(e.target as Node) && !resultsList.contains(e.target as Node)) clearResults();
    });

    return {
        setOriginInput: (value) => {
            originInput.value = value;
            clearResults();
        },
    };
};
