import path from 'node:path';
import { type HeaderTab, isExternal, type MenuItem } from './docsStructure.ts';
import { fenceScripts } from './fenceRenderers.ts';
import { escapeHtml } from './html.ts';
import { PLUGIN_TAG_PREFIX, type Release } from './releases.ts';
import { DOCS_URL } from './siteUrls.ts';

const HEAD_META = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';

/** A page of the site; `siteRoot` is the site's root folder, relative to the page. */
const htmlPage = ({ title, siteRoot, body }: { title: string; siteRoot: string; body: string }): string =>
    `<!doctype html><html lang="en"><head>${HEAD_META}
<title>${escapeHtml(title)}</title><link rel="stylesheet" href="${siteRoot}site.css"></head><body>
${body}</body></html>`;

const brandLink = (siteRoot: string) =>
    `<a class="brand" href="${siteRoot}index.html">TomTom Maps SDK for JavaScript</a>`;

export const guidePage = (page: {
    title: string;
    version: string;
    versionRoot: string;
    header: string;
    menu: string;
    body: string;
}): string =>
    htmlPage({
        title: `${page.title} · Maps SDK for JavaScript ${page.version}`,
        siteRoot: `${page.versionRoot}../`,
        body: `${page.header}
<div class="layout"><aside>${page.menu}</aside><main><h1>${escapeHtml(page.title)}</h1>${page.body}</main></div>
${pickerScript(page.versionRoot)}${fenceScripts(page.body)}`,
    });

/** The header above every page of a version, with the tabs that version's docs list. */
export const versionHeader = ({
    version,
    latestVersion,
    versionRoot,
    tabs,
    activeSection,
}: {
    version: string;
    latestVersion: string;
    versionRoot: string;
    tabs: HeaderTab[];
    /** Undefined for a page that no tab covers. */
    activeSection: string | undefined;
}): string => {
    const tabLinks = tabs
        .map(({ title, href, section }) => {
            const target = isExternal(href) ? href : `${versionRoot}${href}`;
            return `<a href="${target}"${section === activeSection ? ' class="active"' : ''}>${escapeHtml(title)}</a>`;
        })
        .join('\n');
    const siteRoot = `${versionRoot}../`;
    const olderVersionNotice =
        version === latestVersion
            ? ''
            : `<div class="older-version-notice">This is the documentation of version ${version}. <a href="${siteRoot}${latestVersion}/index.html">Go to the latest version, ${latestVersion}</a>.</div>`;
    return `<header class="site-header">${brandLink(siteRoot)}
<nav>${tabLinks}</nav>
<select class="version-picker" aria-label="Version" data-current-version="${version}" data-site-root="${siteRoot}"></select></header>
${olderVersionNotice}`;
};

export const navigationMenu = (items: MenuItem[], section: string, versionRoot: string, currentPage: string): string =>
    `<ul>${items
        .map((item) => {
            const page = item.fileId ? path.posix.join(section, item.fileId.replace(/^\//, '')) : undefined;
            const activeClass = page === currentPage ? ' class="active"' : '';
            const entry = page
                ? `<a href="${versionRoot}${page}.html"${activeClass}>${escapeHtml(item.title)}</a>`
                : `<span>${escapeHtml(item.title)}</span>`;
            return `<li>${entry}${item.items ? navigationMenu(item.items, section, versionRoot, currentPage) : ''}</li>`;
        })
        .join('')}</ul>`;

export const pickerScript = (versionRoot: string) => `<script type="module" src="${versionRoot}../picker.js"></script>`;

export const redirectPage = (target: string) => `<!doctype html><meta http-equiv="refresh" content="0; url=${target}">`;

/** Every release, newest first; `tabsByVersion` holds the header tabs of each version on the site. */
export const landingPage = (releases: Release[], tabsByVersion: Map<string, HeaderTab[]>): string =>
    htmlPage({
        title: 'Maps SDK documentation versions',
        siteRoot: '',
        body: `<header class="site-header">${brandLink('')}</header>
<main class="landing"><h1>Documentation versions</h1>
<p>Each version holds the guides and the API reference as they shipped with that SDK release. The newest
versions are on this site; every version stays in its <code>v&lt;version&gt;</code> tag on GitHub.
The current documentation is on <a href="${DOCS_URL}">docs.tomtom.com</a>.</p>
<table><thead><tr><th>SDK version</th><th>Docs date</th><th>Plugins</th><th>Docs</th></tr></thead><tbody>
${releases.map((release, index) => releaseRow(release, index === 0, tabsByVersion.get(release.version))).join('\n')}</tbody></table></main>`,
    });

// `tabs` is undefined for a version off the site.
const releaseRow = (
    { version, tag, date, pluginTags, githubTreeUrl }: Release,
    isLatest: boolean,
    tabs: HeaderTab[] | undefined,
): string => {
    const versionCell = tabs ? `<a href="${version}/index.html">${version}</a>` : version;
    const pluginList = pluginTags
        .map((pluginTag) => `<code>${escapeHtml(pluginTag.replace(PLUGIN_TAG_PREFIX, ''))}</code>`)
        .join('<br>');
    const docsLinks = tabs
        ? tabs
              .filter(({ href }) => !isExternal(href))
              .map(({ title, href }) => `<a href="${version}/${href}">${escapeHtml(title)}</a>`)
              .join(' · ')
        : `<a href="${githubTreeUrl}">Files on GitHub</a>`;
    return `<tr><td><strong>${versionCell}</strong>${isLatest ? ' <span class="latest-badge">latest</span>' : ''}</td><td>${date}</td><td>${
        pluginList || '—'
    }</td><td>${docsLinks}<br><small><code>${escapeHtml(tag)}</code></small></td></tr>`;
};
