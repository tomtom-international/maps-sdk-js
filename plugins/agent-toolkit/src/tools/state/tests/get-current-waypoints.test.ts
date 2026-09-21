import type { TomTomMap } from '@tomtom-org/maps-sdk/map';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoutingState } from '../../../state';
import { makeMockState } from '../../../tests/constants';
import { executeGetCurrentWaypoints } from '../get-current-waypoints';

const routing = new RoutingState({} as TomTomMap);

// Seed the sparse planning slots directly via setWaypointAt — a [lng, lat] tuple is a valid
// WaypointLike, so summarizeWaypoint resolves a position off it. Gaps stay null (empty slots).
const seedSlots = (positions: Array<[number, number] | null>) => {
    positions.forEach((position, index) => {
        if (position) routing.setWaypointAt(index, position);
    });
};

describe('executeGetCurrentWaypoints', () => {
    afterEach(() => {
        routing.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('filters out empty slots unless includeEmptySlots is set', async () => {
        seedSlots([[4.9, 52.4], null, [4.8, 52.3]]);

        const filtered = await executeGetCurrentWaypoints({}, makeMockState({ routing }));
        expect(filtered.totalSlots).toBe(3);
        expect(filtered.filledSlots).toBe(2);
        expect(filtered.returnedCount).toBe(2);
        expect(filtered.waypoints.every((slot) => slot.isFilled)).toBe(true);

        const withEmpties = await executeGetCurrentWaypoints({ includeEmptySlots: true }, makeMockState({ routing }));
        expect(withEmpties.returnedCount).toBe(3);
        expect(withEmpties.waypoints.some((slot) => !slot.isFilled)).toBe(true);
    });

    it('returns exactly the requested slot when slotIndex is given, ignoring offset/limit', async () => {
        seedSlots([
            [4.9, 52.4],
            [4.8, 52.3],
            [4.7, 52.2],
        ]);

        const result = await executeGetCurrentWaypoints(
            { slotIndex: 2, offset: 10, limit: 1 },
            makeMockState({ routing }),
        );
        expect(result.returnedCount).toBe(1);
        expect(result.waypoints).toHaveLength(1);
        expect(result.waypoints[0].slotIndex).toBe(2);
        expect(result.matchedCount).toBe(1);
        expect(result.offset).toBe(0);
        expect(result.hasMore).toBe(false);
        expect('nextOffset' in result).toBe(false);
    });

    it('paginates with hasMore + nextOffset when more slots than the limit remain', async () => {
        seedSlots([
            [4.9, 52.4],
            [4.8, 52.3],
            [4.7, 52.2],
        ]);

        const page = await executeGetCurrentWaypoints({ limit: 2 }, makeMockState({ routing }));
        expect(page.returnedCount).toBe(2);
        expect(page.hasMore).toBe(true);
        expect(page.nextOffset).toBe(2);

        const lastPage = await executeGetCurrentWaypoints({ offset: 2, limit: 2 }, makeMockState({ routing }));
        expect(lastPage.returnedCount).toBe(1);
        expect(lastPage.hasMore).toBe(false);
        expect('nextOffset' in lastPage).toBe(false);
    });

    it('shapes filled slots with a position and empty slots without one', async () => {
        seedSlots([[4.9, 52.4], null]);

        const result = await executeGetCurrentWaypoints({ includeEmptySlots: true }, makeMockState({ routing }));
        const filled = result.waypoints.find((slot) => slot.slotIndex === 0);
        const empty = result.waypoints.find((slot) => slot.slotIndex === 1);

        expect(filled).toMatchObject({ slotIndex: 0, isFilled: true, position: [4.9, 52.4] });
        expect(empty).toEqual({ slotIndex: 1, isFilled: false });
        expect('position' in (empty ?? {})).toBe(false);
    });
});
