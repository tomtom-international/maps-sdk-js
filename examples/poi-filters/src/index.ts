import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    FilterablePOICategory,
    FilterShowMode,
    MapStylePOICategory,
    POICategoryGroup,
    POIsModule,
    TomTomMap,
    ValuesFilter,
} from '@tomtom-org/maps-sdk/map';
import './style.css';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-GB' });

let poisModule: POIsModule;
let modeSelector: HTMLSelectElement;
const filterInputs: HTMLInputElement[] = [];

const categories: Partial<Record<FilterablePOICategory, string>> = {
    FOOD_DRINKS_GROUP: 'Food & Drinks',
    TRANSPORTATION_GROUP: 'Transportation',
    HOLIDAY_TOURISM_GROUP: 'Holiday & Tourism',
    HEALTH_GROUP: 'Health',
    PARKING_GROUP: 'Parking',
    SHOPPING_GROUP: 'Shopping',
    ACCOMMODATION_GROUP: 'Accommodation',
    ENTERTAINMENT_GROUP: 'Entertainment',
    GOVERNMENT_GROUP: 'Government Organizations',
    EDUCATION_GROUP: 'Education',
    GAS_STATIONS_GROUP: 'Gas Stations',
    EV_CHARGING_STATIONS_GROUP: 'EV Charging Stations',
};

let categoryFilter: ValuesFilter<FilterablePOICategory> = {
    show: 'all_except',
    values: [],
};

const toggleCategoryFilter = (category: MapStylePOICategory | POICategoryGroup, isChecked: boolean) => {
    isChecked
        ? categoryFilter.values.push(category)
        : (categoryFilter.values = categoryFilter.values.filter((cat) => cat != category));
    poisModule.filterCategories(categoryFilter);
};

const changeFilterMode = (mode: FilterShowMode) => {
    categoryFilter.show = mode;
    poisModule.filterCategories(categoryFilter);
};

const resetConfig = () => {
    categoryFilter = {
        show: 'all_except',
        values: [],
    };
    poisModule.filterCategories(categoryFilter);
    filterInputs.forEach((input) => (input.checked = categoryFilter.values.includes(input.value)));
    modeSelector.selectedIndex = 0;
};

const createFilterToggles = () => {
    const container = document.getElementById('maps-sdk-js-examples-filters-container');
    for (const [key, value] of Object.entries(categories)) {
        const item = document.createElement('div');
        item.className = 'maps-sdk-js-examples-item';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = key;
        input.checked = categoryFilter.values.includes(input.value);
        input.id = key;
        const label = document.createElement('label');
        label.htmlFor = key;
        label.innerText = value as string;
        item.appendChild(input);
        item.appendChild(label);
        filterInputs.push(input);
        container?.appendChild(item);
    }
};

const listenToUserEvents = () => {
    const items = document.querySelectorAll('.maps-sdk-js-examples-item input');
    items.forEach((item) =>
        item.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            toggleCategoryFilter(target.value, target.checked);
        }),
    );

    modeSelector = document.getElementById('maps-sdk-js-examples-mode-selector') as HTMLSelectElement;
    modeSelector?.addEventListener('change', (e) =>
        changeFilterMode((e.target as HTMLSelectElement).value as FilterShowMode),
    );

    const resetBtn = document.getElementById('maps-sdk-js-examples-reset');
    resetBtn?.addEventListener('click', resetConfig);
};

const map = new TomTomMap({ container: 'maps-sdk-js-examples-map-container', center: [4.89437, 52.36859], zoom: 16.5 });
poisModule = await POIsModule.get(map);

createFilterToggles();
listenToUserEvents();
