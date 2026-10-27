import type { BYODEntry } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it, vi } from 'vitest';
import { showByodEntry } from '../showHelpers';
import type { Agent } from '../useAgentSnapshot';

describe('showByodEntry', () => {
    it('leaves the camera alone for an entry with no layers to draw', async () => {
        const fitBounds = vi.fn();
        const agent = {
            state: { byod: { showEntry: vi.fn() }, baseMap: { mapLibreMap: { fitBounds } } },
        } as unknown as Agent;
        const entry = {
            id: 'byod-0',
            layers: [],
            data: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.37] }, properties: {} }],
            },
        } as unknown as BYODEntry;

        await showByodEntry(agent, entry);

        expect(fitBounds).not.toHaveBeenCalled();
    });
});
