import { CommonPlaceProps, Places, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

const map = new TomTomMap({
    mapLibre: {
        container: 'sdk-map',
        center: [-1.8615, 53.7225],
        zoom: 15,
    },
});

const DATA_URL = 'https://dataworks.calderdale.gov.uk/download/2kyp8/hcj/listed%20buildings%20west%20yorkshire.json';

type ListedBuilding = CommonPlaceProps & { Name: string };

(async () => {
    const data: Places<ListedBuilding> = await (await fetch(DATA_URL)).json();

    const placesModule = await PlacesModule.create<ListedBuilding>(map, {
        markerType: 'base-map',
        icon: { mapping: { to: 'poiCategory', fn: () => 'COMPANY' } },
        label: { title: (place) => place.properties.Name },
    });

    await placesModule.show(data);
})();
