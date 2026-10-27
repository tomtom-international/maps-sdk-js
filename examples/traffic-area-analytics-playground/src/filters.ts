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

export const ALL_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// In local time: the filter and the response count hours in UTC, so a preset converts to it when applied.
const HOUR_PRESETS: { id: string; label: string; localHours: number[] }[] = [
    { id: 'all', label: 'All day', localHours: ALL_HOURS },
    { id: 'rush', label: 'Rush hours', localHours: [7, 8, 9, 16, 17, 18, 19] },
    { id: 'day', label: 'Daytime', localHours: [9, 10, 11, 12, 13, 14, 15, 16] },
    { id: 'night', label: 'Night', localHours: [0, 1, 2, 3, 4, 5, 22, 23] },
];

// The viewer's clock on `day`, as daylight saving shifts it: `getTimezoneOffset` is UTC minus local time in minutes.
// A half-hour offset rounds to a whole hour, the filter's step. Offsets span -12 to +14, so one +24 keeps it positive.
const localHoursToUTC = (localHours: number[], day: Date): number[] => {
    const offsetHours = Math.round(-day.getTimezoneOffset() / 60);
    return localHours.map((hour) => (hour - offsetHours + 24) % 24);
};

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
    // The service takes an end date one to 31 days after the start date.
    if (daysBetween(start, end) < 1) return 'Start date must be before end date.';
    if (daysBetween(start, end) > MAX_RANGE_DAYS) return `Date range cannot exceed ${MAX_RANGE_DAYS} days.`;
    return null;
};

export const defaultFilters = (): AnalyticsFilters => {
    const end = new Date();
    end.setDate(end.getDate() - 3); // the latest date that always has data
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
        startDate: isoDay(start),
        endDate: isoDay(end),
        hours: ALL_HOURS,
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

    // Date inputs: the API requires endDate ≥ 2 days before today and a max 31-day window.
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
        startInput.min = state.endDate ? addDays(state.endDate, -MAX_RANGE_DAYS) : '';
        const maxFromStart = state.startDate ? addDays(state.startDate, MAX_RANGE_DAYS) : maxAllowedIso;
        endInput.min = state.startDate ? addDays(state.startDate, 1) : '';
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
        cell.title = `${hour}:00 – ${hour}:59 UTC`;
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
        presetButton.title = `${preset.label} on your clock, as UTC hours`;
        presetButton.addEventListener('click', () => {
            hourSet.clear();
            // Noon on the end day, read on the viewer's clock: the offset of the days analysed, not of today.
            const endDay = state.endDate ? new Date(`${state.endDate}T12:00`) : new Date();
            for (const hour of localHoursToUTC(preset.localHours, endDay)) hourSet.add(hour);
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
        label.className = 'ui-checkbox-label aa-frc-row';

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
        // No road class or no hour selected analyses them all, as a city picked with that selection does.
        isValid: () => dateError_ === null,
    };
};
