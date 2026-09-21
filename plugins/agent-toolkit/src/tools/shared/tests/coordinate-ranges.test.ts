/**
 * Range validation on model-supplied coordinates (PRODSEC-4464).
 *
 * The tool schemas already reject structurally wrong arguments; these cover the
 * semantic gap — structurally valid arrays whose values are not real lng/lat.
 */
import { describe, expect, it } from 'vitest';
import { flyToSchema } from '../../maplibre/fly-to';
import { reverseGeocodeSchema } from '../../services/reverse-geocode';
import { isFitOnMapInput } from '../fit-on-map';
import { locationInputSchema } from '../location-input';
import { geoJsonBBoxSchema, polygonInputSchema, positionSchema } from '../schema';

describe('positionSchema', () => {
    it('accepts an in-range [lng, lat]', () => {
        expect(positionSchema.safeParse([4.9, 52.37]).success).toBe(true);
    });

    it('accepts the range boundaries', () => {
        expect(positionSchema.safeParse([-180, -90]).success).toBe(true);
        expect(positionSchema.safeParse([180, 90]).success).toBe(true);
    });

    it('rejects out-of-range longitude and latitude', () => {
        expect(positionSchema.safeParse([181, 0]).success).toBe(false);
        expect(positionSchema.safeParse([-181, 0]).success).toBe(false);
        expect(positionSchema.safeParse([0, 91]).success).toBe(false);
        expect(positionSchema.safeParse([999, -500]).success).toBe(false);
    });

    // Known limitation, accepted deliberately: range checks catch a swap only when the
    // swapped latitude leaves [-90, 90]. A swap where both values stay in range is
    // indistinguishable from a genuine position, so the `.describe()` text on each input
    // carries the GeoJSON ordering instead.
    it('catches a [lat, lng] swap only when the swapped latitude leaves its range', () => {
        expect(positionSchema.safeParse([4.9, 152.37]).success).toBe(false);
        expect(positionSchema.safeParse([52.37, 4.9]).success).toBe(true);
    });

    it('rejects non-finite values', () => {
        expect(positionSchema.safeParse([Number.POSITIVE_INFINITY, 0]).success).toBe(false);
        expect(positionSchema.safeParse([0, Number.NaN]).success).toBe(false);
    });

    it('still enforces arity', () => {
        expect(positionSchema.safeParse([4.9]).success).toBe(false);
        expect(positionSchema.safeParse([4.9, 52.37, 12]).success).toBe(false);
    });
});

describe('geoJsonBBoxSchema', () => {
    it('accepts a well-formed bbox', () => {
        expect(geoJsonBBoxSchema.safeParse([4.7, 52.3, 5, 52.4]).success).toBe(true);
    });

    it('rejects out-of-range values', () => {
        expect(geoJsonBBoxSchema.safeParse([-200, 52.3, 5, 52.4]).success).toBe(false);
        expect(geoJsonBBoxSchema.safeParse([4.7, -95, 5, 52.4]).success).toBe(false);
    });

    it('rejects an inverted latitude range', () => {
        expect(geoJsonBBoxSchema.safeParse([4.7, 52.4, 5, 52.3]).success).toBe(false);
    });

    it('allows an antimeridian-crossing bbox where minLng > maxLng', () => {
        expect(geoJsonBBoxSchema.safeParse([170, -10, -170, 10]).success).toBe(true);
    });

    it('still enforces arity', () => {
        expect(geoJsonBBoxSchema.safeParse([4.7, 52.3, 5]).success).toBe(false);
    });
});

