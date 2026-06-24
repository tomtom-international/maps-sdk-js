import { expect, test } from '@playwright/test';

// Verifies the iframe-worker sandbox's isolation guarantees in a real browser.
// These are exactly the properties the Node unit tests CANNOT check (jsdom has no
// CSP enforcement, no real cross-origin iframes, no Worker termination).

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof globalThis.runInSandbox === 'function');
});

test('zero-config: turf runs inside the worker', async ({ page }) => {
    // A unit-square polygon has area ~1 deg² → a large m² value; we just assert it computed.
    const result = await page.evaluate(() =>
        globalThis.runInSandbox('return turf.area(turf.polygon([[[0,0],[0,1],[1,1],[1,0],[0,0]]]));'),
    );
    expect(result).toHaveProperty('value');
    expect((result as { value: number }).value).toBeGreaterThan(0);
});

test('zero-config: h3 runs inside the worker', async ({ page }) => {
    const result = await page.evaluate(() => globalThis.runInSandbox('return h3.latLngToCell(52.37, 4.9, 8);'));
    expect(result).toHaveProperty('value');
    expect(typeof (result as { value: string }).value).toBe('string');
});

test('network egress is blocked (CSP default-src none + global shadowing)', async ({ page }) => {
    const result = await page.evaluate(() =>
        globalThis.runInSandbox("await fetch('https://example.com/'); return 'reached-network';"),
    );
    // The fetch must NOT succeed: blocked by CSP and/or the shadowed `fetch` global.
    expect(result).toHaveProperty('error');
});

test('a runaway loop is terminated at the timeout and the page stays responsive', async ({ page }) => {
    const result = await page.evaluate(() => globalThis.runInSandbox('while (true) {} return 1;'));
    expect(JSON.stringify(result)).toMatch(/timeout|terminated/i);
    // Main thread was never frozen — a subsequent call still works.
    const after = await page.evaluate(() => globalThis.runInSandbox('return 2 + 2;'));
    expect(after).toEqual({ value: 4 });
});

test('cannot read the parent page storage / DOM', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('secret', 'should-not-leak'));
    const ls = await page.evaluate(() => globalThis.runInSandbox('return typeof localStorage;'));
    expect(ls).toEqual({ value: 'undefined' });
    const doc = await page.evaluate(() => globalThis.runInSandbox('return typeof document;'));
    expect(doc).toEqual({ value: 'undefined' });
});
