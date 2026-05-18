import { describe, expect, test } from 'vitest';
import { buildDiscoverPlacesSchema } from './discover-places';

// Parse a complete-enough payload and inspect the result. Zod's default object behaviour is to
// strip unknown keys, so a successfully-parsed `areaTags` / `areaId` value on the output is the
// signature that the schema knows the field.

describe('discoverPlaces — areaId / areaTags are gated on experimentalSearch', () => {
    test('default flag set: areaTags is stripped from the top-level payload', () => {
        const schema = buildDiscoverPlacesSchema({});
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true },
            areaTags: ['walkable'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as { areaTags?: string[] }).areaTags).toBeUndefined();
        }
    });

    test('experimentalSearch: true — areaTags survives parsing at the top level', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true },
            areaTags: ['walkable', 'transit_connected'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as { areaTags?: string[] }).areaTags).toEqual(['walkable', 'transit_connected']);
        }
    });

    test('experimentalSearch: true — areaId alone satisfies the within-mode geo-bias refinement', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', areaId: '20567430' },
        });
        expect(result.success).toBe(true);
        if (result.success && result.data.where?.mode === 'within') {
            expect((result.data.where as { areaId?: string }).areaId).toBe('20567430');
        }
    });

    test('experimentalSearch: true — areaId + viewport together is rejected (mutually exclusive)', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true, areaId: '20567430' },
        });
        expect(result.success).toBe(false);
    });

    test('default flag set — within with areaId only fails the geo-bias refinement', () => {
        // Without experimentalSearch, areaId is stripped by Zod's default object behaviour (unknown
        // keys are dropped), and the remaining within payload has no geo-bias, so the refinement rejects.
        const schema = buildDiscoverPlacesSchema({});
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', areaId: '20567430' },
        });
        expect(result.success).toBe(false);
    });
});
