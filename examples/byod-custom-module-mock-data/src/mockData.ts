import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

// Rough bounding box around Greater London.
const LON_MIN = -0.35;
const LON_MAX = 0.15;
const LAT_MIN = 51.38;
const LAT_MAX = 51.65;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export type PointProps = { id: number; value: number };
export type PolygonProps = { id: number; name: string };

export const generatePoints = (count: number): FeatureCollection<Point, PointProps> => {
    const features: Feature<Point, PointProps>[] = Array.from({ length: count }, (_, index) => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [randomBetween(LON_MIN, LON_MAX), randomBetween(LAT_MIN, LAT_MAX)],
        },
        properties: { id: index, value: Math.round(Math.random() * 100) },
    }));
    return { type: 'FeatureCollection', features };
};

export const generatePolygons = (count: number): FeatureCollection<Polygon, PolygonProps> => {
    const features: Feature<Polygon, PolygonProps>[] = Array.from({ length: count }, (_, index) => {
        // Random rectangle: centre + half-extent in degrees.
        const centerLon = randomBetween(LON_MIN, LON_MAX);
        const centerLat = randomBetween(LAT_MIN, LAT_MAX);
        const halfWidth = randomBetween(0.01, 0.04);
        const halfHeight = randomBetween(0.005, 0.02);
        const west = centerLon - halfWidth;
        const east = centerLon + halfWidth;
        const south = centerLat - halfHeight;
        const north = centerLat + halfHeight;
        return {
            type: 'Feature',
            id: index,
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [west, south],
                        [east, south],
                        [east, north],
                        [west, north],
                        [west, south],
                    ],
                ],
            },
            properties: { id: index, name: `Zone ${index + 1}` },
        };
    });
    return { type: 'FeatureCollection', features };
};
