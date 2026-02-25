import { type BBox, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocodeOne, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const bbox = (await geocodeOne('Amsterdam')).bbox as BBox;

    const result = await trafficIncidentDetails({
        bbox,
        timeValidityFilter: ['present'],
    });

    console.log(`Found ${result.features.length} incident(s)\n`);

    for (const incident of result.features) {
        console.log(JSON.stringify(incident.properties, null, 4));
    }
})();
