import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('locatePlace');

describe.skipIf(!MODEL)('locatePlace scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('locates a place when asked to show it', async () => {
        const result = await run({
            name: 'Locate place',
            description: 'User asks the agent to show a place.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Show me the Eiffel Tower'), agent(), expectToolCalled('locatePlace')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `locatePlace — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('locatePlace')],
        });
        expect(result.success).toBe(true);
    });
});
