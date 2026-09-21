import { describe, expect, it, vi } from 'vitest';
import { RangeState } from '../state';

const mockMap = {} as any;

describe('RangeState events', () => {
    it('emits entries-change on addEntry', () => {
        const state = new RangeState(mockMap);
        const handler = vi.fn();
        state.events.on('entries-change', handler);
        state.addEntry({
            label: 'r',
            data: [
                {
                    origin: { position: [4.9, 52.3] },
                    budgets: [{ type: 'timeMinutes', value: 10 }],
                },
            ],
        });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emits entries-change on reset', () => {
        const state = new RangeState(mockMap);
        const handler = vi.fn();
        state.events.on('entries-change', handler);
        state.reset();
        expect(handler).toHaveBeenCalledTimes(1);
    });
});

describe('RangeState — entry id collisions', () => {
    it('never reuses a surviving entry id after removals (add 3, remove first, add again)', async () => {
        const state = new RangeState(mockMap);
        const entry = { label: 'r', data: [] } as any;
        await state.addEntry(entry); // ranges-0
        await state.addEntry(entry); // ranges-1
        await state.addEntry(entry); // ranges-2
        await state.removeEntry('ranges-0');
        // entries.length is now 2, so a naive length-based id would mint
        // `ranges-2` again and collide with the surviving entry.
        await state.addEntry(entry);
        const ids = state.entries.map((existing) => existing.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
