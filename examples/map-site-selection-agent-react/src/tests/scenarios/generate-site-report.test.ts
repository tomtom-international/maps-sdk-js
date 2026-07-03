import { FULL_SCENARIOS, MODEL } from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { getExamplePrompts, runToolScenario } from './helpers';
import { analysesRunSeed } from './seed';

// generateSiteReport compiles a report from analyses ALREADY run this session — it reads them from
// session state, not from the message. So every scenario stages a prior turn (a profile + a ranking)
// via `analysesRunSeed`; without it the agent would correctly run analyses or ask for scope first.
describe.skipIf(!MODEL)('generateSiteReport scenarios', { timeout: 180_000, retry: 3 }, () => {
    const [canonical, ...rest] = getExamplePrompts('generateSiteReport');
    it(`classifies the canonical prompt: ${canonical}`, async () => {
        const outcome = await runToolScenario({
            expectedTool: 'generateSiteReport',
            prompt: canonical,
            priorTurns: analysesRunSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
    it.skipIf(!FULL_SCENARIOS).each(rest)('handles registry examplePrompt: %s', async (prompt) => {
        const outcome = await runToolScenario({
            expectedTool: 'generateSiteReport',
            prompt,
            priorTurns: analysesRunSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
