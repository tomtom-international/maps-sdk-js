import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// Human-in-the-loop: a cannibalization prompt with concrete sites routes to compareCatchments, but an
// under-specified one ("a proposed site vs my two existing locations" — no addresses) correctly asks
// for them via clarifyIntent. A correct turn is compareCatchments OR clarifyIntent; mis-routing to a
// sibling analysis tool must not happen.
const SIBLING_ANALYSIS_TOOLS = ['profileSite', 'rankSites', 'findWhitespace'];

describe.skipIf(!MODEL)('compareCatchments scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('compareCatchments');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'compareCatchments',
            prompt: canonical,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'compareCatchments',
            prompt,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
