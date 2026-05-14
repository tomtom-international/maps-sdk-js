import { agent, run, user, userSimulatorAgent } from '@langwatch/scenario';
import { describe, expect, it } from 'vitest';
import { agentAdapter, expectToolCalled, MODEL } from './helpers';

describe.skipIf(!MODEL)('Core agent scenarios', { timeout: 180_000, retry: 2 }, () => {
    it('locates a place when asked where it is', async () => {
        const result = await run({
            name: 'Locate place',
            description: 'User asks the agent where a named place is.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Where is the Eiffel Tower?'), agent(), expectToolCalled('locatePlace')],
        });
        expect(result.success).toBe(true);
    });

    it('discovers nearby points of interest', async () => {
        const result = await run({
            name: 'Discover nearby',
            description: 'User asks to find a category of nearby places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Find Italian restaurants near me'), agent(), expectToolCalled('discoverPlaces')],
        });
        expect(result.success).toBe(true);
    });

    it('calculates a route from origin to destination', async () => {
        const result = await run({
            name: 'Calculate route',
            description: 'User asks for directions between two places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Give me directions from Amsterdam to Rotterdam and show the route on the map'),
                agent(),
                expectToolCalled('setRoute', 'updateRoutesDisplay'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('shows traffic incidents in an area', async () => {
        const result = await run({
            name: 'Traffic incidents',
            description: 'User asks about live traffic incidents.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Are there any traffic incidents in Amsterdam?'),
                agent(),
                expectToolCalled('getTrafficIncidents', 'toggleTrafficIncidents'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('switches the map to a different style', async () => {
        const result = await run({
            name: 'Change map style',
            description: 'User asks the map to switch to satellite view.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [user('Switch the map to satellite view'), agent(), expectToolCalled('setMapStandardStyle')],
        });
        expect(result.success).toBe(true);
    });

    it('recalls what is stored in the current session', async () => {
        const result = await run({
            name: 'Recall session state',
            description: 'User asks the agent to summarise the session so far.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('What data do you have so far in this session? Give me an overview.'),
                agent(),
                expectToolCalled('recallState'),
            ],
        });
        expect(result.success).toBe(true);
    });
});
