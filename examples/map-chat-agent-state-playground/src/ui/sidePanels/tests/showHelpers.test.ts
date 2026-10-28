import type { BYODDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it, vi } from 'vitest';
import { showByodDataset } from '../showHelpers';
import type { Agent } from '../useAgentSnapshot';

describe('showByodDataset', () => {
    it('leaves the camera alone for a dataset with no layers to draw', async () => {
        const fitBounds = vi.fn();
        const agent = {
            state: { byod: { showDataset: vi.fn() }, baseMap: { mapLibreMap: { fitBounds } } },
        } as unknown as Agent;
        const dataset = {
            id: 'byod-0',
            layers: [],
            data: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.37] }, properties: {} }],
            },
        } as unknown as BYODDataset;

        await showByodDataset(agent, dataset);

        expect(fitBounds).not.toHaveBeenCalled();
    });
});
