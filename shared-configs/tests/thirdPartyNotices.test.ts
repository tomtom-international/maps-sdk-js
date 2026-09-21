import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
    collectThirdPartyNotices,
    formatNotice,
    joinSections,
    readInstalledPeerVersions,
    readInstalledVersion,
    readPackageName,
    renderThirdPartyNotices,
    type ThirdPartyNotice,
} from '../thirdPartyNotices.ts';
import { addPackage, createRepository, notice } from './fixtures.ts';

// rollup-plugin-license hands the output template `author`/`contributors` as objects with a
// `text()` method rather than strings, so the fakes have to keep that shape.
const person = (text: string) => ({ text: () => text });

describe('readInstalledVersion', () => {
    test('reads the version installed in the package itself', () => {
        const root = createRepository();
        addPackage(root, 'core', {
            name: 'core',
            dependencies: [{ name: 'lodash-es', version: '4.18.1' }],
        });

        expect(readInstalledVersion(path.join(root, 'core'), 'lodash-es')).toBe('4.18.1');
    });

    test('walks up to a hoisted install when the package has none of its own', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services' });

        expect(readInstalledVersion(path.join(root, 'services'), 'zod')).toBe('4.4.3');
    });

    test('prefers the nearest install over the hoisted one', () => {
        const root = createRepository([{ name: 'zod', version: '3.0.0' }]);
        addPackage(root, 'services', {
            name: 'services',
            dependencies: [{ name: 'zod', version: '4.4.3' }],
        });

        expect(readInstalledVersion(path.join(root, 'services'), 'zod')).toBe('4.4.3');
    });

    test('is null for a package that is not installed anywhere above it', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });

        expect(readInstalledVersion(path.join(root, 'core'), 'not-installed')).toBeNull();
    });
});

describe('readInstalledPeerVersions', () => {
    test('resolves each declared peer to its installed version', () => {
        const root = createRepository([
            { name: 'lodash-es', version: '4.18.1' },
            { name: 'zod', version: '4.4.3' },
        ]);
        addPackage(root, 'services', {
            name: 'services',
            peerDependencies: { 'lodash-es': 'catalog:', zod: 'catalog:' },
        });

        expect([...readInstalledPeerVersions(path.join(root, 'services'))]).toEqual([
            ['lodash-es', '4.18.1'],
            ['zod', '4.4.3'],
        ]);
    });

    test('skips our own packages, which the SDK license already covers', () => {
        const root = createRepository([{ name: 'three', version: '0.100.0' }]);
        addPackage(root, 'plugin', {
            name: 'plugin',
            peerDependencies: { '@tomtom-org/maps-sdk': 'workspace:*', three: 'catalog:' },
        });

        expect([...readInstalledPeerVersions(path.join(root, 'plugin')).keys()]).toEqual(['three']);
    });

    test('reports a declared but uninstalled peer as null rather than omitting it', () => {
        const root = createRepository();
        addPackage(root, 'map', { name: 'map', peerDependencies: { 'maplibre-gl': 'catalog:' } });

        expect(readInstalledPeerVersions(path.join(root, 'map')).get('maplibre-gl')).toBeNull();
    });

    test('is empty when nothing is peered', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });

        expect(readInstalledPeerVersions(path.join(root, 'core')).size).toBe(0);
    });
});

