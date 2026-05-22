import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('reverseGeocode');

describe.skipIf(!MODEL)('reverseGeocode scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('resolves an address for a given coordinate', async () => {
        const result = await run({
            name: 'Reverse geocode coordinates',
            description: 'User gives explicit coordinates and asks which city they fall in.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Which city is [4.9, 52.4] in?'), agent(), expectToolCalled('reverseGeocode')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `reverseGeocode — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('reverseGeocode')],
        });
        expect(result.success).toBe(true);
    });
});
