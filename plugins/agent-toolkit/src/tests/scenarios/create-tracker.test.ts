import { agent, user, userSimulatorAgent } from '@langwatch/scenario';
import {
    expectAnyToolCalled,
    expectToolCalledInOrder,
    FULL_SCENARIOS,
    MODEL,
    priorTurn,
    runScenario,
} from '@testing/agent-tool-calling';
import { describe, expect, it } from 'vitest';
import { agentAdapter, getExamplePrompts, runToolScenario } from './helpers';
import { toolCall } from './seed';

// Regression for the "tracker armed before its data is loaded" failure: on a fresh area the classifier
// used to pick createTracker WITHOUT getTrafficIncidents, leaving the agent hard-restricted — it then
// invented an entry id ("incidents-0") and every createTracker call errored "Call getTrafficIncidents
// first". createTracker's `dependsOn: [getTrafficIncidents, locatePlace, …]` only reaches the classifier
// as a `Depends on:` hint; the fix adds the PREREQUISITES directive telling the classifier to co-pick
// those prerequisites unless they're already loaded. These scenarios pin both branches.

// A prior turn that already loaded the Amsterdam incidents (entry incidents-0) — used to prove a
// tracker still routes on a warm session, AND that the prerequisite need not be reloaded.
// (Area is Amsterdam, matching the Netherlands-based locatePlace mock — a non-NL name like
// "City of London" makes attentive models reject the mock's NL result and abort, flaking the run.)
const loadedIncidentsSeed = () =>
    priorTurn(
        'Load the traffic incidents in Amsterdam',
        [
            toolCall(
                'getTrafficIncidents',
                { where: { near: 'Amsterdam' } },
                {
                    count: 12,
                    entryId: 'incidents-0',
                    entries: [{ id: 'incidents-0', label: 'Amsterdam incidents', count: 12, timestamp: 0 }],
                },
            ),
        ],
        'Loaded the Amsterdam traffic incidents.',
    );

describe.skipIf(!MODEL)('createTracker scenarios', { timeout: 180_000, retry: 3 }, () => {
    // THE REGRESSION. Cold turn, nothing loaded yet. Arming a tracker on a fresh area must FIRST load
    // the incidents (getTrafficIncidents) and only THEN arm the tracker — proven by separate ordered
    // steps. Before the prerequisites directive the classifier withheld getTrafficIncidents and this
    // failed: createTracker was the only data-reading tool active, so it ran against a non-existent id.
    it('loads incidents before arming a tracker on a fresh area (sequential)', async () => {
        const outcome = await runScenario({
            name: 'createTracker cold-area: load then arm',
            description: 'User asks to watch a fresh area for major incidents; nothing is loaded yet.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Watch Amsterdam and alert me if a major incident appears'),
                agent(),
                expectToolCalledInOrder('getTrafficIncidents', 'createTracker'),
            ],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // The "already satisfied" branch of the directive: with incidents-0 loaded on an earlier turn, a
    // follow-up alert request routes straight to createTracker (the prerequisite is already in state).
    it('arms a tracker on already-loaded incidents', async () => {
        const outcome = await runToolScenario({
            expectedTool: 'createTracker',
            prompt: 'Now alert me whenever a major incident appears in there',
            priorTurns: loadedIncidentsSeed,
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Cross-kind shape: an incident-near-a-place rule spans two entry kinds, so the agent must load
    // BOTH the place (locatePlace) and the incidents (getTrafficIncidents) before arming the tracker.
    it('loads both the place and the incidents for a cross-kind proximity tracker', async () => {
        const outcome = await runScenario({
            name: 'createTracker cross-kind: hospital proximity',
            description: 'User wants an alert when an incident appears near a hospital; nothing loaded yet.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Alert me when an incident appears within 100m of a hospital in Amsterdam'),
                agent(),
                expectAnyToolCalled('getTrafficIncidents'),
                expectAnyToolCalled('createTracker'),
            ],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });

    // Broad coverage under SCENARIOS_FULL: every registry examplePrompt should route to createTracker.
    it.skipIf(!FULL_SCENARIOS).each(getExamplePrompts('createTracker'))(
        'handles registry examplePrompt: %s',
        async (prompt) => {
            const outcome = await runToolScenario({ expectedTool: 'createTracker', prompt });
            expect(outcome.success, outcome.failureReason).toBe(true);
        },
    );
});