describe('collectThirdPartyNotices', () => {
    test('records the installed version of a peer, not the catalog alias', () => {
        const root = createRepository([
            {
                name: 'zod',
                version: '4.4.3',
                license: 'MIT',
                description: 'schema validation',
                homepage: 'https://zod.dev',
                repository: { url: 'git+https://github.com/colinhacks/zod.git' },
                author: { name: 'Colin McDonnell', email: 'zod@colinhacks.com' },
                files: { LICENSE: 'MIT License\n\nCopyright (c) 2025\n' },
            },
        ]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });

        const [peer] = collectThirdPartyNotices(path.join(root, 'services'), []);

        expect(peer).toMatchObject({
            name: 'zod',
            version: '4.4.3',
            license: 'MIT',
            bundled: false,
            homepage: 'https://zod.dev',
            repository: 'git+https://github.com/colinhacks/zod.git',
            author: 'Colin McDonnell <zod@colinhacks.com>',
        });
        expect(peer.licenseText).toContain('Copyright (c) 2025');
    });

    test('picks up LICENCE and NOTICE files whatever their spelling and extension', () => {
        const root = createRepository([
            {
                name: 'apache-thing',
                version: '2.0.0',
                files: { 'licence.md': 'Apache 2.0 text', 'NOTICE.txt': 'attribution notice' },
            },
        ]);
        addPackage(root, 'core', { name: 'core', peerDependencies: { 'apache-thing': 'catalog:' } });

        const [peer] = collectThirdPartyNotices(path.join(root, 'core'), []);

        expect(peer.licenseText).toBe('Apache 2.0 text');
        expect(peer.noticeText).toBe('attribution notice');
    });

    test('formats string and object contributors alike, dropping nameless ones', () => {
        const root = createRepository([
            {
                name: 'many-hands',
                version: '1.0.0',
                contributors: [
                    'Ada Lovelace <ada@example.com>',
                    { name: 'Grace Hopper', url: 'https://example.com' },
                    { email: 'anonymous@example.com' },
                ],
            },
        ]);
        addPackage(root, 'core', { name: 'core', peerDependencies: { 'many-hands': 'catalog:' } });

        const [peer] = collectThirdPartyNotices(path.join(root, 'core'), []);

        expect(peer.contributors).toEqual(['Ada Lovelace <ada@example.com>', 'Grace Hopper (https://example.com)']);
    });

    test('throws with an actionable message when a declared peer is not installed', () => {
        const root = createRepository();
        addPackage(root, 'map', { name: 'map', peerDependencies: { 'maplibre-gl': 'catalog:' } });

        expect(() => collectThirdPartyNotices(path.join(root, 'map'), [])).toThrow(/maplibre-gl.*pnpm install/s);
    });

    test('drops bundler-reported externals that are really peers, so they are listed once', () => {
        const root = createRepository([{ name: 'h3-js', version: '4.5.0' }]);
        addPackage(root, 'plugin', { name: 'plugin', peerDependencies: { 'h3-js': 'catalog:' } });

        // rolldown reports some externalized modules in `chunk.modules`, so the plugin sees
        // h3-js as bundled even though the output only imports it.
        const notices = collectThirdPartyNotices(path.join(root, 'plugin'), [
            { name: 'h3-js', version: '4.5.0', license: 'Apache-2.0' },
        ]);

        expect(notices).toHaveLength(1);
        expect(notices[0]).toMatchObject({ name: 'h3-js', bundled: false });
    });

    test('keeps genuinely bundled dependencies alongside the peers', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });

        const notices = collectThirdPartyNotices(path.join(root, 'services'), [
            {
                name: 'tiny-inlined',
                version: '2.1.0',
                license: 'ISC',
                author: person('Someone <someone@example.com>'),
                contributors: [person('Helper')],
            },
        ]);

        expect(notices.map((entry) => [entry.name, entry.bundled])).toEqual([
            ['tiny-inlined', true],
            ['zod', false],
        ]);
        expect(notices[0]).toMatchObject({ author: 'Someone <someone@example.com>', contributors: ['Helper'] });
    });

    test('keeps an unnamed bundled module rather than dropping it from the notices', () => {
        const root = createRepository();
        addPackage(root, 'core', { name: 'core' });

        const notices = collectThirdPartyNotices(path.join(root, 'core'), [
            { name: null, version: null, license: null },
        ]);

        expect(notices[0]).toMatchObject({ name: 'unknown', version: null, bundled: true });
    });
});

