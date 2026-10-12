const versionPattern = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;

/** A tag of one SDK release: `v` and its semver version. */
export const releaseTagPattern = new RegExp(`^v${versionPattern.source.slice(1)}`);

/** Semver precedence, newest first: a release ranks above its prereleases. */
export const byVersionDescending = (left: string, right: string): number => {
    const [leftParts, rightParts] = [parseVersion(left), parseVersion(right)];
    for (let i = 0; i < 3; i++) {
        if (leftParts.core[i] !== rightParts.core[i]) return rightParts.core[i] - leftParts.core[i];
    }
    if (!leftParts.prerelease.length || !rightParts.prerelease.length) {
        return leftParts.prerelease.length - rightParts.prerelease.length;
    }
    return comparePrereleaseDescending(leftParts.prerelease, rightParts.prerelease);
};

type VersionParts = { core: number[]; prerelease: string[] };

const parseVersion = (version: string): VersionParts => {
    const match = versionPattern.exec(version);
    if (!match) throw new Error(`Not a semver version: ${version}`);

    const [, major, minor, patch, prerelease] = match;
    return { core: [major, minor, patch].map(Number), prerelease: prerelease?.split('.') ?? [] };
};

// Semver precedence of two prerelease lists, newest first; both are non-empty.
const comparePrereleaseDescending = (left: string[], right: string[]): number => {
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const [leftIdentifier, rightIdentifier] = [left[i], right[i]];
        if (leftIdentifier === undefined || rightIdentifier === undefined) return leftIdentifier === undefined ? 1 : -1;

        if (leftIdentifier !== rightIdentifier) return compareIdentifierDescending(leftIdentifier, rightIdentifier);
    }
    return 0;
};

// Semver: numeric identifiers rank below alphanumeric ones, and those compare in ASCII order.
const compareIdentifierDescending = (left: string, right: string): number => {
    const [leftNumeric, rightNumeric] = [isNumeric(left), isNumeric(right)];
    if (leftNumeric && rightNumeric) return Number(right) - Number(left);

    if (leftNumeric !== rightNumeric) return leftNumeric ? 1 : -1;

    return left > right ? -1 : 1;
};

const isNumeric = (identifier: string) => /^\d+$/.test(identifier);
