import fs from 'node:fs';
import path from 'node:path';

/**
 * One third-party component, in the form both `THIRD_PARTY.txt` and the machine-readable
 * `dist/third-party.json` sidecar are rendered from.
 */
export type ThirdPartyNotice = {
    name: string;
    version: string | null;
    license: string | null;
    /** `false` for peer dependencies: required at runtime, installed and bundled by the consumer. */
    bundled: boolean;
    description?: string;
    repository?: string;
    homepage?: string;
    author?: string;
    contributors?: string[];
    licenseText?: string;
    noticeText?: string;
};

// The subset of rollup-plugin-license's `Dependency` we rely on: the plugin hands the
// output template a list of these, one per dependency it found inside the bundle.
type BundledDependency = {
    name: string | null;
    version: string | null;
    license: string | null;
    description?: string | null;
    repository?: { url?: string } | string | null;
    homepage?: string | null;
    author?: { text: () => string } | null;
    contributors?: { text: () => string }[];
    licenseText?: string | null;
    noticeText?: string | null;
};

type PackageManifest = {
    name: string;
    version?: string;
    description?: string;
    license?: string;
    homepage?: string;
    repository?: string | { url?: string };
    author?: string | { name?: string; email?: string; url?: string };
    contributors?: (string | { name?: string; email?: string; url?: string })[];
    peerDependencies?: Record<string, string>;
};

const SEPARATOR = '-'.repeat(80);

export const NOTICE_SEPARATOR = '\n\n---\n\n';

// Plugins peer-depend on the SDK itself; it is covered by this package's own LICENSE.txt,
// not by a third-party notice.
const OWN_SCOPE = '@tomtom-org/';

const BUNDLED_HEADER =
    'The following third-party components are bundled into this package. Their licenses\nare reproduced below.';

const PEER_HEADER = [
    'The following third-party components are declared as peer dependencies. Their code is',
    'NOT bundled into this package: your package manager installs them alongside it and',
    'your application bundles them. The licenses below apply to those copies, and each of',
    'these components may in turn install its own dependencies under their own licenses.',
].join('\n');

const readManifest = (directory: string): PackageManifest =>
    JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), { encoding: 'utf-8' }));

/**
 * Published name of a package, used to title its notice file.
 * @param directory Directory holding the `package.json`.
 */
export const readPackageName = (directory: string): string => readManifest(directory).name;

// Walks up from `cwd` looking for `node_modules/<name>`, mirroring Node resolution without
// relying on the package exposing `./package.json` through its `exports` map.
const resolvePackageDirectory = (cwd: string, name: string): string | null => {
    let directory = cwd;
    for (;;) {
        const candidate = path.join(directory, 'node_modules', name);
        if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;

        const parent = path.dirname(directory);
        if (parent === directory) return null;
        directory = parent;
    }
};

// Picks up LICENSE / LICENCE / NOTICE files whatever their extension and casing.
const readNoticeFile = (packageDirectory: string, pattern: RegExp): string | undefined => {
    const match = fs.readdirSync(packageDirectory).find((entry) => pattern.test(entry));
    if (!match) return undefined;

    return fs.readFileSync(path.join(packageDirectory, match), { encoding: 'utf-8' }).trim();
};

type Person = string | { name?: string; email?: string; url?: string } | undefined;

const formatPerson = (person: Person): string | undefined => {
    if (!person) return undefined;
    if (typeof person === 'string') return person;
    if (!person.name) return undefined;

    const email = person.email ? ` <${person.email}>` : '';
    const url = person.url ? ` (${person.url})` : '';
    return `${person.name}${email}${url}`;
};

const toRepositoryUrl = (repository: PackageManifest['repository']): string | undefined => {
    if (!repository) return undefined;

    return typeof repository === 'string' ? repository : repository.url;
};

// Reads an installed peer dependency straight from node_modules: its resolved version is the
// truth, `package.json` only holds the `catalog:` alias.
const collectPeerNotice = (packageDirectory: string): ThirdPartyNotice => {
    const manifest = readManifest(packageDirectory);

    return {
        name: manifest.name,
        version: manifest.version ?? null,
        license: manifest.license ?? null,
        bundled: false,
        description: manifest.description,
        repository: toRepositoryUrl(manifest.repository),
        homepage: manifest.homepage,
        author: formatPerson(manifest.author),
        contributors: manifest.contributors
            ?.map((contributor) => formatPerson(contributor))
            .filter((contributor): contributor is string => !!contributor),
        licenseText: readNoticeFile(packageDirectory, /^licen[cs]e/i),
        noticeText: readNoticeFile(packageDirectory, /^notice/i),
    };
};

const thirdPartyPeerNames = (manifest: PackageManifest): string[] =>
    Object.keys(manifest.peerDependencies ?? {}).filter((name) => !name.startsWith(OWN_SCOPE));

/**
 * Version of a package as currently installed, or `null` when it cannot be resolved from
 * `cwd` — which for a bundled dependency usually means it is a transitive one, reachable
 * through its parent rather than from the package itself.
 * @param cwd Directory to resolve from.
 * @param name Package to look up.
 */
