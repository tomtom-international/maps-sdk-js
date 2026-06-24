import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { sharedWithinFields } from '../schema';

describe('shared within fields', () => {
    const schema = z.object(sharedWithinFields);

    it('accepts a queries-only within', () => {
        expect(schema.safeParse({ mode: 'within', queries: [{ query: 'Paris' }] }).success).toBe(true);
    });

    it('requires a positive route corridor width', () => {
        expect(schema.safeParse({ mode: 'within', route: { widthMeters: 0 } }).success).toBe(false);
        expect(schema.safeParse({ mode: 'within', route: { widthMeters: 200 } }).success).toBe(true);
    });

    it('rejects empty multi-region fields', () => {
        expect(schema.safeParse({ mode: 'within', queries: [] }).success).toBe(false);
        expect(schema.safeParse({ mode: 'within', placeIds: [] }).success).toBe(false);
        expect(schema.safeParse({ mode: 'within', geometries: [] }).success).toBe(false);
        expect(schema.safeParse({ mode: 'within', range: '' }).success).toBe(false);
        expect(schema.safeParse({ mode: 'within', route: { routeId: '', widthMeters: 200 } }).success).toBe(false);
    });
});
