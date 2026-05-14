import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolNotCalled, MODEL } from './helpers';

describe.skipIf(!MODEL)('Guardrail scenarios', { timeout: 180_000, retry: 2 }, () => {
    it('does not call routing tools for a simple place lookup', async () => {
        const result = await run({
            name: 'No routing for simple lookup',
            description: 'Agent should not call route tools when the user is just asking where a place is.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Where is Amsterdam?'), agent(), expectToolNotCalled('setRoute', 'updateRoutesDisplay')],
        });
        expect(result.success).toBe(true);
    });
});
