import { describe, expect, test } from 'vitest';
import { $ZodError } from 'zod/v4/core';
import { hasLngLatSchema } from '../geometriesSchema';

describe('PolygonFeatures schema validation', () => {
    test('Verify if lng, lat coordinates are resolved correctly', () => {
        expect(hasLngLatSchema.parse([180, 90])).toStrictEqual([180, 90]);
        expect(hasLngLatSchema.parse([180, -90])).toStrictEqual([180, -90]);
        expect(hasLngLatSchema.parse([-180, 90])).toStrictEqual([-180, 90]);
        expect(hasLngLatSchema.parse([-180, -90])).toStrictEqual([-180, -90]);
        expect(() => {
            hasLngLatSchema.parse([90, 180]);
        }).toThrow($ZodError);
        expect(() => {
            hasLngLatSchema.parse([-90, 180]);
        }).toThrow($ZodError);
        expect(() => {
            hasLngLatSchema.parse([90, -180]);
        }).toThrow($ZodError);
        expect(() => {
            hasLngLatSchema.parse([90, -180]);
        }).toThrow($ZodError);
    });
});
