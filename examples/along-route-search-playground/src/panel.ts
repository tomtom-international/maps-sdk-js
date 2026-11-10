import { formatDuration, type POICategory, type Route } from '@tomtom-org/maps-sdk/core';
import type { AlongRouteSearchParams } from '@tomtom-org/maps-sdk/services';
import { type DemoRouteId, demoRoutes } from './drives';
import { routeStretch, type SelectableSectionType, type StretchSelection, selectableSections } from './routeStretch';

const ROUTE_POI_CATEGORIES = [
    'CHARGING_LOCATION',
    'FUEL_STATION',
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
    'OPEN_CAR_PARKING_AREA',
    'IMPORTANT_TOURIST_ATTRACTION',
    'MUSEUM',
    'VIEWPOINT',
    'BEACH',
    'SUPERMARKET',
    'MALL',
].toSorted() as POICategory[];

const DEFAULT_DETOUR_MINUTES = 5;
const SHARE_GAP = 5;

export type SearchPanelParams = Pick<AlongRouteSearchParams, 'query' | 'filters' | 'maxDetourTimeSeconds'> & {
    stretch: StretchSelection;
};

const element = <T extends Element>(selector: string): T => {
    const found = document.querySelector(selector);
    if (!found) throw new Error(`Missing ${selector}`);
    return found as T;
};

const checkboxList = (container: HTMLElement, entries: { value: string; label: string }[], onChange: () => void) => {
    for (const { value, label } of entries) {
        const field = document.createElement('label');
        field.className = 'ui-checkbox-label';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = value;
        input.addEventListener('change', onChange);
        field.appendChild(input);
        field.appendChild(document.createTextNode(label));
        container.appendChild(field);
    }
};

