import type { Tool } from 'ai';
import type { z } from 'zod';
import { createHelpTool } from './tools/utilities';
import type {
    EntryDataKind,
    OnToolExecute,
    ToolBuildOptions,
    ToolDefinition,
    ToolEntry,
    ToolMetadata,
    ToolState,
} from './types';

const errorFromOutput = (output: unknown): string | undefined => {
    const error = (output as { error?: unknown } | undefined)?.error;
    return typeof error === 'string' ? error : undefined;
};

/**
 * Converts a ToolEntry to an AI SDK Tool, binding state to execute. When
 * `onToolExecute` is supplied, the executor is wrapped to report wall-clock
 * duration and failure (thrown, or the standardized `{ error }` return) after
 * each call. Without it, the plain executor is used (zero overhead).
 */
const toAiTool = <S extends ToolState>(
    name: string,
    entry: ToolEntry<S>,
    state: S,
    includeOutputSchema: boolean,
    onToolExecute?: OnToolExecute,
): Tool =>
    ({
        description: entry.description,
        inputSchema: entry.inputSchema,
        outputSchema: includeOutputSchema ? entry.outputSchema : undefined,
        execute: onToolExecute
            ? async (input: any) => {
                  const start = Date.now();
                  try {
                      const output = await entry.execute(input, state);
                      const errorMessage = errorFromOutput(output);
                      onToolExecute({
                          toolName: name,
                          durationMs: Date.now() - start,
                          isError: errorMessage !== undefined,
                          errorMessage,
                      });
                      return output;
                  } catch (error) {
                      onToolExecute({
                          toolName: name,
                          durationMs: Date.now() - start,
                          isError: true,
                          errorMessage: error instanceof Error ? error.message : String(error),
                      });
                      throw error;
                  }
              }
            : (input: any) => entry.execute(input, state),
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
    alwaysActive: entry.alwaysActive,
    endsTurnOnCall: entry.endsTurnOnCall,
    scopePrompt: entry.scopePrompt,
});

// Materializes a builder entry with the given build options, or returns a static entry as-is.
const materializeEntry = <S extends ToolState>(
    entry: ToolDefinition<S>,
    buildOptions: ToolBuildOptions,
): ToolEntry<S> => (typeof entry === 'function' ? entry(buildOptions) : entry);

/**
 * Registry entry for a scopable tool — captured at setup time so {@link prepareStep}
 * can rebuild the tool's description + inputSchema per turn from the classifier's
 * `toolScopes` output.
 *
 * @ignore
 */
export type ScopableToolInfo = {
    /**
     * Validate `rawScope` against the tool's scopeSchema and re-invoke its builder.
     * Returns `null` when either the parse or the rebuild fails (fail-open — callers
     * leave the default surface in place rather than crashing the step). The original
     * builder, scope schema, and any other build options are captured in the closure
     * so callers stay decoupled from the underlying validation/build mechanics.
     */
    applyScope: (rawScope: unknown) => { description: string; inputSchema: z.ZodType } | null;
    /** Default (full-surface) values, used to restore between turns. */
    defaultDescription: string;
    defaultInputSchema: z.ZodType;
};

/**
 * Converts a composed tool record into AI SDK tools and metadata.
 *
 * Each input value may be a {@link ToolEntry} or a {@link ToolEntryBuilder};
 * builders are materialized with {@link ToolBuildOptions} built from
 * `featureFlags` (and any future build-time config) so each tool can decide
 * how its description, schema, or executor are shaped per agent instance.
 *
 * When a builder produces a {@link ToolEntry} carrying a `scopeSchema`, the
 * builder reference is retained in `scopableTools` so {@link prepareStep} can
 * re-invoke it with a per-turn scope and mutate the live tool object.
 *
 * Rebinds the help tool with resolved metadata.
 *
 * @ignore
 */
export const setupTools = <S extends ToolState>(
    toolEntries: Record<string, ToolDefinition<S>>,
    state: S,
    options?: {
        outputSchemas?: boolean;
        featureFlags?: ToolBuildOptions['featureFlags'];
        enabledDataKinds?: readonly EntryDataKind[];
        onToolExecute?: OnToolExecute;
    },
): {
    tools: Record<string, Tool>;
    toolsMetadata: Record<string, ToolMetadata>;
    scopableTools: Record<string, ScopableToolInfo>;
} => {
    const includeOutputSchema = options?.outputSchemas !== false;
    const buildOptions: ToolBuildOptions = {
        featureFlags: options?.featureFlags,
        enabledDataKinds: options?.enabledDataKinds,
    };
    const tools: Record<string, Tool> = {};
    const toolsMetadata: Record<string, ToolMetadata> = {};
    const scopableTools: Record<string, ScopableToolInfo> = {};

    for (const [name, entryOrBuilder] of Object.entries(toolEntries)) {
        const entry = materializeEntry(entryOrBuilder, buildOptions);
        tools[name] = toAiTool(name, entry, state, includeOutputSchema, options?.onToolExecute);
        toolsMetadata[name] = toMetadata(name, entry);

        // Builder + scopeSchema is the precondition for per-turn rebuilding. A static
        // ToolEntry with a scopeSchema isn't rebuildable because there's no factory to
        // re-invoke; we silently treat it as a non-scopable tool to keep the contract simple.
        if (typeof entryOrBuilder === 'function' && entry.scopeSchema) {
            const builder = entryOrBuilder;
            const scopeSchema = entry.scopeSchema;
            scopableTools[name] = {
                applyScope: (rawScope) => {
                    const parsed = scopeSchema.safeParse(rawScope);
                    if (!parsed.success) return null;
                    try {
                        const rebuilt = builder({ ...buildOptions, scope: parsed.data });
                        return { description: rebuilt.description, inputSchema: rebuilt.inputSchema };
                    } catch {
                        return null;
                    }
                },
                defaultDescription: entry.description,
                defaultInputSchema: entry.inputSchema,
            };
        }
    }

    // Rebind help tool with resolved metadata
    if (tools.help) {
        tools.help = createHelpTool(() => toolsMetadata);
    }

    if (Object.keys(tools).length === 0) {
        throw new Error('MapAgent requires at least one tool.');
    }

    return { tools, toolsMetadata, scopableTools };
};
