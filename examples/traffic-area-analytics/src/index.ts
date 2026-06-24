import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap, TrafficAreaAnalyticsModule } from '@tomtom-org/maps-sdk/map';
import { geocodeOne, geometryData, trafficAreaAnalytics } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY, MOVE_PORTAL_KEY } from './config';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY, language: 'en-GB' });

const pastDateRange = (): { startDate: string; endDate: string } => {
    const end = new Date();
    end.setDate(end.getDate() - 3);
    const start = new Date();
    start.setDate(start.getDate() - 9);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
};

(async () => {
    const cityName = 'Amsterdam, Netherlands';
    const place = await geocodeOne(cityName);

    // Init map immediately so it loads while analytics are being fetched
    const map = new TomTomMap({
        mapLibre: { container: 'sdk-map', bounds: place.bbox, fitBoundsOptions: { padding: 40, pitch: 45 } },
    });

    // Fetch geometry then kick off analytics — runs in parallel with map initialization
    const analyticsPromise = geometryData({ geometries: [place] })
        .then(({ features }) => features[0]?.geometry)
        .then((geometry) =>
            trafficAreaAnalytics({
                apiKey: MOVE_PORTAL_KEY,
                name: cityName,
                ...pastDateRange(),
                metrics: ['speed', 'congestionLevel', 'freeFlowSpeed', 'travelTime'],
                functionalRoadClasses: 'all',
                hours: 'all',
                geometry,
            }),
        );

    const [analyticsModule, analytics] = await Promise.all([TrafficAreaAnalyticsModule.get(map), analyticsPromise]);

    await analyticsModule.show(analytics);
})();
