import type { POICategory } from '@tomtom-org/maps-sdk/core';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeMockState } from '../../../tests/constants';
import { executeGetPoiCategoryCodes } from '../get-poi-category-codes';

describe('executeGetPoiCategoryCodes', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // No filters → the full code list is returned verbatim with its count.
    it('returns the full code list with a matching count when no filters are given', async () => {
        const codes: POICategory[] = ['RESTAURANT', 'FITNESS_CLUB_CENTER', 'BOOK_SHOP'];
        const spy = vi.spyOn(sdkServices, 'getPOICategoryCodes').mockResolvedValue(codes);

        const result = await executeGetPoiCategoryCodes({ language: 'en-GB' }, makeMockState());
        if ('error' in result) {
            expect.fail('expected executeGetPoiCategoryCodes to succeed');
        }

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ filters: undefined, language: 'en-GB' }));
        expect(result.count).toBe(3);
        expect(result.codes).toEqual(codes);
    });

    // filters are forwarded to the service alongside the language.
    it('forwards filters and language to the service', async () => {
        const spy = vi.spyOn(sdkServices, 'getPOICategoryCodes').mockResolvedValue(['FITNESS_CLUB_CENTER']);

        const result = await executeGetPoiCategoryCodes({ filters: ['gym'], language: 'en-GB' }, makeMockState());
        if ('error' in result) {
            expect.fail('expected executeGetPoiCategoryCodes to succeed');
        }

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ filters: ['gym'], language: 'en-GB' }));
        expect(result.codes).toEqual(['FITNESS_CLUB_CENTER']);
    });

    // A thrown service error is caught and surfaced with the exact message interpolated.
    it('surfaces the exact error string when the service throws', async () => {
        vi.spyOn(sdkServices, 'getPOICategoryCodes').mockRejectedValue(new Error('boom'));

        const result = await executeGetPoiCategoryCodes({ language: 'en-GB' }, makeMockState());

        expect(result).toEqual({ error: 'Failed to fetch POI category codes: boom' });
    });
});
