import { marked } from 'marked';
import YAML from 'yaml';
import { splitAtFences } from './markdownFences.ts';

/** The rendered markup of a fenced block in `language`, or `undefined` to keep the block as code. */
export type RenderFence = (language: string, source: string) => string | undefined;

/**
 * A guide's MDX as its title and HTML body, the links as the MDX writes them, and the JSX components it uses that
 * have no HTML here.
 */
export const mdxToHtml = (
    mdx: string,
    renderFence: RenderFence,
): { title: string; html: string; unknownComponents: string[] } => {
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(mdx);
    const title = frontmatter ? (YAML.parse(frontmatter[1])?.title ?? '') : '';
    const unknownComponents = new Set<string>();
    // Rendered fences go in after the Markdown pass: marked splits an inline SVG at its blank lines.
    const renderedFences: string[] = [];
    const markdown = splitAtFences(frontmatter ? mdx.slice(frontmatter[0].length) : mdx)
        .map((segment) => {
            if (segment.kind === 'prose') {
                const prose = jsxComponentsToMarkdown(segment.rawLines);
                for (const [, component] of prose.replace(inlineCode, '').matchAll(componentTag)) {
                    unknownComponents.add(component);
                }
                return prose;
            }

            const markup = renderFence(segment.language, segment.codeLines.join('\n'));
            if (markup === undefined) return segment.rawLines.join('\n');

            renderedFences.push(markup);
            return `\n<!--fence:${renderedFences.length - 1}-->\n`;
        })
        .join('\n');
    const html = marked
        .parse(markdown, { async: false })
        .replace(/<!--fence:(\d+)-->/g, (_, index) => renderedFences[Number(index)]);
    return { title, html, unknownComponents: [...unknownComponents] };
};

// A JSX component is capitalised, an HTML element is not; inline code may show either as text.
const componentTag = /<([A-Z][A-Za-z0-9.]*)/g;
const inlineCode = /(`+)[\s\S]*?\1/g;

// The guides' JSX components as plain HTML. Their live demos run the latest examples, so the archive leaves them out.
const jsxComponentsToMarkdown = (lines: string[]): string => {
    let insideBlockquote = false;
    return lines
        .filter((line) => !/^(import|export) /.test(line))
        .map((line) => {
            if (/^\s*<\/?Blockquote(\s[^>]*)?>\s*$/.test(line)) {
                insideBlockquote = !line.includes('</');
                return '';
            }
            return insideBlockquote ? `> ${line.trim().replace(/\\$/, '')}` : line;
        })
        .join('\n')
        .replace(/<(GuideDemo|SDKGuideLiveCodingExample)\b[^>]*\/>/g, '')
        .replace(/<Button\b([^>]*)>([\s\S]*?)<\/Button>/g, (_, attributes: string, label: string) => {
            const href = /\bhref="([^"]*)"/.exec(attributes)?.[1] ?? '';
            return `<a class="button" href="${href}" target="_blank" rel="noopener">${label.trim()}</a>`;
        });
};
