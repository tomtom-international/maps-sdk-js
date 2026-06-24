import { describe, expect, it } from 'vitest';
import type { ToolMetadata } from '../../types';
import { buildClassifySystemPrompt, extractLastUserText } from '../intent-classifier';

describe('buildClassifySystemPrompt', () => {
    const metadata = {
        getTrafficIncidents: { classificationPrompt: 'Load incidents in an area' },
        createTracker: {
            classificationPrompt: 'Arm a tracker that alerts',
            dependsOn: ['getTrafficIncidents', 'locatePlace'],
        },
    } as unknown as Record<string, ToolMetadata>;

    it('renders a tool dependsOn as a "Depends on:" hint', () => {
        const prompt = buildClassifySystemPrompt(metadata);
        expect(prompt).toContain(
            'createTracker Arm a tracker that alerts. Depends on: getTrafficIncidents, locatePlace.',
        );
    });

    it('explains that Depends-on prerequisites must be co-picked unless already satisfied', () => {
        const prompt = buildClassifySystemPrompt(metadata);
        expect(prompt).toContain('PREREQUISITES');
        // The directive must tell the classifier to co-pick the prerequisite tools.
        expect(prompt).toMatch(/Depends on[^]*ALSO pick/);
        expect(prompt).toMatch(/unless the conversation shows that prerequisite is already satisfied/i);
    });
});

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
