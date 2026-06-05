import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import {
    agentAdapter,
    expectToolCalled,
    expectToolCalledInOrder,
    FULL_SCENARIOS,
    getExamplePrompts,
    MODEL,
} from './helpers';

const REGISTRY_PROMPTS = getExamplePrompts('setByodLayers');

describe.skipIf(!MODEL)('setByodLayers scenarios', { timeout: 180_000, retry: 3 }, () => {
    // The full observe → restyle loop. The prompt deliberately names NO property, so the agent must
    // (1) call addByodSource, (2) read the returned `profile` to discover what the data
    // contains, then (3) call setByodLayers in a LATER step. expectToolCalledInOrder enforces that
    // the two calls land in separate assistant steps — proof the restyle was profile-informed, not
    // a parallel guess.
    it('loads a BYOD source then restyles it from the learned profile (sequential)', async () => {
        const result = await run({
            name: 'BYOD load → profile-informed restyle',
            description: 'User loads their own GeoJSON and asks for it to be styled to suit the data.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user(
                    'Load my sales-territories layer from https://example.com/territories.geojson and then style it ' +
                        'to best bring out whatever the data actually contains',
                ),
                agent(),
                expectToolCalledInOrder('addByodSource', 'setByodLayers'),
            ],
        });
        expect(result.success).toBe(true);
    });

    // Always-restyle: the user only asks to LOAD the data — no styling instruction at all. Under the
    // current contract, deciding the layers from the detected schema is the agent's job on EVERY BYOD
    // ingest, so it must follow addByodSource with a setByodLayers call (informed by the returned
    // `profile`, which carries categorical `region` + numeric `revenue`) rather than leaving the
    // neutral default layers in place.
    it('always restyles from the detected schema after a bare ingest', async () => {
        const result = await run({
            name: 'BYOD always-restyle after ingest',
            description: 'User imports data without asking for any styling; the agent still picks schema-fit layers.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Import the dataset at https://example.com/territories.geojson onto the map'),
                agent(),
                expectToolCalledInOrder('addByodSource', 'setByodLayers'),
            ],
        });
        expect(result.success).toBe(true);
    });

    // Standalone restyle of a layer already in state (discovered via recallByod, which the adapter
    // mocks to return a "Sales territories" entry carrying `region` / `revenue` properties).
    it('restyles an existing BYOD layer by a numeric property', async () => {
        const result = await run({
            name: 'BYOD restyle existing',
            description: 'User asks to shade an already-loaded BYOD layer by one of its values.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Shade my sales territories layer by its revenue'),
                agent(),
                expectToolCalled('setByodLayers'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it.skipIf(!FULL_SCENARIOS).each(REGISTRY_PROMPTS)('handles registry examplePrompt: %s', async (prompt) => {
        const result = await run({
            name: `setByodLayers — ${prompt}`,
            description: prompt,
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user(prompt), agent(), expectToolCalled('setByodLayers')],
        });
        expect(result.success).toBe(true);
    });
});
