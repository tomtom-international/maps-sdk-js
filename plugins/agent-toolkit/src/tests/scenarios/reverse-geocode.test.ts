import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

describe.skipIf(!MODEL)('reverseGeocode scenarios', { timeout: 180_000, retry: 3 }, () => {
    // Canonical = the first registry examplePrompt (single source of truth); the rest fan out under
    // SCENARIOS_FULL.
    const [canonical, ...rest] = getExamplePrompts('reverseGeocode');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'reverseGeocode', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'reverseGeocode', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
