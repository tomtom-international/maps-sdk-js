import type { FunctionalRoadClass } from '@tomtom-org/maps-sdk/services';

export type AnalyticsFilters = {
    startDate: string;
    endDate: string;
    hours: number[];
    functionalRoadClasses: FunctionalRoadClass[];
};

const FRC_OPTIONS: { value: FunctionalRoadClass; label: string }[] = [
    { value: 'MOTORWAY', label: 'Motorway' },
    { value: 'MAJOR_ROAD', label: 'Major road' },
    { value: 'OTHER_MAJOR_ROAD', label: 'Other major road' },
    { value: 'SECONDARY_ROAD', label: 'Secondary road' },
    { value: 'LOCAL_CONNECTING_ROAD', label: 'Local connecting road' },
    { value: 'LOCAL_ROAD_HIGH_IMPORTANCE', label: 'Local — high importance' },
    { value: 'LOCAL_ROAD', label: 'Local road' },
    { value: 'LOCAL_ROAD_MINOR_IMPORTANCE', label: 'Local — minor importance' },
    { value: 'OTHER_ROAD', label: 'Other road (paths, cycle)' },
];

const HOUR_PRESETS: { id: string; label: string; hours: number[] }[] = [
    { id: 'all', label: 'All day', hours: Array.from({ length: 24 }, (_, i) => i) },
    { id: 'rush', label: 'Rush hours', hours: [7, 8, 9, 16, 17, 18, 19] },
    { id: 'day', label: 'Daytime', hours: [9, 10, 11, 12, 13, 14, 15, 16] },
    { id: 'night', label: 'Night', hours: [0, 1, 2, 3, 4, 5, 22, 23] },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MAX_RANGE_DAYS = 31;

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);
const parseIsoDay = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const addDays = (iso: string, days: number): string => {
    const date = parseIsoDay(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return isoDay(date);
};
const daysBetween = (startIso: string, endIso: string): number =>
    Math.round((parseIsoDay(endIso).getTime() - parseIsoDay(startIso).getTime()) / MS_PER_DAY);

const validateDateRange = (start: string, end: string): string | null => {
    if (!start || !end) return 'Pick both a start and end date.';
    if (parseIsoDay(start).getTime() > parseIsoDay(end).getTime()) return 'Start date must be before end date.';
    if (daysBetween(start, end) + 1 > MAX_RANGE_DAYS) return `Date range cannot exceed ${MAX_RANGE_DAYS} days.`;
    return null;
};

export const defaultFilters = (): AnalyticsFilters => {
    const end = new Date();
    end.setDate(end.getDate() - 2); // API requires ≥2 days ago
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
        startDate: isoDay(start),
        endDate: isoDay(end),
        hours: Array.from({ length: 24 }, (_, i) => i),
        functionalRoadClasses: FRC_OPTIONS.map((option) => option.value),
    };
};

const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

type InitFiltersResult = {
    isValid: () => boolean;
};

