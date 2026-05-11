import { describe, expect, it } from 'vitest';
import { resolveTools } from '../resolve-tools';
import type { ToolEntry } from '../types';

/** Minimal ToolEntry stub for testing. */
function stubTool(description: string): ToolEntry {
    return {
        description,
        inputSchema: { type: 'object' } as any,
        execute: async () => ({ ok: true }),
    };
}

const toolA = stubTool('Tool A');
const toolB = stubTool('Tool B');
const toolC = stubTool('Tool C');

const defaults: Record<string, ToolEntry> = {
    alpha: toolA,
    beta: toolB,
};

describe('resolveTools', () => {
    it('returns a copy of defaults when overrides is undefined', () => {
        const result = resolveTools(defaults, undefined);
        expect(Object.keys(result)).toEqual(['alpha', 'beta']);
        expect(result).not.toBe(defaults);
    });

    it('returns a copy of defaults when overrides is empty', () => {
        const result = resolveTools(defaults, {});
        expect(Object.keys(result)).toEqual(['alpha', 'beta']);
        expect(result).not.toBe(defaults);
    });

    it('adds a new tool alongside defaults', () => {
        const result = resolveTools(defaults, { gamma: toolC });
        expect(Object.keys(result)).toEqual(['alpha', 'beta', 'gamma']);
        expect(result.gamma).toBe(toolC);
    });

    it('removes a default tool with false', () => {
        const result = resolveTools(defaults, { beta: false });
        expect(Object.keys(result)).toEqual(['alpha']);
    });

    it('false for non-existent tool is a no-op', () => {
        const result = resolveTools(defaults, { nonExistent: false });
        expect(Object.keys(result)).toEqual(['alpha', 'beta']);
    });

    it('replaces a default tool with a new ToolEntry', () => {
        const replacement = stubTool('Replaced A');
        const result = resolveTools(defaults, { alpha: replacement });
        expect(result.alpha).toBe(replacement);
        expect((result.alpha as ToolEntry).description).toBe('Replaced A');
    });

    it('handles add + remove + replace in one call', () => {
        const replacedBeta = stubTool('New Beta');
        const result = resolveTools(defaults, {
            alpha: false,
            beta: replacedBeta,
            gamma: toolC,
        });
        expect(Object.keys(result)).toEqual(['beta', 'gamma']);
        expect(result.beta).toBe(replacedBeta);
        expect(result.gamma).toBe(toolC);
    });

    it('removes a default tool with undefined', () => {
        const result = resolveTools(defaults, { beta: undefined });
        expect(Object.keys(result)).toEqual(['alpha']);
    });

    it('does not mutate the defaults object', () => {
        const defaultsCopy = { ...defaults };
        resolveTools(defaults, { alpha: false, gamma: toolC });
        expect(defaults).toEqual(defaultsCopy);
    });

    it('works with empty defaults (start from scratch)', () => {
        const result = resolveTools({}, { gamma: toolC });
        expect(Object.keys(result)).toEqual(['gamma']);
        expect(result.gamma).toBe(toolC);
    });
});
