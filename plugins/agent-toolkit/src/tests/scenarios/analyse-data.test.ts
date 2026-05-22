import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('analyseData');

describe.skipIf(!MODEL)('analyseData scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('runs a dynamic analysis over stored places', async () => {
        const result = await run({
            name: 'Analyse places',
            description: 'User asks for a count or breakdown across already-loaded places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Bar chart of the POI category breakdown for the restaurants I loaded earlier'),
                agent(),
                expectToolCalled('analyseData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('compares travel times across route alternatives', async () => {
        const result = await run({
            name: 'Compare route alternatives',
            description: 'User asks for a chart comparing alternatives on the route they already calculated.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Bar chart comparing the travel times of my route alternatives'),
                agent(),
                expectToolCalled('analyseData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('breaks down loaded incidents by category', async () => {
        const result = await run({
            name: 'Incidents by category',
            description: 'User asks for a category breakdown of incidents already loaded in the session.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Give me a breakdown of the loaded traffic incidents grouped by category'),
                agent(),
                expectToolCalled('analyseData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('registers a recurring monitor spec on incidents', async () => {
        const result = await run({
            name: 'Monitor incidents trend',
            description:
                'User asks the agent to keep watching incidents and report whether the count is growing or fading.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Keep counting the loaded traffic incidents and tell me when the count is growing or fading'),
                agent(),
                expectToolCalled('analyseData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `analyseData — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('analyseData')],
        });
        expect(result.success).toBe(true);
    });
});
