/**
 * @module map-agent-tools
 */

import { type Tool, tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';
import {
    getToolsByCategory,
    searchToolsInRegistry,
    TOOL_CATEGORIES,
    type ToolCategory,
    type ToolMetadata,
} from '../tool-registry';

/**
 * Tool schema for searching tools.
 */
export const searchToolsSchema = z.object({
    query: z
        .string()
        .optional()
        .describe('Search query to find tools by name, description, or tags (e.g., "route", "traffic", "display")'),
    category: z
        .enum(['location-services', 'map-display', 'map-appearance', 'advanced', 'utilities', 'all'] as const)
        .optional()
        .describe('Filter by category: location-services, map-display, map-appearance, advanced, utilities, or all'),
});

/**
 * Format tool metadata for display.
 */
function formatToolSummary(tool: ToolMetadata): string {
    const params = tool.parameters
        .map((p) => {
            const optional = p.required ? '' : '?';
            return `${p.name}${optional}: ${p.type}`;
        })
        .join(', ');

    const signature = `${tool.name}(${params})`;
    const example = tool.examples.length > 0 ? `\n  Example: ${tool.examples[0]}` : '';
    const related =
        tool.relatedTools && tool.relatedTools.length > 0 ? `\n  Related: ${tool.relatedTools.join(', ')}` : '';

    return `• ${signature}\n  ${tool.shortDescription}${example}${related}`;
}

/**
 * Create the search tools meta-tool.
 *
 * This tool allows the AI to discover available tools dynamically.
 */
export function createSearchToolsTool(_context: ToolContext): Tool {
    return tool({
        description:
            'Search and discover available tools. Use this when you need to find the right tool for a task or want to know what capabilities are available. You can search by keywords or filter by category.',
        inputSchema: searchToolsSchema,
        execute: async (params) => {
            const { query, category } = params;

            try {
                let tools: ToolMetadata[];

                if (query) {
                    // Search by query
                    tools = searchToolsInRegistry(query);

                    if (tools.length === 0) {
                        return {
                            message: `No tools found matching "${query}". Try a different search term or use category filtering.`,
                            availableCategories: [
                                'location-services',
                                'map-display',
                                'map-appearance',
                                'advanced',
                                'utilities',
                            ],
                        };
                    }

                    // Filter by category if specified
                    if (category && category !== 'all') {
                        tools = tools.filter((t) => t.category === category);
                    }
                } else if (category && category !== 'all') {
                    // Get by category
                    tools = getToolsByCategory(category);
                } else {
                    // Return category overview
                    const categories: Record<string, { description: string; tools: string[] }> = {};

                    for (const [categoryKey, categoryInfo] of Object.entries(TOOL_CATEGORIES)) {
                        const category = categoryKey as ToolCategory;
                        // Skip 'meta' category in the overview (it's just searchTools itself)
                        if (category === 'meta') continue;

                        categories[category] = {
                            description: categoryInfo.description,
                            tools: getToolsByCategory(category).map((t) => t.name),
                        };
                    }

                    return {
                        message: 'Available tool categories:',
                        categories,
                        hint: 'Use searchTools with a query or category to see detailed tool information',
                    };
                }

                // Format results
                const formattedTools = tools.map(formatToolSummary).join('\n\n');

                return {
                    count: tools.length,
                    ...(query && { query }),
                    ...(category && category !== 'all' && { category }),
                    tools: formattedTools,
                };
            } catch (error) {
                return {
                    error: `Tool search failed: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
