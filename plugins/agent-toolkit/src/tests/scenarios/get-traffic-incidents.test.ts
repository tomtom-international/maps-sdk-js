import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('getTrafficIncidents');

describe.skipIf(!MODEL)('getTrafficIncidents scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('shows traffic incidents in an area', async () => {
        const result = await run({
            name: 'Traffic incidents',
            description: 'User asks about live traffic incidents.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Are there any traffic incidents in Amsterdam?'),
                agent(),
                expectToolCalled('getTrafficIncidents'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `getTrafficIncidents — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('getTrafficIncidents')],
        });
        expect(result.success).toBe(true);
    });
});
