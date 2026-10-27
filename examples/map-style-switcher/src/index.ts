import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { standardStyleIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        zoom: 14,
        center: [-0.12621, 51.50394],
    },
});

const stylesSelector = document.querySelector('#ui-mapStyles') as HTMLSelectElement;
standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', () => {
    const styleId = standardStyleIDs.find((id) => id === stylesSelector.value);
    if (styleId) map.setStyle(styleId);
});

initTogglePanel();
