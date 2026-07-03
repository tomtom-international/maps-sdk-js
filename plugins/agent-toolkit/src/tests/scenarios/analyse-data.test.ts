import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
// analyseData's prompts all reference mid-session state ("these results", "my route alternatives",
// "the city areas I loaded", "the analytics tiles"). Run cold, the agent reasonably asks "which
// results?" instead of analysing — so stage a rich loaded session (replayed as real tool results,
// shared with process-data) so the prompts have something to operate on. Without this the canonical
// "…these results?" flakes.
import { loadedSessionSeed, routeOnlySeed } from './seed';

describe.skipIf(!MODEL)('analyseData scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('analyseData');
    // The agent often refreshes the loaded places via recallPlaces before counting/aggregating —
    // a valid first step toward the analysis — so accept it as an alternative.
    const acceptedAlternatives = ['recallState'] as const;
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'analyseData',
            prompt: canonical,
            acceptedAlternatives,
            priorTurns: loadedSessionSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'analyseData',
            prompt,
            acceptedAlternatives,
            priorTurns: loadedSessionSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // The route is implied from an EARLIER turn (only `routes-0` exists; no id in the new prompt). The
    // agent must target that entry to analyse it — either reuse the remembered id or recallRoutes to
    // re-find it first. Proves followup analysis resolves an implied entry id rather than stalling.
    it('analyses a route implied from history, resolving its entry id (recall allowed)', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'analyseData',
            prompt: 'Show the distribution of traffic incidents along that drive',
            acceptedAlternatives: ['recallState'],
            priorTurns: routeOnlySeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
