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
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
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
        filterInputs.forEach((input) => (input.checked = false));
        modeSelector.selectedIndex = 0;
    };

    const createFilterToggles = () => {
        const container = document.getElementById('sdk-example-filtersContainer');
        for (const [key, value] of Object.entries(categories)) {
            const label = document.createElement('label');
            label.className = 'sdk-example-toggle-label';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'sdk-example-toggle-input';
            input.value = key;
            input.checked = categoryFilter.values.includes(input.value);
            input.id = key;

            const toggle = document.createElement('span');
            toggle.className = 'sdk-example-toggle-switch';

            label.appendChild(input);
            label.appendChild(toggle);
            label.appendChild(document.createTextNode(value as string));

            input.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                toggleCategoryFilter(target.value, target.checked);
            });

            filterInputs.push(input);
            container?.appendChild(label);
        }
    };

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [4.89437, 52.36859],
            zoom: 16.5,
        },
    });
    poisModule = await POIsModule.get(map);

    modeSelector = document.getElementById('sdk-example-modeSelector') as HTMLSelectElement;
    modeSelector?.addEventListener('change', (e) =>
        changeFilterMode((e.target as HTMLSelectElement).value as FilterShowMode),
    );

    document.getElementById('sdk-example-resetButton')?.addEventListener('click', resetConfig);

    createFilterToggles();
    
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });
})();
