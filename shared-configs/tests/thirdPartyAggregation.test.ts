import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
    aggregate,
    packageTarget,
    pluginPackageDirectories,
    render,
    SDK_BUNDLES,
    sdkTarget,
    sidecarPath,
    staleness,
    unbuiltPackages,
    writeNotices,
} from '../thirdPartyAggregation.ts';
import { addPackage, createRepository, notice, writeSidecar } from './fixtures.ts';

describe('aggregate', () => {
    test('lists a component required by several bundles once, naming all of them', () => {
        const root = createRepository();
        for (const bundle of SDK_BUNDLES) {
            addPackage(root, bundle, { name: bundle });
            writeSidecar(root, bundle, [notice({ name: 'lodash-es', version: '4.18.1', bundled: false })]);
        }

        expect(aggregate(root, SDK_BUNDLES)).toEqual([
            expect.objectContaining({ name: 'lodash-es', requiredBy: ['core', 'services', 'map'] }),
        ]);
    });

    test('keeps two versions of the same component apart, since both licenses apply', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });
        addPackage(root, 'map', { name: 'map' });
        writeSidecar(root, 'core', [notice({ name: 'shared', version: '1.0.0' })]);
        writeSidecar(root, 'map', [notice({ name: 'shared', version: '2.0.0' })]);

        expect(aggregate(root, ['core', 'map']).map((entry) => entry.version)).toEqual(['1.0.0', '2.0.0']);
    });

    test('treats a component as shipped when any bundle inlines it', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });
        addPackage(root, 'services', { name: 'services' });
        writeSidecar(root, 'core', [notice({ name: 'thing', bundled: true })]);
        writeSidecar(root, 'services', [notice({ name: 'thing', bundled: false })]);

        expect(aggregate(root, ['core', 'services'])[0]).toMatchObject({ bundled: true });
    });

    test('sorts by code point so the committed file does not depend on the runner locale', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });
        writeSidecar(root, 'core', [
            notice({ name: 'zod' }),
            notice({ name: '@turf/turf' }),
            notice({ name: 'lodash-es' }),
            notice({ name: 'Chart.js' }),
        ]);

        expect(aggregate(root, ['core']).map((entry) => entry.name)).toEqual([
            '@turf/turf',
            'Chart.js',
            'lodash-es',
            'zod',
        ]);
    });

    test('is empty for a package whose build found nothing', () => {
        const root = createRepository();
        addPackage(root, 'viewport-places', { name: 'viewport-places' });
        writeSidecar(root, 'viewport-places', []);

        expect(aggregate(root, ['viewport-places'])).toEqual([]);
    });
});

describe('render', () => {
    const target = { ...sdkTarget };

    test('attributes each component to the bundles requiring it when several are merged', () => {
        const rendered = render(target, [{ ...notice({ name: 'lodash-es' }), requiredBy: ['core', 'map'] }]);

        expect(rendered).toContain('Required by: core, map');
    });

    test('omits the attribution for a single package, where it says nothing', () => {
        const single = { ...target, packageDirectories: ['plugins/landmarks-3d'] };

        expect(render(single, [{ ...notice({ name: 'three' }), requiredBy: ['landmarks-3d'] }])).not.toContain(
            'Required by:',
        );
    });

    test('heads the file with the title and subject of its target', () => {
        const rendered = render(target, [{ ...notice({ name: 'zod' }), requiredBy: ['services'] }]);

        expect(rendered).toContain('THIRD-PARTY SOFTWARE NOTICES FOR THE TOMTOM MAPS SDK FOR JAVASCRIPT');
        expect(rendered).toContain('used by the SDK bundles');
    });

    test('drops the header entirely when there is nothing to list', () => {
        expect(render(target, [])).toBe('No third party dependencies.\n');
    });

    test('ends with exactly one newline, so the committed file has no trailing diff noise', () => {
        const rendered = render(target, [{ ...notice({ name: 'zod' }), requiredBy: ['services'] }]);

        expect(rendered.endsWith('\n')).toBe(true);
        expect(rendered.endsWith('\n\n')).toBe(false);
    });
});

