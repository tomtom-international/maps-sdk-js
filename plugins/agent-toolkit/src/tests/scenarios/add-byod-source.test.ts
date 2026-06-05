import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('addByodSource');

describe.skipIf(!MODEL)('addByodSource scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('ingests a customer GeoJSON URL as a BYOD layer', async () => {
        const result = await run({
            name: 'BYOD ingest',
            description: 'User asks the agent to load their own GeoJSON data onto the map.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Load my sales-territories layer from https://example.com/territories.geojson'),
                agent(),
                expectToolCalled('addByodSource'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `addByodSource — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('addByodSource')],
        });
        expect(result.success).toBe(true);
    });
});