describe('polygonInputSchema', () => {
    const ring = (positions: number[][]) => ({ type: 'Polygon' as const, coordinates: [positions] });

    it('accepts a valid ring', () => {
        expect(
            polygonInputSchema.safeParse(
                ring([
                    [4.8, 52.3],
                    [4.9, 52.3],
                    [4.9, 52.4],
                    [4.8, 52.3],
                ]),
            ).success,
        ).toBe(true);
    });

    it('accepts positions carrying an altitude component', () => {
        expect(
            polygonInputSchema.safeParse(
                ring([
                    [4.8, 52.3, 12],
                    [4.9, 52.3, 12],
                    [4.9, 52.4, 12],
                    [4.8, 52.3, 12],
                ]),
            ).success,
        ).toBe(true);
    });

    it('rejects a ring containing an out-of-range position', () => {
        expect(
            polygonInputSchema.safeParse(
                ring([
                    [4.8, 52.3],
                    [400, 52.3],
                    [4.9, 52.4],
                    [4.8, 52.3],
                ]),
            ).success,
        ).toBe(false);
    });
});

// `fitOnMap` comes back from LLM-authored sandbox code, so it never passes through a tool
// input schema — `isFitOnMapInput` is its only gate and has to enforce the same ranges.
describe('isFitOnMapInput', () => {
    it('accepts a bare in-range bbox and the object form', () => {
        expect(isFitOnMapInput([4.7, 52.3, 5, 52.4])).toBe(true);
        expect(isFitOnMapInput({ bbox: [4.7, 52.3, 5, 52.4] })).toBe(true);
        expect(isFitOnMapInput({ bbox: [4.7, 52.3, 5, 52.4], padding: 20, animate: false })).toBe(true);
    });

    it('rejects out-of-range coordinates in both forms', () => {
        expect(isFitOnMapInput([4.7, 52.3, 5, 200])).toBe(false);
        expect(isFitOnMapInput([-200, 52.3, 5, 52.4])).toBe(false);
        expect(isFitOnMapInput({ bbox: [4.7, -95, 5, 52.4] })).toBe(false);
    });

    it('rejects an inverted latitude range', () => {
        expect(isFitOnMapInput([4.7, 52.4, 5, 52.3])).toBe(false);
    });

    it('allows an antimeridian-crossing bbox', () => {
        expect(isFitOnMapInput([170, -10, -170, 10])).toBe(true);
    });

    it('still rejects the structural failures it always did', () => {
        expect(isFitOnMapInput([4.7, 52.3, 5])).toBe(false);
        expect(isFitOnMapInput([4.7, 52.3, 5, Number.NaN])).toBe(false);
        expect(isFitOnMapInput({ bbox: [4.7, 52.3, 5, 52.4], padding: 'wide' })).toBe(false);
        expect(isFitOnMapInput({ bbox: [4.7, 52.3, 5, 52.4], animate: 'yes' })).toBe(false);
        expect(isFitOnMapInput(undefined)).toBe(false);
    });
});

describe('tool inputs using the shared primitives', () => {
    it('flyTo rejects an out-of-range position', () => {
        expect(flyToSchema.safeParse({ where: { position: [4.9, 52.37] } }).success).toBe(true);
        expect(flyToSchema.safeParse({ where: { position: [999, -500] } }).success).toBe(false);
    });

    it('flyTo rejects an out-of-range bounding box', () => {
        expect(flyToSchema.safeParse({ where: { boundingBox: [4.7, 52.3, 5, 52.4] } }).success).toBe(true);
        expect(flyToSchema.safeParse({ where: { boundingBox: [4.7, 52.3, 5, 200] } }).success).toBe(false);
    });

    it('reverseGeocode rejects an out-of-range position', () => {
        expect(reverseGeocodeSchema.safeParse({ position: [4.9, 52.37] }).success).toBe(true);
        expect(reverseGeocodeSchema.safeParse({ position: [0, -91] }).success).toBe(false);
    });

    it('locationInput takes a [lng, lat] array and rejects out-of-range values', () => {
        expect(locationInputSchema.safeParse({ position: [4.9, 52.37] }).success).toBe(true);
        expect(locationInputSchema.safeParse({ position: [4.9, 152.37] }).success).toBe(false);
        expect(locationInputSchema.safeParse({ position: [-181, 52.37] }).success).toBe(false);
    });

    it('no longer accepts the legacy { lng, lat } object form', () => {
        expect(locationInputSchema.safeParse({ position: { lng: 4.9, lat: 52.37 } }).success).toBe(false);
    });
});
