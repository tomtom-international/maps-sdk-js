import { formatDuration, type POICategory } from '@tomtom-org/maps-sdk/core';
import type { AlongRouteSearchParams } from '@tomtom-org/maps-sdk/services';

const ROUTE_POI_CATEGORIES = [
    'ELECTRIC_VEHICLE_STATION',
    'GAS_STATION',
    'TRUCK_STOP',
    'RESTAURANT',
    'FAST_FOOD',
    'CAFE',
    'BAKERY',
    'REST_AREA',
    'HOTEL',
    'CAMPING_GROUND',
    'CAR_REPAIR_AND_SERVICE',
    'CAR_WASH',
    'PHARMACY',
    'HOSPITAL',
    'PARKING_GARAGE',
    'OPEN_PARKING_AREA',
    'IMPORTANT_TOURIST_ATTRACTION',
    'MUSEUM',
    'SCENIC_PANORAMIC_VIEW',
    'BEACH',
    'SUPERMARKETS_HYPERMARKETS',
    'SHOPPING_CENTER',
].toSorted() as POICategory[];

const DEFAULT_DETOUR_MINUTES = 5;

export type SearchPanelParams = Pick<AlongRouteSearchParams, 'query' | 'poiCategories' | 'maxDetourTimeSeconds'>;

export const setupPanel = (onSearch: (params: SearchPanelParams) => Promise<void>, onClear: () => void) => {
    const queryInput = document.querySelector('#sdk-example-queryInput') as HTMLInputElement;
    const searchButton = document.querySelector('#sdk-example-searchButton') as HTMLButtonElement;
    const clearButton = document.querySelector('#sdk-example-clearButton') as HTMLButtonElement;
    const categoriesContainer = document.querySelector('#sdk-example-categoriesContainer') as HTMLDivElement;
    const detourMinutesSlider = document.querySelector('#sdk-example-detourSlider') as HTMLInputElement;
    const detourValue = document.querySelector('#sdk-example-detourValue') as HTMLSpanElement;

    // Sync slider to the constant so the HTML never needs to be updated manually
    detourMinutesSlider.value = String(DEFAULT_DETOUR_MINUTES);
    detourValue.textContent = formatDuration(DEFAULT_DETOUR_MINUTES * 60) ?? `${DEFAULT_DETOUR_MINUTES} min`;

    let checkedCategories: POICategory[] = [];
    let isLoading = false;

    for (const category of ROUTE_POI_CATEGORIES) {
        const label = document.createElement('label');
        label.className = 'sdk-example-checkbox-label';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = category;
        input.addEventListener('change', () => {
            if (input.checked) {
                checkedCategories.push(category);
            } else {
                checkedCategories = checkedCategories.filter((c) => c !== category);
            }
            console.log('checkedCategories after change: ', checkedCategories);
        });

        label.appendChild(input);
        label.appendChild(document.createTextNode(category.replaceAll('_', ' ').toLowerCase()));
        categoriesContainer.appendChild(label);
    }

    detourMinutesSlider.addEventListener('input', () => {
        const minutes = Number(detourMinutesSlider.value);
        detourValue.textContent = formatDuration(minutes * 60) ?? `${minutes} min`;
    });

    const getParams = (): SearchPanelParams => {
        console.log(checkedCategories);
        return {
            query: queryInput.value.trim() || undefined,
            poiCategories: checkedCategories.length > 0 ? checkedCategories : undefined,
            maxDetourTimeSeconds: Number(detourMinutesSlider.value) * 60,
        };
    };

    const setLoading = (loading: boolean) => {
        isLoading = loading;
        searchButton.disabled = loading;
        document.body.style.cursor = loading ? 'wait' : '';
    };

    const triggerSearch = async () => {
        if (isLoading) return;
        setLoading(true);
        try {
            await onSearch(getParams());
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        queryInput.value = '';
        checkedCategories = [];
        categoriesContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
            cb.checked = false;
        });
        detourMinutesSlider.value = String(DEFAULT_DETOUR_MINUTES);
        detourValue.textContent = formatDuration(DEFAULT_DETOUR_MINUTES * 60) ?? `${DEFAULT_DETOUR_MINUTES} min`;
    };

    searchButton.addEventListener('click', triggerSearch);
    clearButton.addEventListener('click', () => {
        reset();
        onClear();
    });
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
    });
};
