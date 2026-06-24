import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';
// recallState only makes sense over a populated session: run cold, "what do you have?" is correctly
// answered with "nothing loaded yet" and NO tool call. Replay a loaded session (shared with
// analyse/process) so an inventory request has real entries to enumerate.
import { loadedSessionSeed } from './seed';

describe.skipIf(!MODEL)('recallState scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('recallState');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'recallState',
            prompt: canonical,
            priorTurns: loadedSessionSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'recallState', prompt, priorTurns: loadedSessionSeed });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
