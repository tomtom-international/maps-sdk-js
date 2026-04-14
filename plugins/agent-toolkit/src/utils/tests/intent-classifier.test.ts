import { describe, expect, it } from 'vitest';
import { extractLastUserText } from '../intent-classifier';

describe('extractLastUserText', () => {
    it('extracts text from last user message', () => {
        const messages = [
            { role: 'user', content: 'first message' },
            { role: 'assistant', content: 'response' },
            { role: 'user', content: 'second message' },
        ] as any;

        expect(extractLastUserText(messages)).toBe('second message');
    });

    it('returns null for empty messages', () => {
        expect(extractLastUserText([])).toBeNull();
    });

    it('returns null when no user messages exist', () => {
        const messages = [{ role: 'assistant', content: 'response' }] as any;
        expect(extractLastUserText(messages)).toBeNull();
    });

    it('extracts text from structured content parts', () => {
        const messages = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'hello ' },
                    { type: 'text', text: 'world' },
                ],
            },
        ] as any;

        expect(extractLastUserText(messages)).toBe('hello world');
    });
});
