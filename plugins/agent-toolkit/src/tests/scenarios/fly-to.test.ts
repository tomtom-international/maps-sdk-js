import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('flyTo');

describe.skipIf(!MODEL)('flyTo scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('centers the map on a named city', async () => {
        const result = await run({
            name: 'Fly-to camera move',
            description: 'User asks the camera to recenter on a specific city.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Center the map on Rome'), agent(), expectToolCalled('flyTo')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `flyTo — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('flyTo')],
        });
        expect(result.success).toBe(true);
    });
});
