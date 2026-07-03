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

describe('setupTools onToolExecute', () => {
    const entriesWith = (execute: (input: any, state: any) => Promise<unknown>): Record<string, ToolEntry<any>> => ({
        myTool: {
            description: 'Test tool',
            inputSchema: { type: 'object', properties: {} } as any,
            execute,
            classificationPrompt: 'test',
        },
    });

    it('reports a successful tool call with a duration and isError=false', async () => {
        const onToolExecute = vi.fn();
        const { tools } = setupTools(entriesWith(vi.fn().mockResolvedValue({ ok: true })), mockState, {
            onToolExecute,
        });

        await (tools.myTool as any).execute({});

        expect(onToolExecute).toHaveBeenCalledTimes(1);
        const info = onToolExecute.mock.calls[0][0];
        expect(info.toolName).toBe('myTool');
        expect(info.isError).toBe(false);
        expect(info.errorMessage).toBeUndefined();
        expect(typeof info.durationMs).toBe('number');
    });

    it('flags a returned { error } as a failure', async () => {
        const onToolExecute = vi.fn();
        const { tools } = setupTools(entriesWith(vi.fn().mockResolvedValue({ error: 'no route' })), mockState, {
            onToolExecute,
        });

        await (tools.myTool as any).execute({});

        const info = onToolExecute.mock.calls[0][0];
        expect(info.isError).toBe(true);
        expect(info.errorMessage).toBe('no route');
    });

    it('flags a thrown error as a failure and rethrows', async () => {
        const onToolExecute = vi.fn();
        const { tools } = setupTools(entriesWith(vi.fn().mockRejectedValue(new Error('boom'))), mockState, {
            onToolExecute,
        });

        await expect((tools.myTool as any).execute({})).rejects.toThrow('boom');

        const info = onToolExecute.mock.calls[0][0];
        expect(info.toolName).toBe('myTool');
        expect(info.isError).toBe(true);
        expect(info.errorMessage).toBe('boom');
    });

    it('leaves execute unwrapped when no hook is provided', async () => {
        const execute = vi.fn().mockResolvedValue({ ok: true });
        const { tools } = setupTools(entriesWith(execute), mockState);

        await (tools.myTool as any).execute({ q: 1 });

        expect(execute).toHaveBeenCalledWith({ q: 1 }, mockState);
    });
});
