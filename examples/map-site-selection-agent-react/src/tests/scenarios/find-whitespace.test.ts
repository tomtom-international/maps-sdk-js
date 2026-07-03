import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// Human-in-the-loop: a whitespace scan's demand anchors are the biggest driver of the result, so when
// they're unstated the agent asks via clarifyIntent first — see SITE_TOOLS_GUIDANCE. A correct turn is
// findWhitespace OR clarifyIntent; mis-routing to a sibling analysis tool must not happen.
const SIBLING_ANALYSIS_TOOLS = ['profileSite', 'rankSites', 'compareCatchments'];

describe.skipIf(!MODEL)('findWhitespace scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('findWhitespace');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'findWhitespace',
            prompt: canonical,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Regression: a whitespace prompt that mentions a DRIVE TIME and a STORE TYPE must still route to
    // findWhitespace — not to a generic search/isochrone primitive, and the one-off "10-min drive" must
    // NOT be mistaken for a standing preference (updateSitePreferences). See CLASSIFIER_GATED_TOOLS notes.
    it('routes a drive-time + store-type whitespace prompt to findWhitespace, not a primitive or a preference write', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'findWhitespace',
            prompt: 'Where in Amsterdam Nieuw-West is there residential demand but no DIY/hardware store within a 10-min drive?',
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: [...SIBLING_ANALYSIS_TOOLS, 'updateSitePreferences'],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Regression: "housing density but no <category> within an N-min walk" is the same whitespace shape
    // (residential demand + avoid peers). The agent must offer findWhitespace, not give up on generic map
    // tools claiming no tool exists.
    it('routes a housing-density + no-supermarket whitespace prompt to findWhitespace', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'findWhitespace',
            prompt: 'Where in Amsterdam Noord has housing density but no supermarket within a 5-min walk?',
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'findWhitespace',
            prompt,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
