import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { RoadCategory } from '@tomtom-org/maps-sdk/map';
import { TomTomMap, TrafficFlowModule } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { buildPopupHTML, createFlowPopup } from './popup';
import { initTogglePanel } from './togglePanel';

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

    const trafficFlowModule = await TrafficFlowModule.get(map, { visible: true });

    const popup = createFlowPopup();
    trafficFlowModule.events.on('click', (feature, lngLat) => {
        popup.setHTML(buildPopupHTML(feature)).setLngLat(lngLat).addTo(map.mapLibreMap);
    });

    const applyFilter = () => {
        const selectedCategories = [
            ...document.querySelectorAll<HTMLInputElement>('input[name="roadCategory"]:checked'),
        ].map((checkbox) => checkbox.value as RoadCategory);
        const totalCheckboxes = document.querySelectorAll('input[name="roadCategory"]').length;
        const allSelected = selectedCategories.length === totalCheckboxes;
        trafficFlowModule.filter(
            allSelected ? undefined : { any: [{ roadCategories: { show: 'only', values: selectedCategories } }] },
        );
    };

    document
        .querySelectorAll('input[name="roadCategory"]')
        .forEach((checkbox) => checkbox.addEventListener('change', applyFilter));

    document.getElementById('sdk-example-clearFilter')?.addEventListener('click', () => {
        document
            .querySelectorAll<HTMLInputElement>('input[name="roadCategory"]')
            .forEach((checkbox) => (checkbox.checked = true));
        applyFilter();
    });

    initTogglePanel();
})();
