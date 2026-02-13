import type { DelayMagnitude } from '@tomtom-org/maps-sdk/core';
import { indexedMagnitudes, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficIncidentsModule } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: [2.34281, 48.85639],
            zoom: 12,
        },
    });

    const incidents = await TrafficIncidentsModule.get(map, { visible: true });

    const applyFilter = () => {
        const selectedMagnitudes = [
            ...document.querySelectorAll<HTMLInputElement>('input[name="magnitude"]:checked'),
        ].map((checkbox) => checkbox.value as DelayMagnitude);
        const allSelected = selectedMagnitudes.length === indexedMagnitudes.length;
        incidents.filter(
            allSelected ? undefined : { any: [{ magnitudes: { show: 'only', values: selectedMagnitudes } }] },
        );
    };

    document
        .querySelectorAll('input[name="magnitude"]')
        .forEach((checkbox) => checkbox.addEventListener('change', applyFilter));

    document.getElementById('sdk-example-clearFilter')?.addEventListener('click', () => {
        document
            .querySelectorAll<HTMLInputElement>('input[name="magnitude"]')
            .forEach((checkbox) => (checkbox.checked = true));
        applyFilter();
    });
    
    const toggleButton = document.querySelector('.sdk-example-heading-toggle');
    const panelContent = document.querySelector('.sdk-example-panel-content');
    
    toggleButton?.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panelContent?.classList.toggle('collapsed');
    });
})();
