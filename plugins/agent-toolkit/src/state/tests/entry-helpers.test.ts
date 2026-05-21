import { describe, expect, test } from 'vitest';
import { collapseHistoryToLatest, pickUniqueEntryId } from '../entry-helpers';

describe('pickUniqueEntryId', () => {
    test('returns the requested id unchanged when no collision', () => {
        expect(pickUniqueEntryId('places-3', ['places-0', 'places-1'])).toBe('places-3');
    });

    test('accepts a Set as the taken collection', () => {
        expect(pickUniqueEntryId('foo', new Set(['bar', 'baz']))).toBe('foo');
    });

    test('appends `-2` on the first collision', () => {
        expect(pickUniqueEntryId('places-0', ['places-0'])).toBe('places-0-2');
    });

    test('counts up past existing suffixed siblings', () => {
        expect(pickUniqueEntryId('places-0', ['places-0', 'places-0-2', 'places-0-3'])).toBe('places-0-4');
    });

    test('handles non-contiguous suffix gaps by picking the lowest free index', () => {
        // -2 is free even though -3 and -4 are taken — picker stops at the first hit.
        expect(pickUniqueEntryId('foo', ['foo', 'foo-3', 'foo-4'])).toBe('foo-2');
    });

    test('treats the empty iterable as no collision', () => {
        expect(pickUniqueEntryId('anything', [])).toBe('anything');
    });

    test('does not mutate the source collection', () => {
        const taken = ['x'];
        pickUniqueEntryId('x', taken);
        expect(taken).toEqual(['x']);
    });

    test('first suffix is `-2`, never `-1`', () => {
        // The suffix chain ("foo, foo-2, foo-3, …") is part of the contract — lock it down so a
        // refactor cannot quietly switch to `-1` and break the LLM's mental model.
        const result = pickUniqueEntryId('foo', ['foo']);
        expect(result).not.toContain('-1');
        expect(result).toBe('foo-2');
    });
});

describe('collapseHistoryToLatest', () => {
    test('returns a copy of the input untouched when there is at most one entry', async () => {
        const hideOne = (_: unknown): Promise<void> => Promise.reject(new Error('should not be called'));

        await expect(collapseHistoryToLatest([], hideOne)).resolves.toEqual([]);
        await expect(collapseHistoryToLatest([{ id: 'only' }], hideOne)).resolves.toEqual([{ id: 'only' }]);
    });

    test('hides every non-latest entry and keeps only the latest', async () => {
        const hidden: string[] = [];
        const entries = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

        const result = await collapseHistoryToLatest(entries, async (entry) => {
            hidden.push(entry.id);
        });

        expect(hidden).toEqual(['a', 'b']);
        expect(result).toEqual([{ id: 'c' }]);
    });

    test('serial hide preserves input order', async () => {
        const callOrder: string[] = [];
        const entries = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

        await collapseHistoryToLatest(entries, async (entry) => {
            // Resolve on a microtask so out-of-order completion would be observable if the helper
            // wasn't awaiting between iterations.
            await Promise.resolve();
            callOrder.push(entry.id);
        });

        expect(callOrder).toEqual(['a', 'b', 'c']);
    });

    test('parallel mode fires every hide before any awaits resolve', async () => {
        const started: string[] = [];
        const entries = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

        await collapseHistoryToLatest(
            entries,
            async (entry) => {
                started.push(entry.id);
                await Promise.resolve();
            },
            { parallel: true },
        );

        // Both `a` and `b` must have started before any awaits cleared — `Promise.all` kicks the
        // sync prefix of every callback before yielding.
        expect(started).toEqual(['a', 'b']);
    });

    test('returns a fresh array — does not alias the input', async () => {
        const entries = [{ id: 'only' }];
        const result = await collapseHistoryToLatest(entries, async () => {});
        expect(result).not.toBe(entries);
        expect(result).toEqual(entries);
    });

    test('propagates a hide failure', async () => {
        const boom = new Error('hide failed');
        await expect(collapseHistoryToLatest([{ id: 'a' }, { id: 'b' }], () => Promise.reject(boom))).rejects.toBe(
            boom,
        );
    });
});
