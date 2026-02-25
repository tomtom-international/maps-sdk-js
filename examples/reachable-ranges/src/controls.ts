import {
    type ColorPaletteOptions,
    colorPaletteIDs,
    type GeometryBeforeLayerConfig,
    type GeometryTheme,
    geometryThemes,
    type StandardStyleID,
    standardStyleIDs,
    type TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import { type BudgetType, search } from '@tomtom-org/maps-sdk/services';
import { VEHICLE_BUDGET_TYPES } from './vehicleProfiles';

export type ControlCallbacks = {
    onOriginSelected: (lngLat: [number, number], displayName: string) => void;
    onBudgetTypeChange: (type: BudgetType, newMax: number) => void;
    onMaxBudgetChange: (max: number) => void;
    onPaletteChange: (palette: ColorPaletteOptions) => void;
    onThemeChange: (theme: GeometryTheme) => void;
    onStyleChange: (styleId: StandardStyleID) => void;
    onBeforeLayerChange: (beforeLayer: GeometryBeforeLayerConfig) => void;
};

const BEFORE_LAYER_OPTIONS: Array<{ value: GeometryBeforeLayerConfig; label: string }> = [
    { value: 'top', label: 'Top' },
    { value: 'country', label: 'Below countries' },
    { value: 'lowestPlaceLabel', label: 'Below place labels' },
    { value: 'poi', label: 'Below Map POIs' },
    { value: 'lowestLabel', label: 'Below all labels' },
    { value: 'lowestRoadLine', label: 'Below roads' },
    { value: 'lowestBuilding', label: 'Below buildings' },
];

const BUDGET_STEPS: Record<BudgetType, number[]> = {
    timeMinutes: [90, 60, 30, 20, 10],
    distanceKM: [100, 50, 25, 10, 5],
    remainingChargeCPT: [20, 40, 60, 80],
    spentChargePCT: [75, 50, 25, 10],
    spentFuelLiters: [40, 20, 10, 5],
};

const INVERTED_BUDGET_STEPS: Record<BudgetType, number[]> = {
    timeMinutes: [90, 60, 45, 30],
    distanceKM: [100, 75, 50, 25],
    remainingChargeCPT: [5, 10, 20],
    spentChargePCT: [75, 50, 25],
    spentFuelLiters: [40, 25, 15],
};

export const BUDGET_UNITS: Record<BudgetType, string> = {
    timeMinutes: 'min',
    distanceKM: 'km',
    remainingChargeCPT: '% remaining',
    spentChargePCT: '% spent',
    spentFuelLiters: 'L',
};

const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
    timeMinutes: 'Time (min)',
    distanceKM: 'Distance (km)',
    remainingChargeCPT: 'EV — remaining charge (%)',
    spentChargePCT: 'EV — charge spent (%)',
    spentFuelLiters: 'Fuel spent (L)',
};

export const getBudgetsForMax = (maxValue: number, type: BudgetType, isInverted = false): number[] =>
    (isInverted ? INVERTED_BUDGET_STEPS[type] : BUDGET_STEPS[type]).filter((b) => b <= maxValue);

const statusText = document.getElementById('sdk-example-statusText') as HTMLElement;
const spinner = document.getElementById('sdk-example-spinner') as HTMLElement;

export const setStatus = (msg: string, loading = false): void => {
    statusText.textContent = msg;
    statusText.hidden = !msg;
    spinner.style.visibility = loading ? 'visible' : 'hidden';
};

export const initControls = (
    map: TomTomMap,
    callbacks: ControlCallbacks,
): { setOriginInput: (value: string) => void } => {
    const originInput = document.getElementById('sdk-example-originSearch') as HTMLInputElement;
    const resultsList = document.getElementById('sdk-example-searchResults') as HTMLUListElement;
    const searchButton = document.getElementById('sdk-example-searchButton') as HTMLButtonElement;
    const clearButton = document.getElementById('sdk-example-clearButton') as HTMLButtonElement;
    const budgetTypeSelect = document.getElementById('sdk-example-budgetType') as HTMLSelectElement;
    const maxBudgetSelect = document.getElementById('sdk-example-maxBudget') as HTMLSelectElement;
    const paletteSelect = document.getElementById('sdk-example-palette') as HTMLSelectElement;
    const themeSelect = document.getElementById('sdk-example-theme') as HTMLSelectElement;
    const mapStylesSelect = document.getElementById('sdk-example-mapStyles') as HTMLSelectElement;
    const toggleButton = document.querySelector('.sdk-example-heading-toggle') as HTMLButtonElement;
    const panelContent = document.querySelector('.sdk-example-panel-content') as HTMLDivElement;
    const vehicleNote = document.getElementById('sdk-example-vehicleNote') as HTMLParagraphElement;
    const beforeLayerSelect = document.getElementById('sdk-example-beforeLayer') as HTMLSelectElement;

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
            addOption(maxBudgetSelect, `Up to ${step} ${BUDGET_UNITS[type]}`, String(step), step === defaultStep),
        );
    };

    (Object.keys(BUDGET_STEPS) as BudgetType[]).forEach((type) =>
        addOption(budgetTypeSelect, BUDGET_TYPE_LABELS[type], type, type === 'timeMinutes'),
    );
    populateBudgetValues('timeMinutes', false);

    budgetTypeSelect.addEventListener('change', () => {
        const type = budgetTypeSelect.value as BudgetType;
        populateBudgetValues(type, themeSelect.value === 'inverted');
        vehicleNote.hidden = !VEHICLE_BUDGET_TYPES.has(type);
        callbacks.onBudgetTypeChange(type, Number(maxBudgetSelect.value));
    });
    maxBudgetSelect.addEventListener('change', () => callbacks.onMaxBudgetChange(Number(maxBudgetSelect.value)));

    // Palette selector
    colorPaletteIDs.forEach((id) =>
        addOption(
            paletteSelect,
            id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
            id,
            id === 'fadedRainbow',
        ),
    );
    paletteSelect.addEventListener('change', () =>
        callbacks.onPaletteChange(paletteSelect.value as ColorPaletteOptions),
    );

    // Theme selector
    geometryThemes.forEach((id) =>
        addOption(themeSelect, id.charAt(0).toUpperCase() + id.slice(1), id, id === 'filled'),
    );
    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value as GeometryTheme;
        populateBudgetValues(budgetTypeSelect.value as BudgetType, theme === 'inverted');
        callbacks.onThemeChange(theme);
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

    const showResults = (features: Awaited<ReturnType<typeof search>>['features']) => {
        clearResults();
        for (const place of features) {
            const name = place.properties.poi?.name
                ? `${place.properties.poi.name} — ${place.properties.address.freeformAddress}`
                : place.properties.address.freeformAddress;
            const li = Object.assign(document.createElement('li'), {
                className: 'sdk-example-result-item',
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
                (await search({ query, typeahead: true, limit: 5, position: map.mapLibreMap.getCenter().toArray() }))
                    .features,
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
