import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('setPitchBearing');

describe.skipIf(!MODEL)('setPitchBearing scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('tilts the map to a 3D perspective', async () => {
        const result = await run({
            name: 'Tilt map',
            description: 'User asks for a 3D / tilted view.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Tilt the map to 45 degrees'), agent(), expectToolCalled('setPitchBearing')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `setPitchBearing — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('setPitchBearing')],
        });
        expect(result.success).toBe(true);
    });
});
