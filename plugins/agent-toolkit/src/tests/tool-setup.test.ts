import { describe, expect, it, vi } from 'vitest';
import { setupTools } from '../tool-setup';
import type { ToolEntry, ToolState } from '../types';

const mockState = {
    places: { entries: [] },
    mapPOIs: {},
    routing: { entries: [] },
    baseMap: {},
    traffic: {},
    ranges: { entries: [] },
    custom: { data: 'test' },
} as unknown as ToolState & { custom: { data: string } };

describe('setupTools', () => {
    it('binds state to tool execute', async () => {
        const executeFn = vi.fn().mockResolvedValue({ ok: true });
        const toolEntries: Record<string, ToolEntry<any>> = {
            myTool: {
                description: 'Test tool',
                inputSchema: { type: 'object', properties: {} } as any,
                execute: executeFn,
                classificationPrompt: 'test',
            },
        };

        const { tools } = setupTools(toolEntries, mockState);

        await (tools.myTool as any).execute({ query: 'hello' });

        expect(executeFn).toHaveBeenCalledWith({ query: 'hello' }, mockState);
    });
});
