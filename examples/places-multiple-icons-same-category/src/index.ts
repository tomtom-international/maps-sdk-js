import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { search } from '@tomtom-org/maps-sdk/services';
import airportEsSVG from './airport-pin-es.svg?raw';
import airportFrSVG from './airport-pin-fr.svg?raw';
import airportItSVG from './airport-pin-it.svg?raw';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const [spainAirports, italyAirports, franceAirports] = await Promise.all([
        search({ query: '', countries: ['ES'], poiCategories: ['AIRPORT'], limit: 100 }), // searching for locations by postcode
        search({ query: '', countries: ['IT'], poiCategories: ['AIRPORT'], limit: 100 }),
        search({ query: '', countries: ['FR'], poiCategories: ['AIRPORT'], limit: 100 }),
    ]);

    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromGeoJSON([spainAirports, italyAirports, franceAirports]),
        fitBoundsOptions: { padding: 50 },
    });

    const spainAirportsModule = await PlacesModule.get(map, {
        icon: { categoryIcons: [{ id: 'AIRPORT', image: airportEsSVG }] },
    });
    await spainAirportsModule.show(spainAirports);

    const italyAirportsModule = await PlacesModule.get(map, {
        icon: { categoryIcons: [{ id: 'AIRPORT', image: airportItSVG }] },
    });
    await italyAirportsModule.show(italyAirports);

    const franceAirportsModule = await PlacesModule.get(map, {
        icon: { categoryIcons: [{ id: 'AIRPORT', image: airportFrSVG }] },
    });
    await franceAirportsModule.show(franceAirports);
})();
