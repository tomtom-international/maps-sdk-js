import { type BBox, budgetUnits, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { calculateReachableRanges, geocodeOne } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

const formatBBox = (bbox: BBox) => bbox.map((value) => value.toFixed(3)).join(', ');

(async () => {
    const origin = await geocodeOne('Domplein 9, Utrecht');
    console.log(`Origin: ${origin.properties.address.freeformAddress}\n`);

    const ranges = await calculateReachableRanges([
        { origin, budget: { type: 'timeMinutes', value: 30 } },
        { origin, budget: { type: 'distanceKM', value: 25 } },
    ]);

    for (const range of ranges.features) {
        const { budget } = range.properties;
        const vertices = range.geometry.coordinates.flat(1).length;
        console.log(
            `${budget.value} ${budgetUnits[budget.type]}: ${vertices} vertices, bbox [${formatBBox(range.bbox)}]`,
        );
    }

    if (ranges.bbox) console.log(`\nBoth ranges fit in [${formatBBox(ranges.bbox)}]`);
})();
