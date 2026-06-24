import { describe, expect, it } from 'vitest';
import {
    BASE_SYSTEM_PROMPT,
    buildSystemPrompt,
    composeSystemPrompt,
    SYSTEM_PROMPT_SECTIONS,
    type SystemPromptSection,
} from '../system-prompt';

const ALL_SECTIONS: SystemPromptSection[] = [
    'identity',
    'capabilities',
    'rejectionRules',
    'responseFormatting',
    'dataConfidence',
    'toolExecution',
    'sessionState',
];

describe('SYSTEM_PROMPT_SECTIONS', () => {
    it('exposes every named section as a non-empty string', () => {
        for (const key of ALL_SECTIONS) {
            expect(SYSTEM_PROMPT_SECTIONS[key]).toBeTypeOf('string');
            expect(SYSTEM_PROMPT_SECTIONS[key].length).toBeGreaterThan(0);
        }
        // No surprise extra keys beyond the documented set.
        const byLocale = (a: string, b: string) => a.localeCompare(b);
        expect(Object.keys(SYSTEM_PROMPT_SECTIONS).sort(byLocale)).toEqual([...ALL_SECTIONS].sort(byLocale));
    });

    it('stores body text only — headings are not baked into the section values', () => {
        // The composer owns the heading; the stored body must not repeat it.
        expect(SYSTEM_PROMPT_SECTIONS.responseFormatting).not.toContain('RESPONSE FORMATTING');
        expect(SYSTEM_PROMPT_SECTIONS.sessionState).not.toContain('SESSION STATE');
        expect(SYSTEM_PROMPT_SECTIONS.dataConfidence).not.toContain('DATA CONFIDENCE');
    });
});

describe('composeSystemPrompt', () => {
    it('with no overrides equals BASE_SYSTEM_PROMPT', () => {
        expect(composeSystemPrompt()).toBe(BASE_SYSTEM_PROMPT);
    });

    it('renders heading-bearing sections under their auto-prepended heading', () => {
        const prompt = composeSystemPrompt();
        expect(prompt).toContain(`RESPONSE FORMATTING:\n${SYSTEM_PROMPT_SECTIONS.responseFormatting}`);
        expect(prompt).toContain(`SESSION STATE:\n${SYSTEM_PROMPT_SECTIONS.sessionState}`);
        // identity opens the prompt with no heading.
        expect(prompt.startsWith(SYSTEM_PROMPT_SECTIONS.identity)).toBe(true);
    });

    it('replaces only the overridden section and keeps the heading without the caller repeating it', () => {
        const prompt = composeSystemPrompt({ responseFormatting: 'Always respond in Spanish.' });

        // Heading is supplied automatically even though the override omitted it.
        expect(prompt).toContain('RESPONSE FORMATTING:\nAlways respond in Spanish.');
        expect(prompt).not.toContain(SYSTEM_PROMPT_SECTIONS.responseFormatting);
        // Untouched sections survive verbatim.
        expect(prompt).toContain(SYSTEM_PROMPT_SECTIONS.identity);
        expect(prompt).toContain(SYSTEM_PROMPT_SECTIONS.sessionState);
        // Override lands in responseFormatting's canonical slot — directly before DATA CONFIDENCE.
        expect(prompt).toContain('RESPONSE FORMATTING:\nAlways respond in Spanish.\n\nDATA CONFIDENCE:');
    });

    it('extends a section by reading its default from SYSTEM_PROMPT_SECTIONS and appending to it', () => {
        // The documented "take the default and modify it" pattern: read the exported
        // default, derive a new body, and override with the result.
        const extended = `${SYSTEM_PROMPT_SECTIONS.responseFormatting}\n- Always answer in Spanish.`;
        const prompt = composeSystemPrompt({ responseFormatting: extended });

        // The default body is preserved verbatim under its heading, with the extra line appended.
        expect(prompt).toContain(
            `RESPONSE FORMATTING:\n${SYSTEM_PROMPT_SECTIONS.responseFormatting}\n- Always answer in Spanish.`,
        );
        // Other sections are untouched.
        expect(prompt).toContain(SYSTEM_PROMPT_SECTIONS.identity);
    });
});

