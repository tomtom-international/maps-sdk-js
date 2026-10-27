import type { Project } from '@playwright/test';
import { afterEach, describe, expect, test, vi } from 'vitest';

const VISUAL_TITLE = 'the geometries draw in the map accent @cross-browser-visual';
const SANITY_TITLE = 'the map loads @cross-browser';

const realPlatform = process.platform;

/** `browserProjects` reads the platform and `CI` once, when it loads, so each case loads it afresh. */
const projectsIn = async (platform: NodeJS.Platform, ci: string, snapshotsDirectory?: string) => {
    Object.defineProperty(process, 'platform', { value: platform });
    vi.stubEnv('CI', ci);
    vi.resetModules();
    const { browserProjects } = await import('../browser-projects');
    return new Map(browserProjects(snapshotsDirectory).map((project) => [project.name, project]));
};

const runs = (project: Project | undefined, title: string) =>
    [project?.grep ?? /./].flat().some((pattern) => pattern.test(title));

afterEach(() => {
    Object.defineProperty(process, 'platform', { value: realPlatform });
    vi.unstubAllEnvs();
});

describe('browserProjects', () => {
    test('Chromium runs every test, the scaled Chromium only the sanity ones it has baselines for', async () => {
        const projects = await projectsIn('linux', '1');

        expect(runs(projects.get('chromium'), VISUAL_TITLE)).toBe(true);
        expect(runs(projects.get('chromium-scaled'), SANITY_TITLE)).toBe(true);
        expect(runs(projects.get('chromium-scaled'), VISUAL_TITLE)).toBe(false);
    });

    test('Firefox and WebKit shoot the visual tests in the Linux CI image only', async () => {
        for (const [platform, ci, shoots] of [
            ['linux', '1', true],
            ['linux', '', false],
            ['darwin', '1', false],
            ['win32', '1', false],
        ] as const) {
            const projects = await projectsIn(platform, ci);
            for (const engine of ['firefox', 'webkit']) {
                expect(runs(projects.get(engine), SANITY_TITLE), `${engine} on ${platform}`).toBe(true);
                expect(runs(projects.get(engine), VISUAL_TITLE), `${engine} on ${platform}, CI "${ci}"`).toBe(shoots);
            }
        }
    });

    test("Chromium's baselines sit in the snapshots directory, each engine's in a folder of its own", async () => {
        const projects = await projectsIn('linux', '1', '{testDir}/snapshots');

        expect(projects.get('chromium')?.snapshotPathTemplate).toBe('{testDir}/snapshots/{arg}{ext}');
        expect(projects.get('firefox')?.snapshotPathTemplate).toBe('{testDir}/snapshots/firefox/{arg}{ext}');
        expect(projects.get('webkit')?.snapshotPathTemplate).toBe('{testDir}/snapshots/webkit/{arg}{ext}');
        expect(projects.get('chromium-scaled')?.snapshotPathTemplate).toBeUndefined();
    });

    test('a suite taking no screenshot gets no template', async () => {
        const projects = await projectsIn('linux', '1');

        expect([...projects.values()].filter(({ snapshotPathTemplate }) => snapshotPathTemplate)).toEqual([]);
    });

    test('Edge joins the sanity set when INCLUDE_MSEDGE is set', async () => {
        expect((await projectsIn('linux', '1')).has('msedge')).toBe(false);

        vi.stubEnv('INCLUDE_MSEDGE', '1');
        const projects = await projectsIn('win32', '1');
        expect(runs(projects.get('msedge'), SANITY_TITLE)).toBe(true);
        expect(runs(projects.get('msedge'), VISUAL_TITLE)).toBe(false);
    });
});
