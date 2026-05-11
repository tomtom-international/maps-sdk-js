import { describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState } from '../state';

const mockMap = {} as any;

describe('TrafficAreaAnalyticsState events', () => {
    it('notifyAnalyticsShown emits analytics-shown', () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        const handler = vi.fn();
        state.events.on('analytics-shown', handler);

        const analytics = {} as any;
        const module = {} as any;
        state.notifyAnalyticsShown(analytics, module);

        expect(handler).toHaveBeenCalledWith({ analytics, module });
    });

    it('notifyAnalyticsCleared emits analytics-cleared', () => {
        const state = new TrafficAreaAnalyticsState(mockMap);
        const handler = vi.fn();
        state.events.on('analytics-cleared', handler);

        state.notifyAnalyticsCleared();

        expect(handler).toHaveBeenCalledTimes(1);
    });
});
