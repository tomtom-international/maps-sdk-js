import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('setRoute');

describe.skipIf(!MODEL)('setRoute scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('calculates a route from origin to destination', async () => {
        const result = await run({
            name: 'Calculate route',
            description: 'User asks for directions between two places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Give me directions from Amsterdam to Rotterdam and show the route on the map'),
                agent(),
                expectToolCalled('setRoute'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `setRoute — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('setRoute')],
        });
        expect(result.success).toBe(true);
    });
});