export const readInstalledVersion = (cwd: string, name: string): string | null => {
    const packageDirectory = resolvePackageDirectory(cwd, name);

    return packageDirectory ? (readManifest(packageDirectory).version ?? null) : null;
};

/**
 * Installed versions of a package's third-party peer dependencies, read from node_modules —
 * the same source `collectThirdPartyNotices` records, but without needing a build. A `null`
 * version means the peer is declared and not installed.
 * @param cwd Directory of the package to inspect.
 */
export const readInstalledPeerVersions = (cwd: string): Map<string, string | null> => {
    const peerNames = thirdPartyPeerNames(readManifest(cwd));

    return new Map(peerNames.map((name) => [name, readInstalledVersion(cwd, name)]));
};

const toNotice = (dependency: BundledDependency): ThirdPartyNotice => ({
    name: dependency.name ?? 'unknown',
    version: dependency.version,
    license: dependency.license,
    bundled: true,
    description: dependency.description ?? undefined,
    repository: toRepositoryUrl(dependency.repository ?? undefined),
    homepage: dependency.homepage ?? undefined,
    author: dependency.author?.text(),
    contributors: dependency.contributors?.map((contributor) => contributor.text()),
    licenseText: dependency.licenseText ?? undefined,
    noticeText: dependency.noticeText ?? undefined,
});

/**
 * Collects every third-party component a package exposes: the dependencies
 * rollup-plugin-license found inside the bundle, plus its `peerDependencies`.
 *
 * Peer dependencies are externalized by `buildExternal`, so the plugin never sees them and
 * would report "No third parties dependencies" for packages whose only third-party code is
 * peered (core, services, map). They still need attribution: the SDK requires them at
 * runtime and the consuming application ships them.
 * @param cwd Directory of the package being built; its `package.json` is read for peers.
 * @param bundled Dependencies passed to the rollup-plugin-license output template.
 */
export const collectThirdPartyNotices = (cwd: string, bundled: BundledDependency[]): ThirdPartyNotice[] => {
    const manifest = readManifest(cwd);
    const peerNames = thirdPartyPeerNames(manifest);

    const peerNotices = peerNames.map((name) => {
        const packageDirectory = resolvePackageDirectory(cwd, name);
        if (!packageDirectory)
            throw new Error(
                `THIRD_PARTY.txt: peer dependency "${name}" of ${manifest.name} is not installed, cannot read its license. Run \`pnpm install\`.`,
            );

        return collectPeerNotice(packageDirectory);
    });

    // rolldown reports some external modules in `chunk.modules`, so rollup-plugin-license
    // lists peer dependencies as bundled even though the output only imports them. The peer
    // notices are authoritative for anything `buildExternal` externalized.
    const bundledNotices = bundled
        .filter((dependency) => !dependency.name || !peerNames.includes(dependency.name))
        .map(toNotice);

    return [...bundledNotices, ...peerNotices];
};

/**
 * Renders one notice in the field layout rollup-plugin-license uses for bundled dependencies.
 * @param notice The component to render.
 * @param extraLines Lines appended to the header block, e.g. which bundles require it.
 */
export const formatNotice = (notice: ThirdPartyNotice, extraLines: string[] = []): string => {
    const lines = [
        `Name: ${notice.name}`,
        `Version: ${notice.version}`,
        `License: ${notice.license}`,
        notice.bundled ? 'Bundled: true' : 'Bundled: false (peer dependency)',
        ...extraLines,
    ];
    if (notice.description) lines.push(`Description: ${notice.description}`);

    if (notice.repository) lines.push(`Repository: ${notice.repository}`);

    if (notice.homepage) lines.push(`Homepage: ${notice.homepage}`);

    if (notice.author) lines.push(`Author: ${notice.author}`);

    if (notice.contributors?.length)
        lines.push('Contributors:', ...notice.contributors.map((contributor) => `  ${contributor}`));

    if (notice.licenseText) lines.push('License Text:', '===', '', notice.licenseText, '');

    if (notice.noticeText) lines.push('Notice:', '===', '', notice.noticeText, '');

    return lines.join('\n');
};

export const joinSections = (sections: string[]): string =>
    sections.length === 0 ? 'No third party dependencies.' : sections.join(`\n\n${SEPARATOR}\n\n`);

const renderSection = (header: string, notices: ThirdPartyNotice[]): string =>
    `${header}\n\n${notices.map((notice) => formatNotice(notice)).join(NOTICE_SEPARATOR)}`;

/**
 * Builds the `THIRD_PARTY.txt` body for a single package, split into a bundled and a peer
 * dependency section.
 * @param cwd Directory of the package being built.
 * @param bundled Dependencies passed to the rollup-plugin-license output template.
 */
export const renderThirdPartyNotices = (cwd: string, bundled: BundledDependency[]): string => {
    const notices = collectThirdPartyNotices(cwd, bundled);
    const bundledNotices = notices.filter((notice) => notice.bundled);
    const peerNotices = notices.filter((notice) => !notice.bundled);

    const sections: string[] = [];
    if (bundledNotices.length > 0) sections.push(renderSection(BUNDLED_HEADER, bundledNotices));

    if (peerNotices.length > 0) sections.push(renderSection(PEER_HEADER, peerNotices));

    return joinSections(sections);
};