describe('formatNotice', () => {
    const full: ThirdPartyNotice = {
        name: 'example',
        version: '1.2.3',
        license: 'MIT',
        bundled: false,
        description: 'an example',
        repository: 'https://github.com/example/example',
        homepage: 'https://example.com',
        author: 'Ada <ada@example.com>',
        contributors: ['Grace'],
        licenseText: 'MIT License',
        noticeText: 'attribution',
    };

    test('marks a peer dependency as not bundled', () => {
        expect(formatNotice(full)).toContain('Bundled: false (peer dependency)');
        expect(formatNotice({ ...full, bundled: true })).toContain('Bundled: true');
    });

    test('renders every populated field, license and notice text included', () => {
        const rendered = formatNotice(full);

        expect(rendered).toContain('Name: example');
        expect(rendered).toContain('Version: 1.2.3');
        expect(rendered).toContain('License: MIT');
        expect(rendered).toContain('Description: an example');
        expect(rendered).toContain('Repository: https://github.com/example/example');
        expect(rendered).toContain('Homepage: https://example.com');
        expect(rendered).toContain('Author: Ada <ada@example.com>');
        expect(rendered).toContain('Contributors:\n  Grace');
        expect(rendered).toContain('License Text:');
        expect(rendered).toContain('MIT License');
        expect(rendered).toContain('Notice:');
        expect(rendered).toContain('attribution');
    });

    test('omits optional fields that are absent instead of printing empty labels', () => {
        const rendered = formatNotice({ name: 'bare', version: '1.0.0', license: 'MIT', bundled: true });

        expect(rendered).toBe('Name: bare\nVersion: 1.0.0\nLicense: MIT\nBundled: true');
    });

    test('appends the extra header lines a caller supplies', () => {
        expect(formatNotice(full, ['Required by: core, map'])).toContain('Required by: core, map');
    });
});

describe('joinSections', () => {
    test('says so explicitly when a package has no third-party code', () => {
        expect(joinSections([])).toBe('No third party dependencies.');
    });

    test('separates sections with a rule', () => {
        expect(joinSections(['first', 'second'])).toBe(`first\n\n${'-'.repeat(80)}\n\nsecond`);
    });
});

describe('renderThirdPartyNotices', () => {
    test('splits bundled and peer components into their own explained sections', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });

        const rendered = renderThirdPartyNotices(path.join(root, 'services'), [
            { name: 'inlined', version: '1.0.0', license: 'ISC' },
        ]);

        expect(rendered).toContain('are bundled into this package');
        expect(rendered).toContain('declared as peer dependencies');
        expect(rendered.indexOf('Name: inlined')).toBeLessThan(rendered.indexOf('Name: zod'));
    });

    test('emits only the peer section when nothing is bundled', () => {
        const root = createRepository([{ name: 'zod', version: '4.4.3' }]);
        addPackage(root, 'services', { name: 'services', peerDependencies: { zod: 'catalog:' } });

        const rendered = renderThirdPartyNotices(path.join(root, 'services'), []);

        expect(rendered).not.toContain('are bundled into this package');
        expect(rendered).toContain('declared as peer dependencies');
    });

    test('falls back to the no-dependencies line for a package with neither', () => {
        const root = createRepository();
        addPackage(root, 'viewport-places', { name: 'viewport-places' });

        expect(renderThirdPartyNotices(path.join(root, 'viewport-places'), [])).toBe('No third party dependencies.');
    });
});

describe('readPackageName', () => {
    test('reads the published name used to title a notice file', () => {
        const root = createRepository();
        addPackage(root, 'plugins/agent-toolkit', { name: '@tomtom-org/maps-sdk-plugin-agent-toolkit' });

        expect(readPackageName(path.join(root, 'plugins/agent-toolkit'))).toBe(
            '@tomtom-org/maps-sdk-plugin-agent-toolkit',
        );
    });
});

describe('notice fixture', () => {
    test('defaults to a bundled MIT component', () => {
        expect(notice({ name: 'x' })).toEqual({ name: 'x', version: '1.0.0', license: 'MIT', bundled: true });
    });
});
