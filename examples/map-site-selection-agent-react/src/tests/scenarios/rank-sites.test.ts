import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// Human-in-the-loop: an under-specified ranking prompt (missing concept / weights / real addresses) is
// answered with clarifyIntent before running — see SITE_TOOLS_GUIDANCE. A correct turn is rankSites OR
// clarifyIntent; mis-routing to a sibling analysis tool must not happen.
const SIBLING_ANALYSIS_TOOLS = ['profileSite', 'findWhitespace', 'compareCatchments'];

// Hand-picked, hand-stabilised canonical: real addresses + an unambiguous concept route cleanly to
// rankSites. The registry's first prompt uses placeholder "…" addresses, which correctly makes the
// agent ask for the real ones first — fine as a fan-out case, too flaky as the always-on canonical.
const CANONICAL_PROMPT = 'Rank these candidate sites for a bakery: Damrak 70, Marnixstraat 250, and Keizersgracht 200';

describe.skipIf(!MODEL)('rankSites scenarios', { timeout: 180_000, retry: 3 }, () => {
    it(`classifies the canonical prompt: ${CANONICAL_PROMPT}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'rankSites',
            prompt: CANONICAL_PROMPT,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(getExamplePrompts('rankSites'))(
        'handles registry examplePrompt: %s',
        async (prompt) => {
            const outcome = await runToolScenario({
                expectedTool: 'rankSites',
                prompt,
                acceptedAlternatives: ['clarifyIntent'],
                forbiddenTools: SIBLING_ANALYSIS_TOOLS,
            });
            expect(outcome.success, outcome.failureReason).toBe(true);
        },
    );
});