const checkedValues = (container: HTMLElement): string[] =>
    [...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')].map((input) => input.value);

const radioValue = (name: string): string => element<HTMLInputElement>(`input[name="${name}"]:checked`).value;

const stretchMode = (): string => element<HTMLSelectElement>('#ui-stretch').value;

type PercentReadout = { slider: HTMLInputElement; label: HTMLElement };

/** Keeps the two handles at least SHARE_GAP apart, pushing the one that was not moved. */
const keepShareOrdered = (from: PercentReadout, to: PercentReadout, moved: 'from' | 'to') => {
    let fromPercent = Number(from.slider.value);
    let toPercent = Number(to.slider.value);
    if (toPercent < fromPercent + SHARE_GAP) {
        if (moved === 'from') {
            toPercent = fromPercent + SHARE_GAP;
            if (toPercent > 100) {
                toPercent = 100;
                fromPercent = 100 - SHARE_GAP;
            }
        } else {
            fromPercent = toPercent - SHARE_GAP;
            if (fromPercent < 0) {
                fromPercent = 0;
                toPercent = SHARE_GAP;
            }
        }
    }
    from.slider.value = String(fromPercent);
    to.slider.value = String(toPercent);
    from.label.textContent = `${fromPercent}%`;
    to.label.textContent = `${toPercent}%`;
};

const readStretch = (sectionTypes: HTMLElement, offered: { type: SelectableSectionType }[]): StretchSelection => {
    const mode = stretchMode();
    if (mode === 'sections') {
        const filter = radioValue('ui-sectionFilter') === 'exclude' ? 'exclude' : 'include';
        const types = checkedValues(sectionTypes).filter((value): value is SelectableSectionType =>
            offered.some((section) => section.type === value),
        );
        return { mode, filter, sectionTypes: types };
    }
    if (mode === 'share') {
        return {
            mode,
            fromPercent: Number(element<HTMLInputElement>('#ui-fromSlider').value),
            toPercent: Number(element<HTMLInputElement>('#ui-toSlider').value),
        };
    }
    return { mode: 'whole' };
};

type StretchControls = {
    read: () => StretchSelection;
    reset: () => void;
    summary: () => string;
    route: () => Route;
    setRoute: (route: Route) => void;
};

const fillSectionTypes = (container: HTMLElement, route: Route, onChange: () => void) => {
    container.replaceChildren();
    checkboxList(
        container,
        selectableSections(route).map((section) => ({ value: section.type, label: section.label })),
        onChange,
    );
};

const bindStretchInputs = (from: PercentReadout, to: PercentReadout, refresh: () => void) => {
    for (const input of document.querySelectorAll<HTMLElement>('#ui-stretch, input[name="ui-sectionFilter"]')) {
        input.addEventListener('change', refresh);
    }
    from.slider.addEventListener('input', () => {
        keepShareOrdered(from, to, 'from');
        refresh();
    });
    to.slider.addEventListener('input', () => {
        keepShareOrdered(from, to, 'to');
        refresh();
    });
};

const setupStretchControls = (route: Route): StretchControls => {
    const sectionPanel = element<HTMLElement>('#ui-sectionStretch');
    const sharePanel = element<HTMLElement>('#ui-shareStretch');
    const sectionTypes = element<HTMLElement>('#ui-sectionTypes');
    const note = element<HTMLElement>('#ui-stretchNote');
    const from = {
        slider: element<HTMLInputElement>('#ui-fromSlider'),
        label: element<HTMLElement>('#ui-fromValue'),
    };
    const to = { slider: element<HTMLInputElement>('#ui-toSlider'), label: element<HTMLElement>('#ui-toValue') };
    let active = route;
    const read = () => readStretch(sectionTypes, selectableSections(active));

    const refresh = () => {
        const mode = stretchMode();
        sectionPanel.hidden = mode !== 'sections';
        sharePanel.hidden = mode !== 'share';
        note.textContent = routeStretch(active, read()).summary;
    };

    const reset = () => {
        element<HTMLSelectElement>('#ui-stretch').value = 'whole';
        element<HTMLInputElement>('input[name="ui-sectionFilter"][value="include"]').checked = true;
        sectionTypes.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
            input.checked = false;
        });
        from.slider.value = '0';
        to.slider.value = '100';
        keepShareOrdered(from, to, 'from');
        refresh();
    };

    fillSectionTypes(sectionTypes, active, refresh);
    bindStretchInputs(from, to, refresh);
    refresh();

    return {
        read,
        route: () => active,
        summary: () => routeStretch(active, read()).summary,
        reset,
        setRoute: (next) => {
            active = next;
            fillSectionTypes(sectionTypes, next, refresh);
            reset();
        },
    };
};

const fillRouteOptions = (select: HTMLSelectElement) => {
    for (const demo of demoRoutes) {
        const option = document.createElement('option');
        option.value = demo.id;
        option.textContent = demo.label;
        select.appendChild(option);
    }
};

/** Switches drive, ignoring an answer that a later pick has already replaced. */
const bindRouteSelect = (
    select: HTMLSelectElement,
    note: HTMLElement,
    setLoading: (loading: boolean) => void,
    onRoute: (routeId: DemoRouteId) => Promise<Route | undefined>,
    applyRoute: (route: Route) => void,
) => {
    let selectedId = select.value;
    let generation = 0;

    select.addEventListener('change', () => {
        const routeId = demoRoutes.find((demo) => demo.id === select.value)?.id;
        if (!routeId) return;
        const ticket = ++generation;
        setLoading(true);
        void onRoute(routeId)
            .then((next) => {
                if (ticket !== generation || !next) return;
                applyRoute(next);
                selectedId = routeId;
            })
            .catch(() => {
                if (ticket !== generation) return;
                select.value = selectedId;
                note.textContent = 'That route could not be calculated.';
            })
            .finally(() => {
                if (ticket === generation) setLoading(false);
            });
    });
};

