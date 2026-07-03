import { createMapAgent } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import type { LanguageModel } from 'ai';
import { describe, expect, it } from 'vitest';
import { buildSiteAgentOptions } from '../../agent/site-agent';
import type { SiteToolState } from '../../agent/site-selection-state';
import { mockMap } from './site-agent-adapter';

// Pure wiring smoke test (no LLM): building the real agent must resolve every tool entry — including the
// builder-based escape hatches (processData/analyseData/recallState) — register the custom siteSelection
// state slice, and tear down cleanly. Guards the step 2-4 re-architecture.
const fakeModel = { modelId: 'wiring-test', provider: 'test' } as unknown as LanguageModel;

describe('site agent wiring', () => {
    it('builds with the custom state slice and resolves all tools', () => {
        const agent = createMapAgent<SiteToolState>(mockMap, buildSiteAgentOptions(fakeModel));
        try {
            // Custom slice is registered and seeded with the shipped defaults.
            expect(agent.state.siteSelection).toBeDefined();
            expect(agent.state.siteSelection.preferences.walkReachMeters).toBe(800);

            // The slice is live and mutable (updateSitePreferences path).
            agent.state.siteSelection.update({ walkReachMeters: 1200, scoringWeights: { competition: 0.5 } });
            expect(agent.state.siteSelection.preferences.walkReachMeters).toBe(1200);
            expect(agent.state.siteSelection.preferences.scoringWeights.competition).toBe(0.5);
            expect(agent.state.siteSelection.preferences.scoringWeights.reach).toBe(0.3); // untouched

            // BYOD slice is present for the *ByodEntryId analysis inputs.
            expect(agent.state.byod).toBeDefined();
        } finally {
            agent.destroy();
        }
        // destroy() resets the custom slice back to defaults (StateSlice.reset duck-typed by the toolkit).
        expect(agent.state.siteSelection.preferences.walkReachMeters).toBe(800);
    });
});
