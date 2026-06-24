import { agent, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import {
    agentAdapter,
    expectToolCalledInOrder,
    FULL_SCENARIOS,
    getExamplePrompts,
    MODEL,
    runScenario,
    runToolScenario,
} from './helpers';
import { loadedByodSeed } from './seed';

describe.skipIf(!MODEL)('setByodLayers scenarios', { timeout: 180_000, retry: 3 }, () => {
    // The full observe → restyle loop. The prompt deliberately names NO property, so the agent must
    // (1) call addByodSource, (2) read the returned `profile` to discover what the data
    // contains, then (3) call setByodLayers in a LATER step. expectToolCalledInOrder enforces that
    // the two calls land in separate assistant steps — proof the restyle was profile-informed, not
    // a parallel guess.
    it('loads a BYOD source then restyles it from the learned profile (sequential)', async () => {
        const outcome = await runScenario({
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
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Always-restyle: the user only asks to LOAD the data — no styling instruction at all. Under the
    // current contract, deciding the layers from the detected schema is the agent's job on EVERY BYOD
    // ingest, so it must follow addByodSource with a setByodLayers call (informed by the returned
    // `profile`, which carries categorical `region` + numeric `revenue`) rather than leaving the
    // neutral default layers in place.
    it('always restyles from the detected schema after a bare ingest', async () => {
        const outcome = await runScenario({
            name: 'BYOD always-restyle after ingest',
            description: 'User imports data without asking for any styling; the agent still picks schema-fit layers.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Import the dataset at https://example.com/territories.geojson onto the map'),
                agent(),
                expectToolCalledInOrder('addByodSource', 'setByodLayers'),
            ],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Standalone restyle of a layer already in state. The prior turn (loadedByodSeed) stages a
    // "Sales territories" BYOD entry carrying `region` / `revenue`, so "shade it by revenue" has a
    // real entry to target. Without that staging — there is no recallByod tool any more to discover
    // it — a cold session would (correctly) stop to ask what to load instead of restyling.
    it('restyles an existing BYOD layer by a numeric property', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'setByodLayers',
            prompt: 'Shade my sales territories layer by its revenue',
            priorTurns: loadedByodSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // The three scenarios above are this file's canonical (always-on) layer; the registry
    // examplePrompts fan out under SCENARIOS_FULL, in line with the other per-tool files.
    it.skipIf(!FULL_SCENARIOS).each(getExamplePrompts('setByodLayers'))(
        'handles registry examplePrompt: %s',
        async (prompt) => {
            const outcome = await runToolScenario({ expectedTool: 'setByodLayers', prompt });
            expect(outcome.success, outcome.failureReason).toBe(true);
        },
    );
});