type PanelHandlers = {
    onSearch: (params: SearchPanelParams) => Promise<string | undefined>;
    onClear: () => void;
    onRoute: (routeId: DemoRouteId) => Promise<Route | undefined>;
};

const panelParams = (
    queryInput: HTMLInputElement,
    categoriesContainer: HTMLElement,
    detourMinutes: HTMLInputElement,
    stretch: StretchControls,
): SearchPanelParams => {
    const categories = checkedValues(categoriesContainer) as POICategory[];
    return {
        query: queryInput.value.trim() || undefined,
        filters: categories.length > 0 ? { poiCategories: categories } : undefined,
        maxDetourTimeSeconds: Number(detourMinutes.value) * 60,
        stretch: stretch.read(),
    };
};

const showDetour = (slider: HTMLInputElement, label: HTMLElement, minutes = Number(slider.value)) => {
    slider.value = String(minutes);
    label.textContent = formatDuration(minutes * 60);
};

const fillCategories = (container: HTMLElement) => {
    checkboxList(
        container,
        ROUTE_POI_CATEGORIES.map((category) => ({
            value: category,
            label: category.replaceAll('_', ' ').toLowerCase(),
        })),
        () => undefined,
    );
};

const wireSearch = (
    note: HTMLElement,
    stretch: StretchControls,
    handlers: PanelHandlers,
    setLoading: (loading: boolean) => void,
    isBusy: () => boolean,
) => {
    const queryInput = element<HTMLInputElement>('#ui-queryInput');
    const searchButton = element<HTMLButtonElement>('#ui-searchButton');
    const clearButton = element<HTMLButtonElement>('#ui-clearButton');
    const categoriesContainer = element<HTMLElement>('#ui-categoriesContainer');
    const detourMinutesSlider = element<HTMLInputElement>('#ui-detourSlider');
    const detourValue = element<HTMLElement>('#ui-detourValue');

    showDetour(detourMinutesSlider, detourValue, DEFAULT_DETOUR_MINUTES);
    fillCategories(categoriesContainer);
    detourMinutesSlider.addEventListener('input', () => showDetour(detourMinutesSlider, detourValue));

    const triggerSearch = async () => {
        if (isBusy()) return;
        const params = panelParams(queryInput, categoriesContainer, detourMinutesSlider, stretch);
        if (routeStretch(stretch.route(), params.stretch).polylines.length === 0) return;

        setLoading(true);
        try {
            note.textContent = (await handlers.onSearch(params)) ?? stretch.summary();
        } finally {
            setLoading(false);
        }
    };

    searchButton.addEventListener('click', triggerSearch);
    clearButton.addEventListener('click', () => {
        queryInput.value = '';
        categoriesContainer.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
        });
        showDetour(detourMinutesSlider, detourValue, DEFAULT_DETOUR_MINUTES);
        stretch.reset();
        handlers.onClear();
    });
    queryInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') triggerSearch();
    });
    return searchButton;
};

export const setupPanel = (route: Route, handlers: PanelHandlers) => {
    const note = element<HTMLElement>('#ui-stretchNote');
    const routeSelect = element<HTMLSelectElement>('#ui-route');
    const stretch = setupStretchControls(route);
    fillRouteOptions(routeSelect);

    // A later pick retires the drive still in flight, so the route select stays usable while one loads.
    let driveLoading = false;
    let searchLoading = false;
    let searchButton: HTMLButtonElement;
    const showBusy = () => {
        const busy = driveLoading || searchLoading;
        searchButton.disabled = busy;
        document.body.style.cursor = busy ? 'wait' : '';
    };
    searchButton = wireSearch(
        note,
        stretch,
        handlers,
        (loading) => {
            searchLoading = loading;
            showBusy();
        },
        () => driveLoading || searchLoading,
    );
    bindRouteSelect(
        routeSelect,
        note,
        (loading) => {
            driveLoading = loading;
            showBusy();
        },
        handlers.onRoute,
        stretch.setRoute,
    );
};
