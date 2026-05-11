import type { Tool } from 'ai';
import { createHelpTool } from './tools/utilities';
import type { ToolBuildOptions, ToolDefinition, ToolEntry, ToolMetadata, ToolState } from './types';

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

// Materializes a builder entry with the given build options, or returns a static entry as-is.
const materializeEntry = <S extends ToolState>(
    entry: ToolDefinition<S>,
    buildOptions: ToolBuildOptions,
): ToolEntry<S> => (typeof entry === 'function' ? entry(buildOptions) : entry);

/**
 * Converts a composed tool record into AI SDK tools and metadata.
 *
 * Each input value may be a {@link ToolEntry} or a {@link ToolEntryBuilder};
 * builders are materialized with {@link ToolBuildOptions} built from
 * `featureFlags` (and any future build-time config) so each tool can decide
 * how its description, schema, or executor are shaped per agent instance.
 *
 * Rebinds the help tool with resolved metadata.
 *
 * @ignore
 */
export const setupTools = <S extends ToolState>(
    toolEntries: Record<string, ToolDefinition<S>>,
    state: S,
    options?: { outputSchemas?: boolean; featureFlags?: ToolBuildOptions['featureFlags'] },
): { tools: Record<string, Tool>; toolsMetadata: Record<string, ToolMetadata> } => {
    const includeOutputSchema = options?.outputSchemas !== false;
    const buildOptions: ToolBuildOptions = { featureFlags: options?.featureFlags };
    const tools: Record<string, Tool> = {};
    const toolsMetadata: Record<string, ToolMetadata> = {};

    for (const [name, entryOrBuilder] of Object.entries(toolEntries)) {
        const entry = materializeEntry(entryOrBuilder, buildOptions);
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
