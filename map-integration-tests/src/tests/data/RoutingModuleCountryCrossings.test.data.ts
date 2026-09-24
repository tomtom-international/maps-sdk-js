import type { Routes } from 'core';

/**
 * Short routes that cross a border, built by hand rather than recorded.
 *
 * @remarks
 * A crossing depends on the two country codes and nothing else, so each route here is a straight
 * line tiled end to end by its `country` sections, the way the API reports them. The coordinates
 * only put the route roughly where its border is; the countries come from the sections.
 */
const crossingRoute = (options: {
    /** ISO 3166-1 alpha-2 codes, in the order the route passes through them. */
    countryCodes: string[];
    start: [number, number];
    /** How many alternatives to build, each one a parallel line a little further north. */
    routeCount?: number;
}): Routes => {
    const [longitude, latitude] = options.start;
    const pointsPerCountry = 5;
    const lastIndex = options.countryCodes.length * pointsPerCountry;
    const summary = {
        lengthInMeters: 1400 * options.countryCodes.length,
        travelTimeInSeconds: 90 * options.countryCodes.length,
        trafficDelayInSeconds: 0,
        departureTime: new Date('2026-01-01T08:00:00Z'),
        arrivalTime: new Date('2026-01-01T08:05:00Z'),
    };
    const span = lastIndex * 0.004;
    const routeCount = options.routeCount ?? 1;
    // Each alternative sits 0.01 further north than the one before, so the box has to grow with them.
    const bbox = [longitude, latitude - 0.01, longitude + span, latitude + 0.01 + (routeCount - 1) * 0.01];

    return {
        type: 'FeatureCollection',
        bbox,
        features: Array.from({ length: routeCount }, (_unused, routeIndex) => ({
            type: 'Feature',
            bbox,
            geometry: {
                type: 'LineString',
                coordinates: Array.from({ length: lastIndex + 1 }, (_point, index) => [
                    longitude + index * 0.004,
                    latitude + routeIndex * 0.01,
                ]),
            },
            properties: {
                index: routeIndex,
                summary,
                legs: [],
                sections: {
                    // One leg over the whole line: the module walks the legs of every route it
                    // shows, so a route without them never reaches the sections.
                    leg: [{ startPointIndex: 0, endPointIndex: lastIndex, summary }],
                    // Tiled end to end, the way the API reports them — the next country starts
                    // at the point the previous one ended.
                    country: options.countryCodes.map((countryCodeISO2, index) => ({
                        id: `country-${countryCodeISO2}-${routeIndex}-${index}`,
                        startPointIndex: index * pointsPerCountry,
                        endPointIndex: (index + 1) * pointsPerCountry,
                        countryCodeISO2,
                        countryCodeISO3: '',
                    })),
                },
            },
        })),
    } as unknown as Routes;
};

/** One crossing, at the Pyrenees. */
export const spainToFranceRoute = crossingRoute({ countryCodes: ['ES', 'FR'], start: [2.86, 42.47] });

/** Two crossings on one route, so the shot says both plaques draw and neither eats the other. */
export const franceToBelgiumToNetherlandsRoute = crossingRoute({
    countryCodes: ['FR', 'BE', 'NL'],
    start: [3.2, 50.72],
});

/** Two alternatives, both crossing the same border, so a selection change has something to restyle. */
export const spainToFranceAlternatives = crossingRoute({
    countryCodes: ['ES', 'FR'],
    start: [2.86, 42.47],
    routeCount: 2,
});
