import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('zoomInOrOut');

describe.skipIf(!MODEL)('zoomInOrOut scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('zooms the map by a delta', async () => {
        const result = await run({
            name: 'Zoom delta',
            description: 'User asks the camera to zoom out a couple of levels.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Zoom out 2 levels'), agent(), expectToolCalled('zoomInOrOut')],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `zoomInOrOut — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('zoomInOrOut')],
        });
        expect(result.success).toBe(true);
    });
});
