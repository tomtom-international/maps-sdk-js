import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import { executeRecallIncidents } from '../recall-incidents';

const incident = (magnitudeOfDelay: string, delayInSeconds?: number): TrafficIncident =>
    ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { magnitudeOfDelay, delayInSeconds },
    }) as unknown as TrafficIncident;

const entry = {
    id: 'incidents-0',
    label: 'Amsterdam ring incidents',
    timestamp: 123,
    data: [incident('major', 600), incident('moderate', 120), incident('major'), incident('minor', 0)],
};

// Minimal incidents slice — the executor only reads these members.
const mockState = (overrides: Record<string, unknown> = {}): ToolState =>
    ({
        trafficIncidents: {
            entries: [entry],
            entryMode: 'multiple',
            shownEntryIds: new Set(['incidents-0']),
            isMonitored: (id: string) => id === 'incidents-0',
            getFocus: (id: string) => (id === 'incidents-0' ? { ids: new Set(['a', 'b']) } : null),
            getClusters: () => undefined,
            ...overrides,
        },
    }) as unknown as ToolState;

describe('executeRecallIncidents', () => {
    it('list view returns id/label/count plus render + monitor + focus flags', async () => {
        const result = await executeRecallIncidents({}, mockState());
        if (!('entries' in result)) throw new Error('expected a list result');
        expect(result.entries).toEqual([
            {
                id: 'incidents-0',
                label: 'Amsterdam ring incidents',
                timestamp: 123,
                count: 4,
                shown: true,
                monitored: true,
                focusedCount: 2,
            },
        ]);
        expect(result.entryMode).toBe('multiple');
    });

    it('detail view groups by magnitudeOfDelay and sums delay', async () => {
        const result = await executeRecallIncidents({ id: 'incidents-0' }, mockState());
        if (!('byMagnitude' in result)) throw new Error('expected a detail result');
        expect(result.byMagnitude).toEqual({ major: 2, moderate: 1, minor: 1 });
        expect(result.totalDelaySeconds).toBe(720);
        // No clusters computed → the field is omitted, not zero.
        expect('clusterCount' in result).toBe(false);
    });

    it('detail view surfaces clusterCount once clustering has run', async () => {
        const result = await executeRecallIncidents(
            { id: 'incidents-0' },
            mockState({ getClusters: () => ({ groups: [{}, {}, {}] }) }),
        );
        if (!('byMagnitude' in result)) throw new Error('expected a detail result');
        expect(result.clusterCount).toBe(3);
    });

    it('errors with a recall hint for an unknown id', async () => {
        const result = await executeRecallIncidents({ id: 'missing' }, mockState());
        expect(result).toEqual({
            error: expect.stringMatching(
                /No incidents entry with id "missing".*recallState\(\{ kind: "incidents" \}\)/,
            ),
        });
    });
});