export const initFilters = (state: AnalyticsFilters, onChange: () => void): InitFiltersResult => {
    const startInput = $('filter-start-date') as HTMLInputElement;
    const endInput = $('filter-end-date') as HTMLInputElement;
    const dateError = $('filter-date-error');
    const hourGrid = $('filter-hour-grid');
    const frcList = $('filter-frc-list');

    // Date inputs — the API requires endDate ≥ 2 days before today and a max 31-day window.
    const today = new Date();
    const maxAllowed = new Date(today);
    maxAllowed.setDate(maxAllowed.getDate() - 2);
    const maxAllowedIso = isoDay(maxAllowed);
    startInput.max = maxAllowedIso;
    endInput.max = maxAllowedIso;
    startInput.value = state.startDate;
    endInput.value = state.endDate;

    const refreshDateBounds = (): void => {
        // Constrain the opposite picker to the 31-day window so the lite API limit is impossible to violate.
        startInput.min = state.endDate ? addDays(state.endDate, -(MAX_RANGE_DAYS - 1)) : '';
        const maxFromStart = state.startDate ? addDays(state.startDate, MAX_RANGE_DAYS - 1) : maxAllowedIso;
        endInput.min = state.startDate;
        endInput.max = maxFromStart < maxAllowedIso ? maxFromStart : maxAllowedIso;
    };

    let dateError_ = validateDateRange(state.startDate, state.endDate);

    const renderDateError = (): void => {
        if (dateError_) {
            dateError.textContent = dateError_;
            dateError.classList.remove('aa-hidden');
            startInput.classList.toggle('aa-input-invalid', true);
            endInput.classList.toggle('aa-input-invalid', true);
        } else {
            dateError.textContent = '';
            dateError.classList.add('aa-hidden');
            startInput.classList.remove('aa-input-invalid');
            endInput.classList.remove('aa-input-invalid');
        }
    };

    refreshDateBounds();
    renderDateError();

    const handleDateChange = (): void => {
        state.startDate = startInput.value;
        state.endDate = endInput.value;
        dateError_ = validateDateRange(state.startDate, state.endDate);
        refreshDateBounds();
        renderDateError();
        onChange();
    };

    startInput.addEventListener('change', handleDateChange);
    endInput.addEventListener('change', handleDateChange);

    // Hours grid — 24 toggleable cells with preset buttons.
    const hourSet = new Set<number>(state.hours);
    const cells: HTMLButtonElement[] = [];

    const renderHourCell = (hour: number): void => {
        const cell = cells[hour];
        cell.classList.toggle('selected', hourSet.has(hour));
        cell.setAttribute('aria-pressed', hourSet.has(hour) ? 'true' : 'false');
    };

    for (let hour = 0; hour < 24; hour++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'aa-hour-cell';
        cell.textContent = String(hour);
        cell.title = `${hour}:00 – ${hour}:59`;
        cell.addEventListener('click', () => {
            if (hourSet.has(hour)) hourSet.delete(hour);
            else hourSet.add(hour);
            state.hours = [...hourSet].sort((a, b) => a - b);
            renderHourCell(hour);
            onChange();
        });
        cells.push(cell);
        hourGrid.appendChild(cell);
        renderHourCell(hour);
    }

    const presetRow = $('filter-hour-presets');

    for (const preset of HOUR_PRESETS) {
        const presetButton = document.createElement('button');
        presetButton.type = 'button';
        presetButton.className = 'aa-preset-button';
        presetButton.textContent = preset.label;
        presetButton.addEventListener('click', () => {
            hourSet.clear();
            for (const hour of preset.hours) hourSet.add(hour);
            state.hours = [...hourSet].sort((a, b) => a - b);
            for (let hour = 0; hour < 24; hour++) renderHourCell(hour);
            onChange();
        });
        presetRow.appendChild(presetButton);
    }

    // Functional road classes — checkbox list with All/None toggles.
    const frcSet = new Set<FunctionalRoadClass>(state.functionalRoadClasses);

    for (const option of FRC_OPTIONS) {
        const label = document.createElement('label');
        label.className = 'sdk-example-checkbox-label aa-frc-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option.value;
        checkbox.checked = frcSet.has(option.value);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) frcSet.add(option.value);
            else frcSet.delete(option.value);
            state.functionalRoadClasses = FRC_OPTIONS.map((opt) => opt.value).filter((value) => frcSet.has(value));
            onChange();
        });

        const text = document.createElement('span');
        text.textContent = option.label;

        label.appendChild(checkbox);
        label.appendChild(text);
        frcList.appendChild(label);
    }

    $('filter-frc-all').addEventListener('click', () => {
        for (const option of FRC_OPTIONS) frcSet.add(option.value);
        state.functionalRoadClasses = FRC_OPTIONS.map((option) => option.value);
        for (const input of frcList.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) {
            input.checked = true;
        }
        onChange();
    });

    $('filter-frc-none').addEventListener('click', () => {
        frcSet.clear();
        state.functionalRoadClasses = [];
        for (const input of frcList.querySelectorAll<HTMLInputElement>('input[type=checkbox]')) {
            input.checked = false;
        }
        onChange();
    });

    return {
        isValid: () => dateError_ === null,
    };
};
