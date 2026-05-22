import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('discoverPlaces');

describe.skipIf(!MODEL)('discoverPlaces scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('discovers nearby points of interest', async () => {
        const result = await run({
            name: 'Discover nearby',
            description: 'User asks to find a category of nearby places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Find Italian restaurants near me'), agent(), expectToolCalled('discoverPlaces')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `discoverPlaces — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('discoverPlaces')],
        });
        expect(result.success).toBe(true);
    });
});
