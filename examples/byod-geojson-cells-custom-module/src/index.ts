import { aggregateIntoCells, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type CustomGeoJSONLayerSpec, CustomGeoJSONModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { BERLIN_CENTRE, generateListings } from './listings';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: BERLIN_CENTRE,
        zoom: 10.3,
    },
});

type Statistic = 'median' | 'mean';

// Euros per square metre, and the colour each one gets.
const PRICE_COLORS: [number, string][] = [
    [3500, '#2c7bb6'],
    [5000, '#abd9e9'],
    [6500, '#ffffbf'],
    [8000, '#fdae61'],
    [9500, '#d7191c'],
];

const euros = (value: number) => `€${Math.round(value).toLocaleString('en-GB')}`;

const listings = generateListings(5000);

const legend = document.querySelector('#ui-legend') as HTMLDivElement;
const legendMin = document.querySelector('#ui-legendMin') as HTMLSpanElement;
const legendMax = document.querySelector('#ui-legendMax') as HTMLSpanElement;
const shapeInputs = document.querySelectorAll<HTMLInputElement>('input[name="ui-shape"]');
const statisticSelect = document.querySelector('#ui-statistic') as HTMLSelectElement;
const sizeSlider = document.querySelector('#ui-cellSize') as HTMLInputElement;
const sizeValue = document.querySelector('#ui-cellSizeValue') as HTMLSpanElement;
const followZoomToggle = document.querySelector('#ui-followZoom') as HTMLInputElement;
const selection = document.querySelector('#ui-selection') as HTMLDivElement;

const prices = PRICE_COLORS.map(([price]) => price);
legend.style.background = `linear-gradient(to right, ${PRICE_COLORS.map(([, color]) => color).join(', ')})`;
legendMin.textContent = euros(Math.min(...prices));
legendMax.textContent = euros(Math.max(...prices));

const selectedShape = () =>
    [...shapeInputs].find((input) => input.checked)?.value === 'square' ? ('square' as const) : ('hex' as const);

// 1 km at zoom 11, halving with every zoom level in.
const cellSizeForZoom = (zoom: number) => Math.min(4, Math.max(0.25, 2 ** (11 - Math.round(zoom))));

const cellSizeKM = () =>
    followZoomToggle.checked ? cellSizeForZoom(map.mapLibreMap.getZoom()) : Number(sizeSlider.value);

const aggregateListings = () =>
    aggregateIntoCells(listings, {
        grid: selectedShape(),
        cellSizeKM: cellSizeKM(),
        gridOrigin: BERLIN_CENTRE,
        value: 'pricePerSquareMeter',
        stats: ['median', 'mean', 'count'],
        minCount: 5,
    });

type Sources = { cells: ReturnType<typeof aggregateListings> };

const cellLayers = (statistic: Statistic): CustomGeoJSONLayerSpec[] => [
    {
        id: 'cells-fill',
        type: 'fill',
        paint: {
            'fill-color': ['interpolate', ['linear'], ['get', statistic], ...PRICE_COLORS.flat()],
            'fill-opacity': ['case', ['==', ['get', 'eventState'], 'hover'], 0.9, 0.65],
        },
    },
    { id: 'cells-line', type: 'line', paint: { 'line-color': '#ffffff', 'line-width': 0.5 } },
];

(async () => {
    const cells = await CustomGeoJSONModule.create<Sources>(map, {
        beforeLayerConfig: 'lowestLabel',
        sources: { cells: { layers: cellLayers('median') } },
    });

    const showCells = async () => {
        sizeValue.textContent = `${cellSizeKM()} km`;
        await cells.show(aggregateListings());
    };
    await showCells();

    shapeInputs.forEach((input) => input.addEventListener('change', showCells));
    sizeSlider.addEventListener('input', showCells);
    followZoomToggle.addEventListener('change', () => {
        sizeSlider.disabled = followZoomToggle.checked;
        showCells();
    });
    map.mapLibreMap.on('zoomend', () => followZoomToggle.checked && showCells());

    statisticSelect.addEventListener('change', () =>
        cells.updateConfig({ sources: { cells: { layers: cellLayers(statisticSelect.value as Statistic) } } }),
    );

    cells.events.cells.on('hover', (cell) => {
        const { median, mean, count } = cell.properties;
        selection.innerHTML = `<strong>${count} listings</strong>median ${euros(median)}/m², mean ${euros(mean)}/m²`;
    });

    initTogglePanel();
})();
