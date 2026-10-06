import type { AreaAnalyticsMetricKey } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { geocodeOne, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import { API_KEY, MOVE_PORTAL_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const geocodedLocation = await geocodeOne('Amsterdam, Netherlands');
    console.log(`Geocoded: ${geocodedLocation.properties.address.freeformAddress}`);

    const boundary = (await geometryData({ geometries: [geocodedLocation] })).features[0];

    // No endDate: it defaults to three days ago, the latest day with data, so this covers a week.
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 9);

    console.log(`Analysis period: ${startDate.toDateString()} → three days ago`);

    const metrics: AreaAnalyticsMetricKey[] = ['speed', 'congestionLevel'];
    const result = await trafficAreaAnalytics({
        apiKey: MOVE_PORTAL_KEY,
        startDate,
        metrics,
        functionalRoadClasses: [
            'MOTORWAY',
            'MAJOR_ROAD',
            'OTHER_MAJOR_ROAD',
            'SECONDARY_ROAD',
            'LOCAL_CONNECTING_ROAD',
            'LOCAL_ROAD_HIGH_IMPORTANCE',
        ], // you can also just use 'all' to include all FRCs
        hours: 'all',
        geometry: boundary.geometry,
    });

    const region = result.features[0];
    const { baseData, timedData } = region.properties;

    console.log('\n=== Base Data (full period) ===');
    if (baseData.speed) {
        console.log(`  Average speed:    ${baseData.speed.toFixed(1)} km/h`);
    }
    if (baseData.congestionLevel) {
        console.log(`  Congestion level: ${baseData.congestionLevel.toFixed(1)}%`);
    }

    if (timedData.daily && timedData.daily.length > 0) {
        console.log('\n=== Daily Breakdown ===');
        for (const entry of timedData.daily) {
            const date = entry.date.toISOString().slice(0, 10);
            const speed = entry.speed?.toFixed(1) ?? 'n/a';
            const congestion = entry.congestionLevel?.toFixed(1) ?? 'n/a';
            console.log(`  ${date}: speed=${speed} km/h, congestion=${congestion}%`);
        }
    }
})();
