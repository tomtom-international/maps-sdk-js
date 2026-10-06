import type { Place } from '@tomtom-org/maps-sdk/core';
import type {
    DisplayPlaceProps,
    PlaceEntryPointFeature,
    PlaceEntryPointsConfig,
    PlaceEntryPointsShowFor,
} from '@tomtom-org/maps-sdk/map';
import type { Position } from 'geojson';
import { element } from './dom';

const minZoomSlider = element<HTMLInputElement>('#ui-minZoomSlider');
const minZoomValue = element<HTMLElement>('#ui-minZoomValue');
const zoomNote = element<HTMLElement>('#ui-zoomNote');
const linesToggle = element<HTMLInputElement>('#ui-linesToggle');
const lastClickedList = element<HTMLElement>('#ui-lastClicked');
const lastClickedStatus = element<HTMLElement>('#ui-lastClickedStatus');

const showForOptions: PlaceEntryPointsShowFor[] = ['all', 'selected', 'clicked'];

const formatPosition = (position: Position): string => `${position[0].toFixed(5)}, ${position[1].toFixed(5)}`;

const readShowFor = (): PlaceEntryPointsShowFor | undefined => {
    const checked = element<HTMLInputElement>('input[name="ui-showFor"]:checked').value;
    return showForOptions.find((option) => option === checked);
};

export const readEntryPointsConfig = (): PlaceEntryPointsConfig => ({
    showFor: readShowFor(),
    minZoom: Number(minZoomSlider.value),
    ...(!linesToggle.checked && { layers: { line: { layout: { visibility: 'none' } } } }),
});

export const initPanel = (onChange: (config: PlaceEntryPointsConfig) => void): void => {
    const apply = () => onChange(readEntryPointsConfig());
    for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ui-showFor"]')) {
        radio.addEventListener('change', apply);
    }
    minZoomSlider.addEventListener('input', () => {
        minZoomValue.textContent = minZoomSlider.value;
        apply();
    });
    linesToggle.addEventListener('change', apply);
};

export const showZoom = (zoom: number): void => {
    const hidden = zoom < Number(minZoomSlider.value);
    zoomNote.textContent = `Map zoom ${zoom.toFixed(1)}${hidden ? ': zoom in to see entry points.' : '.'}`;
};

const renderRows = (rows: [string, string][]): void => {
    lastClickedList.innerHTML = rows
        .map(([label, value]) => `<dt class="ui-summary-label">${label}</dt><dd class="ui-summary-value">${value}</dd>`)
        .join('');
    lastClickedStatus.textContent = '';
};

export const showPlace = (place: Place<DisplayPlaceProps>): void =>
    renderRows([
        ['Place', place.properties.title ?? '—'],
        ['Entry points', String(place.properties.entryPoints?.length ?? 0)],
    ]);

export const showEntryPoint = ({ geometry, properties }: PlaceEntryPointFeature): void =>
    renderRows([
        ['Place', properties.place?.properties.title ?? '—'],
        [
            'Entry point',
            `${properties.entryPointIndex + 1} of ${properties.place?.properties.entryPoints?.length ?? '—'}`,
        ],
        ['Type', properties.type ?? 'unclassified'],
        ['Functions', properties.functions?.join(', ') || '—'],
        ['Position', formatPosition(geometry.coordinates)],
    ]);