describe('staleness', () => {
    const repositoryWithPeer = (installedVersion: string | null) => {
        const root = createRepository(installedVersion ? [{ name: 'zod', version: installedVersion }] : []);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });

        return root;
    };

    test('is silent when the notices match what is installed', () => {
        const root = repositoryWithPeer('4.4.3');

        expect(staleness(root, ['services'], [notice({ name: 'zod', version: '4.4.3', bundled: false })])).toEqual([]);
    });

    test('reports a peer that has been upgraded since the last build', () => {
        const root = repositoryWithPeer('4.4.3');

        expect(staleness(root, ['services'], [notice({ name: 'zod', version: '4.0.0', bundled: false })])).toEqual([
            '  zod: installed 4.4.3, notices record 4.0.0',
        ]);
    });

    test('reports a peer added since the last build', () => {
        const root = repositoryWithPeer('4.4.3');

        expect(staleness(root, ['services'], [])).toEqual(['  zod 4.4.3 is missing from the notices']);
    });

    test('reports a peer that is no longer declared', () => {
        const root = createRepository();
        addPackage(root, 'services', { name: 'services' });

        expect(staleness(root, ['services'], [notice({ name: 'zod', bundled: false })])).toEqual([
            '  zod is in the notices but is no longer a peer dependency',
        ]);
    });

    test('reports a peer that is declared but missing from node_modules', () => {
        const root = repositoryWithPeer(null);

        expect(staleness(root, ['services'], [notice({ name: 'zod', bundled: false })])).toEqual([
            '  zod is declared as a peer dependency but not installed',
        ]);
    });

    test('reports a bundled dependency whose installed version has moved on', () => {
        const root = createRepository();
        addPackage(root, 'core', {
            name: 'core',
            dependencies: [{ name: 'inlined', version: '2.0.0' }],
        });

        expect(staleness(root, ['core'], [notice({ name: 'inlined', version: '1.0.0' })])).toEqual([
            '  inlined: installed 2.0.0, notices record 1.0.0',
        ]);
    });

    test('stays silent for a bundled transitive it cannot resolve — unknown is not stale', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });

        expect(staleness(root, ['core'], [notice({ name: 'deep-transitive', version: '9.9.9' })])).toEqual([]);
    });

    test('collects problems across every package feeding the notice', () => {
        const root = createRepository([
            { name: 'zod', version: '4.4.3' },
            { name: 'lodash-es', version: '4.18.1' },
        ]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });
        addPackage(root, 'core', { name: 'core', peerDependencies: { 'lodash-es': 'catalog:' } });

        expect(staleness(root, ['core', 'services'], [])).toEqual([
            '  lodash-es 4.18.1 is missing from the notices',
            '  zod 4.4.3 is missing from the notices',
        ]);
    });
});

describe('targets', () => {
    test('the SDK target merges the three bundles into the root notice', () => {
        expect(sdkTarget).toMatchObject({ packageDirectories: SDK_BUNDLES, output: 'THIRD_PARTY.txt' });
    });

    test('a package target writes next to that package, titled with its published name', () => {
        const root = createRepository();
        addPackage(root, 'plugins/agent-toolkit', { name: '@tomtom-org/maps-sdk-plugin-agent-toolkit' });

        expect(packageTarget(root, 'plugins/agent-toolkit')).toEqual({
            packageDirectories: ['plugins/agent-toolkit'],
            output: path.join('plugins/agent-toolkit', 'THIRD_PARTY.txt'),
            title: '@tomtom-org/maps-sdk-plugin-agent-toolkit',
            subject: 'this package',
        });
    });
});

