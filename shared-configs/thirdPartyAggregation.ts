import fs from 'node:fs';
import path from 'node:path';
import {
    formatNotice,
    joinSections,
    NOTICE_SEPARATOR,
    readInstalledPeerVersions,
    readInstalledVersion,
    readPackageName,
    type ThirdPartyNotice,
} from './thirdPartyNotices.ts';

/**
 * Builds the `THIRD_PARTY.txt` a `LICENSE.txt` points at from the `dist/third-party.json`
 * sidecars the builds emit.
 *
 * Everything here takes the repository root as an argument rather than deriving it, so the
 * behaviour can be exercised against a fixture tree; `aggregateThirdParty.ts` is the CLI
 * that binds it to the real one.
 */

/** Bundles published together as `@tomtom-org/maps-sdk`, merged into the root notice. */
export const SDK_BUNDLES = ['core', 'services', 'map'];

/** One notice file: which packages feed it, where it goes and how it introduces itself. */
export type NoticeTarget = {
    packageDirectories: string[];
    /** Repo-relative path of the notice file to write. */
    output: string;
    title: string;
    subject: string;
};

type AggregatedNotice = ThirdPartyNotice & { requiredBy: string[] };

const header = (title: string, subject: string): string =>
    [
        `THIRD-PARTY SOFTWARE NOTICES FOR ${title}`,
        '',
        `This file lists the third-party components used by ${subject}, together with`,
        'their licenses. It is generated from the build output — do not edit it by hand.',
        '',
        'Components marked "Bundled: false (peer dependency)" are not shipped inside it:',
        'your package manager installs them alongside it and your application bundles them.',
        'The licenses below apply to those copies, and each such component may in turn install',
        'its own dependencies under their own licenses.',
        '',
        'The software itself is licensed under the terms in LICENSE.txt, which is not affected',
        'by the licenses reproduced here.',
    ].join('\n');

/**
 * Path of the machine-readable notice a package's build leaves behind.
 * @param repositoryRoot Root the package directory is relative to.
 * @param packageDirectory Repo-relative directory of the package.
 */
export const sidecarPath = (repositoryRoot: string, packageDirectory: string): string =>
    path.join(repositoryRoot, packageDirectory, 'dist', 'third-party.json');

const readSidecar = (repositoryRoot: string, packageDirectory: string): ThirdPartyNotice[] =>
    JSON.parse(fs.readFileSync(sidecarPath(repositoryRoot, packageDirectory), { encoding: 'utf-8' }));

/**
 * Merges the sidecars of several packages, keeping a component that appears in more than one
 * of them (lodash-es, in all three bundles) once. The same name at two versions stays as two
 * entries, since both licenses would apply.
 * @param repositoryRoot Root the package directories are relative to.
 * @param packageDirectories Packages whose sidecars are merged.
 */
export const aggregate = (repositoryRoot: string, packageDirectories: string[]): AggregatedNotice[] => {
    const aggregated = new Map<string, AggregatedNotice>();
    for (const packageDirectory of packageDirectories) {
        const bundleName = path.basename(packageDirectory);
        for (const notice of readSidecar(repositoryRoot, packageDirectory)) {
            const key = `${notice.name}@${notice.version}`;
            const existing = aggregated.get(key);
            if (existing) {
                existing.requiredBy.push(bundleName);
                // A component bundled by any package is shipped by us, whoever else peers it.
                existing.bundled = existing.bundled || notice.bundled;
                continue;
            }
            aggregated.set(key, { ...notice, requiredBy: [bundleName] });
        }
    }

    // Code point order, not `localeCompare`: the output is committed and diffed in CI, so the
    // ordering must not depend on the ICU locale of whoever ran the build.
    return [...aggregated.values()].sort((first, second) =>
        first.name < second.name ? -1 : Number(first.name > second.name),
    );
};

/**
 * Renders the full text of a notice file.
 * @param target The file being written.
 * @param notices Components to list, already aggregated and sorted.
 */
export const render = (target: NoticeTarget, notices: AggregatedNotice[]): string => {
    // `Required by:` only tells the reader something when several bundles are merged.
    const showRequiredBy = target.packageDirectories.length > 1;
    const body = notices
        .map((notice) => formatNotice(notice, showRequiredBy ? [`Required by: ${notice.requiredBy.join(', ')}`] : []))
        .join(NOTICE_SEPARATOR);

    const sections = notices.length > 0 ? [header(target.title, target.subject), body] : [];

    return `${joinSections(sections)}\n`;
};

const versionMismatch = (name: string, installed: string, recorded: string | null): string =>
    `  ${name}: installed ${installed}, notices record ${recorded}`;

// Peers are fully declarative, so both directions are meaningful: anything declared must be
// in the notices, and anything peer-derived in the notices must still be declared.
const peerProblems = (repositoryRoot: string, packageDirectories: string[], notices: ThirdPartyNotice[]): string[] => {
    const installed = new Map<string, string | null>();
    for (const packageDirectory of packageDirectories)
        for (const [name, version] of readInstalledPeerVersions(path.join(repositoryRoot, packageDirectory)))
            installed.set(name, version);

    const recorded = new Map(
        notices.filter((notice) => !notice.bundled).map((notice) => [notice.name, notice.version]),
    );

    return [
        ...[...installed].flatMap(([name, version]) => {
            if (!recorded.has(name)) return [`  ${name} ${version ?? '(not installed)'} is missing from the notices`];

            if (version === null) return [`  ${name} is declared as a peer dependency but not installed`];

            return recorded.get(name) === version ? [] : [versionMismatch(name, version, recorded.get(name) ?? null)];
        }),
        ...[...recorded.keys()]
            .filter((name) => !installed.has(name))
            .map((name) => `  ${name} is in the notices but is no longer a peer dependency`),
    ];
};

