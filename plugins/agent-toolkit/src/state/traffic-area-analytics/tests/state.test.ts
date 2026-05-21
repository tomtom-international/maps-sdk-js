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
        expect(entriesHandler).toHaveBeenCalledWith([]);
        expect(shownHandler).toHaveBeenCalledTimes(1);
    });
});
