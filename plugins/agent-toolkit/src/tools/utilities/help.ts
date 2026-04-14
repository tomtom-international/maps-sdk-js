/**
 * @module agent-toolkit-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolMetadata } from '../../types';
import { toolErrorSchema } from '../shared-output-schemas';
import { TOOL_TAGS, type ToolTag } from '../tool-tags';

const detailToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    examplePrompts: z.array(z.string()),
    relatedTools: z.array(z.string()).optional(),
});

export const helpOutputSchema = z.union([
    z.object({
        mode: z.literal('summary'),
        examplePrompts: z.array(z.string()),
    }),
    z.object({
        mode: z.literal('detail'),
        query: z.string().optional(),
        tag: z.enum(TOOL_TAGS).optional(),
        matchedTools: z.array(detailToolSchema),
        totalMatched: z.number(),
    }),
    toolErrorSchema,
]);

export const helpSchema = z.object({
    mode: z
        .enum(['summary', 'detail'])
        .describe(
            '"summary": overview of all capabilities with example prompts mixed from all tools. ' +
                '"detail": searchable full tool info — use when you need to find a specific tool.',
        ),
    query: z
        .string()
        .optional()
        .describe('Detail mode only. Case-insensitive keyword search across tool names, descriptions, and tags.'),
    tag: z.enum(TOOL_TAGS).optional().describe('Detail mode only. Filter results to tools with a specific tag.'),
});

export const helpDescription =
    'Discover what this agent can do. Returns all capability example prompts mixed together (summary mode) ' +
    'or searchable per-tool details with descriptions and examples (detail mode). ' +
    'Call this when the user asks what you can do, or when you need to find the right tool for a task.';

/**
 * Create the help tool.
 *
 * @param getToolsMetadata - Lazy getter for resolved tool metadata.
 *   Called at execution time, not at creation time, so metadata can be
 *   populated after all tools are set up.
 */
export function createHelpTool(getToolsMetadata: () => Record<string, ToolMetadata>): Tool {
    return tool({
        description: helpDescription,
        inputSchema: helpSchema,
        outputSchema: helpOutputSchema,
        execute: async (params): Promise<z.infer<typeof helpOutputSchema>> => {
            const { mode, query, tag } = params;

            try {
                const allTools = Object.values(getToolsMetadata());

                if (mode === 'summary') {
                    const examplePrompts = allTools.flatMap((toolMetadata) => toolMetadata.examplePrompts ?? []);
                    return { mode: 'summary', examplePrompts };
                }

                // detail mode
                let tools = allTools;

                if (tag) {
                    tools = tools.filter(
                        (toolMetadata) => (toolMetadata.tags as readonly ToolTag[] | undefined)?.includes(tag) ?? false,
                    );
                }

                if (query) {
                    const lowerQuery = query.toLowerCase();
                    tools = tools.filter(
                        (toolMetadata) =>
                            toolMetadata.name.toLowerCase().includes(lowerQuery) ||
                            toolMetadata.description.toLowerCase().includes(lowerQuery) ||
                            (toolMetadata.tags ?? []).some((toolTag) => toolTag.toLowerCase().includes(lowerQuery)) ||
                            (toolMetadata.examplePrompts ?? []).some((prompt) =>
                                prompt.toLowerCase().includes(lowerQuery),
                            ),
                    );
                }

                return {
                    mode: 'detail',
                    query,
                    tag,
                    matchedTools: tools.map((toolMetadata) => ({
                        name: toolMetadata.name,
                        description: toolMetadata.description,
                        examplePrompts: toolMetadata.examplePrompts ?? [],
                        relatedTools: toolMetadata.relatedTools ?? [],
                    })),
                    totalMatched: tools.length,
                };
            } catch (error) {
                return {
                    error: `Failed to load help: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
