import { describe, expect, it, vi } from 'vitest';
import { createToolState, PlacesState, RoutingState } from '../state';

const mockMap = {} as any;

describe('createToolState', () => {
    it('includes all built-in slices', () => {
        const state = createToolState(mockMap);
        expect(state.places).toBeInstanceOf(PlacesState);
        expect(state.routing).toBeInstanceOf(RoutingState);
        expect(state.baseMap).toBeDefined();
        expect(state.trafficTiles).toBeDefined();
        expect(state.trafficAreaAnalytics).toBeDefined();
        expect(state.trafficIncidents).toBeDefined();
        expect(state.ranges).toBeDefined();
        expect(state.mapPOIs).toBeDefined();
        expect(state.customGeometries).toBeDefined();
        expect(state.byod).toBeDefined();
    });

    it('merges custom slices alongside built-in state', () => {
        const fleet = { vehicles: [], reset: vi.fn() };
        const state = createToolState(mockMap, { fleet });
        expect(state.fleet).toBe(fleet);
        expect(state.places).toBeInstanceOf(PlacesState);
    });

    it('returns base state when no custom slices provided', () => {
        const state = createToolState(mockMap);
        expect(state.places).toBeInstanceOf(PlacesState);
        expect((state as any).fleet).toBeUndefined();
    });
});
