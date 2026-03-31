import type { Tool } from 'ai';
import { createMapToolSet, TOOL_REGISTRY } from './tools';
import type { MapAgentOptions, MapAgentTool, ToolMetadata, ToolRegistryEntry, ToolState } from './types';

/** Checks if the entry is a full tool (has inputSchema + execute) vs metadata-only or false. */
function isMapAgentTool(entry: ToolRegistryEntry): entry is MapAgentTool {
    return entry !== false && 'inputSchema' in entry && 'execute' in entry;
}

/** Converts a MapAgentTool to an AI SDK Tool. */
function toAiTool(customTool: MapAgentTool): Tool {
    return {
        description: customTool.description,
        inputSchema: customTool.inputSchema,
        outputSchema: customTool.outputSchema,
        execute: customTool.execute,
    } as Tool;
}

/** Copies a built-in tool's metadata, stripping the `create` factory. */
function cloneBuiltInMetadata(name: string, entry: (typeof TOOL_REGISTRY)[keyof typeof TOOL_REGISTRY]): ToolMetadata {
    const { create, ...rest } = entry;

    return structuredClone({ ...rest, name }) as ToolMetadata;
}

/** Extracts metadata fields, stripping `name` (derived from key) and execution properties. */
function extractMetadata(entry: ToolRegistryEntry): Partial<ToolMetadata> {
    if (entry === false) return {};

    const { name, inputSchema, outputSchema, execute, ...metadata } = entry as Record<string, unknown>;

    return metadata as Partial<ToolMetadata>;
}

/** Resolves tool instances and metadata from built-ins + user overrides. */
function resolveToolsAndMetadata(
    state: ToolState,
    options: MapAgentOptions,
): { tools: Record<string, Tool>; toolsMetadata: Record<string, ToolMetadata> } {
    const defaultToolSet = createMapToolSet(state);
    const tools: Record<string, Tool> = {};
    const toolsMetadata: Record<string, ToolMetadata> = {};

    // Start with defaults unless disabled
    if (options.includeDefaultTools ?? true) {
        for (const [name, tool] of Object.entries(defaultToolSet)) {
            tools[name] = tool;
            toolsMetadata[name] = cloneBuiltInMetadata(name, TOOL_REGISTRY[name as keyof typeof TOOL_REGISTRY]);
        }
    }

    // Apply tools configuration (exclude, override/add, tweak metadata)
    const toolOverrides = options.tools ?? {};
    for (const name of Object.keys(toolOverrides)) {
        const override = toolOverrides[name];

        if (override === false) {
            delete tools[name];
            delete toolsMetadata[name];
            continue;
        }

        if (isMapAgentTool(override)) {
            // MapAgentTool — convert to AI SDK Tool and merge metadata
            tools[name] = toAiTool(override);
            const base = toolsMetadata[name] ?? { name, description: override.description ?? '' };
            toolsMetadata[name] = { ...base, ...extractMetadata(override) };
        } else if (toolsMetadata[name]) {
            // Metadata-only override
            toolsMetadata[name] = { ...toolsMetadata[name], ...extractMetadata(override) };
        }
    }

    return { tools, toolsMetadata };
}

/** Validates the resolved tool set and ensures every tool has metadata. */
function validateTools(tools: Record<string, Tool>, toolsMetadata: Record<string, ToolMetadata>): void {
    if (Object.keys(tools).length === 0) {
        throw new Error('MapAgent requires at least one tool.');
    }

    for (const name of Object.keys(tools)) {
        const metadata = toolsMetadata[name];
        if (!metadata.classificationPrompt && !metadata.relatedTools?.length && !metadata.dependsOn?.length) {
            console.warn(
                `Tool '${name}' has no classificationPrompt, relatedTools, or dependsOn — the classifier will only see its name, potentially reducing its effectiveness.`,
            );
        }
    }
}

/** Builds the tools set and metadata from the unified tools option. */
export function setupTools(
    state: ToolState,
    options: MapAgentOptions,
): { tools: Record<string, Tool>; toolsMetadata: Record<string, ToolMetadata> } {
    const { tools, toolsMetadata } = resolveToolsAndMetadata(state, options);

    validateTools(tools, toolsMetadata);

    return { tools, toolsMetadata };
}
