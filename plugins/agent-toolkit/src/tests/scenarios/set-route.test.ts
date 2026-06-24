import { describe, expect, it } from 'vitest';
import { FULL_SCENARIOS, getExamplePrompts, MODEL, runToolScenario } from './helpers';

describe.skipIf(!MODEL)('setRoute scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('setRoute');
    // Prompts that reference an existing trip ("…for my current trip") can resolve via recallRoutes
    // + updateRoutesDisplay rather than a fresh setRoute — accept those routes.
    const acceptedAlternatives = ['recallState', 'updateRoutesDisplay'] as const;
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'setRoute', prompt: canonical, acceptedAlternatives });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'setRoute', prompt, acceptedAlternatives });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
