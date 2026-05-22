import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, FULL_SCENARIOS, getExamplePrompts, MODEL } from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('processData');

describe.skipIf(!MODEL)('processData scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('derives a new polygon from existing places via processData', async () => {
        const result = await run({
            name: 'Process geometries',
            description: 'User asks for a derived polygon (union/buffer/etc.) over existing entries.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Compute a 300m-buffer union around the chinese restaurants I loaded earlier'),
                agent(),
                expectToolCalled('processData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('filters loaded places by a substring match', async () => {
        const result = await run({
            name: 'Filter places subset',
            description: 'User asks to keep only a substring-matching subset of the places they already loaded.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('From the restaurants I already loaded, keep only the vegan ones on the map'),
                agent(),
                expectToolCalled('processData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('filters loaded places to those near a loaded route (corridor)', async () => {
        const result = await run({
            name: 'Corridor filter',
            description: 'User asks to render only the EV stations within a corridor of their loaded route.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Show on the map only the EV stations I loaded that are within 500 metres of my current route'),
                agent(),
                expectToolCalled('processData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('outlines a high-congestion hot zone as a derived polygon', async () => {
        const result = await run({
            name: 'Congestion hot zone',
            description: 'User asks to draw a polygon outlining the high-congestion tiles in the loaded analytics.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Outline the congestion hot zone from my loaded traffic analytics as a polygon'),
                agent(),
                expectToolCalled('processData'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `processData — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('processData')],
        });
        expect(result.success).toBe(true);
    });
});
