import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// clarifyIntent fires when an analysis is requested but the concrete inputs it needs are missing and
// can't be safely defaulted — the agent must ask via the form rather than guess. A request to compare a
// proposed site against existing ones with NO addresses given is the most reliable trigger: the agent
// can't run anything until it knows which sites, so it asks. (A concrete, well-specified concept like
// "Profile X for a coffee shop" is instead profiled directly with defaults — the agent does not treat
// the coffee-shop ambiguity as blocking — so it is a poor clarifyIntent canonical.)
const CANONICAL_PROMPT = 'Compare the catchment of a proposed site with my two existing locations';

describe.skipIf(!MODEL)('clarifyIntent scenarios', { timeout: 180_000, retry: 3 }, () => {
    it(`classifies the canonical prompt: ${CANONICAL_PROMPT}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'clarifyIntent', prompt: CANONICAL_PROMPT });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(getExamplePrompts('clarifyIntent'))(
        'handles registry examplePrompt: %s',
        async (prompt) => {
            const outcome = await runToolScenario({ expectedTool: 'clarifyIntent', prompt });
            expect(outcome.success, outcome.failureReason).toBe(true);
        },
    );
});
