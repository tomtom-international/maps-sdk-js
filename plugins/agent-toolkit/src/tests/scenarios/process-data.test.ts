import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
// processData's prompts reference mid-session state ("the vegan restaurants", "these places", "the
// route", "the city boundaries I loaded", "my loaded analytics"). Run cold, the agent reasonably
// asks what to operate on instead of processing — so stage a rich loaded session (replayed as real
// tool results, shared with analyse-data) so the prompts resolve against real entries.
import { loadedSessionSeed } from './seed';

describe.skipIf(!MODEL)('processData scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('processData');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'processData',
            prompt: canonical,
            priorTurns: loadedSessionSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'processData', prompt, priorTurns: loadedSessionSeed });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
