import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { type BuildingHit, Buildings3D, Landmarks3D } from '@tomtom-org/maps-sdk-plugin-landmarks-3d';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    mapLibre: { container: 'sdk-map', center: [4.8962, 52.3745], zoom: 16.4, pitch: 60, bearing: 20 },
});
const buildings = new Buildings3D(map);
// Its hover and click colours follow the buildings' while unset.
const landmarks = new Landmarks3D(map);

type Kind = 'building' | 'landmark';
const describe = (kind: Kind, { properties }: BuildingHit): string => {
    if (kind === 'landmark') {
        const [longitude, latitude] = properties.position as [number, number];
        return `A landmark at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    // Not every building in the tiles carries a height.
    const height = typeof properties.height === 'number' ? ` ${Math.round(properties.height)} m tall` : '';
    const group = typeof properties.group === 'string' ? `, ${properties.group}` : '';
    return `A building${height}${group}`;
};

const hovered = document.querySelector('#ui-hovered') as HTMLElement;
const selectedText = document.querySelector('#ui-selected') as HTMLElement;
const paintButton = document.querySelector('#ui-paint-selected') as HTMLButtonElement;
let selected: { kind: Kind; hit: BuildingHit } | undefined;

// A handler is what makes them hoverable and clickable, and so turn the hover and click colours.
for (const [kind, events] of [
    ['building', buildings.events],
    ['landmark', landmarks.events],
] as const) {
    events.on('hover', (hit) => {
        hovered.textContent = describe(kind, hit);
    });
    events.on('click', (hit) => {
        selected = { kind, hit };
        selectedText.textContent = `Selected: ${describe(kind, hit).toLowerCase()} (id ${hit.id})`;
        paintButton.disabled = false;
    });
}

// Colours by id, which stay the same through tile reloads and zoom levels: the Beurs van Berlage's is
// the one a click shows in the panel.
const painted: Record<Kind, Record<string, string>> = { building: {}, landmark: { 1766784668: '#e4572e' } };
const showPaint = () => {
    buildings.setBuildingColors(painted.building);
    landmarks.setLandmarkColors(painted.landmark);
};
showPaint();
const paintColor = document.querySelector('#ui-paint') as HTMLInputElement;
paintButton.addEventListener('click', () => {
    if (!selected) return;

    painted[selected.kind][selected.hit.id] = paintColor.value;
    showPaint();
});
document.querySelector('#ui-clear')?.addEventListener('click', () => {
    painted.building = {};
    painted.landmark = {};
    showPaint();
});

// Buildings you know by place rather than by id: the base map names the one standing at a position once
// the map has drawn it, by the id Buildings3D colours it by. Two buildings on Dam Square.
const highlights: [[number, number], string][] = [
    [[4.89441, 52.37305], '#f3a712'],
    [[4.89585, 52.37251], '#29335c'],
];
map.mapLibreMap.once('idle', async () => {
    const baseMap = await BaseMapModule.get(map);
    for (const [position, color] of highlights) {
        const id = baseMap.getBuildingIdAt(position);
        if (id !== undefined) painted.building[id] = color;
    }
    showPaint();
});

const hoverColor = document.querySelector('#ui-hover') as HTMLInputElement;
const clickColor = document.querySelector('#ui-click') as HTMLInputElement;
const showStateColors = () =>
    buildings.updateConfig({ hover: { color: hoverColor.value }, click: { color: clickColor.value } });
hoverColor.addEventListener('input', showStateColors);
clickColor.addEventListener('input', showStateColors);

initTogglePanel();
