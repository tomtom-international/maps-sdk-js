import { Marked } from 'marked';
import { escapeHtml } from '../agent/methodology';

const SAFE_LINK = /^(https?:|mailto:|#|\/)/i;

// The text reaching the chat can quote user, tool and data strings, so raw HTML renders as text, an
// image as its alt text (nothing loads from the page), and a link that isn't a web, mail or in-page one
// as its label alone; the others, in-page ones aside, open in a new tab, keeping the conversation.
const markdown = new Marked({
    renderer: {
        html: ({ text }) => escapeHtml(text),
        image: ({ text }) => escapeHtml(text),
        link(token) {
            const label = this.parser.parseInline(token.tokens);
            if (!SAFE_LINK.test(token.href)) return label;

            const newTab = token.href.startsWith('#') ? '' : ' target="_blank" rel="noopener noreferrer"';
            return `<a href="${escapeHtml(token.href)}"${newTab}>${label}</a>`;
        },
    },
});

export const renderMarkdown = (text: string): string => markdown.parse(text, { async: false });
