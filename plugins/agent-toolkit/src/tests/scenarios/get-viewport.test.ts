import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('getViewport');

describe.skipIf(!MODEL)('getViewport scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('reads the current map viewport', async () => {
        const result = await run({
            name: 'Read viewport',
            description: 'User asks what the map is currently showing.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('What are the current map bounds?'), agent(), expectToolCalled('getViewport')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `getViewport — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('getViewport')],
        });
        expect(result.success).toBe(true);
    });
});
