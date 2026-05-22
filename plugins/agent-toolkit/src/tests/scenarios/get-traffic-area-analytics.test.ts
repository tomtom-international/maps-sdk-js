import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('getTrafficAreaAnalytics');

describe.skipIf(!MODEL)('getTrafficAreaAnalytics scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('aggregates historical traffic for an area', async () => {
        const result = await run({
            name: 'Historical traffic analytics',
            description: 'User asks for last-week traffic patterns.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Show me traffic patterns in Amsterdam last week'),
                agent(),
                expectToolCalled('getTrafficAreaAnalytics'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `getTrafficAreaAnalytics — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('getTrafficAreaAnalytics')],
        });
        expect(result.success).toBe(true);
    });
});
