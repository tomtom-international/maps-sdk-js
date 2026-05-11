import { describe, expect, it, vi } from 'vitest';
import { StateEvents } from '../events';

describe('StateEvents', () => {
    type TestMap = { foo: number; bar: string };

    it('on() registers a handler that fires on emit()', () => {
        const events = new StateEvents<TestMap>();
        const handler = vi.fn();
        events.on('foo', handler);
        events.emit('foo', 42);
        expect(handler).toHaveBeenCalledWith(42);
    });

    it('returns an unsubscribe function that removes only that handler', () => {
        const events = new StateEvents<TestMap>();
        const a = vi.fn();
        const b = vi.fn();
        const unsubA = events.on('foo', a);
        events.on('foo', b);

        unsubA();
        events.emit('foo', 1);

        expect(a).not.toHaveBeenCalled();
        expect(b).toHaveBeenCalledWith(1);
    });

    it('off(type) removes all handlers for that type', () => {
        const events = new StateEvents<TestMap>();
        const handler = vi.fn();
        events.on('foo', handler);
        events.on('foo', handler);
        events.off('foo');
        events.emit('foo', 1);
        expect(handler).not.toHaveBeenCalled();
    });

    it('clear() drops handlers across every type', () => {
        const events = new StateEvents<TestMap>();
        const fooHandler = vi.fn();
        const barHandler = vi.fn();
        events.on('foo', fooHandler);
        events.on('bar', barHandler);
        events.clear();
        events.emit('foo', 1);
        events.emit('bar', 'x');
        expect(fooHandler).not.toHaveBeenCalled();
        expect(barHandler).not.toHaveBeenCalled();
    });

    it('does not skip a sibling handler when one unsubscribes mid-dispatch', () => {
        // Iterating a snapshot inside emit() guards against handlers mutating the list.
        const events = new StateEvents<TestMap>();
        const order: string[] = [];
        const unsubA = events.on('foo', () => {
            order.push('a');
            unsubA();
        });
        events.on('foo', () => order.push('b'));
        events.emit('foo', 1);
        expect(order).toEqual(['a', 'b']);
    });
});
