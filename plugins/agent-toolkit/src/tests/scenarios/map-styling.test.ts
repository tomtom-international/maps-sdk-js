import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

// Semantic base-map styling. `setMapStyling` overlaps by design with the lower-level
// getMapStyleLayers → setPaintProperties / setLayoutProperties path (an agent can make labels bigger
// either way). Those routes are accepted; a whole-style switch (setMapStandardStyle) is not.

describe.skipIf(!MODEL)('setMapStyling scenarios', { timeout: 180_000, retry: 3 }, () => {
    const acceptedAlternatives = ['setPaintProperties', 'setLayoutProperties'] as const;
    const [canonical, ...rest] = getExamplePrompts('setMapStyling');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'setMapStyling',
            prompt: canonical,
            acceptedAlternatives,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'setMapStyling', prompt, acceptedAlternatives });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});

describe.skipIf(!MODEL)('describeMapStyling scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('describeMapStyling');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'describeMapStyling', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'describeMapStyling', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
