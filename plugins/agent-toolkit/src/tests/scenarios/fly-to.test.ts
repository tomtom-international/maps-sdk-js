import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

describe.skipIf(!MODEL)('flyTo scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL. "Go to <named place>" legitimately routes to locatePlace (which also flies there)
    // as well as flyTo — both are correct navigation, so accept either.
    const [canonical, ...rest] = getExamplePrompts('flyTo');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'flyTo',
            prompt: canonical,
            acceptedAlternatives: ['locatePlace'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'flyTo', prompt, acceptedAlternatives: ['locatePlace'] });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
