import { describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState } from '../state';

const mockMap = {} as any;

describe('TrafficAreaAnalyticsState', () => {
    it('addEntry assigns a fallback id and emits entries-change', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        const handler = vi.fn();
        state.events.on('entries-change', handler);

        const id = await state.addEntry({} as any, 'Amsterdam (2024-01 → 2024-02)', { metrics: ['speed'] });

        expect(id).toBe('tta-0');
        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toMatchObject({
            id: 'tta-0',
            label: 'Amsterdam (2024-01 → 2024-02)',
            params: { metrics: ['speed'] },
        });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('addEntry uses explicitId and auto-suffixes collisions', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        await state.addEntry({} as any, 'a', {}, 'rush-hour-ams');
        await state.addEntry({} as any, 'b', {}, 'rush-hour-ams');

        expect(state.entries.map((e) => e.id)).toEqual(['rush-hour-ams', 'rush-hour-ams-2']);
    });

    it('latestEntry returns the most recently added entry', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        expect(state.latestEntry).toBeUndefined();
        await state.addEntry({} as any, 'first', {});
        const secondId = await state.addEntry({} as any, 'second', {});
        expect(state.latestEntry?.id).toBe(secondId);
    });

    it('shownEntryIds tracks _shown flags', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        const id = await state.addEntry({} as any, 'a', {});
        // Manually mark _shown — bypasses getEntryModule for the unit test.
        (state.entries.find((e) => e.id === id) as any)._shown = true;
        expect([...state.shownEntryIds]).toEqual([id]);
    });

    it('reset empties history and emits entries-change + shown-change', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        await state.addEntry({} as any, 'a', {});
        const entriesHandler = vi.fn();
        const shownHandler = vi.fn();
        state.events.on('entries-change', entriesHandler);
        state.events.on('shown-change', shownHandler);

        state.reset();

        expect(state.entries).toHaveLength(0);
        expect(entriesHandler).toHaveBeenCalledWith({ entries: [], changedIds: ['tta-0'] });
        expect(shownHandler).toHaveBeenCalledTimes(1);
    });
});

describe('TrafficAreaAnalyticsState — entry id collisions', () => {
    it('never reuses a surviving entry id after removals (add 3, remove first, add again)', async () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        await state.addEntry({} as any, 'A', { metrics: ['speed'] }); // tta-0
        await state.addEntry({} as any, 'B', { metrics: ['speed'] }); // tta-1
        await state.addEntry({} as any, 'C', { metrics: ['speed'] }); // tta-2
        await state.removeEntry('tta-0');
        // entries.length is now 2, so a naive length-based fallback would mint
        // `tta-2` again and collide with the surviving entry.
        await state.addEntry({} as any, 'D', { metrics: ['speed'] });
        const ids = state.entries.map((entry) => entry.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
