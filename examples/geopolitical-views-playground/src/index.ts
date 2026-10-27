import type { GeopoliticalView } from '@tomtom-org/maps-sdk/core';
import { servesGeopoliticalView, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { createLatestRequest, reverseGeocode } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { showAddress, showStatus } from './addressPanel';
import { API_KEY } from './config';
import { territories } from './territories';
import { initTogglePanel } from './togglePanel';
import { DEFAULT_VIEW_LABEL, initViewSelect } from './viewSelect';

const START_VIEW: GeopoliticalView = 'Unified';

// (Set your own API key when working in your own environment)
// The view set here applies to the map and to every service call.
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB', geopoliticalView: START_VIEW });

const territorySelect = document.querySelector('#ui-territorySelect') as HTMLSelectElement;

// The view a reverse geocoding request carries: the SDK leaves out one the API does not serve.
const requestViewLabel = (): string => {
    const { geopoliticalView } = TomTomConfig.instance.get();
    return geopoliticalView && servesGeopoliticalView(geopoliticalView, 'reverseGeocoding')
        ? geopoliticalView
        : DEFAULT_VIEW_LABEL;
};

(async () => {
    let territory = territories[0];

    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', center: territory.center, zoom: territory.zoom },
    });
    // Centres every territory in the part of the map the panel leaves visible.
    map.mapLibreMap.setPadding({ top: 0, bottom: 0, left: 0, right: 340 });

    const addressPin = await PlacesModule.create(map);
    // A new lookup cancels the one before it, so a slow answer cannot overwrite a newer one.
    const latestLookup = createLatestRequest();

    // Reverse geocoding takes the view from the global configuration.
    const lookUpAddress = async (): Promise<void> => {
        const position = territory.addressPoint;
        addressPin.clear();
        if (!position) {
            latestLookup.cancel();
            showStatus('No address here: the dispute is over sea, ice or an unpopulated border.');
            return;
        }
        const viewLabel = requestViewLabel();
        try {
            const lookup = await latestLookup.run((signal) => reverseGeocode({ position, signal }));
            if (!lookup.current) return;
            const place = lookup.value;
            if (!place.properties) {
                showStatus('No address found at this point.');
                return;
            }

            await addressPin.show(place);
            showAddress(place.properties, viewLabel);
        } catch (error) {
            showStatus(error instanceof Error ? error.message : 'The reverse geocoding call failed.');
        }
    };

    initViewSelect(START_VIEW, (geopoliticalView) => {
        TomTomConfig.instance.put({ geopoliticalView });
        map.setGeopoliticalView(geopoliticalView);
        void lookUpAddress();
    });

    territorySelect.append(
        ...territories.map(({ name, views }, index) => new Option(`${name} (${views.join(', ')})`, String(index))),
    );
    territorySelect.addEventListener('change', () => {
        territory = territories[Number(territorySelect.value)];
        map.mapLibreMap.flyTo({ center: territory.center, zoom: territory.zoom });
        void lookUpAddress();
    });

    initTogglePanel();
    await lookUpAddress();
})();
