import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';

describe.skipIf(!MODEL)('lookupCategories scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('lookupCategories');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({ expectedTool: 'lookupCategories', prompt: canonical });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({ expectedTool: 'lookupCategories', prompt });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