describe('buildSystemPrompt', () => {
    it('returns the base prompt when given no arguments', () => {
        expect(buildSystemPrompt()).toBe(BASE_SYSTEM_PROMPT);
    });

    it('treats an empty options object as the base prompt', () => {
        expect(buildSystemPrompt({})).toBe(BASE_SYSTEM_PROMPT);
    });

    it('appends a suffix under an ADDITIONAL INSTRUCTIONS heading', () => {
        const result = buildSystemPrompt({ suffix: 'Be terse.' });
        expect(result).toBe(`${BASE_SYSTEM_PROMPT}\n\nADDITIONAL INSTRUCTIONS:\nBe terse.`);
    });

    it('prepends a prefix above the prompt as a heading-less preamble', () => {
        const result = buildSystemPrompt({ prefix: 'You work for Acme Logistics.' });
        expect(result).toBe(`You work for Acme Logistics.\n\n${BASE_SYSTEM_PROMPT}`);
    });

    it('wraps the base with both prefix and suffix', () => {
        const result = buildSystemPrompt({ prefix: 'You work for Acme Logistics.', suffix: 'Be terse.' });
        expect(result).toBe(
            `You work for Acme Logistics.\n\n${BASE_SYSTEM_PROMPT}\n\nADDITIONAL INSTRUCTIONS:\nBe terse.`,
        );
    });

    it('returns the custom prompt verbatim and ignores both prefix and suffix', () => {
        const result = buildSystemPrompt({
            customPrompt: 'Custom prompt.',
            prefix: 'ignored-prefix',
            suffix: 'ignored-suffix',
        });
        expect(result).toBe('Custom prompt.');
    });

    it('composes section overrides onto the base when given a customPrompt object', () => {
        const overrides = { responseFormatting: 'Reply in Spanish.' };
        expect(buildSystemPrompt({ customPrompt: overrides })).toBe(composeSystemPrompt(overrides));
        // The override lands under its heading and the untouched sections survive.
        const result = buildSystemPrompt({ customPrompt: overrides });
        expect(result).toContain('RESPONSE FORMATTING:\nReply in Spanish.');
        expect(result).toContain(SYSTEM_PROMPT_SECTIONS.identity);
    });

    it('treats an empty customPrompt overrides object as the base prompt', () => {
        expect(buildSystemPrompt({ customPrompt: {} })).toBe(BASE_SYSTEM_PROMPT);
    });

    it('appends the suffix after composing section overrides', () => {
        const overrides = { identity: 'You are a fleet dispatcher.' };
        const result = buildSystemPrompt({ customPrompt: overrides, suffix: 'Be terse.' });
        expect(result).toBe(`${composeSystemPrompt(overrides)}\n\nADDITIONAL INSTRUCTIONS:\nBe terse.`);
        expect(result).toContain('You are a fleet dispatcher.');
        expect(result.endsWith('ADDITIONAL INSTRUCTIONS:\nBe terse.')).toBe(true);
    });

    it('wraps composed section overrides with prefix and suffix', () => {
        const overrides = { identity: 'You are a fleet dispatcher.' };
        const result = buildSystemPrompt({
            customPrompt: overrides,
            prefix: 'You work for Acme Logistics.',
            suffix: 'Be terse.',
        });
        expect(result).toBe(
            `You work for Acme Logistics.\n\n${composeSystemPrompt(overrides)}\n\nADDITIONAL INSTRUCTIONS:\nBe terse.`,
        );
        expect(result.startsWith('You work for Acme Logistics.')).toBe(true);
        expect(result.endsWith('ADDITIONAL INSTRUCTIONS:\nBe terse.')).toBe(true);
    });
});
