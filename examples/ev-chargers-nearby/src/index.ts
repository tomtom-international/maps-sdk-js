import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { discoverPlaces } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const utrechtCentre: [number, number] = [5.1214, 52.0907];

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            center: utrechtCentre,
            zoom: 12,
        },
    });

    const chargingStations = await discoverPlaces({
        filters: { poiCategories: ['CHARGING_LOCATION'], connectors: ['IEC62196Type2CCS'], minPowerKW: 50 },
        geoBias: { position: utrechtCentre, radiusMeters: 5000 },
        limit: 50,
    });

    const placesModule = await PlacesModule.create(map);
    await placesModule.show(chargingStations);

    const stationName = document.querySelector('#station-name') as HTMLParagraphElement;
    const stationAddress = document.querySelector('#station-address') as HTMLSpanElement;
    const connectorList = document.querySelector('#connector-list') as HTMLDListElement;

    placesModule.events.places.on('click', (station) => {
        const { poi, address, chargingPark } = station.properties;
        stationName.textContent = poi?.name ?? address.freeformAddress;
        stationAddress.textContent = address.freeformAddress;

        const rows = (chargingPark?.connectors ?? []).map(({ connector, count }) => {
            const type = document.createElement('dt');
            type.textContent = connector.type;
            const power = document.createElement('dd');
            power.textContent = `${count} × ${connector.ratedPowerKW} kW ${connector.currentType}`;
            const row = document.createElement('div');
            row.append(type, power);
            return row;
        });
        connectorList.replaceChildren(...rows);
    });
})();
