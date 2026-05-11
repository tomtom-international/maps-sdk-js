import { bboxFromGeoJSON, formatDistance, formatDuration, TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { PlacesModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import { calculateRoute, geocodeOne, search } from '@tomtom-org/maps-sdk/services';
import './style.css';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

// Haversine distance in metres between two [lon, lat] coordinates. Inlined rather
// than pulled from @turf/turf to keep the example's bundle minimal.
const haversineMeters = (a: [number, number], b: [number, number]): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const [lon1, lat1] = a;
    const [lon2, lat2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const h = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

(async () => {
    const amsterdam = await geocodeOne('Amsterdam');

    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            bounds: amsterdam.bbox,
        },
    });

    const stations = await search({
        poiCategories: ['ELECTRIC_VEHICLE_STATION'],
        position: amsterdam,
        minPowerKW: 150,
        limit: 1,
    });
    const station = stations.features[0];
    if (!station) {
        throw new Error('No high-power charging station found near Amsterdam');
    }

    const cafes = await search({
        poiCategories: ['CAFE'],
        position: station,
        limit: 10,
    });

    const placesModule = await PlacesModule.get(map, {
        theme: 'pin',
        connections: {
            // Prefer travel time once it's been resolved — fall back to the straight-
            // line distance shown while the routing requests are still in flight.
            label: (connection) => {
                const travelTime = connection.travelTime as number | undefined;
                if (typeof travelTime === 'number') return formatDuration(travelTime) ?? '';
                return formatDistance(connection.distanceMeters as number);
            },
        },
    });

    const allPlaces = {
        type: 'FeatureCollection' as const,
        features: [station, ...cafes.features],
    };
    await placesModule.show(allPlaces);

    const stationCoords = station.geometry.coordinates as [number, number];
    const connections = cafes.features.map((cafe) => {
        const cafeCoords = cafe.geometry.coordinates as [number, number];
        return {
            from: station.id,
            to: cafe.id,
            cafeCoords,
            distanceMeters: haversineMeters(stationCoords, cafeCoords),
            travelTime: undefined as number | undefined,
        };
    });

    await placesModule.showConnections(connections);

    const bbox = bboxFromGeoJSON(allPlaces);
    if (bbox) {
        map.mapLibreMap.fitBounds(bbox as [number, number, number, number], { padding: 80, duration: 0 });
    }

    // Run routing requests sequentially to stay under the routing endpoint's QPS
    // cap. One failure shouldn't abort the rest, so errors are swallowed per-leg.
    // A single `showConnections` at the end avoids re-rendering the map once per
    // completed request.
    for (const connection of connections) {
        try {
            const route = await calculateRoute({ locations: [stationCoords, connection.cafeCoords] });
            const travelTime = route.features[0]?.properties.summary.travelTimeInSeconds;
            if (typeof travelTime === 'number') {
                connection.travelTime = travelTime;
            }
        } catch {
            // Leave travelTime undefined; the label falls back to distance.
        }
    }

    await placesModule.showConnections(connections);
})();
