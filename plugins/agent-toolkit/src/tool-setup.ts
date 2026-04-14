import type { Tool } from 'ai';
import { createHelpTool } from './tools/utilities';
import type { ToolEntry, ToolMetadata, ToolState } from './types';

/** Converts a ToolEntry to an AI SDK Tool, binding state to execute. */
const toAiTool = <S extends ToolState>(entry: ToolEntry<S>, state: S, includeOutputSchema: boolean): Tool =>
    ({
        description: entry.description,
        inputSchema: entry.inputSchema,
        outputSchema: includeOutputSchema ? entry.outputSchema : undefined,
        execute: (input: any) => entry.execute(input, state),
    }) as Tool;

/** Extracts ToolMetadata from a ToolEntry, adding the name. */
const toMetadata = <S extends ToolState>(name: string, entry: ToolEntry<S>): ToolMetadata => ({
    name,
    description: entry.description,
    classificationPrompt: entry.classificationPrompt,
    tags: entry.tags,
    examples: entry.examples,
    examplePrompts: entry.examplePrompts,
    relatedTools: entry.relatedTools,
    dependsOn: entry.dependsOn,
});

/**
 * Converts a composed tool record into AI SDK tools and metadata.
 * Rebinds the help tool with resolved metadata.
 *
 * @ignore
 */
export const setupTools = <S extends ToolState>(
    toolEntries: Record<string, ToolEntry<S>>,
    state: S,
    options?: { outputSchemas?: boolean },
): { tools: Record<string, Tool>; toolsMetadata: Record<string, ToolMetadata> } => {
    const includeOutputSchema = options?.outputSchemas !== false;
    const tools: Record<string, Tool> = {};
    const toolsMetadata: Record<string, ToolMetadata> = {};

    for (const [name, entry] of Object.entries(toolEntries)) {
        tools[name] = toAiTool(entry, state, includeOutputSchema);
        toolsMetadata[name] = toMetadata(name, entry);
    }

    // Rebind help tool with resolved metadata
    if (tools.help) {
        tools.help = createHelpTool(() => toolsMetadata);
    }

    if (Object.keys(tools).length === 0) {
        throw new Error('MapAgent requires at least one tool.');
    }

    return { tools, toolsMetadata };
};
