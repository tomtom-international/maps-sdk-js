import { expect, test } from '@playwright/test';

// E2E sanity for `clusterIncidents`' clustering in a real browser: the `cluster()` primitive the tool
// runs for its dynamic path executes INSIDE the iframe-worker and returns clusters, not an error. This
// is the browser-only path the Node unit tests can't exercise — and the exact thing that regressed when
// the worker library chunk shipped without the `cluster` global ("Clustering failed"). The tool's
// surrounding state/recipe logic is pure JS, covered by the Vitest unit suite; here we prove the
// in-worker clustering engine works end-to-end. Mirrors "the 3 worst clusters" via `maxClusters: 3`.

// A jam incident with the fields clustering reads (delay clears the default pre-filter).
const incident = (id: string, lng: number, lat: number, delayInSeconds = 200) => ({
    type: 'Feature',
    id,
    properties: {
        id,
        category: 'jam',
        delayInSeconds,
        magnitudeOfDelay: 'moderate',
        timeValidity: 'present',
        events: [],
        roadNumbers: ['M25'],
    },
    geometry: { type: 'Point', coordinates: [lng, lat] },
});

// Three incidents within ~0.5km of each other form one DBSCAN cluster at the defaults (minMembers 3).
const tightCluster = (ids: string[]) => ids.map((id, i) => incident(id, 4.9 + i * 0.001, 52.37 + i * 0.001));

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof globalThis.runInSandbox === 'function');
});

test('clusterIncidents clustering runs in the iframe-worker (top 3) without error', async ({ page }) => {
    // `cluster` is a worker-provided global (like turf/h3) — name it as a param; its arg is ignored and
    // filled from `self.cluster` in the worker. `incidents` is the cloneable data arg.
    const result = await page.evaluate(
        (incidents) =>
            globalThis.runInSandbox(
                'return cluster(incidents, { eps: 0.4, minMembers: 3, maxClusters: 3 });',
                ['incidents', 'cluster'],
                [incidents, null],
            ),
        tightCluster(['a', 'b', 'c']),
    );
    // A successful sandbox run resolves to `{ value }`, a failure to `{ error }`.
    expect(result, JSON.stringify(result)).toHaveProperty('value');
    const output = (result as { value: { groups: unknown[] } }).value;
    expect(Array.isArray(output.groups)).toBe(true);
    expect(output.groups.length).toBe(1);
});

test('dynamic clustering of a filtered subset runs in the worker without error', async ({ page }) => {
    // The shape the tool's `code` path generates: filter incidents, then cluster the subset via `cluster()`.
    const result = await page.evaluate(
        (incidents) =>
            globalThis.runInSandbox(
                'const major = incidents.filter((i) => (i.properties.delayInSeconds ?? 0) >= 100); ' +
                    'return cluster(major, { eps: 0.4, maxClusters: 3 });',
                ['incidents', 'cluster'],
                [incidents, null],
            ),
        tightCluster(['a', 'b', 'c']),
    );
    expect(result, JSON.stringify(result)).toHaveProperty('value');
    expect((result as { value: { groups: unknown[] } }).value.groups.length).toBeGreaterThan(0);
});