// Bundled components can only be compared on version. Which of them end up inlined is the
// bundler's answer, not something `package.json` states, and the transitive ones are not
// resolvable from the packages themselves — an unresolvable name means unknown, not stale.
const bundledProblems = (repositoryRoot: string, packageDirectories: string[], notices: ThirdPartyNotice[]): string[] =>
    notices
        .filter((notice) => notice.bundled)
        .flatMap((notice) => {
            const installed = packageDirectories
                .map((packageDirectory) =>
                    readInstalledVersion(path.join(repositoryRoot, packageDirectory), notice.name),
                )
                .find((version) => version !== null);

            return !installed || installed === notice.version
                ? []
                : [versionMismatch(notice.name, installed, notice.version)];
        });

/**
 * Ways the notices disagree with what is installed right now, one line each, empty when they
 * agree. The sidecars only change when the bundles are rebuilt, so an install that adds,
 * removes or upgrades a dependency leaves them behind — and regenerating from them would
 * quietly reproduce the old notices.
 * @param repositoryRoot Root the package directories are relative to.
 * @param packageDirectories Packages the notices were built from.
 * @param notices Components the notices record.
 */
export const staleness = (
    repositoryRoot: string,
    packageDirectories: string[],
    notices: ThirdPartyNotice[],
): string[] => [
    ...peerProblems(repositoryRoot, packageDirectories, notices),
    ...bundledProblems(repositoryRoot, packageDirectories, notices),
];

/** The merged notice for the SDK bundles, at the repo root. */
export const sdkTarget: NoticeTarget = {
    packageDirectories: SDK_BUNDLES,
    output: 'THIRD_PARTY.txt',
    title: 'THE TOMTOM MAPS SDK FOR JAVASCRIPT',
    subject: 'the SDK bundles',
};

/**
 * A notice for a single package, written next to that package's own `LICENSE.txt`.
 * @param repositoryRoot Root the package directory is relative to.
 * @param packageDirectory Repo-relative directory of the package.
 */
export const packageTarget = (repositoryRoot: string, packageDirectory: string): NoticeTarget => ({
    packageDirectories: [packageDirectory],
    output: path.join(packageDirectory, 'THIRD_PARTY.txt'),
    title: readPackageName(path.join(repositoryRoot, packageDirectory)),
    subject: 'this package',
});

/** Directory every published plugin lives in, each as its own workspace package. */
const PLUGINS_DIRECTORY = 'plugins';

// Which packages a build produces output for is what `pnpm -F './plugins/*' build` answers,
// and it answers it by looking for the script. A directory without one — `map-effects`, the
// hoisted `node_modules` — has no bundle, so it has nothing to write a notice from.
const hasBuildScript = (packageDirectory: string): boolean => {
    const manifest = path.join(packageDirectory, 'package.json');
    if (!fs.existsSync(manifest)) return false;

    return Boolean(JSON.parse(fs.readFileSync(manifest, { encoding: 'utf-8' })).scripts?.build);
};

/**
 * Repo-relative directories of the plugins that ship a notice of their own. Discovered rather
 * than listed, so a plugin added tomorrow is covered without editing a script. Sorted, since
 * `readdirSync` is not, and the order reaches the console output.
 * @param repositoryRoot Root the returned directories are relative to.
 */
export const pluginPackageDirectories = (repositoryRoot: string): string[] =>
    fs
        .readdirSync(path.join(repositoryRoot, PLUGINS_DIRECTORY), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(PLUGINS_DIRECTORY, entry.name))
        .filter((packageDirectory) => hasBuildScript(path.join(repositoryRoot, packageDirectory)))
        .sort();

/** Packages of a target whose build output is missing, so its notice cannot be regenerated. */
export const unbuiltPackages = (repositoryRoot: string, target: NoticeTarget): string[] =>
    target.packageDirectories.filter(
        (packageDirectory) => !fs.existsSync(sidecarPath(repositoryRoot, packageDirectory)),
    );

/**
 * Regenerates one notice file, unless doing so would make it worse.
 *
 * A stale generation is not written. What lags is the build output, not the file on disk, so
 * rewriting from it would replace a correct committed notice with an older one — and since
 * that leaves the working tree clean, the CI drift check would wave it through. Callers decide
 * how loudly to complain; the file is left exactly as it was.
 * @param repositoryRoot Root the target's paths are relative to.
 * @param target The file to write.
 * @returns How many components the build output lists, whether the file was written, and the
 * staleness lines — empty when the notices match what is installed.
 */
export const writeNotices = (
    repositoryRoot: string,
    target: NoticeTarget,
): { components: number; problems: string[]; written: boolean } => {
    const notices = aggregate(repositoryRoot, target.packageDirectories);
    const problems = staleness(repositoryRoot, target.packageDirectories, notices);
    if (problems.length > 0) return { components: notices.length, problems, written: false };

    fs.writeFileSync(path.join(repositoryRoot, target.output), render(target, notices), { encoding: 'utf-8' });

    return { components: notices.length, problems, written: true };
};
