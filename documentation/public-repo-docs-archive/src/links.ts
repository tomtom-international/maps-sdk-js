import { LEFT_OUT_SECTIONS } from './docsStructure.ts';

/** Points the links of a guide page at the same version on this site. */
export const pointLinksIntoVersion = (html: string, versionRoot: string): string =>
    html
        .replace(leftOutSectionLink, '$1')
        .replace(rootApiReferenceLink, `href="${versionRoot}api-reference/$1"`)
        .replace(rootGuideLink, `href="${versionRoot}$1/$2.html$3"`)
        .replace(mdxLink, 'href="$1.html$2"')
        .replace(extensionlessLink, 'href="$1.html$2"');

// A link into a section the archive leaves out keeps its text alone: docs.tomtom.com has the latest version of it only.
const leftOutSectionLink = new RegExp(
    String.raw`<a href="(?:(?:\.\./)+|/maps-sdk-js/|https?://docs\.tomtom\.com/maps-sdk-js/)(?:${[...LEFT_OUT_SECTIONS].join('|')})(?:[/#][^"]*)?"[^>]*>([\s\S]*?)</a>`,
    'g',
);

// From the docs.tomtom.com root, as some releases write them.
const rootApiReferenceLink = /href="(?:\/maps-sdk-js\/|\/?reference\/)api-reference\/?([^"]*)"/g;
const rootGuideLink = /href="(?:\/maps-sdk-js)?\/(introduction|guides|reference)\/([^"#]*?)(?:\.mdx)?(#[^"]*)?"/g;

const mdxLink = /href="([^"#:]+?)\.mdx(#[^"]*)?"/g;

// Some releases leave out the extension: `./routes`.
const extensionlessLink = /href="(\.{1,2}\/(?:[^"#:]*\/)?[^"#:./]+)(#[^"]*)?"/g;
