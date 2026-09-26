import { describe, expect, it } from 'vitest';
import { resolveDisplayMode } from '../displayMode';

const STANDARD_LIGHT = { diffuseColor: 'hsl(38, 6%, 90%)', opacity: 0.7, verticalGradient: true };

describe('resolveDisplayMode', () => {
    it('mirrors the basemap look for inherited mode', () => {
        const basemap = { diffuseColor: 'hsl(207, 35%, 80%)', opacity: 0.6, verticalGradient: false };
        expect(resolveDisplayMode('inherited', basemap)).toEqual(basemap);
    });

    it('completes a partly resolvable basemap look with the standard light one', () => {
        expect(resolveDisplayMode('inherited', { diffuseColor: 'hsl(207, 35%, 80%)' })).toEqual({
            ...STANDARD_LIGHT,
            diffuseColor: 'hsl(207, 35%, 80%)',
        });
    });

    it('falls back to the standard light look when the basemap layer is absent', () => {
        expect(resolveDisplayMode('inherited', null)).toEqual(STANDARD_LIGHT);
    });

    it('ignores the basemap look for the fixed modes', () => {
        const basemap = { diffuseColor: 'hsl(207, 35%, 80%)', opacity: 0.6, verticalGradient: false };
        expect(resolveDisplayMode('light', basemap)).toEqual(STANDARD_LIGHT);
        expect(resolveDisplayMode('dark', basemap).diffuseColor).toBe('hsl(210, 9%, 17%)');
    });
});
