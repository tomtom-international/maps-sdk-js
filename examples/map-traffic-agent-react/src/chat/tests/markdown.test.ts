import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../markdown';

describe('renderMarkdown', () => {
    it('renders markdown', () => {
        expect(renderMarkdown('**bold** and [docs](https://example.com)')).toBe(
            '<p><strong>bold</strong> and <a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a></p>\n',
        );
    });

    it('keeps character entities', () => {
        expect(renderMarkdown('&nbsp;')).toBe('<p>&nbsp;</p>\n');
    });

    it('renders raw HTML as text', () => {
        const html = renderMarkdown('Comment: <img src=x onerror="alert(1)">');
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    });

    it('renders a block of raw HTML as text', () => {
        expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
    });

    it('renders an image as its alt text, so nothing loads', () => {
        expect(renderMarkdown('![a <b>](https://example.com/p.gif?d=1)')).toBe('<p>a &lt;b&gt;</p>\n');
    });

    it('keeps an in-page link in the same tab', () => {
        expect(renderMarkdown('[results](#results)')).toBe('<p><a href="#results">results</a></p>\n');
    });

    it('drops the target of a script link and keeps its label', () => {
        const html = renderMarkdown('[open](javascript:alert(1))');
        expect(html).not.toContain('href');
        expect(html).toContain('open');
    });
});
