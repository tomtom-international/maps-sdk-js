import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ThirdPartyNotice } from '../thirdPartyNotices.ts';

/**
 * Builds throwaway package trees on disk. The notice generators read `package.json`,
 * `node_modules` and `dist/third-party.json` through the real filesystem — resolution order
 * and the walk up to a parent `node_modules` are most of what is worth testing, so the tests
 * give them a real tree rather than mocking `node:fs`.
 */

/** A package to materialise: its manifest, plus the licence files it ships. */
export type PackageSpec = {
    name: string;
    version?: string;
    license?: string;
    description?: string;
    homepage?: string;
    repository?: string | { url?: string };
    author?: string | { name?: string; email?: string; url?: string };
    contributors?: (string | { name?: string; email?: string; url?: string })[];
    peerDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    /** Extra files, by name relative to the package directory (`LICENSE`, `NOTICE`, …). */
    files?: Record<string, string>;
    /** Packages to install under this one's `node_modules`. */
    dependencies?: PackageSpec[];
};

const writePackage = (directory: string, spec: PackageSpec): void => {
    const { files, dependencies, ...manifest } = spec;
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest, null, 2));

    for (const [name, contents] of Object.entries(files ?? {})) fs.writeFileSync(path.join(directory, name), contents);

    for (const dependency of dependencies ?? [])
        writePackage(path.join(directory, 'node_modules', dependency.name), dependency);
};

/**
 * Creates a temporary repository root, removed again when the test run ends.
 * @param installed Packages to place in the root `node_modules`, as a workspace install would.
 */
export const createRepository = (installed: PackageSpec[] = []): string => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'third-party-'));
    for (const spec of installed) writePackage(path.join(root, 'node_modules', spec.name), spec);

    return root;
};

/**
 * Adds a workspace package to a repository.
 * @param root Repository root.
 * @param directory Repo-relative directory of the package.
 * @param spec The package to write.
 */
export const addPackage = (root: string, directory: string, spec: PackageSpec): string => {
    const packageDirectory = path.join(root, directory);
    writePackage(packageDirectory, spec);

    return packageDirectory;
};

/**
 * Writes the `dist/third-party.json` sidecar a build would leave behind.
 * @param root Repository root.
 * @param directory Repo-relative directory of the package.
 * @param notices Components the build recorded.
 */
export const writeSidecar = (root: string, directory: string, notices: ThirdPartyNotice[]): void => {
    const distDirectory = path.join(root, directory, 'dist');
    fs.mkdirSync(distDirectory, { recursive: true });
    fs.writeFileSync(path.join(distDirectory, 'third-party.json'), JSON.stringify(notices, null, 2));
};

/**
 * A notice as a sidecar records it, with everything optional defaulted.
 * @param overrides Fields to set on top of a minimal bundled component.
 */
export const notice = (overrides: Partial<ThirdPartyNotice> & { name: string }): ThirdPartyNotice => ({
    version: '1.0.0',
    license: 'MIT',
    bundled: true,
    ...overrides,
});
