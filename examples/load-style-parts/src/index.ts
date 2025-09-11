import '../styles.css';
import { TomTomConfig } from '@cet/maps-sdk-js/core';
import {
    HillshadeModule,
    PublishedStyleID,
    publishedStyleIDs,
    TomTomMap,
    TrafficFlowModule,
    TrafficIncidentsModule,
} from '@cet/maps-sdk-js/map';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES, language: 'en-US' });

(async () => {
    const map = new TomTomMap({ container: 'map', zoom: 13, minZoom: 2, center: [2.1493, 41.4001] });

    document
        .querySelector('#addIncidents')
        ?.addEventListener('click', () => TrafficIncidentsModule.get(map, { ensureAddedToStyle: true }));
    document
        .querySelector('#addFlow')
        ?.addEventListener('click', () => TrafficFlowModule.get(map, { ensureAddedToStyle: true }));
    document
        .querySelector('#addHillshade')
        ?.addEventListener('click', () => HillshadeModule.get(map, { ensureAddedToStyle: true }));

    const stylesSelector = document.querySelector('#mapStyles') as HTMLSelectElement;
    publishedStyleIDs.forEach((id) => stylesSelector.add(new Option(id)));
    stylesSelector.addEventListener('change', (event) =>
        map.setStyle((event.target as HTMLOptionElement).value as PublishedStyleID),
    );

    (window as any).map = map; // This has been done for automation test support
})();
