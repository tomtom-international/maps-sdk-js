import type { FeatureCollection, Point, Position } from 'geojson';

export type Listing = { pricePerSquareMeter: number };

export const BERLIN_CENTRE: [number, number] = [13.405, 52.52];

// Pricier around the centre and in the leafy south-west, where there are fewer listings.
const PRICE_HOTSPOTS = [
    { centre: BERLIN_CENTRE, premium: 4500, radiusDegrees: 0.05 },
    { centre: [13.26, 52.47], premium: 3500, radiusDegrees: 0.04 },
];

// A seeded generator, so every load shows the same listings.
const seededRandom = (seed: number) => {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
};

const priceAt = ([longitude, latitude]: Position, noise: number): number => {
    const premium = PRICE_HOTSPOTS.reduce((total, { centre, premium, radiusDegrees }) => {
        const distance = Math.hypot((longitude - centre[0]) * 0.61, latitude - centre[1]);
        return total + premium * Math.exp(-distance / radiusDegrees);
    }, 3200);
    return Math.round(premium * (0.8 + noise * 0.4));
};

/**
 * Mock property listings over Berlin, denser towards the centre, each with an asking price per square metre.
 */
export const generateListings = (count: number): FeatureCollection<Point, Listing> => {
    const random = seededRandom(2298);
    return {
        type: 'FeatureCollection',
        features: Array.from({ length: count }, () => {
            const angle = random() * 2 * Math.PI;
            const distance = 0.17 * Math.sqrt(random()) * (0.4 + 0.6 * random());
            const position: Position = [
                BERLIN_CENTRE[0] + (Math.cos(angle) * distance) / 0.61,
                BERLIN_CENTRE[1] + Math.sin(angle) * distance * 0.75,
            ];
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: position },
                properties: { pricePerSquareMeter: priceAt(position, random()) },
            };
        }),
    };
};
