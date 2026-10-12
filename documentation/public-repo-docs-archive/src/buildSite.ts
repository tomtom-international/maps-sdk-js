/**
 * Builds the GitHub Pages site from the `docs/` folder of the archive tags `v<version>`: a folder per version that fits
 * in the budget, and a landing page and a version picker that list every version.
 * Usage: `node src/buildSite.ts <git directory with the tags> <out directory> <site budget in bytes>`
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildVersion } from './buildVersion.ts';
import type { HeaderTab } from './docsStructure.ts';
import { d2KeptAsCodeCount } from './fenceRenderers.ts';
import { landingPage } from './pages.ts';
import { type Release, readReleases } from './releases.ts';

export type SiteSummary = {
    versionCount: number;
    onSiteCount: number;
    siteBytes: number;
    /** Each JSX component the site has no HTML for, with the versions on the site that use it. */
    unknownComponents: Map<string, string[]>;
};

export const buildSite = (gitDirectory: string, outDirectory: string, budgetBytes: number): SiteSummary => {
    if (!Number.isSafeInteger(budgetBytes) || budgetBytes <= 0) {
        throw new Error(`The site budget must be a positive number of bytes, not ${budgetBytes}.`);
    }
    const releases = readReleases(gitDirectory);
    if (releases.length === 0) throw new Error(`${gitDirectory} has no archive tags v<version>.`);
    fs.rmSync(outDirectory, { recursive: true, force: true });
    fs.mkdirSync(outDirectory, { recursive: true });

    const { tabsByVersion, siteBytes, unknownComponents } = buildVersionsWithinBudget(
        gitDirectory,
        outDirectory,
        releases,
        budgetBytes,
    );
    const pickerVersions = releases.map(({ version, githubTreeUrl }) =>
        tabsByVersion.has(version) ? { version } : { version, githubTreeUrl },
    );
    fs.writeFileSync(path.join(outDirectory, 'versions.json'), JSON.stringify(pickerVersions));
    fs.cpSync(path.join(import.meta.dirname, '../assets'), outDirectory, { recursive: true });
    fs.writeFileSync(path.join(outDirectory, 'index.html'), landingPage(releases, tabsByVersion));
    return { versionCount: releases.length, onSiteCount: tabsByVersion.size, siteBytes, unknownComponents };
};

// Newest first: the first version that does not fit ends the site, so the site holds a run of the newest versions.
const buildVersionsWithinBudget = (
    gitDirectory: string,
    outDirectory: string,
    releases: Release[],
    budgetBytes: number,
) => {
    const latestVersion = releases[0].version;
    const tabsByVersion = new Map<string, HeaderTab[]>();
    const unknownComponents = new Map<string, string[]>();
    let siteBytes = 0;
    for (const release of releases) {
        const built = buildVersion(gitDirectory, outDirectory, release, latestVersion);
        if (siteBytes + built.bytes > budgetBytes) {
            fs.rmSync(path.join(outDirectory, release.version), { recursive: true });
            break;
        }
        siteBytes += built.bytes;
        tabsByVersion.set(release.version, built.tabs);
        for (const component of built.unknownComponents) {
            unknownComponents.set(component, [...(unknownComponents.get(component) ?? []), release.version]);
        }
    }
    return { tabsByVersion, siteBytes, unknownComponents };
};

const formatMegabytes = (bytes: number) => `${(bytes / 1e6).toFixed(0)} MB`;

if (import.meta.main) {
    const [gitDirectory, outDirectory, budget, ...extra] = process.argv.slice(2);
    if (!gitDirectory || !outDirectory || !budget || extra.length > 0) {
        console.error(
            'Usage: node src/buildSite.ts <git directory with the tags> <out directory> <site budget in bytes>',
        );
        process.exit(1);
    }
    const budgetBytes = Number(budget);
    const { versionCount, onSiteCount, siteBytes, unknownComponents } = buildSite(
        gitDirectory,
        outDirectory,
        budgetBytes,
    );
    console.log(
        `Built ${onSiteCount} of ${versionCount} versions, ${formatMegabytes(siteBytes)} of ${formatMegabytes(budgetBytes)}; ${d2KeptAsCodeCount()} d2 diagrams kept as code.`,
    );
    // A GitHub Actions annotation: the site still deploys, with the component shown as text.
    for (const [component, versions] of unknownComponents) {
        console.log(
            `::warning::<${component}> has no HTML on the site, so it shows as text in ${versions.join(', ')}.`,
        );
    }
}
