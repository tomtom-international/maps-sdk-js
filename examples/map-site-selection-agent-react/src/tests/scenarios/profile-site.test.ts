import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// The analysis tools are human-in-the-loop: when a concept is ambiguous (in NL "coffee shop" = café vs
// cannabis coffeeshop) or a definitional input is missing, the agent is DESIGNED to ask via clarifyIntent
// BEFORE running (see SITE_TOOLS_GUIDANCE in ../../agent/site-agent). So a correct turn for a profiling
// prompt is profileSite OR clarifyIntent — what must NOT happen is mis-routing to a sibling analysis
// tool. `forbiddenTools` keeps the assertion meaningful despite the accepted alternative.
const SIBLING_ANALYSIS_TOOLS = ['rankSites', 'findWhitespace', 'compareCatchments'];

// Hand-picked, hand-stabilised canonical: a single address + an UNAMBIGUOUS concept profiles cleanly.
// The registry's first prompt uses "coffee shop", which the agent sometimes pauses to disambiguate
// (café vs cannabis) — fine as a fan-out case (clarifyIntent is accepted there), too flaky as the
// always-on canonical.
const CANONICAL_PROMPT = 'Profile Nieuwendijk 100 Amsterdam for a bakery';

describe.skipIf(!MODEL)('profileSite scenarios', { timeout: 180_000, retry: 3 }, () => {
    it(`classifies the canonical prompt: ${CANONICAL_PROMPT}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'profileSite',
            prompt: CANONICAL_PROMPT,
            acceptedAlternatives: ['clarifyIntent'],
            forbiddenTools: SIBLING_ANALYSIS_TOOLS,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(getExamplePrompts('profileSite'))(
        'handles registry examplePrompt: %s',
        async (prompt) => {
            const outcome = await runToolScenario({
                expectedTool: 'profileSite',
                prompt,
                acceptedAlternatives: ['clarifyIntent'],
                forbiddenTools: SIBLING_ANALYSIS_TOOLS,
            });
            expect(outcome.success, outcome.failureReason).toBe(true);
        },
    );
});
