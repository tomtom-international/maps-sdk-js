import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    BaseMapLayerGroupName,
    BaseMapLayerGroups,
    BaseMapModule,
    baseMapLayerGroupNames,
    POIsModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

// Turn a camelCase group name into a readable label, e.g. 'roadLabels' -> 'Road labels'.
const humanizeGroupName = (name: string): string => {
    const spaced = name.replace(/([A-Z])/g, ' $1').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// Build one toggle row per base-map layer group and return its checkbox.
const addToggleRow = (container: HTMLElement, group: BaseMapLayerGroupName): HTMLInputElement => {
    const label = document.createElement('label');
    label.className = 'ui-toggle-label';
    label.innerHTML = `
        <input type="checkbox" class="ui-toggle-input" id="ui-toggle-${group}">
        <span class="ui-toggle-switch"></span>
        ${humanizeGroupName(group)}`;
    container.appendChild(label);
    return label.querySelector('input') as HTMLInputElement;
};

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [-74.06332, 40.72732],
            zoom: 12,
        },
    });

    // One base map module controls every group: `setVisible` and `isVisible` both take the group
    // to act on, so a toggle per group needs no module per group.
    const baseMap = await BaseMapModule.get(map);

    const togglesContainer = document.querySelector('#ui-baseMapToggles') as HTMLElement;
    for (const layerGroup of baseMapLayerGroupNames) {
        const layerGroups: BaseMapLayerGroups = { mode: 'include', names: [layerGroup] };
        const checkbox = addToggleRow(togglesContainer, layerGroup);
        // Reflect the group's real starting visibility (e.g. buildings3D ships hidden) rather than assuming.
        checkbox.checked = baseMap.isVisible({ layerGroups });
        checkbox.addEventListener('change', () => baseMap.setVisible(checkbox.checked, { layerGroups }));
    }

    const poisModule = await POIsModule.get(map);
    document.querySelector('#ui-togglePOIs')?.addEventListener('change', (event) => {
        poisModule.setVisible((event.target as HTMLInputElement).checked);
    });

    const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
    for (const id of standardStyleIDs) {
        stylesSelector.add(new Option(id));
    }
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );

    initTogglePanel();
})();
