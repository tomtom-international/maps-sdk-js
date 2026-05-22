import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('setMapStandardStyle');

describe.skipIf(!MODEL)('setMapStandardStyle scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('switches the map to a different style', async () => {
        const result = await run({
            name: 'Change map style',
            description: 'User asks the map to switch to satellite view.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Switch the map to satellite view'), agent(), expectToolCalled('setMapStandardStyle')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `setMapStandardStyle — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('setMapStandardStyle')],
        });
        expect(result.success).toBe(true);
    });
});
