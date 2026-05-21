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
                expectToolCalled('getTrafficIncidents', 'toggleTilesTrafficIncidents'),
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

    it('aggregates historical traffic for an area', async () => {
        const result = await run({
            name: 'Historical traffic analytics',
            description: 'User asks for last-week traffic patterns.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Show me traffic patterns in Amsterdam last week'),
                agent(),
                expectToolCalled('getTrafficAreaAnalytics'),
            ],
        });
        expect(result.success).toBe(true);
    });

    it('runs a dynamic analysis over stored places', async () => {
        const result = await run({
            name: 'Analyse places',
            description: 'User asks for a count or breakdown across already-loaded places.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('I already loaded restaurants in Amsterdam — how are they distributed by category?'),
                agent(),
                expectToolCalled('analyseData'),
            ],
        });
        expect(result.success).toBe(true);
    });

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

    it('ingests a customer GeoJSON URL as a BYOD layer', async () => {
        const result = await run({
            name: 'BYOD ingest',
            description: 'User asks the agent to load their own GeoJSON data onto the map.',
            agents: [agentAdapter(), userSimulatorAgent()],
            script: [
                user('Load my sales-territories layer from https://example.com/territories.geojson'),
                agent(),
                expectToolCalled('addByodLayer'),
            ],
        });
        expect(result.success).toBe(true);
    });
});
