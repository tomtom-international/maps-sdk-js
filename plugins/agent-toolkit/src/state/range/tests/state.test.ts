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
