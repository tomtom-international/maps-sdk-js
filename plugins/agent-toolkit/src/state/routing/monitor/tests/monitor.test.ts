import type { Routes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it, vi } from 'vitest';
import { RouteMonitor } from '../monitor';

const fakeRoutes = (n = 1): Routes =>
    ({ type: 'FeatureCollection', features: Array.from({ length: n }, () => ({})) }) as unknown as Routes;

// Capturing timer doubles: `tick` invokes the scheduled interval callback on demand so tests drive
// recurring ticks deterministically without real timers.
const fakeTimers = () => {
    let scheduled: (() => void) | undefined;
    return {
        setInterval: (fn: () => void) => {
            scheduled = fn;
            return 1;
        },
        clearInterval: vi.fn(),
        tick: () => scheduled?.(),
    };
};

describe('RouteMonitor', () => {
    it('fires an eager first tick, then recurring ticks, emitting the fresh routes', async () => {
        const timers = fakeTimers();
        const recalculate = vi.fn().mockResolvedValue(fakeRoutes(2));
        const monitor = new RouteMonitor();
        const ticks: number[] = [];
        monitor.events.on('tick', (snap) => ticks.push(snap.routes.features.length));

        monitor.start({ recalculate, setInterval: timers.setInterval, clearInterval: timers.clearInterval });
        expect(monitor.isRunning).toBe(true);
        await Promise.resolve();
        await Promise.resolve();
        expect(recalculate).toHaveBeenCalledTimes(1); // eager tick

        timers.tick();
        await Promise.resolve();
        await Promise.resolve();
        expect(recalculate).toHaveBeenCalledTimes(2);
        expect(ticks).toEqual([2, 2]);
    });

    it('skipInitialTick defers the first recalculation to the interval', async () => {
        const timers = fakeTimers();
        const recalculate = vi.fn().mockResolvedValue(fakeRoutes());
        const monitor = new RouteMonitor();
        monitor.start(
            { recalculate, setInterval: timers.setInterval, clearInterval: timers.clearInterval },
            60_000,
            true,
        );
        await Promise.resolve();
        expect(recalculate).not.toHaveBeenCalled();
        timers.tick();
        await Promise.resolve();
        expect(recalculate).toHaveBeenCalledTimes(1);
    });

    it('moves to stopped-error and emits error when a recalculation throws', async () => {
        const timers = fakeTimers();
        const recalculate = vi.fn().mockRejectedValue(new Error('route service down'));
        const monitor = new RouteMonitor();
        const errors: string[] = [];
        monitor.events.on('error', (e) => errors.push(e));

        monitor.start({ recalculate, setInterval: timers.setInterval, clearInterval: timers.clearInterval });
        await Promise.resolve();
        await Promise.resolve();

        expect(monitor.status).toBe('stopped-error');
        expect(monitor.isRunning).toBe(false);
        expect(monitor.error).toContain('route service down');
        expect(errors).toEqual(['route service down']);
        expect(timers.clearInterval).toHaveBeenCalled(); // timer released on failure
    });

    it('start is a no-op while already running', async () => {
        const timers = fakeTimers();
        const recalculate = vi.fn().mockResolvedValue(fakeRoutes());
        const monitor = new RouteMonitor();
        monitor.start(
            { recalculate, setInterval: timers.setInterval, clearInterval: timers.clearInterval },
            60_000,
            true,
        );
        monitor.start(
            { recalculate, setInterval: timers.setInterval, clearInterval: timers.clearInterval },
            60_000,
            true,
        );
        timers.tick();
        await Promise.resolve();
        expect(recalculate).toHaveBeenCalledTimes(1); // second start ignored — one scheduled callback
    });

    it('stop clears the timer and returns to idle', () => {
        const timers = fakeTimers();
        const monitor = new RouteMonitor();
        monitor.start(
            {
                recalculate: vi.fn().mockResolvedValue(fakeRoutes()),
                setInterval: timers.setInterval,
                clearInterval: timers.clearInterval,
            },
            60_000,
            true,
        );
        monitor.stop();
        expect(monitor.status).toBe('idle');
        expect(timers.clearInterval).toHaveBeenCalledWith(1);
    });
});
