import { describe, expect, test, vi } from 'vitest';
import {
    composeStepResult,
    createPrepareStepMutex,
    destroyState,
    intersectActiveTools,
    isStateSlice,
    mergeProviderOptions,
} from '../prepare-step-helpers';

describe('intersectActiveTools', () => {
    test('returns undefined when both sides are absent', () => {
        expect(intersectActiveTools(undefined, undefined)).toBeUndefined();
    });

    test('returns the single defined side untouched', () => {
        expect(intersectActiveTools(['a', 'b'], undefined)).toEqual(['a', 'b']);
        expect(intersectActiveTools(undefined, ['a', 'b'])).toEqual(['a', 'b']);
    });

    test('intersects and preserves order from the first argument', () => {
        // The classifier's order matters — it ranks tools by relevance; user overrides should
        // not reshuffle that ranking when they narrow the set.
        expect(intersectActiveTools(['c', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b']);
    });

    test('drops names absent from `b`', () => {
        expect(intersectActiveTools(['a', 'b', 'c'], ['b'])).toEqual(['b']);
    });

    test('returns empty array when the intersection is empty (not undefined)', () => {
        // An empty array communicates "user opted into none", distinct from "no filter at all".
        expect(intersectActiveTools(['a'], ['b'])).toEqual([]);
    });
});

describe('mergeProviderOptions', () => {
    test('returns undefined when both sides are absent', () => {
        expect(mergeProviderOptions(undefined, undefined)).toBeUndefined();
    });

    test('returns the factory side when the user side is absent', () => {
        expect(mergeProviderOptions({ openai: { temperature: 0.2 } }, undefined)).toEqual({
            openai: { temperature: 0.2 },
        });
    });

    test('returns the user side when the factory side is absent', () => {
        expect(mergeProviderOptions(undefined, { openai: { temperature: 0.5 } })).toEqual({
            openai: { temperature: 0.5 },
        });
    });

    test('user values win on collision', () => {
        const merged = mergeProviderOptions(
            { openai: { temperature: 0.2 }, anthropic: { topK: 5 } },
            { openai: { temperature: 0.9 } },
        );
        expect(merged).toEqual({ openai: { temperature: 0.9 }, anthropic: { topK: 5 } });
    });

    test('merge is shallow per provider key', () => {
        // The merge is `{ ...a, ...b }`, so an `openai` entry on `b` replaces — not deep-merges —
        // the matching entry on `a`. Lock this in: deep merge would be a behaviour change.
        const merged = mergeProviderOptions(
            { openai: { temperature: 0.2, maxTokens: 1000 } },
            { openai: { temperature: 0.9 } },
        );
        expect(merged).toEqual({ openai: { temperature: 0.9 } });
    });
});

describe('composeStepResult', () => {
    test('omits activeTools and providerOptions when both are undefined and no user override', () => {
        expect(composeStepResult(undefined, undefined, undefined)).toEqual({});
    });

    test('passes through activeTools and providerOptions when no user override', () => {
        const result = composeStepResult(['a', 'b'], { openai: { temperature: 0.1 } }, undefined);
        expect(result).toEqual({ activeTools: ['a', 'b'], providerOptions: { openai: { temperature: 0.1 } } });
    });

    test('user override fields take precedence and merge happens beneath them', () => {
        const result = composeStepResult(
            ['classifier-a', 'classifier-b'],
            { openai: { temperature: 0.2 } },
            { activeTools: ['classifier-a'], providerOptions: { openai: { temperature: 0.9 } }, system: 'custom' },
        );
        expect(result).toEqual({
            activeTools: ['classifier-a'], // intersection with classifier picks
            providerOptions: { openai: { temperature: 0.9 } }, // user value wins
            system: 'custom', // user-only fields pass through
        });
    });

    test('user override narrows but cannot widen the classifier choice', () => {
        // User asks for `['x', 'y']` but classifier only allowed `['a']`. Intersection is empty —
        // user cannot smuggle disabled tools back in.
        const result = composeStepResult(['a'], undefined, { activeTools: ['x', 'y'] });
        expect(result?.activeTools).toEqual([]);
    });

    test('does not mutate the user-supplied PrepareStepResult', () => {
        const userResult = { activeTools: ['a'], providerOptions: { openai: { t: 1 } } };
        const snapshot = JSON.parse(JSON.stringify(userResult));
        composeStepResult(['a'], { openai: { t: 2 } }, userResult);
        expect(userResult).toEqual(snapshot);
    });
});

describe('isStateSlice', () => {
    test('accepts objects with a callable reset()', () => {
        expect(isStateSlice({ reset: () => undefined })).toBe(true);
    });

    test('rejects objects with a non-function reset', () => {
        expect(isStateSlice({ reset: 'nope' })).toBe(false);
    });

    test('rejects objects without a reset key', () => {
        expect(isStateSlice({ foo: 1 })).toBe(false);
    });

    test('rejects primitives and null', () => {
        expect(isStateSlice(null)).toBe(false);
        expect(isStateSlice(undefined)).toBe(false);
        expect(isStateSlice(42)).toBe(false);
        expect(isStateSlice('reset')).toBe(false);
    });
});

describe('destroyState', () => {
    test('calls reset() on every slice that implements StateSlice', () => {
        const places = { reset: vi.fn() };
        const routing = { reset: vi.fn() };
        const baseMap = {
            ttMap: {
                /* no reset */
            },
        };

        destroyState({ places, routing, baseMap } as never);

        expect(places.reset).toHaveBeenCalledTimes(1);
        expect(routing.reset).toHaveBeenCalledTimes(1);
    });

    test('silently skips non-slice members (no `reset`)', () => {
        // No throws even when half the bag is unrelated map objects — exercised on the real
        // ToolState which mixes slices and bare proxies.
        expect(() => destroyState({ noReset: { foo: 1 }, slice: { reset: () => undefined } } as never)).not.toThrow();
    });
});

describe('createPrepareStepMutex', () => {
    test('serialises overlapping calls in submission order', async () => {
        const lock = createPrepareStepMutex();
        const order: string[] = [];

        // Submit three calls "concurrently". The mutex must run them strictly in order: the
        // second's `fn` only fires once the first has resolved, even though their resolves race.
        const first = lock(async () => {
            await Promise.resolve();
            await Promise.resolve();
            order.push('first');
        });
        const second = lock(async () => {
            order.push('second');
        });
        const third = lock(async () => {
            order.push('third');
        });

        await Promise.all([first, second, third]);
        expect(order).toEqual(['first', 'second', 'third']);
    });

    test('releases the lock after a rejection so later calls still run', async () => {
        const lock = createPrepareStepMutex();
        const ran: string[] = [];

        const failing = lock(async () => {
            throw new Error('boom');
        });
        const next = lock(async () => {
            ran.push('next');
        });

        await expect(failing).rejects.toThrow('boom');
        await next;
        expect(ran).toEqual(['next']);
    });

    test('per-instance — two mutexes do not block each other', async () => {
        const a = createPrepareStepMutex();
        const b = createPrepareStepMutex();

        let releaseA: () => void = () => undefined;
        const longRunningA = a(
            () =>
                new Promise<void>((resolve) => {
                    releaseA = resolve;
                }),
        );

        // `b` must complete even though `a` is still holding its lock.
        await b(async () => undefined);

        releaseA();
        await longRunningA;
    });

    test('passes through the wrapped function`s return value', async () => {
        const lock = createPrepareStepMutex();
        await expect(lock(async () => 42)).resolves.toBe(42);
    });
});
