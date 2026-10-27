import type { ToolEntry, ToolState } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it } from 'vitest';
import { scoreFactors } from '../../agent/scoring';
import { SiteSelectionState } from '../../agent/site-selection-state';
import { updateSitePreferences } from '../../tools/update-preferences';

describe('updateSitePreferences', () => {
    it('returns weights for the scored factors only', async () => {
        const tool = updateSitePreferences({}) as ToolEntry;
        const state = { siteSelection: new SiteSelectionState() } as unknown as ToolState;

        const result = await tool.execute({ scoringWeights: { competition: 50 } }, state, {} as never);

        expect(Object.keys(result.preferences.scoringWeights).sort()).toEqual([...scoreFactors()].sort());
        expect(result.preferences.scoringWeights.competition).toBe(50);
    });
});
