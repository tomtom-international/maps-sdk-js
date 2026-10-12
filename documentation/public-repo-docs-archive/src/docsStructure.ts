import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { DOCS_URL } from './siteUrls.ts';

/** A link of a version's header, as the docs' `top-navigation.yml` lists it. */
export type HeaderTab = {
    title: string;
    /** The tab's page, relative to the version folder, or a docs.tomtom.com URL for a page the site does not hold. */
    href: string;
    /** The top folder of the pages that show the tab as active. */
    section: string;
};

/** An entry of a section's `navigation.yml` menu. */
export type MenuItem = { title: string; fileId?: string; items?: MenuItem[] };

/** What a version's docs hold, read from the docs themselves, so each version keeps the structure it shipped with. */
export type DocsStructure = {
    tabs: HeaderTab[];
    /** Each folder with a `navigation.yml` menu, which the site builds as pages. */
    mdxSections: { section: string; menu: MenuItem[] }[];
    hasApiReference: boolean;
    /** The section of the tab whose page links to the API reference, which its pages show as active. */
    apiReferenceSection: string | undefined;
};

export const readDocsStructure = (docsDirectory: string): DocsStructure => {
    const tabs = readTabs(docsDirectory);
    return {
        tabs,
        mdxSections: fs
            .readdirSync(docsDirectory, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && !LEFT_OUT_SECTIONS.has(entry.name))
            .flatMap(({ name }) => {
                const menu: MenuItem[] | undefined = readYaml(path.join(docsDirectory, name, 'navigation.yml'))?.menu;
                return menu ? [{ section: name, menu }] : [];
            }),
        hasApiReference: fs.existsSync(path.join(docsDirectory, 'api-reference')),
        apiReferenceSection: apiReferenceTab(docsDirectory, tabs)?.section,
    };
};

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** The sections a version's archive leaves out: docs.tomtom.com shows the latest examples only. */
export const LEFT_OUT_SECTIONS = new Set(['examples']);

// A Markdown or HTML link, and one into `api-reference/` from any root a release writes it from.
const anyLink = /(?:\]\(|href=")[^)"\s]+/g;
const intoApiReference = /\bapi-reference\b/;

// More than one page links the API reference, the overview among them; its own tab is the page whose links go there
// the most, in share of all its links.
const apiReferenceTab = (docsDirectory: string, tabs: HeaderTab[]): HeaderTab | undefined => {
    let best: { tab: HeaderTab; share: number } | undefined;
    for (const tab of tabs.filter(({ href }) => !isExternal(href))) {
        const mdx = fs.readFileSync(path.join(docsDirectory, tab.href.replace(/\.html$/, '.mdx')), 'utf8');
        const links = mdx.match(anyLink) ?? [];
        const share = links.filter((link) => intoApiReference.test(link)).length / Math.max(links.length, 1);
        if (share > (best?.share ?? 0)) best = { tab, share };
    }
    return best?.tab;
};

// Without a `top-navigation.yml`, the header has no tabs and the pages still build.
const readTabs = (docsDirectory: string): HeaderTab[] => {
    const groups: MenuItem[] = readYaml(path.join(docsDirectory, 'top-navigation.yml'))?.menu ?? [];
    return groups
        .flatMap((group) => group.items ?? [group])
        .flatMap(({ title, fileId }) => {
            if (!fileId) return [];

            const page = fileId.replace(/^\//, '');
            const section = page.split('/')[0];
            if (LEFT_OUT_SECTIONS.has(section)) return [];

            return [{ title, section, href: localPage(docsDirectory, page) ?? `${DOCS_URL}/${page}` }];
        });
};

// The built page of `page`, relative to the version folder, when the site holds it.
const localPage = (docsDirectory: string, page: string): string | undefined => {
    return [page, `${page}/index`]
        .find((candidate) => fs.existsSync(path.join(docsDirectory, `${candidate}.mdx`)))
        ?.concat('.html');
};

const readYaml = (file: string) => (fs.existsSync(file) ? YAML.parse(fs.readFileSync(file, 'utf8')) : undefined);
