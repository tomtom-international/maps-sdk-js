import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { search } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const response = await search({
        poiCategories: ['BUS_STOP'],
        boundingBox: [4.72, 52.27, 5.07, 52.43], // Amsterdam
    });

    console.log(`Found ${response.features.length} results\n`);

    response.features.forEach((result) => {
        console.log(
            `${result.properties.poi?.name}\n${result.properties.address.freeformAddress}\n${result.geometry.coordinates}`,
        );
    });
})();
