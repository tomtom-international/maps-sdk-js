import { describe, expect, it } from 'vitest';
import { rankedSiteColor } from '../../viz/score-colors';

describe('rankedSiteColor', () => {
    it('mutes an excluded site with a hex colour, since map paint reads no CSS variables', () => {
        const color = rankedSiteColor({ score: 80, excluded: { reason: 'Catchment unavailable' } });

        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(color).not.toBe(rankedSiteColor({ score: 80 }));
    });
});
