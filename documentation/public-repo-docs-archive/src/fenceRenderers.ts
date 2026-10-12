import { execFileSync } from 'node:child_process';
import { escapeHtml } from './html.ts';
import type { RenderFence } from './mdx.ts';

/** Draws the guides' d2 and mermaid fences; every other fence stays code. */
export const renderFence: RenderFence = (language, source) => {
    if (language === 'd2') return renderD2Fence(source);
    if (language === 'mermaid') return `<pre class="mermaid">${escapeHtml(source)}</pre>`;
    return undefined;
};

/** The script that draws a page's mermaid fences, for a page body that has any. */
export const fenceScripts = (body: string): string => (body.includes('class="mermaid"') ? MERMAID_SCRIPT : '');

/** How many d2 diagrams the pages keep as code. */
export const d2KeptAsCodeCount = (): number => [...d2SvgBySource.values()].filter((svg) => svg === undefined).length;

// The same diagram repeats across versions, so each renders once. Without the d2 CLI, or with a diagram it cannot
// render, the page keeps the code block.
const d2SvgBySource = new Map<string, string | undefined>();

const renderD2Fence = (source: string): string | undefined => {
    if (!d2SvgBySource.has(source)) {
        try {
            const svg = execFileSync('d2', ['--layout=elk', '--pad=8', '-', '-'], { input: source, stdio: 'pipe' })
                .toString()
                .replace(/^<\?xml[^>]*>/, '');
            d2SvgBySource.set(source, `<figure class="d2">${svg}</figure>`);
        } catch {
            d2SvgBySource.set(source, undefined);
        }
    }
    return d2SvgBySource.get(source);
};

// Exact, so an archived page draws the same diagrams with each mermaid release.
const MERMAID_SCRIPT = `<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });
</script>`;