describe('pluginPackageDirectories', () => {
    const plugin = (name: string): [string, { name: string; scripts: Record<string, string> }] => [
        `plugins/${name}`,
        { name, scripts: { build: 'vite build' } },
    ];

    test('finds the plugins a build produces output for, in a stable order', () => {
        const root = createRepository();
        for (const name of ['viewport-places', 'agent-toolkit']) addPackage(root, ...plugin(name));

        expect(pluginPackageDirectories(root)).toEqual([
            path.join('plugins', 'agent-toolkit'),
            path.join('plugins', 'viewport-places'),
        ]);
    });

    test('skips directories that no build writes a bundle for', () => {
        const root = createRepository();
        addPackage(root, ...plugin('landmarks-3d'));
        // Source without a package of its own, a package that is never built, and the
        // hoisted install — none of them leave a sidecar to aggregate.
        fs.mkdirSync(path.join(root, 'plugins', 'sprites'), { recursive: true });
        addPackage(root, 'plugins/shared', { name: 'shared' });
        addPackage(root, 'plugins/node_modules/three', { name: 'three' });

        expect(pluginPackageDirectories(root)).toEqual([path.join('plugins', 'landmarks-3d')]);
    });
});

describe('unbuiltPackages', () => {
    test('is empty once every package has left a sidecar behind', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });
        writeSidecar(root, 'core', []);

        expect(unbuiltPackages(root, { ...sdkTarget, packageDirectories: ['core'] })).toEqual([]);
    });

    test('names only the packages that have not been built', () => {
        const root = createRepository();
        for (const bundle of SDK_BUNDLES) addPackage(root, bundle, { name: bundle });
        writeSidecar(root, 'core', []);

        expect(unbuiltPackages(root, sdkTarget)).toEqual(['services', 'map']);
    });

    test('points at the sidecar the build emits', () => {
        expect(sidecarPath('/repo', 'core')).toBe(path.join('/repo', 'core', 'dist', 'third-party.json'));
    });
});

describe('writeNotices', () => {
    test('writes the notice file and reports a clean generation', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });
        writeSidecar(root, 'services', [notice({ name: 'zod', version: '4.4.3', bundled: false })]);

        const result = writeNotices(root, packageTarget(root, 'services'));

        expect(result).toEqual({ components: 1, problems: [], written: true });
        expect(fs.readFileSync(path.join(root, 'services', 'THIRD_PARTY.txt'), 'utf-8')).toContain('Name: zod');
    });

    test('refuses to write when the sidecar has fallen behind, and says how', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });
        writeSidecar(root, 'services', [notice({ name: 'zod', version: '4.0.0', bundled: false })]);

        const { problems, written } = writeNotices(root, packageTarget(root, 'services'));

        expect(written).toBe(false);
        expect(problems).toEqual(['  zod: installed 4.4.3, notices record 4.0.0']);
        expect(fs.existsSync(path.join(root, 'services', 'THIRD_PARTY.txt'))).toBe(false);
    });

    test('leaves an already-correct notice untouched rather than replacing it with a stale one', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });
        const output = path.join(root, 'services', 'THIRD_PARTY.txt');
        // What a build against the current dependencies committed.
        fs.writeFileSync(output, 'Name: zod\nVersion: 4.4.3\n');
        // What an older build left in dist/, e.g. after switching branches.
        writeSidecar(root, 'services', [notice({ name: 'zod', version: '4.0.0', bundled: false })]);

        writeNotices(root, packageTarget(root, 'services'));

        expect(fs.readFileSync(output, 'utf-8')).toBe('Name: zod\nVersion: 4.4.3\n');
    });

    test('generating twice from the same input produces the same file', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });
        writeSidecar(root, 'core', [notice({ name: 'a' }), notice({ name: 'b' })]);
        const target = packageTarget(root, 'core');
        const output = path.join(root, 'core', 'THIRD_PARTY.txt');

        writeNotices(root, target);
        const first = fs.readFileSync(output, 'utf-8');
        writeNotices(root, target);

        expect(fs.readFileSync(output, 'utf-8')).toBe(first);
    });

    test('records a package with no third-party code rather than leaving no file', () => {
        const root = createRepository();
        addPackage(root, 'viewport-places', { name: 'viewport-places' });
        writeSidecar(root, 'viewport-places', []);

        const { components } = writeNotices(root, packageTarget(root, 'viewport-places'));

        expect(components).toBe(0);
        expect(fs.readFileSync(path.join(root, 'viewport-places', 'THIRD_PARTY.txt'), 'utf-8')).toBe(
            'No third party dependencies.\n',
        );
    });
});
