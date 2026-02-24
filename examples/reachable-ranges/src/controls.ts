import {
    type ColorPaletteOptions,
    colorPaletteIDs,
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
};

const BUDGET_STEPS: Record<BudgetType, number[]> = {
    timeMinutes: [10, 20, 30, 60, 90],
    distanceKM: [5, 10, 25, 50, 100],
    remainingChargeCPT: [20, 40, 60, 80],
    spentChargePCT: [10, 25, 50, 75],
    spentFuelLiters: [5, 10, 20, 40],
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

export const getBudgetsForMax = (maxValue: number, type: BudgetType): number[] =>
    BUDGET_STEPS[type].filter((b) => b <= maxValue).sort((a, b) => b - a);

const statusText = document.getElementById('sdk-example-statusText') as HTMLElement;
const spinner = document.getElementById('sdk-example-spinner') as HTMLElement;

export const setStatus = (msg: string, loading = false): void => {
    statusText.textContent = msg;
    statusText.hidden = !msg;
    spinner.style.visibility = loading ? 'visible' : 'hidden';
};

export const initControls = (map: TomTomMap, callbacks: ControlCallbacks): void => {
    // DOM references
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

    // Map style selector
    for (const id of standardStyleIDs) {
        const option = new Option(id);
        option.selected = id === 'monoDark';
        mapStylesSelect.add(option);
    }
    mapStylesSelect.addEventListener('change', () => {
        callbacks.onStyleChange(mapStylesSelect.value as StandardStyleID);
    });

    // Budget type selector
    const populateBudgetValues = (type: BudgetType) => {
        maxBudgetSelect.innerHTML = '';
        const steps = BUDGET_STEPS[type];
        const unit = BUDGET_UNITS[type];
        const defaultIndex = Math.floor(steps.length / 2);
        steps.forEach((step, i) => {
            const option = new Option(`Up to ${step} ${unit}`, String(step));
            option.selected = i === defaultIndex;
            maxBudgetSelect.add(option);
        });
    };

    for (const type of Object.keys(BUDGET_STEPS) as BudgetType[]) {
        const option = new Option(BUDGET_TYPE_LABELS[type], type);
        option.selected = type === 'timeMinutes';
        budgetTypeSelect.add(option);
    }
    populateBudgetValues('timeMinutes');

    budgetTypeSelect.addEventListener('change', () => {
        const type = budgetTypeSelect.value as BudgetType;
        populateBudgetValues(type);
        vehicleNote.hidden = !VEHICLE_BUDGET_TYPES.has(type);
        callbacks.onBudgetTypeChange(type, Number(maxBudgetSelect.value));
    });

    maxBudgetSelect.addEventListener('change', () => {
        callbacks.onMaxBudgetChange(Number(maxBudgetSelect.value));
    });

    // Palette selector
    const formatPaletteLabel = (id: string) => id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    for (const id of colorPaletteIDs) {
        const option = new Option(formatPaletteLabel(id), id);
        option.selected = id === 'fadedRainbow';
        paletteSelect.add(option);
    }
    paletteSelect.addEventListener('change', () => {
        callbacks.onPaletteChange(paletteSelect.value as ColorPaletteOptions);
    });

    // Theme selector
    for (const id of geometryThemes) {
        const option = new Option(id.charAt(0).toUpperCase() + id.slice(1), id);
        option.selected = id === 'filled';
        themeSelect.add(option);
    }
    themeSelect.addEventListener('change', () => {
        callbacks.onThemeChange(themeSelect.value as GeometryTheme);
    });

    // Panel toggle
    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', String(!isExpanded));
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

            const li = document.createElement('li');
            li.classList.add('sdk-example-result-item');
            li.textContent = name;
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
            const results = await search({
                query,
                typeahead: true,
                limit: 5,
                position: map.mapLibreMap.getCenter().toArray(),
            });
            showResults(results.features);
        } catch {
            clearResults();
        }
    };

    originInput.addEventListener('input', () => {
        if (originInput.value.trim().length < 2) {
            clearResults();
            return;
        }
        void performSearch();
    });

    originInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') void performSearch();
    });

    searchButton.addEventListener('click', performSearch);

    clearButton.addEventListener('click', () => {
        originInput.value = '';
        clearResults();
    });

    document.addEventListener('click', (e) => {
        if (!originInput.contains(e.target as Node) && !resultsList.contains(e.target as Node)) {
            clearResults();
        }
    });
};
