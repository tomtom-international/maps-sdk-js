import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it, vi } from 'vitest';
import {
    type AddressedPlace,
    addressLabel,
    coordKey,
    createCoordResolver,
    formatEndpoints,
    incidentEndpoints,
    incidentNeedsAddress,
} from './incidentLocation';

const incident = (props: Partial<TrafficIncident['properties']>, geometry?: TrafficIncident['geometry']) =>
    ({
        type: 'Feature',
        geometry: geometry ?? { type: 'Point', coordinates: [0, 0] },
        properties: { id: 'x', category: 'jam', magnitudeOfDelay: 'minor', ...props },
    }) as TrafficIncident;

const place = (address: { streetName?: string; freeformAddress: string }): AddressedPlace => ({
    properties: { address },
});

describe('incidentNeedsAddress', () => {
    it('is false when a road number is present', () => {
        expect(incidentNeedsAddress(incident({ roadNumbers: ['A10'] }))).toBe(false);
    });
    it('is false when a "from" street is present', () => {
        expect(incidentNeedsAddress(incident({ from: 'Main St' }))).toBe(false);
    });
    it('is true when neither road number nor "from" is present', () => {
        expect(incidentNeedsAddress(incident({}))).toBe(true);
        expect(incidentNeedsAddress(incident({ roadNumbers: [] }))).toBe(true);
    });
});

describe('incidentEndpoints', () => {
    it('returns the point for a Point geometry, no end', () => {
        expect(incidentEndpoints({ type: 'Point', coordinates: [4, 52] })).toEqual({ start: [4, 52] });
    });
    it('returns first + last for a LineString', () => {
        expect(
            incidentEndpoints({
                type: 'LineString',
                coordinates: [
                    [1, 1],
                    [2, 2],
                    [3, 3],
                ],
            }),
        ).toEqual({ start: [1, 1], end: [3, 3] });
    });
    it('omits end for a single-point LineString', () => {
        expect(incidentEndpoints({ type: 'LineString', coordinates: [[1, 1]] })).toEqual({ start: [1, 1] });
    });
});

describe('coordKey', () => {
    it('rounds to 4 decimals so near-identical points share a key', () => {
        expect(coordKey([4.904112, 52.367612])).toBe('4.9041,52.3676');
        expect(coordKey([4.904134, 52.367644])).toBe(coordKey([4.904112, 52.367612]));
    });
});

describe('addressLabel', () => {
    it('prefers the street name', () => {
        expect(addressLabel(place({ streetName: 'Ringweg-West', freeformAddress: 'Ringweg-West, Amsterdam' }))).toBe(
            'Ringweg-West',
        );
    });
    it('falls back to the freeform address', () => {
        expect(addressLabel(place({ freeformAddress: 'Somewhere 1, Town' }))).toBe('Somewhere 1, Town');
    });
});

describe('formatEndpoints', () => {
    it('collapses identical endpoints to a single name', () => {
        expect(formatEndpoints('Ringweg-West', 'Ringweg-West')).toBe('Ringweg-West');
    });
    it('joins distinct endpoints with an arrow', () => {
        expect(formatEndpoints('A', 'B')).toBe('A → B');
    });
    it('handles a single known endpoint', () => {
        expect(formatEndpoints('A', undefined)).toBe('A');
        expect(formatEndpoints(undefined, 'B')).toBe('B');
    });
    it('degrades to an em dash when nothing is known', () => {
        expect(formatEndpoints(undefined, undefined)).toBe('—');
    });
});

describe('createCoordResolver', () => {
    it('returns undefined for a missing coordinate without calling the geocoder', async () => {
        const fn = vi.fn();
        const resolve = createCoordResolver(fn);
        expect(await resolve(undefined)).toBeUndefined();
        expect(fn).not.toHaveBeenCalled();
    });

    it('resolves a label and caches by rounded coordinate (one call for near-identical points)', async () => {
        const fn = vi.fn().mockResolvedValue(place({ streetName: 'Ringweg-West', freeformAddress: 'x' }));
        const resolve = createCoordResolver(fn);
        expect(await resolve([4.904112, 52.367612])).toBe('Ringweg-West');
        expect(await resolve([4.904134, 52.367644])).toBe('Ringweg-West'); // same rounded key
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('caches failures as undefined and does not retry', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('network'));
        const resolve = createCoordResolver(fn);
        expect(await resolve([1, 1])).toBeUndefined();
        expect(await resolve([1, 1])).toBeUndefined();
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
