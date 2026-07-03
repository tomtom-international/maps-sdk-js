import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// clarifyIntent fires when a request is missing the concrete inputs it needs and they can't be safely
// defaulted — the agent must ask rather than guess. "Plan a route for me" (no origin/destination) is the
// canonical trigger: there is nothing to route until the agent knows from/to, so it clarifies. The rest
// of the registry examplePrompts fan out under SCENARIOS_FULL.
describe.skipIf(!MODEL)('clarifyIntent scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('clarifyIntent');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'clarifyIntent', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'clarifyIntent', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
