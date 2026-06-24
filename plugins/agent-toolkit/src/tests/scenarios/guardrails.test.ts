import { agent, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectNoneOfToolsCalled, MODEL, runScenario } from './helpers';

describe.skipIf(!MODEL)('Guardrail scenarios', { timeout: 180_000, retry: 3 }, () => {
    it('does not call routing tools for a simple place lookup', async () => {
        const outcome = await runScenario({
            name: 'No routing for simple lookup',
            description: 'Agent should not call route tools when the user is just asking where a place is.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Where is Amsterdam?'), agent(), expectNoneOfToolsCalled('setRoute', 'updateRoutesDisplay')],
        });
        expect(outcome.success, outcome.failureReason).toBe(true);
    });
});
