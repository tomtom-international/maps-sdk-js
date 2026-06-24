import { describe, expect, it, vi } from 'vitest';
import { toolStateToWhereContext } from '../tool-state-where-context';

vi.mock('../locate-places', () => ({
    locatePlaces: vi.fn().mockResolvedValue([{ id: 'x' }]),
}));
vi.mock('../geocode-areas', () => ({
    geocodeAreas: vi.fn().mockResolvedValue([{ id: 'area' }]),
}));

describe('toolStateToWhereContext', () => {
    it('exposes the viewport bbox from baseMap (via mapLibreMap.getBounds)', () => {
        const bounds = { getWest: () => 0, getSouth: () => 0, getEast: () => 1, getNorth: () => 1 };
        const state = { baseMap: { mapLibreMap: { getBounds: () => bounds } } } as any;
        expect(toolStateToWhereContext(state).viewportBBox()).toEqual([0, 0, 1, 1]);
    });
    it('geocodeArea delegates to locatePlaces with limit 5', async () => {
        const { locatePlaces } = await import('../locate-places');
        const ctx = toolStateToWhereContext({ baseMap: {} } as any);
        await ctx.geocodeArea('London', 'place', [0, 0]);
        expect(locatePlaces).toHaveBeenCalledWith('London', 'place', { limit: 5, bias: { position: [0, 0] } });
    });
    it('geocodeAreas delegates to the area-restricted geocode with the centre bias', async () => {
        const { geocodeAreas } = await import('../geocode-areas');
        const ctx = toolStateToWhereContext({ baseMap: {} } as any);
        await ctx.geocodeAreas('De Pijp', [4.9, 52.37]);
        expect(geocodeAreas).toHaveBeenCalledWith('De Pijp', { bias: [4.9, 52.37] });
    });

    describe('getRoute returns a distinct, actionable error per failure mode', () => {
        const ctxWith = (entries: unknown[]) => toolStateToWhereContext({ routing: { entries } } as any);

        it('no routes at all → suggests calculating a route (not recallState on an empty list)', () => {
            const r = ctxWith([]).getRoute() as { error: string };
            expect(r.error).toContain('Calculate or select a route');
        });

        it('routeId not found → points at recallState', () => {
            const r = ctxWith([{ id: 'routes-0', data: { features: [{}] }, label: 'A' }]).getRoute('routes-9') as {
                error: string;
            };
            expect(r.error).toContain('not found');
            expect(r.error).toContain('recallState');
        });

        it('entry exists but has no geometry → says so', () => {
            const r = ctxWith([{ id: 'routes-0', data: { features: [] }, label: 'A' }]).getRoute() as { error: string };
            expect(r.error).toContain('no geometry');
        });

        it('valid entry → returns features + label', () => {
            const r = ctxWith([{ id: 'routes-0', data: { features: [{ type: 'Feature' }] }, label: 'A4' }]).getRoute();
            expect(r).toEqual({ features: [{ type: 'Feature' }], label: 'A4' });
        });
    });
});
