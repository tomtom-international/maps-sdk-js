import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type DocsStructure, type HeaderTab, isExternal, type MenuItem, readDocsStructure } from './docsStructure.ts';
import { renderFence } from './fenceRenderers.ts';
import { pointLinksIntoVersion } from './links.ts';
import { mdxToHtml } from './mdx.ts';
import { guidePage, navigationMenu, pickerScript, redirectPage, versionHeader } from './pages.ts';
import { extractDocs, type Release } from './releases.ts';

export type BuiltVersion = {
    bytes: number;
    tabs: HeaderTab[];
    /** The JSX components the guides use that the site has no HTML for, so their pages show them as text. */
    unknownComponents: string[];
};

type VersionBuild = {
    docsDirectory: string;
    versionDirectory: string;
    version: string;
    latestVersion: string;
    structure: DocsStructure;
};

/** Builds the folder of `release` in `outDirectory` from the `docs/` of its tag. */
export const buildVersion = (
    gitDirectory: string,
    outDirectory: string,
    release: Release,
    latestVersion: string,
): BuiltVersion => {
    const docsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), `docs-${release.version}-`));
    try {
        extractDocs(gitDirectory, release.tag, docsDirectory);
        const versionDirectory = path.join(outDirectory, release.version);
        fs.mkdirSync(versionDirectory, { recursive: true });
        const structure = readDocsStructure(docsDirectory);
        const build = { docsDirectory, versionDirectory, version: release.version, latestVersion, structure };
        const unknownComponents = buildMdxSections(build);
        if (structure.hasApiReference) buildApiReference(build);
        fs.writeFileSync(path.join(versionDirectory, 'index.html'), redirectPage(entryPage(structure)));
        return { bytes: directoryBytes(versionDirectory), tabs: structure.tabs, unknownComponents };
    } finally {
        fs.rmSync(docsDirectory, { recursive: true, force: true });
    }
};

// Returns the JSX components the pages keep as text.
const buildMdxSections = ({ docsDirectory, versionDirectory, version, latestVersion, structure }: VersionBuild) => {
    const unknownComponents = new Set<string>();
    for (const { section, menu } of structure.mdxSections) {
        for (const file of listFiles(path.join(docsDirectory, section))) {
            const relativePath = path.relative(docsDirectory, file);
            const target = path.join(versionDirectory, relativePath);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            if (!file.endsWith('.mdx')) {
                if (!file.endsWith('.yml')) fs.copyFileSync(file, target);

                continue;
            }
            const versionRoot = versionRootOf(relativePath);
            const mdx = mdxToHtml(fs.readFileSync(file, 'utf8'), renderFence);
            for (const component of mdx.unknownComponents) unknownComponents.add(component);
            const page = guidePage({
                title: mdx.title,
                version,
                versionRoot,
                header: versionHeader({
                    version,
                    latestVersion,
                    versionRoot,
                    tabs: structure.tabs,
                    activeSection: section,
                }),
                menu: navigationMenu(menu, section, versionRoot, relativePath.replace(/\.mdx$/, '')),
                body: pointLinksIntoVersion(mdx.html, versionRoot),
            });
            fs.writeFileSync(target.replace(/\.mdx$/, '.html'), page);
        }
    }
    return [...unknownComponents].sort((left, right) => left.localeCompare(right));
};

// The API reference stays as typedoc built it, with the version header above its own header.
const buildApiReference = ({ docsDirectory, versionDirectory, version, latestVersion, structure }: VersionBuild) => {
    const referenceDirectory = path.join(versionDirectory, 'api-reference');
    fs.cpSync(path.join(docsDirectory, 'api-reference'), referenceDirectory, { recursive: true });
    for (const file of listFiles(referenceDirectory).filter((file) => file.endsWith('.html'))) {
        const versionRoot = versionRootOf(path.relative(versionDirectory, file));
        const header = versionHeader({
            version,
            latestVersion,
            versionRoot,
            tabs: structure.tabs,
            activeSection: structure.apiReferenceSection,
        });
        const html = fs
            .readFileSync(file, 'utf8')
            .replace(/<body([^>]*)>/, `<body$1><link rel="stylesheet" href="${versionRoot}../site.css">${header}`)
            .replace('</body>', `${pickerScript(versionRoot)}</body>`);
        fs.writeFileSync(file, html);
    }
};

// The landing page and the picker open a version at its `index.html`, so every version has a page to send it to:
// its first local tab, else its first menu page, else its API reference.
const entryPage = ({ tabs, mdxSections, hasApiReference }: DocsStructure): string => {
    const firstTab = tabs.find(({ href }) => !isExternal(href))?.href;
    if (firstTab) return firstTab;

    const firstMenuPage = mdxSections
        .flatMap(({ section, menu }) => menuPages(menu).map((page) => path.posix.join(section, page)))
        .at(0);
    if (firstMenuPage) return `${firstMenuPage}.html`;

    return hasApiReference ? 'api-reference/index.html' : '../index.html';
};

const menuPages = (items: MenuItem[]): string[] =>
    items.flatMap(({ fileId, items: children }) => [
        ...(fileId ? [fileId.replace(/^\//, '')] : []),
        ...menuPages(children ?? []),
    ]);

/** The version folder, relative to the file at `relativePath` in it. */
const versionRootOf = (relativePath: string) => '../'.repeat(relativePath.split('/').length - 1);

const listFiles = (directory: string) =>
    fs
        .readdirSync(directory, { withFileTypes: true, recursive: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath, entry.name));

const directoryBytes = (directory: string) =>
    listFiles(directory).reduce((total, file) => total + fs.statSync(file).size, 0);
