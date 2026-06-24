import { afterEach, describe, expect, it, vi } from 'vitest';
import { mainThreadExecutor } from '../../sandbox-code';
import { DEFAULT_SANDBOX_TIMEOUT_MS, resolveSandboxExecutor } from '../iframe-worker-executor';

afterEach(() => vi.restoreAllMocks());

// Make `resolveSandboxExecutor` see a "browser" so it returns the iframe-worker
// executor. The stubbed `document` has no real `createElement`, so the executor's
// init throws and it falls back to the main thread (with a warning) — which is the
// runtime-fallback path asserted below. (URL + Blob already exist under Node.)
const stubBrowser = (): void => {
    vi.stubGlobal('document', {});
    // Only needs `typeof Worker !== 'undefined'` to pass; never instantiated (init
    // throws at `document.createElement` first). The field keeps the class non-empty.
    vi.stubGlobal(
        'Worker',
        class WorkerStub {
            readonly isStub = true;
        },
    );
};

describe('resolveSandboxExecutor (env-based selection — not configurable)', () => {
    it('returns the main-thread executor in Node/SSR (no browser sandbox APIs)', () => {
        expect(resolveSandboxExecutor()).toBe(mainThreadExecutor);
        expect(resolveSandboxExecutor({})).toBe(mainThreadExecutor);
        expect(resolveSandboxExecutor({ timeoutMs: 1000 })).toBe(mainThreadExecutor);
    });

    it('returns a distinct iframe-worker executor in the browser', () => {
        stubBrowser();
        const executor = resolveSandboxExecutor();
        expect(executor).not.toBe(mainThreadExecutor);
        expect(typeof executor.run).toBe('function');
    });

    it('exposes a 10 second default timeout', () => {
        expect(DEFAULT_SANDBOX_TIMEOUT_MS).toBe(10_000);
    });
});

describe('iframe-worker executor — runtime fallback when the iframe cannot initialise', () => {
    it('falls back to main-thread execution and still returns the correct result', async () => {
        stubBrowser();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const executor = resolveSandboxExecutor();

        const result = await executor.run<number>('return a + b;', ['a', 'b'], [2, 3], 'Test');

        expect(result).toEqual({ value: 5 });
    });

    it('warns exactly once about the fallback even across multiple runs', async () => {
        stubBrowser();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const executor = resolveSandboxExecutor();

        await executor.run('return 1;', [], [], 'Test');
        await executor.run('return 2;', [], [], 'Test');

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/iframe-worker sandbox unavailable/);
    });

    it('still surfaces sandbox runtime errors through the fallback', async () => {
        stubBrowser();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const executor = resolveSandboxExecutor();

        const result = await executor.run('throw new Error("boom");', [], [], 'Analysis');

        expect(result).toEqual({ error: expect.stringMatching(/Analysis code execution failed:.*boom/) });
    });
});
