import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    HillshadeModule,
    StandardStyleID,
    standardStyleIDs,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const map = new TomTomMap(
        {
            container: 'sdk-map',
            zoom: 13,
            minZoom: 2,
            center: [2.1493, 41.4001],
        },
        { style: { type: 'standard', include: [] } },
    );

    document
        .querySelector('#sdk-example-addIncidents')
        ?.addEventListener('click', () => TrafficIncidentsModule.get(map));
    document.querySelector('#sdk-example-addFlow')?.addEventListener('click', () => TrafficFlowModule.get(map));
    document.querySelector('#sdk-example-addHillshade')?.addEventListener('click', () => HillshadeModule.get(map));

    const stylesSelector = document.querySelector('#sdk-example-mapStyles') as HTMLSelectElement;
    standardStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as StandardStyleID),
    );
})();
