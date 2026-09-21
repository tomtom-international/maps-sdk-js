import type { Routes } from 'core';

/**
 * One short route per sign face, built by hand rather than recorded.
 *
 * @remarks
 * What a sign looks like depends on three things and nothing else: the limit, the country the
 * stretch runs through, and the display units. A recorded response would carry a thousand
 * coordinates to say the same, and would tie the shot to whatever the road network posts that day —
 * so each route here is a straight line with two speed limit sections and the country section that
 * decides their face.
 *
 * The coordinates put each route where its country is, because nothing else would: the country
 * comes from the `country` section, not from the geometry. A shot of Swedish signs over Kansas
 * would still pass, and would still be unreadable to the next person.
 */
const signRoute = (options: {
    countryCodeISO3: string;
    /** Both in km/h, whatever the country posts — this is what the API reports. */
    limitsInKmh: [number, number];
    start: [number, number];
}): Routes => {
    const [longitude, latitude] = options.start;
    // Eleven points, so the two sections are long enough on screen to frame and each holds a sign.
    const coordinates = Array.from({ length: 11 }, (_, index) => [longitude + index * 0.004, latitude]);
    // The route and its one leg cover the same line, so they report the same summary.
    const summary = {
        lengthInMeters: 2800,
        travelTimeInSeconds: 180,
        trafficDelayInSeconds: 0,
        departureTime: new Date('2026-01-01T08:00:00Z'),
        arrivalTime: new Date('2026-01-01T08:03:00Z'),
    };

    return {
        type: 'FeatureCollection',
        bbox: [longitude, latitude - 0.01, longitude + 0.04, latitude + 0.01],
        features: [
            {
                type: 'Feature',
                bbox: [longitude, latitude - 0.01, longitude + 0.04, latitude + 0.01],
                geometry: { type: 'LineString', coordinates },
                properties: {
                    index: 0,
                    summary,
                    legs: [],
                    sections: {
                        // One leg over the whole line. The module walks the legs of every route it
                        // shows, so a route without them never reaches the sections.
                        leg: [{ startPointIndex: 0, endPointIndex: 10, summary }],
                        country: [
                            {
                                id: `country-${options.countryCodeISO3}`,
                                startPointIndex: 0,
                                endPointIndex: 10,
                                countryCodeISO3: options.countryCodeISO3,
                            },
                        ],
                        speedLimit: [
                            {
                                id: 'speed-limit-first',
                                startPointIndex: 0,
                                endPointIndex: 5,
                                maxSpeedLimitInKmh: options.limitsInKmh[0],
                            },
                            {
                                id: 'speed-limit-second',
                                startPointIndex: 5,
                                endPointIndex: 10,
                                maxSpeedLimitInKmh: options.limitsInKmh[1],
                            },
                        ],
                    },
                },
            },
        ],
    } as unknown as Routes;
};

/** The white disc reading km/h, which is what most of Europe posts. */
export const dutchSignRoute = signRoute({ countryCodeISO3: 'NLD', limitsInKmh: [100, 50], start: [4.9, 52.37] });

/** The same disc reading mph: 112 km/h is a 70 sign, and 48 a 30. */
export const britishSignRoute = signRoute({ countryCodeISO3: 'GBR', limitsInKmh: [112, 48], start: [-0.13, 51.5] });

/** The Nordic yellow disc. */
export const swedishSignRoute = signRoute({ countryCodeISO3: 'SWE', limitsInKmh: [70, 50], start: [18.05, 59.33] });

/** The upright plaque, in mph: 105 km/h is a 65 sign. */
export const americanSignRoute = signRoute({ countryCodeISO3: 'USA', limitsInKmh: [105, 40], start: [-122.42, 37.77] });

/** The white disc with blue numerals. */
export const japaneseSignRoute = signRoute({ countryCodeISO3: 'JPN', limitsInKmh: [60, 40], start: [139.76, 35.68] });
