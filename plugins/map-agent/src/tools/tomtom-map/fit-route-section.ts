/**
 * @module map-agent-tools
 */

import {
    getSectionBBox,
    type Route,
    type SectionProps,
    type SectionType,
    sectionTypes,
} from '@tomtom-org/maps-sdk/core';
import { dynamicTool, type Tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from '../../types';

/**
 * Tool schema for fitting route section bounds.
 */
export const fitRouteSectionSchema = z.object({
    sectionType: z
        .enum(sectionTypes as [SectionType, ...SectionType[]])
        .describe('The type of route section (e.g., "country", "traffic", "motorway", "toll")'),
    id: z.string().describe('The unique identifier of the section to fit to'),
    padding: z.number().optional().describe('Padding in pixels around the section (default: 50)'),
});

/**
 * Create the fit route section tool.
 */
export function createFitRouteSectionTool(context: ToolContext): Tool {
    return dynamicTool({
        description:
            'Fit the map camera to show a specific section of a displayed route. Provide the section type (e.g., "country", "traffic", "motorway") and the section ID. The section must belong to a route currently shown on the map.',
        inputSchema: fitRouteSectionSchema,
        execute: async (params) => {
            const { sectionType, id, padding = 50 } = params as z.infer<typeof fitRouteSectionSchema>;

            try {
                // Get the currently shown routes from the map
                if (!context.map.modules.routing) {
                    return {
                        error: 'No routing module initialized - no routes shown on map',
                    };
                }

                const shown = context.map.modules.routing.getShown();

                if (!shown.mainLines || shown.mainLines.features.length === 0) {
                    return {
                        error: 'No routes are currently displayed on the map. Please show a route first before fitting to a section.',
                    };
                }

                const shownRoutes = shown.mainLines.features;

                // Find the section in the shown routes
                let targetRoute: Route | undefined;
                let targetSection: { id: string; startPointIndex: number; endPointIndex: number } | undefined;

                for (const route of shownRoutes) {
                    const sections = route.properties.sections[sectionType as SectionType];
                    if (sections && Array.isArray(sections)) {
                        const foundSection = sections.find((s) => s.id === id);
                        if (
                            foundSection &&
                            typeof foundSection.startPointIndex === 'number' &&
                            typeof foundSection.endPointIndex === 'number'
                        ) {
                            targetSection = foundSection as {
                                id: string;
                                startPointIndex: number;
                                endPointIndex: number;
                            };
                            targetRoute = route;
                            break;
                        }
                    }
                }

                if (!targetRoute || !targetSection) {
                    return {
                        error: `Could not find a section with type "${sectionType}" and id "${id}" in any displayed route. Check the section type and id are correct.`,
                    };
                }

                // Calculate the bbox for the section
                const bbox = getSectionBBox(targetRoute, targetSection as SectionProps);

                if (!bbox) {
                    return {
                        error: 'Could not calculate bounding box for the section. The section may have invalid indices.',
                    };
                }

                // Fit the map to the section bbox
                context.map.mapLibreMap.fitBounds(bbox, { padding });

                return {
                    success: true,
                    bbox,
                    sectionType,
                    sectionId: id,
                    startPointIndex: targetSection.startPointIndex,
                    endPointIndex: targetSection.endPointIndex,
                };
            } catch (error) {
                return {
                    error: `Failed to fit route section: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        },
    });
}
