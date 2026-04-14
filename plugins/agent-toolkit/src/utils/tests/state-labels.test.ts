import { describe, expect, it } from 'vitest';
import { makePlacesLabel, makeRoutesLabel } from '../state-labels';

describe('makePlacesLabel', () => {
    it('labels a single locate result', () => {
        const place = {
            properties: {
                poi: { name: 'Cafe de Jaren' },
                address: { freeformAddress: 'Nieuwe Doelenstraat 20, Amsterdam' },
            },
        } as any;
        expect(makePlacesLabel(place)).toBe('Cafe de Jaren, Nieuwe Doelenstraat 20, Amsterdam');
    });

    it('labels a single geocode result with no POI name', () => {
        const place = {
            properties: { address: { freeformAddress: 'Dam Square, Amsterdam' } },
        } as any;
        expect(makePlacesLabel(place)).toBe('Dam Square, Amsterdam');
    });

    it('falls back to query for a sparse single result', () => {
        const place = { properties: {} } as any;
        expect(makePlacesLabel(place, { query: 'Eiffel Tower' })).toBe('Eiffel Tower');
    });

    it('prefers result properties over query for a single result', () => {
        const place = {
            properties: { poi: { name: 'Tour Eiffel' } },
        } as any;
        expect(makePlacesLabel(place, { query: 'Eiffel Tower' })).toBe('Tour Eiffel');
    });

    it('falls back for missing data without context', () => {
        const place = { properties: {} } as any;
        expect(makePlacesLabel(place)).toBe('Place');
    });

    it('labels a collection with query context', () => {
        const places = {
            features: [{ properties: {} }, { properties: {} }, { properties: {} }],
        } as any;
        expect(makePlacesLabel(places, { query: 'coffee shops' })).toBe('"coffee shops" (3 places)');
    });

    it('labels a collection with POI categories', () => {
        const places = {
            features: Array.from({ length: 5 }, () => ({ properties: {} })),
        } as any;
        expect(makePlacesLabel(places, { poiCategories: ['RESTAURANT', 'CAFE'] })).toBe('RESTAURANT, CAFE (5 places)');
    });

    it('labels a collection with where location', () => {
        const places = {
            features: Array.from({ length: 3 }, () => ({ properties: {} })),
        } as any;
        expect(makePlacesLabel(places, { query: 'pizza', where: 'Amsterdam' })).toBe('"pizza" in Amsterdam (3 places)');
    });

    it('labels a collection combining query, categories, and where', () => {
        const places = {
            features: Array.from({ length: 7 }, () => ({ properties: {} })),
        } as any;
        expect(makePlacesLabel(places, { query: 'best', poiCategories: ['RESTAURANT'], where: 'Berlin' })).toBe(
            '"best" RESTAURANT in Berlin (7 places)',
        );
    });

    it('labels a collection with query and where', () => {
        const places = {
            features: Array.from({ length: 8 }, (_, i) => ({ properties: { poi: { name: `Sushi Place ${i}` } } })),
        } as any;
        expect(makePlacesLabel(places, { query: 'sushi', where: 'Tokyo' })).toBe('"sushi" in Tokyo (8 places)');
    });

    it('labels a collection with query, where, and poiCategories', () => {
        const places = {
            features: Array.from({ length: 4 }, (_, i) => ({ properties: { poi: { name: `Brunch Spot ${i}` } } })),
        } as any;
        expect(
            makePlacesLabel(places, { query: 'best brunch', poiCategories: ['RESTAURANT', 'CAFE'], where: 'Paris' }),
        ).toBe('"best brunch" RESTAURANT, CAFE in Paris (4 places)');
    });

    it('labels a collection with count only when no context', () => {
        const places = {
            features: Array.from({ length: 12 }, () => ({ properties: {} })),
        } as any;
        expect(makePlacesLabel(places)).toBe('12 places');
    });

    it('labels a single-result collection', () => {
        const places = {
            features: [{ properties: {} }],
        } as any;
        expect(makePlacesLabel(places, { query: 'museum' })).toBe('"museum" (1 place)');
    });
});

describe('makeRoutesLabel', () => {
    it('labels a route with waypoint addresses', () => {
        const waypoints = [
            { properties: { address: { freeformAddress: 'Amsterdam Centraal' } } },
            { properties: { address: { freeformAddress: 'Schiphol Airport' } } },
        ] as any;
        const routes = {
            features: [
                {
                    properties: {
                        summary: { travelTimeInSeconds: 1380, lengthInMeters: 18000 },
                    },
                },
            ],
        } as any;
        expect(makeRoutesLabel(routes, waypoints)).toBe('Amsterdam Centraal to Schiphol Airport (23 min, 18.0 km)');
    });

    it('labels a route with 3 waypoints', () => {
        const waypoints = [
            { properties: { address: { freeformAddress: 'A' } } },
            { properties: { address: { freeformAddress: 'B' } } },
            { properties: { address: { freeformAddress: 'C' } } },
        ] as any;
        const routes = {
            features: [
                {
                    properties: {
                        summary: { travelTimeInSeconds: 3600, lengthInMeters: 50000 },
                    },
                },
            ],
        } as any;
        expect(makeRoutesLabel(routes, waypoints)).toBe('A via B to C (60 min, 50.0 km)');
    });

    it('falls back when waypoints have no addresses', () => {
        const waypoints = [{ properties: {} }, { properties: {} }] as any;
        const routes = {
            features: [
                {
                    properties: {
                        summary: { travelTimeInSeconds: 600, lengthInMeters: 5000 },
                    },
                },
            ],
        } as any;
        expect(makeRoutesLabel(routes, waypoints)).toBe('Route (10 min, 5.0 km)');
    });
});
