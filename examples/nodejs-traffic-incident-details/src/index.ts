import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocodeOne, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const place = await geocodeOne('Amsterdam');

    const result = await trafficIncidentDetails({
        bbox: place,
        timeValidityFilter: ['present'],
    });

    console.log(`Found ${result.features.length} incident(s)\n`);

    for (const incident of result.features) {
        console.log(JSON.stringify(incident.properties, null, 4));
    }
})();
