import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('recallState');

describe.skipIf(!MODEL)('recallState scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('recalls what is stored in the current session', async () => {
        const result = await run({
            name: 'Recall session state',
            description: 'User asks the agent to summarise the session so far.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('What data do you have so far in this session? Give me an overview.'),
                agent(),
                expectToolCalled('recallState'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `recallState — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('recallState')],
        });
        expect(result.success).toBe(true);
    });
});
