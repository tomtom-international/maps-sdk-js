import type { BYODDataset, RangesDataset } from '@tomtom-org/maps-sdk-plugin-agent-toolkit';
import { describe, expect, it, vi } from 'vitest';
import { showByodDataset, showRangeDataset } from '../showHelpers';
import type { Agent } from '../useAgentSnapshot';

describe('showByodDataset', () => {
    it('leaves the camera alone for a dataset with no layers to draw', async () => {
        const fitBounds = vi.fn();
        const showDataset = vi.fn();
        const agent = {
            state: {
                byod: { showDataset, getDatasetLayers: () => [] },
                baseMap: { mapLibreMap: { fitBounds } },
            },
        } as unknown as Agent;
        const dataset = {
            id: 'byod-0',
            data: {
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.37] }, properties: {} }],
            },
        } as unknown as BYODDataset;

        await showByodDataset(agent, dataset);

        expect(showDataset).not.toHaveBeenCalled();
        expect(fitBounds).not.toHaveBeenCalled();
    });
});

describe('showRangeDataset', () => {
    const square = (west: number, south: number) => ({
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [west, south],
                    [west + 1, south],
                    [west + 1, south + 1],
                    [west, south + 1],
                    [west, south],
                ],
            ],
        },
        properties: {},
    });
    const agentWith = () => {
        const fitBounds = vi.fn();
        const showDataset = vi.fn();
        const agent = {
            state: { ranges: { showDataset }, baseMap: { mapLibreMap: { fitBounds } } },
        } as unknown as Agent;
        return { agent, fitBounds, showDataset };
    };

    it('draws the dataset as outlines and frames every polygon it holds', async () => {
        const { agent, fitBounds, showDataset } = agentWith();
        const dataset = {
            id: 'ranges-0',
            data: { type: 'FeatureCollection', features: [square(4, 52), square(6, 50)] },
        } as unknown as RangesDataset;

        await showRangeDataset(agent, dataset);

        expect(showDataset).toHaveBeenCalledWith('ranges-0', { fillStyle: 'outline' });
        expect(fitBounds).toHaveBeenCalledWith([4, 50, 7, 53], { padding: 50 });
    });

    it('does nothing for a dataset with no polygons', async () => {
        const { agent, fitBounds, showDataset } = agentWith();
        const dataset = {
            id: 'ranges-0',
            data: { type: 'FeatureCollection', features: [] },
        } as unknown as RangesDataset;

        await showRangeDataset(agent, dataset);

        expect(showDataset).not.toHaveBeenCalled();
        expect(fitBounds).not.toHaveBeenCalled();
    });
});
