import { describe, expect, test } from 'vitest';
import { mercatorMetresToLngLat } from '../utils';

const EARTH_RADIUS_METRES = 6378137;
const DEGREES_TO_RADIANS = Math.PI / 180;

const lngLatToMercatorMetres = (longitude: number, latitude: number): [number, number] => [
    longitude * DEGREES_TO_RADIANS * EARTH_RADIUS_METRES,
    Math.log(Math.tan(Math.PI / 4 + (latitude * DEGREES_TO_RADIANS) / 2)) * EARTH_RADIUS_METRES,
];

describe('mercatorMetresToLngLat', () => {
    test.each([
        ['Innsbruck', 11.39085, 47.27574],
        ['Santiago (south-west)', -70.6693, -33.4489],
    ])('round-trips %s', (_name, longitude, latitude) => {
        const [x, y] = lngLatToMercatorMetres(longitude, latitude);
        const [convertedLongitude, convertedLatitude] = mercatorMetresToLngLat(x, y);
        expect(convertedLongitude).toBeCloseTo(longitude, 9);
        expect(convertedLatitude).toBeCloseTo(latitude, 9);
    });
});
