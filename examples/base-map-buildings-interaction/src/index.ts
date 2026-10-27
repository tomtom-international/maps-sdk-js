import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { BaseMapModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: [-73.9855, 40.7565], zoom: 16.5, pitch: 55, bearing: -30 },
    });

    const hoverColor = document.querySelector('#ui-hover') as HTMLInputElement;
    const clickColor = document.querySelector('#ui-click') as HTMLInputElement;
    const stateLooks = () => ({ hover: { color: hoverColor.value }, click: { color: clickColor.value } });

    const baseMap = await BaseMapModule.get(map, {
        groups: { buildings3D: { visible: true } },
        buildings3D: stateLooks(),
    });
    hoverColor.addEventListener('input', () => baseMap.updateConfig({ buildings3D: stateLooks() }));
    clickColor.addEventListener('input', () => baseMap.updateConfig({ buildings3D: stateLooks() }));

    const selectedText = document.querySelector('#ui-selected') as HTMLElement;
    const paintButton = document.querySelector('#ui-paint-selected') as HTMLButtonElement;
    let selectedId: string | number | undefined;

    // A handler on the group is what makes the buildings turn the hover and click colours.
    baseMap.events
        .where({ layerGroups: { show: 'only', values: ['buildings3D'] } }, { cursorOnHover: 'pointer' })
        .on('click', (building) => {
            selectedId = building.id;
            // Not every building in the tiles carries a height.
            const { height } = building.properties;
            const tall = typeof height === 'number' ? `, ${Math.round(height)} m tall` : '';
            selectedText.textContent = `Selected: building ${building.id}${tall}`;
            paintButton.disabled = false;
        });

    const paintColor = document.querySelector('#ui-paint') as HTMLInputElement;
    paintButton.addEventListener('click', () => {
        if (selectedId === undefined) return;

        baseMap.setBuildingColors({ ...baseMap.getBuildingColors(), [selectedId]: paintColor.value });
    });
    document.querySelector('#ui-clear')?.addEventListener('click', () => baseMap.setBuildingColors({}));
    initTogglePanel();

    // Buildings you know by place rather than by id: the one standing at each position, once the map has
    // drawn it. Its id stays the same through tile reloads and zoom levels, as the one a click shows.
    const highlights: [[number, number], string][] = [
        [[-73.98444, 40.75566], '#29335c'], // The Bank of America Tower
        [[-73.98685, 40.75552], '#1faa59'], // The Times Square Tower
    ];
    // A settled map fires no next `idle`.
    if (!map.mapLibreMap.loaded()) await map.mapLibreMap.once('idle');
    const colors: Record<string, string> = {};
    for (const [position, color] of highlights) {
        const id = baseMap.getBuildingIdAt(position);
        if (id !== undefined) colors[id] = color;
    }
    baseMap.setBuildingColors(colors);
})();
