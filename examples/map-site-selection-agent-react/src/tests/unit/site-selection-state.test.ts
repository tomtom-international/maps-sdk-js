import type { ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it } from 'vitest';
import {
    DEFAULT_SITE_SELECTION_PREFERENCES,
    getSitePreferences,
    resolveCatchment,
    SiteSelectionState,
} from '../../agent/site-selection-state';

// A ToolState is only ever narrowed to read `.siteSelection`, so a slice-only stub is enough here.
const stateWith = (slice: SiteSelectionState): ToolState => ({ siteSelection: slice }) as unknown as ToolState;

describe('SiteSelectionState', () => {
    it('seeds the shipped defaults', () => {
        expect(new SiteSelectionState().preferences).toEqual(DEFAULT_SITE_SELECTION_PREFERENCES);
    });

    it('applies a scalar patch without touching other fields', () => {
        const slice = new SiteSelectionState();
        const next = slice.update({ walkReachMeters: 1200 });
        expect(next.walkReachMeters).toBe(1200);
        expect(next.driveMinutes).toBe(DEFAULT_SITE_SELECTION_PREFERENCES.driveMinutes);
        expect(next.demandAnchors).toEqual(DEFAULT_SITE_SELECTION_PREFERENCES.demandAnchors);
    });

    it('merges scoringWeights field-by-field (partial patch)', () => {
        const slice = new SiteSelectionState();
        const next = slice.update({ scoringWeights: { competition: 0.5 } });
        expect(next.scoringWeights.competition).toBe(0.5);
        expect(next.scoringWeights.reach).toBe(DEFAULT_SITE_SELECTION_PREFERENCES.scoringWeights.reach);
    });

    it('reset() restores the shipped defaults and drops aliasing', () => {
        const slice = new SiteSelectionState();
        slice.update({ walkReachMeters: 1200, demandAnchors: ['gym'] });
        slice.reset();
        expect(slice.preferences).toEqual(DEFAULT_SITE_SELECTION_PREFERENCES);
        // mutating the returned defaults must not bleed back into the slice
        slice.preferences.demandAnchors.push('leak');
        expect(new SiteSelectionState().preferences.demandAnchors).not.toContain('leak');
    });
});

describe('resolveCatchment', () => {
    it('falls back to the session preferences when the request omits them', () => {
        const resolved = resolveCatchment(stateWith(new SiteSelectionState()), {});
        expect(resolved).toEqual({ walking: true, walkReachMeters: 800, driveMinutes: 10 });
    });

    it("honours the request's explicit values over the preferences", () => {
        const resolved = resolveCatchment(stateWith(new SiteSelectionState()), {
            travelMode: 'driving',
            walkReachMeters: 500,
        });
        expect(resolved.walking).toBe(false);
        expect(resolved.walkReachMeters).toBe(500);
        expect(resolved.driveMinutes).toBe(10); // still inherited
    });

    it('uses the standing travelMode preference when the request omits it', () => {
        const slice = new SiteSelectionState({ travelMode: 'drive' });
        expect(resolveCatchment(stateWith(slice), {}).walking).toBe(false);
    });
});

describe('getSitePreferences', () => {
    it('returns the live slice preferences', () => {
        const slice = new SiteSelectionState({ walkReachMeters: 999 });
        expect(getSitePreferences(stateWith(slice)).walkReachMeters).toBe(999);
    });
});
