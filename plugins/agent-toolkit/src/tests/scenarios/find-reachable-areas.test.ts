import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('findReachableAreas');

describe.skipIf(!MODEL)('findReachableAreas scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('computes a time-budget isochrone from a named origin', async () => {
        const result = await run({
            name: 'Reachable range',
            description: 'User asks for the 30-min reachable area from a city.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Show me where I can reach in 30 minutes from Amsterdam'),
                agent(),
                expectToolCalled('findReachableAreas'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `findReachableAreas — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('findReachableAreas')],
        });
        expect(result.success).toBe(true);
    });
});
