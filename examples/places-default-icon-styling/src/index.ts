import { bboxFromGeoJSON, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { geocode } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-US' });

(async () => {
    const [firstGroup, secondGroup, thirdGroup] = await Promise.all([
        geocode({ query: '1051', countries: ['NL'] }), // searching for locations by postcode
        geocode({ query: '1052', countries: ['NL'] }),
        geocode({ query: '1053', countries: ['NL'] }),
    ]);

    const map = new TomTomMap({
        container: 'sdk-map',
        bounds: bboxFromGeoJSON([firstGroup, secondGroup]),
        fitBoundsOptions: { padding: 50 },
    });

    const firstPlacesModule = await PlacesModule.get(map, {
        icon: { default: { style: { fillColor: '#FFBF00', outlineColor: '#113300', outlineOpacity: 0.25 } } },
    });
    await firstPlacesModule.show(firstGroup);

    const secondPlacesModule = await PlacesModule.get(map, {
        icon: { default: { style: { fillColor: 'lightblue', outlineColor: 'grey', outlineOpacity: 0.5 } } },
    });
    await secondPlacesModule.show(secondGroup);

    const thirdPlacesModule = await PlacesModule.get(map, {
        icon: { default: { style: { fillColor: '#FFBBCC', outlineColor: 'red', outlineOpacity: 0.25 } } },
    });
    await thirdPlacesModule.show(thirdGroup);
})();
