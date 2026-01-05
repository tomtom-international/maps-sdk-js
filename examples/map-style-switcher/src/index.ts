import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { type StandardStyleID, standardStyleIDs, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const map = new TomTomMap({
    container: 'sdk-map',
    zoom: 14,
    center: [-0.12621, 51.50394],
});

const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
stylesSelector.addEventListener('change', (event) =>
    map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
);
