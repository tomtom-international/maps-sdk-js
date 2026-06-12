import type { Routes } from 'core';

const DEPARTURE = new Date('2024-06-01T08:00:00Z');
const ARRIVAL = new Date('2024-06-01T08:10:00Z');

const legSummary = {
    arrivalTime: ARRIVAL,
    departureTime: DEPARTURE,
    lengthInMeters: 3000,
    travelTimeInSeconds: 600,
    trafficDelayInSeconds: 60,
    trafficLengthInMeters: 500,
};

const routeSummary = {
    ...legSummary,
    magnitudeOfDelay: 'minor' as const,
};

// 50-point straight route east across Amsterdam (52.373°N, 4.880–4.920°E)
const buildCoords = (offsetLat = 0): [number, number][] =>
    Array.from({ length: 50 }, (_, i) => [
        Number.parseFloat((4.88 + i * (0.04 / 49)).toFixed(6)),
        Number.parseFloat((52.373 + offsetLat).toFixed(6)),
    ]);

const buildRoute = (
    coords: [number, number][],
    traffic: Routes['features'][0]['properties']['sections']['traffic'],
): Routes => ({
    type: 'FeatureCollection',
    bbox: [coords[0][0], coords[0][1] - 0.001, coords[coords.length - 1][0], coords[0][1] + 0.001],
    features: [
        {
            type: 'Feature',
            id: 'route-0',
            bbox: [coords[0][0], coords[0][1] - 0.001, coords[coords.length - 1][0], coords[0][1] + 0.001],
            geometry: { type: 'LineString', coordinates: coords },
            properties: {
                index: 0,
                summary: routeSummary,
                sections: {
                    leg: [
                        {
                            id: 'leg-0',
                            startPointIndex: 0,
                            endPointIndex: coords.length - 1,
                            summary: legSummary,
                        },
                    ],
                    traffic,
                },
            },
        },
    ],
});

/**
 * Route with a single jam-only traffic section.
 * Expect: routeIncidentJamSymbol renders features, routeIncidentCauseSymbol renders none.
 */
export const jamOnlyRoutes: Routes = buildRoute(buildCoords(0), [
    {
        id: 'traffic-jam',
        startPointIndex: 10,
        endPointIndex: 20,
        categories: ['jam'],
        magnitudeOfDelay: 'minor',
        delayInSeconds: 300,
        tec: { causes: [{ mainCauseCode: 1 }] },
    },
]);

/**
 * Route with a single accident-only traffic section.
 * Expect: routeIncidentCauseSymbol renders features, routeIncidentJamSymbol renders none.
 */
export const accidentOnlyRoutes: Routes = buildRoute(buildCoords(0.01), [
    {
        id: 'traffic-accident',
        startPointIndex: 10,
        endPointIndex: 20,
        categories: ['accident'],
        magnitudeOfDelay: 'moderate',
        tec: { causes: [{ mainCauseCode: 2 }] },
    },
]);

/**
 * Route with a combined jam + accident section (the multi-cause scenario).
 * Expect: BOTH routeIncidentJamSymbol AND routeIncidentCauseSymbol render features.
 */
export const jamAndAccidentRoutes: Routes = buildRoute(buildCoords(0.02), [
    {
        id: 'traffic-jam-and-accident',
        startPointIndex: 10,
        endPointIndex: 20,
        categories: ['jam', 'accident'],
        magnitudeOfDelay: 'moderate',
        delayInSeconds: 420,
        tec: { causes: [{ mainCauseCode: 1 }, { mainCauseCode: 2 }] },
    },
]);
